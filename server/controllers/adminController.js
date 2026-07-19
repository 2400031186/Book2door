import { supabase } from '../config/supabase.js';
import { getPricingSettings, invalidateSettingsCache } from '../utils/pricing.js';
import { getUploadBuffer } from '../utils/uploadFile.js';

export async function getDashboard(req, res) {
  try {
    const statuses = ['pending_payment', 'payment_review', 'received', 'printing', 'packing', 'out_for_delivery', 'delivered'];
    const counts = {};

    for (const status of statuses) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      counts[status] = count || 0;
    }

    const { count: pendingPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: totalBooks } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });

    res.json({ orderCounts: counts, pendingPayments: pendingPayments || 0, totalBooks: totalBooks || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminOrders(req, res) {
  try {
    const { status } = req.query;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status, note } = req.body;
    const validStatuses = ['received', 'printing', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status,
      note: note || `Status updated to ${status}`,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteOrder(req, res) {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBook(req, res) {
  try {
    const { title, subject, branch, semester, price, is_active } = req.body;
    let cover_image_url = null;

    if (req.file) {
      const filePath = `covers/${Date.now()}-${req.file.originalname}`;
      const buffer = await getUploadBuffer(req.file);
      const { error: uploadError } = await supabase.storage
        .from('book_images')
        .upload(filePath, buffer, { contentType: req.file.mimetype });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('book_images').getPublicUrl(filePath);
      cover_image_url = urlData?.publicUrl || filePath;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        title,
        subject,
        branch,
        semester,
        price: parseFloat(price),
        cover_image_url,
        is_active: is_active !== 'false' && is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBook(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.price) updates.price = parseFloat(updates.price);

    if (req.file) {
      const filePath = `covers/${Date.now()}-${req.file.originalname}`;
      const buffer = await getUploadBuffer(req.file);
      await supabase.storage.from('book_images').upload(filePath, buffer, { contentType: req.file.mimetype });
      const { data: urlData } = supabase.storage.from('book_images').getPublicUrl(filePath);
      updates.cover_image_url = urlData?.publicUrl || filePath;
    }

    delete updates.cover;

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteBook(req, res) {
  try {
    const { error } = await supabase.from('books').update({ is_active: false }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminPayments(req, res) {
  try {
    const { status } = req.query;
    let query = supabase
      .from('payments')
      .select('*, orders(order_number, customer_name, phone, grand_total)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const enriched = await Promise.all(
      data.map(async (payment) => {
        if (!payment.screenshot_url) return payment;
        const { data: signed } = await supabase.storage
          .from('payment_screenshots')
          .createSignedUrl(payment.screenshot_url, 3600);
        return { ...payment, screenshot_signed_url: signed?.signedUrl };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePaymentStatus(req, res) {
  try {
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ status, admin_note: admin_note || null })
      .eq('id', req.params.id)
      .select('*, orders(*)')
      .single();

    if (error) throw error;

    if (status === 'approved') {
      await supabase.from('orders').update({ status: 'received' }).eq('id', payment.order_id);
      await supabase.from('order_status_history').insert({
        order_id: payment.order_id,
        status: 'received',
        note: 'Payment approved by admin',
      });
    } else {
      await supabase.from('orders').update({ status: 'pending_payment' }).eq('id', payment.order_id);
      await supabase.from('order_status_history').insert({
        order_id: payment.order_id,
        status: 'pending_payment',
        note: admin_note || 'Payment rejected, please resubmit',
      });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminSettings(req, res) {
  try {
    const settings = await getPricingSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAdminSettings(req, res) {
  try {
    const updates = req.body;
    const current = await getPricingSettings(true);

    const numericFields = [
      'pdf_bw_per_page', 'pdf_color_per_page', 'single_side_multiplier',
      'double_side_multiplier', 'spiral_binding', 'delivery_flat',
      'min_order', 'split_advance_percent',
    ];

    for (const field of numericFields) {
      if (updates[field] !== undefined) {
        current[field] = parseFloat(updates[field]);
      }
    }

    if (updates.upi_id !== undefined) current.upi_id = updates.upi_id;

    if (req.file) {
      const filePath = `qr/${Date.now()}-${req.file.originalname}`;
      const buffer = await getUploadBuffer(req.file);
      await supabase.storage.from('payment_qr').upload(filePath, buffer, { contentType: req.file.mimetype, upsert: true });
      const { data: urlData } = supabase.storage.from('payment_qr').getPublicUrl(filePath);
      current.upi_qr_url = urlData?.publicUrl || filePath;
    } else if (updates.upi_qr_url !== undefined) {
      current.upi_qr_url = updates.upi_qr_url;
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'pricing', value: current, updated_at: new Date().toISOString() });

    if (error) throw error;

    invalidateSettingsCache();
    res.json(current);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function downloadPdf(req, res) {
  try {
    const { data: pdf, error } = await supabase
      .from('pdf_uploads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: signed, error: signError } = await supabase.storage
      .from('pdf_uploads')
      .createSignedUrl(pdf.file_path, 3600);

    if (signError) throw signError;

    res.json({ url: signed.signedUrl, file_name: pdf.file_name });
  } catch (err) {
    res.status(404).json({ error: 'PDF not found' });
  }
}

export async function getAllBooksAdmin(req, res) {
  try {
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function checkAdminRole(req, res) {
  try {
    res.json({ isAdmin: true, userId: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
