import React from "react";

export default function MailerStatusPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-3">
            ● System Operational
          </span>
          <h1 className="text-2xl font-extrabold text-white">Jumarald Mailer Service</h1>
          <p className="text-xs text-slate-400 mt-2">
            Transactional Email Relay Serverless Microservice hosted on Vercel.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 font-mono text-slate-300">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-500">Service Status</span>
            <span className="text-emerald-400 font-bold">200 OK</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-500">Endpoint</span>
            <span className="text-slate-200 font-bold">POST /api/send-email</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Authentication</span>
            <span className="text-amber-400 font-bold">x-api-key Header Required</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} Jumarald Pharmacy & Wellness. Internal API microservice.
        </p>
      </div>
    </main>
  );
}
