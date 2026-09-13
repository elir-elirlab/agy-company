import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface ActivityHeatmapProps {
  todayDate?: string;  // 'YYYY-MM-DD' from backend status.today
  onOpenFile: (path: string) => void;  // Opens FileViewerModal for daily note
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ todayDate, onOpenFile }) => {
  const { t, language } = useI18n();

  // Determine current "today" based on prop or local system time
  const today = useMemo(() => {
    return todayDate ? new Date(todayDate) : new Date();
  }, [todayDate]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed

  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/daily/calendar?year=${currentYear}&month=${currentMonth}`);
        if (!res.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data = await res.json();
        if (isMounted) {
          setActiveDates(new Set(data.active_dates || []));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error fetching calendar');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchCalendar();
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Prevent navigating to future months
  const isNextDisabled = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth >= (today.getMonth() + 1));

  // Calendar grid computation: get the number of days in the month and which weekday the month starts on
  const { firstDayOffset, daysInMonth } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    // getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
    const firstDayOffset = new Date(currentYear, currentMonth - 1, 1).getDay();
    return { firstDayOffset, daysInMonth };
  }, [currentYear, currentMonth]);

  const totalCells = Math.ceil((daysInMonth + firstDayOffset) / 7) * 7;
  
  // Create padded grid cells
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < firstDayOffset || i >= firstDayOffset + daysInMonth) {
        cells.push(null); // empty cell padding
      } else {
        const dayNumber = i - firstDayOffset + 1;
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        cells.push({
          day: dayNumber,
          dateStr,
          isActive: activeDates.has(dateStr),
          isToday: dateStr === todayDate
        });
      }
    }
    return cells;
  }, [totalCells, firstDayOffset, daysInMonth, currentYear, currentMonth, activeDates, todayDate]);

  const activeDaysCount = activeDates.size;
  const activityPercentage = daysInMonth > 0 ? Math.round((activeDaysCount / daysInMonth) * 100) : 0;

  const monthLabel = language === 'ja' 
    ? `${currentYear}年${t.heatmap.months[currentMonth - 1]}`
    : `${t.heatmap.months[currentMonth - 1]} ${currentYear}`;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/70 shadow-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg">{t.heatmap.title}</h2>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-2 py-1">
          <button 
            onClick={handlePrevMonth}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium w-24 text-center text-slate-200">
            {monthLabel}
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={isNextDisabled}
            className={`p-1 rounded transition-colors ${
              isNextDisabled 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="h-full min-h-[120px] flex items-center justify-center text-slate-400 text-sm">
            <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="h-full min-h-[120px] flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="inline-block mx-auto">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {t.heatmap.weekDays.map((dayLabel, idx) => (
                <div key={idx} className="w-6 text-center text-[10px] font-medium text-slate-500">
                  {dayLabel}
                </div>
              ))}
            </div>
            
            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1">
              {gridCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="w-6 h-6 rounded-sm bg-transparent" />;
                }

                // Determine if this cell is in the future relative to 'todayDate' prop or system today
                let isFuture = false;
                if (todayDate) {
                  isFuture = cell.dateStr > todayDate;
                } else {
                  isFuture = new Date(cell.dateStr) > today;
                }

                let cellClass = "w-6 h-6 rounded-sm transition-all duration-200 cursor-default ";
                
                if (cell.isActive) {
                  cellClass += "bg-emerald-500 hover:bg-emerald-400 cursor-pointer ";
                  if (isFuture) {
                    cellClass += "opacity-50 "; // Dim future dates if they somehow have activity
                  }
                } else {
                  cellClass += "bg-slate-700/50 ";
                  if (isFuture) {
                    cellClass += "opacity-30 ";
                  } else {
                    cellClass += "hover:bg-slate-600/50 ";
                  }
                }

                if (cell.isToday) {
                  cellClass += "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-800 z-10 ";
                }

                return (
                  <div 
                    key={cell.dateStr}
                    className="relative group"
                  >
                    <div 
                      className={cellClass}
                      onClick={() => cell.isActive && onOpenFile(`02_Daily/${cell.dateStr}.md`)}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700">
                      {cell.dateStr} {cell.isActive ? `(${t.heatmap.activeDays})` : `(${t.heatmap.noActivity})`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && !error && (
        <div className="text-xs text-slate-400 text-right mt-1 font-medium">
          {activeDaysCount} / {daysInMonth} {t.heatmap.activeDays} ({activityPercentage}%)
        </div>
      )}
    </div>
  );
};
