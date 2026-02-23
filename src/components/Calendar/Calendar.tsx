import { useState } from 'react';
import type { Booking } from '../Dashboard/Dashboard';
import Swal from 'sweetalert2';
import './Calendar.css';

interface CalendarProps {
  bookings?: Booking[];
  onDateSelection: (start: Date, end: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ bookings = [], onDateSelection }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selection state
  const [selectionRange, setSelectionRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null,
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Utility to check if a date is booked
  const isDateBooked = (date: Date) => {
    const checkTime = date.getTime();
    return bookings.some(b => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      bStart.setHours(0,0,0,0);
      bEnd.setHours(0,0,0,0);
      return checkTime >= bStart.getTime() && checkTime <= bEnd.getTime();
    });
  };

  const isRangeBooked = (start: Date, end: Date) => {
    const sTime = start.getTime();
    const eTime = end.getTime();
    return bookings.some(b => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      bStart.setHours(0,0,0,0);
      bEnd.setHours(0,0,0,0);
      const bsTime = bStart.getTime();
      const beTime = bEnd.getTime();
      
      // Overlap condition:
      // max(start, bsTime) <= min(end, beTime)
      return Math.max(sTime, bsTime) <= Math.min(eTime, beTime);
    });
  };

  const handleDayClick = (dayDate: Date) => {
    if (isDateBooked(dayDate)) {
      Swal.fire({
        icon: 'error',
        title: 'Data Indisponível',
        text: 'Não é possível agendar nesta data. Ela já está reservada.',
        confirmButtonColor: 'var(--primary-color)',
        width: '350px',
        padding: '1.5rem',
        customClass: {
          title: 'swal-compact-title',
          popup: 'swal-compact-popup'
        }
      });
      return;
    }

    // If we have both, start fresh
    if (selectionRange.start && selectionRange.end) {
      setSelectionRange({ start: dayDate, end: null });
      return;
    }

    // If we have start but no end
    if (selectionRange.start && !selectionRange.end) {
      // If clicked date is before start date, make the clicked date the new start date
      if (dayDate < selectionRange.start) {
        setSelectionRange({ start: dayDate, end: null });
      } else {
        // Check if the range intercepts any bookings
        if (isRangeBooked(selectionRange.start, dayDate)) {
           Swal.fire({
             icon: 'error',
             title: 'Período Indisponível',
             text: 'Não é possível agendar este período, pois intercepta uma reserva existente.',
             confirmButtonColor: 'var(--primary-color)',
             width: '350px',
             padding: '1.5rem',
             customClass: {
               title: 'swal-compact-title',
               popup: 'swal-compact-popup'
             }
           });
           setSelectionRange({ start: null, end: null });
           return;
        }

        setSelectionRange({ start: selectionRange.start, end: dayDate });
        // Optional timeout to allow user to see selection before redirect
        setTimeout(() => {
          onDateSelection(selectionRange.start!, dayDate);
        }, 300);
      }
      return;
    }

    // If we have nothing
    setSelectionRange({ start: dayDate, end: null });
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const thisDate = new Date(year, month, day);
        const isPast = thisDate < today;
        const isToday = thisDate.getTime() === today.getTime();
        
        // Range logic
        const tTime = thisDate.getTime();
        const startTime = selectionRange.start?.getTime();
        const endTime = selectionRange.end?.getTime();
        const hTime = hoverDate?.getTime();

        const isStart = startTime === tTime;
        const isEnd = endTime === tTime;
        
        let inRange = false;
        if (startTime && endTime) {
            inRange = tTime > startTime && tTime < endTime;
        } else if (startTime && hTime && !endTime) { // Hover preview
            if (hTime > startTime) {
                 inRange = tTime > startTime && tTime <= hTime;
            }
        }

        const isBooked = isDateBooked(thisDate);

        let dynamicClassNames = '';
        if (isPast) {
            dynamicClassNames += ' disabled';
        } else if (isBooked) {
            dynamicClassNames += ' booked-day';
        } else {
            dynamicClassNames += ' available';
            if (isStart) dynamicClassNames += ' start-date';
            if (isEnd) dynamicClassNames += ' end-date';
            if (inRange) dynamicClassNames += ' in-range';
            if (isToday) dynamicClassNames += ' today';
        }
        
        days.push(
            <div 
                key={day} 
                className={`calendar-day ${dynamicClassNames}`}
                onClick={() => !isPast && handleDayClick(thisDate)}
                onMouseEnter={() => !isPast && !isBooked && setHoverDate(thisDate)}
            >
                {day}
            </div>
        );
    }

    return days;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&lt;</button>
        <h3>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button onClick={nextMonth} className="nav-btn">&gt;</button>
      </div>
      <div className="calendar-grid days-header">
        {daysOfWeek.map(day => (
            <div key={day} className="day-name">{day}</div>
        ))}
      </div>
      <div className="calendar-grid days-body" onMouseLeave={() => setHoverDate(null)}>
         {renderDays()}
      </div>
      <div className="text-center helper-text" style={{ marginTop: '1rem' }}>
        {selectionRange.start && !selectionRange.end 
          ? "Selecione a data de saída" 
          : "Selecione a data de entrada"}
      </div>
    </div>
  );
};
