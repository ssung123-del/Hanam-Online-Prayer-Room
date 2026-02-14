import React, { ReactNode } from 'react';
import { AppMode } from '../types';
import { ArrowLeft, Home } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  mode: AppMode;
  onNavigate: (mode: AppMode) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, mode, onNavigate, title }) => {
  return (
    <div className="min-h-screen w-full md:flex md:items-center md:justify-center font-sans relative z-10">
      <div className="w-full h-[100dvh] md:h-[88vh] md:max-w-[29rem] lg:max-w-[32rem] bg-[#fcfaf6] md:rounded-[2.5rem] shadow-[0_30px_60px_rgba(17,24,39,0.18)] overflow-hidden flex flex-col relative ring-1 ring-[#ffffffb8]">
        <header className="sticky top-0 z-50 glass-card px-5 md:px-6 h-[4.75rem] flex items-center justify-between shrink-0 border-b border-[#e5e8f0]">
          <div className="flex items-center w-14">
            {mode !== 'HOME' && (
              <button 
                onClick={() => onNavigate('HOME')}
                className="focus-ring tap-target press-feedback w-11 h-11 rounded-2xl bg-white/85 text-gray-600 hover:text-gray-900 hover:bg-white transition-all grid place-items-center shadow-sm border border-white/80"
                aria-label="뒤로 가기"
              >
                <ArrowLeft size={26} />
              </button>
            )}
          </div>
          
          <h1 className="text-[1.35rem] md:text-[1.5rem] font-bold text-[#28344c] truncate flex-1 text-center tracking-tight">
            {title}
          </h1>

          <div className="flex items-center justify-end w-14">
            {mode !== 'HOME' && (
              <button 
                onClick={() => onNavigate('HOME')}
                className="focus-ring tap-target press-feedback w-11 h-11 rounded-2xl bg-white/85 text-gray-600 hover:text-gray-900 hover:bg-white transition-all grid place-items-center shadow-sm border border-white/80"
                aria-label="홈으로"
              >
                <Home size={24} />
              </button>
            )}
          </div>
        </header>

        <main className="scroll-surface flex-1 overflow-y-auto scrollbar-hide bg-[linear-gradient(180deg,#fefcf8_0%,#fbf7ef_100%)]">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-6 md:p-7">
              {children}
            </div>
            
            <footer className="py-8 text-center text-base text-[#737b89] mt-auto bg-transparent">
              <p className="font-medium tracking-tight">오륜교회 하남교구 © 2026</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
