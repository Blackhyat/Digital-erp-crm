import { loginSchema, registerSchema } from "./auth.validation.js";
import { loginUser, registerUser } from "./auth.service.js";
export const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const user = await registerUser(validation.data);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });
    }
    catch (error) {
        console.error("Register error:", error);
        const message = error instanceof Error ? error.message : "Registration failed";
        if (message === "User with this email already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};
export const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const result = await loginUser(validation.data);
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: result.user,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        const message = error instanceof Error ? error.message : "Login failed";
        if (message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};
export const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};
