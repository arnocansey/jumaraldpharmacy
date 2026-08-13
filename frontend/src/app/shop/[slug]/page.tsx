"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Star,
  ShieldAlert,
  CheckCircle,
  ArrowLeft,
  UploadCloud,
  Plus,
  Minus,
  AlertCircle,
  Truck,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  minStockAlert: number;
  requiresPrescription: boolean;
  isFeatured: boolean;
  images: string[];
  description: string;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  usageInstructions?: string;
  sideEffects?: string;
  warnings?: string;
  manufacturer?: string;
  category: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  rating: number;
  reviewCount: number;
  purchaseCount: number;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

function ProductDetailSkeleton() {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-10 animate-pulse">
      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="h-96 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-4">
            <div className="h-14 flex-1 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailError() {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10">
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            The product you are looking for does not exist or has been removed from our catalog.
          </p>
        </div>
        <Link href="/shop">
          <Button variant="primary">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "warnings" | "reviews">("details");
  const [selectedImage, setSelectedImage] = useState(0);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    apiFetch<Product>(`/products/${slug}`)
      .then((data) => {
        setProduct(data);
        setSelectedImage(0);
        setQuantity(1);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setAlternativesLoading(true);
    apiFetch<Product[]>(`/search/alternatives/${product.id}`)
      .then((data) => {
        setAlternatives(data || []);
        setAlternativesLoading(false);
      })
      .catch(() => {
        setAlternativesLoading(false);
      });
  }, [product]);

  useEffect(() => {
    if (!product || activeTab !== "reviews") return;
    setReviewsLoading(true);
    apiFetch<{ reviews: Review[]; hasMore: boolean }>(`/products/${product.id}/reviews?page=${reviewsPage}&limit=10`)
      .then((data) => {
        setReviews(data.reviews || []);
        setReviewsHasMore(data.hasMore);
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviewsLoading(false);
      });
  }, [product, activeTab, reviewsPage]);

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) return <ProductDetailError />;

  const inStock = product.stockQuantity > 0;
  const lowStock = inStock && product.stockQuantity <= (product.minStockAlert || 10);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart!`);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-10">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to Shop Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <Image
              src={product.images[selectedImage] || product.images[0] || "/placeholder.png"}
              alt={product.name}
              width={600}
              height={384}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
              className="h-96 w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedImage
                      ? "border-brand-600 ring-2 ring-brand-200"
                      : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" width={64} height={64} quality={80} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="emerald">{product.brand?.name || "Generic"}</Badge>
              <Badge variant="blue">{product.category?.name}</Badge>
              {product.requiresPrescription && <Badge variant="amber">Prescription Required</Badge>}
              {hasDiscount && <Badge variant="red">-{discountPct}% OFF</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                  />
                ))}
                <span className="ml-1 font-bold text-slate-900 dark:text-white">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{product.reviewCount} Reviews</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> {product.stockQuantity} in Stock
              </span>
            </div>
            {product.sku && (
              <p className="text-xs text-slate-400">SKU: {product.sku}</p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Unit Price</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-slate-400 line-through">
                      {formatCurrency(product.compareAtPrice!)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!inStock || quantity >= product.stockQuantity}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {lowStock && (
              <p className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Only {product.stockQuantity} items left — order soon
              </p>
            )}
          </div>

          {product.requiresPrescription && (
            <Card glass className="p-4 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <p className="font-bold">Doctor&apos;s Prescription Required</p>
                <p>This medication requires verification by our pharmacist before fulfillment.</p>
              </div>
            </Card>
          )}

          {product.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {inStock ? `Add to Cart — ${formatCurrency(product.price * quantity)}` : "Out of Stock"}
            </Button>
            {product.requiresPrescription && (
              <Link href="/prescriptions/upload">
                <Button variant="glass" size="lg">
                  <UploadCloud className="h-5 w-5 text-brand-600" /> Upload Rx
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <Truck className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delivery</span>
              <span className="text-[10px] text-slate-400">2-4 hours</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quality</span>
              <span className="text-[10px] text-slate-400">FDA Approved</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Returns</span>
              <span className="text-[10px] text-slate-400">Policy applies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 text-sm font-bold overflow-x-auto">
          {(["details", "warnings", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 whitespace-nowrap transition-colors ${
                activeTab === tab ? "border-b-2 border-brand-600 text-brand-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "details" && "Clinical Specifications & Dosage"}
              {tab === "warnings" && "Contraindications & Side Effects"}
              {tab === "reviews" && `Patient Reviews (${product.reviewCount})`}
            </button>
          ))}
        </div>

        <Card className="p-6">
          {activeTab === "details" && (
            <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300">
              {product.dosageForm && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Dosage Form</h4>
                  <p className="mt-1">{product.dosageForm}</p>
                </div>
              )}
              {product.strength && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Strength</h4>
                  <p className="mt-1">{product.strength}</p>
                </div>
              )}
              {product.activeIngredients && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Active Ingredients</h4>
                  <p className="mt-1">{product.activeIngredients}</p>
                </div>
              )}
              {product.usageInstructions && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Usage Instructions</h4>
                  <p className="mt-1">{product.usageInstructions}</p>
                </div>
              )}
              {product.manufacturer && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Manufacturer</h4>
                  <p className="mt-1">{product.manufacturer}</p>
                </div>
              )}
              {!product.dosageForm && !product.strength && !product.activeIngredients && !product.usageInstructions && !product.manufacturer && (
                <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
                  <Info className="h-5 w-5" />
                  <p>No clinical specifications available for this product.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "warnings" && (
            <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300">
              {product.warnings && (
                <div>
                  <h4 className="font-bold text-red-600">Warnings & Contraindications</h4>
                  <p className="mt-1">{product.warnings}</p>
                </div>
              )}
              {product.sideEffects && (
                <div>
                  <h4 className="font-bold text-amber-600">Possible Side Effects</h4>
                  <p className="mt-1">{product.sideEffects}</p>
                </div>
              )}
              {!product.warnings && !product.sideEffects && (
                <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
                  <Info className="h-5 w-5" />
                  <p>No contraindications or side effects information available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold">
                  ⭐ {product.rating.toFixed(1)} out of 5 based on {product.reviewCount} verified reviews
                </div>
              </div>

              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 animate-pulse space-y-2">
                      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {review.user.firstName} {review.user.lastName?.charAt(0)}.
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))}

                  {reviewsHasMore && (
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setReviewsPage((p) => p + 1)}
                    >
                      Load More Reviews
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No reviews yet. Be the first to review this product.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {alternativesLoading ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse space-y-3">
                <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : alternatives.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {alternatives.map((alt) => (
              <Link key={alt.id} href={`/shop/${alt.slug}`}>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group cursor-pointer space-y-3">
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-50">
                    <Image
                      src={alt.images[0] || "/placeholder.png"}
                      alt={alt.name}
                      width={300}
                      height={128}
                      quality={80}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">{alt.category?.name}</p>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {alt.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= Math.round(alt.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">{formatCurrency(alt.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
