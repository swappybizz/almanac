// pages/api/observations.js
import { getAuth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "30", 10);
  const skip = (page - 1) * limit;

  const { db } = await connectToDatabase();
  const col = db.collection("invoices");

  const [total, items] = await Promise.all([
    col.countDocuments({ userId }),
    col
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);
  console.log("items", items)
  res.status(200).json({ total, items });
}