const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document } = require('../models');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /\.(pdf|doc|docx|txt)$/i;
        if (allowedTypes.test(path.extname(file.originalname))) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
        }
    }
});

// @route   GET /api/documents
// @desc    Get user documents
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const documents = await Document.findAll({
            where: {
                userId: req.user.userId,
                isActive: true
            },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: { documents }
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving documents'
        });
    }
});

// @route   POST /api/documents/upload
// @desc    Upload a document
// @access  Private
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { name, type = 'Other', description, isPublic = false } = req.body;

        const document = await Document.create({
            userId: req.user.userId,
            name: name || req.file.originalname,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            type,
            description,
            isPublic: isPublic === 'true'
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: { document }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        // Clean up file if database save failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Server error uploading document'
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findOne({
            where: {
                id: req.params.id,
                userId: req.user.userId
            }
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Soft delete
        await document.update({ isActive: false });

        // Optionally delete physical file
        if (fs.existsSync(document.path)) {
            fs.unlinkSync(document.path);
        }

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting document'
        });
    }
});

module.exports = router;