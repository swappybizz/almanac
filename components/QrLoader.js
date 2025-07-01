// components/QrLoader.js
import React from "react";

export default function QrLoader({ code }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Detected Code:</h1>
        <p className="text-xl">{code}</p>
      </div>
    </div>
  );
}
