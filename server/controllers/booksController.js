import { supabase } from '../config/supabase.js';

export async function getBooks(req, res) {
  try {
    const { branch, semester, subject, search } = req.query;

    let query = supabase.from('books').select('*').eq('is_active', true).order('created_at', { ascending: false });

    if (branch) query = query.eq('branch', branch);
    if (semester) query = query.eq('semester', semester);
    if (subject) query = query.ilike('subject', `%${subject}%`);
    if (search) query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookById(req, res) {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Book not found' });
  }
}
