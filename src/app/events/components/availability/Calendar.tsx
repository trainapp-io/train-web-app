import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

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

  const getCurrentWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const isCurrentWeek = (date: Date) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return date >= startOfWeek && date <= endOfWeek;
  };

  const dateToString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const hasAvailability = (date: Date) => {
    return availabilityDates.has(dateToString(date));
  };

  const renderCurrentWeek = () => {
    const weekDates = getCurrentWeekDates();
    
    return weekDates.map((date, index) => {
      const isCurrentDay = isToday(date);
      const isSelected = isSelectedDate(date);
      const hasSlots = hasAvailability(date);

      const classNames = [
        'calendar-day',
        isCurrentDay ? 'today' : '',
        isSelected ? 'selected' : '',
        !hasSlots ? 'no-availability' : 'has-availability'
      ].filter(Boolean).join(' ');

      return (
        <div
          key={index}
          className={classNames}
          onClick={() => onDateSelect(date)}
        >
          {date.getDate()}
        </div>
      );
    });
  };

  const renderFullMonth = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];

    // Empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isCurrentDay = isToday(date);
      const isSelected = isSelectedDate(date);
      const inCurrentWeek = isCurrentWeek(date);
      const hasSlots = hasAvailability(date);

      const classNames = [
        'calendar-day',
        isCurrentDay ? 'today' : '',
        isSelected ? 'selected' : '',
        inCurrentWeek ? 'current-week' : '',
        !hasSlots ? 'no-availability' : 'has-availability'
      ].filter(Boolean).join(' ');

      days.push(
        <div
          key={day}
          className={classNames}
          onClick={() => onDateSelect(date)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-month-selector" onClick={() => setIsExpanded(!isExpanded)}>
          <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
          <span className={`dropdown-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
        <div className="calendar-nav">
          <button onClick={() => onMonthChange('prev')} className="nav-btn">
            ‹
          </button>
          <button onClick={() => onMonthChange('next')} className="nav-btn">
            ›
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}
        {isExpanded ? renderFullMonth() : renderCurrentWeek()}
      </div>
      {!isExpanded && (
        <div className="calendar-expand-btn" onClick={() => setIsExpanded(true)}>
          <span>▼</span>
        </div>
      )}
    </div>
  );
};
