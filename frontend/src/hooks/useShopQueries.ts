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
  prescriptionOnly?: boolean;
  inStockOnly?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.prescriptionOnly) searchParams.set("prescription", "true");
  if (params.inStockOnly) searchParams.set("inStock", "true");

  const queryString = searchParams.toString();

  return useQuery<ProductsResponse>({
    queryKey: ["products", queryString],
    queryFn: async () => {
      const data = await apiFetch<ProductsResponse | Product[]>(`/products?${queryString}`);
      if (Array.isArray(data)) {
        return { products: data, pagination: { total: data.length, page: 1, pages: 1 } };
      }
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
