const jwt = require("jsonwebtoken");
const User = require("../models/User");

// get user by jwt token
const getUserByToken = async (token) => {
  try {
    if (!token) throw new Error("Acesso negado!");

    // find user
    const decoded = jwt.verify(token, "nossosecret");

    const userId = decoded.id;

    // const user = await User.findById(userId);

    const user = await User.findOne({ id: userId });

    return user;
  } catch (error) {
    throw new Error("Token inválido");
  }
};

module.exports = getUserByToken;
