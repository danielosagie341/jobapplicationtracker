const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })
    : new Sequelize({
        dialect: process.env.DB_DIALECT || 'sqlite',
        storage: process.env.DB_STORAGE || './database.sqlite',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

// Import models
const User = require('./User')(sequelize);
const Company = require('./Company')(sequelize);
const JobApplication = require('./JobApplication')(sequelize);
const Document = require('./Document')(sequelize);
const StatusHistory = require('./StatusHistory')(sequelize);
const Keyword = require('./Keyword')(sequelize);
const ApplicationKeyword = require('./ApplicationKeyword')(sequelize);

// Define associations
const defineAssociations = () => {
    // User associations
    User.hasMany(JobApplication, { 
        foreignKey: 'userId', 
        as: 'jobApplications',
        onDelete: 'CASCADE'
    });
    User.hasMany(Document, { 
        foreignKey: 'userId', 
        as: 'documents',
        onDelete: 'CASCADE'
    });
    User.hasMany(Company, { 
        foreignKey: 'addedBy', 
        as: 'addedCompanies'
    });

    // Company associations
    Company.hasMany(JobApplication, { 
        foreignKey: 'companyId', 
        as: 'applications',
        onDelete: 'CASCADE'
    });
    Company.belongsTo(User, { 
        foreignKey: 'addedBy', 
        as: 'addedByUser'
    });

    // JobApplication associations
    JobApplication.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'user'
    });
    JobApplication.belongsTo(Company, { 
        foreignKey: 'companyId', 
        as: 'company'
    });
    JobApplication.hasMany(Document, { 
        foreignKey: 'jobApplicationId', 
        as: 'documents'
    });
    JobApplication.hasMany(StatusHistory, { 
        foreignKey: 'jobApplicationId', 
        as: 'statusHistory',
        onDelete: 'CASCADE'
    });
    JobApplication.belongsToMany(Keyword, { 
        through: ApplicationKeyword, 
        foreignKey: 'jobApplicationId',
        otherKey: 'keywordId',
        as: 'keywords'
    });

    // Document associations
    Document.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'user'
    });
    Document.belongsTo(JobApplication, { 
        foreignKey: 'jobApplicationId', 
        as: 'jobApplication'
    });

    // StatusHistory associations
    StatusHistory.belongsTo(JobApplication, { 
        foreignKey: 'jobApplicationId', 
        as: 'jobApplication'
    });

    // Keyword associations
    Keyword.belongsToMany(JobApplication, { 
        through: ApplicationKeyword, 
        foreignKey: 'keywordId',
        otherKey: 'jobApplicationId',
        as: 'jobApplications'
    });

    // ApplicationKeyword associations
    ApplicationKeyword.belongsTo(JobApplication, { 
        foreignKey: 'jobApplicationId',
        as: 'jobApplication'
    });
    ApplicationKeyword.belongsTo(Keyword, { 
        foreignKey: 'keywordId',
        as: 'keyword'
    });
};

defineAssociations();

module.exports = {
    sequelize,
    User,
    Company,
    JobApplication,
    Document,
    StatusHistory,
    Keyword,
    ApplicationKeyword
};