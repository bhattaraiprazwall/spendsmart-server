import { IRouter, Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {registerUserSchema } from "../validators/auth.validator.js";
import { register } from "../controllers/auth.controller.js";


const router:IRouter = Router();

//Public routes 
router.post("/register", validate(registerUserSchema), register);

export default router;

