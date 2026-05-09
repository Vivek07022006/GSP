import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, GraduationCap, BookOpen, Download, Search, Plus, X, Eye, EyeOff, Mail, Hash, Shield } from 'lucide-react';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:        'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved:       'bg-green-100 text-green-800 border border-green-200',
    guide_approved: 'bg-green-100 text-green-800 border border-green-200',
    guide_rejected: 'bg-red-100 text-red-800 border border-red-200',
    changes:        'bg-orange-100 text-orange-800 border border-orange-200',
    completed:      'bg-indigo-100 text-indigo-800 border border-indigo-200',
  };
  const labels = { pending:'Pending', approved:'Approved', guide_approved:'Approved', guide_rejected:'Rejected', changes:'Changes Required', completed:'Completed' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{labels[status] || status || '—'}</span>;
};

const ROLE_ICON = { student: <GraduationCap size={14} />, faculty: <Users size={14} />, admin: <Shield size={14} /> };
const REVIEW_STAGES = ['Zeroth', 'First', 'Second', 'Model', 'Final'];

export default function AdminDashboard({ user }) {
  const [teams, setTeams] = useState([]);
  const [users, setUsersData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  // Create user form
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', registerNumber: '', specialization: '' });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, teamsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'), api.get('/api/teams'), api.get('/api/auth/users'),
      ]);
      setStats(statsRes.data);
      setTeams(teamsRes.data);
      setUsersData(usersRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/api/admin/export');
      const rows = [['Team ID','Project','Members','Guide','Status','Current Review']];
      res.data.forEach(t => {
        const reviewLabel = (t.currentReview || 0) >= 5 ? 'Completed all review' : `${REVIEW_STAGES[t.currentReview || 0]} Review`;
        rows.push([t._id, t.projectTitle, t.members?.map(m => m.name||m).join('; '), t.guideId?.name||'', t.status, reviewLabel]);
      });
      const csv = rows.map(r => r.map(c => `"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'guide_select_report.csv'; a.click();
    } catch (e) { alert('Export failed.'); }
  };

  const createUser = async (e) => {
    e.preventDefault(); setFormMsg({ type: '', text: '' });
    try {
      await api.post('/api/auth/register', form);
      setFormMsg({ type: 'success', text: `${form.role} account created successfully!` });
      setForm({ name: '', email: '', password: '', role: 'student', registerNumber: '', specialization: '' });
      fetchAll();
    } catch (err) { setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' }); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.registerNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeams = teams.filter(t =>
    t.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
    t.members?.some(m => (m.name||m).toLowerCase().includes(search.toLowerCase()))
  );

  const tabs = ['overview', 'users', 'teams', 'create'];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">HOD — Full system access</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-[#7B1535] hover:bg-[#961a42] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Students', val: users.filter(u=>u.role==='student').length, icon: <GraduationCap size={18} />, color: 'text-blue-600', accent: 'bg-blue-50' },
            { label: 'Faculty', val: users.filter(u=>u.role==='faculty').length, icon: <Users size={18} />, color: 'text-green-600', accent: 'bg-green-50' },
            { label: 'Teams', val: teams.length, icon: <BookOpen size={18} />, color: 'text-[#7B1535]', accent: 'bg-pink-50' },
            { label: 'Approved Teams', val: teams.filter(t=>t.status==='guide_approved').length, icon: <Shield size={18} />, color: 'text-purple-600', accent: 'bg-purple-50' },
          ].map((s, i) => (
            <GlassCard key={i} className="p-5 flex items-center gap-4 border border-gray-100 hover:shadow transition-shadow">
              <div className={`p-2.5 rounded-xl ${s.accent}`}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <div>
                <p className="text-gray-500 font-semibold text-xs uppercase tracking-wider">{s.label}</p>
                <p className={`font-black text-2xl mt-1 text-gray-900`}>{s.val}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === t ? 'border-[#7B1535] text-[#7B1535]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t === 'create' ? '+ Create User' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search (for users/teams tabs) */}
        {(activeTab === 'users' || activeTab === 'teams') && (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-5">
            <GlassCard className="p-6">
              <h3 className="text-gray-900 font-bold mb-4">Review Summary</h3>
              {REVIEW_STAGES.map((stage, i) => {
                const count = teams.filter(t => (t.currentReview||0) === i).length;
                return (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 text-sm">{stage} Review</span>
                    <span className="text-[#7B1535] font-bold text-sm">{count} team{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 bg-green-50/50 -mx-6 px-6 rounded-b-xl">
                <span className="text-green-800 text-sm font-bold">Completed all reviews</span>
                <span className="text-green-700 font-black text-sm">
                  {teams.filter(t => (t.currentReview||0) >= 5).length} team{teams.filter(t => (t.currentReview||0) >= 5).length !== 1 ? 's' : ''}
                </span>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    {['Name', 'Email / Reg No', 'Role', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#7B1535]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#7B1535]">
                            {u.name?.[0]}
                          </div>
                          <span className="text-gray-900 font-bold">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{u.registerNumber || u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold capitalize ${
                          u.role === 'student' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          u.role === 'faculty' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {ROLE_ICON[u.role]} {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => setViewUser(u)} className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200 bg-white px-3 py-1.5 rounded-lg shadow-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-gray-400 py-8">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* ── TEAMS ── */}
        {activeTab === 'teams' && (
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    {['Project Title', 'Members', 'Guide', 'Status', 'Review Stage'].map(h => (
                      <th key={h} className="px-5 py-4 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeams.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-900 font-bold">{t.projectTitle || '—'}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{t.members?.map(m => m.name || m).join(', ')}</td>
                      <td className="px-5 py-4 text-gray-500 font-medium">{t.guideId?.name || '—'}</td>
                      <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-4">
                        <span className="text-[#7B1535] text-xs font-bold">
                          {(t.currentReview || 0) >= 5 ? 'Completed' : `${REVIEW_STAGES[t.currentReview || 0]} Review`}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTeams.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">No teams found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* ── CREATE USER ── */}
        {activeTab === 'create' && (
          <GlassCard className="p-8 max-w-lg mx-auto">
            <h3 className="text-gray-900 font-black text-xl mb-1">Create New Account</h3>
            <p className="text-gray-500 text-sm mb-6">Only admins can create student and staff accounts.</p>

            {formMsg.text && (
              <div className={`text-sm px-4 py-3 rounded-xl mb-5 border ${formMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={createUser} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Role</label>
                <div className="flex gap-2">
                  {['student', 'faculty'].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-all border ${form.role === r ? 'bg-[#7B1535] text-white border-[#7B1535]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Full Name</label>
                <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
              </div>

              <div>
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                </div>
              </div>

              {form.role === 'student' && (
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Register Number</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.registerNumber} onChange={e => setForm(f=>({...f,registerNumber:e.target.value}))}
                      className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                  </div>
                </div>
              )}

              {form.role === 'faculty' && (
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Specialization</label>
                  <input value={form.specialization} onChange={e => setForm(f=>({...f,specialization:e.target.value}))}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                </div>
              )}

              <div>
                <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input required type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-4 pr-10 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1535]" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit"
                className="w-full bg-[#7B1535] hover:bg-[#961a42] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-2">
                <Plus size={16} /> Create Account
              </button>
            </form>
          </GlassCard>
        )}
      </div>

      {/* ── VIEW USER MODAL ── */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in relative pt-12 pb-6 px-8">
            <button 
              onClick={() => setViewUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-[#7B1535]/10 rounded-full flex items-center justify-center text-2xl font-black text-[#7B1535] mb-3">
                {viewUser.name?.[0]}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{viewUser.name}</h3>
              <p className="text-sm text-gray-500 font-medium capitalize flex items-center justify-center gap-1.5 mt-1">
                {ROLE_ICON[viewUser.role]} {viewUser.role} Account
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</span>
                <span className="text-sm font-medium text-gray-900">{viewUser.email}</span>
              </div>
              {(viewUser.registerNumber || viewUser.staffId) && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {viewUser.role === 'student' ? 'Reg Number' : 'Staff ID'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{viewUser.registerNumber || viewUser.staffId}</span>
                </div>
              )}
              {viewUser.phone && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                  <span className="text-sm font-medium text-gray-900">{viewUser.phone}</span>
                </div>
              )}
              {viewUser.specialization && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Specialization</span>
                  <span className="text-sm font-medium text-gray-900">{viewUser.specialization}</span>
                </div>
              )}
              {viewUser.role === 'faculty' && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Teams</span>
                  <span className="text-sm font-bold text-[#7B1535]">{viewUser.maxTeams || 10}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setViewUser(null)}
              className="mt-8 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl border border-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
