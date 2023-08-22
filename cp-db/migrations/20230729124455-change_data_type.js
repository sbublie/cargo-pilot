"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {

    // Remove the old "timestamp" column
    await queryInterface.removeColumn('Locations', 'timestamp');

    await queryInterface.addColumn("Locations", "timestamp", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the old "timestamp" column
    await queryInterface.addColumn("Locations", "timestamp", {
      type: Sequelize.TIME, // Change this to the original type, e.g., Sequelize.TIME
      allowNull: false,
    });

    // Copy data from new "new_timestamp" column to old "timestamp" column
    await queryInterface.sequelize.query(`
      UPDATE "Locations"
      SET "timestamp" = TO_TIMESTAMP("new_timestamp")
    `);

    // Remove the new "new_timestamp" column
    await queryInterface.removeColumn("Locations", "new_timestamp");
  },
};
