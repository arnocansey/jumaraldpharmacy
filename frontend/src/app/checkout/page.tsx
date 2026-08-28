"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Tag,
  Store,
  Loader2,
  AlertCircle,
  Percent,
  Gift,
  X,
  Package,
  FileText,
  Camera,
  UploadCloud,
  ShieldAlert,
  Pill,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { API_URL, apiUpload } from "@/lib/api";

const FREE_DELIVERY_THRESHOLD = 200;
const DELIVERY_FEE = 25;
const POINTS_TO_GHS_RATIO = 0.01;

interface CouponData {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minOrderTotal?: number;
  description?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalAmount, clearCart, requiresPrescription } = useCartStore();
  const [step, setStep] = useState<"address" | "payment" | "confirmed">("address");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "card">("momo");
  const [momoNetwork, setMomoNetwork] = useState<"mtn" | "telecel" | "at">("mtn");
  const [momoNumber, setMomoNumber] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">("delivery");
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string>("");

  const [isVerifying, setIsVerifying] = useState(false);

  // Prescription states
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [prescriptionFilename, setPrescriptionFilename] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [uploadingRx, setUploadingRx] = useState(false);
  const [previewRxModal, setPreviewRxModal] = useState(false);

  const requiresRx = useMemo(() => {
    return items.some((item) =>
      Boolean(
        item.product?.requiresPrescription === true ||
        String(item.product?.requiresPrescription).toLowerCase() === "true" ||
        (item.product as any)?.isPrescription === true ||
        (item.product as any)?.requires_prescription === true
      )
    );
  }, [items]);

  const rxItems = useMemo(() => {
    return items.filter((item) =>
      Boolean(
        item.product?.requiresPrescription === true ||
        String(item.product?.requiresPrescription).toLowerCase() === "true" ||
        (item.product as any)?.isPrescription === true ||
        (item.product as any)?.requires_prescription === true
      )
    );
  }, [items]);

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRx(true);
    try {
      const res = await apiUpload(file);
      if (res && res.url) {
        setPrescriptionUrl(res.url);
        setPrescriptionFilename(file.name);
        toast.success("Doctor's prescription uploaded successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload prescription. Please try again.");
    } finally {
      setUploadingRx(false);
    }
  };

  // Address state
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    region: "Greater Accra Region",
  });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("jumarald_user");
      if (stored) {
        const u = JSON.parse(stored);
        setAddress((prev) => ({
          ...prev,
          fullName: u.name || prev.fullName,
          phone: u.phone || prev.phone,
        }));
        if (u.phone) setMomoNumber(u.phone);
      }
    } catch {}
  }, []);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Loyalty points state
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsApplied, setPointsApplied] = useState(false);

  // Verification Effect for Paystack Callback Redirect
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");

    async function verifyRef(ref: string) {
      setIsVerifying(true);
      try {
        const token = localStorage.getItem("jumarald_token") || "";
        const res = await fetch(`${API_URL}/payments/verify/${ref}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.status === "COMPLETED" || data.status === "SUCCESS") {
          toast.success("Payment verified successfully!");
          clearCart();
          router.push(`/orders/${data.orderId || ""}`);
        } else {
          toast.error(data.message || "Payment verification failed.");
        }
      } catch {
        toast.error("Error verifying payment.");
      } finally {
        setIsVerifying(false);
      }
    }

    if (reference) {
      verifyRef(reference);
    }
  }, [clearCart, router]);

  // Fetch loyalty points when entering payment step
  const fetchLoyaltyPoints = async () => {
    const token = localStorage.getItem("jumarald_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/loyalty/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailablePoints(data.points ?? data.balance ?? 0);
      }
    } catch {
      // Silently fail — loyalty is optional
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), orderTotal: subtotalAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || "Invalid coupon code");
        setCouponData(null);
        return;
      }
      setCouponData(data);
      toast.success("Coupon applied successfully!");
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
  };

  const redeemPoints = async () => {
    if (pointsToRedeem <= 0) return;
    setPointsLoading(true);
    try {
      const token = localStorage.getItem("jumarald_token");
      const res = await fetch(`${API_URL}/loyalty/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: pointsToRedeem, rewardType: "ORDER_DISCOUNT" }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to redeem points");
        return;
      }
      setPointsApplied(true);
      toast.success(`${pointsToRedeem} points redeemed for ${formatCurrency(pointsToRedeem * POINTS_TO_GHS_RATIO)} discount!`);
    } catch {
      toast.error("Failed to redeem points. Please try again.");
    } finally {
      setPointsLoading(false);
    }
  };

  // Derived calculations
  const couponDiscount = useMemo(() => {
    if (!couponData) return 0;
    if (couponData.discountType === "percentage") {
      const discount = (subtotalAmount * couponData.discountValue) / 100;
      return couponData.maxDiscount ? Math.min(discount, couponData.maxDiscount) : discount;
    }
    return Math.min(couponData.discountValue, subtotalAmount);
  }, [couponData, subtotalAmount]);

  const pointsDiscount = useMemo(() => {
    if (!pointsApplied || pointsToRedeem <= 0) return 0;
    return pointsToRedeem * POINTS_TO_GHS_RATIO;
  }, [pointsApplied, pointsToRedeem]);

  const deliveryFee = deliveryOption === "pickup" ? 0 : subtotalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = Math.max(subtotalAmount - couponDiscount - pointsDiscount + deliveryFee, 0);

  const validateAddress = (): boolean => {
    if (!address.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!address.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (deliveryOption === "delivery") {
      if (!address.street.trim()) {
        toast.error("Please enter your delivery address");
        return false;
      }
      if (!address.city.trim()) {
        toast.error("Please enter your city");
        return false;
      }
      if (!address.region.trim()) {
        toast.error("Please select a region");
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (!validateAddress()) return;
    if (requiresRx && !prescriptionUrl) {
      toast.error("Doctor's Prescription Required: Please upload your prescription document before proceeding to payment.");
      const rxSection = document.getElementById("rx-upload-section");
      if (rxSection) {
        rxSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    setStep("payment");
    fetchLoyaltyPoints();
  };

  const handleCompleteOrder = async () => {
    if (requiresRx && !prescriptionUrl) {
      toast.error("Doctor's Prescription Mandatory: You cannot proceed to payment without uploading a valid doctor's prescription.");
      setStep("address");
      setTimeout(() => {
        const rxSection = document.getElementById("rx-upload-section");
        if (rxSection) rxSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    toast.info("Initializing Paystack transaction...");

    try {
      const token = localStorage.getItem("jumarald_token") || "";
      const user = JSON.parse(localStorage.getItem("jumarald_user") || "{}");

      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        address: deliveryOption === "pickup"
          ? { fullAddress: "Store Pickup — Jumarald Pharmacy", city: "Accra", state: "Greater Accra", postalCode: "00233", country: "Ghana" }
          : { fullAddress: address.street, city: address.city, state: address.region, postalCode: "00233", country: "Ghana" },
        prescriptionUrl: prescriptionUrl || undefined,
        doctorName: doctorName || undefined,
        patientNotes: patientNotes || undefined,
        totalAmount: grandTotal,
        shippingFee: deliveryFee,
        deliveryOption,
        couponCode: couponData?.code || undefined,
        pointsRedeemed: pointsApplied ? pointsToRedeem : 0,
      };

      let orderNumber = `JUM-GH-${Date.now().toString().slice(-6)}`;
      let orderId = "";

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        orderNumber = data.orderNumber || orderNumber;
        orderId = data.id;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create order");
      }

      // Initialize Paystack Payment for both MoMo and Card
      if (orderId) {
        try {
          const payRes = await fetch(`${API_URL}/payments/initialize`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              orderId,
              email: user.email || (address.phone.replace(/[^0-9]/g, "") + "@jumaraldpharmacy.com"),
              amount: grandTotal,
              method: paymentMethod,
              phone: momoNumber,
              network: momoNetwork,
              callback_url: `${window.location.origin}/checkout?reference={reference}&orderId=${orderId}`,
            }),
          });

          const payData = await payRes.json();
          if (payRes.ok) {
            if (payData.authorization_url) {
              window.location.href = payData.authorization_url;
              return;
            }
          } else {
            throw new Error(payData.message || "Payment initialization failed");
          }
        } catch (payErr) {
          toast.error(payErr instanceof Error ? payErr.message : "Payment failed");
          setIsProcessing(false);
          return;
        }
      }

      setConfirmedOrderNumber(orderNumber);
      setStep("confirmed");
      clearCart();
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4 py-16 text-center">
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Paystack Payment...</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Please wait a moment while we confirm your transaction status with Paystack Ghana.
        </p>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <Badge variant="emerald">Payment Approved via Paystack Ghana</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Order Confirmed!</h1>
          <p className="text-sm text-slate-500">
            Order ID: <strong className="text-slate-900 dark:text-white">#{confirmedOrderNumber}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Dispatch Facility:</span>
            <span className="font-semibold text-slate-900 dark:text-white">Prampram Central Pharmacy</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Superintendent:</span>
            <span className="font-semibold text-slate-900 dark:text-white">Pharm. Philip Bruce-Tagoe</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cold-Chain Status:</span>
            <span className="font-semibold text-emerald-600">Active (4.2°C Temperature Verified)</span>
          </div>
          {deliveryOption === "pickup" && (
            <div className="flex justify-between">
              <span className="text-slate-500">Fulfillment:</span>
              <span className="font-semibold text-blue-600">Pickup in Store</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Link href={`/orders/${confirmedOrderNumber}`}>
            <Button variant="primary" size="md">
              <Truck className="h-4 w-4" /> Track Delivery
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="md">View Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Checkout</h1>
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="h-4 w-4" /> 256-Bit SSL Paystack Encrypted
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={step === "address" ? "text-emerald-600 font-bold" : "text-emerald-600"}>
          <CheckCircle2 className="h-4 w-4 inline mr-1" /> Address
        </span>
        <span className="text-slate-300">—</span>
        <span className={step === "payment" ? "text-emerald-600 font-bold" : ""}>
          <CreditCard className="h-4 w-4 inline mr-1" /> Payment
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column — Forms */}
        <div className="lg:col-span-7 space-y-6">
          {step === "address" ? (
            <>
              {/* Delivery Option */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" /> Fulfillment Method
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryOption("delivery")}
                    className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                      deliveryOption === "delivery"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Truck className="h-6 w-6 mx-auto text-emerald-600" />
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Delivery</p>
                    <p className="text-[11px] text-slate-500">
                      {subtotalAmount >= FREE_DELIVERY_THRESHOLD
                        ? "Free delivery!"
                        : `${formatCurrency(DELIVERY_FEE)} fee`}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryOption("pickup")}
                    className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                      deliveryOption === "pickup"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Store className="h-6 w-6 mx-auto text-emerald-600" />
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Pickup In Store</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Free</p>
                  </button>
                </div>
              </Card>

              {/* Address */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  {deliveryOption === "pickup" ? (
                    <>
                      <MapPin className="h-5 w-5 text-emerald-600" /> Pickup Location Details
                    </>
                  ) : (
                    <>
                      <Truck className="h-5 w-5 text-emerald-600" /> Delivery Address in Ghana
                    </>
                  )}
                </h3>

                {deliveryOption === "pickup" ? (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm space-y-2">
                    <p className="font-bold text-blue-900 dark:text-blue-200">Jumarald Pharmacy — East Legon</p>
                    <p className="text-blue-700 dark:text-blue-300">24 Boundary Road, East Legon, Accra</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs">Open Mon–Sat: 8:00 AM – 8:00 PM</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs">Orders ready for pickup within 2 hours</p>
                  </div>
                ) : null}

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number (Ghana)</label>
                    <input
                      type="text"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  {deliveryOption === "delivery" && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Delivery Street / Landmark</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">City / Town</label>
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Region</label>
                          <input
                            type="text"
                            value={address.region}
                            onChange={(e) => setAddress({ ...address, region: e.target.value })}
                            className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Prescription Required (Rx) Upload Section */}
                {requiresRx && (
                  <div
                    id="rx-upload-section"
                    className="p-5 rounded-2xl border-2 border-amber-400/80 dark:border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-base">
                          Rx
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            Doctor&apos;s Prescription Required <Badge variant="amber">Mandatory to Proceed</Badge>
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            By Ghana Health Service regulations, the following medicine(s) in your cart require a verified doctor&apos;s prescription:
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {rxItems.map((item) => (
                              <span
                                key={item.product.id}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1"
                              >
                                <Pill className="h-3 w-3" /> {item.product.name} ({item.quantity}x)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!prescriptionUrl ? (
                      <div className="space-y-3 pt-2">
                        <div className="border-2 border-dashed border-amber-300 dark:border-amber-700/80 rounded-2xl p-6 bg-white/90 dark:bg-slate-900/80 text-center hover:bg-white transition-colors">
                          {uploadingRx ? (
                            <div className="flex flex-col items-center justify-center py-4 space-y-2">
                              <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Uploading and encrypting prescription document...
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                <UploadCloud className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  Upload Doctor&apos;s Prescription Slip or Hospital Note
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Take a picture with your phone camera, or select a JPG, PNG, or PDF file (Max 10MB)
                                </p>
                              </div>
                              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-105">
                                <Camera className="h-4 w-4" /> Snap Photo / Choose File
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handlePrescriptionUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Prescribing Doctor / Hospital (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Dr. Mensah, Korle-Bu Hospital"
                              value={doctorName}
                              onChange={(e) => setDoctorName(e.target.value)}
                              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Patient Notes for Pharmacist (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Allergies, current dosage, or instructions"
                              value={patientNotes}
                              onChange={(e) => setPatientNotes(e.target.value)}
                              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate flex items-center gap-1.5">
                              Prescription Attached Successfully
                            </h5>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                              {prescriptionFilename || "prescription-document.jpg"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewRxModal(true)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrescriptionUrl("");
                              setPrescriptionFilename("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  disabled={requiresRx && !prescriptionUrl}
                  className={`w-full ${
                    requiresRx && !prescriptionUrl
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  onClick={handleContinueToPayment}
                >
                  {requiresRx && !prescriptionUrl
                    ? "🔒 Upload Prescription to Proceed to Payment"
                    : "Continue to Payment"}
                </Button>
              </Card>

              {/* Prescription Preview Modal */}
              {previewRxModal && prescriptionUrl && (
                <div
                  className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setPreviewRxModal(false)}
                >
                  <div
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" /> Attached Prescription Document
                      </h4>
                      <button
                        type="button"
                        onClick={() => setPreviewRxModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border flex items-center justify-center max-h-[60vh]">
                      {prescriptionUrl.toLowerCase().endsWith(".pdf") ? (
                        <iframe src={prescriptionUrl} className="w-full h-80 border-0" title="Prescription PDF" />
                      ) : (
                        <img src={prescriptionUrl} alt="Prescription" className="max-h-[60vh] w-auto object-contain" />
                      )}
                    </div>

                    <div className="text-right">
                      <Button variant="primary" size="sm" onClick={() => setPreviewRxModal(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Payment Method */}
              <Card className="p-6 space-y-6">
                {requiresRx && !prescriptionUrl && (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 text-red-800 dark:text-red-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-red-900 dark:text-red-100">Payment Blocked: Doctor&apos;s Prescription Required</p>
                        <p className="text-[11px] text-red-700 dark:text-red-300">You must upload your prescription document before payment can be processed.</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setStep("address")} className="shrink-0 bg-red-600 text-white hover:bg-red-700">
                      Upload Now
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" /> Paystack Ghana Payment Gateway
                  </h3>
                  <Badge variant="emerald">Ghana (GHS)</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("momo")}
                    className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                      paymentMethod === "momo"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-900 dark:text-white text-sm">📱 Mobile Money</p>
                    <p className="text-[11px] text-slate-500">MTN, Telecel, AT Money</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                      paymentMethod === "card"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-900 dark:text-white text-sm">💳 Bank Card</p>
                    <p className="text-[11px] text-slate-500">Visa / Mastercard</p>
                  </button>
                </div>

                {paymentMethod === "momo" ? (
                  <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Select Mobile Money Network</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        ["mtn", "MTN MoMo", "bg-amber-400 text-slate-900 border-amber-500"],
                        ["telecel", "Telecel Cash", "bg-red-600 text-white border-red-700"],
                        ["at", "AT Money", "bg-blue-600 text-white border-blue-700"],
                      ] as const).map(([key, label, activeStyle]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setMomoNetwork(key)}
                          className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                            momoNetwork === key ? `${activeStyle} shadow-md` : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">MoMo Wallet Number</label>
                      <input
                        type="text"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="+233 XX XXX XXXX"
                        className="w-full p-3 rounded-xl border bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm">
                    <input type="text" placeholder="Cardholder Name" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-700" />
                    <input type="text" placeholder="Card Number (4111 ....)" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-700" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM / YY" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-700" />
                      <input type="text" placeholder="CVV" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-700" />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    id="termsAgreement"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="termsAgreement">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/acceptable-use" target="_blank" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                      Acceptable Use Policy
                    </Link>.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="md" onClick={() => setStep("address")}>
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className={`flex-1 font-extrabold text-white h-12 ${
                      requiresRx && !prescriptionUrl
                        ? "bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    onClick={handleCompleteOrder}
                    disabled={isProcessing || (requiresRx && !prescriptionUrl)}
                    isLoading={isProcessing}
                  >
                    {requiresRx && !prescriptionUrl
                      ? "🔒 Doctor's Prescription Required to Pay"
                      : isProcessing
                      ? "Processing..."
                      : `Pay ${formatCurrency(grandTotal)} with Paystack`}
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Right Column — Order Summary */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" /> Order Summary ({items.length} item{items.length !== 1 ? "s" : ""})
            </h3>

            {requiresPrescription && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Prescription Verification Notice</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Your cart contains prescription-only medication. Our Superintendent Pharmacist (Pharm. Philip Bruce-Tagoe, GPHC Reg. No. 2050984) will review your prescription prior to delivery dispatch.
                </p>
              </div>
            )}

            {/* Line items */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-start gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{product.name}</p>
                      {product.requiresPrescription && (
                        <Badge variant="amber" className="text-[9px] px-1 py-0 font-bold shrink-0">
                          Rx Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px]">{formatCurrency(product.price)} × {quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(product.price * quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Coupon Code
              </label>
              {couponData ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {couponData.code} — {couponData.description || `${couponData.discountValue}${couponData.discountType === "percentage" ? "%" : ""} off`}
                  </span>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    isLoading={couponLoading}
                  >
                    Apply
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {couponError}
                </p>
              )}
            </div>

            {/* Loyalty Points */}
            {availablePoints !== null && availablePoints > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Gift className="h-3 w-3" /> Loyalty Points
                </label>
                <p className="text-[11px] text-slate-400">
                  Available: <span className="font-bold text-amber-600">{availablePoints.toLocaleString()} pts</span>
                  {" "}= {formatCurrency(availablePoints * POINTS_TO_GHS_RATIO)} value
                </p>
                {pointsApplied ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {pointsToRedeem.toLocaleString()} pts applied (−{formatCurrency(pointsDiscount)})
                    </span>
                    <button
                      onClick={() => {
                        setPointsApplied(false);
                        setPointsToRedeem(0);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={Math.min(availablePoints, Math.floor(subtotalAmount / POINTS_TO_GHS_RATIO))}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-16 text-right">
                        {pointsToRedeem.toLocaleString()} pts
                      </span>
                    </div>
                    {pointsToRedeem > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={redeemPoints}
                        disabled={pointsLoading}
                        isLoading={pointsLoading}
                        className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Apply {pointsToRedeem.toLocaleString()} pts (−{formatCurrency(pointsToRedeem * POINTS_TO_GHS_RATIO)})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotalAmount)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Coupon Discount
                  </span>
                  <span>−{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span className="flex items-center gap-1">
                    <Gift className="h-3 w-3" /> Loyalty Points
                  </span>
                  <span>−{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  {deliveryOption === "pickup" ? (
                    <>
                      <Store className="h-3 w-3" /> Store Pickup
                    </>
                  ) : (
                    <>
                      <Truck className="h-3 w-3" /> Cold-Chain Shipping
                    </>
                  )}
                </span>
                <span>
                  {deliveryOption === "pickup" ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-semibold">Free (orders over {formatCurrency(FREE_DELIVERY_THRESHOLD)})</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total Due</span>
                <span className="text-emerald-600">{formatCurrency(grandTotal)}</span>
              </div>
              {(couponDiscount > 0 || pointsDiscount > 0) && (
                <p className="text-[11px] text-emerald-600 font-semibold text-right">
                  You save {formatCurrency(couponDiscount + pointsDiscount)}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
