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
    // Outer Container: Handles background for desktop and centering
    <div className="min-h-screen w-full bg-[#F5F5F0] md:flex md:items-center md:justify-center font-sans">
      
      {/* App Container: 
          - Mobile: Full width/height (100dvh for mobile browsers)
          - Desktop: Fixed max-width, bounded height, rounded corners, shadow 
      */}
      <div className="w-full h-[100dvh] md:h-[85vh] md:max-w-md lg:max-w-lg bg-[#FDFCF8] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-black/5">
        
        {/* Header - Increased height and icon size for seniors */}
        <header className="sticky top-0 z-50 glass-card px-5 h-16 flex items-center justify-between shadow-sm shrink-0 border-b border-gray-100/50">
          <div className="flex items-center w-12">
            {mode !== 'HOME' && (
              <button 
                onClick={() => onNavigate('HOME')}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2"
                aria-label="뒤로 가기"
              >
                <ArrowLeft size={28} />
              </button>
            )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate flex-1 text-center">
            {title}
          </h1>

          <div className="flex items-center justify-end w-12">
            {mode !== 'HOME' && (
              <button 
                onClick={() => onNavigate('HOME')}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 -mr-2"
                aria-label="홈으로"
              >
                <Home size={26} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content - Now includes Footer inside scrolling area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-[#FDFCF8]">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-6">
              {children}
            </div>
            
            {/* Footer moved inside main scroll area */}
            <footer className="py-8 text-center text-sm text-gray-400 mt-auto bg-[#FDFCF8]">
              <p className="font-medium">오륜교회 하남교구 © 2026</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;