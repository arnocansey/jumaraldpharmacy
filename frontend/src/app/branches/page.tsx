"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Search, Building2, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Branch {
  id: string;
  name: string;
  slug: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadius: number;
  isWarehouse: boolean;
  operatingHours?: any;
  country?: string;
  _count: { staff: number; inventory: number; orders: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      const data = await apiFetch<{ branches: Branch[] }>("/branches?isActive=true");
      setBranches(data.branches);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-emerald-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Building2 className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
            <h1 className="text-4xl font-bold mb-3">Our Pharmacy Locations</h1>
            <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
              Find your nearest Jumarald Pharmacy branch for in-person consultations, pickup, and expert pharmaceutical care.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3"
        >
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by branch name, city, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
          />
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No branches found</h3>
            <p className="text-slate-400 mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedBranch(branch)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    {branch.code}
                  </div>
                  {branch.isWarehouse && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      Warehouse
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mb-3">
                  {branch.name}
                </h3>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{branch.address}, {branch.city}, {branch.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Mon - Sun, 9:00 AM - 5:00 PM</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {branch._count.inventory} products in stock
                  </span>
                  <ChevronRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBranch(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">{selectedBranch.name}</h2>
              <button onClick={() => setSelectedBranch(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-emerald-500 mt-0.5" /><span>{selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state}, {selectedBranch.country}</span></div>
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-emerald-500" /><span>{selectedBranch.phone}</span></div>
              {selectedBranch.email && <div className="flex items-center gap-3"><span className="text-emerald-500">@</span><span>{selectedBranch.email}</span></div>}
              <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-emerald-500" /><span>Mon - Sun, 9:00 AM - 5:00 PM</span></div>
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <p className="text-xs text-slate-500 mb-2">Branch Stats</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-lg font-bold text-emerald-600">{selectedBranch._count.staff}</p><p className="text-xs text-slate-400">Staff</p></div>
                  <div><p className="text-lg font-bold text-emerald-600">{selectedBranch._count.inventory}</p><p className="text-xs text-slate-400">Products</p></div>
                  <div><p className="text-lg font-bold text-emerald-600">{selectedBranch._count.orders}</p><p className="text-xs text-slate-400">Orders</p></div>
                </div>
              </div>
              <a href={`tel:${selectedBranch.phone}`} className="block w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors mt-4">
                Call Branch
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
