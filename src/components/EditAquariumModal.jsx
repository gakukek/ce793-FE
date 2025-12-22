import React, { useEffect, useState } from "react";
import axios from "axios";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://aquascape.onrender.com";

export default function EditAquariumModal({ aquarium, onClose, onSaved }) {
  const { getToken } = useAuth();

  const [form, setForm] = useState({
    name: aquarium.name || "",
    size_litres: aquarium.size_litres ?? "",
    device_uid: aquarium.device_uid || "",
    feeding_volume_grams: aquarium.feeding_volume_grams ?? "",
    feeding_hours: aquarium.feeding_hours || "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken({ template: "backend" });

      await axios.put(
        `${API_BASE}/aquariums/${aquarium.id}`,
        {
          user_id: aquarium.user_id,
          name: form.name,
          size_litres:
            form.size_litres === "" ? null : Number(form.size_litres),
          device_uid: form.device_uid,
          feeding_volume_grams:
            form.feeding_volume_grams === ""
              ? null
              : Number(form.feeding_volume_grams),
              feeding_hours:
                form.feeding_hours === "" ? null : form.feeding_hours,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSaved();
      onClose();
      toast.success("Perubahan disimpan");
    } catch (err) {
      console.error("Gagal menyimpan aquarium:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Aquarium</h3>
          <button
            onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg"
              aria-label="Tutup"
            >
              ❌
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Nama Aquarium
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Volume Aquarium (Liter)
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.size_litres}
              onChange={(e) =>
                setForm({ ...form, size_litres: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Volume per Pakan (gram)
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.feeding_volume_grams}
              onChange={(e) =>
                setForm({
                  ...form,
                  feeding_volume_grams: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Jam Pakan (pisahkan dengan koma, format HH:MM)
            </label>
            <input
              className="input"
              placeholder="08:00,20:00"
              value={form.feeding_hours}
              onChange={(e) =>
                setForm({ ...form, feeding_hours: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="action-btn ghost"
            >
              Batal
            </button>
            <button
              type="submit"
              className="action-btn primary"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
