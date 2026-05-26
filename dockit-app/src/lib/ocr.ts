import { supabase } from './supabase';
import type { OcrFields } from './types';

// Call the parse-receipt edge function. The image must already be uploaded
// to the receipt-images bucket under <user_id>/...
export async function parseReceipt(imagePath: string): Promise<OcrFields | null> {
  const { data, error } = await supabase.functions.invoke('parse-receipt', {
    body: { imagePath },
  });
  if (error) {
    console.warn('[dockit] OCR call failed', error);
    return null;
  }
  if (!data?.ok) return null;
  return data.fields as OcrFields;
}
