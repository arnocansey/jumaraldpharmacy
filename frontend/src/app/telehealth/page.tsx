"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Stethoscope,
  Calendar,
  Clock,
  Star,
  Video,
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  Loader2,
  User,
  Phone,
  Shield,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ApiDoctor {
  id: string;
  specialty: string;
  consultationFee?: number;
  availableSlots?: string[];
  user: { name: string; email: string; avatarUrl?: string };
}

interface Consultation {
  id: string;
  scheduledAt: string;
  notes?: string;
  status: string;
  meetingLink?: string;
  doctor: {
    id: string;
    specialty?: string;
    user: { name: string; avatarUrl?: string };
  };
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "patient" | "doctor";
  timestamp: Date;
}

type ActiveTab = "doctors" | "history";

export default function TelehealthPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("doctors");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const [showChatModal, setShowChatModal] = useState(false);
  const [chatDoctor, setChatDoctor] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoDoctor, setVideoDoctor] = useState<any | null>(null);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await apiFetch<any[]>("/consultations/doctors");
      const mapped = data.map((d: ApiDoctor) => ({
        id: d.id,
        name: d.user.name,
        specialty: d.specialty,
        qualification: "",
        experience: "",
        rating: 4.9,
        consultFee: d.consultationFee || 150,
        avatarUrl: d.user.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
        nextAvailable: "Available",
        email: d.user.email,
      }));
      setDoctors(mapped.length > 0 ? mapped : MOCK_DOCTORS);
    } catch {
      setDoctors(MOCK_DOCTORS);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchConsultations = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiFetch<Consultation[]>("/consultations/my");
      setConsultations(Array.isArray(data) ? data : []);
    } catch {
      setConsultations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchConsultations();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleBookClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setBookingDate("");
    setBookingTime("");
    setBookingNotes("");
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast.error("Please select a date and time");
      return;
    }
    const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`);
    if (scheduledAt <= new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setIsBooking(true);
    try {
      await apiFetch("/consultations/book", {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          scheduledAt: scheduledAt.toISOString(),
          notes: bookingNotes || undefined,
        }),
      });
      toast.success(`Consultation booked with ${selectedDoctor.name}!`);
      setShowBookingModal(false);
      setSelectedDoctor(null);
      if (activeTab === "history") fetchConsultations();
    } catch (err: any) {
      toast.error(err.message || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleStartConsultation = (consultation: Consultation) => {
    setVideoDoctor({
      name: consultation.doctor.user.name,
      specialty: consultation.doctor.specialty,
      avatarUrl: consultation.doctor.user.avatarUrl,
    });
    setShowVideoModal(true);
  };

  const handleOpenChat = (doctor: any) => {
    setChatDoctor(doctor);
    setChatMessages([
      {
        id: "1",
        text: `Hello! I'm ${doctor.name}. How can I help you today?`,
        sender: "doctor",
        timestamp: new Date(),
      },
    ]);
    setShowChatModal(true);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: "patient",
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const replies = [
        "I understand your concern. Let me review that for you.",
        "That's a common question. Let me explain...",
        "Please make sure to follow the dosage instructions carefully.",
        "I recommend scheduling a follow-up consultation.",
        "Is there anything else you'd like to know?",
        "For that condition, I'd suggest we discuss the available options.",
      ];
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "doctor",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SCHEDULED": return "blue";
      case "IN_PROGRESS": return "amber";
      case "COMPLETED": return "emerald";
      case "CANCELLED": return "red";
      default: return "slate";
    }
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00",
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 sm:p-10 space-y-4">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <Badge variant="emerald" className="bg-emerald-500 text-white font-bold">
            Telehealth Portal
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Virtual Health Consultations
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Connect with certified physicians and clinical pharmacologists via video or chat.
            Private, secure, and available from the comfort of your home.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span>Video & chat available</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Prescriptions issued online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab("doctors")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "doctors"
              ? "border-b-2 border-emerald-600 text-emerald-600"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Stethoscope className="h-4 w-4" /> Find Doctors
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "border-b-2 border-emerald-600 text-emerald-600"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" /> My Consultations
        </button>
      </div>

      {/* Doctors Tab */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          {loadingDoctors ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading available doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center">
                <Stethoscope className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Badge variant="emerald" className="bg-emerald-600 text-white font-bold">
                  Onboarding Licensed Practitioners
                </Badge>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Telehealth Doctor Booking Launching Soon
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
                  Our Telehealth portal is currently onboarding licensed Ghanaian physicians and specialist clinical pharmacologists. In the meantime, you can reach out directly to our Superintendent Pharmacist for immediate clinical advice and prescription consultation.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/233544772483?text=Hello%20Pharm.%20Philip%20Bruce-Tagoe,%20I%20need%20a%20clinical%20consultation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Contact Superintendent Pharmacist (WhatsApp)</span>
                </a>
                <a
                  href="tel:+233544772483"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition-colors"
                >
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Call +233 54 477 2483</span>
                </a>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.id} hoverEffect className="p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Image
                        src={doctor.avatarUrl}
                        alt={doctor.name}
                        width={64}
                        height={64}
                        quality={80}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                        className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{doctor.name}</h3>
                        <p className="text-xs font-semibold text-emerald-600 line-clamp-1">{doctor.specialty}</p>
                        {doctor.qualification && (
                          <p className="text-[11px] text-slate-400 truncate">{doctor.qualification}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Star className="h-3 w-3" /> Rating
                        </span>
                        <span className="font-bold text-amber-500 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400" /> {doctor.rating}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation Fee</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(doctor.consultFee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Next Available</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{doctor.nextAvailable}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBookClick(doctor)}
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenChat(doctor)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consultations History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading your consultations...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">No consultations yet</h3>
                <p className="text-sm text-slate-500 mt-1">Book your first virtual consultation with one of our certified doctors.</p>
              </div>
              <Button variant="primary" size="md" onClick={() => setActiveTab("doctors")}>
                <Stethoscope className="h-4 w-4" /> Find a Doctor
              </Button>
            </div>
          ) : (
            consultations.map((c) => (
              <Card key={c.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={c.doctor.user.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80"}
                      alt={c.doctor.user.name}
                      width={48}
                      height={48}
                      quality={80}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                      className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.doctor.user.name}</h4>
                      {c.doctor.specialty && (
                        <p className="text-xs text-emerald-600 font-medium">{c.doctor.specialty}</p>
                      )}
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(c.scheduledAt).toLocaleDateString("en-GH", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(c.scheduledAt).toLocaleTimeString("en-GH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(c.status) as any}>{c.status}</Badge>
                    {(c.status === "SCHEDULED" || c.status === "IN_PROGRESS") && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartConsultation(c)}
                      >
                        <Video className="h-3.5 w-3.5" /> Start Consultation
                      </Button>
                    )}
                  </div>
                </div>

                {c.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <p className="text-slate-500 font-semibold mb-1">Notes:</p>
                    <p className="text-slate-700 dark:text-slate-300">{c.notes}</p>
                  </div>
                )}

                {c.meetingLink && (
                  <div className="flex items-center gap-2 text-xs">
                    <Video className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-slate-500">Meeting Link:</span>
                    <a
                      href={c.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-medium truncate max-w-xs"
                    >
                      {c.meetingLink}
                    </a>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Book Consultation
              </DialogTitle>
              <DialogClose onClose={() => setShowBookingModal(false)} />
            </div>

            {selectedDoctor && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <Image
                  src={selectedDoctor.avatarUrl}
                  alt={selectedDoctor.name}
                  width={40}
                  height={40}
                  quality={80}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                  className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedDoctor.name}</p>
                  <p className="text-xs text-emerald-600">{selectedDoctor.specialty}</p>
                </div>
                <span className="ml-auto text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(selectedDoctor.consultFee)}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Select Time
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Choose a time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for consultation..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={isBooking}
                onClick={handleConfirmBooking}
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden h-[500px] flex flex-col">
          {chatDoctor && (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <Image
                  src={chatDoctor.avatarUrl}
                  alt={chatDoctor.name}
                  width={36}
                  height={36}
                  quality={80}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                  className="h-9 w-9 rounded-full object-cover border-2 border-emerald-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{chatDoctor.name}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{chatDoctor.specialty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "patient"
                          ? "bg-emerald-600 text-white rounded-br-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "patient" ? "text-emerald-200" : "text-slate-400"}`}>
                        {msg.timestamp.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Type your message..."
                    className="flex-1 h-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="h-10 px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Simulated chat for demonstration. A real doctor will respond during live consultations.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Call Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden">
            {/* Video Area Placeholder */}
            <div className="relative h-72 sm:h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 h-32 w-32 bg-emerald-500 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-24 w-24 bg-teal-500 rounded-full blur-3xl" />
              </div>

              {videoDoctor && (
                <div className="relative z-10 text-center space-y-4">
                  <Image
                    src={videoDoctor.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80"}
                    alt={videoDoctor.name}
                    width={96}
                    height={96}
                    quality={80}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                    className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500 mx-auto shadow-2xl"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">{videoDoctor.name}</h3>
                    {videoDoctor.specialty && (
                      <p className="text-sm text-emerald-400 font-medium">{videoDoctor.specialty}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-emerald-400 font-semibold">Connecting...</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Video consultation will appear here. In production, this integrates with a WebRTC video provider.
                  </p>
                </div>
              )}

              {/* Self-view placeholder */}
              <div className="absolute bottom-4 right-4 h-20 w-28 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-500" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 p-5 bg-slate-900">
              <button className="h-11 w-11 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors">
                <Phone className="h-5 w-5" />
              </button>
              <button className="h-11 w-11 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button className="h-11 w-11 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowVideoModal(false)}
                className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
