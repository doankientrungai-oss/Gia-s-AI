
import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <div className="text-center pb-4 pt-1 px-4 bg-transparent">
      <p className="text-[10px] md:text-xs text-gray-400 font-medium tracking-wide uppercase">
        Học tập cùng thầy{' '}
        <a
          href="https://www.facebook.com/kientrungkrn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 transition-colors font-bold"
        >
          Đoàn Kiên Trung
        </a>{' '}
        • Zalo: 0909629947
      </p>
    </div>
  );
};
