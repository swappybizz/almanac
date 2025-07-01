// pages/myhseq.js
import Head from "next/head";
import { useState, useRef } from "react";
import {
  useUser,
  UserButton,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/nextjs";
import Webcam from "react-webcam";
import MicRecorder from "mic-recorder-to-mp3";
import { upload } from "@vercel/blob/client";
import { dataUrlToBlob } from "../lib/helpers";
import { v4 as uuidv4 } from "uuid";
import {
  AiOutlineCamera,
  AiOutlineClose,
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineAppstore,
  AiOutlineReload,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlinePlus,
  AiOutlineArrowLeft,
  AiOutlineHome,
} from "react-icons/ai";
import { FiMic } from "react-icons/fi";

export default function MyHSEQ() {
  const { user } = useUser();
  const webcamRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRefs = useRef({});
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]); // both image & audio
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [edits, setEdits] = useState({}); // { [id]: { issue: "", observation: "" } }
  const [batchCode] = useState(uuidv4());

  // send single media to /api/process, merge the returned issue/description into state
  const processSingle = async ({ id, name, url }) => {
    console.log("Single Photo recieved")
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchCode, userId: user.id, name, url }),
    });
    const data = await res.json(); // { issue, description }
    console.log("processSingle response:", data);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, issue: data.issue, observation: data.description }
          : it
      )
    );
    return data;
  };
  const onTranscription = async (updatedItems) => {
    try {
      const res = await fetch("/api/processAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchCode,
          userId: user.id,
          items: updatedItems,
        }),
      });
      const data = await res.json();
      console.log("processAudio response:", data);
  
      // Audio-only: apply to matching items
      if (data.results) {
        setItems((prev) =>
          prev.map((it) => {
            const r = data.results.find((r) => r.id === it.id);
            return r
              ? { ...it, issue: r.issue, observation: r.description }
              : it;
          })
        );
      }
  
      // Mixed: edits — match either by numeric id or by file name
      else if (data.action === "edit" && Array.isArray(data.edits)) {
        setItems((prev) =>
          prev.map((it) => {
            const edit = data.edits.find(
              (e) => e.id === it.id || e.id === it.name
            );
            return edit
              ? { ...it, issue: edit.issue, observation: edit.description }
              : it;
          })
        );
      }
  
      // Mixed: create new observation
      else if (data.action === "create" && data.new) {
        setItems((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "image",
            status: "done",
            url: data.new.url || null,
            name: data.new.name,
            issue: data.new.issue,
            observation: data.new.description,
          },
        ]);
      }
    } catch (err) {
      console.error("processAudio failed", err);
    }
  };
  const fetchTranscription = async (url, id) => {
    try {
      const res = await fetch("/api/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.transcription) {
        setItems((prev) => {
          const updated = prev.map((it) =>
            it.id === id ? { ...it, transcription: data.transcription } : it
          );
          onTranscription(updated);
          return updated;
        });
      }
    } catch {}
  };
  const capturePhoto = async () => {

    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();

    if (!dataUrl) return;
    const id = Date.now();
    setItems((p) => [...p, { id, type: "image", status: "processing" }]);
    try {
      const blob = dataUrlToBlob(dataUrl);
      const fileName = `photo-${id}.jpg`;
      const result = await upload(fileName, blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      if (result.url) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, url: result.url, name: fileName, status: "done" }
              : it
          )
        );
        await processSingle({ id, name: fileName, url: result.url });
      }
    } catch {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  };
  const startRecording = async () => {
    try {
      recorderRef.current = new MicRecorder({ bitRate: 128 });
      await recorderRef.current.start();
      setRecording(true);
    } catch {}
  };
  const stopRecording = async () => {
    try {
      const [buffer, blob] = await recorderRef.current.stop().getMp3();
      setRecording(false);
      const id = Date.now();
      const fileName = `audio-${id}.mp3`;
      const result = await upload(fileName, blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      if (result.url) {
        setItems((prev) => [
          ...prev,
          { id, type: "audio", url: result.url, name: fileName },
        ]);
        fetchTranscription(result.url, id);
      }
    } catch {
      setRecording(false);
    }
  };
  const togglePlay = (id) => {
    const audio = audioRefs.current[id];
    if (!audio) return;
    if (playing === id) {
      audio.pause();
      setPlaying(null);
    } else {
      if (playing && audioRefs.current[playing]) {
        audioRefs.current[playing].pause();
      }
      audio.play();
      setPlaying(id);
    }
  };

  const handleDelete = async (item) => {
    await fetch("/api/delSessionItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchCode,
        userId: user.id,
        url:item.url,
        name: item.name,
      }),
    });
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setCurrentIndex((idx) =>
      idx >= items.length - 1 ? items.length - 2 : idx
    );
    if (items.length <= 1) {
      setShowPopup(false);
    }
  };

  const handleSave = async (item) => {
    // Prefer user-edited text, fall back to whatever the item already has
    const issueToSave =
      edits[item.id]?.issue !== undefined
        ? edits[item.id].issue
        : item.issue || "";
    const observationToSave =
      edits[item.id]?.observation !== undefined
        ? edits[item.id].observation
        : item.observation || "";
  
    // Send to your API
    await fetch("/api/saveObservationChange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchCode,
        userId: user.id,
        id: item.id,
        url: item.url,
        issue: issueToSave,
        observation: observationToSave,
      }),
    });
  
    // Reflect saved values immediately in your UI
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, issue: issueToSave, observation: observationToSave }
          : it
      )
    );
    setEdits((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    alert("Changes Saved")
  };
  
  const handleFileUploadClick = () => {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };
  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = Date.now();
    setItems((p) => [...p, { id, type: "image", status: "processing" }]);
    try {
      const fileName = `upload-${id}.${file.name.split(".").pop()}`;
      const result = await upload(fileName, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      if (result.url) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, url: result.url, name: fileName, status: "done" }
              : it
          )
        );
        await processSingle({ id, name: fileName, url: result.url });
      }
    } catch {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  };

  const hasPhoto = items.some((it) => it.type === "image" && it.status === "done");

  const openPopup = () => {
    window.location.href = "/gallery";
  };
  

  const currentItem = items[currentIndex];

  return (
    <>
      <Head>
        <title>MyHSEQ</title>
        <meta name="description" content="Your Handy Tool For Smart observations" />
      </Head>

      <SignedIn>
        <div className="min-h-screen w-screen bg-black relative">
          {/* Reload */}
                    <button
                      onClick={() => window.history.back()}
                      className="fixed top-2 left-2 z-20 bg-white bg-opacity-80 p-2 rounded-full shadow-md"
                      aria-label="Back"
                    >
                      <AiOutlineArrowLeft className="text-gray-800" size={24} />
                    </button>
          <button
            onClick={() => window.location.href = "/"}
            className="fixed top-2 right-12 z-30 p-2 bg-white rounded-full shadow-md"
          >
            <AiOutlineHome size={20} className="text-gray-800" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="fixed top-2 right-2 z-30 p-2 bg-white rounded-full shadow-md"
          >
            <AiOutlineReload size={20} className="text-gray-800" />
          </button>

          {/* User */}
          <div className="fixed hidden top-4 left-16 z-30">
            <UserButton />
          </div>

          {/* Camera */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: { ideal: "environment" } }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Preview Bar */}
          <div className="absolute top-24 left-2 z-20 flex flex-col space-y-2 overflow-y-auto max-h-1/2 bg-white/20 p-2 rounded-3xl backdrop-blur-sm">
            {items.map((it, idx) => {
              const hasTrans = Boolean(it.transcription);
              const iconColor =
                it.type === "audio" && hasTrans
                  ? "text-green-500"
                  : "text-gray-800";
              return (
                <button
                  key={it.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowPopup(true);
                  }}
                  className="w-8 h-8 flex-shrink-0 rounded-full border border-gray-200 bg-white/30 overflow-hidden"
                >
                  {it.type === "image" ? (
                    it.status === "processing" ? (
                      <img
                        src="/logo.png"
                        alt="loading"
                        className="w-full h-full animate-pulse"
                      />
                    ) : (
                      <img
                        src={it.url || '/issue.svg'} 
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/50">
                      {playing === it.id ? (
                        <AiOutlinePauseCircle size={16} className={iconColor} />
                      ) : (
                        <AiOutlinePlayCircle size={16} className={iconColor} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 flex space-x-6 z-20">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-800"
            >
              <AiOutlineCamera size={32} />
            </button>
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`relative w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center ${
                recording ? "text-red-500 animate-pulse" : "text-gray-800"
              }`}
            >
              <FiMic size={32} />
              {hasPhoto && (
                <AiOutlinePlus
                  size={20}
                  className="absolute -top-5 right-0 p-1 text-[#990099] bg-gray-200 rounded-full"
                />
              )}
            </button>
          </div>

          {/* Gallery Icon */}
          <button
            onClick={openPopup}
            className="fixed bottom-32 left-4 w-12 h-12 z-30 text-gray-600 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <AiOutlineAppstore size={28} />
          </button>

          {/* File Upload */}
          <button
            onClick={handleFileUploadClick}
            className="fixed bottom-32 right-4 w-12 h-12 z-30 text-gray-600 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <AiOutlinePlus size={20} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileInputChange}
            />
          </button>

          {/* Popup */}
          {showPopup && currentItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
              <div className="bg-white text-black rounded-2xl p-4 max-w-md w-full relative">
                {/* Close */}
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute -top-12 right-4 p-1 text-gray-700"
                >
                  <AiOutlineClose className="text-red-500" size={24} />
                </button>

                {/* Nav */}
                <div className="flex justify-between mb-4">
                  <button
                    onClick={() =>
                      setCurrentIndex(
                        (currentIndex - 1 + items.length) % items.length
                      )
                    }
                  >
                    <AiOutlineLeft size={24} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentIndex((currentIndex + 1) % items.length)
                    }
                  >
                    <AiOutlineRight size={24} className="text-gray-500" />
                  </button>
                </div>
                {currentItem.type === "image" ? (
                  <img
                    src={currentItem.url || '/issue.svg'}
                    alt={currentItem.name}
                    className="h-64 bg-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="flex flex-col items-center mb-4">
                    <audio
                      src={currentItem.url}
                      controls
                      ref={(el) =>
                        (audioRefs.current[currentItem.id] = el)
                      }
                      className="w-full"
                    />
                    {currentItem.transcription && (
                      <div className="p-2 bg-gray-100 text-sm text-gray-800 rounded mt-2">
                        {currentItem.transcription}
                      </div>
                    )}
                  </div>
                )}

                {/* Editable Fields */}
                <div className="space-y-2 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Issue
                    </label>
                    <input
                      type="text"
                      value={
                        edits[currentItem.id]?.issue ??
                        currentItem.issue ??
                        ""
                      }
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [currentItem.id]: {
                            ...(prev[currentItem.id] || {}),
                            issue: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Observation
                    </label>
                    <textarea
                      value={
                        edits[currentItem.id]?.observation ??
                        currentItem.observation ??
                        ""
                      }
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [currentItem.id]: {
                            ...(prev[currentItem.id] || {}),
                            observation: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded p-2"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(currentItem)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleDelete(currentItem)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}