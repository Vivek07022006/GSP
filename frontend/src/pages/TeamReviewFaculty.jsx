import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, ChevronLeft, MessageSquare, Download } from 'lucide-react';

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
    guide_approved: 'Approved', guide_rejected: 'Rejected',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
};

export default function TeamReviewFaculty({ user }) {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/api/teams');
      const found = res.data.find(t => t._id === teamId);
      if (found) setTeam(found);
      
      // Fetch reviews
      if (found && found.status === 'guide_approved') {
        const revs = await api.get(`/api/reviews/${found._id}`);
        setReviews(revs.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const approveTeam = async (status) => {
    setMsg({ type: '', text: '' });
    try {
      await api.post(`/api/guides/team/${team._id}/status`, { status });
      setMsg({ type: 'success', text: status === 'guide_approved' ? '✅ Team approved!' : '❌ Team rejected.' });
      fetchTeamData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const submitFeedback = async () => {
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      await api.post(`/api/reviews/${team._id}/stage-feedback`, {
        text: comment.trim(),
        status: reviewStatus,
      });
      setMsg({ type: 'success', text: `Feedback for Stage ${team.currentReview} submitted!` });
      setComment('');
      fetchTeamData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit feedback.' });
    } finally { setLoading(false); }
  };

  const handleDownload = (e, filename) => {
    e.preventDefault();
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000';
    window.open(`${baseUrl}/uploads/${encodeURIComponent(filename)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B1535]" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <p className="mt-20 text-gray-500 font-medium">Team not found or you don't have access.</p>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-[#7B1535] underline font-bold leading-relaxed px-4 py-2 border rounded-lg bg-gray-100 border-gray-200">Return to Dashboard</button>
    </div>
  );

  const displayStatus = team.status;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{team.projectTitle || 'Untitled Project'}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {team.currentReview >= 5
                ? '🎉 All Reviews Completed'
                : `Stage ${team.currentReview} — ${REVIEW_STAGES[team.currentReview] || ''} Review`}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={displayStatus} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {msg.text && (
          <div className={`px-4 py-3 rounded-xl border ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} font-medium text-sm`}>
            {msg.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-gray-900 font-bold mb-4 border-b border-gray-100 pb-2">Student Information</h3>
            <div className="space-y-4">
              {team.members?.map((m, i) => (
                <div key={i} className="text-gray-600 text-sm">
                  <p className="font-bold text-gray-900 mb-0.5">{m.name || 'Student'}</p>
                  {m.registerNumber && <p>Reg No: <span className="font-medium text-gray-800">{m.registerNumber}</span></p>}
                  {m.email && <p>Email: <span className="font-medium text-gray-800">{m.email}</span></p>}
                  {m.phone && <p>Phone: <span className="font-medium text-gray-800">{m.phone}</span></p>}
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-6">
            {team.status === 'pending' && (
              <GlassCard className="p-6 bg-blue-50 border-blue-200 overflow-hidden relative">
                <p className="text-blue-800 text-base font-bold mb-1">Guide Approval Request</p>
                <p className="text-blue-700 text-sm mb-4">This team has requested you to be their guide.</p>
                <div className="flex gap-3">
                  <button onClick={() => approveTeam('guide_approved')}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors font-bold shadow-sm">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => approveTeam('guide_rejected')}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors font-bold shadow-sm">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </GlassCard>
            )}

            {team.status === 'guide_approved' && team.currentReview >= 1 && team.currentReview <= 4 && (() => {
              // Find if student has submitted for the current stage
              const currentReviewDoc = reviews.find(r => r.reviewStage === team.currentReview);
              const hasSubmission = currentReviewDoc && (currentReviewDoc.pptFileName || currentReviewDoc.submissionFile);

              if (!hasSubmission) {
                return (
                  <GlassCard className="p-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⏳</span>
                      <div>
                        <p className="text-yellow-800 font-bold text-base">Waiting for Student Submission</p>
                        <p className="text-yellow-700 text-sm mt-1">
                          Stage {team.currentReview} — <strong>{REVIEW_STAGES[team.currentReview]} Review</strong>
                        </p>
                        <p className="text-yellow-600 text-xs mt-2">
                          The evaluation panel will unlock once the student uploads their document for this stage.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                );
              }

              return (
                <GlassCard className="p-6">
                  <h3 className="text-gray-900 font-bold mb-4 border-b border-gray-100 pb-2">Evaluate Review</h3>
                  <h5 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Stage {team.currentReview}: {REVIEW_STAGES[team.currentReview]} Review
                  </h5>

                  {/* Show what was submitted */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs text-gray-600 space-y-1">
                    <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1">Student Submitted</p>
                    {currentReviewDoc.pptFileName && (
                      <p>📊 PPT: <a href="#" onClick={(e) => handleDownload(e, currentReviewDoc.pptFileName)} className="text-[#7B1535] font-semibold underline">{currentReviewDoc.pptFileName}</a></p>
                    )}
                    {currentReviewDoc.submissionFile && (
                      <p>📄 Doc: <a href="#" onClick={(e) => handleDownload(e, currentReviewDoc.submissionFile)} className="text-[#7B1535] font-semibold underline">{currentReviewDoc.submissionFile}</a></p>
                    )}
                    {currentReviewDoc.patentStatus && (
                      <p>📑 Patent: <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">{currentReviewDoc.patentStatus}</span></p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase tracking-widest mb-1.5">Comment (optional)</label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                        placeholder="Write your constructive feedback here..."
                        className="w-full text-sm px-3 py-2.5 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#7B1535] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase tracking-widest mb-1.5">Review Decision</label>
                      <select
                        value={reviewStatus}
                        onChange={e => setReviewStatus(e.target.value)}
                        className="w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#7B1535] outline-none"
                      >
                        <option value="approved">✅ Approve & Proceed to Next Stage</option>
                        <option value="changes">⚠️ Request Changes</option>
                        <option value="pending">🕐 Keep Pending</option>
                      </select>
                    </div>

                    <button
                      onClick={submitFeedback}
                      disabled={loading}
                      className="w-full bg-[#7B1535] hover:bg-[#961a42] disabled:opacity-40 text-white text-sm py-3 rounded-lg font-bold transition-colors shadow-sm"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </GlassCard>
              );
            })()}

            {team.status === 'guide_approved' && team.currentReview >= 5 && (
              <GlassCard className="p-6 bg-green-50 border-green-200 text-center">
                <p className="text-green-700 font-bold mb-2 flex items-center justify-center gap-2 text-lg">
                  <CheckCircle size={20} /> All Reviews Completed
                </p>
                <p className="text-green-600 text-sm">This team has successfully cleared all reviews under your guidance.</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Reviews History */}
        {reviews.length > 0 && (
          <GlassCard className="p-6">
            <h3 className="text-gray-900 font-bold mb-4 border-b border-gray-100 pb-2">Review Attachments & History</h3>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-gray-800 text-sm">Stage {r.reviewStage}: {REVIEW_STAGES[r.reviewStage]} Review</span>
                    <StatusBadge status={r.status} />
                  </div>
                  
                  <div className="space-y-2 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1 mb-2">Submitted Files</p>
                    {r.submissionFile && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        📄 Doc: <a href="#" onClick={(e) => handleDownload(e, r.submissionFile)} className="text-[#7B1535] hover:text-[#5a0f27] font-bold underline underline-offset-2 flex items-center gap-1">{r.submissionFile} <Download size={14}/></a>
                      </p>
                    )}
                    {r.pptFileName && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        📊 PPT: <a href="#" onClick={(e) => handleDownload(e, r.pptFileName)} className="text-[#7B1535] hover:text-[#5a0f27] font-bold underline underline-offset-2 flex items-center gap-1">{r.pptFileName} <Download size={14}/></a>
                      </p>
                    )}
                    {r.patentStatus && (
                      <div className="text-sm text-gray-700">
                        <p>Patent Status: <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-medium text-xs">{r.patentStatus}</span></p>
                        {r.patentFileName && (
                          <p className="mt-1 flex items-center gap-2">Proof: <a href="#" onClick={(e) => handleDownload(e, r.patentFileName)} className="text-purple-600 hover:text-purple-800 font-bold underline underline-offset-2 flex items-center gap-1">{r.patentFileName} <Download size={14}/></a></p>
                        )}
                      </div>
                    )}
                    {!r.submissionFile && !r.pptFileName && !r.patentStatus && (
                      <p className="text-xs text-gray-400 italic">No files attached.</p>
                    )}
                  </div>

                  {r.comments?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Feedback History</p>
                      {r.comments.map((c, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-gray-800 leading-relaxed shadow-sm">
                          <span className="font-bold text-[#7B1535]">{c.createdBy?.name || 'Guide'}: </span>{c.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
