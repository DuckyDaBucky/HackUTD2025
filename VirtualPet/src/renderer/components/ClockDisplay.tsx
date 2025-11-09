import { useEffect, useState } from 'react';

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export default function ClockDisplay() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="clock-widget" aria-label="Current time">
      <span className="clock-widget__time">{formatTime(now)}</span>
      <span className="clock-widget__date">{formatDate(now)}</span>
    </div>
  );
}


