import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { PrescriptionStatus } from "@prisma/client";
import { sendEmail, buildPrescriptionVerifiedEmail } from "../lib/notifications";

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
