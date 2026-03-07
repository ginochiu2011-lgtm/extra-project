import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ExtraLogo } from './ExtraLogo';

export const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-slate-900 z-[200] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative mb-8 animate-in zoom-in-50 duration-1000">
        <div className="absolute inset-0 bg-[#108542] blur-[80px] opacity-40"></div>
        <ExtraLogo className="w-24 h-24 relative z-10" />
      </div>
      <div className="text-center space-y-2 animate-in slide-in-from-bottom-10 duration-1000 delay-300">
        <h1 className="text-3xl font-black text-white italic tracking-tighter">EXTRA PARENTS</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="h-[1px] w-4 bg-white/20"></div>
          <p className="text-[10px] text-[#108542] font-black tracking-[0.4em] uppercase">把有趣的家长，聚在一起</p>
          <div className="h-[1px] w-4 bg-white/20"></div>
        </div>
      </div>
      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <Loader2 className="text-white/20 animate-spin" size={20} />
        <p className="text-[10px] text-white/50 font-black tracking-widest uppercase">让遛娃，成为一种高质陪伴</p>
      </div>
    </div>
  );
};

