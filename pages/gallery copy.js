// pages/gallery.js
import Head from "next/head";
import { useState, useEffect } from "react";
import { useUser, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  AiOutlineArrowLeft,
  AiOutlineDown,
  AiOutlineSave,
  AiOutlineDelete,
} from "react-icons/ai";
import { gen_rep_pptx } from "@/lib/helpers";

export default function Gallery() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [language, setLanguage] = useState("norsk");
  const [popup, setPopup] = useState(null);
  const [edits, setEdits] = useState({});

  // fetch paginated observations
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/observations?page=${page}&limit=30`)
      .then((res) => res.json())
      .then(({ items: raw, total }) => {
        const mapped = raw.map((it) => ({
          ...it,
          id: it._id.toString(),
        }));
        console.log("Resuls from /api/observations", mapped)
        setItems((prev) => (page === 1 ? mapped : prev.concat(mapped)));
        setTotal(total);
      })
      .finally(() => setLoading(false));

  }, [user, page]);

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn />;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePopupSave = async () => {
    if (!popup) return;
    const issue = edits[popup.id]?.issue ?? popup.issue ?? "";
    const url = edits[popup.id]?.url ?? popup.url ?? "";
    const observation = edits[popup.id]?.description ?? popup.description ?? "";
    await fetch("/api/saveObservationChange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchCode: popup.batchCode,
        userId: user.id,
        id: popup.id,
        url: url,
        issue,
        observation,
      }),
    });
    setItems((prev) =>
      prev.map((it) =>
        it.id === popup.id ? { ...it, issue, description: observation } : it
      )
    );
    setPopup((p) => p && { ...p, issue, description: observation });
    setEdits((prev) => {
      const next = { ...prev };
      delete next[popup.id];
      return next;
    });
    alert("Changes Saved")
  };

  const handlePopupDelete = async () => {
    if (!popup) return;
    await fetch("/api/delSessionItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchCode: popup.batchCode,
        userId: user.id,
        url: popup.url,
        name: popup.name,
      }),
    });
    setItems((prev) => prev.filter((it) => it.id !== popup.id));
    setPopup(null);
  };

  const generate_repo = async () => {
    const observations = items.filter((it) => selected.has(it.id));
    await gen_rep_pptx(observations);
    // optionally clear selection
    // setSelected(new Set());
  };

  return (
    <>
      <Head>
        <title>Gallery</title>
      </Head>
      <SignedIn>
        <div className="min-h-screen bg-gray-50 text-black pb-72">
          {/* Floating back button */}
          <button
            onClick={() => window.history.back()}
            className="fixed top-2 left-2 z-20 bg-white bg-opacity-80 p-2 rounded-full shadow-md"
            aria-label="Back"
          >
            <AiOutlineArrowLeft size={24} />
          </button>

          {/* Grid */}
          <div className="pt-4 px-2 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((it) => (
              <div key={it.id} className="relative">
                <input
                  type="checkbox"
                  checked={selected.has(it.id)}
                  onChange={() => toggleSelect(it.id)}
                  className="absolute top-2 right-2 z-10 w-5 h-5 text-blue-600 bg-white rounded"
                />
                <div
                  onClick={() => setPopup(it)}
                  className="w-full pb-[100%] bg-white rounded-xl shadow-md overflow-hidden cursor-pointer relative"
                >
                  {it.url ? (
                    <img
                    src={it.url && it.url.endsWith('.mp3') ? '/issue.svg' : it.url || '/issue.svg'}

                      alt={it.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">
                      🎤
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Floating load more */}
          {items.length < total && (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="fixed bottom-1/3 left-6 z-[1000] bg-white bg-opacity-80 p-3 rounded-full shadow-md"
              aria-label="Load more"
            >
              <AiOutlineDown size={12} className="text-gray-600" />
            </button>
          )}

          {/* Item detail popup */}
          {popup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full h-[70vh] overflow-auto shadow-lg p-4 flex flex-col">
                <button
                  onClick={() => setPopup(null)}
                  className="self-end text-gray-600 p-1"
                >
                  ✕
                </button>
                <div className="flex-1 overflow-auto">
                  {popup.url && (
                    <img
                      src={popup.url}
                      alt={popup.name}
                      className="h-64 rounded-lg mb-4"
                    />
                  )}
                  {popup.type === "audio" && (
                    <audio src={popup.url} controls className="w-full mb-4" />
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Issue
                      </label>
                      <input
                        type="text"
                        value={edits[popup.id]?.issue ?? popup.issue ?? ""}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [popup.id]: {
                              ...(prev[popup.id] || {}),
                              issue: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={
                          edits[popup.id]?.description ??
                          popup.description ??
                          ""
                        }
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [popup.id]: {
                              ...(prev[popup.id] || {}),
                              description: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={handlePopupSave}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <AiOutlineSave className="mr-2" /> Save
                  </button>
                  <button
                    onClick={handlePopupDelete}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <AiOutlineDelete className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom sheet when selections >0 */}
          {selected.size > 0 && (
            <div className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl p-4 pb-36 shadow-inner z-20">
              <div className="flex items-center space-x-2 mb-3">
{/*                 <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="norsk">Norsk</option>
                  <option value="english">English</option>
                </select> */}

              </div>
              <button
                onClick={generate_repo}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow"
              >
                Generate Report
              </button>
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