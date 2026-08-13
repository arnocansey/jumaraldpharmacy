"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useAdminUsersQuery(params: { page?: number; role?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.role) searchParams.set("role", params.role);
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();

  return useQuery({
    queryKey: ["admin-users", queryString],
    queryFn: () => apiFetch<{ users: any[]; pagination: { total: number; page: number; pages: number } }>(`/users?${queryString}`),
    staleTime: 60 * 1000,
  });
}

export function useAdminAuditLogsQuery(params: { page?: number; action?: string; entity?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.action) searchParams.set("action", params.action);
  if (params.entity) searchParams.set("entity", params.entity);

  const queryString = searchParams.toString();

  return useQuery({
    queryKey: ["admin-audit-logs", queryString],
    queryFn: () => apiFetch<{ logs: any[]; total: number; page: number; pages: number }>(`/audit?${queryString}`),
    staleTime: 30 * 1000,
  });
}
