import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Refresh when returning from another screen, and ignore responses after blur.
export function useRemote<T>(load: () => Promise<T>) {
  const [snapshot, setSnapshot] = useState<{ source: () => Promise<T>; data: T } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true); setError(null);
    try {
      const data = await load();
      if (current === sequence.current) setSnapshot({ source: load, data });
    } catch (failure) {
      if (current === sequence.current) setError(failure instanceof Error ? failure.message : '데이터를 불러오지 못했어요.');
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [load]);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { sequence.current++; };
  }, [refresh]));
  // Never display data from a previous route or signed-in account.
  return { data: snapshot?.source === load ? snapshot.data : null, loading, error, refresh };
}
