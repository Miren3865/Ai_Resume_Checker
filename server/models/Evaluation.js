const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'Needs Improvement'],
      required: true,
    },
    skillsCoverage: {
      type: Number,
      min: 0,
      max: 100,
    },
    experienceAlignment: {
      type: Number,
      min: 0,
      max: 100,
    },
    educationMatch: {
      type: Number,
      min: 0,
      max: 100,
    },
    keywordScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    formattingScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    cosineSimilarity: {
      type: Number,
      min: 0,
      max: 1,
    },
    matchedSkills: [String],
    missingSkills: [String],
    matchedKeywords: [String],
    missingKeywords: [String],
    sectionAnalysis: {
      contact: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      summary: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      experience: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      education: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      skills: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      projects: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      certifications: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
      achievements: {
        status: { type: String, enum: ['Strong', 'Moderate', 'Weak', 'Missing'] },
        score: Number,
        feedback: [String],
      },
    },
    recommendations: [
      {
        priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        category: String,
        message: String,
        action: String,
      },
    ],
    scoringWeights: {
      skills: { type: Number, default: 35 },
      experience: { type: Number, default: 25 },
      education: { type: Number, default: 15 },
      keywords: { type: Number, default: 15 },
      formatting: { type: Number, default: 10 },
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
