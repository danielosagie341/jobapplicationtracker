const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Document = sequelize.define('Document', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        jobApplicationId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'job_applications',
                key: 'id'
            },
            onDelete: 'SET NULL',
            comment: 'Optional link to specific job application'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 100]
            }
        },
        type: {
            type: DataTypes.ENUM(
                'Resume',
                'Cover Letter',
                'Portfolio',
                'Transcript',
                'Certificate',
                'Reference Letter',
                'Writing Sample',
                'Code Sample',
                'Other'
            ),
            allowNull: false
        },
        version: {
            type: DataTypes.STRING(20),
            defaultValue: '1.0'
        },
        filePath: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: 'Path to file in storage system'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0
            },
            comment: 'File size in bytes'
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Extracted text content for analysis'
        },
        keywords: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Extracted keywords for matching'
        },
        skills: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Identified skills from document'
        },
        analysisScore: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            },
            comment: 'AI analysis score for document quality'
        },
        improvementSuggestions: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'AI-generated suggestions for improvement'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isTemplate: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this document serves as a template'
        },
        templateFor: {
            type: DataTypes.ENUM(
                'Software Engineer',
                'Data Scientist',
                'Product Manager',
                'Designer',
                'Marketing',
                'Sales',
                'General',
                'Other'
            ),
            allowNull: true,
            comment: 'Role category this template is optimized for'
        },
        lastAnalyzed: {
            type: DataTypes.DATE,
            allowNull: true
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        tags: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'User-defined tags for organization'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether document can be shared with recruiters'
        },
        shareUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            comment: 'Unique URL for sharing document'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Expiration date for shared documents'
        }
    }, {
        tableName: 'documents',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['jobApplicationId']
            },
            {
                fields: ['type']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['isTemplate']
            },
            {
                fields: ['templateFor']
            },
            {
                fields: ['shareUrl']
            },
            {
                fields: ['userId', 'type']
            },
            {
                fields: ['userId', 'isActive']
            }
        ],
        hooks: {
            beforeCreate: async (document) => {
                if (document.isPublic && !document.shareUrl) {
                    document.shareUrl = generateShareUrl();
                }
            },
            beforeUpdate: async (document) => {
                if (document.changed('isPublic') && document.isPublic && !document.shareUrl) {
                    document.shareUrl = generateShareUrl();
                }
                if (document.changed('isPublic') && !document.isPublic) {
                    document.shareUrl = null;
                }
            }
        }
    });

    // Instance methods
    Document.prototype.getFormattedFileSize = function() {
        const bytes = this.fileSize;
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    Document.prototype.isExpired = function() {
        if (!this.expiresAt) return false;
        return new Date() > new Date(this.expiresAt);
    };

    Document.prototype.canBeShared = function() {
        return this.isPublic && !this.isExpired() && this.shareUrl;
    };

    Document.prototype.incrementDownloadCount = function() {
        return this.increment('downloadCount');
    };

    Document.prototype.needsAnalysis = function() {
        if (!this.lastAnalyzed) return true;
        
        const daysSinceAnalysis = Math.floor(
            (new Date() - new Date(this.lastAnalyzed)) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceAnalysis > 30; // Re-analyze monthly
    };

    // Class methods
    Document.findByType = function(userId, type) {
        return this.findAll({
            where: { userId, type, isActive: true },
            order: [['updatedAt', 'DESC']]
        });
    };

    Document.findTemplates = function(templateFor = null) {
        const where = { isTemplate: true, isActive: true };
        if (templateFor) {
            where.templateFor = templateFor;
        }
        
        return this.findAll({
            where,
            order: [['name', 'ASC']]
        });
    };

    Document.findForAnalysis = function(userId) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: {
                userId,
                isActive: true,
                [Op.or]: [
                    { lastAnalyzed: null },
                    {
                        lastAnalyzed: {
                            [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
                        }
                    }
                ]
            }
        });
    };

    Document.findByShareUrl = function(shareUrl) {
        return this.findOne({
            where: { 
                shareUrl,
                isPublic: true,
                isActive: true
            },
            include: [
                {
                    model: sequelize.models.User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }
            ]
        });
    };

    return Document;
};

// Helper function to generate unique share URL
function generateShareUrl() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
}