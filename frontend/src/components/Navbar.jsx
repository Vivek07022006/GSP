import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, BookOpen, KeyRound, X } from 'lucide-react';
import api from '../utils/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const roleLabel = { student: 'Student', faculty: 'Faculty', admin: 'HOD / Admin' };
  const roleBadge = {
    student: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
    faculty: 'bg-green-400/20 text-green-200 border border-green-400/30',
    admin:   'bg-purple-400/20 text-purple-200 border border-purple-400/30',
  };

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = () => { onLogout(); navigate('/'); };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
      return setPwdMsg({ type: 'error', text: 'New password and confirm password do not match.' });
    }
    setPwdLoading(true);
    try {
      const payload = { oldPassword, newPassword };
      if (user.role === 'student') {
        payload.registerNumber = user.registerNumber;
      } else {
        payload.email = user.email;
      }
      const res = await api.post('/api/auth/change-password', payload);
      setPwdMsg({ type: 'success', text: res.data.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePwd(false), 1500);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <nav className="bg-[#7B1535] shadow-xl px-6 py-3 flex justify-between items-center sticky top-0 z-50 border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
          <GraduationCap size={20} className="text-[#7B1535]" />
        </div>
        <div className="leading-tight hidden sm:block">
          <span className="block text-white font-black text-xs tracking-wider">SATHYABAMA</span>
          <span className="block text-white/60 text-[9px] tracking-widest">Dept. of Information Technology</span>
        </div>
      </div>

      {/* Right side */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-white/80 text-sm font-medium">{user.name}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadge[user.role] || 'bg-white/10 text-white border border-white/20'}`}>
            {roleLabel[user.role] || user.role}
          </span>
          {(user.role === 'student' || user.role === 'faculty') && (
            <button
              onClick={() => setShowChangePwd(true)}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <KeyRound size={15} />
              <span className="hidden sm:inline">Change Password</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors ml-1 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePwd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in relative">
            <button onClick={() => setShowChangePwd(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
              <X size={18} />
            </button>

            <div className="p-7">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Change Password</h3>
              <p className="text-gray-500 text-sm mb-6">Update your account password.</p>

              {pwdMsg.text && (
                <div className={`text-sm px-4 py-3 rounded-xl mb-5 border ${pwdMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  {pwdMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Old Password</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                </div>
                <button type="submit" disabled={pwdLoading}
                  className="w-full bg-[#7B1535] hover:bg-[#961a42] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm">
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
