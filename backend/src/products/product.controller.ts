import type { Request, Response } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  products,
  stockMovements,
} from "../db/schema.js";
import {
  productSchema,
  updateProductSchema,
  stockMovementSchema,
} from "./product.validation.js";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = productSchema.parse(req.body);

    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice.toString(),
        currentStock: data.currentStock,
        minimumStock: data.minimumStock,
        warehouseLocation: data.warehouseLocation,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: "Invalid product data",
      error: error instanceof Error ? error.message : undefined,
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.category, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(ilike(products.category, `%${category}%`));
    }

    const productList = await db
      .select()
      .from(products)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      page,
      limit,
      count: productList.length,
      products: productList,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const data = updateProductSchema.parse(req.body);

    const [product] = await db
      .update(products)
      .set({
        ...data,
        unitPrice:
          data.unitPrice !== undefined
            ? data.unitPrice.toString()
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: "Invalid product data",
      error: error instanceof Error ? error.message : undefined,
    });
  }
};

export const addStockMovement = async (
  req: Request,
  res: Response
) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const data = stockMovementSchema.parse(req.body);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      data.movementType === "OUT" &&
      product.currentStock < data.quantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        currentStock: product.currentStock,
        requestedQuantity: data.quantity,
      });
    }

    const newStock =
      data.movementType === "IN"
        ? product.currentStock + data.quantity
        : product.currentStock - data.quantity;

    const [updatedProduct] = await db
      .update(products)
      .set({
        currentStock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    const [movement] = await db
      .insert(stockMovements)
      .values({
        productId,
        quantity: data.quantity,
        movementType: data.movementType,
        reason: data.reason,
        createdBy: 1,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: `Stock ${data.movementType === "IN" ? "added" : "removed"} successfully`,
      product: updatedProduct,
      movement,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: "Invalid stock movement",
      error: error instanceof Error ? error.message : undefined,
    });
  }
};