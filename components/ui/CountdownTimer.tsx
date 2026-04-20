"use client";

import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  from: string;
  to: string;
  bgColor?: string;
  textColor?: string;
}

type TimeLeft = {
  days: number;
  hours: number;
  mins: number;
  secs: number;
};

export default function CountdownTimer({ from, to, bgColor, textColor }: CountdownTimerProps) {
  const getTargetDate = () => {
    const now = new Date();
    const start = new Date(from);
    const end = new Date(to);

    if (now < start) return start; // countdown to start
    if (now >= start && now < end) return end; // countdown to end
    return null; // expired
  };

  const calculateTimeLeft = (): TimeLeft | null => {
    const target = getTargetDate();
    if (!target) return null;

    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    calculateTimeLeft()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="timer">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div 
          className="time-box" 
          key={unit}
          style={{
            backgroundColor: bgColor || undefined,
            color: textColor || undefined,
          }}
        >
          <h2 style={{ color: textColor || undefined }}>{String(value).padStart(2, "0")}</h2>
          <p style={{ color: textColor || undefined }}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</p>
        </div>
      ))}
    </div>
  );
}
