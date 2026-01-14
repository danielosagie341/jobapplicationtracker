const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const errorHandler = (error, req, res, next) => {
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    let statusCode = 500;
    let message = 'Internal server error';
    let details = {};

    // Sequelize Validation Error
    if (error instanceof ValidationError) {
        statusCode = 400;
        message = 'Validation failed';
        details = {
            errors: error.errors.map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }))
        };
    }
    // Sequelize Unique Constraint Error
    else if (error instanceof UniqueConstraintError) {
        statusCode = 409;
        message = 'Resource already exists';
        details = {
            field: error.errors[0]?.path,
            value: error.errors[0]?.value
        };
    }
    // Sequelize Foreign Key Constraint Error
    else if (error instanceof ForeignKeyConstraintError) {
        statusCode = 400;
        message = 'Invalid reference to related resource';
        details = {
            constraint: error.index
        };
    }
    // JWT Errors
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }
    // Custom Application Errors
    else if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
        details = error.details || {};
    }
    // Multer file upload errors
    else if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File too large';
    }
    else if (error.code === 'LIMIT_FILE_COUNT') {
        statusCode = 400;
        message = 'Too many files uploaded';
    }
    else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field';
    }

    // Build response
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Add details if they exist
    if (Object.keys(details).length > 0) {
        response.details = details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    // Send error response
    res.status(statusCode).json(response);
};

// Custom error class for application-specific errors
class AppError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Async wrapper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    AppError,
    asyncHandler
};