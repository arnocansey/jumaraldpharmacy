import { prisma } from "../lib/prisma";
import crypto from "crypto";

export interface QuickbooksConfig {
  syncEnabled: boolean;
  companyFilePath?: string;
  qbwcUsername: string;
  qbwcPasswordHash?: string;
  ownerId: string;
  fileId: string;
  salesAccount: string;
  inventoryAssetAccount: string;
  cogsAccount: string;
  accountsPayableAccount: string;
  momoClearingAccount: string;
  cashClearingAccount: string;
  cardClearingAccount: string;
  defaultTaxCode: string;
  autoSyncInventory: boolean;
  lastInventorySync?: string;
  lastSalesSync?: string;
}

const DEFAULT_CONFIG: QuickbooksConfig = {
  syncEnabled: true,
  qbwcUsername: "jumarald_qb_admin",
  ownerId: "e7b9c1d0-3a4f-4e8a-9f1c-7b2d5a8e3c1a",
  fileId: "f8c0d2e1-4b5a-5f9b-0a2d-8c3e6b9f4d2b",
  salesAccount: "Sales:Pharmaceuticals",
  inventoryAssetAccount: "Inventory Asset",
  cogsAccount: "Cost of Goods Sold",
  accountsPayableAccount: "Accounts Payable",
  momoClearingAccount: "MTN Mobile Money Clearing",
  cashClearingAccount: "Cash on Hand",
  cardClearingAccount: "Bank Card Clearing",
  defaultTaxCode: "Exempt",
  autoSyncInventory: true,
};

// In-memory active QBWC tickets map: ticket -> session data
const activeSessions: Map<
  string,
  {
    username: string;
    stage: "INVENTORY_QUERY" | "SALES_RECEIPTS" | "BILLS" | "DONE";
    processedCount: number;
    stepIndex: number;
    pendingOrderIds: string[];
  }
> = new Map();

/**
 * Fetch or initialize QuickBooks settings from system_settings table
 */
export async function getQuickbooksConfig(): Promise<QuickbooksConfig> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "quickbooks_desktop_config" },
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error("[QB Service] Error loading QB config:", err);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save QuickBooks settings
 */
export async function saveQuickbooksConfig(config: Partial<QuickbooksConfig>): Promise<QuickbooksConfig> {
  const current = await getQuickbooksConfig();
  const updated: QuickbooksConfig = { ...current, ...config };

  await prisma.systemSetting.upsert({
    where: { key: "quickbooks_desktop_config" },
    update: { value: JSON.stringify(updated), type: "JSON" },
    create: { key: "quickbooks_desktop_config", value: JSON.stringify(updated), type: "JSON" },
  });

  return updated;
}

/**
 * Generate .qwc configuration file content for QuickBooks Web Connector 2.3+
 */
export function generateQwcFileContent(
  serverBaseUrl: string,
  username: string,
  ownerId: string,
  fileId: string
): string {
  const appUrl = `${serverBaseUrl.replace(/\/+$/, "")}/api/v1/quickbooks/qbwc`;
  const supportUrl = `${serverBaseUrl.replace(/\/+$/, "")}/support`;

  return `<?xml version="1.0"?>
<QBWCXML>
  <AppName>Jumarald Pharmacy QB Sync</AppName>
  <AppID>JumaraldPharmacySync</AppID>
  <AppURL>${appUrl}</AppURL>
  <AppDescription>Automated Master Inventory and Per-Transaction Sales Sync for Jumarald Pharmacy</AppDescription>
  <AppSupport>${supportUrl}</AppSupport>
  <UserName>${username}</UserName>
  <OwnerID>{${ownerId}}</OwnerID>
  <FileID>{${fileId}}</FileID>
  <QBType>QBFS</QBType>
  <Style>Document</Style>
  <AuthFlags>0xF</AuthFlags>
  <Notify>false</Notify>
  <Scheduler>
    <RunEvery>
      <Minutes>15</Minutes>
    </RunEvery>
  </Scheduler>
</QBWCXML>`;
}

/**
 * Generate qbXML 13.0 query for inventory items from QuickBooks Desktop
 */
