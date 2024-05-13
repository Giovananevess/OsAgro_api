const Order = require("../models/Order");
const User = require("../models/User");
const imageUpload = require("../helpers/imageUpload");

const getUserByToken = require("../helpers/getUserByToken");
const getToken = require("../helpers/getToken");

module.exports = class OrderController {
  static async create(req, res) {
    try {
      const { title, description, priority, brand, daymaintenance, machine } =
        req.body;
      const images = req.files;

      // Validations
      if (
        !title ||
        !description ||
        !priority ||
        !brand ||
        !daymaintenance ||
        !machine
        // !images ||
        // images.length === 0
      ) {
        return res.status(422).json({
          message: "Todos os campos são obrigatórios, incluindo a imagem!",
        });
      }
      const token = getToken(req);
      const user = await getUserByToken(token);

      // if (!user) {
      //   return res.status(401).json({
      //     message: "Usuário não autorizado",
      //   });
      // }

      const order = new Order({
        title,
        description,
        priority,
        brand,
        machine,
        daymaintenance,
        images: images.map((image) => image.filename),
        userId: user.id,
        // user: {
        //   id: user.id,
        //   email: user.email,
        // },
      });

      const newOrder = await order.save();

      // Inclua o usuário na resposta
      newOrder.user = user;

      res.status(201).json({
        message: "Ordem cadastrada com sucesso!",
        newOrder: newOrder,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }
  // get all orders
  static async getAll(req, res) {
    try {
      const orders = await Order.findAll({ order: [["createdAt", "DESC"]] });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  // get all user orders
  static async getAllUserOrders(req, res) {
    try {
      // get user
      const token = getToken(req);
      const user = await getUserByToken(token);

      const orders = await Order.findAll({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const orderId = req.params.id;
      const order = await Order.findByPk(orderId);

      if (!order) {
        return res.status(404).json({ message: "Ordem não encontrada" });
      }

      res.status(200).json({ order });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  // delete order
  static async deleteOrder(req, res) {
    try {
      const orderId = req.params.id;

      // Verificar se o ID é um número válido
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID de ordem inválido" });
      }

      const order = await Order.findByPk(orderId);

      // Verificar se a ordem existe
      if (!order) {
        return res.status(404).json({ message: "Ordem não encontrada" });
      }

      // Verificar se o usuário tem permissão para excluir a ordem
      const token = getToken(req);
      const user = await getUserByToken(token);
      if (!user || user.id.toString() !== order.userId.toString()) {
        return res
          .status(403)
          .json({ message: "Você não tem permissão para excluir esta ordem" });
      }
      await order.destroy();

      res.status(200).json({ message: "Ordem excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  static async updateOrder(req, res) {
    try {
      const orderId = req.params.id;
      const { title, description, priority, brand, daymaintenance, machine } =
        req.body;
      const images = req.files;

      // Verificar se o ID é um número válido
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID de ordem inválido" });
      }

      let order = await Order.findByPk(orderId);

      // Verificar se a ordem existe
      if (!order) {
        return res.status(404).json({ message: "Ordem não encontrada" });
      }

      // Verificar se o usuário tem permissão para atualizar a ordem
      const token = getToken(req);
      const user = await getUserByToken(token);
      if (!user || user.id !== order.userId) {
        return res.status(403).json({
          message: "Você não tem permissão para atualizar esta ordem",
        });
      }

      // Atualizar os campos da ordem
      order.title = title || order.title;
      order.description = description || order.description;
      order.priority = priority || order.priority;
      order.brand = brand || order.brand;
      order.machine = machine || order.machine;
      order.daymaintenance = daymaintenance || order.daymaintenance;
      if (images && images.length > 0) {
        order.images = images.map((image) => image.filename);
      }

      // Salvar a ordem atualizada
      order = await order.save();

      res.status(200).json({ message: "Ordem atualizada com sucesso", order });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  static async schedule(req, res) {
    try {
      const orderId = req.params.id;

      // Verificar se a ordem existe
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Ordem não encontrada" });
      }

      // Verificar se o usuário é o dono da ordem
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (order.userId !== user.id) {
        return res.status(401).json({
          message: "Você não tem permissão para agendar sua própria ordem",
        });
      }

      // Verificar se a ordem já foi agendada para visita
      if (order.scheduled) {
        return res.status(422).json({
          message: "Esta ordem já foi agendada para visita técnica",
        });
      }

      // add user to order
      order.user = {
        id: user.id,
        name: user.name,
        image: user.image,
      };
      // Atualize o estado da ordem
      order.scheduled = true;

      // Salve a ordem atualizada
      await order.save();

      res.status(200).json({
        message:
          "Visita agendada com sucesso ${order.user.name} pelo telefone ${order.user.phone}",
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }

  static async concludeOrder(req, res) {
    try {
      const orderId = req.params.id;
      const order = await Order.findByPk(orderId, { include: "user" });

      if (!order) {
        return res.status(404).json({ message: "Ordem não encontrada" });
      }

      const token = getToken(req);
      const user = await getUserByToken(token);

      if (order.user.id !== user.id) {
        return res
          .status(422)
          .json({ message: "Houve um problema em processar sua solicitação" });
      }

      order.available = false;

      await order.findByIdAndUpdate(order.user.id);

      res.status(200).json({ message: "Ordem concluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno", error: error.message });
    }
  }
};
