import React from 'react';
import { WorkDay } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarProps {
  displayDate: Date;
  onMonthChange: (newDate: Date) => void;
  workDays: WorkDay[];
  onDayClick: (date: string) => void;
  selectedDate: string | null;
}

const Calendar: React.FC<CalendarProps> = ({ displayDate, onMonthChange, workDays, onDayClick, selectedDate }) => {
  
  const handlePrevMonth = () => {
    onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    onMonthChange(new Date());
  };

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const monthName = displayDate.toLocaleString('tr-TR', { month: 'long' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: Sunday
  
  // Adjust so Monday is 0
  const dayOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

  const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const renderDays = () => {
    const days = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Days from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = dayOffset; i > 0; i--) {
        days.push(<div key={`prev-${i}`} className="p-2 text-center border rounded-md text-gray-300 bg-gray-50">{prevMonthLastDate - i + 1}</div>);
    }
    
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const workDayInfo = workDays.find(wd => wd.date === dateString);
      
      const isWorked = !!workDayInfo;
      const isSelected = selectedDate === dateString;
      const isToday = todayString === dateString;
      
      let dayClasses = 'p-2 text-center border rounded-md transition-colors duration-150 flex items-center justify-center aspect-square cursor-pointer relative';

      if (isToday) {
          dayClasses += ' border-blue-500 border-2';
      }
      
      if (isSelected) {
          dayClasses += ' bg-blue-500 text-white font-bold';
      } else if (isWorked) {
        dayClasses += ' bg-green-200 text-green-800 font-bold hover:bg-green-300';
      } else {
        dayClasses += ' bg-white hover:bg-gray-100';
      }

      days.push(
        <div key={day} className="relative group">
          <div
            className={dayClasses}
            onClick={() => onDayClick(dateString)}
            aria-label={`Ayın ${day}. günü`}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDayClick(dateString);
              }
            }}
          >
            {day}
          </div>
          {isWorked && (workDayInfo.location || workDayInfo.jobDescription) && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              {workDayInfo.location && <p className="font-semibold text-white">{workDayInfo.location}</p>}
              {workDayInfo.jobDescription && <p className="text-xs text-gray-300">{workDayInfo.jobDescription}</p>}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
            </div>
          )}
        </div>
      );
    }
    
    // Days from next month
    const totalGridCells = Math.ceil((dayOffset + daysInMonth) / 7) * 7;
    const nextMonthDays = totalGridCells - (dayOffset + daysInMonth);
    for (let i = 1; i <= nextMonthDays; i++) {
        days.push(<div key={`next-${i}`} className="p-2 text-center border rounded-md text-gray-300 bg-gray-50">{i}</div>);
    }


    return days;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{monthName} {year}</h3>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                Bugün
            </button>
            <button onClick={handlePrevMonth} aria-label="Önceki Ay" className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon className="h-6 w-6"/>
            </button>
            <button onClick={handleNextMonth} aria-label="Sonraki Ay" className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                <ChevronRightIcon className="h-6 w-6"/>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-bold text-gray-500 text-sm mb-2">{day}</div>
        ))}
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;
