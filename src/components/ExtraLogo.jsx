import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';

export const ExtraLogo = memo(({ className, shadow = true }) => (
  <div className={`relative ${className}`}>
    <div className={`absolute inset-0 bg-[#108542] rotate-45 rounded-xl opacity-20 ${shadow ? 'animate-pulse' : ''}`}></div>
    <div className="absolute inset-0 bg-gradient-to-br from-[#108542] to-[#0d6a35] rounded-xl flex items-center justify-center shadow-lg border border-white/20">
      <Sparkles size={24} className="text-white" />
    </div>
  </div>
));

