import { useEffect, useState } from 'react';
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

      {viewingJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,2,18,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setViewingJob(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-xl font-bold truncate"
                    style={{ background: 'linear-gradient(90deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {viewingJob.jobTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {viewingJob.company && (
                      <span className="text-sm font-medium" style={{ color: '#e2d9f3' }}>{viewingJob.company}</span>
                    )}
                    {viewingJob.company && viewingJob.location && (
                      <span style={{ color: 'rgba(139,92,246,0.5)' }}>·</span>
                    )}
                    {viewingJob.location && (
                      <span className="text-sm" style={{ color: '#a0a0c0' }}>{viewingJob.location}</span>
                    )}
                    {viewingJob.department && (
                      <>
                        <span style={{ color: 'rgba(139,92,246,0.5)' }}>·</span>
                        <span className="text-sm" style={{ color: '#a0a0c0' }}>{viewingJob.department}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}>
                      {viewingJob.employmentType}
                    </span>
                    <span style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#d8b4fe', borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}>
                      {viewingJob.experienceLevel}
                    </span>
                    <span style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#f9a8d4', borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}>
                      {new Date(viewingJob.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingJob(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a0a0c0', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', shrink: 0 }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Skills grid */}
              {((viewingJob.requiredSkills?.length > 0) || (viewingJob.preferredSkills?.length > 0) || (viewingJob.keywords?.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {viewingJob.requiredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7c6fcd' }}>Required Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingJob.requiredSkills.map((s) => (
                          <span key={s} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c4b5fd', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 8px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingJob.preferredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7c6fcd' }}>Preferred Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingJob.preferredSkills.map((s) => (
                          <span key={s} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.28)', color: '#e9d5ff', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 8px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingJob.keywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7c6fcd' }}>Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingJob.keywords.map((k) => (
                          <span key={k} style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', color: '#fbcfe8', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 8px' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              {viewingJob.jobDescriptionText && (
                <div style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }} />
              )}

              {/* Job description */}
              {viewingJob.jobDescriptionText && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c6fcd' }}>Job Description</p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: '#c8c0e0' }}
                  >
                    {viewingJob.jobDescriptionText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
