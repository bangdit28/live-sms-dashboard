
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, set, push, remove, onValue, update } from 'firebase/database';
import { Country, AppStats, TeamMember, SmsRecord } from '../types';
import { Plus, Trash2, Save, UserPlus, Users, Link, Mail, Edit2, Upload, X, Globe, Activity, CheckCircle2, AlertCircle, CheckCircle, CheckSquare, Square } from 'lucide-react';

interface AdminPanelProps {
  records: SmsRecord[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ records }) => {
  const [stats, setStats] = useState<AppStats>({ smsToday: 0, myNumbersCount: 0 });
  const [countries, setCountries] = useState<Country[]>([]);
  const [numbers, setNumbers] = useState<Record<string, string>>({}); 
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  
  const [newCountry, setNewCountry] = useState({ name: '', value: '', flagUrl: '' });
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [activeTab, setActiveTab] = useState<'stats' | 'countries' | 'inventory' | 'team' | 'monitor'>('stats');

  const [selectedUserForAllocation, setSelectedUserForAllocation] = useState<string | null>(null);
  const [selectedCountryForAllocation, setSelectedCountryForAllocation] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onValue(ref(db, 'app_data/stats'), (s) => s.exists() && setStats(s.val()));
    onValue(ref(db, 'app_data/countries'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setCountries(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else {
        setCountries([]);
      }
    });
    onValue(ref(db, 'app_data/numbers'), (s) => {
      if (s.exists()) {
        const data = s.val();
        const formatted: Record<string, string> = {};
        Object.keys(data).forEach(cName => {
          formatted[cName] = Array.isArray(data[cName]) ? data[cName].join('\n') : '';
        });
        setNumbers(formatted);
      }
    });
    onValue(ref(db, 'app_data/team'), (s) => {
      if (s.exists()) {
        const data = s.val();
        setTeam(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else {
        setTeam([]);
      }
    });
    onValue(ref(db, 'app_data/allocations'), (s) => {
      if (s.exists()) setAllocations(s.val());
      else setAllocations({});
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit && editingCountry) {
          setEditingCountry({ ...editingCountry, flagUrl: base64 });
        } else {
          setNewCountry({ ...newCountry, flagUrl: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addCountry = () => {
    if (!newCountry.name || !newCountry.value) return;
    const newRef = push(ref(db, 'app_data/countries'));
    set(newRef, newCountry);
    setNewCountry({ name: '', value: '', flagUrl: '' });
  };

  const saveEditedCountry = () => {
    if (!editingCountry) return;
    const { id, ...data } = editingCountry;
    update(ref(db, `app_data/countries/${id}`), data);
    setEditingCountry(null);
  };

  const addTeamMember = () => {
    if (!newMember.name || !newMember.email) return;
    const newRef = push(ref(db, 'app_data/team'));
    set(newRef, newMember);
    setNewMember({ name: '', email: '' });
  };

  const allocateNumberToUser = (number: string, userId: string) => {
    const current = allocations[userId] || [];
    if (current.includes(number)) return;
    set(ref(db, `app_data/allocations/${userId}`), [...current, number]);
  };

  const deallocateNumberFromUser = (number: string, userId: string) => {
    const current = allocations[userId] || [];
    set(ref(db, `app_data/allocations/${userId}`), current.filter(n => n !== number));
  };

  const toggleAllInCountry = (userId: string, countryName: string) => {
    const allCountryNumbers = (numbers[countryName] || '').split('\n').filter(n => n.trim() !== '');
    const userAllocations = allocations[userId] || [];
    
    const currentAssignedInCountry = allCountryNumbers.filter(num => userAllocations.includes(num));
    
    const availableInCountry = allCountryNumbers.filter(num => {
      const owner = getAllocatedUser(num);
      return !owner || owner.id === userId;
    });

    if (currentAssignedInCountry.length === availableInCountry.length) {
      const updated = userAllocations.filter(num => !allCountryNumbers.includes(num));
      set(ref(db, `app_data/allocations/${userId}`), updated);
    } else {
      const otherCountriesAllocations = userAllocations.filter(num => !allCountryNumbers.includes(num));
      const updated = [...otherCountriesAllocations, ...availableInCountry];
      set(ref(db, `app_data/allocations/${userId}`), updated);
    }
  };

  const finishNumber = (num: string) => {
    let ownerId: string | null = null;
    for (const userId in allocations) {
      if (allocations[userId].includes(num)) {
        ownerId = userId;
        break;
      }
    }
    if (ownerId && window.confirm(`Selesaikan nomor ${num}? Nomor ini akan dihapus dari dashboard pengguna.`)) {
      deallocateNumberFromUser(num, ownerId);
    }
  };

  const getAllocatedUser = (num: string) => {
    for (const userId in allocations) {
      if (allocations[userId].includes(num)) {
        return team.find(t => t.id === userId);
      }
    }
    return null;
  };

  const getSmsForNumber = (num: string) => {
    return records.filter(r => r.liveSms === num || r.liveSms.includes(num));
  };

  return (
    <div className="bg-white mx-4 mt-6 rounded-md shadow-lg border border-gray-200 overflow-hidden min-h-[500px]">
      <div className="bg-gray-900 text-white px-4 py-3 font-bold flex justify-between items-center overflow-x-auto">
        <span className="whitespace-nowrap mr-4">ADMIN PANEL</span>
        <div className="flex gap-2">
          {['stats', 'countries', 'inventory', 'team', 'monitor'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 rounded text-[10px] md:text-xs uppercase whitespace-nowrap flex items-center gap-1 ${activeTab === tab ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {tab === 'monitor' && <Activity size={10} />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {activeTab === 'stats' && (
          <div className="max-w-md flex flex-col gap-4">
            <h3 className="font-bold border-b pb-2 text-gray-900">Global Statistics</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">SMS Today</label>
              <input type="number" value={stats.smsToday} onChange={e => setStats({...stats, smsToday: parseInt(e.target.value) || 0})} className="mt-1 w-full p-2 border rounded text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">My Numbers Count</label>
              <input type="number" value={stats.myNumbersCount} onChange={e => setStats({...stats, myNumbersCount: parseInt(e.target.value) || 0})} className="mt-1 w-full p-2 border rounded text-gray-900 bg-white" />
            </div>
            <button onClick={() => set(ref(db, 'app_data/stats'), stats)} className="bg-amber-500 text-gray-900 font-bold py-2 rounded flex items-center justify-center gap-2">
              <Save size={18} /> SAVE STATS
            </button>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="flex flex-col gap-8 text-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900"><UserPlus size={18} /> Add Team Member</h3>
                  <div className="flex flex-col gap-2">
                    <input placeholder="Full Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="p-2 border rounded text-sm text-gray-900" />
                    <input placeholder="Email Address" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="p-2 border rounded text-sm text-gray-900" />
                    <button onClick={addTeamMember} className="bg-blue-600 text-white p-2 rounded flex justify-center gap-2 font-bold text-xs py-3">
                      <Plus size={16} /> ADD MEMBER
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  <h3 className="font-bold text-sm text-gray-500 uppercase px-1">Active Team ({team.length})</h3>
                  {team.map(t => (
                    <div key={t.id} onClick={() => setSelectedUserForAllocation(t.id)} className={`flex flex-col p-3 border rounded cursor-pointer transition-all ${selectedUserForAllocation === t.id ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{t.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); remove(ref(db, `app_data/team/${t.id}`)); remove(ref(db, `app_data/allocations/${t.id}`)); }} className="text-red-400"><Trash2 size={14} /></button>
                      </div>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={10}/> {t.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-100 p-4 border-b">
                  <h3 className="font-bold flex items-center gap-2 text-gray-900"><Link size={18} /> Allocation Manager</h3>
                </div>
                {selectedUserForAllocation ? (
                  <div className="p-4 space-y-4">
                    <select className="w-full p-2 border rounded text-sm bg-white text-gray-900 font-bold" value={selectedCountryForAllocation || ''} onChange={(e) => setSelectedCountryForAllocation(e.target.value)}>
                      <option value="">-- Select Country --</option>
                      {countries.map(c => <option key={c.id} value={c.name}>{c.name} ({c.value})</option>)}
                    </select>

                    {selectedCountryForAllocation && (
                      <div className="flex flex-col border rounded-lg overflow-hidden bg-white">
                        <div 
                          onClick={() => toggleAllInCountry(selectedUserForAllocation, selectedCountryForAllocation)}
                          className="bg-gray-50 p-3 border-b flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          {(() => {
                            const allNums = (numbers[selectedCountryForAllocation] || '').split('\n').filter(n => n.trim() !== '');
                            const userAllocations = allocations[selectedUserForAllocation] || [];
                            const available = allNums.filter(n => {
                              const o = getAllocatedUser(n);
                              return !o || o.id === selectedUserForAllocation;
                            });
                            const currentAssigned = allNums.filter(n => userAllocations.includes(n));
                            const isAllSelected = available.length > 0 && currentAssigned.length === available.length;
                            return isAllSelected ? <CheckSquare size={20} className="text-amber-500" /> : <Square size={20} className="text-gray-300" />;
                          })()}
                          <span className="text-xs font-black uppercase text-gray-700">PILIH SEMUA</span>
                        </div>

                        <div className="flex flex-col max-h-[400px] overflow-y-auto">
                          {(numbers[selectedCountryForAllocation] || '').split('\n').filter(n => n.trim() !== '').map((num, i) => {
                            const assignedMember = getAllocatedUser(num);
                            const isMine = allocations[selectedUserForAllocation]?.includes(num);
                            const isAvailable = !assignedMember || assignedMember.id === selectedUserForAllocation;

                            return (
                              <div 
                                key={i} 
                                onClick={() => isMine ? deallocateNumberFromUser(num, selectedUserForAllocation) : (isAvailable && allocateNumberToUser(num, selectedUserForAllocation))}
                                className={`p-3 border-b last:border-0 flex items-center gap-3 cursor-pointer transition-colors ${!isAvailable ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'hover:bg-amber-50'}`}
                              >
                                <div className="flex-shrink-0">
                                  {isMine ? (
                                    <CheckSquare size={20} className="text-amber-500" />
                                  ) : (
                                    <Square size={20} className={isAvailable ? 'text-gray-300' : 'text-gray-200'} />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-mono font-bold ${isMine ? 'text-amber-600' : 'text-gray-800'}`}>{num}</span>
                                  {!isAvailable && assignedMember && (
                                    <span className="text-[9px] font-black text-red-400 uppercase">ALREADY TAKEN BY: {assignedMember.name}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : <div className="p-20 text-center text-gray-400 italic">Select a member to allocate numbers.</div>}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'countries' && (
          <div className="flex flex-col gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-bold mb-4 text-gray-900 flex items-center gap-2">
                {editingCountry ? <Edit2 size={20} className="text-amber-500"/> : <Plus size={20} className="text-green-500"/>}
                {editingCountry ? 'Edit Country' : 'Add New Country'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Country Name</label>
                  <input 
                    placeholder="e.g. INDONESIA" 
                    value={editingCountry ? editingCountry.name : newCountry.name} 
                    onChange={e => editingCountry ? setEditingCountry({...editingCountry, name: e.target.value.toUpperCase()}) : setNewCountry({...newCountry, name: e.target.value.toUpperCase()})} 
                    className="w-full p-2 border rounded text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Country Code</label>
                  <input 
                    placeholder="e.g. +62" 
                    value={editingCountry ? editingCountry.value : newCountry.value} 
                    onChange={e => editingCountry ? setEditingCountry({...editingCountry, value: e.target.value}) : setNewCountry({...newCountry, value: e.target.value})} 
                    className="w-full p-2 border rounded text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Flag Image</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => (editingCountry ? editFileInputRef : fileInputRef).current?.click()}
                      className="flex-1 p-2 bg-gray-200 rounded border border-gray-300 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-300"
                    >
                      <Upload size={14}/> { (editingCountry ? editingCountry.flagUrl : newCountry.flagUrl) ? 'Change Flag' : 'Upload Flag'}
                    </button>
                    {(editingCountry ? editingCountry.flagUrl : newCountry.flagUrl) && (
                      <div className="w-10 h-10 border rounded overflow-hidden bg-white flex items-center justify-center">
                        <img src={editingCountry ? editingCountry.flagUrl : newCountry.flagUrl} alt="Flag" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, false)} />
                  <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, true)} />
                </div>
                <div className="flex gap-2">
                  {editingCountry ? (
                    <>
                      <button onClick={saveEditedCountry} className="flex-1 bg-amber-500 text-gray-900 font-bold py-2 rounded text-xs flex items-center justify-center gap-1 shadow-sm">
                        <Save size={14}/> UPDATE
                      </button>
                      <button onClick={() => setEditingCountry(null)} className="p-2 bg-gray-200 text-gray-600 rounded">
                        <X size={14}/>
                      </button>
                    </>
                  ) : (
                    <button onClick={addCountry} className="w-full bg-green-600 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1 shadow-sm">
                      <Plus size={14}/> ADD COUNTRY
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countries.map(c => (
                <div key={c.id} className="bg-white p-4 border rounded-xl shadow-sm flex items-center justify-between group hover:border-amber-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gray-100 border rounded overflow-hidden flex items-center justify-center">
                      {c.flagUrl ? <img src={c.flagUrl} className="w-full h-full object-cover" /> : <Globe className="text-gray-300" size={16}/>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">{c.name}</span>
                      <span className="text-xs text-gray-500">{c.value}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCountry(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => remove(ref(db, `app_data/countries/${c.id}`))} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="grid gap-6">
            {countries.map(c => (
              <div key={c.id} className="border p-4 rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {c.flagUrl && <img src={c.flagUrl} className="w-6 h-4 object-cover border rounded-sm" />}
                    <label className="font-bold text-gray-800">{c.name} <span className="text-amber-600 font-black ml-1">({c.value})</span></label>
                  </div>
                  <button onClick={() => { const list = (numbers[c.name] || '').split('\n').map(n => n.trim()).filter(n => n !== ''); set(ref(db, `app_data/numbers/${c.name}`), list); alert('Inventory Saved!'); }} className="bg-gray-900 text-white text-[10px] px-3 py-1 rounded">SAVE</button>
                </div>
                <textarea rows={4} className="w-full p-2 border rounded font-mono text-xs bg-white text-gray-900" value={numbers[c.name] || ''} onChange={e => setNumbers({...numbers, [c.name]: e.target.value})} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-amber-500" /> OTP Monitor Status</h3>
              <div className="flex gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12}/> SUCCESS (Finished)</div>
                <div className="flex items-center gap-1 text-red-500"><AlertCircle size={12}/> PENDING (Available)</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {countries.map(country => {
                    const countryNumbers = (numbers[country.name] || '').split('\n').filter(n => n.trim() !== '');
                    return countryNumbers.map((num, idx) => {
                      const ownerMember = getAllocatedUser(num);
                      const smsList = getSmsForNumber(num);
                      const isSuccess = smsList.length > 0;

                      return (
                        <tr key={`${country.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-gray-900">{num}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {country.flagUrl && <img src={country.flagUrl} className="w-4 h-3 object-cover rounded-sm" />}
                              <span className="text-gray-600">{country.name} ({country.value})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {ownerMember ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                {ownerMember.name}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic text-xs">Unallocated</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isSuccess ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-green-600 font-black text-[10px] uppercase">
                                  <CheckCircle2 size={14}/> Success
                                </div>
                                <div className="max-w-[150px] truncate text-[9px] text-gray-400 italic">
                                  "{smsList[0].messageContent}"
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-500 font-black text-[10px] uppercase">
                                <AlertCircle size={14}/> Pending
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {ownerMember && (
                              <button 
                                onClick={() => finishNumber(num)}
                                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <CheckCircle size={12} /> SELESAIKAN
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                  {countries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 italic">No numbers in inventory to monitor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
