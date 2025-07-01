// pages/api/saveObservationChange.js
import { getAuth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  console.log("This is whats recieved", req.body)

  // Authenticate
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Parse body
  const { batchCode, id, url, issue, observation } = req.body;
  if (!batchCode || url == null || issue == null || observation == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const col = db.collection("observations");

    // Update the matching document
    const result = await col.updateOne(
      { userId, batchCode, url },
      {
        $set: {
          issue,
          description: observation,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Observation not found" });
    }

    console.log("saveObservationChange: updated", { userId, batchCode, id, issue, observation });
    return res.status(200).json({ status: "saved" });
  } catch (err) {
    console.error("saveObservationChange error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}