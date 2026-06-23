import { IRouter, Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {loginUserSchema, registerUserSchema } from "../validators/auth.validator.js";
import { register,login } from "../controllers/auth.controller.js";


const router:IRouter = Router();

//Public routes 
router.post("/register", validate(registerUserSchema), register);
router.post("/login",validate(loginUserSchema),login);

export default router;

