import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const areas = await db
      .collection("tableAreas")
      .find({})
      .project({ name: 1, imageUrl: 1 })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    return Response.json({
      success: true,
      areas: areas
        .filter((a) => a?.name)
        .map((a) => ({
          name: a.name,
          imageUrl: a.imageUrl ?? "",
        })),
    });
  } catch (err) {
    console.error("customer.table-areas.GET failed:", err.message);
    return Response.json({ success: false, areas: [] }, { status: 200 });
  }
}
