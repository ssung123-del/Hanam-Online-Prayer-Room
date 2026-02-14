import React, { useState } from 'react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import PrayerRoom from './components/PrayerRoom';
import { AppMode } from './types';
import { PenTool, Users, ShieldCheck, EyeOff, RefreshCw, Info } from 'lucide-react';

/**
 * 하남교구 공유 기도실 메인 앱
 * Main Application Component
 */
const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [heroImageError, setHeroImageError] = useState(false);
  const heroImagePath = '/hero-calligraphy-main.jpg';

  const handleNavigate = (newMode: AppMode) => {
    setMode(newMode);
  };

  const renderContent = () => {
    switch (mode) {
      case 'WRITE':
        return <PrayerForm onSuccess={() => setMode('HOME')} />;
      case 'ROOM':
        return <PrayerRoom onWrite={() => setMode('WRITE')} onReset={() => setMode('HOME')} />;
      case 'HOME':
      default:
        return (
          <div className="flex flex-col items-center h-full animate-fade-in pb-10 relative">
            <div className="absolute -top-4 left-0 w-36 h-36 bg-indigo-300/35 rounded-full blur-3xl animate-pulse-soft pointer-events-none" />
            <div className="absolute top-24 right-1 w-32 h-32 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-5 mt-8 mb-11 relative z-10">
              {!heroImageError ? (
                <img
                  src={heroImagePath}
                  alt="하나님이 함께하시니, 강하고 담대하라"
                  onError={() => setHeroImageError(true)}
                  className="w-full max-w-[34rem] mx-auto rounded-2xl shadow-[0_18px_30px_rgba(31,41,55,0.16)] ring-1 ring-white/90 bg-white"
                />
              ) : (
                <h2 className="text-[3.9rem] md:text-[5.2rem] font-brush text-[#1e2c4a] leading-[0.9] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">
                  하나님이 함께하시니<br />
                  <span className="text-indigo-900">강하고 담대하라</span>
                </h2>
              )}
              <p className="text-xl md:text-2xl text-[#667085] font-medium leading-relaxed">
                복음은 깊게, 사역은 넓게
              </p>
            </div>

            <div className="w-full space-y-5 px-1 mb-12 relative z-10">
              <button
                onClick={() => setMode('ROOM')}
                className="focus-ring tap-target press-feedback interactive-card w-full group relative overflow-hidden soft-card p-7 rounded-[2.1rem] text-left transition-all hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-200/50 rounded-full blur-3xl -mr-14 -mt-14 transition-transform group-hover:scale-110" />
                <div className="relative flex justify-between items-center z-10">
                  <div>
                    <span className="section-kicker">함께 기도하기</span>
                    <h3 className="text-3xl font-bold text-[#2c3b5f] mt-1 group-hover:text-indigo-800 transition-colors">
                      중보 기도실 입장
                    </h3>
                  </div>
                  <div className="w-[4.25rem] h-[4.25rem] bg-indigo-100/90 rounded-[1.35rem] flex items-center justify-center text-indigo-700 shadow-sm group-hover:bg-indigo-200 transition-colors">
                    <Users size={31} strokeWidth={2.5} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('WRITE')}
                className="focus-ring tap-target press-feedback interactive-card w-full group relative overflow-hidden soft-card p-7 rounded-[2.1rem] text-left transition-all hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-orange-200/50 rounded-full blur-3xl -mr-14 -mt-14 transition-transform group-hover:scale-110" />
                <div className="relative flex justify-between items-center z-10">
                  <div>
                    <span className="section-kicker">기도 요청 남기기</span>
                    <h3 className="text-3xl font-bold text-[#2c3b5f] mt-1 group-hover:text-amber-700 transition-colors">
                      기도 제목 작성
                    </h3>
                  </div>
                  <div className="w-[4.25rem] h-[4.25rem] bg-orange-100/90 rounded-[1.35rem] flex items-center justify-center text-orange-700 shadow-sm group-hover:bg-orange-200 transition-colors">
                    <PenTool size={31} strokeWidth={2.5} />
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full px-1 relative z-10">
              <div className="flex items-center space-x-2 mb-4 px-2 opacity-90">
                <Info size={20} className="text-[#6f78a2]" />
                <span className="text-[#5e6779] font-bold text-xl">이용 안내</span>
              </div>

              <div className="soft-card rounded-[2rem] p-6 md:p-7 space-y-7">
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 p-3.5 rounded-2xl shrink-0 shadow-inner">
                    <ShieldCheck className="text-emerald-700" size={25} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#28354f] text-xl mb-1">개인정보는 안전해요</h4>
                    <p className="text-[#606b80] leading-relaxed text-base md:text-lg">
                      입력하신 전화번호는 본인 확인용으로만 사용되며, <strong className="text-emerald-700 font-semibold">절대 공개되지 않습니다.</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3.5 rounded-2xl shrink-0 shadow-inner">
                    <EyeOff className="text-orange-700" size={25} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#28354f] text-xl mb-1">비공개로 나눌 수 있어요</h4>
                    <p className="text-[#606b80] leading-relaxed text-base md:text-lg">
                      나의 고민을 알리기 어렵다면 <strong className="text-orange-700 font-semibold whitespace-nowrap">교역자만 보기</strong>를 선택하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3.5 rounded-2xl shrink-0 shadow-inner">
                    <RefreshCw className="text-indigo-700" size={25} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#28354f] text-xl mb-1">수정도 간편해요</h4>
                    <p className="text-[#606b80] leading-relaxed text-base md:text-lg">
                      <strong className="text-blue-700 font-semibold">같은 이름과 전화번호</strong>로 다시 작성하시면 내용을 수정할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'WRITE': return '기도 제목 작성';
      case 'ROOM': return '중보 기도실';
      default: return '하남교구 온라인 기도실';
    }
  };

  return (
    <Layout mode={mode} onNavigate={handleNavigate} title={getTitle()}>
      {renderContent()}
    </Layout>
  );
};

export default App;
