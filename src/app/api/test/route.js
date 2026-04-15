import clientPromise from "@/lib/mongodb";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection("test").insertOne({ name: "Om", role: "admin" });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const docs = await db.collection("test").find({}).limit(5).toArray();
    return Response.json({ success: true, count: docs.length, docs });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
