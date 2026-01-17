
import React from 'react';
import { FileText, Home } from 'lucide-react';

const Breadcrumb: React.FC = () => {
  return (
    <div className="bg-white mx-4 mt-6 rounded-md shadow-sm border-l-4 border-amber-500 overflow-hidden">
      <div className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 text-gray-800">
          <FileText className="text-amber-500" size={24} />
          <h2 className="text-xl font-bold">Live SMS</h2>
        </div>
        
        <nav className="bg-[#f8f9fa] px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-600">
          <Home size={16} className="text-black" />
          <span className="font-bold text-black">Dashboard</span>
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
