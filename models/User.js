const Sequelize = require("sequelize");
const DataTypes = Sequelize.DataTypes;
const db = require("./db");

const User = db.define("users", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("Administrator", "User"),
    allowNull: true,
  },
  image: {
    type: DataTypes.JSON,
  },
});

// Define o modelo Order
// const Order = db.define("orders", {});

// Define a relação de chave estrangeira entre Order e User
// Order.belongsTo(User, { foreignKey: "userId" });

// Sincroniza as tabelas
// db.sync()
//   .then(() => {
//     console.log("Tabelas sincronizadas com sucesso.");
//   })
//   .catch((error) => {
//     console.error("Erro ao sincronizar as tabelas:", error);
//   });

module.exports = User;
