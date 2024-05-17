const Sequelize = require("sequelize");
const DataTypes = Sequelize.DataTypes;
const db = require("./db");

const User = require("./User");
const imageUpload = require("../helpers/imageUpload");

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
  images: {
    type: DataTypes.BLOB,
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

Order.searchByName = async function (name) {
  try {
    const orders = await Order.findAll({
      where: {
        title: {
          [Op.iLike]: `%${title}%`,
        },
      },
      include: [{ model: Order, as: "order" }],
    });
    return orders;
  } catch (error) {
    console.error("Erro ao buscar pedidos por nome:", error);
    throw error;
  }
};
// Define o relacionamento entre Order e User
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Order.sync({ alter: true });

module.exports = Order;
