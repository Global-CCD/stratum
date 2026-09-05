// functions/api/unfurl.js - Cloudflare Edge Function
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url query parameter' }), { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, { headers: { 'User-Agent': 'ProductivityEngineBot/1.0' } });
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : targetUrl;

    return new Response(JSON.stringify({ url: targetUrl, title, status: res.status }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ url: targetUrl, error: e.message }), { status: 500 });
  }
}