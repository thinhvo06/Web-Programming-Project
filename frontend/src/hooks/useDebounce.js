import { useState, useEffect } from 'react';

/**
 * Hook tùy chỉnh cho việc debounce giá trị (dùng cho Live Search 300ms và Auto-save)
 * @param {any} value Giá trị cần debounce
 * @param {number} delay Thời gian hoãn (ms), mặc định 300ms theo yêu cầu đề bài
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
