import { supabase } from '../config/supabase.js';
import { getPricingSettings, invalidateSettingsCache } from '../utils/pricing.js';
import { getUploadBuffer } from '../utils/uploadFile.js';

export async function getDashboard(req, res) {
  try {
    const statuses = [
      'pending_payment', 'payment_review', 'received', 'printing',
      'packing', 'out_for_delivery', 'delivered', 'cancelled',
    ];
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
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: partialOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_type', 'split')
      .gt('cod_amount', 0)
      .not('status', 'in', '("pending_payment","payment_review","cancelled")');

    const { count: receivedPartial } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_type', 'split')
      .eq('status', 'received')
      .gt('cod_amount', 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const { data: todayOrdersData } = await supabase
      .from('orders')
      .select('grand_total')
      .gte('created_at', todayStart.toISOString())
      .not('status', 'eq', 'cancelled');

    const todayRevenue = (todayOrdersData || []).reduce(
      (sum, o) => sum + Number(o.grand_total || 0),
      0
    );

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, phone, grand_total, status, payment_type, cod_amount, created_at, pickup_location')
      .order('created_at', { ascending: false })
      .limit(8);

    const inProgress =
      (counts.printing || 0) +
      (counts.packing || 0) +
      (counts.out_for_delivery || 0);

    res.json({
      orderCounts: counts,
      pendingPayments: pendingPayments || 0,
      totalBooks: totalBooks || 0,
      partialOrders: partialOrders || 0,
      receivedPartial: receivedPartial || 0,
      todayOrders: todayOrders || 0,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      inProgress,
      recentOrders: recentOrders || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminOrders(req, res) {
  try {
    const { status } = req.query;
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          books (id, course_code, title, year, semester, pdf_path, pdf_file_name),
          pdf_uploads (id, file_name, page_count, print_options)
        ),
        payments (*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'received_partial') {
        query = query
          .eq('payment_type', 'split')
          .eq('status', 'received')
          .gt('cod_amount', 0);
      } else if (status === 'partial') {
        query = query
          .eq('payment_type', 'split')
          .gt('cod_amount', 0)
          .not('status', 'in', '("pending_payment","payment_review","cancelled")');
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const enriched = await Promise.all(
      (data || []).map(async (order) => {
        const payments = await Promise.all(
          (order.payments || []).map(async (payment) => {
            if (!payment.screenshot_url) return payment;
            const { data: signed } = await supabase.storage
              .from('payment_screenshots')
              .createSignedUrl(payment.screenshot_url, 3600);
            return { ...payment, screenshot_signed_url: signed?.signedUrl };
          })
        );
        payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { ...order, payments };
      })
    );

    res.json(enriched);
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
    const { course_code, title, year, semester, price, is_active } = req.body;

    if (!course_code?.trim()) {
      return res.status(400).json({ error: 'Course code is required' });
    }
    if (!['1', '2', '3', '4'].includes(String(year))) {
      return res.status(400).json({ error: 'Year must be 1, 2, 3, or 4' });
    }
    if (!['1', '2'].includes(String(semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Book PDF is required' });
    }

    let pdf_path = null;
    let pdf_file_name = null;

    if (req.file) {
      pdf_file_name = req.file.originalname;
      pdf_path = `books/${Date.now()}-${req.file.originalname}`;
      const buffer = await getUploadBuffer(req.file);
      const { error: uploadError } = await supabase.storage
        .from('pdf_uploads')
        .upload(pdf_path, buffer, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        course_code: course_code.trim().toUpperCase(),
        title,
        year: String(year),
        semester: String(semester),
        price: parseFloat(price),
        pdf_path,
        pdf_file_name,
        is_active: is_active !== 'false' && is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Course code already exists' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBook(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.course_code) updates.course_code = updates.course_code.trim().toUpperCase();
    if (updates.year && !['1', '2', '3', '4'].includes(String(updates.year))) {
      return res.status(400).json({ error: 'Year must be 1, 2, 3, or 4' });
    }
    if (updates.semester && !['1', '2'].includes(String(updates.semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }
    if (updates.semester) updates.semester = String(updates.semester);
    if (updates.year) updates.year = String(updates.year);

    if (req.file) {
      const pdf_path = `books/${Date.now()}-${req.file.originalname}`;
      const buffer = await getUploadBuffer(req.file);
      await supabase.storage.from('pdf_uploads').upload(pdf_path, buffer, { contentType: 'application/pdf' });
      updates.pdf_path = pdf_path;
      updates.pdf_file_name = req.file.originalname;
    }

    delete updates.pdf;

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Course code already exists' });
      }
      throw error;
    }
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

    if (updates.pickup_locations !== undefined) {
      current.pickup_locations = String(updates.pickup_locations)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

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

export async function downloadBookPdf(req, res) {
  try {
    const { data: book, error } = await supabase
      .from('books')
      .select('pdf_path, pdf_file_name, course_code')
      .eq('id', req.params.id)
      .single();

    if (error || !book?.pdf_path) {
      return res.status(404).json({ error: 'Book PDF not found' });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('pdf_uploads')
      .createSignedUrl(book.pdf_path, 3600);

    if (signError) throw signError;

    res.json({
      url: signed.signedUrl,
      file_name: book.pdf_file_name || `${book.course_code}.pdf`,
    });
  } catch (err) {
    res.status(404).json({ error: 'Book PDF not found' });
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

export async function getOrderBook(req, res) {
  try {
    const { filter = 'to_print', section = 'pending', type = 'all' } = req.query;
    const showCompleted = section === 'completed';
    const includeBooks = type === 'all' || type === 'books';
    const includePdfs = type === 'all' || type === 'pdf';

    let orderQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        phone,
        pickup_location,
        status,
        created_at,
        order_items (
          id,
          quantity,
          item_type,
          book_id,
          pdf_upload_id,
          print_completed,
          print_completed_at,
          books (id, course_code, title, year, semester, pdf_path, pdf_file_name),
          pdf_uploads (id, file_name, page_count, print_options)
        )
      `)
      .order('created_at', { ascending: false });

    if (filter === 'to_print') {
      orderQuery = orderQuery.in('status', ['received', 'printing', 'packing', 'out_for_delivery']);
    } else if (filter === 'active') {
      orderQuery = orderQuery.not('status', 'in', '("cancelled","pending_payment")');
    }

    const { data: orders, error } = await orderQuery;
    if (error) throw error;

    const bookMap = new Map();
    const pdfMap = new Map();

    for (const order of orders || []) {
      for (const item of order.order_items || []) {
        if (Boolean(item.print_completed) !== showCompleted) continue;

        const line = {
          item_id: item.id,
          order_id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          phone: order.phone,
          pickup_location: order.pickup_location,
          status: order.status,
          quantity: Number(item.quantity) || 1,
          print_completed: item.print_completed,
          print_completed_at: item.print_completed_at,
          created_at: order.created_at,
        };

        if (item.item_type === 'book' && includeBooks && item.books) {
          const book = item.books;
          const key = book.id;

          if (!bookMap.has(key)) {
            bookMap.set(key, {
              type: 'book',
              book_id: book.id,
              course_code: book.course_code,
              title: book.title,
              year: book.year,
              semester: book.semester,
              pdf_path: book.pdf_path,
              pdf_file_name: book.pdf_file_name,
              total_quantity: 0,
              order_count: 0,
              lines: [],
            });
          }

          const entry = bookMap.get(key);
          entry.total_quantity += line.quantity;
          entry.order_count += 1;
          entry.lines.push(line);
        } else if (item.item_type === 'pdf' && includePdfs && item.pdf_uploads) {
          const pdf = item.pdf_uploads;
          const key = pdf.id;

          if (!pdfMap.has(key)) {
            pdfMap.set(key, {
              type: 'pdf',
              pdf_id: pdf.id,
              file_name: pdf.file_name,
              page_count: pdf.page_count,
              print_options: pdf.print_options,
              total_quantity: 0,
              order_count: 0,
              lines: [],
            });
          }

          const entry = pdfMap.get(key);
          entry.total_quantity += line.quantity;
          entry.order_count += 1;
          entry.lines.push(line);
        }
      }
    }

    const books = Array.from(bookMap.values()).sort((a, b) => {
      const code = a.course_code.localeCompare(b.course_code);
      if (code !== 0) return code;
      return a.year.localeCompare(b.year) || a.semester.localeCompare(b.semester);
    });

    const pdfOrders = Array.from(pdfMap.values()).sort((a, b) =>
      a.file_name.localeCompare(b.file_name)
    );

    const bookCopies = books.reduce((sum, b) => sum + b.total_quantity, 0);
    const pdfCopies = pdfOrders.reduce((sum, p) => sum + p.total_quantity, 0);
    const bookLines = books.reduce((sum, b) => sum + b.lines.length, 0);
    const pdfLines = pdfOrders.reduce((sum, p) => sum + p.lines.length, 0);

    res.json({
      books: includeBooks ? books : [],
      pdf_orders: includePdfs ? pdfOrders : [],
      section,
      type,
      summary: {
        unique_books: includeBooks ? books.length : 0,
        pdf_uploads: includePdfs ? pdfOrders.length : 0,
        total_copies: (includeBooks ? bookCopies : 0) + (includePdfs ? pdfCopies : 0),
        total_lines: (includeBooks ? bookLines : 0) + (includePdfs ? pdfLines : 0),
        total_orders: (orders || []).length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderBookItemPrint(req, res) {
  try {
    const { completed } = req.body;
    const isComplete = completed === true || completed === 'true';

    const { data: item, error: fetchError } = await supabase
      .from('order_items')
      .select('id, item_type, order_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: 'Order item not found' });
    }
    if (!['book', 'pdf'].includes(item.item_type)) {
      return res.status(400).json({ error: 'Invalid order item type' });
    }

    const { data, error } = await supabase
      .from('order_items')
      .update({
        print_completed: isComplete,
        print_completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
