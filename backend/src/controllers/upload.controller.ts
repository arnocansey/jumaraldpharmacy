import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP, and PDF files are allowed"));
    }
  },
});

export async function uploadFile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!env.CLOUDINARY_CLOUD_NAME) {
      const filename = `prescriptions/${Date.now()}-${req.file.originalname}`;
      return res.json({ url: filename, filename: req.file.originalname });
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "jumarald/prescriptions",
          resource_type: req.file!.mimetype === "application/pdf" ? "raw" : "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string; public_id: string });
        }
      );
      stream.end(req.file!.buffer);
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
    });
  } catch (error: any) {
    return res.status(500).json({ message: "File upload failed" });
  }
}
