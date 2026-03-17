import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getResumes, getJobs, createEvaluation } from '../api/services';
import ModernSelect from '../components/ModernSelect';
import ScoringWeights, { DEFAULT_WEIGHTS } from '../components/ScoringWeights';

export default function NewEvaluationPage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs]       = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [jobId,    setJobId]    = useState('');
  const [customWeights, setCustomWeights] = useState(false);
  const [weights,  setWeights]  = useState({ ...DEFAULT_WEIGHTS });
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getResumes({ limit: 50 }), getJobs({ limit: 50 })]).then(([r, j]) => {
      setResumes(r.data.data);
      setJobs(j.data.data);
    });
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const updateWeight = (key, rawValue) => {
    const parsed = Number.parseInt(rawValue, 10);
    const nextValue = Number.isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setWeights((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeId || !jobId) { toast.error('Select both a resume and a job'); return; }
    if (customWeights && totalWeight !== 100) {
      toast.error(`Weights must sum to 100 (currently ${totalWeight})`);
      return;
    }
    setLoading(true);
    try {
      const res = await createEvaluation({ resumeId, jobId, weights: customWeights ? weights : undefined });
      toast.success('Evaluation complete!');
      navigate(`/evaluations/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 page-shell pb-20">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          New Evaluation
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Select a candidate's resume and a job description to initiate the AI-driven analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card space-y-6 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-purple-300 mb-3 flex items-center gap-2 block">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" style={{ boxShadow: '0 0 7px 2px rgba(168,85,247,0.7)' }} />
                Select Resume *
              </label>
              <ModernSelect
                value={resumeId}
                onChange={setResumeId}
                placeholder="Choose a candidate resume"
                accentColor="purple"
                options={resumes.map((r) => ({ value: r._id, label: r.candidateName }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-blue-300 mt-6 mb-3 flex items-center gap-2 block">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" style={{ boxShadow: '0 0 7px 2px rgba(59,130,246,0.7)' }} />
                Select Job Description *
              </label>
              <ModernSelect
                value={jobId}
                onChange={setJobId}
                placeholder="Choose a job description"
                accentColor="blue"
                options={jobs.map((j) => ({
                  value: j._id,
                  label: j.jobTitle,
                  sub: j.company ? `@ ${j.company}` : undefined,
                }))}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card h-full flex flex-col border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-6">
              <label className="text-xs font-semibold uppercase tracking-widest text-white">
                Scoring Weights
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Custom</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={customWeights}
                    onChange={(e) => setCustomWeights(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500 shadow-inner"></div>
                </label>
              </div>
            </div>

            {customWeights ? (
              <div className="space-y-5 flex-1">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-4 group">
                    <label className="w-28 text-sm font-medium text-gray-300 capitalize group-hover:text-purple-300 transition-colors">
                      {key}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="flex-1 accent-purple-500"
                      value={val}
                      onChange={(e) => updateWeight(key, e.target.value)}
                    />
                    <div className="relative w-16 group/value">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => updateWeight(key, e.target.value)}
                        className="no-spinner w-full h-8 pr-6 text-center text-sm font-semibold text-white bg-black/40 rounded-md border border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">%</span>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-px opacity-0 group-hover/value:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => updateWeight(key, val + 1)}
                          className="h-3 w-3 rounded-[3px] bg-white/10 text-[7px] leading-none text-purple-200 hover:bg-purple-500/30"
                          aria-label={`Increase ${key} weight`}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => updateWeight(key, val - 1)}
                          className="h-3 w-3 rounded-[3px] bg-white/10 text-[7px] leading-none text-purple-200 hover:bg-purple-500/30"
                          aria-label={`Decrease ${key} weight`}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className={`mt-auto pt-4 border-t border-white/10 flex justify-between items-center ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="text-sm font-semibold">Total Weight</span>
                  <span className="text-lg font-bold">{totalWeight}%</span>
                </div>
                {totalWeight !== 100 && (
                  <p className="text-xs text-red-400 text-right mt-1">Must equal exactly 100%</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 flex-1">
                {Object.entries(DEFAULT_WEIGHTS).map(([k, v], i) => (
                  <div key={k} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">{v}%</p>
                    <p className="text-xs text-gray-400 capitalize mt-1 tracking-wider">{k}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full-width Execute button */}
        <div className="lg:col-span-12 mt-4">
          <button
            type="submit"
            className="w-full relative group overflow-hidden rounded-2xl p-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-xy"></span>
            <div className="relative bg-page rounded-2xl flex items-center justify-center px-8 py-4 bg-black/50 backdrop-blur-md transition-all group-hover:bg-transparent">
              <span className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Run Evaluation
                  </>
                )}
              </span>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}
