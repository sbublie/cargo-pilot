const sequelize = require("./db");
const { DataTypes } = require("sequelize");

const Location = sequelize.define("Location", {
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      notNull: { args: true, msg: "You must enter a name" },
    },
  },
  long: { type: DataTypes.FLOAT, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.INTEGER, allowNull: false },
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const Cluster = sequelize.define("Cluster", {
  center_lat: { type: DataTypes.FLOAT, allowNull: false },
  center_long: { type: DataTypes.FLOAT, allowNull: false },
  location_ids: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
});

const Trip = sequelize.define("Trip", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  destination_id: { type: DataTypes.INTEGER, allowNull: false },
  origin_id: { type: DataTypes.INTEGER, allowNull: false },
  source: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = {
  Location,
  Cluster,
  Trip,
};
