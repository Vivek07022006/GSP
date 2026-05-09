import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import {
  GraduationCap, Mail, Lock, Hash, Eye, EyeOff,
  ArrowRight, ChevronDown, ArrowLeft
} from 'lucide-react';

const ROLE_CONFIG = {
  student: {
    label: 'Student',
    color: 'bg-blue-50 border-blue-200',
    fieldLabel: 'Register Number',
    fieldKey: 'registerNumber',
    icon: <Hash size={15} className="text-gray-400" />,
  },
  faculty: {
    label: 'Faculty',
    color: 'bg-green-50 border-green-200',
    fieldLabel: 'Email Address',
    fieldKey: 'email',
    icon: <Mail size={15} className="text-gray-400" />,
  },
  admin: {
    label: 'Admin',
    color: 'bg-purple-50 border-purple-200',
    fieldLabel: 'Email Address',
    fieldKey: 'email',
    icon: <Mail size={15} className="text-gray-400" />,
  },
};

export default function Login({ setAuthUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRole = location.state?.role || 'student';

  const [role, setRole] = useState(initialRole);
  const [dropOpen, setDropOpen] = useState(false);
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cfg = ROLE_CONFIG[role];

  const switchRole = (r) => {
    setRole(r);
    setDropOpen(false);
    setCredential('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credential || !password) return setError('Please fill in all fields.');
    setError(''); setLoading(true);
    try {
      let payload = { password };
      if (role === 'student') {
        payload.registerNumber = credential;
      } else {
        payload.email = credential;
      }

      const { data } = await api.post('/api/auth/login', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setAuthUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50">

      {/* Header Bar — Dept name */}
      <div className="fixed top-0 left-0 right-0 bg-[#7B1535] px-6 py-3 shadow-xl z-50 flex items-center justify-between border-b border-white/10">

        {/* Left - Back Button */}
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors font-medium border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10">
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
        </Link>

        {/* Center - Logo and Text */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
            <GraduationCap size={20} className="text-[#7B1535]" />
          </div>
          <div className="leading-tight hidden sm:block text-left">
            <span className="block text-white font-black text-xs tracking-wider">SATHYABAMA</span>
            <span className="block text-white/70 text-[9px] tracking-widest">Dept. of Information Technology</span>
          </div>
        </div>

        {/* Empty div for flex balance against Back button */}
        <div className="w-16"></div>
      </div>

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4 mt-20">
        <div className={`bg-white border rounded-3xl shadow-xl overflow-hidden ${cfg.color}`}>

          {/* Card header */}
          <div className="bg-white px-8 pt-8 pb-6 border-b border-gray-200 text-center">
            <h1 className="text-gray-900 font-black text-3xl mb-1">Sign In</h1>
            <p className="text-gray-500 text-sm">Department of Information Technology</p>
          </div>

          <div className="px-8 py-7 space-y-5 bg-white/50 backdrop-blur-sm">

            {/* Role dropdown */}
            <div>
              <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Login As</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropOpen(!dropOpen)}
                  className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-bold text-sm transition-colors focus:ring-2 focus:ring-[#7B1535] focus:outline-none shadow-sm"
                >
                  <span>{cfg.label}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl overflow-hidden z-30 shadow-2xl">
                    {Object.entries(ROLE_CONFIG).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => switchRole(key)}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors
                          ${role === key ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Error Box */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <div className="mt-0.5">⚠️</div>
                  <div className="font-medium">{error}</div>
                </div>
              )}

              {/* Dynamic Credential Field */}
              <div className="space-y-1.5">
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest">{cfg.fieldLabel}</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors">
                    {cfg.icon}
                  </div>
                  <input
                    type={role === 'student' ? 'text' : 'email'}
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder={`Enter your ${cfg.fieldLabel.toLowerCase()}`}
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1535] placeholder-gray-400 shadow-sm transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest flex justify-between">
                  Password
                  <Link to="#" className="text-[#7B1535] hover:text-[#5a0f27] normal-case tracking-normal">Forgot password?</Link>
                </label>
                <div className="relative group">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1535] placeholder-gray-400 shadow-sm transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7B1535] hover:bg-[#961a42] text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2 group relative overflow-hidden"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><span className="relative z-10">Sign In</span> <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
