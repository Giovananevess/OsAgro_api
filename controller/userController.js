const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

//helpers
const getUserByToken = require("../helpers/getUserByToken");
const createUserToken = require("../helpers/createUserToken");
const getToken = require("../helpers/getToken");
const { where } = require("sequelize");
const { imageUpload } = require("../helpers/imageUpload");

module.exports = class UserController {
  static async register(req, res) {
    try {
      const {
        name,
        email,
        phone,
        address,
        postal_code,
        password,
        confirmpassword,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !address ||
        !postal_code ||
        !password ||
        !confirmpassword
      ) {
        res.status(422).json({ message: "Todos os campos são obrigatórios" });
        return;
      }
      if (password !== confirmpassword) {
        res.status(422).json({ message: "As senhas não coincidem" });
        return;
      }

      const userExists = await User.findOne({ where: { email: email } });
      if (userExists) {
        res.status(422).json({ message: "Este e-mail já está em uso" });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // create user
      const newUser = await User.create({
        name: name,
        email: email,
        phone: phone,
        address: address,
        postal_code: postal_code,
        password: passwordHash,
      });

      console.log("Usuário registrado:", newUser);

      await createUserToken(newUser, req, res);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(422).json({ message: "E-mail e senha são obrigatórios!" });
      return;
    }

    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res
        .status(422)
        .json({ message: "Não há usuário cadastrado com este e-mail!" });
    }

    //check if password match db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(422).json({ message: "Senha inválida" });
    }
    await createUserToken(user, req, res);
  }

  static async checkUser(req, res) {
    let currentUser;

    console.log(req.headers.authorization);

    if (req.headers.authorization) {
      const token = getToken(req);
      try {
        const decoded = jwt.verify(token, "nossosecret");

        // Use findByPk to fetch the user by ID
        currentUser = await User.findByPk(decoded.id);

        if (currentUser) {
          // Remove the password from the user object before sending the response
          currentUser.password = undefined;
          console.log("Current User:", currentUser);
        } else {
          console.log("User not found");
        }
      } catch (err) {
        console.error("Error verifying token:", err);
        return res.status(401).send({ error: "Invalid token" });
      }
    } else {
      currentUser = null;
      console.log("No authorization header provided");
    }

    res.status(200).send(currentUser);
  }

  static async identifyUser(request, response) {
    try {
      const authHeader = request.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token == null) {
        return response.status(401).send("Token não fornecido.");
      }

      jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
        if (error) {
          console.error("Ocorreu um erro ao verificar o token:", error);
          return response.status(403).send("Token inválido.");
        }

        request.user = decoded;
        response.json(decoded);
      });
    } catch (error) {
      console.error("Ocorreu um erro:", error);
      return response.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async getUserById(req, res) {
    const id = req.params.id;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    res.status(200).json({ user });
  }

  static async editUser(req, res) {
    try {
      const id = req.params.id; // Obtenha o ID da URL da requisição
      const token = getToken(req);
      const user = await getUserByToken(token);

      console.log("ID da URL:", id);
      console.log("Usuário do Token:", user);

      // Garantir que o ID do usuário no token corresponda ao ID da URL ou que o usuário tenha permissões de administrador
      if (!user || user._id !== id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const {
        name,
        email,
        phone,
        address,
        postal_code,
        password,
        confirmpassword,
      } = req.body;

      if (req.file) {
        user.image = req.file.filename;
      }

      // Validações dos campos obrigatórios
      if (!name) {
        return res.status(422).json({ message: "O nome é obrigatório!" });
      }
      if (!email) {
        return res.status(422).json({ message: "O e-mail é obrigatório!" });
      }
      if (!phone) {
        return res.status(422).json({ message: "O telefone é obrigatório!" });
      }
      if (!address) {
        return res.status(422).json({ message: "O endereço é obrigatório!" });
      }
      if (!postal_code) {
        return res
          .status(422)
          .json({ message: "O código postal é obrigatório!" });
      }

      // Verifique se o e-mail já foi utilizado por outro usuário
      const userExists = await User.findOne({ email: email, _id: { $ne: id } });
      if (userExists) {
        return res
          .status(422)
          .json({ message: "E-mail em uso, por favor utilize outro!" });
      }

      // Atualizar os dados do usuário
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.address = address;
      user.postal_code = postal_code;

      // Verificação e atualização da senha, se necessário
      if (password && password !== "") {
        if (password !== confirmpassword) {
          return res.status(422).json({ message: "As senhas não conferem" });
        }
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        user.password = passwordHash;
      }

      // Salvar as atualizações no banco de dados
      const userToUpdate = await User.findByIdAndUpdate(
        id,
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          postal_code: user.postal_code,
          image: user.image,
          password: user.password,
        },
        { new: true }
      );

      if (!userToUpdate) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      userToUpdate.password = undefined; // Remover a senha do retorno da resposta

      res.json({
        message: "Usuário atualizado com sucesso!",
        data: userToUpdate,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

//   static async editUserId(req, res) {
//     try {
//       const id = req.params.id;
//       const { name, email, phone, address, postal_code, password, confirmpassword } =
//         req.body;

//       // Validações dos usuários
//       if (!name) {
//         return res.status(422).json({ message: "O nome é obrigatório!" });
//       }

//       if (!email) {
//         return res.status(422).json({ message: "O e-mail é obrigatório!" });
//       }

//       // Verifique se o e-mail já foi utilizado
//       const userExists = await User.findOne({ email: email });

//       if (userExists) {
//         return res
//           .status(422)
//           .json({ message: "E-mail em uso, por favor utilize outro!" });
//       }

//       if (!phone) {
//         return res.status(422).json({ message: "O telefone é obrigatório!" });
//       }

//       if (password !== confirmpassword) {
//         return res.status(422).json({ message: "As senhas não conferem" });
//       }

//       if (password && password !== "") {
//         // Crie uma nova senha
//         const salt = await bcrypt.genSalt(12);
//         const passwordHash = await bcrypt.hash(password, salt);

//         user.password = passwordHash;
//       }

//       const userToUpdate = await User.findByIdAndUpdate(
//         id,
//         {
//           name,
//           email,
//           phone,
//           address,
//           postal_code,
//           password: user.password,
//         },
//         { new: true }
//       );

//       if (!userToUpdate) {
//         return res.status(404).json({ message: "Usuário não encontrado" });
//       }

//       userToUpdate.password = undefined;

//       res.json({
//         message: "Usuário atualizado com sucesso!",
//         data: userToUpdate,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }

//   static async editUser(req, res) {
//     try {
//       const id = req.params.id; // Obtenha o ID da URL da requisição
//       const token = getToken(req);
//       const user = await getUserByToken(token);

//       const { name, email, phone, address, password, confirmpassword } =
//         req.body;

//       if (req.file) {
//         user.image = req.file.filename;
//       }

//       // Validações dos usuários
//       if (!name) {
//         return res.status(422).json({ message: "O nome é obrigatório!" });
//       }

//       if (!email) {
//         return res.status(422).json({ message: "O e-mail é obrigatório!" });
//       }

//       if (!phone) {
//         return res.status(422).json({ message: "O telefone é obrigatório!" });
//       }

//       // Verifique se o e-mail já foi utilizado
//       const userExists = await User.findOne({ email: email, _id: { $ne: id } });

//       if (!user || (user.email !== email && userExists)) {
//         return res
//           .status(422)
//           .json({ message: "E-mail em uso, por favor utilize outro!" });
//       }

//       user.email = email;
//       user.phone = phone;
//       user.address = address;

//       if (password && password !== "") {
//         if (password !== confirmpassword) {
//           return res.status(422).json({ message: "As senhas não conferem" });
//         }
//         // Crie uma nova senha
//         const salt = await bcrypt.genSalt(12);
//         const passwordHash = await bcrypt.hash(password, salt);

//         user.password = passwordHash;
//       }

//       const userToUpdate = await User.findByIdAndUpdate(
//         id,
//         {
//           name,
//           email: user.email,
//           phone: user.phone,
//           image: user.image,
//           password: user.password,
//         },
//         { new: true }
//       );

//       if (!userToUpdate) {
//         return res.status(404).json({ message: "Usuário não encontrado" });
//       }

//       userToUpdate.password = undefined;

//       res.json({
//         message: "Usuário atualizado com sucesso!",
//         data: userToUpdate,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// static async editUser(req, res) {
//   try {
//     const id = req.params.id; // Obtenha o ID da URL da requisição
//     const token = getToken(req);
//     const user = await getUserByToken(token);

//     const { name, email, phone, password, confirmpassword } = req.body;

//     if (req.file) {
//       user.image = req.file.filename;
//     }
//   if (req.file) {
//     user.image = req.file.filename;
//   }

//   // Validações dos usuários

//   if (!name) {
//     res.status(422).json({ message: "O nome é obrigatório!" });
//     return;
//   }

//   if (!email) {
//     res.status(422).json({ message: "O e-mail é obrigatório!" });
//     return;
//   }

//   // Verifique se o e-mail já foi utilizado
//   const userExists = await User.findOne({ where: { email: email } });

//   if (!user || (user.email !== email && userExists)) {
//     res
//       .status(422)
//       .json({ message: "E-mail em uso, por favor utilize outro!" });
//     return;
//   }

//   user.email = email;

//   if (!phone) {
//     res.status(422).json({ message: "O telefone é obrigatório!" });
//     return;
//   }

//   user.phone = phone;

//   if (password != confirmpassword) {
//     res.status(422).json({ message: "As senhas não conferem" });
//     return;
//   } else if (password === confirmpassword && password != null) {
//     // Crie uma nova senha
//     const salt = await bcrypt.genSalt(12);
//     const passwordHash = await bcrypt.hash(password, salt);

//     user.password = passwordHash;
//   }

//   console.log(user);

//   try {
//     const userToUpdate = await User.findByPk(id); // Encontre o usuário com base no ID

//     if (!userToUpdate) {
//       return res.status(404).json({ message: "Usuário não encontrado" });
//     }

//     // Atualize o usuário com os novos dados
//     await userToUpdate.update({
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       image: user.image,
//       password: user.password,
//     });

//     userToUpdate.password = undefined;

//     res.json({
//       message: "Usuário atualizado com sucesso!",
//       data: userToUpdate,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }
