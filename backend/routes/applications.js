const express = require('express');
const { sequelize, JobApplication, Company, Document, StatusHistory, Keyword, ApplicationKeyword } = require('../models');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/applications
// @desc    Get all job applications for user
// @access  Private
router.get('/', [
    auth,
    query('status').optional().isIn([
        'Interested', 'Applied', 'Application Viewed', 'Phone Screening',
        'Technical Interview', 'On-site Interview', 'Final Interview',
        'Reference Check', 'Offer Extended', 'Offer Accepted',
        'Offer Declined', 'Rejected', 'Withdrawn', 'On Hold'
    ]).withMessage('Invalid status'),
    query('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['appliedDate', 'updatedAt', 'jobTitle', 'status', 'priority']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            status,
            priority,
            search,
            isStarred,
            isArchived,
            page = 1,
            limit = 20,
            sortBy = 'updatedAt',
            order = 'DESC'
        } = req.query;

        // Build where conditions
        const whereConditions = { userId: req.user.userId };

        if (status) whereConditions.status = status;
        if (priority) whereConditions.priority = priority;
        if (isStarred !== undefined) whereConditions.isStarred = isStarred === 'true';
        if (isArchived !== undefined) whereConditions.isArchived = isArchived === 'true';

        // Handle search
        if (search) {
            whereConditions[Op.or] = [
                { jobTitle: { [Op.like]: `%${search}%` } },
                { notes: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Get applications with company info
        const { count, rows: applications } = await JobApplication.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name', 'industry', 'location', 'logo']
                }
            ],
            order: [[sortBy, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            success: true,
            data: {
                applications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                }
            }
        });

    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving applications'
        });
    }
});

// @route   GET /api/applications/:id
// @desc    Get single job application
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const application = await JobApplication.findOne({
            where: {
                id: req.params.id,
                userId: req.user.userId
            },
            include: [
                {
                    model: Company,
                    as: 'company'
                },
                {
                    model: Document,
                    as: 'documents',
                    where: { isActive: true },
                    required: false
                },
                {
                    model: StatusHistory,
                    as: 'statusHistory',
                    order: [['createdAt', 'ASC']]
                },
                {
                    model: Keyword,
                    as: 'keywords',
                    through: {
                        model: ApplicationKeyword,
                        as: 'applicationKeyword',
                        attributes: ['source', 'matchStrength', 'inResume', 'isRequired', 'gapScore']
                    }
                }
            ]
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Job application not found'
            });
        }

        res.json({
            success: true,
            data: { application }
        });

    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving application'
        });
    }
});

