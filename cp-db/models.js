const sequelize = require("./db");
const { DataTypes } = require("sequelize");

const Location = sequelize.define("Location", {
  lat: { type: DataTypes.FLOAT, allowNull: true },
  long: { type: DataTypes.FLOAT, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.INTEGER, allowNull: true },
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  zip_code: { type: DataTypes.INTEGER, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  street: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
});

const Cluster = sequelize.define("Cluster", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  center_lat: { type: DataTypes.FLOAT, allowNull: true },
  center_long: { type: DataTypes.FLOAT, allowNull: true },
  location_ids: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
});

const Trip = sequelize.define("Trip", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer: { type: DataTypes.STRING, allowNull: true },
  destination_id: { type: DataTypes.INTEGER, allowNull: false },
  origin_id: { type: DataTypes.INTEGER, allowNull: false },
  source: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  vehicle: { type: DataTypes.STRING, allowNull: true },
  load_percentage: { type: DataTypes.FLOAT, allowNull: true },
  load_meter: { type: DataTypes.FLOAT, allowNull: true },
  load_weight: { type: DataTypes.FLOAT, allowNull: true },
});

const Offering = sequelize.define("Offering", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer: { type: DataTypes.STRING, allowNull: true },
  destination_id: { type: DataTypes.INTEGER, allowNull: false },
  origin_id: { type: DataTypes.INTEGER, allowNull: false },
  source: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  vehicle: { type: DataTypes.STRING, allowNull: true },
  load_percentage: { type: DataTypes.FLOAT, allowNull: true },
  load_meter: { type: DataTypes.FLOAT, allowNull: true },
  load_weight: { type: DataTypes.FLOAT, allowNull: true },
});

const TripPattern = sequelize.define("TripPattern", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detectedPattern: { type: DataTypes.STRING, allowNull: false },
  relatedTripIds: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
})

const TripMatch = sequelize.define("TripMatch", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  relatedTripPatternId: { type: DataTypes.INTEGER, allowNull: false },
  relatedOfferings: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
})

module.exports = {
  Location,
  Cluster,
  Trip,
  Offering,
  TripPattern,
  TripMatch
};
