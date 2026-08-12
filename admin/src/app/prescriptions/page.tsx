"use client";

import { useState, useEffect } from "react";
import { Search, Package, CheckCircle, XCircle, Clock, Eye, MessageSquare, FileText, ExternalLink, Download, Trash2, Plus, ShoppingBag, Check } from "lucide-react";
import { apiFetch, API_URL } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  sku?: string;
  category?: { name: string };
}

interface OrderItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  dosage: string;
}

interface Prescription {
  id: string;
  documentUrl: string;
  patientNotes?: string;
  pharmacistNote?: string;
  status: string;
  priority: number;
  doctorName?: string;
  createdAt: string;
  user: { name: string; email: string; phone?: string };
  orders?: any[];
  prescriptionItems?: any[];
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  SUBMITTED: { color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30", icon: Clock },
  UNDER_REVIEW: { color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30", icon: Eye },
  APPROVED: { color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30", icon: CheckCircle },
  REJECTED: { color: "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30", icon: XCircle },
  CLARIFICATION_NEEDED: { color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30", icon: MessageSquare },
};

const getDocumentUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const backendHost = API_URL.replace("/api/v1", "");
  return `${backendHost}${cleanPath}`;
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [note, setNote] = useState("");
  const [imgError, setImgError] = useState(false);

  // Order builder state
  const [showOrderBuilder, setShowOrderBuilder] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => { loadPrescriptions(); }, [statusFilter]);

  async function loadPrescriptions() {
    try {
      const data = await apiFetch<Prescription[]>("/prescriptions/queue");
      setPrescriptions(data);
    } catch { toast.error("Failed to load prescriptions"); }
    finally { setLoading(false); }
  }

  async function loadProducts() {
    if (availableProducts.length > 0) return;
    try {
      const data = await apiFetch<any>("/products");
      const list = Array.isArray(data) ? data : (data?.products || []);
      setAvailableProducts(list);
    } catch {
      toast.error("Failed to load products inventory");
    }
  }

  const handleOpenOrderBuilder = () => {
    setShowOrderBuilder(true);
    loadProducts();
  };

  const handleAddProductToOrder = (product: Product) => {
    const existing = orderItems.find((i) => i.productId === product.id);
    if (existing) {
      setOrderItems(orderItems.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        dosage: "Take as directed by pharmacist",
      }]);
    }
  };

