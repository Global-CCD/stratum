// functions/api/embed.js - Cloudflare Workers AI Embeddings Proxy
export async function onRequestPost(context) {
  try {
    const { text } = await context.request.json();
    if (!text) return new Response(JSON.stringify({ error: 'Missing text payload' }), { status: 400 });

    // Optional: Call Cloudflare Workers AI or external OpenAI API
    // const embeddings = await context.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [text] });

    // Deterministic mock fallback vector for zero-API-key testing
    const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockVector = new Array(8).fill(0).map((_, i) => Math.sin(hash + i));

    return new Response(JSON.stringify({ vector: mockVector }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}