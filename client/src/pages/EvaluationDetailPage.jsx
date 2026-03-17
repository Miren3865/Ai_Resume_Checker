import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEvaluation } from '../api/services';
import DonutChart from '../components/DonutChart';
import RadarChart from '../components/RadarChart';
import ScoreBar from '../components/ScoreBar';
import SkillTag from '../components/SkillTag';
import SectionCard from '../components/SectionCard';
import RecommendationCard from '../components/RecommendationCard';

const SCORE_BARS = [
  { key: 'skillsCoverage', label: 'Skills Coverage', color: 'blue', weight: 35 },
  { key: 'experienceAlignment', label: 'Experience Alignment', color: 'green', weight: 25 },
  { key: 'educationMatch', label: 'Education Match', color: 'purple', weight: 15 },
  { key: 'keywordScore', label: 'Keyword Density', color: 'yellow', weight: 15 },
  { key: 'formattingScore', label: 'Formatting Quality', color: 'orange', weight: 10 },
];

export default function EvaluationDetailPage() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    getEvaluation(id)
      .then((r) => setEv(r.data.data))
      .catch(() => toast.error('Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (!ev)
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Evaluation not found.</p>
        <Link to="/evaluations" className="btn-primary mt-4">
          Back to Evaluations
        </Link>
      </div>
    );

  const tabs = ['overview', 'skills', 'sections', 'recommendations'];
  const highRecs = ev.recommendations?.filter((r) => r.priority === 'HIGH').length || 0;

  return (
    <div className="space-y-6 page-shell">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/evaluations" className="text-sm text-blue-600 hover:underline">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {ev.resumeId?.candidateName || 'Resume'} → {ev.jobId?.jobTitle || 'Job'}
          </h1>
          <p className="text-gray-500 text-sm">
            {ev.jobId?.company} • Evaluated {new Date(ev.createdAt).toLocaleDateString()}
          </p>
        </div>
        {highRecs > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
            ⚠ {highRecs} HIGH priority issue{highRecs > 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex items-center justify-center">
          <DonutChart score={ev.matchScore} label="Career Match Score" />
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {SCORE_BARS.map(({ key, label, color, weight }) => (
              <ScoreBar key={key} label={label} score={ev[key] || 0} color={color} weight={weight} />
            ))}
          </div>
        </div>
        <div className="card flex items-center justify-center">
          <div className="w-full max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Competency Radar</h3>
            <RadarChart evaluation={ev} />
          </div>
        </div>
      </div>

      {/* Cosine similarity */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500">TF-IDF Cosine Similarity</p>
            <p className="text-2xl font-bold text-blue-600">{(ev.cosineSimilarity * 100).toFixed(1)}%</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div>
              <p className="text-xl font-bold text-green-600">{ev.matchedSkills?.length || 0}</p>
              <p className="text-xs text-gray-500">Matched Skills</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{ev.missingSkills?.length || 0}</p>
              <p className="text-xs text-gray-500">Missing Skills</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{ev.matchedKeywords?.length || 0}</p>
              <p className="text-xs text-gray-500">Matched Keywords</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{ev.missingKeywords?.length || 0}</p>
              <p className="text-xs text-gray-500">Missing Keywords</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCORE_BARS.map(({ key, label, color, weight }) => (
                <div key={key} className="card">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-800">{label}</p>
                    <span className="text-sm text-gray-400">Weight: {weight}%</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: ev[key] >= 70 ? '#22c55e' : ev[key] >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {ev[key] || 0}
                    <span className="text-base text-gray-400 font-normal">/100</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Skills tab */}
          {tab === 'skills' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 text-green-700">
                  ✓ Matched Skills ({ev.matchedSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ev.matchedSkills?.length > 0 ? (
                    ev.matchedSkills.map((s) => <SkillTag key={s} skill={s} matched />)
                  ) : (
                    <p className="text-gray-400 text-sm">No skills matched</p>
                  )}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 text-red-600">
                  ✗ Missing Skills ({ev.missingSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ev.missingSkills?.length > 0 ? (
                    ev.missingSkills.map((s) => <SkillTag key={s} skill={s} matched={false} />)
                  ) : (
                    <p className="text-green-600 text-sm">All required skills are present! 🎉</p>
                  )}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 text-green-700">
                  ✓ Matched Keywords ({ev.matchedKeywords?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ev.matchedKeywords?.map((k) => (
                    <span key={k} className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 text-red-600">
                  ✗ Missing Keywords ({ev.missingKeywords?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ev.missingKeywords?.map((k) => (
                    <span key={k} className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sections tab */}
          {tab === 'sections' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ev.sectionAnalysis &&
                Object.entries(ev.sectionAnalysis).map(([name, data]) => (
                  <SectionCard key={name} sectionName={name} data={data} />
                ))}
            </div>
          )}

          {/* Recommendations tab */}
          {tab === 'recommendations' && (
            <div className="space-y-3">
              {ev.recommendations?.length > 0 ? (
                ev.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} index={i} />
                ))
              ) : (
                <div className="card text-center py-8">
                  <p className="text-green-600 text-lg font-semibold">🎉 No major issues found!</p>
                  <p className="text-gray-500 text-sm mt-1">Your resume is well-optimized for this job.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
