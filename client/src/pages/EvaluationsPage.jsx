import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEvaluations, deleteEvaluation, deleteAllEvaluations } from '../api/services';
import ConfirmModal from '../components/ConfirmModal';

const GRADE_COLOR = { 'A+': '#22c55e', A: '#4ade80', B: '#f59e0b', C: '#f97316', 'Needs Improvement': '#ef4444' };

const formatDateTime = (value) => new Date(value).toLocaleString([], {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // { mode: 'single', id } | { mode: 'all', count }

  const fetchEvals = () => {
    setLoading(true);
    getEvaluations({ limit: 30 })
      .then((r) => setEvaluations(r.data.data))
      .catch(() => toast.error('Failed to load evaluations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvals(); }, []);

  const handleDelete = (id) => {
    setConfirmDelete({ mode: 'single', id });
  };

  const handleDeleteAll = () => {
    setConfirmDelete({ mode: 'all', count: evaluations.length });
  };

  const doDelete = async () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      if (target.mode === 'all') {
        const res = await deleteAllEvaluations();
        const deletedCount = res.data?.deletedCount ?? 0;
        toast.success(`${deletedCount} ${deletedCount === 1 ? 'evaluation' : 'evaluations'} deleted`);
      } else {
        await deleteEvaluation(target.id);
        toast.success('Evaluation deleted');
      }
      fetchEvals();
    } catch {
      toast.error(target.mode === 'all' ? 'Failed to delete all evaluations' : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 page-shell">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-gray-500 text-sm mt-1">Resume vs job match analysis results</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            className="btn-danger text-xs px-3 py-1.5"
            onClick={handleDeleteAll}
            disabled={loading || evaluations.length === 0}
            title="Delete all evaluations"
          >
            Delete All
          </button>
          <Link to="/evaluations/new" className="btn-primary">🎯 New Evaluation</Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No evaluations yet</p>
            <Link to="/evaluations/new" className="btn-primary">Run your first evaluation</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 font-semibold text-gray-600">Candidate</th>
                  <th className="pb-3 font-semibold text-gray-600">Job</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Score</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Grade</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Skills</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Keywords</th>
                  <th className="pb-3 font-semibold text-gray-600">Date</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {evaluations.map((ev) => (
                  <tr key={ev._id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{ev.resumeId?.candidateName || '—'}</p>
                      <p className="text-xs text-gray-400">{ev.resumeId?.email || ''}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{ev.jobId?.jobTitle || '—'}</p>
                      <p className="text-xs text-gray-400">{ev.jobId?.company || ''}</p>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xl font-bold" style={{ color: GRADE_COLOR[ev.grade] || '#6b7280' }}>
                        {ev.matchScore}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className="font-bold text-sm px-2 py-0.5 rounded"
                        style={{
                          color: GRADE_COLOR[ev.grade] || '#6b7280',
                          background: `${GRADE_COLOR[ev.grade] || '#6b7280'}18`,
                        }}
                      >
                        {ev.grade}
                      </span>
                    </td>
                    <td className="py-3 text-center text-gray-600">{ev.skillsCoverage}%</td>
                    <td className="py-3 text-center text-gray-600">{ev.keywordScore}%</td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(ev.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2 justify-end">
                        <Link to={`/evaluations/${ev._id}`} className="btn-secondary text-xs px-3 py-1.5">
                          View
                        </Link>
                        <button onClick={() => handleDelete(ev._id)} className="btn-danger text-xs px-3 py-1.5">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.mode === 'all' ? 'Delete all evaluations?' : 'Delete this evaluation?'}
          subMessage={confirmDelete.mode === 'all'
            ? `This will permanently delete ${confirmDelete.count} ${confirmDelete.count === 1 ? 'evaluation' : 'evaluations'}. This action cannot be undone.`
            : 'This action cannot be undone.'}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
