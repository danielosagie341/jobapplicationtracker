const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            }
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [6, 255]
            }
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^[\+]?[1-9][\d]{0,15}$/
            }
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        linkedinUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        githubUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        portfolioUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        currentJobTitle: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        experienceLevel: {
            type: DataTypes.ENUM('entry', 'mid', 'senior', 'executive'),
            defaultValue: 'entry'
        },
        preferredSalaryMin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        preferredSalaryMax: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        emailVerificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {
                notifications: {
                    email: true,
                    applicationReminders: true,
                    interviewReminders: true,
                    weeklyDigest: false
                },
                privacy: {
                    profileVisible: false,
                    shareAnalytics: false
                }
            }
        }
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // Instance methods
    User.prototype.checkPassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    User.prototype.validatePassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    User.prototype.getFullName = function() {
        return `${this.firstName} ${this.lastName}`;
    };

    User.prototype.toSafeObject = function() {
        const { password, emailVerificationToken, passwordResetToken, ...safeUser } = this.toJSON();
        return safeUser;
    };

    // Class methods
    User.findByEmail = function(email) {
        return this.findOne({ where: { email: email.toLowerCase() } });
    };

    return User;
};