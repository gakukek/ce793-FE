import React, { useState } from "react";
import axios from "axios";
import { PlusIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://aquascape.onrender.com";

export default function AddAquariumForm({ onAdded }) {
  const [form, setForm] = useState({ name: "", volume: "", device_uid: "" });
  const { getToken, userId } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = await getToken();

      await axios.post(`${API_BASE}/aquariums`, {
        name: form.name,
        size_litres: Number(form.volume) || null,
        device_uid: form.device_uid,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: "", volume: "", device_uid: "" });
      onAdded();
      toast.success("Aquarium berhasil ditambahkan!");
    } catch (err) {
      console.error("❌ Gagal menambah aquarium:", err);
      toast.error("Gagal menambah aquarium!");
    }
  }
  return (
    <>
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">Tambah Aquarium</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Nama aquarium"
            className="border p-2 rounded w-1/3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Volume (L)"
            className="border p-2 rounded w-1/3"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: e.target.value })}
          />
          <input
            type="text"
            placeholder="Device UID (e.g., ABC123)"
            value={form.device_uid}
            onChange={(e) => setForm({ ...form, device_uid: e.target.value })}
            className="border rounded px-3 py-2"
          />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Tambah
      </button>
    </form >
    </>
  );
}
