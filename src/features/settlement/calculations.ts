export function calculateSettlement(totalFare: number, participantCount: number) {
  if (!Number.isSafeInteger(totalFare) || totalFare <= 0 || totalFare > 10000000) throw new Error('총 요금은 1~10,000,000원의 정수로 입력해 주세요.');
  if (!Number.isInteger(participantCount) || participantCount < 1 || participantCount > 4) throw new Error('정산 인원은 방장 포함 1~4명이어야 합니다.');
  return { totalFare, participantCount, farePerPerson: Math.floor(totalFare / participantCount), remainderFare: totalFare % participantCount };
}
