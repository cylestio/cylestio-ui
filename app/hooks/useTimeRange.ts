import { useState, useMemo } from 'react';

type TimeRange = '24h' | '7d' | '30d' | 'custom';

interface TimeRangeOptions {
  defaultRange?: TimeRange;
}

interface UseTimeRangeReturn {
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  startTime: Date;
  endTime: Date;
  setCustomTimeRange: (start: Date, end: Date) => void;
}

export function useTimeRange(options: TimeRangeOptions = {}): UseTimeRangeReturn {
  const { defaultRange = '24h' } = options;
  
  const [range, setRange] = useState<TimeRange>(defaultRange);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  
  const { startTime, endTime } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    
    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case 'custom':
        return {
          startTime: customStart || start,
          endTime: customEnd || end
        };
    }
    
    return { startTime: start, endTime: end };
  }, [range, customStart, customEnd]);
  
  const setCustomTimeRange = (start: Date, end: Date) => {
    setCustomStart(start);
    setCustomEnd(end);
    setRange('custom');
  };
  
  return {
    range,
    setRange,
    startTime,
    endTime,
    setCustomTimeRange
  };
} 