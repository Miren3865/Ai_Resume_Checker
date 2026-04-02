import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { getJobs, createJob, updateJob, deleteJob, deleteAllJobs, getJob } from '../api/services';
import ConfirmModal from '../components/ConfirmModal';
import ModernSelect from '../components/ModernSelect';

const EMPTY_JOB = {
  jobTitle: '',
  company: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  experienceLevel: 'Entry',
  requiredSkillsText: '',
  preferredSkillsText: '',
  keywordsText: '',
  jobDescriptionText: '',
};

const SIDEBAR_WIDTH = 252;

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [viewingJob, setViewingJob] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchJobs = (q = '') => {
    setLoading(true);
    getJobs({ search: q, limit: 20 })
      .then((r) => setJobs(r.data.data))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (!viewingJob) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') setViewingJob(null);
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [viewingJob]);

  useEffect(() => {
    if (!viewingJob) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewingJob]);

  const handleEdit = async (id) => {
    try {
      const res = await getJob(id);
      const j = res.data.data;
      setForm({
        jobTitle: j.jobTitle || '',
        company: j.company || '',
        department: j.department || '',
        location: j.location || '',
        employmentType: j.employmentType || 'Full-time',
        experienceLevel: j.experienceLevel || 'Entry',
        requiredSkillsText: (j.requiredSkills || []).join('\n'),
        preferredSkillsText: (j.preferredSkills || []).join('\n'),
        keywordsText: (j.keywords || []).join('\n'),
        jobDescriptionText: j.jobDescriptionText || '',
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast.error('Failed to load job details');
    }
  };

  const handleView = async (id) => {
    try {
      const res = await getJob(id);
      setViewingJob(res.data.data);
    } catch {
      toast.error('Failed to load job details');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_JOB);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        requiredSkills: form.requiredSkillsText.split('\n').map((s) => s.trim()).filter(Boolean),
        preferredSkills: form.preferredSkillsText.split('\n').map((s) => s.trim()).filter(Boolean),
        keywords: form.keywordsText.split('\n').map((k) => k.trim()).filter(Boolean),
      };
      delete payload.requiredSkillsText;
      delete payload.preferredSkillsText;
      delete payload.keywordsText;

      if (editingId) {
        await updateJob(editingId, payload);
        toast.success('Job description updated!');
      } else {
        await createJob(payload);
        toast.success('Job description created!');
      }
      handleCancel();
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, title) => {
    setConfirmDelete({ id, title });
  };

  const doDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteJob(id);
      toast.success('Job deleted');
      fetchJobs(search);
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const doDeleteAll = async () => {
    setConfirmDeleteAll(false);
    try {
      const res = await deleteAllJobs();
      const deletedCount = res?.data?.deletedCount ?? 0;
      toast.success(`Deleted ${deletedCount} jobs`);
      fetchJobs(search);
    } catch {
      toast.error('Failed to delete all jobs');
    }
  };

  return (
    <div className="space-y-6 page-shell">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage job postings</p>
        </div>
        <div className="flex items-center gap-2">
          {jobs.length > 0 && !loading && (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="btn-danger text-xs px-3 py-1.5"
            >
              Delete All
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => {
              if (showForm && !editingId) {
                handleCancel();
              } else {
                handleCancel();
                setShowForm(true);
              }
            }}
          >
            {showForm && !editingId ? 'Cancel' : '+ Add Job'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Job Description' : 'New Job Description'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Job Title *</label>
                <input className="input" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} required />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="label">Employment Type</label>
                <ModernSelect
                  value={form.employmentType}
                  onChange={(val) => setForm({ ...form, employmentType: val })}
                  placeholder="Select employment type"
                  accentColor="blue"
                  searchable={false}
                  options={['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />
              </div>
              <div>
                <label className="label">Experience Level</label>
                <ModernSelect
                  value={form.experienceLevel}
                  onChange={(val) => setForm({ ...form, experienceLevel: val })}
                  placeholder="Select experience level"
                  accentColor="purple"
                  searchable={false}
                  options={['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'].map((l) => ({
                    value: l,
                    label: l,
                  }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Required Skills (one per line)</label>
              <textarea
                className="input"
                rows={4}
                placeholder="React.js&#10;Node.js&#10;MongoDB&#10;Express.js"
                value={form.requiredSkillsText}
                onChange={(e) => setForm({ ...form, requiredSkillsText: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Preferred Skills (one per line)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="TypeScript&#10;Docker&#10;AWS"
                value={form.preferredSkillsText}
                onChange={(e) => setForm({ ...form, preferredSkillsText: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Keywords (one per line)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="MERN Stack&#10;Full Stack&#10;Agile"
                value={form.keywordsText}
                onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Full Job Description Text *</label>
              <textarea
                className="input"
                rows={6}
                placeholder="Paste the complete job description here…"
                value={form.jobDescriptionText}
                onChange={(e) => setForm({ ...form, jobDescriptionText: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? '💾 Update Job' : '💾 Save Job'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">All Jobs ({jobs.length})</h2>
          <input
            className="input max-w-xs"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); fetchJobs(e.target.value); }}
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
        ) : jobs.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No jobs found. Add one above.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {jobs.map((j) => (
              <div key={j._id} className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{j.jobTitle}</p>
                  <p className="text-sm text-gray-500">{j.company} {j.location ? `· ${j.location}` : ''}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{j.employmentType}</span>
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{j.experienceLevel}</span>
                    <span className="text-xs text-gray-400">{(j.requiredSkills || []).length} required skills</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400">{new Date(j.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleView(j._id)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(j._id)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(j._id, j.jobTitle)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingJob && createPortal(
        <div className="fixed inset-0 z-[1000] p-0 animate-fadeIn">
          <div
            className="absolute top-0 right-0 bottom-0"
            style={{
              left: `${SIDEBAR_WIDTH}px`,
              background: 'rgba(5,5,15,0.42)',
              backdropFilter: 'blur(18px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
            }}
            onClick={() => setViewingJob(null)}
          />
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${SIDEBAR_WIDTH}px`,
              right: 0,
              background: 'radial-gradient(ellipse at 60% 40%, rgba(139,92,246,0.16) 0%, rgba(10,10,30,0.88) 82%)',
            }}
          />
          <div
            className="absolute flex flex-col overflow-hidden shadow-2xl border border-violet-400/30 animate-slideUp"
            style={{
              background: 'linear-gradient(120deg, rgba(34,34,60,0.97) 80%, rgba(139,92,246,0.10) 100%)',
              top: '1cm',
              right: '1cm',
              bottom: '1cm',
              left: `calc(${SIDEBAR_WIDTH}px + 1cm)`,
              borderRadius: '24px',
              overflow: 'hidden',
              zIndex: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-10 pt-10 pb-6 shrink-0 flex items-start justify-between gap-4 border-b border-violet-400/15">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-violet-300 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-lg animate-gradient">
                  {viewingJob.jobTitle}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {viewingJob.company && (
                    <span className="text-lg font-semibold" style={{ color: '#e2d9f3' }}>{viewingJob.company}</span>
                  )}
                  {viewingJob.company && viewingJob.location && (
                    <span style={{ color: 'rgba(139,92,246,0.5)' }}>·</span>
                  )}
                  {viewingJob.location && (
                    <span className="text-lg" style={{ color: '#a0a0c0' }}>{viewingJob.location}</span>
                  )}
                  {viewingJob.department && (
                    <>
                      <span style={{ color: 'rgba(139,92,246,0.5)' }}>·</span>
                      <span className="text-lg" style={{ color: '#a0a0c0' }}>{viewingJob.department}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', borderRadius: '999px', fontSize: '0.9rem', padding: '4px 16px' }}>
                    {viewingJob.employmentType}
                  </span>
                  <span style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#d8b4fe', borderRadius: '999px', fontSize: '0.9rem', padding: '4px 16px' }}>
                    {viewingJob.experienceLevel}
                  </span>
                  <span style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#f9a8d4', borderRadius: '999px', fontSize: '0.9rem', padding: '4px 16px' }}>
                    {new Date(viewingJob.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingJob(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#a0a0c0', borderRadius: '10px', padding: '10px 22px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, boxShadow: '0 2px 12px 0 rgba(139,92,246,0.10)' }}
                className="hover:bg-pink-500/20 hover:text-pink-200 transition-colors duration-200"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8 custom-scrollbar">
              {((viewingJob.requiredSkills?.length > 0) || (viewingJob.preferredSkills?.length > 0) || (viewingJob.keywords?.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {viewingJob.requiredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3 text-violet-300">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingJob.requiredSkills.map((s) => (
                          <span key={s} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c4b5fd', borderRadius: '8px', fontSize: '0.85rem', padding: '4px 12px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingJob.preferredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3 text-pink-200">Preferred Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingJob.preferredSkills.map((s) => (
                          <span key={s} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.28)', color: '#e9d5ff', borderRadius: '8px', fontSize: '0.85rem', padding: '4px 12px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingJob.keywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3 text-fuchsia-200">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingJob.keywords.map((k) => (
                          <span key={k} style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', color: '#fbcfe8', borderRadius: '8px', fontSize: '0.85rem', padding: '4px 12px' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewingJob.jobDescriptionText && (
                <div className="border-t border-violet-400/10 my-2" />
              )}

              {viewingJob.jobDescriptionText && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4 text-violet-200">Job Description</p>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap text-violet-50 drop-shadow-md animate-fadeIn" style={{ letterSpacing: '0.01em' }}>
                    {viewingJob.jobDescriptionText}
                  </p>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
            @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
            .animate-slideUp { animation: slideUp 0.7s cubic-bezier(.4,0,.2,1); }
            .animate-gradient { background-size: 200% 200%; animation: gradientMove 3s ease-in-out infinite alternate; }
            @keyframes gradientMove { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
            .custom-scrollbar::-webkit-scrollbar { width: 10px; background: rgba(139,92,246,0.08); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.18); border-radius: 8px; }
          `}</style>
        </div>,
        document.body
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.title}"?`}
          subMessage="This action cannot be undone."
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmModal
          message="Delete all job descriptions?"
          subMessage="This will permanently remove every job description you can access."
          onConfirm={doDeleteAll}
          onCancel={() => setConfirmDeleteAll(false)}
          confirmLabel="Delete All"
        />
      )}
    </div>
  );
}
