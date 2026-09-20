import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-[#0D1B2A]/95 backdrop-blur-xl border-t border-[#1F334D] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-center">
      <p className="text-[11px] text-slate-500">
        &copy; 2026 WILDWYNN Co., Ltd. All rights reserved.
      </p>
    </footer>
  );
};
