// functions/api/embed.js
export async function onRequestPost(context) {
  try {
    const { text } = await context.request.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text payload' }), { status: 400 });
    }

    // 1. Verify Workers AI binding is present
    if (!context.env.AI) {
      return new Response(JSON.stringify({ 
        error: 'AI binding missing. Check Cloudflare Dashboard > Settings > Functions > AI Bindings.' 
      }), { status: 500 });
    }

    // 2. Run BAAI BGE-Small (Fast, optimized 384-dimension vector model)
    const response = await context.env.AI.run('@cf/baai/bge-small-en-v1.5', {
      text: [text]
    });

    // 3. Return the dense vector array to the browser
    const vector = response.data[0];

    return new Response(JSON.stringify({ vector, dimensions: vector.length }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
