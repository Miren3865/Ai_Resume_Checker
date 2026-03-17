const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createEvaluation,
  getAllEvaluations,
  getEvaluationById,
  deleteEvaluation,
  resumeBattle,
  getDashboardStats,
} = require('../controllers/evaluationController');

const router = express.Router();

router.get('/stats/dashboard', protect, getDashboardStats);
router.post('/battle', protect, resumeBattle);
router.post('/', protect, createEvaluation);
router.get('/', protect, getAllEvaluations);
router.get('/:id', protect, getEvaluationById);
router.delete('/:id', protect, deleteEvaluation);

module.exports = router;
