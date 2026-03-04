export interface Prayer {
  id?: number;
  created_at?: string;
  name: string;
  phone: string;
  content: string;
  is_public: boolean;
  prayed_count?: number;        // 누적 총 기도 횟수 (영구 보존)
  daily_prayed_count?: number;  // 오늘 기도 횟수 (매일 자정 초기화)
  count_date?: string;          // daily_prayed_count의 기준 날짜 (YYYY-MM-DD)
}

export type AppMode = 'HOME' | 'WRITE' | 'ROOM';