import { Router } from "express";
import { register, login, logout, } from "./auth.controller.js";
import { getUsers } from "./users.controller.js";
import { authenticate, authorize, } from "../middleware/auth.middleware.js";
import { authorizeRoles, } from "../middleware/role.middleware.js";
const router = Router();
/* =========================
   PUBLIC AUTH
========================= */
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
/* =========================
   CURRENT USER
   ALL AUTHENTICATED ROLES
========================= */
router.get("/me", authenticate, (req, res) => {
    return res.json({
        success: true,
        message: "Authenticated user",
        user: req.user,
    });
});
/* =========================
   ADMIN TEST
   ADMIN ONLY
========================= */
router.get("/admin-test", authenticate, authorize("ADMIN"), (req, res) => {
    return res.json({
        success: true,
        message: "Admin access granted",
        user: req.user,
    });
});
/* =========================
   USERS
   ADMIN ONLY
========================= */
router.get("/users", authenticate, authorizeRoles("ADMIN"), getUsers);
export default router;
