const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const { extractTextFromFile } = require('../utils/fileParser');
const {
  detectSections,
  extractContactInfo,
  extractSkills,
  extractEducation,
  extractExperience,
  extractProjects,
} = require('../utils/resumeParser');

const isAdmin = (req) => req.user?.role === 'admin';

// POST /api/resumes/upload
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { text, fileType } = await extractTextFromFile(req.file.path, req.file.originalname);

    // Keep the file on disk only if it's a PDF so it can be previewed later.
    // Delete DOCX files since they cannot be embedded in the browser.
    if (fileType !== 'pdf') {
      fs.unlink(req.file.path, () => {});
    }

    if (!text || text.trim().length < 50) {
      if (fileType === 'pdf') fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Could not extract sufficient text from file' });
    }

    const parsedSections = detectSections(text);
    const contactInfo = extractContactInfo(text);
    const skills = extractSkills(parsedSections.skills, text);
    const education = extractEducation(parsedSections.education);
    const experience = extractExperience(parsedSections.experience);
    const projects = extractProjects(parsedSections.projects);

    // Use provided name or extracted name
    const candidateName = req.body.candidateName || contactInfo.name || 'Unknown';

    const resume = await Resume.create({
      candidateName,
      email: req.body.email || contactInfo.email,
      phone: contactInfo.phone,
      linkedin: contactInfo.linkedin,
      resumeText: text,
      parsedSections,
      skills,
      education,
      experience,
      projects,
      fileName: req.file.originalname,
      fileType,
      storedFileName: fileType === 'pdf' ? req.file.filename : undefined,
      uploadedBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: resume });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// GET /api/resumes
const getAllResumes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (!isAdmin(req)) filter.uploadedBy = req.user._id;
    if (req.query.search) {
      filter.$or = [
        { candidateName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [resumes, total] = await Promise.all([
      Resume.find(filter).select('-resumeText').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Resume.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: resumes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/resumes/:id
const getResumeById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (!isAdmin(req)) filter.uploadedBy = req.user._id;

    const resume = await Resume.findOne(filter);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resumes/:id
const deleteResume = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (!isAdmin(req)) filter.uploadedBy = req.user._id;

    const resume = await Resume.findOne(filter);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    // Clean up stored file if it exists
    if (resume.storedFileName) {
      const filePath = path.join(__dirname, '../../uploads', resume.storedFileName);
      fs.unlink(filePath, () => {});
    }
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resumes
const deleteAllResumes = async (req, res, next) => {
  try {
    const filter = {};
    if (!isAdmin(req)) filter.uploadedBy = req.user._id;

    const resumes = await Resume.find(filter).select('storedFileName');
    if (resumes.length === 0) {
      return res.json({ success: true, message: 'No resumes to delete', deletedCount: 0 });
    }

    for (const resume of resumes) {
      if (resume.storedFileName) {
        const filePath = path.join(__dirname, '../../uploads', resume.storedFileName);
        fs.unlink(filePath, () => {});
      }
    }

    const result = await Resume.deleteMany(filter);

    res.json({
      success: true,
      message: 'All resumes deleted',
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/resumes/:id/file
const serveResumeFile = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (!isAdmin(req)) filter.uploadedBy = req.user._id;

    const resume = await Resume.findOne(filter);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (!resume.storedFileName) {
      return res.status(404).json({ success: false, message: 'File not available for this resume' });
    }
    const filePath = path.join(__dirname, '../../uploads', resume.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on server' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume.fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  deleteAllResumes,
  serveResumeFile,
};
