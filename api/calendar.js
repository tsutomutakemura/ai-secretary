export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'アクセストークンがありません' }); return; }

  const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const authHeader = { Authorization: `Bearer ${token}` };

  try {
    // ===== 読む（GET） =====
    if (req.method === 'GET') {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const url = base + '?' + new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: weekLater.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '20',
      }).toString();
      const r = await fetch(url, { headers: authHeader });
      const data = await r.json();
      if (!r.ok) { res.status(r.status).json({ error: 'カレンダー読み取りエラー', detail: data }); return; }
      const events = (data.items || []).map((e) => ({
        id: e.id,
        title: e.summary || '(タイトルなし)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      }));
      res.status(200).json({ events });
      return;
    }

    // ===== 登録（POST） =====
    if (req.method === 'POST') {
      const body = req.body;
      const event = {
        summary: body.title,
        start: { dateTime: body.start, timeZone: 'Asia/Tokyo' },
        end: { dateTime: body.end, timeZone: 'Asia/Tokyo' },
      };
      const r = await fetch(base, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await r.json();
      if (!r.ok) { res.status(r.status).json({ error: '予定登録エラー', detail: data }); return; }
      res.status(200).json({ ok: true, link: data.htmlLink });
      return;
    }

    // ===== 変更（PUT） =====
    if (req.method === 'PUT') {
      const body = req.body;
      if (!body.id) { res.status(400).json({ error: 'イベントIDがありません' }); return; }
      const event = {
        summary: body.title,
        start: { dateTime: body.start, timeZone: 'Asia/Tokyo' },
        end: { dateTime: body.end, timeZone: 'Asia/Tokyo' },
      };
      const r = await fetch(`${base}/${body.id}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await r.json();
      if (!r.ok) { res.status(r.status).json({ error: '予定変更エラー', detail: data }); return; }
      res.status(200).json({ ok: true, link: data.htmlLink });
      return;
    }

    // ===== 削除（DELETE） =====
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) { res.status(400).json({ error: 'イベントIDがありません' }); return; }
      const r = await fetch(`${base}/${id}`, { method: 'DELETE', headers: authHeader });
      if (!r.ok && r.status !== 204) {
        const data = await r.json();
        res.status(r.status).json({ error: '予定削除エラー', detail: data });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
