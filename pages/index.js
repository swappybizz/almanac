// pages/index.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addDays,
  subDays,
  formatISO,
  isSameDay,
  parseISO
} from 'date-fns';
import {
  FiClock,
  FiGrid,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiPlus,
} from 'react-icons/fi';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';

// Rounded bar shape (unchanged)
const RoundedBar = ({ fill, x, y, width, height }) => {
  if (height <= 0) return null;
  const r = 6;
  return (
    <g>
      <path
        d={`
          M${x},${y + r}
          A${r},${r} 0 0 1 ${x + r},${y}
          L${x + width - r},${y}
          A${r},${r} 0 0 1 ${x + width},${y + r}
          L${x + width},${y + height}
          L${x},${y + height}
          Z
        `}
        fill={fill}
      />
    </g>
  );
};

// Time card with immediate focus on edit
const TimeCard = ({
  label,
  time,
  setTime,
  accentColor,
  isEditing,
  setIsEditing
}) => {
  // Use a callback ref to focus the input as soon as it's mounted.
  // We cannot call .showPicker() here due to browser security restrictions,
  // as it's not triggered directly by a user gesture. However, .focus() is
  // allowed and provides a good UX.
  const inputCallbackRef = (inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleBlur = (e) => {
    setTime(e.target.value);
    setIsEditing(false);
  };

  const isValid = /^\d{2}:\d{2}$/.test(time);

  return (
    <motion.div
      layout
      className={`relative bg-neutral-900 border border-neutral-800 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:border-${accentColor}-500/50`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div className="flex justify-between items-start">
        <p className={`text-lg font-semibold text-${accentColor}-400`}>{label}</p>
        <FiClock className="text-neutral-600" size={24} />
      </div>
      <div className="mt-2 h-20 flex items-center">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full"
            >
              <input
                ref={inputCallbackRef}
                type="time"
                defaultValue={isValid ? time : ''}
                placeholder="set time"
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur(e)}
                className="w-full h-full bg-transparent text-white text-6xl font-mono text-center outline-none"
                style={{ colorScheme: 'dark' }}
              />
            </motion.div>
          ) : (
            <motion.p
              key="text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full text-6xl font-mono font-bold text-center text-stone-200"
            >
              {time}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // default "empty" times
  const [startTime, setStartTime] = useState('set time');
  const [endTime, setEndTime] = useState('set time');

  const [stats, setStats] = useState({ weekly: {}, monthly: {}, average: {} });
  const [monthData, setMonthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);

  const isInitialLoad = useRef(false);
  const dateInputRef = useRef(null);

  // load projects
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (res.ok) {
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0]._id);
          } else {
            setIsLoading(false);
            alert("To add time please create a project. Without a Project, your logged times would not be saved. Follow the next step or Click on the + next to your name")
            handleAddProject()
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // fetch daily log + stats + month
  const fetchLogData = async (date, projectId) => {
    setIsLoading(true);
    isInitialLoad.current = false;
    try {
      const iso = formatISO(date, { representation: 'date' });
      const res = await fetch(`/api/getTimeLog?date=${iso}&projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) {
        if (data.log) {
          setStartTime(data.log.startTime);
          setEndTime(data.log.endTime);
        } else {
          setStartTime('set time');
          setEndTime('set time');
        }
        setStats(data.stats);
        setMonthData(
          data.dailyLogs.map((d) => ({
            date: parseISO(d.date),
            hours: d.hours,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = true;
    }
  };

  // when date or project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchLogData(currentDate, selectedProjectId);
    }
  }, [currentDate, selectedProjectId]);

  // save on valid time edits only if we have a project
  useEffect(() => {
    if (
      !isInitialLoad.current ||
      !selectedProjectId ||
      projects.length === 0
    ) {
      return;
    }
    const timePattern = /^\d{2}:\d{2}$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return;
    }

    (async () => {
      try {
        await fetch('/api/saveTimeLog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formatISO(currentDate, { representation: 'date' }),
            projectId: selectedProjectId,
            startTime,
            endTime,
          }),
        });
        fetchLogData(currentDate, selectedProjectId);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [startTime, endTime, selectedProjectId, projects.length]);

  // compute today's duration
  const [hours, minutes] = useMemo(() => {
    const timePattern = /^\d{2}:\d{2}$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return [0, 0];
    }
    const s = new Date(`1970-01-01T${startTime}:00`);
    let e = new Date(`1970-01-01T${endTime}:00`);
    if (e < s) e.setDate(e.getDate() + 1);
    const diff = e - s;
    return [Math.floor(diff / 3600000), Math.floor((diff % 3600000) / 60000)];
  }, [startTime, endTime]);

  // navigation
  const handleDateChange = (e) =>
    setCurrentDate(new Date(`${e.target.value}T00:00:00`));
  const prevDay = () => setCurrentDate((d) => subDays(d, 1));
  const nextDay = () => setCurrentDate((d) => addDays(d, 1));

  // SAFETY‐CHECKED click handler
  const onBarClick = (data, idx) => {
    if (typeof idx !== 'number' || !monthData[idx]) return;
    setCurrentDate(monthData[idx].date);
  };

  // add a project
  const handleAddProject = async () => {
    const name = window.prompt('Enter a new project name');
    if (!name) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const project = await res.json();
      if (res.ok) {
        setProjects((p) => [...p, project]);
        setSelectedProjectId(project._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={`bg-neutral-950 text-white font-sans w-full h-screen max-w-md mx-auto flex flex-col overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'
        }`}
    >
      <header className="flex items-center justify-between px-4 pt-6 text-xl font-medium text-neutral-400">
        <button
          onClick={prevDay}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <FiChevronLeft size={24} />
        </button>
        <div
          className="relative text-center cursor-pointer"
          onClick={() => dateInputRef.current.click()}
        >
          <h1 className="text-stone-200">
            {format(currentDate, 'EEE, do MMM')}
          </h1>
          <input
            type="date"
            ref={dateInputRef}
            onChange={handleDateChange}
            value={format(currentDate, 'yyyy-MM-dd')}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <button
          onClick={nextDay}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <FiChevronRight size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-start px-4 gap-3 pt-4 overflow-y-auto">
        <div className="flex justify-between items-center gap-4">
          <p className="font-semibold text-neutral-300 truncate">
            {user?.fullName}
          </p>
          <div className="relative w-48 flex items-center">
            <button
              onClick={handleAddProject}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              title="Add project"
            >
              <FiPlus size={20} className="text-neutral-500 hover:text-white" />
            </button>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-3 pr-3 text-white appearance-none focus:outline-none focus:border-purple-500 transition"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        </div>

        <TimeCard
          label="Start Time"
          time={startTime}
          setTime={setStartTime}
          accentColor="pink"
          isEditing={isEditingStart}
          setIsEditing={setIsEditingStart}
        />
        <TimeCard
          label="End Time"
          time={endTime}
          setTime={setEndTime}
          accentColor="purple"
          isEditing={isEditingEnd}
          setIsEditing={setIsEditingEnd}
        />

        <div className="bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 mb-1">TODAY'S TOTAL</p>
          <p className="text-4xl font-bold text-purple-400">
            {hours}
            <span className="text-2xl font-medium text-purple-300/80">h</span>{' '}
            {String(minutes).padStart(2, '0')}
            <span className="text-2xl font-medium text-purple-300/80">m</span>
          </p>
        </div>

        <div className="flex items-center justify-around bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800">
          <div className="text-center">
            <p className="text-xl font-bold">
              {stats.average.hours || 0}
              <span className="text-base">h</span> {stats.average.minutes || 0}
              <span className="text-base">m</span>
            </p>
            <p className="text-xs text-neutral-400">All-time Avg</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">
              {stats.weekly.hours || 0}
              <span className="text-base">h</span> {stats.weekly.minutes || 0}
              <span className="text-base">m</span>
            </p>
            <p className="text-xs text-neutral-400">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">
              {stats.monthly.hours || 0}
              <span className="text-base">h</span> {stats.monthly.minutes || 0}
              <span className="text-base">m</span>
            </p>
            <p className="text-xs text-neutral-400">This Month</p>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800 mt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDate.toString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-6 text-center text-xs text-neutral-400 mb-2"
            >
              {monthData.find((d) => isSameDay(d.date, currentDate))?.hours.toFixed(1)}{' '}
              hours on {format(currentDate, 'do MMM')}
            </motion.div>
          </AnimatePresence>
          <div className="w-full h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} barGap={2}>
                <Bar dataKey="hours" shape={<RoundedBar />} onClick={onBarClick}>
                  {monthData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={isSameDay(entry.date, currentDate) ? '#a855f7' : '#404040'}
                      className="cursor-pointer transition-colors"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
      <footer className="flex sticky bottom-12 opacity-70 items-center justify-center mt-auto">

        <div className="flex items-center gap-x-6 bg-neutral-900 rounded-full h-16 shadow-lg border border-neutral-800 px-6">
          <button className="flex justify-center items-center text-purple-400 h-full">
            <FiClock size={26} />
          </button>
          <button
            onClick={() => (window.location.href = '/calendar')}
            className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"
          >
            <FiGrid size={24} />
          </button>
          <button
            onClick={() => (window.location.href = '/settings')}
            className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"
          >
            <FiSettings size={24} />
          </button>
          <div className="h-8 border-l border-neutral-700" />
          <div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </footer>
    </div>
  );
}