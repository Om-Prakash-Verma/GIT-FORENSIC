
import React from 'react';
import { Icons } from '../constants.tsx';

interface NavigationSidebarProps {
  bisectActive: boolean;
  onExit: () => void;
  onToggleBisect: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ bisectActive, onExit, onToggleBisect }) => {
  return (
    <aside className="w-full lg:w-20 border-b lg:border-r border-white/5 flex lg:flex-col items-center justify-between lg:justify-start py-4 lg:py-10 px-6 lg:px-0 gap-6 lg:gap-10 bg-black/40 backdrop-blur-3xl z-50 shrink-0">
      <div 
        className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-2xl cursor-pointer hover:rotate-6 active:scale-90 transition-all border-2 lg:border-4 border-black/5"
        onClick={onExit}
      >
        GT
      </div>
      <div className="flex lg:flex-col gap-4 lg:gap-8">
         <button className="p-3 lg:p-4 text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-xl lg:rounded-2xl hover:bg-amber-500/10 transition-all" title="History">
          <Icons.History />
        </button>
        <button 
          className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border ${bisectActive ? 'bg-red-500 text-white border-red-400' : 'text-slate-500 hover:text-amber-500 border-transparent hover:bg-white/5'}`} 
          onClick={onToggleBisect}
        >
          <Icons.Search />
        </button>
        <button 
          className="lg:hidden p-3 text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl active:bg-red-500 active:text-white"
          onClick={onExit}
          title="Close Project"
        >
          <Icons.Close />
        </button>
      </div>
    </aside>
  );
};

export default NavigationSidebar;
