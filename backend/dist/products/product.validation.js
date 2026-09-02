import { z } from "zod";
export const productSchema = z.object({
    name: z.string().min(2).max(150),
    sku: z.string().min(2).max(100),
    category: z.string().min(2).max(100),
    unitPrice: z.coerce.number().positive(),
    currentStock: z.coerce.number().int().min(0).default(0),
    minimumStock: z.coerce.number().int().min(0).default(0),
    warehouseLocation: z.string().min(1).max(150),
});
export const updateProductSchema = productSchema.partial();
export const stockMovementSchema = z.object({
    quantity: z.coerce.number().int().positive(),
    movementType: z.enum(["IN", "OUT"]),
    reason: z.string().min(2).max(255),
});
