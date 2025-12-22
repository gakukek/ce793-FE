import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://aquascape.onrender.com";

export default function EditAquariumModal({ aquarium, onClose, onSaved }) {
  const { getToken } = useAuth();

  // ✅ NEW: store resolved schedule id
  const [scheduleId, setScheduleId] = useState(null);

  const [form, setForm] = useState({
    name: aquarium.name || "",
    size_litres: aquarium.size_litres ?? "",
    device_uid: aquarium.device_uid || "",
    feeding_volume_grams: aquarium.feeding_volume_grams ?? "",
    feeding_period_hours: aquarium.feeding_period_hours ?? "",
  });

  const [saving, setSaving] = useState(false);

  // ✅ NEW: fetch schedule id when modal opens
  useEffect(() => {
    if (!aquarium?.id) return;

    async function fetchScheduleId() {
      try {
        const token = await getToken({ template: "backend" });
        const res = await axios.get(
          `${API_BASE}/aquariums/${aquarium.id}/schedule-id`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setScheduleId(res.data.schedule_id);
      } catch (err) {
        console.error("Failed to fetch schedule ID:", err);
      }
    }

    fetchScheduleId();
  }, [aquarium.id, getToken]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken({ template: "backend" });

      // 1️⃣ UPDATE AQUARIUM (unchanged)
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
          feeding_period_hours:
            form.feeding_period_hours === ""
              ? null
              : Number(form.feeding_period_hours),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 2️⃣ CREATE / UPDATE SCHEDULE (NEW)
      const hasScheduleData =
        form.feeding_volume_grams !== "" &&
        form.feeding_period_hours !== "";

      if (hasScheduleData) {
        const payload = {
          aquarium_id: aquarium.id,
          name: "Auto Feeding",
          type: "interval",
          interval_hours: Number(form.feeding_period_hours),
          feed_volume_grams: Number(form.feeding_volume_grams),
          enabled: true,
        };

        if (scheduleId) {
          // UPDATE existing schedule
          await axios.put(
            `${API_BASE}/schedules/${scheduleId}`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          // CREATE new schedule
          const res = await axios.post(
            `${API_BASE}/schedules`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          // keep local state in sync
          setScheduleId(res.data.id);
        }
      }

      toast.success("Perubahan disimpan");
      onSaved();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan:", err.response?.data || err);
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
          {/* FORM CONTENT UNCHANGED */}
          {/* ... */}
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
