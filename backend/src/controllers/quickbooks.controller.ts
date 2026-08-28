import { Request, Response } from "express";
import {
  getQuickbooksConfig,
  saveQuickbooksConfig,
  generateQwcFileContent,
  handleQbwcSoapRequest,
  generateIifSalesExport,
  parseQuickBooksItemExport,
} from "../services/quickbooks.service";
import { prisma } from "../lib/prisma";

/**
 * Handle QuickBooks Web Connector (QBWC) SOAP requests
 */
export async function handleQbwcSoap(req: Request, res: Response) {
  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const soapResponse = await handleQbwcSoapRequest(rawBody);

    res.set("Content-Type", "text/xml; charset=utf-8");
    return res.send(soapResponse);
  } catch (err: any) {
    console.error("[QB Controller] QBWC SOAP Error:", err);
    res.set("Content-Type", "text/xml; charset=utf-8");
    return res.status(500).send(`<?xml version="1.0"?><soap:Envelope><soap:Body><soap:Fault><faultstring>${err.message || "SOAP Error"}</faultstring></soap:Fault></soap:Body></soap:Envelope>`);
  }
}

/**
 * Download .qwc file for 1-Click QuickBooks Web Connector setup
 */
export async function downloadQwcFile(req: Request, res: Response) {
  try {
    const config = await getQuickbooksConfig();
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const qwcXml = generateQwcFileContent(
      baseUrl,
      config.qbwcUsername,
      config.ownerId,
      config.fileId
    );

    res.setHeader("Content-Disposition", 'attachment; filename="jumarald_quickbooks.qwc"');
    res.setHeader("Content-Type", "application/x-qwc; charset=utf-8");
    return res.send(qwcXml);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to generate .qwc file" });
  }
}

/**
 * Get QuickBooks GL Account Mappings & Sync Configuration
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const config = await getQuickbooksConfig();
    return res.json(config);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to load QB settings" });
  }
}

/**
 * Update QuickBooks GL Account Mappings & Settings
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const updated = await saveQuickbooksConfig(req.body);
    return res.json({ message: "QuickBooks settings updated successfully", config: updated });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to save QB settings" });
  }
}

/**
 * Get Comprehensive Sync Status & Transaction Queue
 */
export async function getSyncStatus(req: Request, res: Response) {
  try {
    const config = await getQuickbooksConfig();

    const [totalProducts, inStockCount, totalOrders, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stockQuantity: { gt: 0 } } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          payments: { select: { paymentMethod: true, status: true } },
          orderItems: { select: { quantity: true, unitPrice: true, product: { select: { name: true, sku: true } } } },
        },
      }),
    ]);

    // Format transaction queue
    const transactions = recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || "Guest Customer",
      totalAmount: o.totalAmount,
      itemCount: o.orderItems.length,
      paymentMethod: o.payments?.[0]?.paymentMethod || "Cash/MoMo",
      status: o.status,
      qbStatus: o.status === "DELIVERED" || o.status === "SHIPPED" || o.status === "PROCESSING" ? "SYNCED" : "PENDING",
      createdAt: o.createdAt,
    }));

    return res.json({
      config,
      stats: {
        totalProducts,
        inStockCount,
        outOfStockCount: totalProducts - inStockCount,
        totalOrders,
        lastInventorySync: config.lastInventorySync || null,
        lastSalesSync: config.lastSalesSync || null,
      },
      transactions,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to fetch QB sync status" });
  }
}

/**
 * Trigger immediate sync queue
 */
export async function triggerSyncNow(req: Request, res: Response) {
  try {
    await saveQuickbooksConfig({ lastSalesSync: new Date().toISOString() });
    return res.json({
      message: "Sync queue activated. Open QuickBooks Web Connector on your Windows PC and click 'Update Selected' to sync immediately.",
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to trigger sync" });
  }
}

/**
 * Import QuickBooks Desktop exported Item List (.CSV or .IIF)
 */
export async function importItemsFile(req: Request, res: Response) {
  try {
    const { fileContent, filename } = req.body;
    if (!fileContent) {
      return res.status(400).json({ message: "fileContent is required" });
    }

    const result = await parseQuickBooksItemExport(fileContent, filename || "items.csv");
    return res.json({
      message: `QuickBooks inventory processed! Updated ${result.updated} items, created ${result.created} new items.`,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to import items" });
  }
}

/**
 * Export 1-Click .IIF file for QuickBooks Desktop offline import
 */
export async function exportIifFile(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const iifContent = await generateIifSalesExport(startDate, endDate);

    const filename = `jumarald_sales_${new Date().toISOString().split("T")[0]}.iif`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/x-iif; charset=utf-8");
    return res.send(iifContent);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to export .IIF file" });
  }
}
