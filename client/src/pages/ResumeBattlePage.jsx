import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getResumes, getJobs, resumeBattle } from '../api/services';
import DonutChart from '../components/DonutChart';
import ModernSelect from '../components/ModernSelect';
import ScoreBar from '../components/ScoreBar';

const SCORE_BARS = [
  { key: 'skillsCoverage', label: 'Skills', color: 'blue' },
  { key: 'experienceAlignment', label: 'Experience', color: 'green' },
  { key: 'educationMatch', label: 'Education', color: 'purple' },
  { key: 'keywordScore', label: 'Keywords', color: 'yellow' },
  { key: 'formattingScore', label: 'Formatting', color: 'orange' },
];

const RANK_ICON = ['🥇', '🥈', '🥉'];

export default function ResumeBattlePage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [jobId, setJobId] = useState('');
  const [results, setResults] = useState(null);
  const [battledJob, setBattledJob] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getResumes({ limit: 50 }), getJobs({ limit: 50 })]).then(([r, j]) => {
      setResumes(r.data.data);
      setJobs(j.data.data);
    });
  }, []);

  const toggleResume = (id) => {
    setSelectedResumes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleBattle = async (e) => {
    e.preventDefault();
    if (selectedResumes.length < 2) { toast.error('Select at least 2 resumes'); return; }
    if (!jobId) { toast.error('Select a job description'); return; }
    setLoading(true);
    setResults(null);
    try {
      const res = await resumeBattle({ resumeIds: selectedResumes, jobId });
      setResults(res.data.results);
      setBattledJob(res.data.job);
      toast.success('Battle complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Battle failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-shell">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚔️ Resume Battle</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compare multiple candidates against the same job
        </p>
      </div>

      <form onSubmit={handleBattle} className="space-y-6">
        {/* Job select */}
        <div className="card">
          <label className="label text-base font-semibold">1. Select Job Description *</label>
          <div className="mt-2">
            <ModernSelect
              value={jobId}
              onChange={setJobId}
              placeholder="Choose a job"
              accentColor="blue"
              searchable
              options={jobs.map((j) => ({
                value: j._id,
                label: j.jobTitle,
                sub: j.company ? `@ ${j.company}` : undefined,
              }))}
            />
          </div>
        </div>

        {/* Resume select */}
        <div className="card">
          <label className="label text-base font-semibold">
            2. Select Candidates (min 2, max 10)
          </label>
          <p className="text-sm text-gray-400 mb-3">
            {selectedResumes.length} selected
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {resumes.map((r) => {
              const checked = selectedResumes.includes(r._id);
              return (
                <label
                  key={r._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleResume(r._id)}
                    className="w-4 h-4"
                  />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm text-gray-900 truncate">{r.candidateName}</p>
                    <p className="text-xs text-gray-400 truncate">{r.email || 'No email'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary text-base px-8 py-3 w-full sm:w-auto justify-center"
          disabled={loading}
        >
          {loading ? '⏳ battling…' : '⚔️ Start Battle'}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold">Battle Results</h2>
            <p className="text-blue-100 text-sm mt-1">
              {battledJob?.title} {battledJob?.company ? `@ ${battledJob.company}` : ''}
            </p>
          </div>

          {/* Ranking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.slice(0, 3).map((r) => (
              <div
                key={r.resumeId}
                className={`card border-2 ${
                  r.rank === 1
                    ? 'border-yellow-400 bg-yellow-50'
                    : r.rank === 2
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-orange-300 bg-orange-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{RANK_ICON[r.rank - 1] || `#${r.rank}`}</span>
                  <div>
                    <p className="font-bold text-gray-900">{r.candidateName}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </div>
                </div>
                <DonutChart score={r.matchScore} label="Match Score" />
              </div>
            ))}
          </div>

          {/* Full comparison table */}
          <div className="card overflow-x-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Full Comparison</h3>
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2 pr-4">Rank</th>
                  <th className="pb-2 pr-4">Candidate</th>
                  <th className="pb-2 pr-4 text-center">Total</th>
                  <th className="pb-2 pr-4 text-center">Skills</th>
                  <th className="pb-2 pr-4 text-center">Exp</th>
                  <th className="pb-2 pr-4 text-center">Edu</th>
                  <th className="pb-2 pr-4 text-center">Keywords</th>
                  <th className="pb-2 text-center">Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => (
                  <tr key={r.resumeId} className={r.rank === 1 ? 'bg-yellow-50' : ''}>
                    <td className="py-3 pr-4 font-bold">{RANK_ICON[r.rank - 1] || `#${r.rank}`}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{r.candidateName}</p>
                      <p className="text-xs text-gray-400">{r.grade}</p>
                    </td>
                    <td className="py-3 pr-4 text-center font-bold text-blue-600">{r.matchScore}%</td>
                    <td className="py-3 pr-4 text-center">{r.skillsCoverage}%</td>
                    <td className="py-3 pr-4 text-center">{r.experienceAlignment}%</td>
                    <td className="py-3 pr-4 text-center">{r.educationMatch}%</td>
                    <td className="py-3 pr-4 text-center">{r.keywordScore}%</td>
                    <td className="py-3 text-center">{r.formattingScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Individual score bars per candidate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r) => (
              <div key={r.resumeId} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span>{RANK_ICON[r.rank - 1] || `#${r.rank}`}</span>
                  <h4 className="font-semibold text-gray-900">{r.candidateName}</h4>
                </div>
                <div className="space-y-3">
                  {SCORE_BARS.map(({ key, label, color }) => (
                    <ScoreBar key={key} label={label} score={r[key] || 0} color={color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
