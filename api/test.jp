export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'こんにちは' }] }],
      }),
    }
  );

  const data = await response.json();

  res.status(200).json({
    keyExists: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : 'なし',
    geminiStatus: response.status,
    geminiResponse: data,
  });
}
