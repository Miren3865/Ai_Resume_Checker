import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { getResumes, uploadResume, deleteResume, deleteAllResumes, getResumeFile } from '../api/services';
import ConfirmModal from '../components/ConfirmModal';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  // PDF viewer state
  const [pdfModal, setPdfModal] = useState(null); // resume object
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [viewingResume, setViewingResume] = useState(null); // parsed data modal

  const fetchResumes = (q = '') => {
    setLoading(true);
    getResumes({ search: q, limit: 20 })
      .then((r) => setResumes(r.data.data))
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!candidateName.trim()) { toast.error('Please enter the candidate name'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('candidateName', candidateName.trim());
    if (email.trim()) formData.append('email', email.trim());
    setUploading(true);
    try {
      await uploadResume(formData);
      toast.success('Resume uploaded and parsed successfully!');
      setFile(null);
      setCandidateName('');
      setEmail('');
      if (fileRef.current) fileRef.current.value = '';
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const doDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
      fetchResumes(search);
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  const doDeleteAll = async () => {
    setConfirmDeleteAll(false);
    try {
      const res = await deleteAllResumes();
      const deletedCount = res?.data?.deletedCount ?? 0;
      toast.success(`Deleted ${deletedCount} resumes`);
      fetchResumes(search);
    } catch {
      toast.error('Failed to delete all resumes');
    }
  };

  const handleViewPdf = async (resume) => {
    setPdfModal(resume);
    setPdfUrl(null);
    setPdfLoading(true);
    try {
      const res = await getResumeFile(resume._id);
      const url = URL.createObjectURL(res.data);
      setPdfUrl(url);
    } catch {
      toast.error('Could not load PDF file');
      setPdfModal(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const closePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfModal(null);
    setPdfUrl(null);
  };

  const handleOpenDocx = async (resume) => {
    try {
      const res = await getResumeFile(resume._id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Could not download DOCX file');
    }
  };

  return (
    <div className="space-y-6 page-shell">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
        <p className="text-gray-500 text-sm mt-1">Upload and manage candidate resumes</p>
      </div>

      {/* Upload form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Resume</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Candidate Name *</label>
              <input
                className="input"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input
                type="email"
                className="input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Resume File (PDF or DOCX, max 10MB) *</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <p className="font-medium text-blue-600">📎 {file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">Click to select or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF or DOCX</p>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? '⏳ Parsing resume...' : '📤 Upload & Parse'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">All Resumes ({resumes.length})</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {resumes.length > 0 && (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="btn-danger text-xs px-3 py-1.5"
              >
                Delete All
              </button>
            )}
            <input
              className="input w-full sm:w-72"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); fetchResumes(e.target.value); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : resumes.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No resumes found. Upload one above.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {resumes.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{r.candidateName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(r.skills || []).slice(0, 5).map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {(r.skills || []).length > 5 && (
                      <span className="text-xs text-gray-400">+{r.skills.length - 5} more</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                    {r.fileType}
                  </span>
                  {r.fileType === 'pdf' && r.storedFileName && (
                    <button
                      onClick={() => handleViewPdf(r)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      View PDF
                    </button>
                  )}
                  {r.fileType === 'docx' && r.storedFileName && (
                    <button
                      onClick={() => handleOpenDocx(r)}
                      className="btn-secondary text-xs px-3 py-1.5"
                      title="Downloads and opens in Microsoft Word"
                    >
                      Open in Word
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r._id, r.candidateName)}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {pdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closePdfModal(); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ height: '90vh' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{pdfModal.candidateName}</p>
                <p className="text-xs text-gray-500">{pdfModal.fileName}</p>
              </div>
              <button
                onClick={closePdfModal}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              {pdfLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Resume PDF"
                  className="w-full h-full border-0 rounded-b-xl"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Parsed Resume Data Modal */}
      {viewingResume && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,2,18,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setViewingResume(null)}
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
            <div className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-xl font-bold truncate"
                    style={{ background: 'linear-gradient(90deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {viewingResume.candidateName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {viewingResume.email && <span className="text-sm" style={{ color: '#a0a0c0' }}>{viewingResume.email}</span>}
                    {viewingResume.phone && <span className="text-sm" style={{ color: '#a0a0c0' }}>{viewingResume.phone}</span>}
                    {viewingResume.linkedin && <span className="text-sm" style={{ color: '#818cf8' }}>{viewingResume.linkedin}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}>
                      {viewingResume.fileType?.toUpperCase()}
                    </span>
                    <span style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#f9a8d4', borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}>
                      {new Date(viewingResume.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingResume(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a0a0c0', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Skills */}
              {viewingResume.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7c6fcd' }}>Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingResume.skills.map((s) => (
                      <span key={s} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c4b5fd', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 8px' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {viewingResume.experience?.length > 0 && (
                <div>
                  <div style={{ borderTop: '1px solid rgba(139,92,246,0.12)', marginBottom: '1.25rem' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c6fcd' }}>Experience</p>
                  <div className="space-y-3">
                    {viewingResume.experience.map((ex, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '10px', padding: '12px 14px' }}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: '#e2d9f3' }}>{ex.title}</p>
                          {ex.duration && <span className="text-xs shrink-0" style={{ color: '#6b6b8a' }}>{ex.duration}</span>}
                        </div>
                        {ex.company && <p className="text-xs mt-0.5" style={{ color: '#8b7fc0' }}>{ex.company}</p>}
                        {ex.description && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#9090b0' }}>{ex.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {viewingResume.education?.length > 0 && (
                <div>
                  <div style={{ borderTop: '1px solid rgba(139,92,246,0.12)', marginBottom: '1.25rem' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c6fcd' }}>Education</p>
                  <div className="space-y-2">
                    {viewingResume.education.map((ed, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '10px', padding: '10px 14px' }}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: '#e2d9f3' }}>{ed.degree}</p>
                          {ed.year && <span className="text-xs shrink-0" style={{ color: '#6b6b8a' }}>{ed.year}</span>}
                        </div>
                        {ed.institution && <p className="text-xs mt-0.5" style={{ color: '#8b7fc0' }}>{ed.institution}</p>}
                        {ed.gpa && <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>GPA: {ed.gpa}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {viewingResume.projects?.length > 0 && (
                <div>
                  <div style={{ borderTop: '1px solid rgba(139,92,246,0.12)', marginBottom: '1.25rem' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c6fcd' }}>Projects</p>
                  <div className="space-y-2">
                    {viewingResume.projects.map((p, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '10px', padding: '10px 14px' }}>
                        <p className="font-semibold text-sm" style={{ color: '#e2d9f3' }}>{p.title}</p>
                        {p.description && <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9090b0' }}>{p.description}</p>}
                        {p.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.technologies.map((t) => (
                              <span key={t} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#d8b4fe', borderRadius: '4px', fontSize: '0.65rem', padding: '1px 6px' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete resume for ${confirmDelete.name}?`}
          subMessage="This action cannot be undone."
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmModal
          message="Delete all resumes?"
          subMessage="This will permanently remove every resume you can access."
          onConfirm={doDeleteAll}
          onCancel={() => setConfirmDeleteAll(false)}
          confirmLabel="Delete All"
        />
      )}
    </div>
  );
}
