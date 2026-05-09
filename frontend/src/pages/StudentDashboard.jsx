import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Users, BookOpen, CheckCircle, FileText, Plus,
  UserCircle, Mail, Briefcase, Hash, AlertCircle, ChevronDown
} from 'lucide-react';

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
  };
  const labels = {
    pending: 'Pending', approved: 'Approved', changes: 'Changes Required',
    guide_approved: 'Guide Approved', guide_rejected: 'Rejected',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
};

const StatCard = ({ icon, label, value, accent }) => (
  <GlassCard className="p-5 flex items-center gap-4">
    <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-gray-900 font-black text-xl mt-1">{value}</p>
    </div>
  </GlassCard>
);

const Msg = ({ msg }) => !msg?.text ? null : (
  <div className={`text-sm px-4 py-3 rounded-xl border flex items-start gap-2 mb-4 ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
    {msg.type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle size={18} className="mt-0.5 shrink-0" />}
    <p>{msg.text}</p>
  </div>
);

const labelCls = "block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5";

// ─── Confirmation modal ───────────────────────────────────
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-xl animate-fade-in">
        <p className="text-gray-900 font-bold text-base mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#7B1535] hover:bg-[#961a42] text-white text-sm font-bold transition-colors shadow-sm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Guide Card ───────────────────────────────────────────
function GuideCard({ guide, onSelect, myTeam }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isFull     = guide.availableSlots <= 0;
  const isSelected = myTeam?.guideId?._id?.toString() === guide._id?.toString()
                  || myTeam?.guideId?.toString() === guide._id?.toString();

  // Generate avatar initials
  const initials = guide.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleConfirm = () => { setConfirmOpen(false); onSelect(guide._id); };

  return (
    <>
      <ConfirmModal
        open={confirmOpen}
        message={`Are you sure you want to add ${guide.name} as your guide?`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
      <GlassCard className={`p-5 flex gap-4 ${isSelected ? 'border-green-300 bg-green-50' : 'bg-white'}`}>
        {/* Avatar / Photo */}
        <div className="flex-shrink-0">
          {guide.photo ? (
            <img
              src={guide.photo}
              alt={guide.name}
              className="w-20 h-20 rounded-xl object-cover shadow-md border border-gray-200"
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
          ) : null}
          <div
            className="w-20 h-20 rounded-xl bg-[#7B1535] flex items-center justify-center text-white font-black text-2xl shadow-md"
            style={{ display: guide.photo ? 'none' : 'flex' }}
          >
            {initials}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-gray-900 font-bold text-base">{guide.name}</h4>
            {isSelected && <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold">✓ Your Guide</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 font-medium mb-3">
            {guide.staffId && (
              <span className="flex items-center gap-1"><Hash size={11} className="text-gray-400" /> {guide.staffId}</span>
            )}
            <span className="flex items-center gap-1"><Mail size={11} className="text-gray-400" /> {guide.email}</span>
            <span className="flex items-center gap-1"><Briefcase size={11} className="text-gray-400" /> {guide.specialization || 'Faculty'}</span>
            <span className={`flex items-center gap-1 font-bold ${isFull ? 'text-red-500' : 'text-green-600'}`}>
              <Users size={11} />
              {isFull
                ? 'No slots available'
                : `${guide.availableSlots} slot${guide.availableSlots !== 1 ? 's' : ''} available (${guide.assignedTeams}/${guide.maxTeams})`
              }
            </span>
          </div>

          {/* Action */}
          {!isSelected && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={isFull}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isFull
                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#7B1535] hover:bg-[#961a42] text-white hover:shadow-md'
              }`}
            >
              {isFull ? '🔒 No Capacity' : '+ Add as Guide'}
            </button>
          )}
        </div>
      </GlassCard>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
