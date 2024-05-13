const Sequelize = require("sequelize");
const DataTypes = Sequelize.DataTypes;
const db = require("./db");

const User = require("./User");

const Order = db.define("orders", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  brand: {
    type: DataTypes.ENUM("BRAND1", "BRAND2", "BRAND3"),
    allowNull: false,
  },
  machine: {
    type: DataTypes.ENUM("MACHINE1", "MACHINE2", "MACHINE3"),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
    allowNull: false,
  },
  daymaintenance: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Define o relacionamento com User
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
  },
});

// Define o relacionamento entre Order e User
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Order.sync({ alter: true });

module.exports = Order;
