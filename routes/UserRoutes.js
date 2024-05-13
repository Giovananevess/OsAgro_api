const UserController = require("../controller/userController");
const router = require("express").Router();

// middleware
const verifyToken = require("../helpers/verifyToken");
const imageUpload = require("../helpers/imageUpload");

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/checkuser", UserController.checkUser);
router.get("/:id", UserController.getUserById);
router.patch(
  "/edit/:id",
  verifyToken,
  imageUpload.single("image"),
  UserController.editUser
);
router.patch("/edit/:id");
router.post("/identify", UserController.identifyUser);

module.exports = router;