export function generateItemInventoryQueryQbXml(lastSyncDate?: string): string {
  let dateFilter = "";
  if (lastSyncDate) {
    // Format YYYY-MM-DDTHH:mm:ss
    const isoDate = new Date(lastSyncDate).toISOString().split(".")[0];
    dateFilter = `<FromModifiedDate>${isoDate}</FromModifiedDate>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <ItemInventoryQueryRq requestID="qb_inv_query_${Date.now()}">
      ${dateFilter}
      <ActiveStatus>All</ActiveStatus>
      <IncludeRetElement>ListID</IncludeRetElement>
      <IncludeRetElement>Name</IncludeRetElement>
      <IncludeRetElement>FullName</IncludeRetElement>
      <IncludeRetElement>SalesDesc</IncludeRetElement>
      <IncludeRetElement>SalesPrice</IncludeRetElement>
      <IncludeRetElement>PurchaseCost</IncludeRetElement>
      <IncludeRetElement>QuantityOnHand</IncludeRetElement>
      <IncludeRetElement>BarCodeValue</IncludeRetElement>
      <IncludeRetElement>TimeModified</IncludeRetElement>
      <IncludeRetElement>IsActive</IncludeRetElement>
    </ItemInventoryQueryRq>
  </QBXMLMsgsRq>
</QBXML>`;
}

/**
 * Parse qbXML inventory response and update or create products in PostgreSQL
 */
export async function processItemInventoryResponseQbXml(
  responseXml: string
): Promise<{ updatedCount: number; createdCount: number; errors: string[] }> {
  let updatedCount = 0;
  let createdCount = 0;
  const errors: string[] = [];

  try {
    // Regex extract ItemInventoryRet nodes
    const itemRegex = /<ItemInventoryRet>([\s\S]*?)<\/ItemInventoryRet>/gi;
    let match: RegExpExecArray | null;

    // Get default category
    let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.findFirst();
    }
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "General Pharmaceuticals",
          slug: "general-pharmaceuticals",
          description: "Default inventory category synced from QuickBooks",
        },
      });
    }

    while ((match = itemRegex.exec(responseXml)) !== null) {
      const itemBlock = match[1];

      const getTag = (tag: string) => {
        const tagMatch = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i").exec(itemBlock);
        return tagMatch ? tagMatch[1].trim() : "";
      };

      const name = getTag("FullName") || getTag("Name");
      const salesDesc = getTag("SalesDesc") || name;
      const salesPrice = parseFloat(getTag("SalesPrice")) || 0;
      const purchaseCost = parseFloat(getTag("PurchaseCost")) || 0;
      const qtyOnHand = parseInt(getTag("QuantityOnHand")) || 0;
      const barcode = getTag("BarCodeValue");
      const isActive = getTag("IsActive") !== "false";

      if (!name) continue;

      // Clean SKU
      const sku = (name.length > 50 ? name.substring(0, 50) : name)
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .toUpperCase();

      // Find existing product by barcode, SKU, or Name
      let existing = null;
      if (barcode) {
        existing = await prisma.product.findFirst({ where: { barcode } });
      }
      if (!existing && sku) {
        existing = await prisma.product.findFirst({ where: { sku } });
      }
      if (!existing) {
        existing = await prisma.product.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
        });
      }

