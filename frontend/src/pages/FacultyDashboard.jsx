import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Users, ChevronRight, UserCircle } from 'lucide-react';

const REVIEW_STAGES = ['Zeroth', 'First', 'Second', 'Model', 'Final'];

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:        'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved:       'bg-green-100 text-green-800 border border-green-200',
    changes:        'bg-orange-100 text-orange-800 border border-orange-200',
    guide_approved: 'bg-green-100 text-green-800 border border-green-200',
    guide_rejected: 'bg-red-100 text-red-800 border border-red-200',
    completed:      'bg-indigo-100 text-indigo-800 border border-indigo-200',
  };
  const labels = {
    pending: 'Pending', approved: 'Approved', changes: 'Changes Required',
    guide_approved: 'Approved', guide_rejected: 'Rejected', completed: 'Completed',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
};

// ─── Team Row ────────────────────────────────────────────
function TeamRow({ team, onAction }) {
  const navigate = useNavigate();
  const [displayStatus, setDisplayStatus] = useState(team.status);

  useEffect(() => {
    // If the team is approved, fetch the review for the current stage to show accurate status
    if (team.status === 'guide_approved') {
      if ((team.currentReview || 0) >= 5) {
        setDisplayStatus('completed');
        return;
      }
      api.get(`/api/reviews/${team._id}`)
         .then(res => {
            const currentRev = res.data.find(r => r.reviewStage === team.currentReview);
            if (currentRev) setDisplayStatus(currentRev.status);
            else setDisplayStatus('pending'); // if approved but no review submitted yet, it's effectively pending submission/action
         })
         .catch(() => {});
    } else {
      setDisplayStatus(team.status);
    }
  }, [team]);

  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate(`/dashboard/team/${team._id}`)}>
      <td className="px-5 py-4 align-top">
        <div className="space-y-2">
          {team.members?.map((m, i) => (
            <div key={i} className="text-gray-600 text-xs leading-tight">
              <p className="font-bold text-gray-900 text-sm mb-0.5">{m.name || 'Student'}</p>
              {m.registerNumber && <p>Reg No: <span className="font-medium text-gray-800">{m.registerNumber}</span></p>}
            </div>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 align-top">
        <h4 className="text-gray-900 font-bold max-w-sm whitespace-normal">{team.projectTitle || 'Untitled Project'}</h4>
      </td>
      <td className="px-5 py-4 align-top">
        {(team.currentReview || 0) >= 5 ? (
          <p className="text-green-600 text-sm font-bold">🎉 Completed</p>
        ) : (
          <>
            <p className="text-gray-900 text-sm font-bold">Stage {team.currentReview}</p>
            <p className="text-[#7B1535] font-medium text-xs mt-0.5">{REVIEW_STAGES[team.currentReview] || 'Review'} Review</p>
          </>
        )}
      </td>
      <td className="px-5 py-4 align-top">
         <StatusBadge status={displayStatus} />
      </td>
      <td className="px-5 py-4 align-top text-right">
         <button 
           className="text-xs bg-white group-hover:bg-[#7B1535] group-hover:text-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ml-auto shadow-sm"
         >
           Manage <ChevronRight size={14} />
         </button>
      </td>
    </tr>
  );
}

// ─── Main Faculty Dashboard ───────────────────────────────
export default function FacultyDashboard({ user }) {
  const navigate = useNavigate();
  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data.filter(t =>
        t.guideId?._id?.toString() === user._id?.toString() ||
        t.guideId?.toString()      === user._id?.toString()
      ));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeams(); }, []);

  const pending  = teams.filter(t => t.status === 'pending').length;
  const approved = teams.filter(t => t.status === 'guide_approved').length;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B1535]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Faculty Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome, <span className="text-[#7B1535] font-bold">{user.name}</span></p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-[#7B1535] hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <UserCircle size={16} /> My Profile
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { val: teams.length, label: 'Total Teams',       color: 'text-blue-600' },
            { val: pending,      label: 'Pending Approval',  color: 'text-yellow-600' },
            { val: approved,     label: 'Approved Teams',    color: 'text-green-600'  },
          ].map((s, i) => (
            <GlassCard key={i} className="p-5 text-center bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow">
              <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">{s.label}</p>
            </GlassCard>
          ))}
        </div>



        {/* Teams list */}
        <div>
          <h2 className="text-gray-900 font-bold text-lg mb-4">Assigned Teams ({teams.length})</h2>
          {teams.length === 0 ? (
            <GlassCard className="p-12 text-center bg-white border border-gray-100 shadow-sm">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No teams assigned yet.</p>
              <p className="text-gray-400 text-sm mt-1">Students will appear here when they select you as guide.</p>
            </GlassCard>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-bold">Student Details</th>
                    <th className="px-5 py-4 font-bold">Project Title</th>
                    <th className="px-5 py-4 font-bold">Current Stage</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 whitespace-nowrap md:whitespace-normal">
                  {teams.map(team => (
                    <TeamRow key={team._id} team={team} onAction={fetchTeams} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
