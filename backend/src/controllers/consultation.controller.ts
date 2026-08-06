import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { ConsultationStatus } from "@prisma/client";

const bookConsultationSchema = z.object({
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

export async function getDoctors(req: any, res: Response) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: { user: { select: { name: true, email: true, avatarUrl: true } } },
    });
    return res.json(doctors);
  } catch {
    return res.status(500).json({ message: "Failed to fetch doctors list" });
  }
}

export async function bookConsultation(req: AuthenticatedRequest, res: Response) {
  try {
    const data = bookConsultationSchema.parse(req.body);
    const consultation = await prisma.consultation.create({
      data: {
        patientId: req.user!.id,
        doctorId: data.doctorId,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes,
        status: ConsultationStatus.SCHEDULED,
        meetingLink: `https://telehealth.jumaraldpharmacy.com/room/${Math.random().toString(36).substring(7)}`,
      },
      include: { doctor: { include: { user: true } } },
    });
    return res.status(201).json(consultation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Consultation booking failed" });
  }
}

export async function getMyConsultations(req: AuthenticatedRequest, res: Response) {
  try {
    const consultations = await prisma.consultation.findMany({
      where: { patientId: req.user!.id },
      include: { doctor: { include: { user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { scheduledAt: "asc" },
    });
    return res.json(consultations);
  } catch {
    return res.status(500).json({ message: "Failed to fetch consultations" });
  }
}
