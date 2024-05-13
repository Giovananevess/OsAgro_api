const Sequelize = require("sequelize");

const sequelize = new Sequelize("agro_maintenance", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

sequelize
  .authenticate()
  .then(function () {
    console.log("deu certo ao conectar com o mysql");
  })
  .catch(function () {
    console.log("erro ao conectar com o mysql");
  });

module.exports = sequelize;
