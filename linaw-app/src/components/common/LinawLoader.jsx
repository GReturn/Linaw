import React from 'react';

const LinawLoader = ({ className = "w-full", text = "Defining..." }) => (
    <div className={`flex flex-col items-center justify-center gap-6 py-8 ${className}`}>
        <style>
            {`
                @keyframes scan-glass {
                    0% { transform: translate(0%, -20%); }
                    25% { transform: translate(300%, 20%); }
                    50% { transform: translate(-20%, 80%); }
                    75% { transform: translate(250%, 140%); }
                    100% { transform: translate(0%, -20%); }
                }
            `}
        </style>

        {/* Scanning Animation Container */}
        <div className="relative w-32 flex flex-col gap-3 p-2">
            {/* Fake Text Lines */}
            <div className="w-full h-2 bg-gray-200 rounded-full opacity-60"></div>
            <div className="w-5/6 h-2 bg-gray-200 rounded-full opacity-60"></div>
            <div className="w-full h-2 bg-gray-200 rounded-full opacity-60"></div>
            <div className="w-2/3 h-2 bg-gray-200 rounded-full opacity-60"></div>

            {/* Magnifying Glass Logo */}
            <div
                className="absolute top-0 left-0 pointer-events-none z-10"
                style={{ animation: 'scan-glass 3.5s ease-in-out infinite' }}
            >
                <svg
                    width="28" height="28"
                    viewBox="0 0 1000 1000"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M545.425 0C796.48 9.98362e-05 1000 203.466 1000 454.454C1000 705.442 796.48 908.908 545.425 908.908C458.931 908.908 377.948 884.708 309.117 842.784L0 1000L163.506 701.019C163.409 700.87 163.044 700.304 162.862 700.021L162.781 699.896C117.256 629.108 90.8486 544.864 90.8486 454.454C90.8487 203.466 294.37 0 545.425 0ZM566 59C357.236 59 188 228.013 188 436.5C188 644.987 357.236 814 566 814C774.764 814 944 644.987 944 436.5C944 228.013 774.764 59 566 59Z" fill="#3DBDB4" />
                </svg>
            </div>
        </div>

        {text && <span className="text-[10px] text-[#3DBDB4] font-black tracking-widest uppercase animate-pulse">{text}</span>}
    </div>
);

export default LinawLoader;
