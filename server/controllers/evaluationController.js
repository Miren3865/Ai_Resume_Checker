const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const Evaluation = require('../models/Evaluation');
const { calculateMatchScore, DEFAULT_WEIGHTS } = require('../utils/scoringEngine');
const {
  extractContactInfo,
} = require('../utils/resumeParser');

const isAdmin = (req) => req.user?.role === 'admin';

// POST /api/evaluations
const createEvaluation = async (req, res, next) => {
  try {
    const { resumeId, jobId, weights } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({ success: false, message: 'resumeId and jobId are required' });
    }

    const resumeFilter = { _id: resumeId };
    const jobFilter = { _id: jobId };

    if (!isAdmin(req)) {
      resumeFilter.uploadedBy = req.user._id;
      jobFilter.createdBy = req.user._id;
    }

    const [resume, job] = await Promise.all([
      Resume.findOne(resumeFilter),
      JobDescription.findOne(jobFilter),
    ]);

    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Validate and sanitize weights
    const scoringWeights = { ...DEFAULT_WEIGHTS };
    if (weights && typeof weights === 'object') {
      const keys = ['skills', 'experience', 'education', 'keywords', 'formatting'];
      keys.forEach((k) => {
        if (typeof weights[k] === 'number' && weights[k] >= 0 && weights[k] <= 100) {
          scoringWeights[k] = weights[k];
        }
      });
    }

    const contactInfo = extractContactInfo(resume.resumeText || '');

    const result = calculateMatchScore(
      {
        resumeSkills: resume.skills,
        resumeText: resume.resumeText,
        parsedSections: resume.parsedSections || {},
        contactInfo,
        resumeEducation: resume.education,
        resumeExperience: resume.experience,
      },
      {
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        keywords: job.keywords,
        jobDescriptionText: job.jobDescriptionText,
        experienceLevel: job.experienceLevel,
      },
      scoringWeights
    );

    const evaluation = await Evaluation.create({
      resumeId,
      jobId,
      ...result,
      scoringWeights,
      evaluatedBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};

// GET /api/evaluations
const getAllEvaluations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (!isAdmin(req)) filter.evaluatedBy = req.user._id;
    if (req.query.resumeId) filter.resumeId = req.query.resumeId;
    if (req.query.jobId) filter.jobId = req.query.jobId;

    const [evaluations, total] = await Promise.all([
      Evaluation.find(filter)
        .populate('resumeId', 'candidateName email skills')
        .populate('jobId', 'jobTitle company experienceLevel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Evaluation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: evaluations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/evaluations/:id
const getEvaluationById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (!isAdmin(req)) filter.evaluatedBy = req.user._id;

    const evaluation = await Evaluation.findOne(filter)
      .populate('resumeId', 'candidateName email skills parsedSections')
      .populate('jobId', 'jobTitle company requiredSkills preferredSkills keywords experienceLevel');

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }
    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/evaluations/:id
const deleteEvaluation = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (!isAdmin(req)) filter.evaluatedBy = req.user._id;

    const ev = await Evaluation.findOne(filter);
    if (!ev) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    await ev.deleteOne();
    res.json({ success: true, message: 'Evaluation deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/evaluations
const deleteAllEvaluations = async (req, res, next) => {
  try {
    const filter = {};
    if (!isAdmin(req)) filter.evaluatedBy = req.user._id;

    const result = await Evaluation.deleteMany(filter);

    res.json({
      success: true,
      message: 'All evaluations deleted',
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/evaluations/battle — compare multiple resumes against one job
const resumeBattle = async (req, res, next) => {
  try {
    const { resumeIds, jobId, weights } = req.body;

    if (!Array.isArray(resumeIds) || resumeIds.length < 2 || resumeIds.length > 10) {
      return res.status(400).json({ success: false, message: 'Provide 2 to 10 resumeIds for battle' });
    }
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const jobFilter = { _id: jobId };
    if (!isAdmin(req)) jobFilter.createdBy = req.user._id;

    const job = await JobDescription.findOne(jobFilter);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const scoringWeights = { ...DEFAULT_WEIGHTS, ...(weights || {}) };

    const resumeFilter = { _id: { $in: resumeIds } };
    if (!isAdmin(req)) resumeFilter.uploadedBy = req.user._id;

    const resumes = await Resume.find(resumeFilter);
    if (resumes.length === 0) {
      return res.status(404).json({ success: false, message: 'No resumes found' });
    }

    if (resumes.length !== resumeIds.length) {
      return res.status(403).json({
        success: false,
        message: 'One or more selected resumes are not accessible for this user',
      });
    }

    const results = resumes.map((resume) => {
      const contactInfo = extractContactInfo(resume.resumeText || '');
      const result = calculateMatchScore(
        {
          resumeSkills: resume.skills,
          resumeText: resume.resumeText,
          parsedSections: resume.parsedSections || {},
          contactInfo,
          resumeEducation: resume.education,
          resumeExperience: resume.experience,
        },
        {
          requiredSkills: job.requiredSkills,
          preferredSkills: job.preferredSkills,
          keywords: job.keywords,
          jobDescriptionText: job.jobDescriptionText,
          experienceLevel: job.experienceLevel,
        },
        scoringWeights
      );
      return {
        resumeId: resume._id,
        candidateName: resume.candidateName,
        email: resume.email,
        ...result,
      };
    });

    // Sort by matchScore descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    const ranked = results.map((r, i) => ({ rank: i + 1, ...r }));

    res.json({ success: true, job: { id: job._id, title: job.jobTitle, company: job.company }, results: ranked });
  } catch (err) {
    next(err);
  }
};

// GET /api/evaluations/stats/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const resumeFilter = !isAdmin(req) ? { uploadedBy: req.user._id } : {};
    const jobFilter = !isAdmin(req) ? { createdBy: req.user._id } : {};
    const evaluationFilter = !isAdmin(req) ? { evaluatedBy: req.user._id } : {};

    const [totalResumes, totalJobs, totalEvaluations, recentEvaluations, gradeDistribution] =
      await Promise.all([
        Resume.countDocuments(resumeFilter),
        JobDescription.countDocuments(jobFilter),
        Evaluation.countDocuments(evaluationFilter),
        Evaluation.find(evaluationFilter)
          .populate('resumeId', 'candidateName')
          .populate('jobId', 'jobTitle company')
          .sort({ createdAt: -1 })
          .limit(5),
        Evaluation.aggregate([
          ...(isAdmin(req) ? [] : [{ $match: { evaluatedBy: req.user._id } }]),
          { $group: { _id: '$grade', count: { $sum: 1 } } },
        ]),
      ]);

    const avgScoreResult = await Evaluation.aggregate([
      ...(isAdmin(req) ? [] : [{ $match: { evaluatedBy: req.user._id } }]),
      { $group: { _id: null, avg: { $avg: '$matchScore' } } },
    ]);
    const averageScore = avgScoreResult[0] ? Math.round(avgScoreResult[0].avg) : 0;

    res.json({
      success: true,
      data: {
        totalResumes,
        totalJobs,
        totalEvaluations,
        averageScore,
        recentEvaluations,
        gradeDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationById,
  deleteEvaluation,
  deleteAllEvaluations,
  resumeBattle,
  getDashboardStats,
};
