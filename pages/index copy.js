// pages/index.js
import { useState, useEffect, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, getDaysInMonth, startOfMonth } from "date-fns";
import { FiClock, FiGrid, FiSettings, FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';

// --- Helper: Generate Dummy Data for the Chart ---
const generateMonthData = (date) => {
  const daysInMonth = getDaysInMonth(date);
  const monthStart = startOfMonth(date);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const dayDate = addDays(monthStart, i);
    return {
      date: dayDate,
      hours: Math.random() > 0.2 ? Math.random() * 8 + 2 : 0, // ~80% chance of working
    };
  });
};

// --- Custom Shape for Rounded Bars in Recharts ---
const RoundedBar = (props) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  return (
    <g>
      <path d={`M${x},${y + radius} A${radius},${radius} 0 0 1 ${x + radius},${y} L${x + width - radius},${y} A${radius},${radius} 0 0 1 ${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`} fill={fill} />
    </g>
  );
};


// --- Time Card Component (Unchanged) ---
const TimeCard = ({ label, time, setTime, accentColor, isEditing, setIsEditing }) => {
  const handleTimeChange = (e) => {
    setTime(e.target.value);
    setIsEditing(false);
  };

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
            <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full h-full">
              <input type="time" defaultValue={time} onBlur={handleTimeChange} onKeyDown={(e) => e.key === 'Enter' && handleTimeChange(e)} autoFocus className="w-full h-full bg-transparent text-white text-6xl font-mono text-center outline-none" style={{ colorScheme: 'dark' }} />
            </motion.div>
          ) : (
            <motion.p key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full text-6xl font-mono font-bold text-center text-stone-200">{time}</motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- Main Home Page Component ---
export default function Home() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:30");
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // State for the new bar chart
  const [monthData, setMonthData] = useState([]);
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  // Ref for the hidden date input
  const dateInputRef = useRef(null);

  useEffect(() => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    if (end < start) end.setDate(end.getDate() + 1);
    const durationMillis = end - start;
    if (durationMillis >= 0) {
      setDurationHours(Math.floor(durationMillis / (1000 * 60 * 60)));
      setDurationMinutes(Math.floor((durationMillis % (1000 * 60 * 60)) / (1000 * 60)));
    } else {
      setDurationHours(0);
      setDurationMinutes(0);
    }
  }, [startTime, endTime]);

  // Generate new chart data when the month changes
  useEffect(() => {
    setMonthData(generateMonthData(currentDate));
    setActiveBarIndex(currentDate.getDate() - 1); // Highlight today's bar by default
  }, [currentDate.getMonth()]);

  const handleDateChange = (e) => {
    // The input value is YYYY-MM-DD. Adding T00:00:00 prevents timezone issues.
    const newDate = new Date(`${e.target.value}T00:00:00`);
    setCurrentDate(newDate);
  };

  const handleBarClick = (data, index) => {
    setActiveBarIndex(index);
    setCurrentDate(data.date);
  };

  const activeBarData = activeBarIndex !== null ? monthData[activeBarIndex] : null;

  return (
    <div className="bg-neutral-950 text-white font-sans w-full h-screen max-w-md mx-auto flex flex-col overflow-hidden">
      
      {/* --- Header: Date Navigator --- */}
      <header className="flex items-center justify-between px-4 pt-6 text-xl font-medium text-neutral-400">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 rounded-full hover:bg-neutral-800 transition-colors"><FiChevronLeft size={24} /></button>
        
        {/* Clickable Date to open Calendar */}
        <div className="text-center cursor-pointer" onClick={() => dateInputRef.current.click()}>
          <h1 className="text-stone-200">{format(currentDate, "EEE, do MMM")}</h1>
          <input type="date" ref={dateInputRef} onChange={handleDateChange} className="hidden" style={{ colorScheme: 'dark' }} />
        </div>

        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 rounded-full hover:bg-neutral-800 transition-colors"><FiChevronRight size={24} /></button>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col justify-start px-4 gap-3 pt-4 overflow-y-auto">
        <div className="flex justify-between items-center gap-4">
          <p className="font-semibold text-neutral-300 truncate">{user?.fullName || "Swapnil Kumar"}</p>
          <div className="relative w-48">
            <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-3 pr-8 text-white appearance-none focus:outline-none focus:border-purple-500 transition">
              <option>Work Project</option><option>Consulting Gig</option><option>Side Hustle</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        </div>
        <TimeCard label="Start Time" time={startTime} setTime={setStartTime} accentColor="pink" isEditing={isEditingStart} setIsEditing={setIsEditingStart} />
        <TimeCard label="End Time" time={endTime} setTime={setEndTime} accentColor="purple" isEditing={isEditingEnd} setIsEditing={setIsEditingEnd} />
        <div className="bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 mb-1">TODAY'S TOTAL</p>
          <p className="text-4xl font-bold text-purple-400">{durationHours}<span className="text-2xl font-medium text-purple-300/80">h</span> {String(durationMinutes).padStart(2, '0')}<span className="text-2xl font-medium text-purple-300/80">m</span></p>
        </div>
        <div className="flex items-center justify-around bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800">
          <div className="text-center"><p className="text-xl font-bold">7<span className="text-base">h</span> 45<span className="text-base">m</span></p><p className="text-xs text-neutral-400">All-time Avg</p></div>
          <div className="text-center"><p className="text-xl font-bold">38<span className="text-base">h</span> 15<span className="text-base">m</span></p><p className="text-xs text-neutral-400">This Week</p></div>
          <div className="text-center"><p className="text-xl font-bold">120<span className="text-base">h</span> 30<span className="text-base">m</span></p><p className="text-xs text-neutral-400">This Month</p></div>
        </div>

        {/* --- Monthly Bar Chart --- */}
        <div className="bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800 mt-1">
            <AnimatePresence mode="wait">
                <motion.div key={activeBarIndex} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="h-6 text-center text-xs text-neutral-400 mb-2">
                    {activeBarData && `${format(activeBarData.date, 'do MMM')}: ${activeBarData.hours.toFixed(1)} hours`}
                </motion.div>
            </AnimatePresence>
            <div className="w-full h-20">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthData} barGap={2} onClick={(data, index) => handleBarClick(data.payload, index)}>
                        <Bar dataKey="hours" shape={<RoundedBar />}>
                            {monthData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === activeBarIndex ? '#a855f7' : '#404040'} className="cursor-pointer" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </main>

      {/* --- Bottom Navigation --- */}
      <footer className="flex items-center justify-center p-4 mt-auto">
        <div className="flex items-center bg-neutral-900 rounded-full h-16 w-full max-w-xs shadow-lg border border-neutral-800">
          <button className="flex-1 flex justify-center items-center text-purple-400 h-full"><FiClock size={26}/></button>
          <button className="flex-1 flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"><FiGrid size={24}/></button>
          <button className="flex-1 flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"><FiSettings size={24}/></button>
          <div className="h-8 border-l border-neutral-700"></div>
          <div className="px-4"><UserButton afterSignOutUrl="/" /></div>
        </div>
      </footer>
    </div>
  );
}