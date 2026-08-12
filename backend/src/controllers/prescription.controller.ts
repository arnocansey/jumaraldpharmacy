import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { PrescriptionStatus } from "@prisma/client";
import { sendEmail, buildPrescriptionVerifiedEmail } from "../lib/notifications";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import fs from "fs";
import path from "path";

const submitPrescriptionSchema = z.object({
  documentUrl: z.string().min(1),
  patientNotes: z.string().optional(),
});

const updatePrescriptionSchema = z.object({
  status: z.nativeEnum(PrescriptionStatus),
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
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(queue);
  } catch {
    return res.status(500).json({ message: "Failed to fetch prescription queue" });
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