export default function StudentDashboard({ user }) {
  const [team, setTeam]       = useState(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [guides, setGuides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  // Create team form
  const [projectTitle,        setProjectTitle]        = useState('');
  const [memberCount,         setMemberCount]         = useState('1');
  const [member2RegNo,        setMember2RegNo]        = useState('');
  const [teamMsg,             setTeamMsg]             = useState({ type: '', text: '' });
  const [teamLoading,         setTeamLoading]         = useState(false);

  // Guide selection
  const [guideMsg,  setGuideMsg]  = useState({ type: '', text: '' });
  const [guideLoad, setGuideLoad] = useState(false);

  // Reviews
  const [reviewFile,   setReviewFile]   = useState(null);
  const [patentStatus, setPatentStatus] = useState('');
  const [patentFile,   setPatentFile]   = useState(null);
  const [reviewMsg,    setReviewMsg]    = useState({ type: '', text: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [checkRes, guidesRes] = await Promise.all([
        api.get('/api/teams/check-mine'),
        api.get('/api/guides'),
      ]);
      setHasTeam(checkRes.data.hasTeam);
      setTeam(checkRes.data.team);
      setGuides(guidesRes.data);

      if (checkRes.data.team) {
        const revRes = await api.get(`/api/reviews/${checkRes.data.team._id}`);
        setReviews(revRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    setTeamMsg({ type: '', text: '' });
    setTeamLoading(true);
    try {
      const payload = { projectTitle };
      if (memberCount === '2' && member2RegNo.trim()) {
        payload.member2RegisterNumber = member2RegNo.trim();
      }
      await api.post('/api/teams', payload);
      setTeamMsg({ type: 'success', text: 'Team created successfully!' });
      fetchData();
    } catch (err) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create team.' });
    } finally { setTeamLoading(false); }
  };

  const selectGuide = async (guideId) => {
    if (!team) return setGuideMsg({ type: 'error', text: 'Create a team first.' });
    setGuideLoad(true);
    setGuideMsg({ type: '', text: '' });
    try {
      await api.post(`/api/teams/${team._id}/select-guide`, { guideId });
      setGuideMsg({ type: 'success', text: 'Guide selected! Awaiting approval.' });
      fetchData();
    } catch (err) {
      setGuideMsg({ type: 'error', text: err.response?.data?.message || 'Failed to select guide.' });
    } finally { setGuideLoad(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMsg({ type: '', text: '' });
    try {
      const formData = new FormData();
      // No need to send reviewStage, backend reads team.currentReview
      if (reviewFile) formData.append('document', reviewFile);
      if (patentStatus) formData.append('patentStatus', patentStatus);
      if (patentFile && ['Acceptance', 'Applied'].includes(patentStatus)) {
        formData.append('patentFile', patentFile);
      }

      await api.post(`/api/reviews/${team._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReviewMsg({ type: 'success', text: `${REVIEW_STAGES[currentStage]} Review submitted! Awaiting guide feedback.` });
      // Reset form variables
      setReviewFile(null);
      setPatentStatus('');
      setPatentFile(null);
      fetchData();
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    }
  };

  const currentStage = team?.currentReview || 0;
  // Progress: each COMPLETED stage counts. Stage 4 = 3 done = 75%. Stage 5 = all done = 100%
  const progress = currentStage >= 5 ? 100 : Math.max(0, Math.round(((currentStage - 1) / 4) * 100));

  const guideSelected = !!(team?.guideId);
  // Show guide tab if no guide selected OR if the guide rejected (allow re-selection)
  const needsGuideSelection = !guideSelected || team?.status === 'guide_rejected';

  // Find the exact document for the currently active stage
  const currentReviewDoc = reviews.find(r => r.reviewStage === currentStage);
  
  let isWaitingOnGuide = false;
  let isChangesRequired = false;

  if (currentReviewDoc) {
    if (currentReviewDoc.status === 'changes') {
       isChangesRequired = true;
    } else if (currentReviewDoc.status === 'pending') {
       if (currentReviewDoc.comments && currentReviewDoc.comments.length > 0) {
         const lastCommentTime = new Date(currentReviewDoc.comments[currentReviewDoc.comments.length - 1].createdAt).getTime();
         const submitTime = new Date(currentReviewDoc.submittedAt || Date.now()).getTime();
         
         if (submitTime > lastCommentTime) {
            isWaitingOnGuide = true;
         } else {
            isChangesRequired = true; 
         }
       } else {
         isWaitingOnGuide = true;
       }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'team',     label: hasTeam ? 'My Team' : 'Create Team' },
    // Show guide selection if no guide chosen OR if team was rejected
    ...(needsGuideSelection ? [{ id: 'guide', label: 'Guide Selection' }] : []),
    { id: 'reviews',  label: 'Reviews' },
  ];

  const inputCls = "w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#7B1535] transition-all";
  const labelCls = "block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5";

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-black text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="text-[#7B1535] font-semibold">{user.name}</span></p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} className="text-blue-600" />} label="Team Status"
            value={team ? <StatusBadge status={team.status} /> : 'No Team'} accent="bg-blue-50" />
          <StatCard icon={<BookOpen size={18} className="text-pink-600" />} label="Current Review"
            value={currentStage >= 5 ? 'Completed ✓' : currentStage > 0 ? `${REVIEW_STAGES[currentStage]} Review` : 'Awaiting Guide'} accent="bg-pink-50" />
          <StatCard icon={<CheckCircle size={18} className="text-green-600" />} label="Progress"
            value={`${progress}% Complete`} accent="bg-green-50" />
        </div>

        {/* Progress bar */}
        {team && (
          <GlassCard className="p-6">
            <h3 className="text-gray-900 font-bold mb-4">Project Progress</h3>
            <div className="flex justify-between text-sm mb-2 font-bold">
              <span className="text-gray-600">Stage {Math.min(currentStage, 4)} / 4</span>
              <span className="text-[#7B1535]">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-[#7B1535] to-[#c0395c]" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-gray-400 text-xs mt-3">Currently active: {currentStage >= 5 ? 'All Reviews Completed 🎉' : currentStage > 0 ? `${REVIEW_STAGES[currentStage]} Review` : 'Awaiting Guide Approval'}</p>
          </GlassCard>
        )}

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${tab === t.id ? 'border-[#7B1535] text-[#7B1535]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label} 
              {t.id === 'guide' && !guideSelected && <span className="ml-1.5 w-2 h-2 inline-block bg-red-400 rounded-full animate-pulse" />}
              {t.id === 'reviews' && currentStage > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#7B1535] text-white text-[10px]">{currentStage}</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
             OVERVIEW
        ══════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {!team ? (
              <GlassCard className="p-10 text-center">
                <Users size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-semibold">No Team Yet</p>
                <p className="text-gray-400 text-sm mt-1">Go to <button onClick={() => setTab('team')} className="text-[#7B1535] underline underline-offset-2 hover:text-gray-900">Create Team</button> tab to get started.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-6">
                  <h3 className="text-gray-900 font-bold mb-4">Team Details</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Project Title', val: team.projectTitle || '—' },
                      { label: 'Members', val: team.members?.map(m => m.name || m).join(' & ') },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <span className="text-gray-500 font-medium">{item.label}</span>
                        <span className="text-gray-900 font-medium">{item.val}</span>
                      </div>
                    ))}
                    {/* Guide with photo */}
                    <div className="flex justify-between border-b border-gray-100 pb-3 items-center">
                      <span className="text-gray-500 font-medium">Guide</span>
                      {team.guideId ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const g = guides.find(x => x._id?.toString() === (team.guideId?._id || team.guideId)?.toString());
                            return g?.photo ? (
                              <img src={g.photo} alt={team.guideId?.name} className="w-7 h-7 rounded-lg object-cover border border-gray-200" onError={e => e.target.style.display='none'} />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-[#7B1535] flex items-center justify-center text-white text-xs font-black">
                                {(team.guideId?.name || 'G').split(' ').map(n=>n[0]).join('').slice(0,2)}
                              </div>
                            );
                          })()}
                          <span className="text-gray-900 font-medium">{team.guideId?.name || 'Assigned'}</span>
                        </div>
                      ) : <span className="text-gray-400">Not assigned</span>}
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500 font-medium">Status</span>
                      <StatusBadge status={team.status} />
                    </div>
                  </div>
                </GlassCard>
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-5">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">My Role</p>
                    <p className="text-gray-900 font-bold capitalize">{user.role}</p>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                    <p className="font-bold text-green-600">Active</p>
                  </GlassCard>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
             CREATE / VIEW TEAM
        ══════════════════════════════ */}
        {tab === 'team' && (
          <GlassCard className="p-6">
            {hasTeam && team ? (
              /* ─ My Team view ─ */
              <div>
                <h3 className="text-gray-900 font-bold mb-5">My Team</h3>
                <div className="space-y-5 text-sm">
                  <div>
                    <p className={labelCls}>Project Title</p>
                    <p className="text-gray-900 font-semibold text-base">{team.projectTitle || '—'}</p>
                  </div>
                  <div>
                    <p className={labelCls}>Members</p>
                    <div className="space-y-2">
                      {team.members?.map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#7B1535]/10 border border-[#7B1535]/20 rounded-full flex items-center justify-center text-xs font-black text-[#7B1535]">
                            {(m.name || 'U')[0]}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">{m.name || m}</p>
                            {m.registerNumber && <p className="text-gray-400 text-xs">{m.registerNumber}</p>}
                          </div>
                          {m._id?.toString() === user._id?.toString() && (
                            <span className="text-xs text-[#7B1535] bg-[#7B1535]/10 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─ Create Team form ─ */
              <form onSubmit={createTeam} className="space-y-5">
                <div>
                  <h3 className="text-gray-900 font-bold text-lg mb-0.5">Create Your Team</h3>
                  <p className="text-gray-400 text-xs">Fill in the details to form your project team.</p>
                </div>

                <Msg msg={teamMsg} />

                {/* Project title */}
                <div>
                  <label className={labelCls}>Project Title *</label>
                  <input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} required className={inputCls} />
                </div>

                {/* Number of students */}
                <div>
                  <label className={labelCls}>Number of Students in Team *</label>
                  <div className="relative">
                    <select value={memberCount} onChange={e => setMemberCount(e.target.value)}
                      className={`${inputCls} pr-8 appearance-none cursor-pointer`}>
                      <option value="1">1 — Solo Project</option>
                      <option value="2">2 — Team Project</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Member 1 — always the current user */}
                <div>
                  <label className={labelCls}>Register Number — Member 1 (You)</label>
                  <input
                    value={user.registerNumber || '(not set)'}
                    readOnly
                    className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`}
                  />
                </div>

                {/* Member 2 — only if team size = 2 */}
                {memberCount === '2' && (
                  <div>
                    <label className={labelCls}>Register Number — Member 2 *</label>
                    <input
                      value={member2RegNo}
                      onChange={e => setMember2RegNo(e.target.value)}
                      required
                      className={inputCls}
                    />
                    <p className="text-gray-400 text-xs mt-1">Enter the register number of your team partner.</p>
                  </div>
                )}

                <button type="submit" disabled={teamLoading}
                  className="w-full bg-[#7B1535] hover:bg-[#961a42] disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                  {teamLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                    : <><Plus size={15} /> Create Team</>
                  }
                </button>
              </form>
            )}
          </GlassCard>
        )}

        {/* ══════════════════════════════
             GUIDE SELECTION
        ══════════════════════════════ */}
        {tab === 'guide' && (
          <div className="space-y-4">
            <Msg msg={guideMsg} />

            {/* No team yet */}
            {!team && (
              <GlassCard className="p-6 text-center">
                <p className="text-orange-600 text-sm">Please <button onClick={() => setTab('team')} className="underline underline-offset-2 hover:text-gray-900">create your team</button> first before selecting a guide.</p>
              </GlassCard>
            )}

            {/* Guide REJECTED — show banner + full list for re-selection */}
            {team && team.status === 'guide_rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-start gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <p className="font-bold">Your guide selection was rejected.</p>
                  <p className="text-xs text-red-500 mt-1">Please select a different guide from the list below.</p>
                </div>
              </div>
            )}

            {/* Guide already selected AND approved → show ONLY that guide */}
            {team && guideSelected && team.status !== 'guide_rejected' && (() => {
              const myGuide = guides.find(g =>
                g._id?.toString() === (team.guideId?._id || team.guideId)?.toString()
              );
              return (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle size={15} className="flex-shrink-0" />
                    Guide selected! Awaiting approval from your guide.
                  </div>
                  {myGuide && (
                    <GuideCard guide={myGuide} onSelect={() => {}} myTeam={team} />
                  )}
                </div>
              );
            })()}

            {/* Guide not yet selected OR was rejected → list all faculty */}
            {team && (!guideSelected || team.status === 'guide_rejected') && (
              guides.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <UserCircle size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No faculty guides available yet.</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {guides.map(guide => (
                    <GuideCard
                      key={guide._id}
                      guide={guide}
                      onSelect={selectGuide}
                      myTeam={team}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ══════════════════════════════
             REVIEWS
        ══════════════════════════════ */}
        {tab === 'reviews' && (
          <div className="space-y-4">
            {!team && (
              <GlassCard className="p-6 text-center text-gray-500 text-sm">Create a team first to submit reviews.</GlassCard>
            )}
            {team && team.status !== 'guide_approved' && (
              <GlassCard className="p-6">
                <p className="text-orange-600 text-sm text-center">Your guide must approve your team before you can submit reviews.</p>
              </GlassCard>
            )}
            {team && team.status === 'guide_approved' && (
              <>
                <GlassCard className="p-6">
                  <h3 className="text-gray-900 font-bold mb-4">Submit Review</h3>
                  <Msg msg={reviewMsg} />
                  
                  {currentStage >= 5 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-8 text-center text-green-700">
                      <CheckCircle size={32} className="mx-auto mb-3" />
                      <p className="font-bold">All Reviews Completed!</p>
                      <p className="text-xs text-gray-500 mt-1">Your team has successfully cleared all stages.</p>
                    </div>
                  ) : currentStage > 0 ? (
                    isWaitingOnGuide ? (
                      <div className="text-center py-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <AlertCircle size={28} className="text-yellow-600 mx-auto mb-3" />
                        <p className="text-yellow-800 font-bold mb-1">Under Review</p>
                        <p className="text-yellow-700 text-sm px-4">You have submitted the Review. Awaiting guide evaluation.</p>
                      </div>
                    ) : (
                      <form onSubmit={submitReview} className="space-y-4 mt-4 text-sm">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <span className="text-gray-400 block text-xs uppercase tracking-widest font-bold mb-1">Active Stage</span>
                          <span className="text-[#7B1535] font-semibold text-base">Stage {currentStage} — {REVIEW_STAGES[currentStage]} Review</span>
                        </div>

                        {isChangesRequired && currentReviewDoc && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-red-700 font-bold text-sm mb-2 flex items-center gap-2">
                              <AlertCircle size={15} /> Feedback / Changes Requested:
                            </p>
                            <div className="space-y-2">
                              {currentReviewDoc.comments?.map((c, i) => (
                                <p key={i} className="text-sm text-red-800 bg-red-100 p-2 rounded border border-red-200">
                                  {c.text}
                                </p>
                              ))}
                            </div>
                            <p className="text-xs text-red-500 mt-3 italic">Please update your documents and resubmit.</p>
                          </div>
                        )}

                      {/* Always show main document upload */}
                      <div>
                        <label className={labelCls}>
                          Upload Document {(currentStage === 1 || currentStage === 2) ? '(PPT)' : '(PDF, DOC)'}
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#7B1535]/60 transition-colors">
                          <FileText size={22} className="mx-auto text-gray-300 mb-2" />
                          <input type="file" onChange={e => setReviewFile(e.target.files[0])}
                            accept=".pdf,.ppt,.pptx,.doc,.docx" className="hidden" id="rev-file" />
                          <label htmlFor="rev-file" className="cursor-pointer text-sm text-[#7B1535] hover:text-gray-900 transition-colors">
                            {reviewFile ? reviewFile.name : 'Click to choose file'}
                          </label>
                        </div>
                      </div>

                      {/* If stage 1 or 2, show patent dropdown */}
                      {(currentStage === 1 || currentStage === 2) && (
                        <div>
                          <label className={labelCls}>Paper Publication / Patent Status</label>
                          <div className="relative mb-3">
                            <select value={patentStatus} onChange={e => setPatentStatus(e.target.value)}
                              className={`${inputCls}`}>
                              <option value="">Select status...</option>
                              <option value="Acceptance">Acceptance</option>
                              <option value="In-Progress">In-Progress</option>
                              <option value="Applied">Applied</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>

                          {(patentStatus === 'Acceptance' || patentStatus === 'Applied') && (
                            <div className="mt-3">
                              <label className={labelCls}>
                                Upload {patentStatus === 'Acceptance' ? 'Acceptance Letter' : 'Applied Mail Screenshot'}
                              </label>
                              <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl py-4 text-center hover:border-[#7B1535]/40 transition-colors">
                                <input type="file" onChange={e => setPatentFile(e.target.files[0])}
                                  accept=".pdf,image/*" className="hidden" id="patent-file" />
                                <label htmlFor="patent-file" className="cursor-pointer text-xs text-[#7B1535] hover:text-gray-900 transition-colors">
                                  {patentFile ? patentFile.name : `Click to attach ${patentStatus.toLowerCase()} proof`}
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button type="submit"
                        className="w-full bg-[#7B1535] hover:bg-[#961a42] text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-3">
                        Submit Review
                      </button>
                    </form>
                    )
                  ) : (
                    <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-sm">
                      Awaiting initial setup.
                    </div>
                  )}
                </GlassCard>

                {reviews.length > 0 && (
                  <GlassCard className="p-6">
                    <h3 className="text-gray-900 font-bold mb-4 border-b border-gray-100 pb-2">Review History</h3>
                    <div className="space-y-4">
                      {reviews.map(r => (
                        <div key={r._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-900 font-bold text-sm">Stage {r.reviewStage}: {REVIEW_STAGES[r.reviewStage]} Review</span>
                            <StatusBadge status={r.status} />
                          </div>
                          
                          {/* Display previously submitted files */}
                          <div className="bg-white rounded border border-gray-100 p-2.5 mb-2 mt-3 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Submitted Files</p>
                            {r.submissionFile && (
                              <p className="text-xs text-gray-700 flex items-center gap-1.5">
                                📄 Doc: <span className="text-[#7B1535] font-semibold">{r.submissionFile}</span>
                              </p>
                            )}
                            {r.pptFileName && (
                              <p className="text-xs text-gray-700 flex items-center gap-1.5">
                                📊 PPT: <span className="text-[#7B1535] font-semibold">{r.pptFileName}</span>
                              </p>
                            )}
                            {r.patentStatus && (
                              <div className="text-xs text-gray-700 mt-1.5">
                                Patent Status: <span className="text-gray-900 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded ml-1 font-medium">{r.patentStatus}</span>
                                {r.patentFileName && (
                                  <p className="mt-1">Proof: <span className="text-pink-600 font-medium">{r.patentFileName}</span></p>
                                )}
                              </div>
                            )}
                            {!r.submissionFile && !r.pptFileName && !r.patentStatus && (
                              <p className="text-xs text-gray-400 italic">No files attached.</p>
                            )}
                          </div>

                          {r.comments?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-0.5">Feedback History</p>
                              <div className="space-y-1.5">
                                {r.comments.map((c, i) => (
                                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 shadow-sm leading-relaxed">
                                    <span className="font-bold text-[#7B1535]">{c.createdBy?.name || 'Guide'}:</span>{' '}{c.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
