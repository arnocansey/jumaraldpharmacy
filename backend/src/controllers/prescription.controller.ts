import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { PrescriptionStatus, OrderStatus } from "@prisma/client";
import { sendEmail, buildPrescriptionVerifiedEmail } from "../lib/notifications";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import fs from "fs";
import path from "path";
import { createAuditLog } from "../lib/audit";

const submitPrescriptionSchema = z.object({
  documentUrl: z.string().min(1),
  patientNotes: z.string().optional(),
});

const updatePrescriptionSchema = z.object({
  status: z.nativeEnum(PrescriptionStatus),
  pharmacistNote: z.string().optional(),
});

const createPrescriptionOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
    })
  ).min(1),
  pharmacistNote: z.string().optional(),
});

export async function submitPrescription(req: AuthenticatedRequest, res: Response) {
  try {
    const data = submitPrescriptionSchema.parse(req.body);
    const prescription = await prisma.prescription.create({
      data: {
        userId: req.user!.id,
        documentUrl: data.documentUrl,
        patientNotes: data.patientNotes,
        status: PrescriptionStatus.SUBMITTED,
      },
    });
    return res.status(201).json(prescription);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Prescription submission failed" });
  }
}

export async function getMyPrescriptions(req: AuthenticatedRequest, res: Response) {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { userId: req.user!.id },
      include: {
        items: { include: { product: true } },
        orders: { include: { orderItems: { include: { product: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(prescriptions);
  } catch {
    return res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
}

export async function getPrescriptionQueue(req: any, res: Response) {
  try {
    const queue = await prisma.prescription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        orders: { include: { orderItems: { include: { product: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(queue);
  } catch {
    return res.status(500).json({ message: "Failed to fetch prescription queue" });
  }
}

export async function createOrderFromPrescription(req: any, res: Response) {
  try {
    const { id } = req.params;
    const data = createPrescriptionOrderSchema.parse(req.body);

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = `JUM-RX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let address = await prisma.address.findFirst({
      where: { userId: prescription.userId },
      orderBy: { isDefault: "desc" },
    });

    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: prescription.userId,
          fullAddress: "Pharmacy Counter Pickup / Delivery on Request",
          city: "Accra",
          state: "Greater Accra",
          postalCode: "00233",
          country: "Ghana",
          isDefault: true,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });

      for (const item of data.items) {
        await tx.prescriptionItem.create({
          data: {
            prescriptionId: id,
            productId: item.productId,
            quantity: item.quantity,
            dosage: item.dosage || "As Directed",
            frequency: item.frequency || "Daily",
            duration: item.duration || "7 Days",
            instructions: item.instructions || "",
          },
        });
      }

      await tx.prescription.update({
        where: { id },
        data: {
          status: PrescriptionStatus.APPROVED,
          isVerified: true,
          pharmacistNote: data.pharmacistNote || prescription.pharmacistNote || "Prescription verified and order created.",
        },
      });

      return tx.order.create({
        data: {
          orderNumber,
          userId: prescription.userId,
          addressId: address.id,
          prescriptionId: id,
          totalAmount,
          shippingFee: 0,
          taxAmount: 0,
          status: OrderStatus.PENDING,
          orderItems: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.price * item.quantity,
            })),
          },
        },
        include: {
          orderItems: { include: { product: true } },
          user: { select: { email: true, name: true } },
        },
      });
    });

    if (result.user?.email) {
      const emailContent = buildPrescriptionVerifiedEmail(
        "APPROVED",
        data.pharmacistNote || "Prescription verified and order prepared.",
        "http://localhost:3000/dashboard"
      );
      sendEmail({ to: result.user.email, subject: emailContent.subject, html: emailContent.html }).catch(() => {});
    }

    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid order input", errors: error.errors });
    }
    console.error("Failed to create order from prescription:", error);
    return res.status(500).json({ message: error.message || "Failed to create order from prescription" });
  }
}

export async function updatePrescriptionStatus(req: any, res: Response) {
  try {
    const data = updatePrescriptionSchema.parse(req.body);
    const updated = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { status: data.status, pharmacistNote: data.pharmacistNote },
      include: { user: { select: { email: true } } },
    });

    if (req.user?.id) {
      await createAuditLog(
        req.user.id,
        "PRESCRIPTION_UPDATED",
        "Prescription",
        updated.id,
        { newStatus: data.status, note: data.pharmacistNote },
        req.ip
      );
    }

    const io = req.app?.get("io");
    if (io) {
      io.emit("prescription_updated", updated);
    }

    if (updated.user?.email) {
      const emailContent = buildPrescriptionVerifiedEmail(data.status, data.pharmacistNote);
      sendEmail({ to: updated.user.email, subject: emailContent.subject, html: emailContent.html }).catch(() => {});
    }

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: "Failed to update prescription status" });
  }
}

/**
 * Customer deletes their own prescription.
 * Only allowed if the prescription is in SUBMITTED or REJECTED status.
 */
export async function deletePrescription(req: AuthenticatedRequest, res: Response) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (prescription.userId !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete your own prescriptions" });
    }

    if (!["SUBMITTED", "REJECTED"].includes(prescription.status)) {
      return res.status(400).json({
        message: `Cannot delete a prescription in "${prescription.status}" status. Only SUBMITTED or REJECTED prescriptions can be deleted.`,
      });
    }

    // Clean up file asset (Cloudinary or local file system)
    if (prescription.documentUrl.includes("cloudinary.com")) {
      try {
        const parts = prescription.documentUrl.split("/upload/");
        if (parts[1]) {
          const publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err: any) {
        console.warn("Failed to delete Cloudinary asset:", err.message);
      }
    } else if (!prescription.documentUrl.startsWith("data:")) {
      try {
        const filename = prescription.documentUrl.replace(/^\/?(?:prescriptions|uploads)\//, "");
        const localPath = path.join(process.cwd(), "uploads", filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (err: any) {
        console.warn("Failed to delete local file:", err.message);
      }
    }

    await prisma.prescription.delete({ where: { id: req.params.id } });
    return res.json({ message: "Prescription deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete prescription" });
  }
}

/**
 * Admin deletes any prescription (regardless of status).
 */
export async function adminDeletePrescription(req: any, res: Response) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Clean up file asset (Cloudinary or local file system)
    if (prescription.documentUrl.includes("cloudinary.com")) {
      try {
        const parts = prescription.documentUrl.split("/upload/");
        if (parts[1]) {
          const publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err: any) {
        console.warn("Failed to delete Cloudinary asset:", err.message);
      }
    } else if (!prescription.documentUrl.startsWith("data:")) {
      try {
        const filename = prescription.documentUrl.replace(/^\/?(?:prescriptions|uploads)\//, "");
        const localPath = path.join(process.cwd(), "uploads", filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (err: any) {
        console.warn("Failed to delete local file:", err.message);
      }
    }

    await prisma.prescription.delete({ where: { id: req.params.id } });
    return res.json({ message: "Prescription deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete prescription" });
  }
}

/**
 * Migrate all prescriptions with local file paths to Cloudinary.
 * Finds any prescription where documentUrl does NOT start with "https://" or "data:",
 * reads the local file, uploads to Cloudinary, and updates the DB record.
 */
export async function migratePrescriptionsToCloudinary(req: any, res: Response) {
  try {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      return res.status(400).json({ message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env" });
    }

    const prescriptions = await prisma.prescription.findMany();
    const localPrescriptions = prescriptions.filter(
      (p) => p.documentUrl && !p.documentUrl.startsWith("https://") && !p.documentUrl.startsWith("data:")
    );

    if (localPrescriptions.length === 0) {
      return res.json({ message: "All prescriptions already use cloud storage.", migrated: 0 });
    }

    const results: { id: string; oldUrl: string; newUrl: string; status: string }[] = [];

    for (const prescription of localPrescriptions) {
      try {
        // Try to find the file on local disk
        const filename = prescription.documentUrl.replace(/^\/?(prescriptions|uploads)\//, "");
        const localPath = path.join(process.cwd(), "uploads", filename);

        if (!fs.existsSync(localPath)) {
          results.push({ id: prescription.id, oldUrl: prescription.documentUrl, newUrl: "", status: "file_not_found" });
          continue;
        }

        // Upload to Cloudinary
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          cloudinary.uploader.upload(localPath, {
            folder: "jumarald/prescriptions",
            resource_type: "image",
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          });
        });

        // Update DB record with Cloudinary URL
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: { documentUrl: result.secure_url },
        });

        results.push({ id: prescription.id, oldUrl: prescription.documentUrl, newUrl: result.secure_url, status: "migrated" });
      } catch (err: any) {
        results.push({ id: prescription.id, oldUrl: prescription.documentUrl, newUrl: "", status: `error: ${err.message}` });
      }
    }

    return res.json({
      message: `Migration complete. ${results.filter(r => r.status === "migrated").length}/${localPrescriptions.length} prescriptions migrated to Cloudinary.`,
      migrated: results.filter(r => r.status === "migrated").length,
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return res.status(500).json({ message: "Migration failed", error: error.message });
  }
}

/**
 * Delete all prescription records with broken/orphan local file paths.
 * These are records where documentUrl is a local path but the file no longer exists on disk.
 */
export async function cleanupOrphanPrescriptions(req: any, res: Response) {
  try {
    const prescriptions = await prisma.prescription.findMany();
    const orphans = prescriptions.filter(
      (p) => p.documentUrl && !p.documentUrl.startsWith("https://") && !p.documentUrl.startsWith("data:")
    );

    if (orphans.length === 0) {
      return res.json({ message: "No orphan prescriptions found.", deleted: 0 });
    }

    const deleted: string[] = [];
    for (const orphan of orphans) {
      // Check if the file exists locally
      const filename = orphan.documentUrl.replace(/^\/?(?:prescriptions|uploads)\//, "");
      const localPath = path.join(process.cwd(), "uploads", filename);
      const fileExists = fs.existsSync(localPath);

      if (!fileExists) {
        await prisma.prescription.delete({ where: { id: orphan.id } });
        deleted.push(orphan.id);
      }
    }

    return res.json({
      message: `Cleaned up ${deleted.length} orphan prescription records with missing files.`,
      deleted: deleted.length,
      deletedIds: deleted,
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return res.status(500).json({ message: "Cleanup failed", error: error.message });
  }
}

