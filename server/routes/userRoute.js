import express from "express";
import path from "path";
import {

  verifyEmail,
} from "../controllers/userController.js";
import userAuth from "../middleware/authMiddleware.js";

const router = express.Router();
const __dirname = path.resolve(path.dirname(""));

router.get("/verify/:userId/:token", verifyEmail);
// PASSWORD RESET


router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build", "index.html"));
});


export default router;
