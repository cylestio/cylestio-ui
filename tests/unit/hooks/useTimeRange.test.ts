import { renderHook, act } from '@testing-library/react';
import { useTimeRange } from '@/hooks/useTimeRange';

describe('useTimeRange', () => {
  // Mock current date for consistent testing
  const mockDate = new Date('2023-01-01T12:00:00Z');
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should initialize with default time range (24h)', () => {
    const { result } = renderHook(() => useTimeRange());
    
    expect(result.current.range).toBe('24h');
    
    // Check if startTime is set to 24 hours before current time
    const expectedStartTime = new Date(mockDate);
    expectedStartTime.setHours(expectedStartTime.getHours() - 24);
    
    expect(result.current.startTime.getTime()).toBe(expectedStartTime.getTime());
    expect(result.current.endTime.getTime()).toBe(mockDate.getTime());
  });

  it('should initialize with specified time range', () => {
    const { result } = renderHook(() => useTimeRange({ defaultRange: '7d' }));
    
    expect(result.current.range).toBe('7d');
    
    // Check if startTime is set to 7 days before current time
    const expectedStartTime = new Date(mockDate);
    expectedStartTime.setDate(expectedStartTime.getDate() - 7);
    
    expect(result.current.startTime.getTime()).toBe(expectedStartTime.getTime());
    expect(result.current.endTime.getTime()).toBe(mockDate.getTime());
  });

  it('should update time range when setRange is called', () => {
    const { result } = renderHook(() => useTimeRange());
    
    // Initially 24h
    expect(result.current.range).toBe('24h');
    
    // Change to 7d
    act(() => {
      result.current.setRange('7d');
    });
    
    expect(result.current.range).toBe('7d');
    
    // Check if startTime is updated to 7 days before current time
    const expectedStartTime = new Date(mockDate);
    expectedStartTime.setDate(expectedStartTime.getDate() - 7);
    
    expect(result.current.startTime.getTime()).toBe(expectedStartTime.getTime());
  });

  it('should set custom time range correctly', () => {
    const { result } = renderHook(() => useTimeRange());
    
    const customStart = new Date('2022-12-15T00:00:00Z');
    const customEnd = new Date('2022-12-31T23:59:59Z');
    
    act(() => {
      result.current.setCustomTimeRange(customStart, customEnd);
    });
    
    expect(result.current.range).toBe('custom');
    expect(result.current.startTime.getTime()).toBe(customStart.getTime());
    expect(result.current.endTime.getTime()).toBe(customEnd.getTime());
  });
}); 