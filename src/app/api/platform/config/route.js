import { getPublicPlatformConfig } from "@/lib/platformSettings";

/** Public platform config (no secrets) — used by client UI and middleware. */
export async function GET() {
  try {
    const config = await getPublicPlatformConfig();
    return Response.json(
      { success: true, ...config },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/platform/config:", err.message);
    return Response.json(
      {
        success: true,
        maintenanceMode: false,
        features: {
          featureMenuQR: true,
          featureOnlineOrder: true,
          featureReservations: true,
          featureInventory: true,
        },
      },
      { status: 200 },
    );
  }
}
