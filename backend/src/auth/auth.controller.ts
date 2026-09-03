import type { Request, Response } from "express";
import {
  loginUser,
  registerUser,
} from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
} from "./auth.validation.js";

/* =========================
   REGISTER
========================= */

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: result.error.flatten(),
      });
    }

    const user = await registerUser(result.data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error: any) {
    console.error("Register error:", error);

    return res.status(400).json({
      success: false,
      message:
        error?.message || "Registration failed",
    });
  }
};

/* =========================
   LOGIN
========================= */

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: result.error.flatten(),
      });
    }

    const { user, token } = await loginUser(result.data);

    /*
     * Production:
     * Frontend = Vercel
     * Backend = Render
     *
     * Therefore the cookie must work
     * across these HTTPS domains.
     */

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error: any) {
    console.error("Login error:", error);

    return res.status(401).json({
      success: false,
      message:
        error?.message || "Invalid email or password",
    });
  }
};

/* =========================
   LOGOUT
========================= */

export const logout = (
  _req: Request,
  res: Response
) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};