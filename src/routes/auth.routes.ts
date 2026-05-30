import express from "express";

import { syncUser } from "../controllers/auth.controller";

import { firebaseAuth } from "../middleware/firebaseAuth";

const router = express.Router();

router.post("/sync-user", firebaseAuth, syncUser);

export default router;
