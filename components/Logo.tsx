import React from 'react';

const Logo: React.FC = () => {
  return (
    <div
      className="flex items-center justify-center h-full w-full overflow-hidden"
      aria-label="Global Dekorasyon Logo"
    >
      {/* Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <g>
          {/* Building shape */}
          <path d="M8,38 L8,14 L14,14 L14,8 L30,8 L30,14 L36,14 L36,38 L8,38 Z" fill="#F97316"/>
          
          {/* G-crane shape */}
          <path d="M22,28 C22,33 12,33 12,28 C12,23 22,23 22,28 M22,28 L22,25 L17,25 M12,28 L17,28" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M12,19 L12,24 L10,24 L10,23 L9,23 L9,22 L10,22 L10,19 Z" fill="white"/>

          {/* Windows */}
          <rect x="27" y="18" width="6" height="5" fill="white" />
          <rect x="27" y="26" width="6" height="5" fill="white" />
        </g>
      </svg>

      {/* Text */}
      <div className="ml-3 hidden md:inline whitespace-nowrap font-sans">
        <div className="text-xl text-white font-black tracking-tight" style={{lineHeight: '1.2'}}>GLOBAL</div>
        <div className="text-[9px] font-medium text-slate-300 tracking-[0.2em]" style={{lineHeight: '1'}}>DEKORASYON</div>
      </div>
    </div>
  );
};

export default Logo;
