const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Keyword = sequelize.define('Keyword', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        word: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [1, 100]
            }
        },
        category: {
            type: DataTypes.ENUM(
                'Technical Skill',
                'Soft Skill',
                'Programming Language',
                'Framework',
                'Tool',
                'Certification',
                'Industry',
                'Role',
                'Other'
            ),
            defaultValue: 'Other'
        },
        frequency: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Number of times this keyword appears in job descriptions'
        },
        importance: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0,
            validate: {
                min: 0,
                max: 10
            },
            comment: 'AI-calculated importance score'
        },
        synonyms: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Alternative forms of this keyword'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.ENUM('System', 'User', 'AI'),
            defaultValue: 'System'
        }
    }, {
        tableName: 'keywords',
        timestamps: true,
        indexes: [
            {
                fields: ['word']
            },
            {
                fields: ['category']
            },
            {
                fields: ['frequency']
            },
            {
                fields: ['importance']
            },
            {
                fields: ['isActive']
            }
        ]
    });

    // Instance methods
    Keyword.prototype.incrementFrequency = function() {
        return this.increment('frequency');
    };

    Keyword.prototype.addSynonym = function(synonym) {
        const synonyms = [...this.synonyms];
        if (!synonyms.includes(synonym.toLowerCase())) {
            synonyms.push(synonym.toLowerCase());
            return this.update({ synonyms });
        }
        return Promise.resolve(this);
    };

    Keyword.prototype.removeSynonym = function(synonym) {
        const synonyms = this.synonyms.filter(s => s !== synonym.toLowerCase());
        return this.update({ synonyms });
    };

    // Class methods
    Keyword.findByCategory = function(category) {
        return this.findAll({
            where: { category, isActive: true },
            order: [['frequency', 'DESC']]
        });
    };

    Keyword.findPopular = function(limit = 50) {
        return this.findAll({
            where: { isActive: true },
            order: [['frequency', 'DESC']],
            limit
        });
    };

    Keyword.findByImportance = function(minImportance = 5.0) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: { 
                importance: { [Op.gte]: minImportance },
                isActive: true 
            },
            order: [['importance', 'DESC']]
        });
    };

    Keyword.searchKeywords = function(searchTerm) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: {
                [Op.or]: [
                    {
                        word: {
                            [Op.iLike]: `%${searchTerm}%`
                        }
                    },
                    {
                        synonyms: {
                            [Op.contains]: [searchTerm.toLowerCase()]
                        }
                    }
                ],
                isActive: true
            },
            order: [['frequency', 'DESC']],
            limit: 20
        });
    };

    Keyword.createOrUpdate = async function(word, category = 'Other') {
        const [keyword, created] = await this.findOrCreate({
            where: { word: word.toLowerCase() },
            defaults: {
                word: word.toLowerCase(),
                category,
                frequency: 1
            }
        });

        if (!created) {
            await keyword.incrementFrequency();
        }

        return keyword;
    };

    Keyword.bulkCreateKeywords = async function(keywords) {
        const results = [];
        for (const keywordData of keywords) {
            const keyword = await this.createOrUpdate(
                keywordData.word, 
                keywordData.category || 'Other'
            );
            results.push(keyword);
        }
        return results;
    };

    return Keyword;
};