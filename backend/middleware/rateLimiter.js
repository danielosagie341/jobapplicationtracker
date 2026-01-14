const rateLimit = require('express-rate-limit');

// General rate limiter for all API routes
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60) // seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(15 * 60)
        });
    }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login specific limiter (slightly more lenient than general auth)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    rateLimiter,
    authLimiter,
    loginLimiter
};