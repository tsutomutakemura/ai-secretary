export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  // カレンダーの読み書きを許可してもらう範囲（スコープ）
  const scope = 'https://www.googleapis.com/auth/calendar';

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

  // Googleの同意画面へ送り出す
  res.writeHead(302, { Location: authUrl });
  res.end();
}
