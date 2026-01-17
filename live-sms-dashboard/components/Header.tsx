
import React, { useState, useEffect } from 'react';
import { Clock, User, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  memberName?: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout, memberName }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  return (
    <header className="bg-[#ffc107] h-14 flex items-center justify-between px-4 shadow-sm sticky top-0 z-50">
      <div 
        className="text-gray-900 font-bold text-xl tracking-tight px-2 cursor-pointer flex items-center gap-2"
        onClick={() => window.location.reload()}
      >
        Tasksms
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-gray-800 font-medium text-sm md:text-base">
          <span>{formatDate(dateTime)}</span>
          <Clock size={18} />
        </div>
        
        <div className="flex items-center gap-2">
          {memberName && (
            <span className="bg-gray-900/10 px-2 py-1 rounded text-[10px] font-bold text-gray-800 uppercase">
              USER: {memberName}
            </span>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-800"
          >
            <LogOut size={14} /> KELUAR
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
