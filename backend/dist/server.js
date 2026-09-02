import express from "express";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import { db } from "./db/db.js";
import { sql } from "drizzle-orm";
import authRoutes from "./auth/auth.routes.js";
import customerRoutes from "./customers/customer.routes.js";
import productRoutes from "./products/product.routes.js";
import salesChallanRoutes from "./sales-challans/sales-challan.routes.js";
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
const PORT = Number(process.env.PORT) || 5000;
/* =========================
   CORS
========================= */
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(cookieParser());
/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales-challans", salesChallanRoutes);
/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Mini ERP CRM API is running",
    });
});
/* =========================
   DATABASE TEST
========================= */
app.get("/db-test", async (req, res) => {
    try {
        const result = await db.execute(sql `SELECT 1`);
        res.json({
            success: true,
            message: "Database connected successfully",
            result,
        });
    }
    catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});
/* =========================
   SERVER
========================= */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
