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

const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 };

const SKILL_ALIASES = {
  javascript: ['javascript', 'ecmascript', 'es6', 'es6+', 'js'],
  reactjs: ['react', 'react.js', 'reactjs', 'react 18', 'react 17', 'react 16'],
  nodejs: ['node', 'node.js', 'nodejs', 'node 16', 'node 18', 'node 20'],
  expressjs: ['express', 'express.js', 'expressjs'],
  restapi: ['rest api', 'rest apis', 'restful api', 'restful apis', 'api development', 'backend api'],
  mongodb: ['mongodb', 'mongo db', 'mongo'],
  typescript: ['typescript', 'ts'],
  docker: ['docker', 'containerization', 'containers'],
  cicd: ['ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'pipeline'],
  aws: ['aws', 'amazon web services'],
  azure: ['azure', 'microsoft azure'],
  fullstack: ['full stack', 'full-stack', 'mern stack', 'mean stack'],
  backend: ['backend', 'back end', 'server-side', 'server side'],
  agile: ['agile', 'scrum', 'kanban'],
};

const ROLE_KEYWORD_EXPANSIONS = {
  reactjs: ['React Developer'],
  nodejs: ['Node.js Developer'],
  fullstack: ['Full Stack Developer'],
  restapi: ['Backend Developer'],
  backend: ['Backend Developer'],
};

const MERN_IMPLIED = ['javascript', 'reactjs', 'nodejs', 'expressjs', 'restapi', 'mongodb', 'fullstack'];

const normalizeKeyword = (kw) =>
  String(kw || '')
    .toLowerCase()
    .replace(/[()\[\]{}:,;!?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseVersionMeta = (text) => {
  const raw = String(text || '').toLowerCase();

  const reactMatch = raw.match(/react\s*\.?js?\s*(\d{1,2})/i);
  if (reactMatch) return { major: Number(reactMatch[1]) };

  const nodeMatch = raw.match(/node\s*\.?js?\s*(\d{1,2})/i);
  if (nodeMatch) return { major: Number(nodeMatch[1]) };

  const jsMatch = raw.match(/(?:javascript|ecmascript|es)\s*(\d{1,4})\+?/i);
  if (jsMatch) return { major: Number(jsMatch[1]) };

  return { major: null };
};

const normalizeSkillLabel = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[()\[\]{}:,;!?"]/g, ' ')
    .replace(/\b(version|v)\s*\d+(?:\.\d+)?\b/g, ' ')
    .replace(/\b(es\d+\+?)\b/g, ' javascript ')
    .replace(/\b\d+(?:\.\d+)?\+?\b/g, ' ')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const canonicalizeSkill = (skill) => {
  const normalized = normalizeSkillLabel(skill);
  if (!normalized) return '';

  const compact = normalized.replace(/\s+/g, '');
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    for (const alias of aliases) {
      const aliasNorm = normalizeSkillLabel(alias);
      if (!aliasNorm) continue;
      if (normalized === aliasNorm || compact === aliasNorm.replace(/\s+/g, '')) {
        return canonical;
      }
      const phrasePattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(aliasNorm).replace(/\s+/g, '\\s+')}([^a-z0-9+#.]|$)`, 'i');
      if (phrasePattern.test(` ${normalized} `)) {
        return canonical;
      }
    }
  }

  return compact.replace(/js$/, '').trim();
};

const labelFromCanonical = (canonical, fallback) => {
  const labels = {
    javascript: 'JavaScript',
    reactjs: 'React.js',
    nodejs: 'Node.js',
    expressjs: 'Express.js',
    restapi: 'REST APIs',
    mongodb: 'MongoDB',
    typescript: 'TypeScript',
    docker: 'Docker',
    cicd: 'CI/CD',
    aws: 'AWS',
    azure: 'Azure',
    fullstack: 'Full Stack',
    backend: 'Backend Development',
    agile: 'Agile',
  };
  return labels[canonical] || fallback || canonical;
};

const pickHigherConfidence = (prev, next) => {
  if (!prev) return next;
  return CONFIDENCE_RANK[next] > CONFIDENCE_RANK[prev] ? next : prev;
};

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
const normSkill = (s) => canonicalizeSkill(s);

const collectResumeEvidence = (resumeSkills, resumeText, parsedSections) => {
  const textParts = [
    String(resumeText || ''),
    String(parsedSections?.summary || ''),
    String(parsedSections?.experience || ''),
    String(parsedSections?.projects || ''),
    String(parsedSections?.skills || ''),
  ];
  const fullText = textParts.join('\n').toLowerCase();

  const evidence = new Map();

  const upsertEvidence = (canonical, payload) => {
    if (!canonical) return;
    const current = evidence.get(canonical) || {
      explicit: false,
      inferred: false,
      confidence: 'low',
      reason: '',
      versions: [],
    };
    const next = {
      ...current,
      ...payload,
      confidence: pickHigherConfidence(current.confidence, payload.confidence || current.confidence),
      versions: [...new Set([...(current.versions || []), ...((payload.versions || []).filter((v) => Number.isFinite(v) && v > 0))])],
    };
    if (!next.reason && current.reason) next.reason = current.reason;
    evidence.set(canonical, next);
  };

  (resumeSkills || []).forEach((skill) => {
    const canonical = canonicalizeSkill(skill);
    const version = parseVersionMeta(skill).major;
    upsertEvidence(canonical, {
      explicit: true,
      confidence: 'high',
      reason: `Explicitly listed in resume skills as "${skill}"`,
      versions: version ? [version] : [],
    });
  });

  Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
    const foundAlias = aliases.find((alias) => containsKeyword(fullText, alias));
    if (foundAlias) {
      const version = parseVersionMeta(fullText).major;
      upsertEvidence(canonical, {
        explicit: true,
        confidence: 'high',
        reason: `Mentioned in resume content (${foundAlias})`,
        versions: version ? [version] : [],
      });
    }
  });

  let mernOrFullStack = false;
  if (/\bmern\b|mern\s+stack/i.test(fullText)) {
    MERN_IMPLIED.forEach((canonical) => {
      upsertEvidence(canonical, {
        inferred: true,
        confidence: 'high',
        reason: 'Inferred from MERN stack project/experience context',
      });
    });
    mernOrFullStack = true;
  }
  if (/full\s*[- ]?stack/i.test(fullText)) {
    ['fullstack', 'backend', 'restapi'].forEach((canonical) => {
      upsertEvidence(canonical, {
        inferred: true,
        confidence: 'medium',
        reason: 'Inferred from full-stack project/experience context',
      });
    });
    mernOrFullStack = true;
  }

  // If MERN/full-stack context, infer these as well
  if (mernOrFullStack) {
    [
      { canonical: 'responsivedesign', labels: ['Responsive Design', 'Responsive Web Design'] },
      { canonical: 'tailwindcss', labels: ['Tailwind CSS'] },
      { canonical: 'frontenddevelopment', labels: ['Frontend Development'] },
      { canonical: 'apiintegration', labels: ['API Integration'] },
    ].forEach(({ canonical, labels }) => {
      upsertEvidence(canonical, {
        inferred: true,
        confidence: 'medium',
        reason: 'Inferred from MERN/full-stack context',
      });
      // Also allow matching by label aliases in keywords
      labels.forEach((label) => {
        upsertEvidence(label.toLowerCase().replace(/\s+/g, ''), {
          inferred: true,
          confidence: 'medium',
          reason: 'Inferred from MERN/full-stack context',
        });
      });
    });
  }

  if (/(backend|server\s*side|api\s*development)/i.test(fullText)) {
    ['backend', 'restapi'].forEach((canonical) => {
      upsertEvidence(canonical, {
        inferred: true,
        confidence: 'medium',
        reason: 'Inferred from backend development context',
      });
    });
  }

  if (containsKeyword(fullText, 'react') && !evidence.has('javascript')) {
    upsertEvidence('javascript', {
      inferred: true,
      confidence: 'medium',
      reason: 'Inferred because React usage implies JavaScript',
    });
  }

  if (containsKeyword(fullText, 'node') || containsKeyword(fullText, 'node.js')) {
    ['backend', 'restapi'].forEach((canonical) => {
      upsertEvidence(canonical, {
        inferred: true,
        confidence: 'medium',
        reason: 'Inferred because Node.js usage implies backend/API development',
      });
    });
  }

  if (/(deploy|deployed|deployment|pipeline|github actions|jenkins|gitlab ci|vercel|netlify|aws|azure)/i.test(fullText)) {
    upsertEvidence('cicd', {
      inferred: true,
      confidence: 'low',
      reason: 'Inferred from deployment/devops context',
    });
  }

  return evidence;
};

/**
 * Compare resume skills with job required/preferred skills
 */
const analyzeSkills = (resumeSkills, requiredSkills, preferredSkills, resumeText, parsedSections) => {
  const allJobSkills = [...(requiredSkills || []), ...(preferredSkills || [])];
  const evidence = collectResumeEvidence(resumeSkills, resumeText, parsedSections);
  const normRequired = (requiredSkills || []).map(normSkill);

  const matchedSkills = [];
  const missingSkills = [];
  const matchedSkillDetails = [];
  const missingSkillDetails = [];

  const uniqueMatched = new Set();
  const uniqueMissing = new Set();

  const versionMatchConfidence = (jobVersion, resumeVersion) => {
    if (!jobVersion) return 'high';
    if (!resumeVersion) return 'medium';
    if (resumeVersion >= jobVersion) return 'high';
    return 'medium';
  };

  const versionNotes = (jobVersion, resumeVersion) => {
    if (!jobVersion) return [];
    if (!resumeVersion) return ['Job requires specific version; resume version not explicitly stated'];
    if (resumeVersion < jobVersion) return [`Version gap: required ${jobVersion}, resume indicates ${resumeVersion}`];
    return [];
  };

  allJobSkills.forEach((skill) => {
    const canonical = normSkill(skill);
    const requirementVersion = parseVersionMeta(skill).major;
    const found = evidence.get(canonical);

    if (found && (found.explicit || found.inferred)) {
      const resumeVersion = (found.versions || []).length > 0
        ? Math.max(...found.versions)
        : null;
      const baseConfidence = found.explicit ? 'high' : found.confidence;
      let confidence = baseConfidence;
      if (requirementVersion && (!resumeVersion || resumeVersion < requirementVersion)) {
        confidence = CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK.medium ? 'medium' : confidence;
      }

      if (!uniqueMatched.has(skill)) {
        matchedSkills.push(skill);
        uniqueMatched.add(skill);
      }

      matchedSkillDetails.push({
        skill,
        confidence,
        matchType: found.explicit ? 'explicit' : 'inferred',
        reason: found.reason,
        notes: versionNotes(requirementVersion, resumeVersion),
      });
    } else {
      if (!uniqueMissing.has(skill)) {
        missingSkills.push(skill);
        uniqueMissing.add(skill);
      }
      missingSkillDetails.push({
        skill,
        confidence: 'low',
        matchType: 'missing',
        reason: 'No explicit or contextual evidence found in resume',
        notes: [],
      });
    }
  });

  // Score based only on required skills
  const requiredMatched = (requiredSkills || []).filter((rs) => {
    const canonical = normSkill(rs);
    const found = evidence.get(canonical);
    return Boolean(found && (found.explicit || found.inferred));
  }).length;
  const requiredTotal = normRequired.length || 1;
  const skillsCoverage = Math.round((requiredMatched / requiredTotal) * 100);

  return {
    matchedSkills,
    missingSkills,
    matchedSkillDetails,
    missingSkillDetails,
    skillsCoverage,
    evidence,
  };
};

/**
 * Analyze keyword overlap between resume text and job keywords
 */
const analyzeKeywords = (resumeText, jobKeywords, jobDescriptionText, skillAnalysis) => {
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
  const matchedKeywordDetails = [];
  const missingKeywordDetails = [];

  const skillEvidence = skillAnalysis?.evidence || new Map();
  const derivedKeywordSet = new Set();
  skillEvidence.forEach((details, canonical) => {
    if (!details || (!details.explicit && !details.inferred)) return;
    (ROLE_KEYWORD_EXPANSIONS[canonical] || []).forEach((kw) => derivedKeywordSet.add(kw));
  });

  if ((skillEvidence.get('fullstack')?.explicit || skillEvidence.get('fullstack')?.inferred) && !derivedKeywordSet.has('Full Stack Developer')) {
    derivedKeywordSet.add('Full Stack Developer');
  }

  if ((skillEvidence.get('restapi')?.explicit || skillEvidence.get('restapi')?.inferred || skillEvidence.get('backend')?.explicit || skillEvidence.get('backend')?.inferred) && !derivedKeywordSet.has('Backend Developer')) {
    derivedKeywordSet.add('Backend Developer');
  }

  const normalizeKeywordLoose = (kw) => normalizeKeyword(kw).replace(/\bdeveloper\b/g, '').replace(/\s+/g, ' ').trim();
  const normalizedDerived = [...derivedKeywordSet].map((k) => ({ raw: k, normalized: normalizeKeywordLoose(k) }));

  keywordMap.forEach((label, normalized) => {
    const directMatch = containsKeyword(resumeText, normalized);
    const looseJob = normalizeKeywordLoose(label);
    const derivedMatch = normalizedDerived.find((d) => d.normalized && d.normalized === looseJob);
    const canonicalKeyword = canonicalizeSkill(label);
    const inferredBySkill = Boolean(
      canonicalKeyword &&
      skillEvidence.get(canonicalKeyword) &&
      (skillEvidence.get(canonicalKeyword).explicit || skillEvidence.get(canonicalKeyword).inferred)
    );

    if (directMatch || derivedMatch || inferredBySkill) {
      matchedKeywords.push(label);
      matchedKeywordDetails.push({
        keyword: label,
        confidence: directMatch ? 'high' : inferredBySkill ? (skillEvidence.get(canonicalKeyword)?.confidence || 'medium') : 'medium',
        matchType: directMatch ? 'explicit' : 'inferred',
        reason: directMatch
          ? `Keyword found in resume text: "${label}"`
          : inferredBySkill
            ? `Inferred from matched skill evidence (${labelFromCanonical(canonicalKeyword, label)})`
            : `Derived from matched skill context (${derivedMatch?.raw || 'related skill'})`,
      });
    } else {
      missingKeywords.push(label);
      missingKeywordDetails.push({
        keyword: label,
        confidence: 'low',
        matchType: 'missing',
        reason: 'No explicit or implied evidence found in resume',
      });
    }
  });

  const totalKeywords = keywordMap.size;
  const keywordScore = totalKeywords
    ? Math.round((matchedKeywords.length / totalKeywords) * 100)
    : 0;

  return {
    matchedKeywords,
    missingKeywords,
    matchedKeywordDetails,
    missingKeywordDetails,
    keywordScore,
  };
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

  // Achievements (treat certifications/courses as equivalent)
  const achText = parsedSections.achievements || certText;
  analysis.achievements = {
    status: achText ? 'Strong' : 'Missing',
    score: achText ? 80 : 0,
    feedback: achText ? [] : ['Include notable achievements, certifications, or awards'],
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
  const {
    matchedSkills,
    missingSkills,
    matchedSkillDetails,
    missingSkillDetails,
    skillsCoverage,
    evidence,
  } = analyzeSkills(
    resumeSkills,
    requiredSkills,
    preferredSkills,
    resumeText,
    parsedSections
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
  const {
    matchedKeywords,
    missingKeywords,
    matchedKeywordDetails,
    missingKeywordDetails,
    keywordScore,
  } = analyzeKeywords(
    resumeText,
    keywords,
    jobDescriptionText,
    { evidence }
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
    matchedSkillDetails,
    missingSkillDetails,
    matchedKeywordDetails,
    missingKeywordDetails,
    advancedMatch: {
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      matched_keywords: matchedKeywords,
      missing_keywords: missingKeywords,
      confidence: {
        skills: matchedSkillDetails.map((item) => ({
          name: item.skill,
          confidence: item.confidence,
          matchType: item.matchType,
          reason: item.reason,
          notes: item.notes,
        })),
        keywords: matchedKeywordDetails.map((item) => ({
          name: item.keyword,
          confidence: item.confidence,
          matchType: item.matchType,
          reason: item.reason,
        })),
      },
    },
    sectionAnalysis,
    recommendations,
  };
};

module.exports = {
  calculateMatchScore,
  getGrade,
  DEFAULT_WEIGHTS,
};
