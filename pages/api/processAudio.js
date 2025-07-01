// pages/api/processAudio.js
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuth } from "@clerk/nextjs/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { batchCode, items } = req.body;
  if (!batchCode || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing batchCode or items" });
  }

  const hasImage = items.some(it => it.type === "image");
  const hasAudio = items.some(it => it.type === "audio");

  const { db } = await connectToDatabase();
  const invoices = db.collection("invoices");

  // 1) Audio-only: generate a fresh bill of materials from each transcript
  if (hasAudio && !hasImage) {
    const prompt = `
You are an expert electrician. Given an audio transcription describing work to be done, 
produce a JSON invoice with:
{
  "items":[
    {
      "itemId":"<unique id>",
      "name":"<material or service name>",
      "unit":"<unit>",
      "quantity":<number>,
      "unitCost":<number in NOK>,
      "totalCost":<quantity*unitCost>
    },
    …
  ],
  "totalEstimate":<sum of all totalCost>
}
Return ONLY that JSON.`.trim();

    // Call OpenAI once per entire batch (not per audio snippet)
    try {
      const transcripts = items
        .filter(i => i.type === "audio")
        .map(i => i.transcription)
        .join("\n");
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Transcriptions:\n${transcripts}` },
        ],
      });
      const parsed = JSON.parse(response.choices[0].message.content);

      // Persist invoice lines
      await invoices.deleteMany({ userId, batchCode });
      for (const line of parsed.items) {
        await invoices.insertOne({
          userId,
          batchCode,
          itemId: line.itemId,
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          createdAt: new Date(),
        });
      }

      return res.status(200).json(parsed);
    } catch (err) {
      console.error("processAudio audio-only failed", err);
      return res.status(500).json({ error: "Invoice generation failed" });
    }
  }

  // 2) Mixed image + audio: edit existing invoice or add new lines
  if (hasAudio && hasImage) {
    const prompt = `
You are an expert electrician reviewing an existing invoice (from image data) and new audio descriptions.
Each invoice line has itemId, name, unit, quantity, unitCost, totalCost.
Decide whether to EDIT quantities/prices of existing lines or ADD new lines.
Return JSON:
{
  "items":[ /* full updated list of lines */ ],
  "totalEstimate":<sum of all totalCost>
}
Return ONLY that JSON.`.trim();

    try {
      // Gather existing invoice lines from DB
      const existing = await invoices.find({ userId, batchCode }).toArray();
      const existingJson = JSON.stringify(existing);

      const transcripts = items
        .filter(i => i.type === "audio")
        .map(i => i.transcription)
        .join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Existing invoice lines:\n${existingJson}` },
          { role: "user", content: `New transcriptions:\n${transcripts}` },
        ],
      });
      const parsed = JSON.parse(response.choices[0].message.content);

      // Persist the updated invoice
      await invoices.deleteMany({ userId, batchCode });
      for (const line of parsed.items) {
        await invoices.insertOne({
          userId,
          batchCode,
          itemId: line.itemId,
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          createdAt: new Date(),
        });
      }

      return res.status(200).json(parsed);
    } catch (err) {
      console.error("processAudio mixed failed", err);
      return res.status(500).json({ error: "Invoice update failed" });
    }
  }

  // 3) Nothing to do
  return res.status(400).json({ error: "No audio items to process" });
}
