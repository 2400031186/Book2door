import { supabase } from '../config/supabase.js';
import { getPdfPageCountFromBuffer } from '../utils/pdf.js';
import { calculatePdfPrice, getPricingSettings } from '../utils/pricing.js';
import { getUploadBuffer } from '../utils/uploadFile.js';

export async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'PDF file was not received. Please try again or use a different browser.',
      });
    }

    const printOptions = {
      colorMode: req.body.colorMode || 'bw',
      sideMode: req.body.sideMode || 'single',
      copies: parseInt(req.body.copies, 10) || 1,
      spiralBinding: req.body.spiralBinding === 'true' || req.body.spiralBinding === true,
      notes: req.body.notes || '',
    };

    const fileBuffer = await getUploadBuffer(req.file);
    const pageCount = await getPdfPageCountFromBuffer(fileBuffer);
    const settings = await getPricingSettings();
    const calculatedPrice = calculatePdfPrice(pageCount, printOptions, settings);

    const filePath = `${Date.now()}-${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('pdf_uploads')
      .upload(filePath, fileBuffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('pdf_uploads')
      .insert({
        user_id: req.user?.id || null,
        file_path: filePath,
        file_name: req.file.originalname,
        page_count: pageCount,
        print_options: printOptions,
        calculated_price: calculatedPrice,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...data,
      price_breakdown: {
        page_count: pageCount,
        print_options: printOptions,
        calculated_price: calculatedPrice,
      },
    });
  } catch (err) {
    const message = err.message || 'Upload failed';
    if (
      message.includes('File too large') ||
      message.includes('LIMIT_FILE_SIZE')
    ) {
      return res.status(400).json({
        error: 'PDF must be under 4.5MB for upload. Please compress the file and try again.',
      });
    }
    if (
      message.includes('Compact JWS') ||
      message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
      message.includes('invalid')
    ) {
      return res.status(500).json({
        error:
          'Supabase is not connected. Add your real service_role key in server/.env (Supabase Dashboard → Settings → API), then restart the server.',
      });
    }

    if (message.includes('Bucket not found') || message.includes('pdf_uploads')) {
      return res.status(500).json({
        error: 'Storage bucket missing. Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor.',
      });
    }

    res.status(500).json({ error: message });
  }
}

export async function quotePdfPrice(req, res) {
  try {
    const { pageCount, printOptions } = req.body;
    if (!pageCount) return res.status(400).json({ error: 'pageCount is required' });

    const settings = await getPricingSettings();
    const price = calculatePdfPrice(pageCount, printOptions || {}, settings);

    res.json({ calculated_price: price, page_count: pageCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
