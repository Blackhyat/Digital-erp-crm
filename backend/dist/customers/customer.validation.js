import { z } from "zod";
export const customerSchema = z.object({
    customerName: z.string().min(2).max(150),
    mobile: z.string().min(10).max(20),
    email: z.string().email().optional().or(z.literal("")),
    businessName: z.string().min(2).max(150),
    gstNumber: z.string().max(20).optional().or(z.literal("")),
    customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
    address: z.string().min(2),
    status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
    followUpDate: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
});
export const updateCustomerSchema = customerSchema.partial();
