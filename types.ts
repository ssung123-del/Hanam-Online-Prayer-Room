export interface Prayer {
  id?: number;
  created_at?: string;
  name: string;
  phone: string;
  content: string;
  is_public: boolean;
  prayed_count?: number; // 함께 기도한 횟수
}

export type AppMode = 'HOME' | 'WRITE' | 'ROOM';