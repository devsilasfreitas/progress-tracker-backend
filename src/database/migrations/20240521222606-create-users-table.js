'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      provider: {
        type: Sequelize.DataTypes.ENUM('email', 'google', 'both'),
        allowNull: false,
      },
      theme: {
        type: Sequelize.DataTypes.ENUM('light', 'dark'),
        allowNull: false,
      },
      profile_url: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        default: 'https://drive.google.com/uc?id=1h-wwIjZ0fFf-O-RAw0iX2Cup9l969p7l'
      },
      verified: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        default: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
