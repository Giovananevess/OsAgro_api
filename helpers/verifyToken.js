const jwt = require("jsonwebtoken");
const getToken = require("./getToken");

const checkToken = (req, res, next) => {
  console.log(req.headers);

  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Acesso negado" });
  }
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: "Acesso negado" });
  }

  try {
    const verified = jwt.verify(token, "nossosecret");
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Token inválido" });
  }
};

module.exports = checkToken;

// const jwt = require("jsonwebtoken");
// const getToken = require("./getToken");

// const checkToken = (req, res, next) => {
//   console.log(req.headers);
//   console.log("Token:", token);
//   console.log("Headers:", req.headers);

//   if (!req.headers.authorization) {
//     return res.status(401).json({ message: "Acesso negado" });
//   }

//   let token = getToken(req); // Move a declaração da variável token para antes de chamá-la

//   if (!token) {
//     return res.status(401).json({ message: "Acesso negado" });
//   }

//   try {
//     const verified = jwt.verify(token, "nossosecret");
//     req.user = verified;
//     next();
//   } catch (err) {
//     return res.status(400).json({ message: "Token inválido" });
//   }

//   console.log("Headers:", req.headers);
//   console.log("Token:", token);
// };

// module.exports = checkToken;
