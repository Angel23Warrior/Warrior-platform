const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  'mailto:angel@branch49.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, title, body } = req.body;

  const supabase = createClient(
    'https://ntcsjtyiefusaqsehgfl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user_id)
    .single();

  if (!sub) return res.status(404).json({ error: 'No subscription found' });

  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body }));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
