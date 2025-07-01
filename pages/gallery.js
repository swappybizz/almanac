// pages/gallery.js
import Head from "next/head";
import { useState, useEffect } from "react";
import { useUser, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  AiOutlineArrowLeft,
  AiOutlineDown,
  AiOutlineUp,
  AiOutlineSave,
  AiOutlineDelete,
  AiOutlinePlus,
  AiOutlineMinus,
} from "react-icons/ai";
import { v4 as uuidv4 } from "uuid";
import { gen_rep_pptx } from "@/lib/helpers";

export default function Gallery() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [popup, setPopup] = useState(null);
  const [popupMaterials, setPopupMaterials] = useState([]);
  const [expanded, setExpanded] = useState(false);

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
          billItems: it.items || [],
          billTotal: it.totalEstimate || 0,
        }));
        console.log("Resuls from /api/observations", mapped);
        setItems((prev) => (page === 1 ? mapped : prev.concat(mapped)));
        setTotal(total);
      })
      .finally(() => setLoading(false));
  }, [user, page]);

  // seed popupMaterials when popup opens
  useEffect(() => {
    if (popup) {
      setPopupMaterials(popup.billItems.map((m) => ({ ...m })));
    }
  }, [popup]);

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn />;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const generate_repo = async () => {
    const observations = items.filter((it) => selected.has(it.id));
    await gen_rep_pptx(observations);
  };

  // invoice popup helpers
  const updateMaterial = (idx, field, value) => {
    setPopupMaterials((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]:
          field === "quantity" || field === "unitCost"
            ? parseFloat(value) || 0
            : value,
      };
      return next;
    });
  };
  const addMaterial = () => {
    setPopupMaterials((prev) => [
      ...prev,
      {
        itemId: uuidv4(),
        name: "",
        unit: "",
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
      },
    ]);
  };
  const removeMaterial = (idx) => {
    setPopupMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  // compute totals inside popup
  const computedMaterials = popupMaterials.map((m) => ({
    ...m,
    totalCost: (m.quantity || 0) * (m.unitCost || 0),
  }));
  const computedTotal = computedMaterials.reduce((sum, m) => sum + m.totalCost, 0);

  // save & delete popup actions
  const handlePopupSave = () => {
    if (!popup) return;
    const idx = items.findIndex((it) => it.id === popup.id);
    if (idx === -1) return;
    const updatedItem = {
      ...items[idx],
      billItems: computedMaterials,
      billTotal: computedTotal,
    };
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? updatedItem : it))
    );
    setPopup(null);
    alert("Invoice updated");
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

  // aggregate all selected items' invoice lines
  const aggregatedMaterials = Array.from(selected).flatMap((id) => {
    const it = items.find((i) => i.id === id);
    return (
      it?.billItems?.map((m) => ({
        ...m,
        totalCost: (m.quantity || 0) * (m.unitCost || 0),
      })) || []
    );
  });
  const aggregatedTotal = aggregatedMaterials.reduce(
    (sum, m) => sum + m.totalCost,
    0
  );

  return (
    <>
      <Head>
        <title>Gallery</title>
      </Head>
      <SignedIn>
        <div className="min-h-screen bg-gray-50 text-black pb-72">
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="fixed top-2 left-2 z-20 bg-white bg-opacity-80 p-2 rounded-full shadow-md"
            aria-label="Back"
          >
            <AiOutlineArrowLeft size={24} />
          </button>

          {/* Image grid */}
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
                      src={it.url}
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

          {/* Load more */}
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

          {/* Popup for editing one observation */}
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
                      className="h-64 rounded-lg mb-4 w-full object-cover"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
                  {computedMaterials.map((mat, idx) => (
                    <div
                      key={mat.itemId}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <input
                        type="text"
                        value={mat.name}
                        onChange={(e) =>
                          updateMaterial(idx, "name", e.target.value)
                        }
                        placeholder="Item name"
                        className="border px-1 py-1 rounded flex-1"
                      />
                      <input
                        type="number"
                        value={mat.quantity}
                        onChange={(e) =>
                          updateMaterial(idx, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        className="w-16 border px-2 py-1 rounded text-right"
                      />
                      <input
                        type="number"
                        value={mat.unitCost}
                        onChange={(e) =>
                          updateMaterial(idx, "unitCost", e.target.value)
                        }
                        placeholder="Unit cost"
                        className="w-24 border px-2 py-1 rounded text-right"
                      />
                      <span className="w-24 text-right">{mat.totalCost} kr</span>
                      <button onClick={() => removeMaterial(idx)}>
                        <AiOutlineMinus
                          className="text-red-500"
                          size={20}
                        />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addMaterial}
                    className="flex items-center text-green-600 mb-2"
                  >
                    <AiOutlinePlus size={16} /> Add row
                  </button>
                  <div className="mt-2 font-semibold text-right">
                    Totalt: {computedTotal} kr
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

          {/* Bottom sheet for selections */}
          {selected.size > 0 && (
            <div
              className={`fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-inner z-20 ${
                expanded ? "max-h-[33vh]" : ""
              } transition-all`}
            >
              {expanded && (
                <div className="overflow-y-auto px-4 pt-2">
                  {aggregatedMaterials.map((mat, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 border-b"
                    >
                      <span>{mat.name}</span>
                      <span>{mat.totalCost} kr</span>
                    </div>
                  ))}
                  <div className="mt-2 font-semibold text-right">
                    Total: {aggregatedTotal} kr
                  </div>
                </div>
              )}
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={generate_repo}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg shadow"
                >
                  Generate Report
                </button>
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="ml-2 text-gray-600"
                >
                  {expanded ? (
                    <AiOutlineDown size={20} />
                  ) : (
                    <AiOutlineUp size={20} />
                  )}
                </button>
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
