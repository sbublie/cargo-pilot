const sequelize = require("./db");
const { DataTypes } = require("sequelize");

const Location = sequelize.define(
  "Location",
  {
    timestamp: { type: DataTypes.INTEGER, allowNull: false },
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  },
  {
    underscored: true,
  }
);

const CargoOrder = sequelize.define(
  "CargoOrder",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    data_source: { type: DataTypes.STRING, allowNull: false },
    customer: { type: DataTypes.STRING, allowNull: true },
  },
  {
    underscored: true,
  }
);

const GeoLocation = sequelize.define(
  "GeoLocation",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    long: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    underscored: true,
  }
);

const AdminLocation = sequelize.define(
  "AdminLocation",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    postal_code: { type: DataTypes.INTEGER, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
    street: { type: DataTypes.STRING, allowNull: true },
  },
  {
    underscored: true,
  }
);

const CargoItem = sequelize.define("CargoItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loading_meter: { type: DataTypes.FLOAT, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  load_carrier: { type: DataTypes.BOOLEAN, allowNull: false },
  load_carrier_nestable: { type: DataTypes.BOOLEAN, allowNull: false },
},
{
  underscored: true,
});

Location.belongsTo(AdminLocation, {
  as: "admin_location",
});
Location.belongsTo(GeoLocation, {
  as: "geo_location",
});

CargoOrder.belongsTo(CargoItem, {
  as: "cargo_item",
});
CargoOrder.belongsTo(Location, {
  as: "destination",
});
CargoOrder.belongsTo(Location, {
  as: "origin",
});


const Vehicle = sequelize.define("Vehicle", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.STRING, allowNull: false },
  stackable: { type: DataTypes.BOOLEAN, allowNull: false },
  max_load_meter: { type: DataTypes.FLOAT, allowNull: false },
  max_weight: { type: DataTypes.FLOAT, allowNull: false },
},
{
  underscored: true,
});

const CompletedTrip = sequelize.define("CompletedTrip", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer: { type: DataTypes.STRING, allowNull: false },
  data_source: { type: DataTypes.STRING, allowNull: false },
},
{
  underscored: true,
});

CompletedTrip.belongsTo(Location, {
  as: "destination",
});
CompletedTrip.belongsTo(Location, {
  as: "origin",
});
CompletedTrip.belongsTo(CargoItem, {
  as: "cargo_item",
});
CompletedTrip.belongsTo(Vehicle, {
  as: "vehicle",
});

// ----

const LocationOld = sequelize.define("LocationOld", {
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
  destination_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: "id",
    },
  },
  origin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: "id",
    },
  },
  source: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  vehicle: { type: DataTypes.STRING, allowNull: true },
  load_percentage: { type: DataTypes.FLOAT, allowNull: true },
  load_meter: { type: DataTypes.FLOAT, allowNull: true },
  load_weight: { type: DataTypes.FLOAT, allowNull: true },
});

Trip.belongsTo(Location, { foreignKey: "destination_id", as: "destination" });
Trip.belongsTo(Location, { foreignKey: "origin_id", as: "origin" });

const Offering = sequelize.define("Offering", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer: { type: DataTypes.STRING, allowNull: true },
  destination_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: "id",
    },
  },
  origin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: "id",
    },
  },
  source: { type: DataTypes.STRING, allowNull: false },
  vehicle: { type: DataTypes.STRING, allowNull: true },
  load_percentage: { type: DataTypes.FLOAT, allowNull: true },
  load_meter: { type: DataTypes.FLOAT, allowNull: true },
  load_weight: { type: DataTypes.FLOAT, allowNull: true },
});

Offering.belongsTo(Location, {
  foreignKey: "destination_id",
  as: "destination",
});
Offering.belongsTo(Location, { foreignKey: "origin_id", as: "origin" });

const TripPattern = sequelize.define("TripPattern", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detectedPattern: { type: DataTypes.STRING, allowNull: false },
  relatedTripIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  },
});

const TripMatch = sequelize.define("TripMatch", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  relatedTripPatternId: { type: DataTypes.INTEGER, allowNull: false },
  relatedOfferings: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  },
});

module.exports = {
  CargoOrder,
  LocationOld,
  Cluster,
  Trip,
  Offering,
  TripPattern,
  TripMatch,
  GeoLocation,
  AdminLocation,
  CargoItem,
  Location,
  CompletedTrip,
  Vehicle
};
