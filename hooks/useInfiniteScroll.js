
import { useState, useEffect, useCallback, useRef } from 'react';

export function useInfiniteScroll({
  fetchMore,
  hasNextPage,
  threshold = 1000,
  throttleMs = 100
}) {
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (isFetchingRef.current || !hasNextPage) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    if (distanceFromBottom < threshold) {
      setIsFetching(true);
      isFetchingRef.current = true;
      
      fetchMore().finally(() => {
        setIsFetching(false);
        isFetchingRef.current = false;
      });
    }
  }, [fetchMore, hasNextPage, threshold]);

  useEffect(() => {
    let timeoutId;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, throttleMs);
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleScroll, throttleMs]);

  return { isFetching };
}
