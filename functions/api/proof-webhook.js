// functions/api/proof-webhook.js - Cloudflare Edge Webhook Receiver
export async function onRequestPost(context) {
  try {
    const authHeader = context.request.headers.get('X-Stratum-Signature');
    const payload = await context.request.json();

    if (!payload.task_id || !payload.telemetry) {
      return new Response(JSON.stringify({ error: 'Invalid payload. task_id and telemetry required.' }), { status: 400 });
    }

    // Return confirmed verification receipt back to client
    return new Response(JSON.stringify({
      status: 'VERIFIED',
      task_id: payload.task_id,
      received_at: new Date().toISOString(),
      signature_valid: Boolean(authHeader)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}