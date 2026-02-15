import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date | null) => void; // null means select whole month
  transactions?: any[]; // Optional: to show dots on days with data
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, currentDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  if (!isOpen) return null;

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           viewDate.getMonth() === today.getMonth() && 
           viewDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === currentDate.getDate() && 
           viewDate.getMonth() === currentDate.getMonth() && 
           viewDate.getFullYear() === currentDate.getFullYear();
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onSelectDate(newDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
           <h3 className="text-lg font-bold text-white pl-2">Select Date</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
             <X size={20} />
           </button>
        </div>

        {/* Month Nav */}
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-300">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-semibold text-lg">
            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-300">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days Grid */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-7 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;
              
              const today = isToday(day);
              const selected = isSelected(day); // This logic might need adjustment if we want to show 'selected' only if specifically filtering by day. 
              
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all
                    ${selected ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}
                    ${!selected && today ? 'bg-slate-800 text-primary border border-primary/30' : ''}
                    ${!selected && !today ? 'text-slate-300 hover:bg-slate-800' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-center">
            <button 
              onClick={() => {
                onSelectDate(null); // Signal to show whole month
                onClose();
              }}
              className="text-sm text-primary font-medium hover:text-indigo-400"
            >
              Show Whole Month
            </button>
        </div>

      </div>
    </div>
  );
};