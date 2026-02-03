
import { Prize } from './types';

export const PRIZES: Prize[] = [
  { id: 2, label: '幸運 20', value: 20, color: '#ec4899', probability: 0.05, description: '太棒了！20 樂透金入袋。' },
  { id: 3, label: '驚喜 15', value: 15, color: '#8b5cf6', probability: 0.10, description: '手氣不錯！獲得 15 樂透金。' },
  { id: 4, label: '確幸 10', value: 10, color: '#30b2f6', probability: 0.40, description: '生活小確幸！10 樂透金送給你。' },
  { id: 5, label: '福氣 5', value: 5, color: '#10b981', probability: 0.45, description: '再接再厲！5 樂透金入手。' },
];

export const PRIZE_GREETINGS: Record<number, string> = {
  20: "一馬當先，財源廣進！恭喜獲得 20 樂透金，祝您馬年行大運，發財順利！",
  15: "萬馬奔騰，喜事重重！獲得 15 樂透金，願您馬年吉祥如意，福氣滿門！",
  10: "千馬奔騰，吉祥平安！獲得 10 樂透金，祝您馬年身體健康，萬事勝意！",
  5: "馬力十足，好運連連！獲得 5 樂透金，小確幸也能馬到成功，喜氣洋洋！"
};
