const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const JobApplication = sequelize.define('JobApplication', {
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
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'companies',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        jobTitle: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        jobDescription: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        jobRequirements: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        jobUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        jobBoardSource: {
            type: DataTypes.ENUM(
                'LinkedIn',
                'Indeed',
                'Glassdoor',
                'AngelList',
                'ZipRecruiter',
                'Monster',
                'CareerBuilder',
                'Company Website',
                'Referral',
                'Recruiter Contact',
                'Job Fair',
                'Other'
            ),
            defaultValue: 'Other'
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        workType: {
            type: DataTypes.ENUM(
                'Full-time',
                'Part-time',
                'Contract',
                'Temporary',
                'Internship',
                'Freelance'
            ),
            defaultValue: 'Full-time'
        },
        workMode: {
            type: DataTypes.ENUM(
                'Remote',
                'On-site',
                'Hybrid'
            ),
            allowNull: true
        },
        salaryMin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        salaryMax: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        salaryCurrency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD'
        },
        experienceLevel: {
            type: DataTypes.ENUM(
                'Entry Level',
                'Associate',
                'Mid-Senior Level',
                'Director',
                'Executive'
            ),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(
                'Interested',
                'Applied',
                'Application Viewed',
                'Phone Screening',
                'Technical Interview',
                'On-site Interview',
                'Final Interview',
                'Reference Check',
                'Offer Extended',
                'Offer Accepted',
                'Offer Declined',
                'Rejected',
                'Withdrawn',
                'On Hold'
            ),
            defaultValue: 'Interested'
        },
        priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High'),
            defaultValue: 'Medium'
        },
        appliedDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastContactDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        followUpDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        interviewDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expectedResponseDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        responseReceived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        contactPerson: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        contactEmail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        contactPhone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        recruiterName: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        recruiterEmail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        recruiterLinkedin: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        hiringManagerName: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        hiringManagerEmail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        interviewNotes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        skills: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        benefits: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        applicationScore: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            },
            comment: 'AI-calculated match score between resume and job requirements'
        },
        isStarred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isArchived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        customFields: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    }, {
        tableName: 'job_applications',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['companyId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['appliedDate']
            },
            {
                fields: ['followUpDate']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['isStarred']
            },
            {
                fields: ['isArchived']
            },
            {
                fields: ['userId', 'status']
            },
            {
                fields: ['userId', 'appliedDate']
            }
        ]
    });

    // Instance methods
    JobApplication.prototype.isOverdue = function() {
        if (!this.followUpDate) return false;
        return new Date() > new Date(this.followUpDate);
    };

    JobApplication.prototype.getDaysFromApplication = function() {
        if (!this.appliedDate) return null;
        const today = new Date();
        const applicationDate = new Date(this.appliedDate);
        const diffTime = Math.abs(today - applicationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    JobApplication.prototype.getSalaryRange = function() {
        if (!this.salaryMin && !this.salaryMax) return 'Not specified';
        if (this.salaryMin && this.salaryMax) {
            return `${this.salaryCurrency} ${this.salaryMin.toLocaleString()} - ${this.salaryMax.toLocaleString()}`;
        }
        if (this.salaryMin) {
            return `${this.salaryCurrency} ${this.salaryMin.toLocaleString()}+`;
        }
        if (this.salaryMax) {
            return `Up to ${this.salaryCurrency} ${this.salaryMax.toLocaleString()}`;
        }
    };

    JobApplication.prototype.getStatusColor = function() {
        const colorMap = {
            'Interested': '#6B7280',
            'Applied': '#3B82F6',
            'Application Viewed': '#8B5CF6',
            'Phone Screening': '#10B981',
            'Technical Interview': '#F59E0B',
            'On-site Interview': '#EF4444',
            'Final Interview': '#EC4899',
            'Reference Check': '#06B6D4',
            'Offer Extended': '#84CC16',
            'Offer Accepted': '#22C55E',
            'Offer Declined': '#F97316',
            'Rejected': '#EF4444',
            'Withdrawn': '#6B7280',
            'On Hold': '#F59E0B'
        };
        return colorMap[this.status] || '#6B7280';
    };

    // Class methods
    JobApplication.findByStatus = function(userId, status) {
        return this.findAll({
            where: { userId, status },
            include: ['company'],
            order: [['appliedDate', 'DESC']]
        });
    };

    JobApplication.getRecentApplications = function(userId, limit = 10) {
        return this.findAll({
            where: { userId },
            include: ['company'],
            order: [['appliedDate', 'DESC']],
            limit
        });
    };

    JobApplication.getUpcomingFollowUps = function(userId) {
        const { Op } = require('sequelize');
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return this.findAll({
            where: {
                userId,
                followUpDate: {
                    [Op.between]: [today, nextWeek]
                }
            },
            include: ['company'],
            order: [['followUpDate', 'ASC']]
        });
    };

    JobApplication.getApplicationStats = function(userId) {
        const { Op } = require('sequelize');
        return this.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', '*'), 'count']
            ],
            where: { userId },
            group: ['status'],
            raw: true
        });
    };

    return JobApplication;
};