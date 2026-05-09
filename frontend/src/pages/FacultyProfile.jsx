import React, { useState } from 'react';
import { User, Mail, Phone, Hash, Briefcase, Shield, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="mt-0.5 p-2 bg-[#7B1535]/10 rounded-lg flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-gray-900 font-semibold text-sm mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export default function FacultyProfile({ user }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FA';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your faculty account details</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Photo + Name Hero */}
        <GlassCard className="p-8 flex flex-col sm:flex-row items-center gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {user?.photo && !imgError ? (
              <img
                src={user.photo}
                alt={user.name}
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-[#7B1535]/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#7B1535] to-[#c0395c] flex items-center justify-center text-white font-black text-3xl shadow-md">
                {initials}
              </div>
            )}
          </div>

          {/* Name & role */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-gray-900">{user?.name}</h2>
            <p className="text-[#7B1535] font-semibold mt-1">{user?.specialization || 'Faculty'}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold">
                <Shield size={11} /> Faculty / Guide
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                Max {user?.maxTeams || 10} Teams
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Info card */}
        <GlassCard className="p-6">
          <h3 className="text-gray-900 font-bold mb-2 border-b border-gray-100 pb-3">Account Information</h3>
          <div className="divide-y divide-gray-50">
            <InfoRow
              icon={<User size={14} className="text-[#7B1535]" />}
              label="Full Name"
              value={user?.name}
            />
            <InfoRow
              icon={<Mail size={14} className="text-[#7B1535]" />}
              label="Email (Username)"
              value={user?.email}
            />
            <InfoRow
              icon={<Phone size={14} className="text-[#7B1535]" />}
              label="Phone (Password)"
              value={user?.phone ? '••••••' + user.phone.slice(-4) : 'Not set'}
            />
            <InfoRow
              icon={<Hash size={14} className="text-[#7B1535]" />}
              label="Staff ID"
              value={user?.staffId || 'Not assigned'}
            />
            <InfoRow
              icon={<Briefcase size={14} className="text-[#7B1535]" />}
              label="Specialization"
              value={user?.specialization}
            />
          </div>
        </GlassCard>

        {/* Login instructions */}
        <GlassCard className="p-5 bg-blue-50 border-blue-200">
          <p className="text-blue-800 text-sm font-bold mb-1">🔑 Login Credentials</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            <strong>Username:</strong> Your institutional email address<br />
            <strong>Password:</strong> Your registered phone number
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
