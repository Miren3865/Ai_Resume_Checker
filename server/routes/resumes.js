const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  serveResumeFile,
} = require('../controllers/resumeController');

const router = express.Router();

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/', protect, getAllResumes);
router.get('/:id/file', protect, serveResumeFile);
router.get('/:id', protect, getResumeById);
router.delete('/:id', protect, deleteResume);

module.exports = router;
