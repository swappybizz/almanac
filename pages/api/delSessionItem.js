// pages/api/delSessionItem.js
import { getAuth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Auth
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { batchCode, url, name } = req.body;
  console.log("Req body received here", req.body);

  if (!batchCode || !url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { db } = await connectToDatabase();
    const col = db.collection("observations");

    const result = await col.deleteOne({ userId, batchCode, url });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Observation not found" });
    }

    console.log("delSessionItem: deleted", { userId, batchCode, url, name });
    res.status(200).json({ status: "deleted" });
  } catch (err) {
    console.error("delSessionItem error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}