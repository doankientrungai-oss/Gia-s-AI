
import React from 'react';
import { ScholarIcon } from './IconComponents';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl p-4 flex items-center space-x-4 sticky top-0 z-10 transition-all">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center p-1 border border-white/30 shadow-inner transform hover:rotate-3 transition-transform cursor-pointer">
            <ScholarIcon className="h-10 w-10 text-white drop-shadow-lg" />
        </div>
        <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Ông Giáo Biết Tuốt</h1>
            <p className="text-blue-100 text-sm font-medium">Gia sư AI - Cùng em chinh phục kiến thức</p>
        </div>
    </header>
  );
};
