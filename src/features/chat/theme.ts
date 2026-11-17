export const CHAT_COLORS = {
  background: '#FFFFFF', surface: '#F7F9FE', border: '#DEE5F1',
  text: '#17243D', secondary: '#64748B', primary: '#2864F5',
  primarySoft: '#EBF1FF', white: '#FFFFFF', disabled: '#DCE4F2',
} as const;

export function chatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
