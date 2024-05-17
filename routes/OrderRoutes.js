const router = require("express").Router();

const OrderController = require("../controller/orderController");

// middleware
const verifyToken = require("../helpers/verifyToken");
const imageUpload = require("../helpers/imageUpload");

router.post(
  "/create",
  verifyToken,
  imageUpload.array("images"),
  OrderController.create
);
router.get("/", OrderController.getAll);
router.get("/myorders", verifyToken, OrderController.getAllUserOrders);
router.get("/:id", OrderController.getOrderById);
router.delete("/:id", verifyToken, OrderController.deleteOrder);
router.patch(
  "/:id",
  verifyToken,
  imageUpload.array("images"),
  OrderController.updateOrder
);
router.patch("/schedule/:id", verifyToken, OrderController.schedule);
router.patch("/conclude/:id", verifyToken, OrderController.concludeOrder);
router.get("/search", OrderController.searchByName);

module.exports = router;
