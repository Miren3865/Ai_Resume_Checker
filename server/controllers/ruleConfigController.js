const RuleConfig = require('../models/RuleConfig');

const DEFAULTS = {
  scoringWeights: { skills: 35, experience: 25, education: 15, keywords: 15, formatting: 10 },
  gradeThresholds: { aPlus: 90, a: 80, b: 70, c: 60 },
  keywordSettings: { autoKeywordCount: 20, caseSensitive: false, fuzzyMatch: false },
  behaviorSettings: {
    autoFailMissingRequired: false,
    resumeWordCountMin: 300,
    resumeWordCountMax: 800,
    minSkillsRequired: 5,
  },
};

// GET /api/rule-config
const getRuleConfig = async (req, res, next) => {
  try {
    const config = await RuleConfig.findOne({ userId: req.user._id });
    if (!config) {
      return res.json({ success: true, data: { ...DEFAULTS } });
    }
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rule-config
const updateRuleConfig = async (req, res, next) => {
  try {
    const { scoringWeights, gradeThresholds, keywordSettings, behaviorSettings } = req.body;

    // Validate weights sum to 100
    if (scoringWeights) {
      const sum = Object.values(scoringWeights).reduce((a, b) => a + Number(b), 0);
      if (Math.round(sum) !== 100) {
        return res.status(400).json({
          success: false,
          message: `Scoring weights must sum to 100 (current sum: ${sum})`,
        });
      }
    }

    // Validate grade thresholds are descending
    if (gradeThresholds) {
      const { aPlus, a, b, c } = gradeThresholds;
      if (!(aPlus > a && a > b && b > c)) {
        return res.status(400).json({
          success: false,
          message: 'Grade thresholds must be in descending order: A+ > A > B > C',
        });
      }
    }

    const config = await RuleConfig.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(scoringWeights    && { scoringWeights }),
          ...(gradeThresholds   && { gradeThresholds }),
          ...(keywordSettings   && { keywordSettings }),
          ...(behaviorSettings  && { behaviorSettings }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRuleConfig, updateRuleConfig };
