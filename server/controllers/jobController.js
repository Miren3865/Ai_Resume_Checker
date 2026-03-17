const { validationResult } = require('express-validator');
const JobDescription = require('../models/JobDescription');

// POST /api/jobs
const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const job = await JobDescription.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs
const getAllJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { jobTitle: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.employmentType) filter.employmentType = req.query.employmentType;
    if (req.query.experienceLevel) filter.experienceLevel = req.query.experienceLevel;

    const [jobs, total] = await Promise.all([
      JobDescription.find(filter).select('-jobDescriptionText').sort({ createdAt: -1 }).skip(skip).limit(limit),
      JobDescription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job description not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// PUT /api/jobs/:id
const updateJob = async (req, res, next) => {
  try {
    const job = await JobDescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/jobs/:id
const deleteJob = async (req, res, next) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob };
