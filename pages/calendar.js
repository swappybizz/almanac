// pages/calendar.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  getDaysInMonth,
  formatISO,
  parseISO,
  isSameDay
} from 'date-fns';
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiGrid,
  FiClock,
  FiSettings,
  FiChevronDown,
  FiPlus,
  FiBarChart
} from 'react-icons/fi';

// ---- Day‐click Modal for editing a single day ----
function DayModal({ date, projectId, close, refresh }) {
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('16:30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const iso = formatISO(date, { representation: 'date' });
      const res = await fetch(`/api/getTimeLog?date=${iso}&projectId=${projectId}`);
      const json = await res.json();
      if (res.ok && json.log) {
        setStart(json.log.startTime);
        setEnd(json.log.endTime);
      }
      setLoading(false);
    })();
  }, [date, projectId]);

  const save = async () => {
    const iso = formatISO(date, { representation: 'date' });
    await fetch('/api/saveTimeLog', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ date: iso, projectId, startTime: start, endTime: end })
    });
    refresh();
    close();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-neutral-900 rounded-2xl p-6 w-80"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <h2 className="text-lg mb-4 text-center">{format(date, 'do MMM yyyy')}</h2>
        {loading ? (
          <p className="text-center">Loading…</p>
        ) : (
          <>
            <label className="block mb-2">
              <span className="text-sm text-neutral-400">Start Time</span>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full bg-neutral-800 rounded p-2 mt-1 text-white"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm text-neutral-400">End Time</span>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full bg-neutral-800 rounded p-2 mt-1 text-white"
              />
            </label>
            <div className="flex justify-end space-x-2">
              <button
                onClick={close}
                className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
              >
                Save
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---- Stats Modal for the month ----
function StatsModal({ stats, close }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-neutral-900 rounded-2xl p-6 w-80"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <h2 className="text-lg mb-4 text-center">Month Stats</h2>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Total Hours:</span>{' '}
            {stats.monthly.hours}h {stats.monthly.minutes}m
          </p>
          <p>
            <span className="font-semibold">Weekly Hours:</span>{' '}
            {stats.weekly.hours}h {stats.weekly.minutes}m
          </p>
          <p>
            <span className="font-semibold">All-time Avg:</span>{' '}
            {stats.average.hours}h {stats.average.minutes}m
          </p>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={close}
            className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);

  const [viewDate, setViewDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]); // { date: Date, hours }
  const [stats, setStats] = useState({ weekly: {}, monthly: {}, average: {} });
  const [loading, setLoading] = useState(true);

  const [dayModalDate, setDayModalDate] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // fetch projects once
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (res.ok) {
        setProjects(data);
        if (data.length) setProjectId(data[0]._id);
        else setLoading(false);
      }
    })();
  }, []);

  // whenever viewDate or projectId changes, fetch month data + stats
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    (async () => {
      const iso = formatISO(viewDate, { representation: 'date' });
      const res = await fetch(`/api/getTimeLog?date=${iso}&projectId=${projectId}`);
      const json = await res.json();
      if (res.ok) {
        setMonthData(
          json.dailyLogs.map(d => ({
            date: parseISO(d.date),
            hours: d.hours
          }))
        );
        setStats(json.stats);
      }
      setLoading(false);
    })();
  }, [viewDate, projectId]);

  // build calendar grid
  const daysInMonth  = getDaysInMonth(viewDate);
  const firstOfMonth = startOfMonth(viewDate);
  const dayOffset    = (firstOfMonth.getDay() + 6) % 7; // Monday=0 … Sunday=6
  const cells        = [
    ...Array(dayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), i + 1)
    )
  ];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  const prevMonth = () => setViewDate(d => subMonths(d, 1));
  const nextMonth = () => setViewDate(d => addMonths(d, 1));
  const prevYear  = () => setViewDate(d => subYears(d, 1));
  const nextYear  = () => setViewDate(d => addYears(d, 1));
  const exportToExcel = async () => {
    if (!projectId) return;
    // import the module (no .default)
    const XLSX = await import('xlsx');
    const proj = projects.find(p => p._id === projectId);
    const projectName = proj?.name || 'Project';
    const monthLabel = format(viewDate, 'MMMM yyyy');
    const totalH = stats.monthly.hours + stats.monthly.minutes / 60;
    const rows = [];
    rows.push(['Project', projectName]);
    rows.push(['Month', monthLabel]);
    rows.push(['Total Hours', totalH.toFixed(2)]);
    rows.push([]);
    rows.push(['Date', 'Hours']);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const entry = monthData.find(e => isSameDay(e.date, date));
      rows.push([
        format(date, 'yyyy-MM-dd'),
        entry ? entry.hours : 0
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log');
    XLSX.writeFile(wb, `${projectName}_${monthLabel}_Log.xlsx`);
  };

  return (
    <div className="bg-neutral-950 text-white w-full min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-neutral-800 transition">
          <FiArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-2 text-neutral-300">
          <button onClick={prevYear} className="p-2 hover:bg-neutral-800 rounded-full">
            <FiChevronsLeft size={20} />
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-neutral-800 rounded-full">
            <FiChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-medium">{format(viewDate, 'MMMM yyyy')}</h1>
          <button onClick={nextMonth} className="p-2 hover:bg-neutral-800 rounded-full">
            <FiChevronRight size={20} />
          </button>
          <button onClick={nextYear} className="p-2 hover:bg-neutral-800 rounded-full">
            <FiChevronsRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowStats(true)}
          className="p-2 rounded-full hover:bg-neutral-800 transition"
        >
          <FiBarChart size={24} />
        </button>
      </header>
      <div className="px-4 mt-4">
        <div className="relative w-full">
          <select
            value={projectId || ''}
            onChange={e => setProjectId(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-3 pr-8 text-white appearance-none focus:outline-none"
          >
            {projects.map(p => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        </div>
      </div>
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {loading ? (
          <p className="text-center">Loading…</p>
        ) : (
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="font-medium text-neutral-500">{d}</div>
            ))}
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                if (!day) return <div key={`e${wi}-${di}`} />;
                const entry = monthData.find(d => isSameDay(d.date, day));
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setDayModalDate(day)}
                    className="p-2 bg-neutral-900 rounded hover:bg-neutral-800 transition flex flex-col items-center"
                  >
                    <span>{day.getDate()}</span>
                    <span className="text-xs text-neutral-400">
                      {entry ? entry.hours.toFixed(1) + 'h' : '-'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </main>
      <button
        onClick={exportToExcel}
        className="fixed bottom-24 right-6 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        Export Excel
      </button>
<footer className="flex items-center justify-center p-4 mt-auto">
  <div className="flex items-center gap-x-6 bg-neutral-900 rounded-full h-16 shadow-lg border border-neutral-800 px-6">
    {/* Button 1 */}
    <button
    onClick={() => (window.location.href = '/')}
    className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full">
      <FiClock size={26} />
    </button>

    {/* Button 2 */}
    <button
      
      className="flex justify-center items-center text-purple-400 h-full"
      
    >
      <FiGrid size={24} />
    </button>
    <button
            onClick={() => (window.location.href = '/settings')}
            className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"
          >
            <FiSettings size={24} />
          </button>

    {/* Divider */}
    <div className="h-8 border-l border-neutral-700" />

    {/* User Button */}
    <div>
      <UserButton afterSignOutUrl="/" />
    </div>
  </div>
</footer>
      <AnimatePresence>
        {dayModalDate && (
          <DayModal
            date={dayModalDate}
            projectId={projectId}
            close={() => setDayModalDate(null)}
            refresh={() => {
              const iso = formatISO(viewDate, { representation: 'date' });
              fetch(`/api/getTimeLog?date=${iso}&projectId=${projectId}`)
                .then(r => r.json())
                .then(json => {
                  setMonthData(json.dailyLogs.map(d => ({
                    date: parseISO(d.date),
                    hours: d.hours
                  })));
                  setStats(json.stats);
                });
            }}
          />
        )}
        {showStats && <StatsModal stats={stats} close={() => setShowStats(false)} />}
      </AnimatePresence>
    </div>
  );
}
