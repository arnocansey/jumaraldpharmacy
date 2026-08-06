import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
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

const app = express();

app.use(helmet());

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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "Jumarald Pharmacy API", timestamp: new Date().toISOString() });
});

// API V1 Routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/consultations", consultationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1", passwordResetRoutes);
app.use("/api/v1/blog", blogRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Jumarald Pharmacy Backend Server running on port ${PORT}`);
});

export default app;
