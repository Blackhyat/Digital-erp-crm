import { db } from "../db/db.js";
import { users } from "../db/schema.js";
export const getUsers = async (_req, res) => {
    try {
        const result = await db
            .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
        })
            .from(users);
        return res.status(200).json({
            success: true,
            users: result,
        });
    }
    catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load users",
        });
    }
};
