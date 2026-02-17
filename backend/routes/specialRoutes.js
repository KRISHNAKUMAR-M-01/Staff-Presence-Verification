const express = require('express');
const router = express.Router();
const specialController = require('../controllers/specialController');
const { authenticateToken, requireExecutive } = require('../middleware/auth');

// All routes require authentication and Executive role
router.use(authenticateToken);
router.use(requireExecutive);

// View status of every staff
router.get('/staff-status', specialController.getAllStaffStatus);

// Send meeting request (with substitution logic)
router.post('/meet', specialController.sendMeetingRequest);

module.exports = router;
