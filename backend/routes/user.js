import express from "express";
import { 
  createUser, 
  getAllUser, 
  getUserById, 
  updateUser, 
  deleteUser, 
  register, 
  login, 
  countUserByRole
} from "../controllers/user.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes (tidak perlu authentication)
router.post("/register",verifyToken, register);
router.post("/login", login);

// Protected routes (perlu authentication)
router.get("/count-role", verifyToken, countUserByRole);
router.get("/", verifyToken, getAllUser);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, createUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

export default router; 