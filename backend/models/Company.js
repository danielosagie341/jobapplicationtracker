const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        industry: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        size: {
            type: DataTypes.ENUM(
                '1-10',
                '11-50', 
                '51-200', 
                '201-500', 
                '501-1000', 
                '1001-5000',
                '5001-10000',
                '10000+'
            ),
            allowNull: true
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        headquarters: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        website: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        linkedinUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        foundedYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1800,
                max: new Date().getFullYear()
            }
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        stockSymbol: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        revenue: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        benefits: {
            type: DataTypes.JSONB,
            defaultValue: {
                healthInsurance: false,
                dentalInsurance: false,
                visionInsurance: false,
                retirement401k: false,
                paidTimeOff: false,
                remoteWork: false,
                flexibleSchedule: false,
                professionalDevelopment: false,
                tuitionReimbursement: false,
                gymMembership: false,
                freeLunch: false,
                stockOptions: false
            }
        },
        culture: {
            type: DataTypes.JSONB,
            defaultValue: {
                workLifeBalance: null,
                diversity: null,
                innovation: null,
                collaboration: null,
                growth: null
            }
        },
        glassdoorRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        glassdoorUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        logo: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        addedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'User who added this company'
        }
    }, {
        tableName: 'companies',
        timestamps: true,
        indexes: [
            {
                fields: ['name']
            },
            {
                fields: ['industry']
            },
            {
                fields: ['size']
            },
            {
                fields: ['location']
            }
        ]
    });

    // Instance methods
    Company.prototype.getDisplayName = function() {
        return this.name;
    };

    Company.prototype.getLocationString = function() {
        return this.location || this.headquarters || 'Location not specified';
    };

    Company.prototype.hasWebsite = function() {
        return !!this.website;
    };

    // Class methods
    Company.searchByName = function(searchTerm) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: {
                name: {
                    [Op.iLike]: `%${searchTerm}%`
                }
            },
            limit: 10
        });
    };

    Company.findByIndustry = function(industry) {
        return this.findAll({
            where: { industry },
            order: [['name', 'ASC']]
        });
    };

    Company.getPopularCompanies = function() {
        return this.findAll({
            attributes: [
                'id',
                'name',
                'industry',
                'location',
                'logo',
                [sequelize.fn('COUNT', sequelize.col('applications.id')), 'applicationCount']
            ],
            include: [{
                model: sequelize.models.JobApplication,
                as: 'applications',
                attributes: []
            }],
            group: ['Company.id'],
            order: [[sequelize.fn('COUNT', sequelize.col('applications.id')), 'DESC']],
            limit: 20
        });
    };

    return Company;
};