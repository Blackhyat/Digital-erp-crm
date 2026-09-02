import { z } from "zod";

export const createSalesChallanSchema = z.object({
  customerId: z.number().int().positive(),

  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one product is required"),
});

export const updateSalesChallanStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

export type CreateSalesChallanInput = z.infer<
  typeof createSalesChallanSchema
>;

export type UpdateSalesChallanStatusInput = z.infer<
  typeof updateSalesChallanStatusSchema
>;