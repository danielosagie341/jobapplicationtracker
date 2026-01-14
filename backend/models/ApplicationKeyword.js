const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ApplicationKeyword = sequelize.define('ApplicationKeyword', {
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
        keywordId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'keywords',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        source: {
            type: DataTypes.ENUM(
                'Job Description',
                'Job Requirements',
                'User Added',
                'AI Extracted',
                'Resume Match'
            ),
            defaultValue: 'Job Description'
        },
        matchStrength: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 1.0,
            validate: {
                min: 0,
                max: 10
            },
            comment: 'How strongly this keyword matches the application (0-10)'
        },
        inResume: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this keyword appears in user resume'
        },
        resumeFrequency: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'How many times this keyword appears in resume'
        },
        jobFrequency: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'How many times this keyword appears in job description'
        },
        isRequired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is marked as required skill in job posting'
        },
        isPreferred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is marked as preferred skill in job posting'
        },
        skillLevel: {
            type: DataTypes.ENUM(
                'Beginner',
                'Intermediate',
                'Advanced',
                'Expert',
                'Not Specified'
            ),
            defaultValue: 'Not Specified'
        },
        yearsRequired: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Years of experience required for this skill'
        },
        userSkillLevel: {
            type: DataTypes.ENUM(
                'Beginner',
                'Intermediate',
                'Advanced',
                'Expert',
                'None'
            ),
            defaultValue: 'None'
        },
        userYearsExperience: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Years of experience user has with this skill'
        },
        gapScore: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0,
            comment: 'Skill gap score (negative = user exceeds requirement, positive = gap exists)'
        },
        priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
            defaultValue: 'Medium'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'application_keywords',
        timestamps: true,
        indexes: [
            {
                fields: ['jobApplicationId']
            },
            {
                fields: ['keywordId']
            },
            {
                fields: ['source']
            },
            {
                fields: ['matchStrength']
            },
            {
                fields: ['isRequired']
            },
            {
                fields: ['isPreferred']
            },
            {
                fields: ['inResume']
            },
            {
                fields: ['gapScore']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['jobApplicationId', 'keywordId'], // Composite index
                unique: true
            }
        ]
    });

    // Instance methods
    ApplicationKeyword.prototype.calculateGapScore = function() {
        if (!this.isRequired && !this.isPreferred) {
            this.gapScore = 0;
            return this;
        }

        let gapScore = 0;

        // If user has no experience with required skill
        if (this.isRequired && this.userSkillLevel === 'None') {
            gapScore = 5.0; // High gap
        }
        // If user has some experience but less than required
        else if (this.yearsRequired && this.userYearsExperience < this.yearsRequired) {
            const yearGap = this.yearsRequired - this.userYearsExperience;
            gapScore = Math.min(yearGap * 0.5, 3.0); // Cap at 3.0
        }
        // If user exceeds requirements
        else if (this.yearsRequired && this.userYearsExperience > this.yearsRequired) {
            gapScore = -0.5; // Slight advantage
        }

        // Adjust based on skill level comparison
        const skillLevels = ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
        const requiredIndex = skillLevels.indexOf(this.skillLevel);
        const userIndex = skillLevels.indexOf(this.userSkillLevel);

        if (requiredIndex > userIndex) {
            gapScore += (requiredIndex - userIndex) * 0.5;
        } else if (userIndex > requiredIndex) {
            gapScore -= (userIndex - requiredIndex) * 0.2;
        }

        this.gapScore = Math.round(gapScore * 100) / 100; // Round to 2 decimal places
        return this;
    };

    ApplicationKeyword.prototype.isSkillGap = function() {
        return this.gapScore > 0;
    };

    ApplicationKeyword.prototype.isStrength = function() {
        return this.gapScore < 0;
    };

    ApplicationKeyword.prototype.getMatchPercentage = function() {
        return Math.round((this.matchStrength / 10) * 100);
    };

    // Class methods
    ApplicationKeyword.findByApplication = function(jobApplicationId) {
        return this.findAll({
            where: { jobApplicationId },
            include: [
                {
                    model: sequelize.models.Keyword,
                    as: 'keyword'
                }
            ],
            order: [['matchStrength', 'DESC']]
        });
    };

    ApplicationKeyword.findSkillGaps = function(jobApplicationId) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: { 
                jobApplicationId,
                gapScore: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: sequelize.models.Keyword,
                    as: 'keyword'
                }
            ],
            order: [['gapScore', 'DESC']]
        });
    };

    ApplicationKeyword.findStrengths = function(jobApplicationId) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: { 
                jobApplicationId,
                gapScore: { [Op.lt]: 0 }
            },
            include: [
                {
                    model: sequelize.models.Keyword,
                    as: 'keyword'
                }
            ],
            order: [['gapScore', 'ASC']]
        });
    };

    ApplicationKeyword.findRequiredSkills = function(jobApplicationId) {
        return this.findAll({
            where: { 
                jobApplicationId,
                isRequired: true
            },
            include: [
                {
                    model: sequelize.models.Keyword,
                    as: 'keyword'
                }
            ],
            order: [['matchStrength', 'DESC']]
        });
    };

    ApplicationKeyword.getSkillMatchSummary = function(jobApplicationId) {
        const { Op } = require('sequelize');
        return this.findAll({
            attributes: [
                [sequelize.fn('COUNT', '*'), 'totalSkills'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_required = true THEN 1 END')), 'requiredSkills'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN in_resume = true THEN 1 END')), 'matchedSkills'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN gap_score > 0 THEN 1 END')), 'skillGaps'],
                [sequelize.fn('AVG', sequelize.col('match_strength')), 'avgMatchStrength']
            ],
            where: { jobApplicationId },
            raw: true
        });
    };

    return ApplicationKeyword;
};