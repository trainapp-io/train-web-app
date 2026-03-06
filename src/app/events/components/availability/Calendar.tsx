import React from 'react';
import './Calendar.css';

interface CalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  availabilityDates: Set<string>;
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  currentMonth,
  selectedDate,
  availabilityDates,
  onDateSelect,
  onMonthChange,
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const dateToString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const hasAvailability = (date: Date) => availabilityDates.has(dateToString(date));

  const renderMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = isToday(date);
      const selected = isSelectedDate(date);
      const hasSlots = hasAvailability(date);

      const className = [
        'calendar-day',
        today ? 'today' : '',
        selected ? 'selected' : '',
        hasSlots ? 'has-availability' : 'no-availability',
      ].filter(Boolean).join(' ');

      days.push(
        <div key={day} className={className} onClick={() => onDateSelect(date)}>
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => onMonthChange('prev')}>‹</button>
          <button className="nav-btn" onClick={() => onMonthChange('next')}>›</button>
        </div>
      </div>

      <div className="calendar-days-header">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>
      <div
        className="calendar-days-body"
        key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
      >
        {renderMonth()}
      </div>
    </div>
  );
};
