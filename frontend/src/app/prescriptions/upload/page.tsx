"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle2, ShieldCheck, FileText, X, Camera, Image as ImageIcon, Clock, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export default function PrescriptionUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientNotes, setPatientNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selected: File) => {
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      toast.error("Please upload an image (JPG, PNG, WebP) or PDF file");
      return;
    }

    setFile(selected);
    setUploading(true);

    // Create preview for images
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }

    try {
      const token = localStorage.getItem("jumarald_token") || "";
      const formData = new FormData();
      formData.append("file", selected);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setUploadedUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
      setFile(null);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadedUrl) {
      toast.error("Please upload a prescription file first");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("jumarald_token") || "";

      if (!token) {
        toast.error("Please login to submit a prescription");
        window.location.href = "/login?redirect=/prescriptions/upload";
        return;
      }

      const res = await fetch(`${API_URL}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentUrl: uploadedUrl, patientNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }

      toast.success("Prescription submitted to pharmacist queue!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setUploadedUrl("");
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="text-left space-y-3">
        <Badge variant="amber">Registered Pharmacist Verification</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Upload Doctor&apos;s Prescription</h1>
        <p className="text-slate-500 text-sm max-w-xl">
          Upload a clear photo or PDF document of your doctor&apos;s prescription. Our licensed superintendent pharmacist will verify it within 15 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-3xl p-10 text-center space-y-4 transition-colors ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : file
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                }`}
              >
                {file && uploadedUrl ? (
                  <div className="space-y-3">
                    {preview ? (
                      <Image src={preview} alt="Prescription preview" width={384} height={192} quality={85} className="max-h-48 mx-auto rounded-xl object-contain" />
                    ) : (
                      <FileText className="h-12 w-12 text-emerald-600 mx-auto" />
                    )}
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-emerald-600">Uploaded successfully</p>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                    >
                      <X className="h-3 w-3" /> Remove file
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="space-y-3">
                    <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-slate-500">Uploading file...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-12 w-12 text-emerald-600 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Drag and drop your prescription or take a photo
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WebP, PDF up to 10MB</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button type="button" variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Select File
                      </Button>
                      <Button type="button" variant="glass" size="sm" onClick={() => cameraInputRef.current?.click()}>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Notes for Pharmacist (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention preferred brands, dosage instructions, allergies, or special requirements..."
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  className="w-full rounded-2xl p-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={!uploadedUrl || isSubmitting}
              >
                Submit Prescription for Review
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">How It Works</h3>
            <div className="space-y-4">
              {[
                { icon: Camera, title: "Upload or Photo", desc: "Take a clear photo of your prescription" },
                { icon: ShieldCheck, title: "Pharmacist Review", desc: "Our licensed pharmacist verifies within 15 minutes" },
                { icon: CheckCircle2, title: "Order Filled", desc: "We prepare your medications for delivery" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{step.title}</p>
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Need Help?</h3>
            <p className="text-sm text-slate-500">Our pharmacists are available to assist you with your prescription upload.</p>
            <div className="space-y-3">
              <a href="tel:+2330544772483" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700">
                <Phone className="h-4 w-4" />
                +233 054-477-2483
              </a>
              <a
                href="https://wa.me/2330544772483?text=Hi%20Jumarald%2C%20I%20need%20help%20with%20my%20prescription%20upload"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </Card>

          <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Verification Hours</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Prescriptions are reviewed within 15 minutes during business hours (8AM - 8PM). Submissions outside hours will be processed the next morning.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
