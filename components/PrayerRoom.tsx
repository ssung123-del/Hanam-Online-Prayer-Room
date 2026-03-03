import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Prayer } from '../types';
import { Heart, Loader2, RefreshCw, Edit3, MessageSquarePlus, ChevronRight } from 'lucide-react';

/**
 * 날짜를 'YYYY.M.D' 형식으로 포맷팅하는 유틸 함수
 * 왜: 인라인 IIFE 대신 분리하여 가독성과 재사용성 향상
 */
const formatDate = (dateString?: string): string => {
  const d = new Date(dateString || Date.now());
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

interface PrayerRoomProps {
  onWrite: () => void;
  onReset: () => void;
}

const PrayerRoom: React.FC<PrayerRoomProps> = ({ onWrite, onReset }) => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0); // CSS 애니메이션 재실행용 키

  // 기도 내용 스크롤 영역 참조 — 다음 기도로 넘길 때 최상단으로 초기화하기 위해 사용
  const scrollRef = useRef<HTMLDivElement>(null);

  // "기도했습니다" 기능 관련 상태
  const [isPrayed, setIsPrayed] = useState(false);
  const [isUpdatingPrayer, setIsUpdatingPrayer] = useState(false);

  // Fisher-Yates 셔플: 배열을 무작위로 섞어주는 알고리즘
  // 왜 useCallback: 매 렌더링마다 함수가 재생성되는 것을 방지
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('is_public', true);

      if (error) throw error;

      // 가져온 기도제목을 랜덤 순서로 셔플하여 매번 다른 순서로 보이게 함
      const shuffled = shuffleArray(data || []);
      setPrayers(shuffled);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
      alert("기도 제목을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, []);

  // 기도 슬라이드가 바뀔 때:
  // 1. 이미 "기도했습니다"를 눌렀는지 확인
  // 2. 기도 내용 스크롤 + Layout 외부 스크롤 모두 최상단으로 초기화
  //
  // 왜 useEffect: key={fadeKey}로 DOM이 재생성되므로, 렌더링 완료 후에
  // 새로운 DOM 요소를 대상으로 스크롤을 초기화해야 정상 동작함.
  // (handleNext에서 동기적으로 호출하면 이미 파괴될 이전 DOM 요소에 적용되어 무효)
  useEffect(() => {
    if (prayers.length > 0 && currentIndex < prayers.length) {
      const currentPrayer = prayers[currentIndex];
      const storageKey = `prayed_${currentPrayer.id}`;
      const hasPrayed = localStorage.getItem(storageKey) === 'true';
      setIsPrayed(hasPrayed);
    }

    // 기도 내용 내부 스크롤 초기화
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    // Layout의 <main> 외부 스크롤 컨테이너도 최상단으로
    // 왜: 모바일에서 "다음기도 보기" 버튼까지 스크롤한 상태이면,
    //     다음 기도가 화면 하단에 맞춰진 채로 보이는 문제 해결
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [currentIndex, prayers]);

  const handleNext = () => {
    setFadeKey(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrayClick = async () => {
    if (isUpdatingPrayer || currentIndex >= prayers.length) return;

    const currentPrayer = prayers[currentIndex];
    const prayerId = currentPrayer.id!;
    const storageKey = `prayed_${prayerId}`;

    // 낙관적 UI 업데이트: 서버 응답 전에 화면을 먼저 갱신하여 즉각적인 피드백 제공
    const newStatus = !isPrayed;
    const originalCount = currentPrayer.prayed_count || 0;
    const newCount = newStatus ? originalCount + 1 : Math.max(0, originalCount - 1);

    setIsPrayed(newStatus);
    setIsUpdatingPrayer(true); // 중복 클릭 방지

    // 로컬 상태 배열 업데이트
    const updatedPrayers = [...prayers];
    updatedPrayers[currentIndex] = {
      ...currentPrayer,
      prayed_count: newCount
    };
    setPrayers(updatedPrayers);

    // 로컬 스토리지 업데이트 (브라우저 재방문 시에도 기도 여부 유지)
    if (newStatus) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }

    // 백엔드(Supabase) 업데이트
    try {
      const { error } = await supabase
        .from('prayers')
        .update({ prayed_count: newCount })
        .eq('id', prayerId);

      if (error) throw error;
    } catch (err) {
      console.error('기도 카운트 업데이트 실패:', err);
      // 왜 롤백: 서버 저장 실패 시 UI만 바뀌고 DB는 그대로이면 불일치 발생
      // → 원래 상태로 되돌려 사용자에게 정확한 정보 표시
      setIsPrayed(!newStatus);
      updatedPrayers[currentIndex] = { ...currentPrayer, prayed_count: originalCount };
      setPrayers(updatedPrayers);
    } finally {
      setIsUpdatingPrayer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="w-20 h-20 rounded-full bg-indigo-100/70 flex items-center justify-center shadow-inner">
          <Loader2 className="animate-spin text-indigo-700" size={42} />
        </div>
        <p className="text-[#5f6880] text-xl font-medium">기도 제목을 불러오고 있습니다...</p>
      </div>
    );
  }

  // Case 1: No prayers exist at all
  if (prayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in pb-10 px-4">
        <div className="bg-gray-100 p-8 rounded-full mb-8 shadow-inner">
          <MessageSquarePlus className="text-gray-500" size={64} />
        </div>
        <h2 className="text-3xl font-bold text-[#25344f] mb-4">아직 기도 제목이 없어요</h2>
        <p className="text-xl text-[#606b80] mb-10 leading-relaxed">
          가장 먼저 기도를 올려주세요.<br />
          성도님들과 함께 기도하겠습니다.
        </p>

        <button
          onClick={onWrite}
          className="focus-ring tap-target press-feedback w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-5 rounded-[1.6rem] shadow-xl shadow-indigo-300/40 flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform"
        >
          <Edit3 size={24} />
          <span>첫 번째 기도제목 올리기</span>
        </button>
      </div>
    );
  }

  // Case 2: Read all prayers
  if (currentIndex >= prayers.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in pb-10 px-4">
        <div className="bg-white/90 p-8 rounded-full mb-8 shadow-sm border border-white">
          <Heart className="text-red-500 fill-red-100" size={64} />
        </div>
        <h2 className="text-4xl font-bold text-[#25344f] mb-4 tracking-tight">모두 완료!</h2>
        <p className="text-xl text-[#606b80] mb-10 leading-relaxed">
          공유된 모든 기도 제목을<br />다 보셨습니다.<br />함께 기도해주셔서 감사합니다.
        </p>

        <div className="flex flex-col space-y-4 w-full px-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setFadeKey(prev => prev + 1);
              // 스크롤 초기화는 currentIndex 변경 시 useEffect에서 자동 처리
            }}
            className="focus-ring tap-target press-feedback w-full bg-white text-[#263451] text-xl font-bold py-5 rounded-[1.6rem] shadow-sm border-2 border-gray-200 flex items-center justify-center space-x-3 active:bg-gray-50 transition-colors"
          >
            <RefreshCw size={24} />
            <span>처음부터 다시 보기</span>
          </button>

          <button
            onClick={onWrite}
            className="focus-ring tap-target press-feedback w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-5 rounded-[1.6rem] shadow-xl shadow-indigo-300/40 flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform"
          >
            <Edit3 size={24} />
            <span>나도 기도제목 올리기</span>
          </button>
        </div>
      </div>
    );
  }

  const currentPrayer = prayers[currentIndex];

  return (
    <div className="flex flex-col h-full justify-between pb-4">
      <div className="flex justify-center mb-4 shrink-0">
        <span className="bg-white/95 border border-white px-4 py-2 rounded-full text-base font-bold text-[#54607a] shadow-sm">
          {currentIndex + 1}번째 / 총 {prayers.length}개
        </span>
      </div>

      <div
        key={fadeKey}
        className="glass-card p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white/80 flex-1 flex flex-col relative overflow-hidden animate-slide-up mb-6 group ring-1 ring-white/60"
      >
        <div className="absolute top-6 left-8 text-7xl text-indigo-100/90 font-display leading-none select-none -z-10">“</div>
        <div className="absolute -top-14 -right-8 w-36 h-36 bg-indigo-200/45 rounded-full blur-3xl -z-10" />

        {/* 이름/날짜 헤더 — 모바일에서 줄바꿈 방지를 위해 2줄 구성 */}
        <div className="mb-6 border-b border-gray-100/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center border border-indigo-50 shadow-sm shrink-0">
                <span className="text-indigo-600 font-bold text-base">
                  {currentPrayer.name.slice(0, 1)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[1.55rem] text-[#263451] tracking-tight">
                  {currentPrayer.name}
                </span>
                <span className="text-lg font-normal text-[#667085] ml-1">님의 기도제목</span>
              </div>
            </div>
            {/* 날짜 — whitespace-nowrap으로 줄바꿈 완전 차단 */}
            <span className="text-sm font-medium text-[#707b8f] bg-gray-50 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ml-2">
              {formatDate(currentPrayer.created_at)}
            </span>
          </div>
        </div>

        {/* 기도 내용 스크롤 영역 — 상/하단 페이드 마스크로 가독성 향상 */}
        <div className="relative flex-1 min-h-0">
          <div ref={scrollRef} className="scroll-surface h-full overflow-y-auto scrollbar-hide px-1">
            <p className="text-2xl md:text-3xl text-[#273142] leading-relaxed font-sans font-medium break-keep whitespace-pre-wrap tracking-tight py-1">
              {currentPrayer.content}
            </p>
          </div>
          {/* 상단 페이드 */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/60 to-transparent" />
          {/* 하단 페이드 */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent" />
        </div>

        <div className="absolute bottom-32 right-8 text-7xl text-indigo-100/90 font-display leading-none select-none -z-10 rotate-180">“</div>

        <div className="mt-auto shrink-0 z-20 flex justify-end pt-6">
          <button
            onClick={handlePrayClick}
            disabled={isUpdatingPrayer}
            className={`
              focus-ring tap-target press-feedback relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full transition-all duration-300 shadow-md active:scale-95
              ${isPrayed
                ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-200'
                : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <Heart
              size={18}
              className={`transition-transform duration-300 ${isPrayed ? 'fill-rose-500 text-rose-500 scale-110' : 'text-gray-400'}`}
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold">
                {isPrayed ? '기도했습니다' : '기도하기'}
              </span>
              <span className={`text-sm font-medium ${isPrayed ? 'text-rose-400' : 'text-gray-400'}`}>
                {currentPrayer.prayed_count || 0}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-2 shrink-0 px-2">
        <button
          onClick={handleNext}
          className="focus-ring tap-target press-feedback w-full bg-white/70 hover:bg-white text-[#55607a] hover:text-[#263451] text-xl font-bold py-5 rounded-[2rem] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group border border-transparent hover:border-gray-200 hover:shadow-lg"
        >
          <span>다음 기도 보기</span>
          <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );
};

export default PrayerRoom;
