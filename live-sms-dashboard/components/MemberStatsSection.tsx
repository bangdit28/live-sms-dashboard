
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Country, SmsRecord } from '../types';
import { Globe, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface MemberStatsSectionProps {
  memberId: string;
  records: SmsRecord[];
}

const MemberStatsSection: React.FC<MemberStatsSectionProps> = ({ memberId, records }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [allNumbers, setAllNumbers] = useState<Record<string, string[]>>({});
  const [myAllocations, setMyAllocations] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedNumbers, setExpandedNumbers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    onValue(ref(db, 'app_data/countries'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setCountries(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });

    onValue(ref(db, 'app_data/numbers'), (s) => {
      if (s.exists()) setAllNumbers(s.val());
    });

    onValue(ref(db, `app_data/allocations/${memberId}`), (s) => {
      if (s.exists()) setMyAllocations(s.val());
      else setMyAllocations([]);
    });
  }, [memberId]);

  // Hitung jumlah nomor yang benar-benar ada di stok dan dialokasikan ke user
  const availableAllocationsCount = useMemo(() => {
    let count = 0;
    // Iterasi setiap negara di inventory
    // Fixed: Use Object.keys to ensure proper type inference for 'numbers' from the Record type
    Object.keys(allNumbers).forEach(countryName => {
      const numbers = allNumbers[countryName];
      // Hitung berapa nomor di negara ini yang ada di list alokasi user
      const filtered = numbers.filter(num => myAllocations.includes(num));
      count += filtered.length;
    });
    return count;
  }, [allNumbers, myAllocations]);

  const toggleNumber = (num: string) => {
    setExpandedNumbers(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const getMessagesForNumber = (num: string) => {
    return records.filter(r => r.liveSms === num || r.liveSms.includes(num));
  };

  return (
    <div className="mx-4 mt-6 flex flex-col gap-1 animate-in fade-in duration-500">
      <div className="bg-[#ffc107] p-4 shadow-sm rounded-t-md">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
          My Allocated Numbers ({availableAllocationsCount})
        </h3>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        {countries.map((country) => {
          const numbers = allNumbers[country.name] || [];
          const filteredNumbers = numbers.filter(num => myAllocations.includes(num));
          
          if (filteredNumbers.length === 0) return null;

          const isCountrySelected = selectedCountry === country.name;
          
          return (
            <div key={country.id} className="flex flex-col">
              <div
                onClick={() => setSelectedCountry(isCountrySelected ? null : country.name)}
                className="bg-[#6c757d] p-4 rounded shadow-md flex items-center justify-between cursor-pointer hover:bg-[#5a6268] transition-colors"
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
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {filteredNumbers.length} numbers
                  </span>
                  {isCountrySelected ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
                </div>
              </div>

              {isCountrySelected && (
                <div className="mt-1 bg-white border border-gray-200 rounded-b shadow-inner overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col">
                    {filteredNumbers.map((number, nIndex) => {
                      const isNumberExpanded = !!expandedNumbers[number];
                      const msgs = getMessagesForNumber(number);
                      const msgCount = msgs.length;

                      return (
                        <div key={nIndex} className="border-b border-gray-100 last:border-0">
                          <div 
                            onClick={() => toggleNumber(number)}
                            className={`py-3 px-4 flex justify-between items-center cursor-pointer hover:bg-amber-50 transition-colors ${isNumberExpanded ? 'bg-amber-50' : ''}`}
                          >
                            <span className="text-gray-900 font-bold tracking-wider">{number}</span>
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
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">SMS RECEIVED</span>
                                        <span className="text-[10px] text-gray-400">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                        {msg.messageContent}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-gray-400 text-xs italic">
                                    No incoming messages for this number yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {availableAllocationsCount === 0 && (
          <div className="bg-white p-10 text-center text-gray-400 italic rounded-b-md border">
            No numbers allocated to you yet. Please contact Admin.
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberStatsSection;
