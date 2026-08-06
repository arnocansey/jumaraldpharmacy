"use client";

import React, { useState } from "react";
import { Stethoscope, Calendar, Plus, Star, Video, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminTelehealthPage() {
  const [doctors, setDoctors] = useState([
    { id: "1", name: "Dr. Kwabena Mensah", specialty: "Clinical Pharmacologist", fee: 150, status: "ACTIVE", rating: 4.9 },
    { id: "2", name: "Dr. Akosua Osei-Tutu", specialty: "Cardiologist", fee: 250, status: "ACTIVE", rating: 4.8 },
  ]);

  const toggleStatus = (id: string) => {
    setDoctors(
      doctors.map((doc) =>
        doc.id === id ? { ...doc, status: doc.status === "ACTIVE" ? "OFFLINE" : "ACTIVE" } : doc
      )
    );
    toast.success("Doctor availability status updated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Telehealth & Medical Staff Management</h1>
          <p className="text-xs text-slate-500">Onboard doctors, schedule video rooms, and set consultation fees.</p>
        </div>
        <button className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20">
          <Plus className="h-4 w-4" /> Onboard Doctor
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="p-4">Doctor Name</th>
              <th className="p-4">Specialty</th>
              <th className="p-4">Consultation Fee</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-emerald-600" /> {doc.name}
                </td>
                <td className="p-4 text-xs font-semibold text-emerald-700">{doc.specialty}</td>
                <td className="p-4 font-bold text-slate-900">{formatCurrency(doc.fee)}</td>
                <td className="p-4 text-xs font-bold text-amber-500">⭐️ {doc.rating}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      doc.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleStatus(doc.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
