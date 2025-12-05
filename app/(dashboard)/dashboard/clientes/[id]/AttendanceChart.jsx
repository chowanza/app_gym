"use client";

import { useState, useMemo } from 'react';

export default function AttendanceChart({ attendance = [] }) {
  const [viewMode, setViewMode] = useState('month'); // 'years' | 'year' | 'month' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get start of week (Monday)
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  // Navigation handlers
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goUp = () => {
    if (viewMode === 'day') setViewMode('month');
    else if (viewMode === 'week') setViewMode('month');
    else if (viewMode === 'month') setViewMode('year');
    else if (viewMode === 'year') setViewMode('years');
  };

  // Data Indexing
  const dataMap = useMemo(() => {
    const map = {};
    attendance.forEach(a => {
      const d = new Date(a.checkInTime);
      const yearKey = d.getFullYear();
      const monthKey = `${yearKey}-${d.getMonth()}`;
      const dayKey = `${monthKey}-${d.getDate()}`;
      const hourKey = `${dayKey}-${d.getHours()}`;

      if (!map[yearKey]) map[yearKey] = 0;
      map[yearKey]++;

      if (!map[monthKey]) map[monthKey] = 0;
      map[monthKey]++;

      if (!map[dayKey]) map[dayKey] = 0;
      map[dayKey]++;

      if (!map[hourKey]) map[hourKey] = 0;
      map[hourKey]++;
    });
    return map;
  }, [attendance]);

  const getCount = (key) => dataMap[key] || 0;

  // Label for current period
  const periodLabel = useMemo(() => {
    if (viewMode === 'years') return 'Histórico';
    if (viewMode === 'year') return currentDate.getFullYear();
    if (viewMode === 'month') return currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    if (viewMode === 'week') {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} ${start.toLocaleString('es-ES', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('es-ES', { month: 'short' })}`;
    }
    if (viewMode === 'day') return currentDate.toLocaleDateString('es-ES', { dateStyle: 'full' });
  }, [viewMode, currentDate]);

  // Renderers
  const renderYears = () => {
    const years = Array.from(new Set(attendance.map(a => new Date(a.checkInTime).getFullYear()))).sort((a,b)=>a-b);
    if (years.length === 0) years.push(new Date().getFullYear());
    
    return (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {years.map(year => (
          <button 
            key={year} 
            onClick={() => { setCurrentDate(new Date(year, 0, 1)); setViewMode('year'); }}
            className="flex flex-col items-center justify-center rounded-xl border border-purple-100 bg-white p-6 hover:border-purple-300 hover:bg-purple-50 transition-all"
          >
            <span className="text-xl font-bold text-zinc-700">{year}</span>
            <span className="text-sm text-zinc-500">{getCount(year)} asistencias</span>
          </button>
        ))}
      </div>
    );
  };

  const renderYear = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({length: 12}, (_, i) => i);
    return (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {months.map(month => {
          const date = new Date(year, month, 1);
          const count = getCount(`${year}-${month}`);
          return (
            <button 
              key={month} 
              onClick={() => { setCurrentDate(date); setViewMode('month'); }}
              className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${count > 0 ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : 'border-zinc-100 bg-white hover:bg-zinc-50'}`}
            >
              <span className="font-semibold text-zinc-700 capitalize">{date.toLocaleString('es-ES', { month: 'long' })}</span>
              <span className={`text-xs ${count > 0 ? 'text-purple-600 font-bold' : 'text-zinc-400'}`}>{count} asistencias</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // 0=Mon

    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const blanks = Array.from({length: startOffset}, (_, i) => i);

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="w-full">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(d => <div key={d} className="text-center text-xs font-medium text-zinc-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}
          {days.map(day => {
            const count = getCount(`${year}-${month}-${day}`);
            return (
              <button 
                key={day}
                onClick={() => { setCurrentDate(new Date(year, month, day)); setViewMode('day'); }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border transition-all ${
                  count > 0 
                    ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900' 
                    : 'border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-500'
                }`}
              >
                <span className="text-sm font-medium">{day}</span>
                {count > 0 && (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDay = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const hours = Array.from({length: 24}, (_, i) => i);
    
    // Filter actual attendance records for this day
    const dayRecords = attendance.filter(a => {
      const d = new Date(a.checkInTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    }).sort((a,b) => new Date(a.checkInTime) - new Date(b.checkInTime));

    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {hours.map(hour => {
            const count = getCount(`${year}-${month}-${day}-${hour}`);
            return (
              <div 
                key={hour} 
                className={`flex flex-col items-center justify-center rounded-lg border p-2 ${
                  count > 0 ? 'border-purple-200 bg-purple-50' : 'border-zinc-100 bg-white opacity-60'
                }`}
              >
                <span className="text-xs text-zinc-500">{hour}:00</span>
                <span className={`text-sm font-bold ${count > 0 ? 'text-purple-700' : 'text-zinc-300'}`}>{count || '-'}</span>
              </div>
            );
          })}
        </div>
        
        {dayRecords.length > 0 && (
          <div className="mt-4 rounded-xl border border-purple-100 bg-white p-4">
            <h4 className="mb-3 text-sm font-medium text-zinc-500">Registros del día</h4>
            <div className="space-y-2">
              {dayRecords.map(record => (
                <div key={record._id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                  <span className="font-medium text-zinc-700">
                    {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span className="text-zinc-500">Asistencia registrada</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto">
          {['years', 'year', 'month', 'day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                viewMode === mode ? 'bg-white text-purple-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {mode === 'years' ? 'Histórico' : mode === 'year' ? 'Anual' : mode === 'month' ? 'Mensual' : 'Diario'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-lg px-2 py-1">
          {viewMode !== 'years' && (
            <button onClick={goUp} className="p-1 text-zinc-500 hover:text-purple-700 hover:bg-purple-50 rounded" title="Subir nivel">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>
          )}
          {viewMode !== 'years' && (
            <button onClick={() => navigate(-1)} className="p-1 text-zinc-500 hover:text-purple-700 hover:bg-purple-50 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <span className="text-sm font-semibold text-zinc-800 min-w-[140px] text-center capitalize">
            {periodLabel}
          </span>
          {viewMode !== 'years' && (
            <button onClick={() => navigate(1)} className="p-1 text-zinc-500 hover:text-purple-700 hover:bg-purple-50 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="min-h-[300px]">
        {viewMode === 'years' && renderYears()}
        {viewMode === 'year' && renderYear()}
        {viewMode === 'month' && renderMonth()}
        {viewMode === 'day' && renderDay()}
      </div>
      
      <div className="text-center text-sm text-zinc-500 mt-4">
        Total asistencias en este periodo: <span className="font-bold text-zinc-800">
          {viewMode === 'years' ? attendance.length : 
           viewMode === 'year' ? getCount(currentDate.getFullYear()) :
           viewMode === 'month' ? getCount(`${currentDate.getFullYear()}-${currentDate.getMonth()}`) :
           getCount(`${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`)
          }
        </span>
      </div>
    </div>
  );
}
