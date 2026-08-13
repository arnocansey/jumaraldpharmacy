"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketContext } from "@/app/providers";
import { toast } from "sonner";

export function useSocketAutoInvalidate() {
  const queryClient = useQueryClient();
  const socket = useSocketContext();

  useEffect(() => {
    if (!socket.isConnected) return;

    const handleOrderUpdated = (order: any) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (order?.orderNumber || order?.status) {
        toast.info(`Order #${order.orderNumber || ""} status updated: ${order.status}`);
      }
    };

    const handlePrescriptionUpdated = (prescription: any) => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (prescription?.status) {
        toast.info(`Prescription status updated: ${prescription.status}`);
      }
    };

    const handleInventoryUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    };

    socket.on("order_updated", handleOrderUpdated);
    socket.on("prescription_updated", handlePrescriptionUpdated);
    socket.on("inventory_updated", handleInventoryUpdated);

    return () => {
      socket.off("order_updated", handleOrderUpdated);
      socket.off("prescription_updated", handlePrescriptionUpdated);
      socket.off("inventory_updated", handleInventoryUpdated);
    };
  }, [socket.isConnected, socket, queryClient]);
}
