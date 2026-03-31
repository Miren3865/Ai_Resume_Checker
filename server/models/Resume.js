const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    linkedin: {
      type: String,
      trim: true,
    },
    education: [
      {
        degree: String,
        institution: String,
        year: String,
        gpa: String,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        link: String,
      },
    ],
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        year: String,
      },
    ],
    achievements: [String],
    resumeText: {
      type: String,
      required: true,
    },
    parsedSections: {
      contact: String,
      summary: String,
      experience: String,
      education: String,
      skills: String,
      projects: String,
      certifications: String,
      achievements: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
    },
    storedFileName: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