  const handleRemoveProductFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter((i) => i.productId !== productId));
  };

  const handleCreateOrder = async () => {
    if (!selected) return;
    if (orderItems.length === 0) {
      toast.error("Please add at least one medication to the order");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await apiFetch(`/prescriptions/${selected.id}/create-order`, {
        method: "POST",
        body: JSON.stringify({
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            dosage: item.dosage,
          })),
          pharmacistNote: note || "Prescription approved and medication order created.",
        }),
      });

      toast.success("Order created successfully for patient!");
      setSelected(null);
      setShowOrderBuilder(false);
      setOrderItems([]);
      setNote("");
      loadPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch(`/prescriptions/${id}/status`, { method: "PUT", body: JSON.stringify({ status, pharmacistNote: note }) });
      toast.success(`Prescription ${status.toLowerCase().replace(/_/g, " ")}`);
      setNote(""); setSelected(null); loadPrescriptions();
    } catch { toast.error("Failed to update prescription"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this prescription? This will also remove the file from cloud storage. This action cannot be undone.")) return;
    try {
      await apiFetch(`/prescriptions/${id}/admin`, { method: "DELETE" });
      toast.success("Prescription deleted permanently");
      setSelected(null); loadPrescriptions();
    } catch { toast.error("Failed to delete prescription"); }
  }

  const filtered = (Array.isArray(prescriptions) ? prescriptions : []).filter((p) => !statusFilter || p.status === statusFilter);

  const filteredProducts = (Array.isArray(availableProducts) ? availableProducts : []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const orderTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Prescription Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review, verify, and fulfill patient prescription documents</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_NEEDED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "glass-panel text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}>
            {s ? s.replace(/_/g, " ") : "All Prescriptions"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)
        ) : filtered.length === 0 ? (
          <div className="col-span-full glass-panel rounded-2xl text-center py-12 text-slate-400 dark:text-slate-500">No prescriptions found in queue</div>
        ) : (
          filtered.map((p) => {
            const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.SUBMITTED;
            const Icon = config.icon;
            const hasOrder = p.orders && p.orders.length > 0;
            return (
              <div key={p.id} onClick={() => { setSelected(p); setNote(""); setImgError(false); setShowOrderBuilder(false); setOrderItems([]); }}
                className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" /> {p.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.user.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.user.email} &middot; {p.user.phone || "No phone"}</p>

                {p.patientNotes && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">&ldquo;{p.patientNotes}&rdquo;</p>}
                {p.doctorName && <p className="text-xs text-slate-500 dark:text-slate-400">Prescribing Doctor: <span className="font-medium text-slate-700 dark:text-slate-300">{p.doctorName}</span></p>}
                {hasOrder && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    <ShoppingBag className="h-3.5 w-3.5" /> Order Generated ({p.orders![0].orderNumber})
                  </div>
                )}
                {p.pharmacistNote && <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{p.pharmacistNote}</p>}
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                  Rx Review Fulfill & Order
                </span>
                <h2 className="text-xl font-extrabold text-white">Prescription Review</h2>
                <p className="text-xs text-slate-300 font-medium">
                  Patient: <span className="font-extrabold text-emerald-400">{selected.user.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-xl transition-colors shadow-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-5 mb-6">
              {/* Document Display Area */}
              {(() => {
                const docUrl = getDocumentUrl(selected.documentUrl);
                return (
                  <div className="relative bg-slate-900/90 rounded-2xl p-4 border border-slate-800 min-h-[200px] flex items-center justify-center shadow-inner">
                    {!imgError && docUrl ? (
                      <div className="relative w-full text-center group">
                        <img
                          src={docUrl}
                          alt="Prescription Document"
                          className="max-h-[320px] w-auto mx-auto object-contain rounded-xl shadow-lg border border-slate-800"
                          onError={() => setImgError(true)}
                        />
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" /> Open Full Resolution Document
                        </a>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/30 border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 text-center w-full">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-extrabold text-white mb-1">Prescription Document Attached</p>
                        <p className="text-xs text-slate-400 mb-4 break-all max-w-sm mx-auto font-mono">{selected.documentUrl || "Uploaded prescription file"}</p>
                        {docUrl && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30"
                          >
                            <ExternalLink className="h-4 w-4" /> Open Document File
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Patient Info Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-slate-400 font-semibold mb-1">Patient Email</p>
                  <p className="font-extrabold text-white truncate">{selected.user.email}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-slate-400 font-semibold mb-1">Phone Number</p>
                  <p className="font-extrabold text-white">{selected.user.phone || "Not provided"}</p>
                </div>
              </div>

              {selected.patientNotes && (
                <div>
                  <p className="text-xs font-bold text-slate-300 block mb-1.5">Patient Notes / Requests</p>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-xs font-medium text-slate-200">
                    &ldquo;{selected.patientNotes}&rdquo;
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">Superintendent Pharmacist Notes & Instructions</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter dosage directives, substitution instructions, or notes for patient..."
                  className="w-full border border-slate-700/80 rounded-2xl p-3.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-white placeholder:text-slate-500 font-medium leading-relaxed"
                  rows={2}
                />
              </div>

              {/* Order Fulfill Builder Section */}
              {showOrderBuilder ? (
                <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" /> Select Prescribed Inventory Items
                    </h3>
                    <button
                      onClick={() => setShowOrderBuilder(false)}
                      className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Search Product */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="Search medications from inventory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner"
                    />
                  </div>

                  {/* Product Search Results */}
                  {searchQuery && (
                    <div className="max-h-52 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5 shadow-2xl">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs font-semibold text-slate-400 p-3 text-center">No products found matching &ldquo;{searchQuery}&rdquo;</p>
                      ) : (
                        filteredProducts.slice(0, 5).map((prod) => (
                          <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs transition-colors">
                            <div>
                              <p className="font-extrabold text-white text-xs">{prod.name}</p>
                              <p className="text-[11px] font-bold text-emerald-400 mt-0.5">GHS {Number(prod.price).toFixed(2)} &middot; Stock: {prod.stockQuantity}</p>
                            </div>
                            <button
                              onClick={() => { handleAddProductToOrder(prod); setSearchQuery(""); }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-extrabold flex items-center gap-1 text-xs shadow-md shadow-emerald-600/30 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Items List */}
                  {orderItems.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-extrabold text-slate-200">Selected Prescribed Items ({orderItems.length}):</p>
                      {orderItems.map((item) => (
                        <div key={item.productId} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5 text-xs shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-white text-sm">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-emerald-400 text-sm">GHS {(item.price * item.quantity).toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveProductFromOrder(item.productId)}
                                className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white px-2 py-0.5 rounded-md font-bold text-xs transition-colors"
                              >
                                Delete &times;
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                              <span className="text-[11px] font-bold text-slate-400">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setOrderItems(orderItems.map((i) => i.productId === item.productId ? { ...i, quantity: val } : i));
                                }}
                                className="w-12 bg-transparent text-white font-extrabold text-xs outline-none text-center"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Dosage instruction (e.g. 1 tab 3x daily)"
                              value={item.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOrderItems(orderItems.map((i) => i.productId === item.productId ? { ...i, dosage: val } : i));
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 text-white font-medium placeholder:text-slate-500 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-300 font-extrabold">Total Prescribed Order Amount:</span>
                        <span className="text-xl font-black text-emerald-400">GHS {orderTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic text-center py-3">Search and add medications from inventory above.</p>
                  )}

                  <button
                    onClick={handleCreateOrder}
                    disabled={isSubmittingOrder || orderItems.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> {isSubmittingOrder ? "Generating Order..." : `Confirm & Create Order (GHS ${orderTotal.toFixed(2)})`}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenOrderBuilder}
                  className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> Approve & Create Prescribed Order for Patient
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => updateStatus(selected.id, "APPROVED")} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-extrabold hover:bg-emerald-500 flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"><CheckCircle className="h-4 w-4" /> Approve</button>
              <button onClick={() => updateStatus(selected.id, "REJECTED")} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-extrabold hover:bg-rose-500 flex items-center justify-center gap-2 text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"><XCircle className="h-4 w-4" /> Reject</button>
              <button onClick={() => updateStatus(selected.id, "CLARIFICATION_NEEDED")} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-extrabold hover:bg-amber-500 flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"><MessageSquare className="h-4 w-4" /> Clarify</button>
            </div>
            <button onClick={() => handleDelete(selected.id)} className="w-full mt-3 bg-slate-900 text-rose-400 hover:text-white py-2.5 rounded-xl font-bold hover:bg-rose-950/60 flex items-center justify-center gap-2 text-xs border border-rose-900/40 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Delete Prescription Permanently</button>
          </div>
        </div>
      )}
    </div>
  );
}

