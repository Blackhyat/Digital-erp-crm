CREATE TYPE "public"."challan_status" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('LEAD', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('RETAIL', 'WHOLESALE', 'DISTRIBUTOR');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('IN', 'OUT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS');--> statement-breakpoint
CREATE TABLE "customer_followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"note" text NOT NULL,
	"follow_up_date" date,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(150) NOT NULL,
	"mobile" varchar(20) NOT NULL,
	"email" varchar(255),
	"business_name" varchar(150) NOT NULL,
	"gst_number" varchar(20),
	"customer_type" "customer_type" NOT NULL,
	"address" text NOT NULL,
	"status" "customer_status" DEFAULT 'LEAD' NOT NULL,
	"follow_up_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"warehouse_location" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sales_challan_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"challan_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" varchar(150) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"total_price" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_challans" (
	"id" serial PRIMARY KEY NOT NULL,
	"challan_number" varchar(50) NOT NULL,
	"customer_id" integer NOT NULL,
	"total_quantity" integer DEFAULT 0 NOT NULL,
	"status" "challan_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_challans_challan_number_unique" UNIQUE("challan_number")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"movement_type" "stock_movement_type" NOT NULL,
	"reason" varchar(255) NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'SALES' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "customer_followups" ADD CONSTRAINT "customer_followups_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_followups" ADD CONSTRAINT "customer_followups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_challan_items" ADD CONSTRAINT "sales_challan_items_challan_id_sales_challans_id_fk" FOREIGN KEY ("challan_id") REFERENCES "public"."sales_challans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_challan_items" ADD CONSTRAINT "sales_challan_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_challans" ADD CONSTRAINT "sales_challans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_challans" ADD CONSTRAINT "sales_challans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;