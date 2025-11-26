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
            viewBox="0 0 60 60"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M30 4L4 18V56H28V20H32V56H56V18L30 4ZM26 22V54H6V19.5L26 22ZM34 22L54 19.5V54H34V22ZM38 28H50V34H38V28ZM38 40H50V46H38V40ZM22 46C22 51.5228 12.9249 51.5228 12.9249 46C12.9249 40.4772 22 40.4772 22 46ZM22 46V42H16V38H10V46C10 53.732 22 53.732 22 46Z"
              fill="#F97316"
            />
            <path d="M16 50C14.5 52,14.5 55,16 56L14 54H18" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>


      {/* Text */}
      <div className="ml-3 hidden md:inline whitespace-nowrap font-sans">
        <div className="text-xl text-white font-black tracking-tighter" style={{lineHeight: '1.2'}}>GLOBAL</div>
        <div className="text-[9px] font-medium text-slate-300 tracking-[0.2em]" style={{lineHeight: '1'}}>DEKORASYON</div>
      </div>
    </div>
  );
};

export default Logo;
