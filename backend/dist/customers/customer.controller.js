import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/db.js";
import { customers } from "../db/schema.js";
import { customerSchema, updateCustomerSchema, } from "./customer.validation.js";
export const createCustomer = async (req, res) => {
    try {
        const data = customerSchema.parse(req.body);
        const [customer] = await db
            .insert(customers)
            .values({
            customerName: data.customerName,
            mobile: data.mobile,
            email: data.email || null,
            businessName: data.businessName,
            gstNumber: data.gstNumber || null,
            customerType: data.customerType,
            address: data.address,
            status: data.status,
            followUpDate: data.followUpDate || null,
            notes: data.notes || null,
        })
            .returning();
        return res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customer,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: "Invalid customer data",
            error: error instanceof Error ? error.message : undefined,
        });
    }
};
export const getCustomers = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const search = String(req.query.search || "").trim();
        const status = String(req.query.status || "").trim();
        const offset = (page - 1) * limit;
        const conditions = [];
        if (search) {
            conditions.push(or(ilike(customers.customerName, `%${search}%`), ilike(customers.mobile, `%${search}%`), ilike(customers.businessName, `%${search}%`), ilike(customers.email, `%${search}%`)));
        }
        if (status === "LEAD" ||
            status === "ACTIVE" ||
            status === "INACTIVE") {
            conditions.push(eq(customers.status, status));
        }
        const customerList = await db
            .select()
            .from(customers)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(customers.createdAt))
            .limit(limit)
            .offset(offset);
        return res.status(200).json({
            success: true,
            page,
            limit,
            count: customerList.length,
            customers: customerList,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
};
export const getCustomerById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }
        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, id));
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        return res.status(200).json({
            success: true,
            customer,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer",
        });
    }
};
export const updateCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }
        const data = updateCustomerSchema.parse(req.body);
        const [customer] = await db
            .update(customers)
            .set({
            ...data,
            email: data.email || null,
            gstNumber: data.gstNumber || null,
            followUpDate: data.followUpDate || null,
            notes: data.notes || null,
            updatedAt: new Date(),
        })
            .where(eq(customers.id, id))
            .returning();
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: "Invalid customer data",
            error: error instanceof Error ? error.message : undefined,
        });
    }
};
export const deleteCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }
        const [customer] = await db
            .delete(customers)
            .where(eq(customers.id, id))
            .returning();
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete customer",
        });
    }
};
