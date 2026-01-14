const express = require('express');
const { Company, JobApplication } = require('../models');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/companies
// @desc    Get companies with search and pagination
// @access  Private
router.get('/', [
    auth,
    query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must be at least 1 character'),
    query('industry').optional().trim().isLength({ min: 1 }).withMessage('Industry must be specified'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
            search,
            industry,
            page = 1,
            limit = 20
        } = req.query;

        // Build where conditions
        const whereConditions = { isActive: true };

        if (search) {
            whereConditions[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (industry) {
            whereConditions.industry = industry;
        }

        // Calculate pagination
        const offset = (page - 1) * limit;

        const { count, rows: companies } = await Company.findAndCountAll({
            where: whereConditions,
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: {
                companies,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving companies'
        });
    }
});

// @route   GET /api/companies/:id
// @desc    Get single company
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id, {
            include: [
                {
                    model: JobApplication,
                    as: 'applications',
                    where: { userId: req.user.userId },
                    required: false,
                    attributes: ['id', 'jobTitle', 'status', 'appliedDate']
                }
            ]
        });

        if (!company || !company.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: { company }
        });

    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving company'
        });
    }
});

// @route   POST /api/companies
// @desc    Create new company
// @access  Private
router.post('/', [
    auth,
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
    body('industry').optional().trim().isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    body('website').optional().custom((value) => {
        if (value && value.trim() && !value.match(/^https?:\/\//)) {
            return Promise.reject('Website must start with http:// or https://');
        }
        return true;
    }),
    body('linkedinUrl').optional().custom((value) => {
        if (value && value.trim() && !value.match(/^https?:\/\//)) {
            return Promise.reject('LinkedIn URL must start with http:// or https://');
        }
        return true;
    }),
    body('glassdoorUrl').optional().custom((value) => {
        if (value && value.trim() && !value.match(/^https?:\/\//)) {
            return Promise.reject('Glassdoor URL must start with http:// or https://');
        }
        return true;
    })
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

        // Check if company already exists
        const existingCompany = await Company.findOne({
            where: { name: { [Op.like]: req.body.name.trim() } }
        });

        if (existingCompany) {
            return res.status(409).json({
                success: false,
                message: 'Company with this name already exists'
            });
        }

        const companyData = {
            ...req.body,
            addedBy: req.user.userId
        };

        const company = await Company.create(companyData);

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: { company }
        });

    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating company'
        });
    }
});

// @route   GET /api/companies/search/:query
// @desc    Quick search companies
// @access  Private
router.get('/search/:query', auth, async (req, res) => {
    try {
        const searchTerm = req.params.query;

        if (!searchTerm || searchTerm.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const companies = await Company.findAll({
            where: {
                name: { [Op.like]: `%${searchTerm}%` },
                isActive: true
            },
            attributes: ['id', 'name', 'industry', 'location', 'logo'],
            order: [['name', 'ASC']],
            limit: 10
        });

        res.json({
            success: true,
            data: { companies }
        });

    } catch (error) {
        console.error('Search companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching companies'
        });
    }
});

module.exports = router;