export default async function handler(req, res) {
  // ブラウザから直接呼べるようにする許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 鍵（アクセストークン）を受け取る
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'アクセストークンがありません' });
    return;
  }

  try {
    // ===== 予定を読む（GET） =====
    if (req.method === 'GET') {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const url =
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
        new URLSearchParams({
          timeMin: now.toISOString(),
          timeMax: weekLater.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '20',
        }).toString();

      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(r.status).json({ error: 'カレンダー読み取りエラー', detail: data });
        return;
      }

      const events = (data.items || []).map((e) => ({
        title: e.summary || '(タイトルなし)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      }));
      res.status(200).json({ events });
      return;
    }

    // ===== 予定を登録する（POST） =====
    if (req.method === 'POST') {
      const body = req.body;
      const event = {
        summary: body.title,
        start: { dateTime: body.start, timeZone: 'Asia/Tokyo' },
        end: { dateTime: body.end, timeZone: 'Asia/Tokyo' },
      };

      const r = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      const data = await r.json();
      if (!r.ok) {
        res.status(r.status).json({ error: '予定登録エラー', detail: data });
        return;
      }
      res.status(200).json({ ok: true, link: data.htmlLink });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
