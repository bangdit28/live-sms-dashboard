
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { X, Lock } from 'lucide-react';

interface AdminLoginProps {
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      setError('Invalid credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#ffc107] p-6 flex flex-col items-center">
          <div className="bg-gray-900 p-4 rounded-full mb-4">
            <Lock className="text-[#ffc107]" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full p-3 border rounded focus:ring-2 focus:ring-amber-400 outline-none text-gray-900"
              placeholder="admin@tasksms.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-3 border rounded focus:ring-2 focus:ring-amber-400 outline-none text-gray-900"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-50"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-900 text-[#ffc107] rounded font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
