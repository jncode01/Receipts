// supabase/functions/parse-receipt/index.ts
//
// Edge Function that calls Mindee's Expense Receipt API with the uploaded
// image and returns a clean JSON payload the frontend pre-fills the review
// sheet with. Keeps the Mindee API key OFF the client.
//
// DEPLOY: `supabase functions deploy parse-receipt`
// SET SECRET: `supabase secrets set MINDEE_API_KEY=your_token_here`
//
// The frontend calls this with the path of an image already uploaded to
// the receipt-images bucket. We download it through the service role, post
// it to Mindee, and return the parsed fields.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // 1. Verify caller is a signed-in user
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    // 2. Read body
    const { imagePath } = await req.json();
    if (!imagePath) return json({ error: 'imagePath required' }, 400);
    if (!imagePath.startsWith(user.id + '/')) return json({ error: 'forbidden' }, 403);

    // 3. Download the image with the service role (bypasses RLS, but we
    //    just gated the path on user.id above)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const dl = await admin.storage.from('receipt-images').download(imagePath);
    if (dl.error || !dl.data) return json({ error: 'image not found' }, 404);

    // 4. Send to Mindee
    const form = new FormData();
    form.append('document', dl.data, imagePath.split('/').pop());
    const mindee = await fetch('https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict', {
      method: 'POST',
      headers: { Authorization: 'Token ' + Deno.env.get('MINDEE_API_KEY')! },
      body: form,
    });
    if (!mindee.ok) return json({ error: 'OCR failed', detail: await mindee.text() }, 502);

    const raw = await mindee.json();
    const pred = raw?.document?.inference?.prediction ?? {};

    // 5. Reduce to a clean shape the frontend can use
    return json({
      ok: true,
      provider: 'mindee',
      fields: {
        merchant: pred.supplier_name?.value ?? null,
        date:     pred.date?.value ?? null,                 // YYYY-MM-DD
        total:    pred.total_amount?.value ?? null,
        gst:      pred.total_tax?.value ?? null,
        location: pred.supplier_address?.value ?? null,
        items:    Array.isArray(pred.line_items) ? pred.line_items.length : null,
        currency: pred.locale?.currency ?? 'NZD',
      },
      raw,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
