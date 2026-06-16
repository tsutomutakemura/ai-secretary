export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const userText = req.body.text || '';
    // 「今日」が何月何日かをAIに教えるため、日本時間の現在を渡す
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const systemPrompt =
      `あなたは予定管理アシスタントです。ユーザーの文章から予定を抽出し、JSONだけを返してください。\n` +
      `現在の日本時間は ${nowJst} です。「明日」「来週月曜」などはこれを基準に具体的な日付に変換してください。\n` +
      `終了時刻の指定がなければ開始の1時間後にしてください。\n` +
      `出力は次の形式のJSONのみ。前後の説明やマークダウンは一切不要：\n` +
      `{"title":"予定名","start":"YYYY-MM-DDTHH:MM:SS","end":"YYYY-MM-DDTHH:MM:SS"}\n` +
      `もし予定として解釈できない場合は {"error":"予定を読み取れませんでした"} を返してください。`;

    const apiKey = process.env.GEMINI_API_KEY;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 200 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) { res.status(500).json({ error: 'AI解析エラー', detail: data }); return; }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // 念のため ```json などが付いていたら除去
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { res.status(200).json({ error: 'AIの返答を解析できませんでした', raw: text }); return; }

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
