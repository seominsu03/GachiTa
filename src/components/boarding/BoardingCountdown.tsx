import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatBoardingTime, getRemainingSeconds } from '@/features/boarding/countdown';
import { CHAT_COLORS as colors } from '@/features/chat/theme';

type Props = { expiresAt: number; onExpire: () => void };

export function BoardingCountdown({ expiresAt, onExpire }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const expiryReportedRef = useRef(false);
  const remaining = getRemainingSeconds(expiresAt, now);

  useEffect(() => {
    expiryReportedRef.current = false;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (remaining === 0 && !expiryReportedRef.current) {
      expiryReportedRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);

  return <Text accessibilityLabel={`탑승 확인 남은 시간 ${formatBoardingTime(remaining)}`} style={styles.time}>{formatBoardingTime(remaining)}</Text>;
}

const styles = StyleSheet.create({
  time: { color: colors.primary, fontSize: 17, lineHeight: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
