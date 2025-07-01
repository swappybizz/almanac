// pages/api/saveTimeLog.js
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { formatISO, parseISO } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { date, projectId, startTime, endTime } = req.body;
  if (!date || !projectId || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { db } = await connectToDatabase();
    const timeLogs = db.collection('timeLogs');

    const filter = {
      userId,
      projectId,
      date: formatISO(parseISO(date), { representation: 'date' }),
    };

    const update = {
      $set: { startTime, endTime },
    };

    await timeLogs.updateOne(filter, update, { upsert: true });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('saveTimeLog error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
