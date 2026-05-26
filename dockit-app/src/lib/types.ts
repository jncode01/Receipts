// Database row shapes — keep in sync with supabase/schema.sql

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  budget: number | null;
  archived: boolean;
  created_at: string;
};

export type OcrStatus = 'pending' | 'ok' | 'failed' | 'skipped';

export type Receipt = {
  id: string;
  user_id: string;
  category_id: string | null;
  project_id: string | null;
  date: string;            // YYYY-MM-DD
  merchant: string;
  location: string | null;
  total: number;
  gst: number | null;
  items: number | null;
  tags: string[];
  note: string | null;
  image_path: string | null;
  ocr_provider: string | null;
  ocr_raw: any;
  ocr_status: OcrStatus;
  created_at: string;
  updated_at: string;
};

// What the parse-receipt edge function returns
export type OcrFields = {
  merchant: string | null;
  date: string | null;
  total: number | null;
  gst: number | null;
  location: string | null;
  items: number | null;
  currency: string;
};
