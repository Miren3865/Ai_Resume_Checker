const { computeTextSimilarity } = require('./nlpEngine');

const DEFAULT_WEIGHTS = {
  skills: 35,
  experience: 25,
  education: 15,
  keywords: 15,
  formatting: 10,
};

const GENERIC_KEYWORD_NOISE = new Set([
  'full', 'stack', 'development', 'developer', 'engineer', 'using', 'use', 'used',
  'experience', 'experienced', 'candidate', 'candidates', 'looking', 'role', 'job',
  'application', 'applications', 'building', 'build', 'developing', 'develop',
  'solution', 'solutions', 'interface', 'interfaces', 'ability', 'skills', 'skill',
  'knowledge', 'work', 'working', 'team', 'teams', 'strong', 'good', 'excellent',
  'years', 'year', 'plus', 'junior', 'senior', 'level', 'position',
]);

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeKeyword = (kw) =>
  String(kw || '')
    .toLowerCase()
    .replace(/[()\[\]{}:,;!?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isMeaningfulKeyword = (kw) => {
  const normalized = normalizeKeyword(kw);
  if (!normalized || normalized.length < 3) return false;

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 1) {
    return !GENERIC_KEYWORD_NOISE.has(tokens[0]);
  }

  // For phrases, ensure at least one significant token remains.
  return tokens.some((t) => t.length > 2 && !GENERIC_KEYWORD_NOISE.has(t));
};

const containsKeyword = (text, keyword) => {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return false;

  const escapedPhrase = escapeRegExp(normalizedKeyword).replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapedPhrase}([^a-z0-9+#.]|$)`, 'i');
  return pattern.test(String(text || '').toLowerCase());
};

/**
 * Determine grade from numeric score
 */
const getGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'Needs Improvement';
};

/**
 * Normalize a skill string for comparison
 */
const normSkill = (s) =>
  s.toLowerCase().replace(/[.\s-]/g, '').replace(/js$/, '').trim();

/**
 * Compare resume skills with job required/preferred skills
 */
const analyzeSkills = (resumeSkills, requiredSkills, preferredSkills) => {
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  const normResume = (resumeSkills || []).map(normSkill);
  const normRequired = (requiredSkills || []).map(normSkill);

  const matchedSkills = [];
  const missingSkills = [];

  allJobSkills.forEach((skill) => {
    if (normResume.includes(normSkill(skill))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Score based only on required skills
  const requiredMatched = normRequired.filter((rs) => normResume.includes(rs)).length;
  const requiredTotal = normRequired.length || 1;
  const skillsCoverage = Math.round((requiredMatched / requiredTotal) * 100);

  return { matchedSkills, missingSkills, skillsCoverage };
};

/**
 * Analyze keyword overlap between resume text and job keywords
 */
const analyzeKeywords = (resumeText, jobKeywords, jobDescriptionText) => {
  const explicitKeywords = (jobKeywords || [])
    .map((kw) => String(kw || '').trim())
    .filter(isMeaningfulKeyword);

  // If job keywords are explicitly provided, trust them and do not add noisy auto keywords.
  const autoKeywords = explicitKeywords.length > 0 ? [] : extractTopKeywords(jobDescriptionText, 20);
  const candidates = [...explicitKeywords, ...autoKeywords].filter(isMeaningfulKeyword);

  // De-duplicate by normalized form while preserving the first readable label.
  const keywordMap = new Map();
  candidates.forEach((kw) => {
    const normalized = normalizeKeyword(kw);
    if (normalized && !keywordMap.has(normalized)) {
      keywordMap.set(normalized, kw);
    }
  });

  const matchedKeywords = [];
  const missingKeywords = [];

  keywordMap.forEach((label, normalized) => {
    if (containsKeyword(resumeText, normalized)) {
      matchedKeywords.push(label);
    } else {
      missingKeywords.push(label);
    }
  });

  const totalKeywords = keywordMap.size;
  const keywordScore = totalKeywords
    ? Math.round((matchedKeywords.length / totalKeywords) * 100)
    : 0;

  return { matchedKeywords, missingKeywords, keywordScore };
};

/**
 * Extract top N keywords from text (excluding stopwords)
 */
const extractTopKeywords = (text, n = 20) => {
  if (!text) return [];
  const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that', 'these', 'those', 'we', 'you', 'they', 'it', 'i', 'our', 'your', 'their', 'its', 'as', 'if', 'not', 'no', 'up', 'out', 'so', 'than', 'then', 'when', 'where', 'who', 'which', 'what', 'how', 'all', 'each', 'both', 'more', 'most', 'other', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'such', 'while', 'about', 'against', 'within', 'without', 'including', 'across', 'following', 'role', 'work', 'working']);
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !GENERIC_KEYWORD_NOISE.has(w));
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word)
    .filter(isMeaningfulKeyword);
};

/**
 * Score experience alignment
 */
const analyzeExperience = (resumeExperience, resumeText, jobLevel, jobDescriptionText) => {
  const level = (jobLevel || 'Entry').toLowerCase();
  const hasExperience = (resumeExperience && resumeExperience.length > 0) ||
    /experience|internship|worked|developer|engineer/i.test(resumeText || '');

  let baseScore = hasExperience ? 60 : 20;

  // TF-IDF similarity of experience section vs job description
  const expText = (resumeExperience || []).map((e) => `${e.title} ${e.company} ${e.description}`).join(' ');
  const similarity = expText ? computeTextSimilarity(expText, jobDescriptionText || '') : 0;
  baseScore = Math.min(100, baseScore + Math.round(similarity * 40));

  // Adjust based on expected level
  if (level === 'entry' || level === 'internship') baseScore = Math.min(100, baseScore + 10);
  if (level === 'senior' && !hasExperience) baseScore = Math.max(0, baseScore - 20);

  return Math.round(baseScore);
};

/**
 * Score education match
 */
const analyzeEducation = (resumeEducation, resumeText, jobLevel, jobDescriptionText) => {
  const hasDegree =
    (resumeEducation && resumeEducation.length > 0) ||
    /bachelor|master|b\.tech|m\.tech|b\.e|mca|bca|degree|university|college/i.test(resumeText || '');

  const hasAdvanced =
    /master|m\.tech|m\.e|mca|phd/i.test(resumeText || '');

  let score = hasDegree ? 65 : 30;
  if (hasAdvanced) score += 20;

  const eduText = (resumeEducation || []).map((e) => `${e.degree} ${e.institution}`).join(' ');
  const sim = eduText ? computeTextSimilarity(eduText, jobDescriptionText || '') : 0;
  score = Math.min(100, score + Math.round(sim * 15));

  return Math.round(score);
};

/**
 * Evaluate resume formatting quality
 */
const analyzeFormatting = (parsedSections, resumeText, contactInfo) => {
  let score = 50;
  const feedback = [];

  if (contactInfo.email) score += 10;
  else feedback.push('Add a professional email address');

  if (contactInfo.phone) score += 5;
  else feedback.push('Include a phone number');

  if (contactInfo.linkedin) score += 10;
  else feedback.push('Add a LinkedIn profile URL');

  if (parsedSections.summary && parsedSections.summary.length > 50) score += 10;
  else feedback.push('Add or expand your professional summary (3-4 sentences)');

  if (parsedSections.experience && parsedSections.experience.length > 100) score += 5;
  if (parsedSections.skills && parsedSections.skills.length > 20) score += 5;
  if (parsedSections.education && parsedSections.education.length > 20) score += 5;

  const wordCount = (resumeText || '').split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 800) score += 5;
  else if (wordCount < 300) feedback.push('Resume is too short; add more details');
  else if (wordCount > 800) feedback.push('Resume may be too long; keep it concise');

  return { score: Math.min(100, Math.round(score)), feedback };
};

/**
 * Analyze each resume section for completeness
 */
const analyzeSections = (parsedSections, contactInfo) => {
  const analysis = {};

  // Contact
  const contactIssues = [];
  let contactScore = 60;
  if (!contactInfo.email) { contactIssues.push('Missing email address'); contactScore -= 20; }
  if (!contactInfo.phone) { contactIssues.push('Missing phone number'); contactScore -= 10; }
  if (!contactInfo.linkedin) { contactIssues.push('Missing LinkedIn profile'); contactScore -= 10; }
  analysis.contact = {
    status: contactScore >= 80 ? 'Strong' : contactScore >= 60 ? 'Moderate' : 'Weak',
    score: Math.max(0, contactScore),
    feedback: contactIssues,
  };

  // Summary
  const summaryText = parsedSections.summary || '';
  const summaryWords = summaryText.split(/\s+/).filter(Boolean).length;
  const summaryIssues = [];
  let summaryScore = 0;
  if (!summaryText) { summaryIssues.push('No summary section found'); summaryScore = 0; }
  else if (summaryWords < 20) { summaryIssues.push('Summary is too short (aim for 50+ words)'); summaryScore = 40; }
  else if (summaryWords < 40) { summaryIssues.push('Summary could be more detailed'); summaryScore = 70; }
  else { summaryScore = 90; }
  analysis.summary = {
    status: summaryScore >= 80 ? 'Strong' : summaryScore >= 50 ? 'Moderate' : summaryScore > 0 ? 'Weak' : 'Missing',
    score: summaryScore,
    feedback: summaryIssues,
  };

  // Experience
  const expText = parsedSections.experience || '';
  const expIssues = [];
  let expScore = 0;
  if (!expText) { expIssues.push('No experience section found'); expScore = 0; }
  else {
    expScore = 60;
    if (!/\d/.test(expText)) { expIssues.push('Quantify achievements with numbers and metrics'); expScore -= 15; }
    if (expText.split('\n').filter(Boolean).length < 3) { expIssues.push('Expand job descriptions with bullet points'); expScore -= 10; }
    if (!/\b(led|built|developed|designed|managed|improved|created|launched)\b/i.test(expText)) {
      expIssues.push('Use strong action verbs (developed, designed, led, optimized)');
    }
  }
  analysis.experience = {
    status: expScore >= 80 ? 'Strong' : expScore >= 50 ? 'Moderate' : expScore > 0 ? 'Weak' : 'Missing',
    score: Math.max(0, expScore),
    feedback: expIssues,
  };

  // Education
  const eduText = parsedSections.education || '';
  const eduIssues = [];
  let eduScore = eduText ? 75 : 0;
  if (!eduText) eduIssues.push('No education section found');
  else if (!/\b(19|20)\d{2}\b/.test(eduText)) { eduIssues.push('Include graduation year'); eduScore -= 10; }
  analysis.education = {
    status: eduScore >= 80 ? 'Strong' : eduScore >= 50 ? 'Moderate' : eduScore > 0 ? 'Weak' : 'Missing',
    score: Math.max(0, eduScore),
    feedback: eduIssues,
  };

  // Skills
  const skillsText = parsedSections.skills || '';
  const skillIssues = [];
  const skillCount = skillsText.split(/[,\n|•]/).filter(Boolean).length;
  let skillScore = 0;
  if (!skillsText) { skillIssues.push('No skills section found'); skillScore = 0; }
  else if (skillCount < 5) { skillIssues.push('List at least 8-10 relevant skills'); skillScore = 40; }
  else if (skillCount < 10) { skillIssues.push('Consider adding more technical skills'); skillScore = 70; }
  else { skillScore = 90; }
  analysis.skills = {
    status: skillScore >= 80 ? 'Strong' : skillScore >= 50 ? 'Moderate' : skillScore > 0 ? 'Weak' : 'Missing',
    score: skillScore,
    feedback: skillIssues,
  };

  // Projects
  const projText = parsedSections.projects || '';
  const projIssues = [];
  let projScore = 0;
  if (!projText) { projIssues.push('No projects section found — add 2-3 relevant projects'); projScore = 0; }
  else {
    projScore = 65;
    if (!/(http|github|deployed|live)/i.test(projText)) { projIssues.push('Add project links or GitHub URLs'); projScore -= 10; }
    if (!/(\btechnolog|\btech|\bbuilt with|\bstack)/i.test(projText)) { projIssues.push('Mention technologies used in each project'); projScore -= 10; }
  }
  analysis.projects = {
    status: projScore >= 80 ? 'Strong' : projScore >= 50 ? 'Moderate' : projScore > 0 ? 'Weak' : 'Missing',
    score: Math.max(0, projScore),
    feedback: projIssues,
  };

  // Certifications
  const certText = parsedSections.certifications || '';
  analysis.certifications = {
    status: certText ? 'Strong' : 'Missing',
    score: certText ? 80 : 0,
    feedback: certText ? [] : ['Add relevant certifications to boost credibility'],
  };

  // Achievements
  const achText = parsedSections.achievements || '';
  analysis.achievements = {
    status: achText ? 'Strong' : 'Missing',
    score: achText ? 80 : 0,
    feedback: achText ? [] : ['Include notable achievements or awards'],
  };

  return analysis;
};

/**
 * Generate prioritized recommendations
 */
const generateRecommendations = (missingSkills, missingKeywords, sectionAnalysis, formattingFeedback) => {
  const recs = [];

  // HIGH: Missing critical skills
  missingSkills.slice(0, 5).forEach((skill) => {
    recs.push({
      priority: 'HIGH',
      category: 'Skills',
      message: `Missing required skill: ${skill}`,
      action: `Learn and add "${skill}" to your skills section and demonstrate it in projects.`,
    });
  });

  // HIGH: Missing job keywords
  missingKeywords.slice(0, 5).forEach((kw) => {
    recs.push({
      priority: 'HIGH',
      category: 'Keywords',
      message: `Missing keyword: "${kw}"`,
      action: `Include the keyword "${kw}" naturally in your experience or summary section.`,
    });
  });

  // MEDIUM: Section quality issues
  const mediumSections = ['experience', 'summary', 'projects', 'skills'];
  mediumSections.forEach((sec) => {
    const s = sectionAnalysis[sec];
    if (s && (s.status === 'Weak' || s.status === 'Missing')) {
      s.feedback.forEach((fb) => {
        recs.push({
          priority: s.status === 'Missing' ? 'HIGH' : 'MEDIUM',
          category: `${sec.charAt(0).toUpperCase() + sec.slice(1)} Section`,
          message: fb,
          action: fb,
        });
      });
    }
  });

  // LOW: Formatting
  formattingFeedback.forEach((fb) => {
    recs.push({
      priority: 'LOW',
      category: 'Formatting',
      message: fb,
      action: fb,
    });
  });

  // Sort: HIGH first, then MEDIUM, then LOW
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recs.sort((a, b) => order[a.priority] - order[b.priority]);

  return recs.slice(0, 15); // Top 15 recommendations
};

/**
 * Master scoring function
 */
const calculateMatchScore = (
  resumeData,
  jobData,
  weights = DEFAULT_WEIGHTS
) => {
  const {
    resumeSkills,
    resumeText,
    parsedSections,
    contactInfo,
    resumeEducation,
    resumeExperience,
  } = resumeData;

  const {
    requiredSkills,
    preferredSkills,
    keywords,
    jobDescriptionText,
    experienceLevel,
  } = jobData;

  // 1. Skills analysis
  const { matchedSkills, missingSkills, skillsCoverage } = analyzeSkills(
    resumeSkills, requiredSkills, preferredSkills
  );

  // 2. Experience alignment
  const experienceAlignment = analyzeExperience(
    resumeExperience, resumeText, experienceLevel, jobDescriptionText
  );

  // 3. Education match
  const educationMatch = analyzeEducation(
    resumeEducation, resumeText, experienceLevel, jobDescriptionText
  );

  // 4. Keyword analysis
  const { matchedKeywords, missingKeywords, keywordScore } = analyzeKeywords(
    resumeText, keywords, jobDescriptionText
  );

  // 5. Formatting analysis
  const { score: formattingScore, feedback: formattingFeedback } = analyzeFormatting(
    parsedSections, resumeText, contactInfo
  );

  // 6. Cosine similarity
  const cosineSim = computeTextSimilarity(resumeText || '', jobDescriptionText || '');

  // 7. Section quality analysis
  const sectionAnalysis = analyzeSections(parsedSections, contactInfo);

  // 8. Weighted total score
  const w = weights;
  const totalWeight = w.skills + w.experience + w.education + w.keywords + w.formatting;
  const matchScore = Math.round(
    ((w.skills * skillsCoverage +
      w.experience * experienceAlignment +
      w.education * educationMatch +
      w.keywords * keywordScore +
      w.formatting * formattingScore) /
      totalWeight)
  );

  // 9. Grade
  const grade = getGrade(matchScore);

  // 10. Recommendations
  const recommendations = generateRecommendations(
    missingSkills, missingKeywords, sectionAnalysis, formattingFeedback
  );

  return {
    matchScore,
    grade,
    skillsCoverage,
    experienceAlignment,
    educationMatch,
    keywordScore,
    formattingScore,
    cosineSimilarity: parseFloat(cosineSim.toFixed(4)),
    matchedSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    sectionAnalysis,
    recommendations,
  };
};

module.exports = {
  calculateMatchScore,
  getGrade,
  DEFAULT_WEIGHTS,
};
