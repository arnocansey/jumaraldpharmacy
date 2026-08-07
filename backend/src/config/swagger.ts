import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jumarald Pharmacy API",
      version: "3.0.0",
      description: "Full-featured pharmacy e-commerce API with real-time WebSocket support, payment processing, delivery tracking, telehealth, and loyalty programs.",
      contact: { name: "Jumarald Pharmacy", email: "api@jumaraldpharmacy.com" },
      license: { name: "MIT" },
    },
    servers: [
      { url: "https://jumaraldpharmacy.onrender.com/api/v1", description: "Production" },
      { url: "http://localhost:5000/api/v1", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            sku: { type: "string" },
            price: { type: "number" },
            compareAtPrice: { type: "number", nullable: true },
            stockQuantity: { type: "integer" },
            minStockAlert: { type: "integer" },
            requiresPrescription: { type: "boolean" },
            isFeatured: { type: "boolean" },
            images: { type: "array", items: { type: "string" } },
            description: { type: "string" },
            dosageForm: { type: "string", nullable: true },
            strength: { type: "string", nullable: true },
            activeIngredients: { type: "string", nullable: true },
            manufacturer: { type: "string", nullable: true },
            category: { $ref: "#/components/schemas/Category" },
            brand: { $ref: "#/components/schemas/Brand" },
            rating: { type: "number" },
            reviewCount: { type: "integer" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
          },
        },
        Brand: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderNumber: { type: "string" },
            status: { type: "string", enum: ["PENDING", "PRESCRIPTION_CHECK", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"] },
            totalAmount: { type: "number" },
            shippingFee: { type: "number" },
            taxAmount: { type: "number" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            title: { type: "string", nullable: true },
            comment: { type: "string", nullable: true },
            isVerified: { type: "boolean" },
            helpful: { type: "integer" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Jumarald Pharmacy API Docs",
  }));
  app.get("/api/docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
}
