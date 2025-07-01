// pages/api/transcribe.js
import { getAuth } from '@clerk/nextjs/server'
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing required field: url" });
  }

  try {
    // Download the audio file
    const audioResponse = await fetch(url);
    if (!audioResponse.ok) {
      return res.status(500).json({ error: "Failed to download audio file" });
    }
    const audioBuffer = await audioResponse.arrayBuffer();
    const contentType =
      audioResponse.headers.get("content-type") || "audio/mpeg";
    const blob = new Blob([audioBuffer], { type: contentType });

    // Prepare form data for OpenAI
    const formData = new FormData();
    formData.append("file", blob, "audio.mp3");
    formData.append("model", "whisper-1");

    const apiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );
    if (!apiRes.ok) {
      const errorData = await apiRes.json();
      return res
        .status(apiRes.status)
        .json({ error: "Transcription failed", details: errorData });
    }
    const data = await apiRes.json();
    console.log("transcription", data.text);
    res.status(200).json({ transcription: data.text });
  } catch (error) {
    console.error("Transcription API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}