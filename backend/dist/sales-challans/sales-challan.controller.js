import { db } from "../db/db.js";
import { products, salesChallans, salesChallanItems, customers, stockMovements, } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { createSalesChallanSchema, updateSalesChallanStatusSchema, } from "./sales-challan.validation.js";
export const createSalesChallan = async (req, res) => {
    try {
        const validation = createSalesChallanSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.error.flatten(),
            });
        }
        const { customerId, items } = validation.data;
        // Check customer
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);
        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        const productIds = items.map((item) => item.productId);
        const productList = await db.select().from(products);
        const selectedProducts = productList.filter((product) => productIds.includes(product.id));
        if (selectedProducts.length !== productIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more products not found",
            });
        }
        // Check stock
        for (const item of items) {
            const product = selectedProducts.find((p) => p.id === item.productId);
            if (!product)
                continue;
            if (item.quantity > product.currentStock) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`,
                    availableStock: product.currentStock,
                    requestedQuantity: item.quantity,
                });
            }
        }
        // Generate challan number
        const challanNumber = `CH-${Date.now()}`;
        const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
        const createdBy = req.user?.id ?? 1;
        const [challan] = await db
            .insert(salesChallans)
            .values({
            challanNumber,
            customerId,
            totalQuantity,
            status: "DRAFT",
            createdBy,
        })
            .returning();
        // Save product snapshot
        for (const item of items) {
            const product = selectedProducts.find((p) => p.id === item.productId);
            if (!product)
                continue;
            const unitPrice = Number(product.unitPrice);
            const totalPrice = unitPrice * item.quantity;
            await db.insert(salesChallanItems).values({
                challanId: challan.id,
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                unitPrice: product.unitPrice,
                quantity: item.quantity,
                totalPrice: totalPrice.toFixed(2),
            });
        }
        return res.status(201).json({
            success: true,
            message: "Sales challan created successfully",
            challan,
        });
    }
    catch (error) {
        console.error("Create challan error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create sales challan",
        });
    }
};
export const getSalesChallans = async (req, res) => {
    try {
        const result = await db
            .select()
            .from(salesChallans)
            .orderBy(desc(salesChallans.createdAt));
        return res.status(200).json({
            success: true,
            challans: result,
        });
    }
    catch (error) {
        console.error("Get challans error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sales challans",
        });
    }
};
export const updateSalesChallanStatus = async (req, res) => {
    try {
        const challanId = Number(req.params.id);
        if (!Number.isInteger(challanId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid challan ID",
            });
        }
        const validation = updateSalesChallanStatusSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }
        const { status } = validation.data;
        // Find challan
        const existing = await db
            .select()
            .from(salesChallans)
            .where(eq(salesChallans.id, challanId))
            .limit(1);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sales challan not found",
            });
        }
        const challan = existing[0];
        // Only draft challans can be changed
        if (challan.status !== "DRAFT") {
            return res.status(400).json({
                success: false,
                message: "Only draft challans can be updated",
            });
        }
        // Get challan items
        const items = await db
            .select()
            .from(salesChallanItems)
            .where(eq(salesChallanItems.challanId, challanId));
        // CONFIRM CHALLAN
        if (status === "CONFIRMED") {
            // Check stock again before confirmation
            for (const item of items) {
                const productResult = await db
                    .select()
                    .from(products)
                    .where(eq(products.id, item.productId))
                    .limit(1);
                if (productResult.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: `Product not found: ${item.productName}`,
                    });
                }
                const product = productResult[0];
                if (item.quantity > product.currentStock) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name}`,
                        availableStock: product.currentStock,
                        requestedQuantity: item.quantity,
                    });
                }
            }
            const createdBy = req.user?.id ?? 1;
            // Reduce stock and create OUT movement
            for (const item of items) {
                const productResult = await db
                    .select()
                    .from(products)
                    .where(eq(products.id, item.productId))
                    .limit(1);
                if (productResult.length === 0)
                    continue;
                const product = productResult[0];
                const newStock = product.currentStock - item.quantity;
                // Update product stock
                await db
                    .update(products)
                    .set({
                    currentStock: newStock,
                    updatedAt: new Date(),
                })
                    .where(eq(products.id, product.id));
                // Create stock movement
                await db.insert(stockMovements).values({
                    productId: product.id,
                    quantity: item.quantity,
                    movementType: "OUT",
                    reason: `Sales challan ${challan.challanNumber}`,
                    createdBy,
                });
            }
        }
        // Update challan status
        const [updated] = await db
            .update(salesChallans)
            .set({
            status,
            updatedAt: new Date(),
        })
            .where(eq(salesChallans.id, challanId))
            .returning();
        return res.status(200).json({
            success: true,
            message: `Sales challan ${status.toLowerCase()} successfully`,
            challan: updated,
        });
    }
    catch (error) {
        console.error("Update challan error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update sales challan",
        });
    }
};
