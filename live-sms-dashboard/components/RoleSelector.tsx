
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { TeamMember } from '../types';
import { User, ShieldCheck, Users, ChevronRight, Search } from 'lucide-react';

interface RoleSelectorProps {
  onSelectMember: (member: TeamMember) => void;
  onAdminLogin: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectMember, onAdminLogin }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'main' | 'member-list'>('main');

  useEffect(() => {
    onValue(ref(db, 'app_data/team'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setTeam(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  const filteredTeam = team.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-[#f4f6f9] flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2 italic">TASKSMS</h1>
          <p className="text-gray-500 font-medium">Sistem Monitoring SMS & Alokasi Tim</p>
        </div>

        {view === 'main' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
            {/* Admin Option */}
            <div 
              onClick={onAdminLogin}
              className="bg-white p-8 rounded-2xl shadow-xl border-b-4 border-gray-900 hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="bg-gray-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                <ShieldCheck className="text-white group-hover:text-gray-900" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin</h3>
              <p className="text-sm text-gray-500">Kelola negara, stok nomor, dan alokasi tim.</p>
            </div>

            {/* Member Option */}
            <div 
              onClick={() => setView('member-list')}
              className="bg-amber-500 p-8 rounded-2xl shadow-xl border-b-4 border-amber-600 hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-amber-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Anggota</h3>
              <p className="text-sm text-gray-800/60">Lihat nomor yang dialokasikan untuk Anda.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900 p-6 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Users size={20} className="text-amber-500" /> PILIH NAMA ANDA
              </h3>
              <button onClick={() => setView('main')} className="text-gray-400 hover:text-white text-xs font-bold">KEMBALI</button>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari nama Anda..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTeam.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 cursor-pointer transition-all group"
                  >
                    <span className="font-bold text-gray-900 group-hover:text-amber-600 uppercase tracking-tight">{member.name}</span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-500" />
                  </div>
                ))}
                {filteredTeam.length === 0 && (
                  <div className="text-center py-10 text-gray-400 italic">Nama tidak ditemukan atau daftar tim kosong.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
