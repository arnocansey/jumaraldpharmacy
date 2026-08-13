"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketContext } from "@/app/providers";
import { toast } from "sonner";

export function useAdminSocketAutoInvalidate() {
  const queryClient = useQueryClient();
  const socket = useSocketContext();

  useEffect(() => {
    if (!socket.isConnected) return;

    const handleOrderCreated = (order: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`New order received! #${order?.orderNumber || ""}`);
    };

    const handleOrderUpdated = (order: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    };

    const handlePrescriptionUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    };

    const handleAuditLogCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    };

    const handleInventoryUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    };

    socket.on("order_created", handleOrderCreated);
    socket.on("order_updated", handleOrderUpdated);
    socket.on("prescription_updated", handlePrescriptionUpdated);
    socket.on("audit_log_created", handleAuditLogCreated);
    socket.on("inventory_updated", handleInventoryUpdated);

    return () => {
      socket.off("order_created", handleOrderCreated);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("prescription_updated", handlePrescriptionUpdated);
      socket.off("audit_log_created", handleAuditLogCreated);
      socket.off("inventory_updated", handleInventoryUpdated);
    };
  }, [socket.isConnected, socket, queryClient]);
}
