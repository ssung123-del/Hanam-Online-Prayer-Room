import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Prayer } from '../types';
import { Heart, Loader2, RefreshCw, Edit3, MessageSquarePlus, ChevronRight } from 'lucide-react';

interface PrayerRoomProps {
  onWrite: () => void;
  onReset: () => void;
}

const PrayerRoom: React.FC<PrayerRoomProps> = ({ onWrite, onReset }) => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0); // Used to trigger CSS animation reset

  // State for the "I Prayed" feature
  const [isPrayed, setIsPrayed] = useState(false);
  const [isUpdatingPrayer, setIsUpdatingPrayer] = useState(false);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrayers(data || []);
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

  // Check if current prayer is already prayed for when slide changes
  useEffect(() => {
    if (prayers.length > 0 && currentIndex < prayers.length) {
      const currentPrayer = prayers[currentIndex];
      const storageKey = `prayed_${currentPrayer.id}`;
      const hasPrayed = localStorage.getItem(storageKey) === 'true';
      setIsPrayed(hasPrayed);
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

    // Optimistic UI Update (화면 먼저 갱신)
    const newStatus = !isPrayed;
    const originalCount = currentPrayer.prayed_count || 0;
    const newCount = newStatus ? originalCount + 1 : Math.max(0, originalCount - 1);

    setIsPrayed(newStatus);
    setIsUpdatingPrayer(true); // Prevent double clicking

    // Update Local State array
    const updatedPrayers = [...prayers];
    updatedPrayers[currentIndex] = {
      ...currentPrayer,
      prayed_count: newCount
    };
    setPrayers(updatedPrayers);

    // Local Storage Update
    if (newStatus) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }

    // Backend Update
    try {
      const { error } = await supabase
        .from('prayers')
        .update({ prayed_count: newCount })
        .eq('id', prayerId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update prayer count", err);
      // Rollback on error (Silent fail usually okay for this feature, but good to know)
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
        <Loader2 className="animate-spin text-ios-blue" size={48} />
        <p className="text-gray-500 text-xl font-medium">기도 제목을 불러오고 있습니다...</p>
      </div>
    );
  }

  // Case 1: No prayers exist at all
  if (prayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in pb-10 px-4">
        <div className="bg-gray-100 p-8 rounded-full mb-8 shadow-sm">
          <MessageSquarePlus className="text-gray-400" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">아직 기도 제목이 없어요</h2>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          가장 먼저 기도를 올려주세요.<br />
          성도님들과 함께 기도하겠습니다.
        </p>

        <button
          onClick={onWrite}
          className="w-full bg-[#007AFF] text-white text-xl font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform"
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
        <div className="bg-white/80 p-8 rounded-full mb-8 shadow-sm">
          <Heart className="text-red-500 fill-red-100" size={64} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">모두 완료!</h2>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          공유된 모든 기도 제목을<br />다 보셨습니다.<br />함께 기도해주셔서 감사합니다.
        </p>

        <div className="flex flex-col space-y-4 w-full px-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setFadeKey(prev => prev + 1);
            }}
            className="w-full bg-white text-gray-900 text-xl font-bold py-5 rounded-2xl shadow-sm border-2 border-gray-200 flex items-center justify-center space-x-3 active:bg-gray-50 transition-colors"
          >
            <RefreshCw size={24} />
            <span>처음부터 다시 보기</span>
          </button>

          <button
            onClick={onWrite}
            className="w-full bg-[#007AFF] text-white text-xl font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform"
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
      {/* Progress Indicator */}
      <div className="flex justify-center mb-4 shrink-0">
        <span className="bg-gray-200 px-4 py-1.5 rounded-full text-sm md:text-base font-bold text-gray-600">
          {currentIndex + 1}번째 / 총 {prayers.length}개
        </span>
      </div>

      {/* Card */}
      <div
        key={fadeKey}
        className="glass-card p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white/80 flex-1 flex flex-col relative overflow-hidden animate-slide-up mb-6 group ring-1 ring-white/60"
      >
        {/* Decorative Quote */}
        <div className="absolute top-6 left-8 text-6xl text-indigo-100 font-serif leading-none select-none -z-10">“</div>

        {/* Header: Name & Date */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center border border-indigo-50 shadow-sm">
              <span className="text-indigo-600 font-bold text-sm">
                {currentPrayer.name.slice(0, 1)}
              </span>
            </div>
            <span className="font-bold text-2xl text-gray-900 tracking-tight">
              {currentPrayer.name} <span className="text-lg font-normal text-gray-500">님의 기도제목</span>
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            {new Date(currentPrayer.created_at || Date.now()).toLocaleDateString().slice(0, -1)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-1">
          <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-sans font-medium break-keep whitespace-pre-wrap tracking-tight">
            {currentPrayer.content}
          </p>
        </div>

        {/* Bottom Decorative Quote */}
        <div className="absolute bottom-32 right-8 text-6xl text-indigo-100 font-serif leading-none select-none -z-10 rotate-180">“</div>

        {/* 'I Prayed' Action Area - Bottom Right */}
        <div className="mt-auto shrink-0 z-20 flex justify-end pt-6">
          <button
            onClick={handlePrayClick}
            disabled={isUpdatingPrayer}
            className={`
              relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-full transition-all duration-300 shadow-md active:scale-95
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
              <span className="text-sm font-bold">
                {isPrayed ? '기도했습니다' : '기도하기'}
              </span>
              <span className={`text-xs font-medium ${isPrayed ? 'text-rose-400' : 'text-gray-400'}`}>
                {currentPrayer.prayed_count || 0}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-2 shrink-0 px-2">
        <button
          onClick={handleNext}
          className="w-full bg-white/60 hover:bg-white text-gray-600 hover:text-gray-900 text-xl font-bold py-5 rounded-[2rem] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group border border-transparent hover:border-gray-200 hover:shadow-lg"
        >
          <span>다음 기도 보기</span>
          <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );
};

export default PrayerRoom;