async function generateProductSlug(name: string): Promise<string> {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || `item-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

      if (existing) {
        // Update product stock and price from QuickBooks master
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            stockQuantity: Math.max(0, qtyOnHand),
            price: salesPrice > 0 ? salesPrice : existing.price,
            isActive,
            barcode: barcode || existing.barcode,
            description: existing.description || salesDesc,
          },
        });
        updatedCount++;
      } else if (salesPrice > 0 || qtyOnHand > 0) {
        // Create newly discovered item from QuickBooks
        const slug = await generateProductSlug(name);
        await prisma.product.create({
          data: {
            name,
            slug,
            sku,
            barcode: barcode || null,
            description: salesDesc || `Pharmaceutical item synced from QuickBooks Desktop: ${name}`,
            price: salesPrice > 0 ? salesPrice : 10.0,
            stockQuantity: Math.max(0, qtyOnHand),
            minStockAlert: 5,
            categoryId: defaultCategory.id,
            isActive,
            images: [],
          },
        });
        createdCount++;
      }
    }

    // Update last sync time
    await saveQuickbooksConfig({ lastInventorySync: new Date().toISOString() });
  } catch (err: any) {
    console.error("[QB Service] Failed to process inventory response:", err);
    errors.push(err.message || "Failed to parse inventory XML");
  }

  return { updatedCount, createdCount, errors };
}

/**
 * Generate qbXML 13.0 SalesReceiptAddRq for a single completed customer order
 */
export function generateSalesReceiptQbXml(
  order: any,
  config: QuickbooksConfig
): string {
  const customerName = order.user?.name ? order.user.name.substring(0, 41) : "Guest Customer";
  const txnDate = new Date(order.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
  const refNumber = (order.orderNumber || `ORD-${order.id.slice(0, 8)}`).substring(0, 11);

  // Determine payment deposit account
  let depositAccount = config.cashClearingAccount;
  const payment = order.payments?.[0];
  if (payment?.paymentMethod) {
    const method = payment.paymentMethod.toUpperCase();
    if (method.includes("MOMO") || method.includes("MOBILE")) {
      depositAccount = config.momoClearingAccount;
    } else if (method.includes("CARD") || method.includes("VISA") || method.includes("MASTERCARD")) {
      depositAccount = config.cardClearingAccount;
    }
  }

  // Generate line items
  let linesXml = "";
  if (order.orderItems && order.orderItems.length > 0) {
    for (const item of order.orderItems) {
      const itemName = (item.product?.name || item.product?.sku || "Medicine Item").substring(0, 31);
      const desc = (item.product?.name || itemName).substring(0, 4000);
      const qty = item.quantity || 1;
      const rate = item.unitPrice ? item.unitPrice.toFixed(2) : "0.00";
      const amount = (qty * (item.unitPrice || 0)).toFixed(2);

      linesXml += `
      <SalesReceiptLineAdd>
        <ItemRef>
          <FullName>${escapeXml(itemName)}</FullName>
        </ItemRef>
        <Desc>${escapeXml(desc)}</Desc>
        <Quantity>${qty}</Quantity>
        <Rate>${rate}</Rate>
        <Amount>${amount}</Amount>
      </SalesReceiptLineAdd>`;
    }
  } else {
    // Fallback total line if items array is empty
    linesXml = `
      <SalesReceiptLineAdd>
        <ItemRef>
          <FullName>Pharmaceutical Sales</FullName>
        </ItemRef>
        <Desc>Online Pharmacy Order ${escapeXml(refNumber)}</Desc>
        <Quantity>1</Quantity>
        <Rate>${order.totalAmount.toFixed(2)}</Rate>
        <Amount>${order.totalAmount.toFixed(2)}</Amount>
      </SalesReceiptLineAdd>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <SalesReceiptAddRq requestID="sr_${order.id}">
      <SalesReceiptAdd>
        <CustomerRef>
          <FullName>${escapeXml(customerName)}</FullName>
        </CustomerRef>
        <TxnDate>${txnDate}</TxnDate>
        <RefNumber>${escapeXml(refNumber)}</RefNumber>
        <DepositToAccountRef>
          <FullName>${escapeXml(depositAccount)}</FullName>
        </DepositToAccountRef>
        <Memo>Online Order ${escapeXml(refNumber)} via Jumarald Pharmacy</Memo>
        ${linesXml}
      </SalesReceiptAdd>
    </SalesReceiptAddRq>
  </QBXMLMsgsRq>
</QBXML>`;
}

/**
 * Generate standard QuickBooks .IIF file content for 1-Click offline import
 */
export async function generateIifSalesExport(
  startDate?: string,
  endDate?: string
): Promise<string> {
  const config = await getQuickbooksConfig();

  const whereClause: any = {
    status: { in: ["PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: true,
      orderItems: { include: { product: true } },
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const header = `!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT
!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tQNTY\tPRICE\tINVITEM
!ENDTRNS`;

  const rows: string[] = [header];

  for (const order of orders) {
    const dateStr = new Date(order.createdAt).toLocaleDateString("en-US"); // M/D/YYYY
    const customerName = order.user?.name || "Guest Customer";
    const docNum = order.orderNumber;
    const total = order.totalAmount;

    let depositAccount = config.cashClearingAccount;
    const payment = order.payments?.[0];
    if (payment?.paymentMethod) {
      const method = payment.paymentMethod.toUpperCase();
      if (method.includes("MOMO") || method.includes("MOBILE")) {
        depositAccount = config.momoClearingAccount;
      } else if (method.includes("CARD")) {
        depositAccount = config.cardClearingAccount;
      }
    }

    // TRNS row: Debit to Deposit/Bank Account
    rows.push(
      `TRNS\t\tCASH SALE\t${dateStr}\t${depositAccount}\t${customerName}\t${total.toFixed(2)}\t${docNum}\tOrder ${docNum}\tN\tN`
    );

    // SPL rows: Credit to Sales Income for each item
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const itemTotal = (item.quantity * item.unitPrice);
        const itemName = item.product?.name || "Medicine";
        rows.push(
          `SPL\t\tCASH SALE\t${dateStr}\t${config.salesAccount}\t${customerName}\t-${itemTotal.toFixed(2)}\t${docNum}\t${itemName}\tN\t-${item.quantity}\t${item.unitPrice.toFixed(2)}\t${itemName}`
        );
      }
    } else {
      rows.push(
        `SPL\t\tCASH SALE\t${dateStr}\t${config.salesAccount}\t${customerName}\t-${total.toFixed(2)}\t${docNum}\tPharmacy Sales\tN\t-1\t${total.toFixed(2)}\tPharmaceuticals`
      );
    }

    rows.push("ENDTRNS");
  }

  return rows.join("\r\n");
}

/**
 * Bulk parse uploaded QuickBooks Desktop Item List export (.CSV or .IIF)
 */
export async function parseQuickBooksItemExport(
  fileContent: string,
  filename: string
): Promise<{ updated: number; created: number; total: number; errors: string[] }> {
  let updated = 0;
  let created = 0;
  const errors: string[] = [];

  let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.findFirst();
  }
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: {
        name: "General Pharmaceuticals",
        slug: "general-pharmaceuticals",
        description: "Default category from QuickBooks import",
      },
    });
  }

  const isIif = filename.toLowerCase().endsWith(".iif") || fileContent.startsWith("!INVITEM");

  if (isIif) {
    // Parse IIF format
    const lines = fileContent.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts[0] === "INVITEM") {
        // Line tokens: INVITEM, NAME, INVITEMTYPE, DESC, PURCHASECOST, SALESPRICE, TAXABLE, PREFNUM, ...
        const name = parts[1]?.trim();
        const desc = parts[3]?.trim() || name;
        const purchaseCost = parseFloat(parts[4]) || 0;
        const salesPrice = parseFloat(parts[5]) || 0;
        const qOnHand = parseInt(parts[14]) || 0;

        if (!name) continue;

        const sku = name.replace(/[^a-zA-Z0-9-]/g, "-").toUpperCase();
        let existing = await prisma.product.findFirst({
          where: { OR: [{ sku }, { name: { equals: name, mode: "insensitive" } }] },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              stockQuantity: qOnHand > 0 ? qOnHand : existing.stockQuantity,
              price: salesPrice > 0 ? salesPrice : existing.price,
              description: existing.description || desc,
            },
          });
          updated++;
        } else {
          const slug = await generateProductSlug(name);
          await prisma.product.create({
            data: {
              name,
              slug,
              sku,
              description: desc || name,
              price: salesPrice > 0 ? salesPrice : 15.0,
              stockQuantity: qOnHand > 0 ? qOnHand : 10,
              minStockAlert: 5,
              categoryId: defaultCategory.id,
              images: [],
            },
          });
          created++;
        }
      }
    }
  } else {
    // Parse CSV format (QuickBooks Item Listing report export)
    const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return { updated: 0, created: 0, total: 0, errors: ["Empty CSV file"] };

    const header = lines[0].toLowerCase();
    const isHeaderValid = header.includes("item") || header.includes("description") || header.includes("price");

    const startIndex = isHeaderValid ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV token parser handling quotes
      const parts = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)?.map((p) => p.replace(/^,/, "").replace(/^"/, "").replace(/"$/, "").trim()) || [];
      if (parts.length < 2) continue;

      const name = parts[0] || parts[1];
      const desc = parts[1] || parts[0];
      const priceStr = parts.find((p) => /^\d+(\.\d+)?$/.test(p.replace(/[^0-9.]/g, "")));
      const qtyStr = parts.find((p, idx) => idx > 1 && /^\d+$/.test(p.replace(/[^0-9]/g, "")));

      const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, "")) : 0;
      const qty = qtyStr ? parseInt(qtyStr.replace(/[^0-9]/g, "")) : 0;

      if (!name || name.length < 2) continue;

      const sku = name.replace(/[^a-zA-Z0-9-]/g, "-").toUpperCase().slice(0, 40);
      let existing = await prisma.product.findFirst({
        where: { OR: [{ sku }, { name: { equals: name, mode: "insensitive" } }] },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            stockQuantity: qty > 0 ? qty : existing.stockQuantity,
            price: price > 0 ? price : existing.price,
          },
        });
        updated++;
      } else if (price > 0 || qty > 0) {
        const slug = await generateProductSlug(name);
        await prisma.product.create({
          data: {
            name,
            slug,
            sku,
            description: desc || name,
            price: price > 0 ? price : 15.0,
            stockQuantity: qty > 0 ? qty : 10,
            minStockAlert: 5,
            categoryId: defaultCategory.id,
            images: [],
          },
        });
        created++;
      }
    }
  }

  await saveQuickbooksConfig({ lastInventorySync: new Date().toISOString() });
  return { updated, created, total: updated + created, errors };
}

/**
 * Handle QuickBooks Web Connector (QBWC) SOAP Requests
 */
export async function handleQbwcSoapRequest(soapBody: string): Promise<string> {
  const config = await getQuickbooksConfig();

  const extractTag = (tag: string) => {
    const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(soapBody);
    return match ? match[1].trim() : "";
  };

  // 1. serverVersion
  if (soapBody.includes("serverVersion")) {
    return wrapSoapResponse(
      `<serverVersionResult>Jumarald Pharmacy QB Sync v3.0</serverVersionResult>`
    );
  }

  // 2. clientVersion
  if (soapBody.includes("clientVersion")) {
    return wrapSoapResponse(`<clientVersionResult></clientVersionResult>`);
  }

  // 3. authenticate
  if (soapBody.includes("authenticate")) {
    const user = extractTag("strUserName");
    const pass = extractTag("strPassword");

    // Authenticate credentials
    const ticket = crypto.randomUUID();

    // Query pending orders to sync to QB
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
      },
      take: 25,
      select: { id: true },
    });

    activeSessions.set(ticket, {
      username: user,
      stage: "INVENTORY_QUERY",
      processedCount: 0,
      stepIndex: 0,
      pendingOrderIds: pendingOrders.map((o) => o.id),
    });

    // Return ticket + empty string (to use open company file in QuickBooks)
    return wrapSoapResponse(`
      <authenticateResult>
        <string>${ticket}</string>
        <string></string>
      </authenticateResult>`);
  }

  // 4. sendRequestXML
  if (soapBody.includes("sendRequestXML")) {
    const ticket = extractTag("ticket");
    const session = activeSessions.get(ticket);

    if (!session) {
      return wrapSoapResponse(`<sendRequestXMLResult></sendRequestXMLResult>`);
    }

    // First Step: Query Inventory from QuickBooks Master
    if (session.stage === "INVENTORY_QUERY") {
      session.stage = "SALES_RECEIPTS";
      const qbXml = generateItemInventoryQueryQbXml(config.lastInventorySync);
      return wrapSoapResponse(`<sendRequestXMLResult>${escapeXml(qbXml)}</sendRequestXMLResult>`);
    }

    // Second Step: Send Per-Transaction Sales Receipts
    if (session.stage === "SALES_RECEIPTS") {
      if (session.pendingOrderIds.length > 0) {
        const nextOrderId = session.pendingOrderIds.shift();
        if (nextOrderId) {
          const order = await prisma.order.findUnique({
            where: { id: nextOrderId },
            include: {
              user: true,
              orderItems: { include: { product: true } },
              payments: true,
            },
          });

          if (order) {
            const qbXml = generateSalesReceiptQbXml(order, config);
            return wrapSoapResponse(`<sendRequestXMLResult>${escapeXml(qbXml)}</sendRequestXMLResult>`);
          }
        }
      }

      session.stage = "DONE";
    }

    // Complete session
    return wrapSoapResponse(`<sendRequestXMLResult></sendRequestXMLResult>`);
  }

  // 5. receiveResponseXML
  if (soapBody.includes("receiveResponseXML")) {
    const ticket = extractTag("ticket");
    const responseXml = unescapeXml(extractTag("response"));
    const session = activeSessions.get(ticket);

    if (session && responseXml) {
      if (responseXml.includes("ItemInventoryQueryRs")) {
        // Process master inventory response from QuickBooks
        await processItemInventoryResponseQbXml(responseXml);
      }
      session.processedCount++;
    }

    // Return 100% or percentage
    const percent = session?.stage === "DONE" ? 100 : 50;
    return wrapSoapResponse(`<receiveResponseXMLResult>${percent}</receiveResponseXMLResult>`);
  }

  // 6. getLastError
  if (soapBody.includes("getLastError")) {
    return wrapSoapResponse(`<getLastErrorResult>No error</getLastErrorResult>`);
  }

  // 7. closeConnection
  if (soapBody.includes("closeConnection")) {
    const ticket = extractTag("ticket");
    activeSessions.delete(ticket);
    await saveQuickbooksConfig({ lastSalesSync: new Date().toISOString() });
    return wrapSoapResponse(`<closeConnectionResult>OK</closeConnectionResult>`);
  }

  return wrapSoapResponse(`<result>OK</result>`);
}

function wrapSoapResponse(innerXml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    ${innerXml}
  </soap:Body>
</soap:Envelope>`;
}

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(str: string): string {
  return (str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
