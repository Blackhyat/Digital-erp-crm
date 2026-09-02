import type { NextFunction, Request, Response } from "express";

export type AppRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export const authorizeRoles = (...allowedRoles: AppRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(user.role as AppRole)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
};