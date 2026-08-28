"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  isFeatured?: boolean;
  images: string[];
  description?: string;
  category: Category;
  brand?: { id: string; name: string; slug: string };
  rating?: number;
  reviewCount?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}

export function useCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/products/categories"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductsQuery(params: {
  category?: string;
  search?: string;
  sort?: string;
  sortBy?: string;
  prescriptionOnly?: boolean;
  requiresPrescription?: boolean;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
  minPrice?: string | number;
  maxPrice?: string | number;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy || params.sort) searchParams.set("sortBy", params.sortBy || params.sort || "createdAt");
  if (params.prescriptionOnly || params.requiresPrescription) searchParams.set("requiresPrescription", "true");
  if (params.inStockOnly) searchParams.set("inStockOnly", "true");
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.minPrice) searchParams.set("minPrice", String(params.minPrice));
  if (params.maxPrice) searchParams.set("maxPrice", String(params.maxPrice));

  const queryString = searchParams.toString();

  return useQuery<ProductsResponse>({
    queryKey: ["products", queryString],
    queryFn: async () => {
      const data = await apiFetch<ProductsResponse | Product[]>(`/products?${queryString}`);
      if (Array.isArray(data)) {
        return { products: data, pagination: { total: data.length, page: params.page || 1, pages: 1 } };
      }
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
