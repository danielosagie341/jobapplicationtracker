const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get analytics data
// @access  Private
router.get('/', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Analytics endpoint - Coming soon',
        data: { analytics: {} }
    });
});

module.exports = router;