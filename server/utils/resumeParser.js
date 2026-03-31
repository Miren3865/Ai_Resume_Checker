/**
 * Section detection using regex-based header matching
 */

const SECTION_PATTERNS = {
  contact: /\b(contact|phone|email|address|linkedin|github|portfolio)\b/i,
  summary: /\b(summary|objective|profile|about me|career objective|professional summary)\b/i,
  experience: /\b(experience|work experience|employment|work history|professional experience)\b/i,
  education: /\b(education|academic|qualification|degree|university|college|school)\b/i,
  skills: /\b(skills|technical skills|core competencies|technologies|expertise|proficiencies)\b/i,
  projects: /\b(projects|project work|personal projects|academic projects|key projects)\b/i,
  certifications: /\b(certifications|certificates|licenses|credentials|accreditations|courses|course|training)\b/i,
  achievements: /\b(achievements|awards|honors|accomplishments|recognition)\b/i,
};

/**
 * Split resume text into sections by detecting section headers
 */
const detectSections = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = {
    contact: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    achievements: '',
    other: '',
  };

  let currentSection = 'contact';
  const sectionBuffer = { contact: [], summary: [], experience: [], education: [], skills: [], projects: [], certifications: [], achievements: [], other: [] };

  for (const line of lines) {
    let matched = false;
    for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line) && line.length < 60) {
        currentSection = section;
        matched = true;
        break;
      }
    }
    if (!matched) {
      sectionBuffer[currentSection].push(line);
    }
  }

  for (const key of Object.keys(sectionBuffer)) {
    sections[key] = sectionBuffer[key].join('\n');
  }

  return sections;
};

/**
 * Extract contact information from resume text
 */
const extractContactInfo = (text) => {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  const lines = text.split('\n').filter(Boolean);
  const nameLine = lines[0] || '';

  return {
    name: nameLine.trim(),
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    github: githubMatch ? githubMatch[0] : null,
  };
};

/**
 * Extract skills list from skills section text
 */
const extractSkills = (skillsText, fullText) => {
  const combined = (skillsText || '') + '\n' + (fullText || '');
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'react', 'react.js', 'reactjs', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt',
    'node', 'node.js', 'nodejs', 'express', 'express.js', 'fastapi', 'django', 'flask', 'spring', 'laravel',
    'mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'firebase', 'dynamodb', 'oracle',
    'html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap', 'material ui',
    'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify',
    'graphql', 'rest', 'restapi', 'websocket', 'jwt', 'oauth',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
    'linux', 'bash', 'powershell', 'agile', 'scrum', 'jira', 'figma', 'photoshop',
    'webpack', 'vite', 'babel', 'eslint', 'jest', 'mocha', 'cypress',
    'redux', 'zustand', 'context api', 'axios', 'fetch',
  ];
  const lower = combined.toLowerCase();
  const found = skillKeywords.filter((skill) => lower.includes(skill));
  const deduplicated = [...new Set(found)];
  return deduplicated.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
};

/**
 * Extract education entries from education section
 */
const extractEducation = (educationText) => {
  if (!educationText) return [];
  const lines = educationText.split('\n').filter(Boolean);
  const degreePatterns = /\b(b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|mca|bca|phd|bachelor|master|associate|diploma|degree)\b/i;
  const entries = [];
  let current = {};
  for (const line of lines) {
    if (degreePatterns.test(line)) {
      if (current.degree) entries.push(current);
      current = { degree: line, institution: '', year: '', gpa: '' };
    } else if (current.degree) {
      if (!current.institution) current.institution = line;
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) current.year = yearMatch[0];
      const gpaMatch = line.match(/(\d\.\d{1,2})\s*(gpa|cgpa|\/4|\/10)?/i);
      if (gpaMatch) current.gpa = gpaMatch[0];
    }
  }
  if (current.degree) entries.push(current);
  return entries;
};

/**
 * Extract experience entries from experience section
 */
const extractExperience = (experienceText) => {
  if (!experienceText) return [];
  const lines = experienceText.split('\n').filter(Boolean);
  const entries = [];
  let current = null;
  for (const line of lines) {
    const dateRange = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|\d{4})\b/i.test(line);
    if (dateRange && line.length < 80) {
      if (current) entries.push(current);
      current = { title: line, company: '', duration: line, description: '' };
    } else if (current) {
      if (!current.company) current.company = line;
      else current.description += ' ' + line;
    }
  }
  if (current) entries.push(current);
  return entries;
};

/**
 * Extract projects from projects section
 */
const extractProjects = (projectsText) => {
  if (!projectsText) return [];
  const lines = projectsText.split('\n').filter(Boolean);
  const projects = [];
  let current = null;
  for (const line of lines) {
    const techMatch = line.match(/tech(nologie)?s?:\s*(.+)/i);
    const linkMatch = line.match(/(https?:\/\/\S+|github\.com\/\S+)/i);
    if (line.length < 80 && !techMatch && !linkMatch && current === null) {
      current = { title: line, description: '', technologies: [], link: '' };
    } else if (current) {
      if (techMatch) {
        current.technologies = techMatch[2].split(/[,|]/).map((t) => t.trim());
      } else if (linkMatch) {
        current.link = linkMatch[0];
      } else {
        current.description += ' ' + line;
      }
    }
    // Push when next project starts (blank lines or new title)
    if (line === '' && current) {
      projects.push(current);
      current = null;
    }
  }
  if (current) projects.push(current);
  return projects;
};

module.exports = {
  detectSections,
  extractContactInfo,
  extractSkills,
  extractEducation,
  extractExperience,
  extractProjects,
};
