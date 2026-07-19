import { supabase } from '../config/supabase.js';
import { getUploadBuffer } from '../utils/uploadFile.js';

export async function submitPayment(req, res) {
  try {
    const { order_id, payment_confirmed } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (payment_confirmed !== 'true' && payment_confirmed !== true) {
      return res.status(400).json({ error: 'Please confirm payment completion' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Payment already submitted for this order' });
    }

    const filePath = `${order.order_number}-${Date.now()}${req.file.originalname.slice(req.file.originalname.lastIndexOf('.'))}`;
    const fileBuffer = await getUploadBuffer(req.file);

    const { error: uploadError } = await supabase.storage
      .from('payment_screenshots')
      .upload(filePath, fileBuffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const amountDue = order.payment_type === 'split' ? order.advance_amount : order.grand_total;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: amountDue,
        payment_type: order.payment_type,
        screenshot_url: filePath,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    await supabase.from('orders').update({ status: 'payment_review' }).eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'payment_review',
      note: 'Payment screenshot submitted, awaiting admin approval',
    });

    res.status(201).json({ payment, order_status: 'payment_review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPaymentById(req, res) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, orders(order_number, customer_name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Payment not found' });
  }
}
