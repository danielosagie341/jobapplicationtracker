const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StatusHistory = sequelize.define('StatusHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        jobApplicationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'job_applications',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        fromStatus: {
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
            allowNull: true,
            comment: 'Previous status, null for initial status'
        },
        toStatus: {
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
            allowNull: false
        },
        changedBy: {
            type: DataTypes.ENUM('User', 'System', 'Auto'),
            defaultValue: 'User'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Additional data like interview details, rejection reason, etc.'
        },
        notificationSent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'status_history',
        timestamps: true,
        indexes: [
            {
                fields: ['jobApplicationId']
            },
            {
                fields: ['toStatus']
            },
            {
                fields: ['createdAt']
            },
            {
                fields: ['jobApplicationId', 'createdAt']
            }
        ]
    });

    // Instance methods
    StatusHistory.prototype.getStatusTransition = function() {
        if (!this.fromStatus) {
            return `Initial status: ${this.toStatus}`;
        }
        return `${this.fromStatus} → ${this.toStatus}`;
    };

    StatusHistory.prototype.isPositiveChange = function() {
        const statusProgression = [
            'Interested',
            'Applied',
            'Application Viewed',
            'Phone Screening',
            'Technical Interview',
            'On-site Interview',
            'Final Interview',
            'Reference Check',
            'Offer Extended',
            'Offer Accepted'
        ];
        
        const negativeStatuses = ['Rejected', 'Withdrawn', 'Offer Declined'];
        const neutralStatuses = ['On Hold'];
        
        // If moving to negative status, it's negative
        if (negativeStatuses.includes(this.toStatus)) return false;
        
        // If moving to neutral status, it's neutral (not positive)
        if (neutralStatuses.includes(this.toStatus)) return false;
        
        // If no previous status, it's positive (initial creation)
        if (!this.fromStatus) return true;
        
        // Compare positions in progression
        const fromIndex = statusProgression.indexOf(this.fromStatus);
        const toIndex = statusProgression.indexOf(this.toStatus);
        
        return toIndex > fromIndex;
    };

    StatusHistory.prototype.getDaysSinceChange = function() {
        const today = new Date();
        const changeDate = new Date(this.createdAt);
        const diffTime = Math.abs(today - changeDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Class methods
    StatusHistory.getApplicationTimeline = function(jobApplicationId) {
        return this.findAll({
            where: { jobApplicationId },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: sequelize.models.JobApplication,
                    as: 'jobApplication',
                    include: [
                        {
                            model: sequelize.models.Company,
                            as: 'company',
                            attributes: ['name']
                        }
                    ]
                }
            ]
        });
    };

    StatusHistory.getRecentChanges = function(userId, limit = 20) {
        return this.findAll({
            include: [
                {
                    model: sequelize.models.JobApplication,
                    as: 'jobApplication',
                    where: { userId },
                    include: [
                        {
                            model: sequelize.models.Company,
                            as: 'company',
                            attributes: ['name']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit
        });
    };

    StatusHistory.getStatusAnalytics = function(userId, dateRange = 30) {
        const { Op } = require('sequelize');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        return this.findAll({
            attributes: [
                'toStatus',
                [sequelize.fn('COUNT', '*'), 'count'],
                [sequelize.fn('DATE', sequelize.col('StatusHistory.createdAt')), 'date']
            ],
            include: [
                {
                    model: sequelize.models.JobApplication,
                    as: 'jobApplication',
                    where: { userId },
                    attributes: []
                }
            ],
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            group: ['toStatus', sequelize.fn('DATE', sequelize.col('StatusHistory.createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('StatusHistory.createdAt')), 'ASC']],
            raw: true
        });
    };

    StatusHistory.getAverageTimeInStatus = function(userId) {
        const query = `
            SELECT 
                from_status,
                to_status,
                AVG(EXTRACT(epoch FROM (next_change.created_at - current_change.created_at)) / 86400) as avg_days
            FROM status_history current_change
            INNER JOIN job_applications ja ON current_change.job_application_id = ja.id
            LEFT JOIN status_history next_change ON (
                next_change.job_application_id = current_change.job_application_id 
                AND next_change.created_at > current_change.created_at
                AND next_change.id = (
                    SELECT id FROM status_history 
                    WHERE job_application_id = current_change.job_application_id 
                    AND created_at > current_change.created_at 
                    ORDER BY created_at ASC 
                    LIMIT 1
                )
            )
            WHERE ja.user_id = :userId 
            AND current_change.from_status IS NOT NULL
            GROUP BY from_status, to_status
            ORDER BY from_status, to_status
        `;

        return sequelize.query(query, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });
    };

    return StatusHistory;
};