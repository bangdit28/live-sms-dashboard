
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import LiveTable from './components/LiveTable';
import StatsSection from './components/StatsSection';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import MemberStatsSection from './components/MemberStatsSection';
import RoleSelector from './components/RoleSelector';
import { db, auth } from './firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { SmsRecord, TeamMember } from './types';

const ADMIN_EMAIL = 'admin@tasksms.com';

const App: React.FC = () => {
  const [records, setRecords] = useState<SmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // 1. Check Admin Auth
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAppInitialized(true);
    });

    // 2. Check Member Session from LocalStorage
    const savedMember = localStorage.getItem('tasksms_member_session');
    if (savedMember) {
      setActiveMember(JSON.parse(savedMember));
    }

    // 3. Load SMS Data
    const smsRef = query(ref(db, 'messages'), limitToLast(100)); // Increased limit to ensure coverage
    const unsubscribeSms = onValue(smsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: SmsRecord[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).reverse();
        setRecords(list);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSms();
    };
  }, []);

  const handleSelectMember = (member: TeamMember) => {
    setActiveMember(member);
    localStorage.setItem('tasksms_member_session', JSON.stringify(member));
  };

  const handleLogout = () => {
    if (user) auth.signOut();
    setActiveMember(null);
    localStorage.removeItem('tasksms_member_session');
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (!appInitialized) return null;

  // Jika belum login admin DAN belum pilih nama anggota, tampilkan RoleSelector
  if (!user && !activeMember) {
    return (
      <>
        <RoleSelector onSelectMember={handleSelectMember} onAdminLogin={() => setShowLogin(true)} />
        {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] pb-10">
      <Header onLogout={handleLogout} memberName={activeMember?.name} />
      
      <main className="max-w-7xl mx-auto">
        <Breadcrumb />
        
        {isAdmin ? (
          <AdminPanel records={records} />
        ) : activeMember ? (
          <MemberStatsSection memberId={activeMember.id} records={records} />
        ) : (
          <>
            <LiveTable records={records} loading={loading} />
            <StatsSection records={records} />
          </>
        )}
      </main>

      {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default App;
