import "./instrument";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { env } from "./config/env";
import { initSocketServer } from "./lib/socket";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import orderRoutes from "./routes/order.routes";
import consultationRoutes from "./routes/consultation.routes";
import analyticsRoutes from "./routes/analytics.routes";
import uploadRoutes from "./routes/upload.routes";
import paymentRoutes from "./routes/payment.routes";
import passwordResetRoutes from "./routes/passwordReset.routes";
import blogRoutes from "./routes/blog.routes";
import branchRoutes from "./routes/branch.routes";
import inventoryRoutes from "./routes/inventory.routes";
import loyaltyRoutes from "./routes/loyalty.routes";
import deliveryRoutes from "./routes/delivery.routes";
import interactionRoutes from "./routes/interaction.routes";
import searchRoutes from "./routes/search.routes";
import couponRoutes from "./routes/coupon.routes";
import twoFactorRoutes from "./routes/twoFactor.routes";
import auditRoutes from "./routes/audit.routes";
import reportRoutes from "./routes/report.routes";
import reviewRoutes from "./routes/review.routes";
import pushRoutes from "./routes/push.routes";
import newsletterRoutes from "./routes/newsletter.routes";
import settingRoutes from "./routes/setting.routes";
import { configureWebPush } from "./lib/push";
import { setupSwagger } from "./config/swagger";
import * as Sentry from "@sentry/node";

const app = express();
const httpServer = createServer(app);

const io = initSocketServer(httpServer);
app.set("io", io);
configureWebPush();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

import path from "path";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve any remaining local uploads (legacy support only)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(morgan("dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: "Too many search requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { message: "Too many requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", service: "Jumarald Pharmacy API", version: "3.0.0", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/orders", apiLimiter, orderRoutes);
app.use("/api/v1/consultations", consultationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/payments", apiLimiter, paymentRoutes);
app.use("/api/v1", passwordResetRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/branches", branchRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/loyalty", loyaltyRoutes);
app.use("/api/v1/deliveries", apiLimiter, deliveryRoutes);
app.use("/api/v1/interactions", interactionRoutes);
app.use("/api/v1/search", searchLimiter, searchRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/2fa", twoFactorRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use("/api/v1/settings", settingRoutes);

setupSwagger(app);

app.get("/debug-sentry", (_req, res) => {
  Sentry.logger.info("User triggered test error", { action: "test_error_endpoint" });
  Sentry.metrics.count("test_counter", 1);
  throw new Error("Sentry test error!");
});

Sentry.setupExpressErrorHandler(app);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Jumarald Pharmacy API v3.0 running on port ${PORT} with WebSocket`);
});

export default app;
