import React, { useState, useEffect } from "react";
import axios from "axios";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://aquascape.onrender.com";

export default function ScheduleModal({ aquarium, onClose, onSaved }) {
    const [form, setForm] = useState({ feeding_volume_grams: "", feeding_period_hours: "" });
    const [saving, setSaving] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        if (!aquarium) return;
        setForm({
            feeding_volume_grams: aquarium.feeding_volume_grams ?? "",
            feeding_period_hours: aquarium.feeding_period_hours ?? "",
        });
    }, [aquarium]);

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await getToken({ template: "backend" });
            await axios.put(`${API_BASE}/aquariums/${aquarium.id}`, {
                // Include ALL existing aquarium fields
                name: aquarium.name,
                size_litres: aquarium.size_litres,
                device_uid: aquarium.device_uid,
                // Then update only the schedule fields
                feeding_volume_grams: form.feeding_volume_grams === "" ? null : Number(form.feeding_volume_grams),
                feeding_period_hours: form.feeding_period_hours === "" ? null : Number(form.feeding_period_hours),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Jadwal berhasil disimpan");
            if (onSaved) onSaved();
            onClose();
        } catch (err) {
            console.error("❌ Full error:", err.response?.data);  // ✅ ADD THIS to see exact error
            console.error("Gagal menyimpan jadwal:", err);
            toast.error("Gagal menyimpan jadwal");
        } finally {
            setSaving(false);
        }
    }

    if (!aquarium) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Atur Jadwal untuk {aquarium.name}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Feeding volume (grams)</label>
                        <input
                            className="input"
                            value={form.feeding_volume_grams}
                            onChange={(e) => setForm({ ...form, feeding_volume_grams: e.target.value })}
                            placeholder="e.g. 1.5"
                            type="number"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Feeding period (hours)</label>
                        <input
                            className="input"
                            value={form.feeding_period_hours}
                            onChange={(e) => setForm({ ...form, feeding_period_hours: e.target.value })}
                            placeholder="e.g. 8"
                            type="number"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded btn-secondary">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 rounded sea-btn" disabled={saving}>
                            {saving ? "Menyimpan..." : "Simpan Jadwal"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
