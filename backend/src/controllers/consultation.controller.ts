import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { ConsultationStatus, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const bookConsultationSchema = z.object({
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

const onboardDoctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  specialty: z.string().min(2),
  qualification: z.string().min(2),
  licenseNumber: z.string().min(2),
  consultFee: z.number().min(0),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export async function getDoctors(_req: any, res: Response) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ status: "success", doctors });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch doctors list: " + (error.message || "") });
  }
}

export async function onboardDoctor(req: AuthenticatedRequest, res: Response) {
  try {
    const data = onboardDoctorSchema.parse(req.body);

    // 1. Check if license number already exists
    const existingLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (existingLicense) {
      return res.status(400).json({ message: "A doctor with this license number is already registered." });
    }

    // 2. Find or Create User
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    const defaultPassword = data.password || "DoctorPass2026!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone || null,
          passwordHash,
          role: RoleName.DOCTOR,
          avatarUrl: data.avatarUrl || null,
        },
      });
    } else {
      // Update role to DOCTOR if not already
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: RoleName.DOCTOR,
          name: data.name,
          phone: data.phone || user.phone,
        },
      });
    }

    // 3. Check if doctor profile already exists for this user
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor profile already exists for this user." });
    }

    // 4. Create Doctor Profile
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialty: data.specialty,
        qualification: data.qualification,
        licenseNumber: data.licenseNumber,
        consultFee: data.consultFee,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || user.avatarUrl || null,
        isAvailable: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      message: `Doctor ${data.name} onboarded successfully!`,
      doctor,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to onboard doctor: " + (error.message || "") });
  }
}

export async function toggleDoctorAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { id } });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { isAvailable: !doctor.isAvailable },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.json({
      status: "success",
      message: `Doctor availability set to ${updated.isAvailable ? "Available" : "Offline"}`,
      doctor: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update doctor availability" });
  }
}

export async function deleteDoctor(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { id } });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await prisma.doctor.delete({ where: { id } });

    return res.json({ status: "success", message: "Doctor profile removed successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete doctor: " + (error.message || "") });
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
