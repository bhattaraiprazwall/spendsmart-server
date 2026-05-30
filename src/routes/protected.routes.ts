import express from "express";

import { firebaseAuth } from "../middleware/firebaseAuth";

import { authorizeRoles } from "../middleware/authorizeRoles";

const router = express.Router();

router.get(
  "/admin",

  firebaseAuth,

  authorizeRoles("ADMIN"),

  (req, res) => {
    res.json({
      message: "Welcome Admin",
      user: req.dbUser,
    });
  },
);

router.get(
  "/user",

  firebaseAuth,

  authorizeRoles("USER", "ADMIN", "MODERATOR"),

  (req, res) => {
    res.json({
      message: "Welcome User",
      user: req.dbUser,
    });
  },
);

export default router;
