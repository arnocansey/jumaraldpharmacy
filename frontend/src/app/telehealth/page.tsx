"use client";

import React, { useState } from "react";
import { Stethoscope, Calendar, Clock, Star, Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_DOCTORS, Doctor } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function TelehealthPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBook = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const confirmBooking = () => {
    setBookingSuccess(true);
    toast.success(`Virtual appointment confirmed with ${selectedDoctor?.name}!`);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="text-left space-y-3">
        <Badge variant="blue">Jumarald Telehealth Care</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Book Online Video Consultation
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Private, confidential video appointments with certified clinical pharmacologists, cardiologists, and general physicians.
        </p>
      </div>

      {!bookingSuccess ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_DOCTORS.map((doctor) => (
            <Card key={doctor.id} hoverEffect className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <img src={doctor.avatarUrl} alt={doctor.name} className="h-24 w-24 rounded-2xl object-cover border-2 border-brand-500 mx-auto" />
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{doctor.name}</h3>
                  <p className="text-xs font-semibold text-brand-600">{doctor.specialty}</p>
                  <p className="text-[11px] text-slate-400">{doctor.qualification}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rating:</span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400" /> {doctor.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(doctor.consultFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available:</span>
                    <span className="font-medium text-emerald-600">{doctor.nextAvailable}</span>
                  </div>
                </div>
              </div>

              <Button variant="primary" size="md" className="w-full" onClick={() => handleBook(doctor)}>
                <Video className="h-4 w-4" /> Book Appointment
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center space-y-4 max-w-md mx-auto">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Appointment Confirmed!</h2>
          <p className="text-sm text-slate-500">
            Your appointment with <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDoctor?.name}</span> is scheduled. Video room link has been sent to your email.
          </p>
          <Button variant="primary" size="md" onClick={() => setBookingSuccess(false)}>
            Book Another Appointment
          </Button>
        </Card>
      )}

      {/* Modal dialog for appointment confirmation */}
      {selectedDoctor && !bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Consultation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Doctor: <strong>{selectedDoctor.name}</strong>
              <br />
              Time: <strong>{selectedDoctor.nextAvailable}</strong>
              <br />
              Fee: <strong>{formatCurrency(selectedDoctor.consultFee)}</strong>
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={confirmBooking}>Pay & Confirm</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
