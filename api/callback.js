export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    res.status(400).send('認可コードがありません。');
    return;
  }

  try {
    // 認可コードをアクセストークンに交換する
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      res.status(500).json({ error: 'トークン取得エラー', detail: tokenData });
      return;
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';

    // 取得したトークンを画面に表示（動作確認用）
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <html><body style="font-family:sans-serif;padding:40px;line-height:1.8;">
        <h2>✅ 連携に成功しました！</h2>
        <p>カレンダーへのアクセス許可が取得できました。</p>
        <p>次のステップで、この値を使ってカレンダーを読み書きします。</p>
        <hr>
        <p style="font-size:12px;word-break:break-all;background:#f4f4f4;padding:12px;border-radius:6px;">アクセストークン（このあと使います）：<br>${accessToken}</p>
        <p style="color:#888;font-size:13px;">リフレッシュトークン取得：${refreshToken ? 'あり ✅' : 'なし'}</p>
      </body></html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
