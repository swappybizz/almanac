// pages/api/getTimeLog.js
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatISO,
  parseISO,
  getDaysInMonth,
  addDays
} from 'date-fns';

// Returns minutes between two "HH:mm" times, handling overnight spans
const calculateDuration = (start, end) => {
  const s = new Date(`1970-01-01T${start}:00`);
  let e = new Date(`1970-01-01T${end}:00`);
  if (e < s) e.setDate(e.getDate() + 1);
  return (e - s) / (1000 * 60);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { date, projectId } = req.query;
  if (!date || !projectId) {
    return res.status(400).json({ error: 'Missing date or projectId' });
  }

  try {
    const { db } = await connectToDatabase();
    const timeLogs = db.collection('timeLogs');
    const target = parseISO(date);

    // Today's log
    const todayLog = await timeLogs.findOne({
      userId,
      projectId,
      date: formatISO(target, { representation: 'date' }),
    });

    // All logs for project
    const allLogs = await timeLogs.find({ userId, projectId }).toArray();

    // Stats calculations
    let weeklyMin = 0, monthlyMin = 0, allTimeMin = 0;
    const wkStart = startOfWeek(target, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(target, { weekStartsOn: 1 });
    const moStart = startOfMonth(target);
    const moEnd = endOfMonth(target);

    allLogs.forEach(log => {
      const logDate = parseISO(log.date);
      const mins = calculateDuration(log.startTime, log.endTime);
      allTimeMin += mins;
      if (logDate >= wkStart && logDate <= wkEnd) weeklyMin += mins;
      if (logDate >= moStart && logDate <= moEnd) monthlyMin += mins;
    });

    const avgMin = allLogs.length ? allTimeMin / allLogs.length : 0;

    // Daily logs for current month
    const dim = getDaysInMonth(target);
    const dailyLogs = Array.from({ length: dim }, (_, i) => {
      const d = addDays(moStart, i);
      const iso = formatISO(d, { representation: 'date' });
      const log = allLogs.find(l => l.date === iso);
      const hrs = log ? calculateDuration(log.startTime, log.endTime) / 60 : 0;
      return { date: iso, hours: hrs };
    });

    res.status(200).json({
      log: todayLog || null,
      stats: {
        weekly: { hours: Math.floor(weeklyMin / 60), minutes: weeklyMin % 60 },
        monthly: { hours: Math.floor(monthlyMin / 60), minutes: monthlyMin % 60 },
        average: { hours: Math.floor(avgMin / 60), minutes: Math.round(avgMin % 60) },
      },
      dailyLogs,
    });
  } catch (err) {
    console.error('getTimeLog error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
