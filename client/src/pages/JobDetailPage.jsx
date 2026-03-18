import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getJob } from '../api/services';
import JobHeader from '../components/JobHeader';
import JobSection from '../components/JobSection';
import SkillBadges from '../components/SkillBadges';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await getJob(id);
        setJob(res.data.data);
      } catch (err) {
        toast.error('Failed to load job details');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job not found</p>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/jobs')}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span>← Back to Jobs</span>
      </button>

      {/* Container with responsive 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Overview (1 column) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Overview Card */}
            <JobHeader job={job} />

            {/* Meta Info Card */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600/30 rounded-xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                📋 Overview
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Company</p>
                  <p className="text-sm font-medium text-slate-100">{job.company || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm font-medium text-slate-100">{job.location || 'Remote'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm font-medium text-slate-100">{job.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Type & Level Card */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600/30 rounded-xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                🎯 Position Details
              </h3>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-medium">
                  <span>💼</span> {job.employmentType}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-medium">
                  <span>⭐</span> {job.experienceLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                <span className="text-slate-300">Posted</span> {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Details (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Required Skills Section */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <JobSection
              icon="🔧"
              title="Required Skills"
              subtitle="Core competencies for this role"
            >
              <SkillBadges skills={job.requiredSkills} variant="required" />
            </JobSection>
          )}

          {/* Preferred Skills Section */}
          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <JobSection
              icon="✨"
              title="Preferred Skills"
              subtitle="Nice-to-have qualifications"
            >
              <SkillBadges skills={job.preferredSkills} variant="preferred" />
            </JobSection>
          )}

          {/* Keywords Section */}
          {job.keywords && job.keywords.length > 0 && (
            <JobSection
              icon="🏷️"
              title="Keywords"
              subtitle="Associated topics"
            >
              <SkillBadges skills={job.keywords} variant="keyword" />
            </JobSection>
          )}

          {/* Job Description Section */}
          {job.jobDescriptionText && (
            <JobSection
              icon="📄"
              title="Job Description"
              subtitle="Full position details"
            >
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm font-light">
                  {job.jobDescriptionText}
                </p>
              </div>
            </JobSection>
          )}
        </div>
      </div>
    </div>
  );
}
