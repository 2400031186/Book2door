import { supabase } from '../config/supabase.js';

export async function getBooks(req, res) {
  try {
    const { year, semester, search, course_code } = req.query;

    let query = supabase.from('books').select('*').eq('is_active', true).order('course_code', { ascending: true });

    if (year) query = query.eq('year', year);
    if (semester) query = query.eq('semester', semester);
    if (course_code) query = query.ilike('course_code', `%${course_code}%`);
    if (search) {
      query = query.or(`title.ilike.%${search}%,course_code.ilike.%${search}%`);
    }

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
