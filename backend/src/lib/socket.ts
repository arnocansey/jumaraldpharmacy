import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 5000,
    pingInterval: 10000,
    perMessageDeflate: {
      threshold: 1024,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
      (socket as any).userId = decoded.id;
      (socket as any).userRole = decoded.role;
      (socket as any).userEmail = decoded.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    socket.join(`user:${userId}`);

    if (["SUPER_ADMIN", "ADMIN", "PHARMACIST"].includes(userRole)) {
      socket.join("admins");
    }
    if (userRole === "DELIVERY_DRIVER") {
      socket.join("drivers");
    }

    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("join:delivery", (trackingNumber: string) => {
      socket.join(`delivery:${trackingNumber}`);
    });

    socket.on("driver:location", (data: { latitude: number; longitude: number; deliveryId?: string }) => {
      if (userRole === "DELIVERY_DRIVER") {
        io.to("admins").emit("driver:location:update", {
          driverId: userId,
          ...data,
          timestamp: new Date().toISOString(),
        });
        if (data.deliveryId) {
          io.to(`order:${data.deliveryId}`).emit("delivery:location:update", {
            driverId: userId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToOrder(orderId: string, event: string, data: any) {
  io?.to(`order:${orderId}`).emit(event, data);
}

export function emitToDelivery(trackingNumber: string, event: string, data: any) {
  io?.to(`delivery:${trackingNumber}`).emit(event, data);
}

export function emitToAdmins(event: string, data: any) {
  io?.to("admins").emit(event, data);
}

export function emitToDrivers(event: string, data: any) {
  io?.to("drivers").emit(event, data);
}

export function emitOrderUpdate(userId: string, order: any) {
  io?.to(`user:${userId}`).emit("order_updated", order);
  io?.to("admins").emit("order_updated", order);
  if (order.id) io?.to(`order:${order.id}`).emit("order_updated", order);
}

export function emitPrescriptionUpdate(userId: string, prescription: any) {
  io?.to(`user:${userId}`).emit("prescription_updated", prescription);
  io?.to("admins").emit("prescription_updated", prescription);
}

export function emitInventoryUpdate(product: any) {
  io?.emit("inventory_updated", product);
  io?.to("admins").emit("inventory_updated", product);
}

export function emitAuditLogUpdate(auditLog: any) {
  io?.to("admins").emit("audit_log_created", auditLog);
}
