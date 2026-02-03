
export interface Prize {
  id: number;
  label: string;
  value: number;
  color: string;
  probability: number;
  description: string;
}

export interface WonPrize {
  id: string;
  prizeId: number;
  label: string;
  value: number;
  timestamp: number;
  aiMessage?: string;
  synced?: boolean;
}
