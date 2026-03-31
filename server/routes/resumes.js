const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  deleteAllResumes,
  serveResumeFile,
} = require('../controllers/resumeController');

const router = express.Router();

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/', protect, getAllResumes);
router.delete('/', protect, deleteAllResumes);
router.get('/:id/file', protect, serveResumeFile);
router.get('/:id', protect, getResumeById);
router.delete('/:id', protect, deleteResume);

module.exports = router;
