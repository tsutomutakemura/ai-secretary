export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const contents = body.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: body.system || '' }] },
          contents: contents,
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({
        error: 'Gemini APIエラー',
        detail: data.error ? data.error.message : JSON.stringify(data),
      });
      return;
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      '回答を取得できませんでした。';

    res.status(200).json({ content: [{ type: 'text', text: text }] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
