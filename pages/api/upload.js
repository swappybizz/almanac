// pages/api/upload.js
export const runtime = 'edge';

import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export default async function POST(req) {
  try {
    const body = await req.json();

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "video/webm",
            "image/webp",
            "image/jpg",
            "image/heic",  // Allow Apple HEIC images
            "image/heif",
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "application/pdf",                     // ✅ PDF
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // ✅ DOCX
          ],
          tokenPayload: JSON.stringify({}),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}