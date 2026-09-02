import { z } from "zod";
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    email: z
        .string()
        .email("Please provide a valid email address")
        .max(255, "Email must not exceed 255 characters"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters"),
});
export const loginSchema = z.object({
    email: z
        .string()
        .email("Please provide a valid email address"),
    password: z
        .string()
        .min(1, "Password is required"),
});
