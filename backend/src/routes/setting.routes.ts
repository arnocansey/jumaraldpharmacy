import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: "Settings array required" });
    }

    for (const s of settings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, type: s.type || "STRING" },
        create: { key: s.key, value: s.value, type: s.type || "STRING" },
      });
    }

    res.json({ message: "Settings updated" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:key", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ message: "Setting not found" });
    res.json(setting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:key", authenticateToken, requireRole([RoleName.SUPER_ADMIN]), async (req, res) => {
  try {
    const { value, type } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key: req.params.key },
      update: { value, type: type || "STRING" },
      create: { key: req.params.key, value, type: type || "STRING" },
    });
    res.json(setting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
