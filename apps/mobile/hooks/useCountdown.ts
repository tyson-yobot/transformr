import { useState, useEffect, useCallback } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';

interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  isExpired: boolean;
  label: string;
}

export function useCountdown(targetDate: string | null): CountdownValue {
  const calculate = useCallback((): CountdownValue => {
    if (!targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isExpired: true, label: 'No target set' };
    }

    const target = parseISO(targetDate);
    const now = new Date();

    if (target <= now) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isExpired: true, label: 'Target reached!' };
    }

    const totalDays = differenceInDays(target, now);
    const totalHours = differenceInHours(target, now) % 24;
    const totalMinutes = differenceInMinutes(target, now) % 60;
    const totalSeconds = differenceInSeconds(target, now) % 60;

    let label: string;
    if (totalDays > 365) {
      const years = Math.floor(totalDays / 365);
      const remainingDays = totalDays % 365;
      label = `${years}y ${remainingDays}d`;
    } else if (totalDays > 30) {
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      label = `${months}mo ${remainingDays}d`;
    } else {
      label = `${totalDays}d ${totalHours}h`;
    }

    return {
      days: totalDays,
      hours: totalHours,
      minutes: totalMinutes,
      seconds: totalSeconds,
      totalDays,
      isExpired: false,
      label,
    };
  }, [targetDate]);

  const [countdown, setCountdown] = useState<CountdownValue>(calculate);

  useEffect(() => {
    setCountdown(calculate());
    const interval = setInterval(() => {
      setCountdown(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return countdown;
}
