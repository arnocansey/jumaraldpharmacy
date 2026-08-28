"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  Trash2,
  Zap,
  Sparkles,
  SwitchCamera,
  AlertCircle,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { apiUpload } from "@/lib/api";
import { toast } from "sonner";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCaptured: (uploadedUrls: string[]) => void;
  title?: string;
}

export default function LiveCameraModal({
  isOpen,
  onClose,
  onPhotosCaptured,
  title = "Take Product Photos",
}: LiveCameraModalProps) {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [snappedPhotos, setSnappedPhotos] = useState<Array<{ dataUrl: string; blob: Blob }>>([]);
  const [uploading, setUploading] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play shutter sound
  const playShutterSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam / Camera access is not supported by your browser");
      }

      // Enumerate devices for camera switching
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === "videoinput");
        setAvailableDevices(videoDevs);
      } catch {}

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.error("[LiveCameraModal] Camera error:", err);
      let msg = "Could not access camera. Please check browser permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera device found on this computer.";
      }
      setCameraError(msg);
      setStreamActive(false);
    }
  }, [facingMode, selectedDeviceId, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setSnappedPhotos([]);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Trigger flash animation & shutter sound
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 150);
    playShutterSound();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          setSnappedPhotos((prev) => [...prev, { dataUrl, blob }]);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const removeSnapped = (index: number) => {
    setSnappedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndApply = async () => {
    if (snappedPhotos.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < snappedPhotos.length; i++) {
        const item = snappedPhotos[i];
        const filename = `product_cam_${Date.now()}_${i + 1}.jpg`;
        const file = new File([item.blob], filename, { type: "image/jpeg" });
        const res = await apiUpload(file);
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} picture(s) uploaded & attached!`);
        onPhotosCaptured(uploadedUrls);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload captured photos");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-400">Desktop &amp; Mobile Live Webcam Capture</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {availableDevices.length > 1 && (
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="h-4 w-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative bg-black flex-1 min-h-[280px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150" />}

          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-sm space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover max-h-[420px]"
              />

              {/* Viewfinder Overlay Frame */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border-2 border-dashed border-white/40 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex justify-between text-[11px] font-bold text-white/80 drop-shadow">
                  <span>📸 Position Medication</span>
                  <span>HD 1080p</span>
                </div>
                <div className="text-center text-[10px] font-semibold text-white/70 bg-black/40 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-sm">
                  Align product box or bottle inside frame
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Shutter & Controls Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {snappedPhotos.length} photo{snappedPhotos.length === 1 ? "" : "s"} taken
            </span>
          </div>

          {/* Large Center Shutter Snap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={snapPhoto}
              disabled={!streamActive || cameraError !== null}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-white dark:border-slate-800 disabled:opacity-50 transition-all cursor-pointer"
              title="Capture Photo"
            >
              <Camera className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleUploadAndApply}
              disabled={snappedPhotos.length === 0 || uploading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Attach ({snappedPhotos.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Captured Photos Thumbnail Carousel Strip */}
        {snappedPhotos.length > 0 && (
          <div className="px-4 py-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto scrollbar-thin">
            {snappedPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="relative group shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm"
              >
                <img src={photo.dataUrl} alt={`Snap ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeSnapped(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity shadow-md"
                  title="Remove Photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
