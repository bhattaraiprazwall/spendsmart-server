import { IRouter, Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {loginUserSchema, registerUserSchema } from "../validators/auth.validator.js";
import { register,login, changePass } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router:IRouter = Router();

//Public routes 
router.post("/register", validate(registerUserSchema), register);
router.post("/login",validate(loginUserSchema),login);
router.post("/change-password",authMiddleware,changePass);

export default router;

