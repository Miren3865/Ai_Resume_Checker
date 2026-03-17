const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

const router = express.Router();

const jobValidation = [
  body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
  body('jobDescriptionText').trim().notEmpty().withMessage('Job description text is required'),
  body('employmentType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']),
  body('experienceLevel')
    .optional()
    .isIn(['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director']),
];

router.post('/', protect, jobValidation, createJob);
router.get('/', protect, getAllJobs);
router.get('/:id', protect, getJobById);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;
