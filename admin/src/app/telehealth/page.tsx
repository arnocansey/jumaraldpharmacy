"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Plus,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  UserCheck,
  Mail,
  Phone,
  Award,
  CreditCard,
  FileText,
  Trash2,
  Building2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface DoctorUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  qualification: string;
  licenseNumber: string;
  consultFee: number;
  rating: number;
  isAvailable: boolean;
  bio?: string;
  user: DoctorUser;
  createdAt: string;
}

export default function AdminTelehealthPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "General Physician",
    qualification: "MBChB, FWACP",
    licenseNumber: "",
    consultFee: 150,
    bio: "",
    password: "",
  });

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ status: string; doctors: Doctor[] }>("/consultations/doctors");
      setDoctors(res.doctors || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch doctors list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await apiFetch<{ status: string; message: string; doctor: Doctor }>(`/consultations/doctors/${id}/toggle`, {
        method: "PATCH",
      });
      toast.success(res.message);
      setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, isAvailable: res.doctor.isAvailable } : d)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to remove this doctor profile?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/consultations/doctors/${id}`, {
        method: "DELETE",
      });
      toast.success("Doctor profile removed successfully");
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to remove doctor");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.licenseNumber || !formData.specialty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ status: string; message: string; doctor: Doctor }>("/consultations/doctors", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          specialty: formData.specialty,
          qualification: formData.qualification,
          licenseNumber: formData.licenseNumber,
          consultFee: Number(formData.consultFee),
          bio: formData.bio || undefined,
          password: formData.password || undefined,
        }),
      });

      toast.success(res.message || "Doctor onboarded successfully!");
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialty: "General Physician",
        qualification: "MBChB, FWACP",
        licenseNumber: "",
        consultFee: 150,
        bio: "",
        password: "",
      });
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Doctor onboarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Telehealth & Medical Staff</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Network
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Onboard medical specialists, update consultation pricing, and manage doctor availability.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Onboard New Doctor
        </button>
      </div>

      {/* Doctor List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Registered Doctors & Consultants ({doctors.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-sm font-medium">Fetching telehealth medical staff...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Stethoscope className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No doctors onboarded yet</p>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              Click &quot;Onboard New Doctor&quot; above to add your first medical specialist to Jumarald Pharmacy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-700/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <th className="p-4">Doctor Profile</th>
                  <th className="p-4">Specialty & License</th>
                  <th className="p-4">Qualification</th>
                  <th className="p-4">Consult Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
                        {doc.user.name ? doc.user.name.charAt(0).toUpperCase() : "D"}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doc.user.name}</p>
                        <p className="text-[11px] font-normal text-slate-400">{doc.user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">{doc.specialty}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Lic: {doc.licenseNumber}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{doc.qualification}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">{formatCurrency(doc.consultFee)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                          doc.isAvailable
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {doc.isAvailable ? "Available" : "Offline"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(doc.id)}
                        disabled={togglingId === doc.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1"
                      >
                        {togglingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        <span>Toggle Status</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDoctor(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors inline-flex"
                        title="Remove Doctor"
                      >
                        {deletingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Onboard Medical Specialist</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Register a new telehealth doctor or consultant</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Doctor Full Name *</label>
                  <div className="relative">
                    <UserCheck className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Kwabena Mensah"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. dr.kwabena@jumaraldpharmacy.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinical Pharmacologist, Cardiologist"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Medical License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MDC/GH/2026/8942"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBChB, PharmD, FWACP"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Consultation Fee (GHS) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="150"
                    value={formData.consultFee}
                    onChange={(e) => setFormData({ ...formData, consultFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="text"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Profile Bio / Medical Overview</label>
                <textarea
                  rows={2}
                  placeholder="Specialist with over 10 years experience in medication therapy management..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Complete Doctor Onboarding</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
