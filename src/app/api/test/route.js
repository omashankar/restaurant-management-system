import clientPromise from "@/lib/mongodb";

export async function POST() {
  const client = await clientPromise;
  const db = client.db("myDatabase");

  const result = await db.collection("test").insertOne({
    name: "Om",
    role: "admin",
    createdAt: new Date(),
  });

  return Response.json(result);
}