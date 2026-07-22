import fs from 'fs/promises';
import { supabase } from '../config/supabase.js';
import { getProfile, upsertProfile } from '../utils/auth.js';
import {
  calculateBookLineTotal,
  calculateBookUnitPrice,
  calculateOrderTotals,
  calculatePaymentSplit,
  generateOrderNumber,
  getPricingSettings,
} from '../utils/pricing.js';

export async function getCheckoutDetails(req, res) {
  try {
    if (!req.user?.id) {
      return res.json(null);
    }

    const profile = await getProfile(req.user.id);
    if (!profile) {
      return res.json(null);
    }

    res.json({
      customer_name: profile.full_name || '',
      college_id: profile.college_id || '',
      phone: profile.phone || '',
      pickup_location: profile.pickup_location || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createOrder(req, res) {
  try {
    const {
      customer_name,
      college_id,
      phone,
      pickup_location,
      order_notes,
      payment_type,
      items,
    } = req.body;

    if (!customer_name || !college_id || !phone || !pickup_location) {
      return res.status(400).json({ error: 'Name, college ID, phone, and pickup location are required' });
    }

    if (!items?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const settings = await getPricingSettings();
    const orderItems = [];

    for (const item of items) {
      if (item.type === 'book') {
        const { data: book, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', item.id)
          .single();

        if (error || !book) throw new Error(`Book not found: ${item.id}`);

        const sideMode = item.sideMode === 'double' ? 'double' : 'single';
        const unitPrice = calculateBookUnitPrice(book, sideMode);
        const lineTotal = calculateBookLineTotal(unitPrice, item.quantity);
        orderItems.push({
          item_type: 'book',
          book_id: book.id,
          pdf_upload_id: null,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          metadata: {
            title: book.title,
            course_code: book.course_code,
            year: book.year,
            semester: book.semester,
            sideMode,
            single_side_amount: parseFloat(book.price),
            double_side_amount: parseFloat(book.price_double),
          },
        });
      } else if (item.type === 'pdf') {
        const { data: pdf, error } = await supabase
          .from('pdf_uploads')
          .select('*')
          .eq('id', item.id)
          .single();

        if (error || !pdf) throw new Error(`PDF upload not found: ${item.id}`);

        orderItems.push({
          item_type: 'pdf',
          book_id: null,
          pdf_upload_id: pdf.id,
          quantity: item.quantity || 1,
          unit_price: parseFloat(pdf.calculated_price),
          line_total: parseFloat(pdf.calculated_price) * (item.quantity || 1),
          metadata: { file_name: pdf.file_name, print_options: pdf.print_options },
        });
      }
    }

    const payType = payment_type === 'split' ? 'split' : 'full';
    const { subtotal, deliveryCharge, grandTotal } = calculateOrderTotals(
      orderItems,
      settings,
      payType
    );

    if (grandTotal < settings.min_order) {
      return res.status(400).json({
        error: `Minimum order amount is ₹${settings.min_order}`,
      });
    }

    const { advanceAmount, codAmount } = calculatePaymentSplit(grandTotal, payType, settings);
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: req.user?.id || null,
        customer_name,
        college_id,
        phone,
        pickup_location,
        address: null,
        city: null,
        pincode: null,
        order_notes: order_notes || null,
        subtotal,
        delivery_charge: deliveryCharge,
        grand_total: grandTotal,
        payment_type: payType,
        advance_amount: advanceAmount,
        cod_amount: codAmount,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    if (req.user?.id) {
      await supabase
        .from('orders')
        .update({ user_id: req.user.id })
        .eq('phone', phone)
        .is('user_id', null);
    }

    const itemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      item_type: item.item_type,
      book_id: item.book_id,
      pdf_upload_id: item.pdf_upload_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      metadata: item.metadata || {},
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    if (req.user?.id) {
      await upsertProfile(req.user, {
        full_name: customer_name,
        email: req.user.email,
        college_id,
        phone,
        pickup_location,
      });
    }

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending_payment',
      note: 'Order created, awaiting payment',
    });

    const settings2 = await getPricingSettings();

    res.status(201).json({
      order,
      payment: {
        advance_amount: advanceAmount,
        cod_amount: codAmount,
        amount_due_now: payType === 'full' ? grandTotal : advanceAmount,
      },
      upi_id: settings2.upi_id,
      upi_qr_url: settings2.upi_qr_url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOrderById(req, res) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: items } = await supabase
      .from('order_items')
      .select('*, books(title, course_code), pdf_uploads(file_name, print_options)')
      .eq('order_id', order.id);

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    const { data: history } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    res.json({ order, items, payments, history });
  } catch (err) {
    res.status(404).json({ error: 'Order not found' });
  }
}

export async function getMyOrders(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const profile = await getProfile(req.user.id);
    let orders = [];

    const { data: linkedOrders, error: linkedError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (linkedError) throw linkedError;
    orders = linkedOrders || [];

    if (profile?.phone) {
      const { data: phoneOrders, error: phoneError } = await supabase
        .from('orders')
        .select('*')
        .is('user_id', null)
        .eq('phone', profile.phone)
        .order('created_at', { ascending: false });

      if (phoneError) throw phoneError;

      const seen = new Set(orders.map((o) => o.id));
      for (const order of phoneOrders || []) {
        if (!seen.has(order.id)) {
          orders.push(order);
          seen.add(order.id);
        }
      }

      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (!orders.length) {
      return res.json([]);
    }

    const results = await Promise.all(
      orders.map(async (order) => {
        const { data: history } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });

        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false });

        return { order, history, payments };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function trackOrder(req, res) {
  try {
    const query = req.params.query.trim();
    const isPhone = /^\d{10}$/.test(query);

    let dbQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (isPhone) {
      dbQuery = dbQuery.eq('phone', query);
    } else {
      dbQuery = dbQuery.eq('order_number', query.toUpperCase());
    }

    const { data: orders, error } = await dbQuery;
    if (error) throw error;

    if (!orders?.length) {
      return res.status(404).json({ error: 'No orders found' });
    }

    const results = await Promise.all(
      orders.map(async (order) => {
        const { data: history } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });

        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false });

        return { order, history, payments };
      })
    );

    res.json(isPhone ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
