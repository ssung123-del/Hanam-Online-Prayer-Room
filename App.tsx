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
          <div className="flex flex-col items-center h-full animate-fade-in pb-10">
            {/* Main Hero Section */}
            <div className="text-center space-y-4 mt-10 mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">
                우리의 기도를<br />
                <span className="text-indigo-900/80">기다리십니다.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                하남교구 성도님들과<br />
                따뜻한 마음을 나누어보세요.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-6 px-1 mb-12">
              <button
                onClick={() => setMode('ROOM')}
                className="w-full group relative overflow-hidden bg-white p-7 rounded-[2rem] shadow-lg shadow-indigo-900/5 border border-indigo-50 text-left transition-all hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative flex justify-between items-center z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-800 transition-colors">
                      중보 기도실 입장
                    </h3>
                    <p className="text-gray-500 mt-2 font-medium">이웃의 기도 제목 함께 보기</p>
                  </div>
                  <div className="w-16 h-16 bg-indigo-50/80 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-100 transition-colors">
                    <Users size={30} strokeWidth={2.5} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('WRITE')}
                className="w-full group relative overflow-hidden bg-white p-7 rounded-[2rem] shadow-lg shadow-amber-900/5 border border-amber-50 text-left transition-all hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative flex justify-between items-center z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
                      기도 제목 작성
                    </h3>
                    <p className="text-gray-500 mt-2 font-medium">나의 기도 제목 나누기</p>
                  </div>
                  <div className="w-16 h-16 bg-amber-50/80 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:bg-amber-100 transition-colors">
                    <PenTool size={30} strokeWidth={2.5} />
                  </div>
                </div>
              </button>
            </div>

            {/* User Guide Section */}
            <div className="w-full px-2">
              <div className="flex items-center space-x-2 mb-4 px-2 opacity-90">
                <Info size={18} className="text-gray-400" />
                <span className="text-gray-500 font-bold text-lg">이용 안내</span>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 space-y-8 border border-white shadow-sm">

                {/* Guide Item 1 */}
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-50 p-3 rounded-2xl shrink-0">
                    <ShieldCheck className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-1">개인정보는 안전해요</h4>
                    <p className="text-gray-500 leading-normal text-sm md:text-base">
                      입력하신 전화번호는 본인 확인용으로만 사용되며, <strong className="text-emerald-700 font-semibold">절대 공개되지 않습니다.</strong>
                    </p>
                  </div>
                </div>

                {/* Guide Item 2 */}
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-50 p-3 rounded-2xl shrink-0">
                    <EyeOff className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-1">비공개로 나눌 수 있어요</h4>
                    <p className="text-gray-500 leading-normal text-sm md:text-base">
                      나의 고민을 알리기 어렵다면 <strong className="text-orange-700 font-semibold">'교역자만 보기'</strong>를 선택하세요.
                    </p>
                  </div>
                </div>

                {/* Guide Item 3 */}
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                    <RefreshCw className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-1">수정도 간편해요</h4>
                    <p className="text-gray-500 leading-normal text-sm md:text-base">
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