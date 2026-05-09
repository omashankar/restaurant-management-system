import { ObjectId } from "mongodb";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount, currency) {
  const code = String(currency || "INR").toUpperCase();
  const value = Number(amount || 0);
  return `${code} ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function splitText(value, maxLength = 70) {
  const text = String(value || "").trim();
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function loadLogoImage(doc, logoUrl) {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    const bytes = await res.arrayBuffer();
    if (contentType.includes("png")) return doc.embedPng(bytes);
    if (contentType.includes("jpg") || contentType.includes("jpeg")) return doc.embedJpg(bytes);
    // Try PNG first then JPG when content-type is missing.
    try {
      return await doc.embedPng(bytes);
    } catch {
      return await doc.embedJpg(bytes);
    }
  } catch {
    return null;
  }
}

async function generateReceiptPdf(payment, platform) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 44;
  let y = height - margin;

  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const logoImage = await loadLogoImage(doc, platform.logoUrl);

  page.drawText(platform.name || "RMS Platform", {
    x: margin,
    y,
    size: 16,
    font: titleFont,
    color: rgb(0.07, 0.5, 0.39),
  });
  if (platform.legalName) {
    page.drawText(platform.legalName, {
      x: margin,
      y: y - 17,
      size: 10.5,
      font: bodyFont,
      color: rgb(0.25, 0.25, 0.25),
    });
  }
  page.drawText("PAYMENT RECEIPT", {
    x: width - margin - 140,
    y: y - 2,
    size: 12,
    font: titleFont,
    color: rgb(0.13, 0.13, 0.13),
  });
  if (logoImage) {
    const logoSize = 48;
    page.drawImage(logoImage, {
      x: width - margin - logoSize,
      y: y - 40,
      width: logoSize,
      height: logoSize,
    });
  }

  y -= 52;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;

  const leftMeta = [
    `Invoice ID: ${payment.invoiceId ?? "-"}`,
    `Payment ID: ${payment._id.toString()}`,
    `Date: ${formatDate(payment.paidAt || payment.createdAt)}`,
  ];
  const rightMeta = [
    `Status: ${String(payment.status ?? "pending").toUpperCase()}`,
    `Method: ${payment.method ?? "-"}`,
    `Amount: ${formatAmount(payment.amount, payment.currency)}`,
  ];
  leftMeta.forEach((line, idx) => {
    page.drawText(line, {
      x: margin,
      y: y - idx * 14,
      size: 10,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  rightMeta.forEach((line, idx) => {
    page.drawText(line, {
      x: width - margin - 220,
      y: y - idx * 14,
      size: 10,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  y -= 58;

  page.drawRectangle({
    x: margin,
    y: y - 12,
    width: width - margin * 2,
    height: 20,
    color: rgb(0.95, 0.97, 0.96),
  });
  page.drawText("Billing Details", {
    x: margin + 8,
    y: y - 5,
    size: 10.5,
    font: titleFont,
    color: rgb(0.07, 0.5, 0.39),
  });
  y -= 28;

  const rows = [
    ["Payment Type", payment.paymentType ?? "order"],
    ["Restaurant", payment.restaurantName ?? "-"],
    ["Admin Email", payment.adminEmail ?? "-"],
    ["Plan", payment.planName ?? payment.plan ?? "-"],
    ["Billing Cycle", payment.billingCycle ?? "-"],
    ["Amount", formatAmount(payment.amount, payment.currency)],
    ["Tax (GST %)", `${Number(platform.taxPercent || 0).toFixed(2)}%`],
    ["GSTIN", platform.gstNumber || "-"],
    ["Status", String(payment.status ?? "pending").toUpperCase()],
  ];

  for (const [label, value] of rows) {
    if (y < 80) break;
    page.drawText(`${label}:`, {
      x: margin,
      y,
      size: 10.5,
      font: titleFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(String(value), {
      x: margin + 130,
      y,
      size: 10.5,
      font: bodyFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 22;
  }

  const addressLines = splitText(platform.address, 72);
  if (addressLines.length || platform.supportEmail || platform.contactPhone) {
    y -= 6;
    page.drawRectangle({
      x: margin,
      y: y - 12,
      width: width - margin * 2,
      height: 20,
      color: rgb(0.96, 0.96, 0.98),
    });
    page.drawText("Platform Contact", {
      x: margin + 8,
      y: y - 5,
      size: 10.5,
      font: titleFont,
      color: rgb(0.25, 0.25, 0.35),
    });
    y -= 26;
    if (platform.supportEmail) {
      page.drawText(`Email: ${platform.supportEmail}`, {
        x: margin,
        y,
        size: 10,
        font: bodyFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 16;
    }
    if (platform.contactPhone) {
      page.drawText(`Phone: ${platform.contactPhone}`, {
        x: margin,
        y,
        size: 10,
        font: bodyFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 16;
    }
    addressLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: bodyFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;
    });
  }

  page.drawLine({
    start: { x: margin, y: 56 },
    end: { x: width - margin, y: 56 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText("This is a system-generated receipt. No signature required.", {
    x: margin,
    y: 40,
    size: 9,
    font: bodyFont,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}

export async function GET(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  let _id;
  try {
    _id = new ObjectId(id);
  } catch {
    return Response.json({ success: false, error: "Invalid payment ID." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const payment = await db.collection("payments").findOne({ _id });
    if (!payment) {
      return Response.json({ success: false, error: "Payment not found." }, { status: 404 });
    }

    const settingsDoc = await db.collection("settings").findOne(
      { _id: "platform" },
      { projection: { app: 1, payment: 1 } }
    );
    const app = settingsDoc?.app ?? {};
    const pay = settingsDoc?.payment ?? {};

    const pdfBytes = await generateReceiptPdf(payment, {
      name: app.name || "RMS Platform",
      legalName: app.legalName || "",
      logoUrl: app.logoUrl || "",
      supportEmail: app.supportEmail || "",
      contactPhone: app.contactPhone || "",
      address: app.address || "",
      taxPercent: Number(pay.taxPercent || 0),
      gstNumber: String(pay.gstNumber || "").trim(),
    });
    const filename = `${String(payment.invoiceId ?? `receipt-${payment._id}`)}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET payment receipt error:", error.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
