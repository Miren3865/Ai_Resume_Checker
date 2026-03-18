import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const EMPLOYMENT_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map((label) => ({
  value: label,
  label,
}));

const EXPERIENCE_LEVEL_OPTIONS = ['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'].map((label) => ({
  value: label,
  label,
}));

const formatDateTime = (value) => new Date(value).toLocaleString([], {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function JobsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { mode: 'single', id, title } | { mode: 'all', count }

  const fetchJobs = (q = '') => {
    setLoading(true);
    getJobs({ search: q, limit: 20 })
      .then((r) => setJobs(r.data.data))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (!location.state?.openCreateJob) return;
    setEditingId(null);
    setForm(EMPTY_JOB);
    setShowForm(true);

    // Clear transient navigation state so refresh/back does not keep forcing the form open.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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

  const handleView = (id) => {
    navigate(`/jobs/${id}`);
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
    setConfirmDelete({ mode: 'single', id, title });
  };

  const handleDeleteAll = () => {
    setConfirmDelete({ mode: 'all', count: jobs.length });
  };

  const doDelete = async () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      if (target.mode === 'all') {
        const res = await deleteAllJobs();
        const deletedCount = res.data?.deletedCount ?? 0;
        toast.success(`${deletedCount} ${deletedCount === 1 ? 'job' : 'jobs'} deleted`);
      } else {
        await deleteJob(target.id);
        toast.success('Job deleted');
      }
      fetchJobs(search);
    } catch {
      toast.error(target.mode === 'all' ? 'Failed to delete all jobs' : 'Failed to delete job');
    }
  };

  return (
    <div className="space-y-6 page-shell">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage job postings</p>
        </div>
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
                  onChange={(employmentType) => setForm({ ...form, employmentType })}
                  options={EMPLOYMENT_TYPE_OPTIONS}
                  placeholder="Choose employment type"
                  accentColor="purple"
                />
              </div>
              <div>
                <label className="label">Experience Level</label>
                <ModernSelect
                  value={form.experienceLevel}
                  onChange={(experienceLevel) => setForm({ ...form, experienceLevel })}
                  options={EXPERIENCE_LEVEL_OPTIONS}
                  placeholder="Choose experience level"
                  accentColor="blue"
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <input
              className="input max-w-xs"
              placeholder="Search jobs…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); fetchJobs(e.target.value); }}
            />
            <button
              type="button"
              className="btn-danger text-xs px-3 py-1.5"
              onClick={handleDeleteAll}
              disabled={loading || jobs.length === 0}
              title="Delete all job descriptions"
            >
              Delete All
            </button>
          </div>
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
                  <span className="text-xs text-gray-400">{formatDateTime(j.createdAt)}</span>
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

      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.mode === 'all' ? 'Delete all jobs?' : `Delete "${confirmDelete.title}"?`}
          subMessage={confirmDelete.mode === 'all'
            ? `This will permanently delete ${confirmDelete.count} ${confirmDelete.count === 1 ? 'job' : 'jobs'}. This action cannot be undone.`
            : 'This action cannot be undone.'}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
