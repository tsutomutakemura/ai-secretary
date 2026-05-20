export default async function handler(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return new Response(JSON.stringify({
    keyExists: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 8) : 'none'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