// @route   POST /api/applications
// @desc    Create new job application
// @access  Private
router.post('/', [
    auth,
    body('companyId').optional().isUUID().withMessage('Company ID must be valid if provided'),
    body('jobTitle').trim().isLength({ min: 2, max: 100 }).withMessage('Job title must be between 2 and 100 characters'),
    body('jobUrl').optional().custom((value) => {
        if (!value || value.trim() === '') return true;
        
        // Auto-fix common URL mistakes
        let url = value.trim();
        if (url.startsWith('https:') && !url.startsWith('https://')) {
            url = url.replace('https:', 'https://');
        }
        if (url.startsWith('http:') && !url.startsWith('http://')) {
            url = url.replace('http:', 'http://');
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Basic URL validation
        try {
            new URL(url);
            return true;
        } catch {
            return Promise.reject('Please enter a valid URL (e.g., https://example.com)');
        }
    }).customSanitizer((value) => {
        if (!value || value.trim() === '') return value;
        
        // Auto-fix common URL mistakes
        let url = value.trim();
        if (url.startsWith('https:') && !url.startsWith('https://')) {
            url = url.replace('https:', 'https://');
        }
        if (url.startsWith('http:') && !url.startsWith('http://')) {
            url = url.replace('http:', 'http://');
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        return url;
    }),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    body('salaryMin').optional().isInt({ min: 0 }).withMessage('Minimum salary must be a positive number'),
    body('salaryMax').optional().isInt({ min: 0 }).withMessage('Maximum salary must be a positive number'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Verify company exists or create if companyId provided
        let companyId = req.body.companyId;
        if (companyId) {
            const company = await Company.findByPk(companyId);
            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        } else {
            // If no companyId provided, we'll handle this in frontend
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        // Validate salary range
        if (req.body.salaryMin && req.body.salaryMax && req.body.salaryMin > req.body.salaryMax) {
            return res.status(400).json({
                success: false,
                message: 'Minimum salary cannot be greater than maximum salary'
            });
        }

        const applicationData = {
            ...req.body,
            userId: req.user.userId
        };

        const application = await JobApplication.create(applicationData);

        // Create initial status history
        await StatusHistory.create({
            jobApplicationId: application.id,
            toStatus: application.status,
            changedBy: 'User'
        });

        // Fetch the created application with company info
        const createdApplication = await JobApplication.findByPk(application.id, {
            include: [
                {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name', 'industry', 'location', 'logo']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Job application created successfully',
            data: { application: createdApplication }
        });

    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating application'
        });
    }
});

// @route   PUT /api/applications/:id
// @desc    Update job application
// @access  Private
router.put('/:id', [
    auth,
    body('jobTitle').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Job title must be between 2 and 100 characters'),
    body('jobUrl').optional().custom((value) => {
        if (!value || value.trim() === '') return true;
        
        // Auto-fix common URL mistakes
        let url = value.trim();
        if (url.startsWith('https:') && !url.startsWith('https://')) {
            url = url.replace('https:', 'https://');
        }
        if (url.startsWith('http:') && !url.startsWith('http://')) {
            url = url.replace('http:', 'http://');
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Basic URL validation
        try {
            new URL(url);
            return true;
        } catch {
            return Promise.reject('Please enter a valid URL (e.g., https://example.com)');
        }
    }).customSanitizer((value) => {
        if (!value || value.trim() === '') return value;
        
        // Auto-fix common URL mistakes
        let url = value.trim();
        if (url.startsWith('https:') && !url.startsWith('https://')) {
            url = url.replace('https:', 'https://');
        }
        if (url.startsWith('http:') && !url.startsWith('http://')) {
            url = url.replace('http:', 'http://');
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        return url;
    }),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    body('salaryMin').optional().isInt({ min: 0 }).withMessage('Minimum salary must be a positive number'),
    body('salaryMax').optional().isInt({ min: 0 }).withMessage('Maximum salary must be a positive number'),
    body('status').optional().isIn([
        'Interested', 'Applied', 'Application Viewed', 'Phone Screening',
        'Technical Interview', 'On-site Interview', 'Final Interview',
        'Reference Check', 'Offer Extended', 'Offer Accepted',
        'Offer Declined', 'Rejected', 'Withdrawn', 'On Hold'
    ]).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const application = await JobApplication.findOne({
            where: {
                id: req.params.id,
                userId: req.user.userId
            }
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Job application not found'
            });
        }

        // Validate salary range
        const salaryMin = req.body.salaryMin || application.salaryMin;
        const salaryMax = req.body.salaryMax || application.salaryMax;
        
        if (salaryMin && salaryMax && salaryMin > salaryMax) {
            return res.status(400).json({
                success: false,
                message: 'Minimum salary cannot be greater than maximum salary'
            });
        }

        // Track status changes
        const oldStatus = application.status;
        const newStatus = req.body.status;

        await application.update(req.body);

        // Create status history if status changed
        if (newStatus && newStatus !== oldStatus) {
            await StatusHistory.create({
                jobApplicationId: application.id,
                fromStatus: oldStatus,
                toStatus: newStatus,
                changedBy: 'User',
                notes: req.body.statusNotes || null
            });
        }

        // Fetch updated application with company info
        const updatedApplication = await JobApplication.findByPk(application.id, {
            include: [
                {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name', 'industry', 'location', 'logo']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Job application updated successfully',
            data: { application: updatedApplication }
        });

    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating application'
        });
    }
});

// @route   DELETE /api/applications/:id
// @desc    Delete job application
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const application = await JobApplication.findOne({
            where: {
                id: req.params.id,
                userId: req.user.userId
            },
            transaction
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Job application not found'
            });
        }

        // Manually delete related records to avoid foreign key issues
        
        // Delete status history first
        await StatusHistory.destroy({
            where: { jobApplicationId: application.id },
            transaction
        });

        // Delete application keywords
        await ApplicationKeyword.destroy({
            where: { jobApplicationId: application.id },
            transaction
        });

        // Delete related documents (if any exist)
        await Document.destroy({
            where: { jobApplicationId: application.id },
            transaction
        });

        // Finally delete the application
        await application.destroy({ transaction });
        
        await transaction.commit();

        res.json({
            success: true,
            message: 'Job application deleted successfully'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting application',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/applications/stats/overview
// @desc    Get application statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get status counts
        const statusStats = await JobApplication.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', '*'), 'count']
            ],
            where: { userId },
            group: ['status'],
            raw: true
        });

        // Get total applications
        const totalApplications = await JobApplication.count({ where: { userId } });

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentApplications = await JobApplication.count({
            where: {
                userId,
                createdAt: { [Op.gte]: thirtyDaysAgo }
            }
        });

        // Get upcoming follow-ups
        const upcomingFollowUps = await JobApplication.count({
            where: {
                userId,
                followUpDate: { [Op.gte]: new Date() },
                status: { [Op.notIn]: ['Offer Accepted', 'Rejected', 'Withdrawn'] }
            }
        });

        // Get response rate
        const appliedCount = await JobApplication.count({
            where: { userId, status: { [Op.ne]: 'Interested' } }
        });

        const responseCount = await JobApplication.count({
            where: {
                userId,
                status: {
                    [Op.in]: [
                        'Application Viewed', 'Phone Screening', 'Technical Interview',
                        'On-site Interview', 'Final Interview', 'Reference Check',
                        'Offer Extended', 'Offer Accepted', 'Offer Declined'
                    ]
                }
            }
        });

        const responseRate = appliedCount > 0 ? (responseCount / appliedCount * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                totalApplications,
                recentApplications,
                upcomingFollowUps,
                responseRate: parseFloat(responseRate),
                statusDistribution: statusStats
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving statistics'
        });
    }
});

module.exports = router;