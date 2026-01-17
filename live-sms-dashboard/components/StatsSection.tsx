
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Country, AppStats, TeamMember, SmsRecord } from '../types';
import { Globe, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface StatsSectionProps {
  records: SmsRecord[];
}

const StatsSection: React.FC<StatsSectionProps> = ({ records }) => {
  const [stats, setStats] = useState<AppStats>({ smsToday: 0, myNumbersCount: 0 });
  const [countries, setCountries] = useState<Country[]>([]);
  const [allNumbers, setAllNumbers] = useState<Record<string, string[]>>({});
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedNumbers, setExpandedNumbers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    onValue(ref(db, 'app_data/stats'), (s) => s.exists() && setStats(s.val()));
    onValue(ref(db, 'app_data/countries'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setCountries(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
    onValue(ref(db, 'app_data/numbers'), (s) => {
      if (s.exists()) setAllNumbers(s.val() || {});
    });
    onValue(ref(db, 'app_data/allocations'), (s) => {
      if (s.exists()) setAllocations(s.val());
    });
    onValue(ref(db, 'app_data/team'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setTeam(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  const handleCountryClick = (countryName: string) => {
    setSelectedCountry(selectedCountry === countryName ? null : countryName);
  };

  const toggleNumber = (num: string) => {
    setExpandedNumbers(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const getNumberOwner = (num: string) => {
    for (const userId in allocations) {
      if (allocations[userId].includes(num)) {
        return team.find(t => t.id === userId)?.name;
      }
    }
    return null;
  };

  const getMessagesForNumber = (num: string) => {
    return records.filter(r => r.liveSms === num || r.liveSms.includes(num));
  };

  return (
    <div className="mx-4 mt-6 flex flex-col gap-1">
      <div className="bg-[#6c757d] rounded-t-md p-8 flex flex-col items-center justify-center text-white shadow-sm">
        <span className="text-6xl font-bold mb-2">{stats.smsToday}</span>
        <span className="text-sm font-medium uppercase tracking-wider">SMS ToDay</span>
      </div>

      <div className="bg-[#ffc107] p-4 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">
          My Numbers ({stats.myNumbersCount})
        </h3>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        {countries.map((country) => {
          const isSelected = selectedCountry === country.name;
          const numbers = allNumbers[country.name] || [];
          
          return (
            <div key={country.id} className="flex flex-col">
              <div
                onClick={() => handleCountryClick(country.name)}
                className="bg-[#6c757d] p-4 rounded shadow-md flex items-center justify-between transition-colors active:scale-[0.99] cursor-pointer hover:bg-[#5a6268]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-white/10 rounded overflow-hidden flex items-center justify-center">
                    {country.flagUrl ? <img src={country.flagUrl} className="w-full h-full object-cover" /> : <Globe size={14} className="text-white/30" />}
                  </div>
                  <span className="text-white font-bold uppercase tracking-tight">
                    {country.name} {country.value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {numbers.length}
                  </span>
                  {isSelected ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
                </div>
              </div>

              {isSelected && (
                <div className="mt-1 bg-white border border-gray-200 rounded-b shadow-inner overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col">
                    {numbers.map((number, nIndex) => {
                      const owner = getNumberOwner(number);
                      const isNumberExpanded = !!expandedNumbers[number];
                      const msgs = getMessagesForNumber(number);
                      const msgCount = msgs.length;

                      return (
                        <div key={nIndex} className="border-b border-gray-50 last:border-0">
                          <div 
                            onClick={() => toggleNumber(number)}
                            className={`py-3 px-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isNumberExpanded ? 'bg-amber-50' : ''}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold">{number}</span>
                              {owner && (
                                <span className="text-[9px] text-amber-600 font-black uppercase mt-0.5">OWNER: {owner}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span 
                                className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm ${msgCount === 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                              >
                                {msgCount}
                              </span>
                              {isNumberExpanded ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-gray-300" />}
                            </div>
                          </div>

                          {isNumberExpanded && (
                            <div className="bg-gray-50 px-4 py-3 animate-in fade-in duration-300">
                              <div className="space-y-2">
                                {msgCount > 0 ? (
                                  msgs.map((msg, mIdx) => (
                                    <div key={mIdx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">SMS CONTENT</span>
                                        <span className="text-[10px] text-gray-400">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                        {msg.messageContent}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-gray-400 text-xs italic">
                                    No incoming messages for this number.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {numbers.length === 0 && (
                      <div className="py-10 text-center text-gray-400 italic">No numbers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsSection;
