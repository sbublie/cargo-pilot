const { Sequelize } = require("sequelize");

// Replace with your PostgreSQL database credentials
const sequelize = new Sequelize("cargo_database", "pguser", "pdb&3Xif", {
  host: "cp-postgres",
  dialect: "postgres",
  define: {
    timestamps: false,
  },
});

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

// Export the Sequelize instance
module.exports = sequelize;
