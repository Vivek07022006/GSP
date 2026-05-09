import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, BookOpen } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const roleLabel = { student: 'Student', faculty: 'Faculty', admin: 'HOD / Admin' };
  const roleBadge = {
    student: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
    faculty: 'bg-green-400/20 text-green-200 border border-green-400/30',
    admin:   'bg-purple-400/20 text-purple-200 border border-purple-400/30',
  };

  const handleLogout = () => { onLogout(); navigate('/'); };

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors ml-1 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
