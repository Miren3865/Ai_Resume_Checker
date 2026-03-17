const mongoose = require('mongoose');

const ruleConfigSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    scoringWeights: {
      skills:      { type: Number, default: 35, min: 0, max: 100 },
      experience:  { type: Number, default: 25, min: 0, max: 100 },
      education:   { type: Number, default: 15, min: 0, max: 100 },
      keywords:    { type: Number, default: 15, min: 0, max: 100 },
      formatting:  { type: Number, default: 10, min: 0, max: 100 },
    },
    gradeThresholds: {
      aPlus: { type: Number, default: 90, min: 0, max: 100 },
      a:     { type: Number, default: 80, min: 0, max: 100 },
      b:     { type: Number, default: 70, min: 0, max: 100 },
      c:     { type: Number, default: 60, min: 0, max: 100 },
    },
    keywordSettings: {
      autoKeywordCount: { type: Number, default: 20, min: 5,  max: 50 },
      caseSensitive:    { type: Boolean, default: false },
      fuzzyMatch:       { type: Boolean, default: false },
    },
    behaviorSettings: {
      autoFailMissingRequired: { type: Boolean, default: false },
      resumeWordCountMin:      { type: Number,  default: 300,  min: 50,  max: 1000 },
      resumeWordCountMax:      { type: Number,  default: 800,  min: 200, max: 3000 },
      minSkillsRequired:       { type: Number,  default: 5,    min: 1,   max: 30   },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RuleConfig', ruleConfigSchema);
