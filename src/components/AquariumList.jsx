import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AddAquariumForm from "./AddAquariumForm";
import SensorChart from "./SensorChart";
import EditAquariumModal from "./EditAquariumModal";
import ScheduleModal from "./ScheduleModal";
import { useAuth } from "@clerk/clerk-react";
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "https://aquascape.onrender.com";

export default function AquariumList() {
  const [aquariums, setAquariums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [selectedSensorData, setSelectedSensorData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [query, setQuery] = useState("");

  const { getToken } = useAuth();

  // Fetch aquariums
  async function fetchAquariums() {
    setLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      const res = await axios.get(`${API_BASE}/aquariums`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAquariums(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Error fetching aquariums:", err);
      toast.error("Gagal memuat daftar aquarium");
      setAquariums([]);
    } finally {
      setLoading(false);
    }
  }

  // Delete aquarium
  async function deleteAquarium(id) {
    if (!window.confirm("Yakin ingin menghapus aquarium ini?")) return;
    try {
      const token = await getToken({ template: "backend" });
      await axios.delete(`${API_BASE}/aquariums/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAquariums();
      toast.success("Aquarium dihapus");
    } catch (err) {
      console.error("❌ Gagal menghapus:", err);
      toast.error("Gagal menghapus aquarium");
    }
  }

  async function sendFeedCommand(aquarium) {
    try {
      const token = await getToken({ template: "backend" });
      await axios.post(`${API_BASE}/alerts`, {
        aquarium_id: aquarium.id,
        type: "CMD_FEED",
        message: `Manual feed command for ${aquarium.name}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`🍽️ Feed command sent to ${aquarium.name}!`);
    } catch (err) {
      console.error("❌ Failed to send feed command:", err);
      toast.error("Gagal mengirim perintah makan");
    }
  }

  // Edit mode
  function openEdit(aq) {
    setEditing(aq);
  }
  function closeEdit() {
    setEditing(null);
  }

  // Fetch sensor data
  async function showSensorChartFor(aq) {
    setChartLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      const res = await axios.get(`${API_BASE}/sensor_data?aquarium_id=${aq.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((d) => ({
          time: new Date(d.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ph: d.ph ? Number(d.ph) : null,
          temperature: d.temperature_c ? Number(d.temperature_c) : null,
          salinity: d.salinity ?? null,
        }));
        setSelectedSensorData(mapped);
      } else {
        generateDemoData();
      }
    } catch (err) {
      console.warn("Sensor API error, using demo data", err);
      generateDemoData();
    } finally {
      setChartLoading(false);
    }
  }

  function generateDemoData() {
    const now = new Date();
    const demo = Array.from({ length: 8 }).map((_, i) => ({
      time: new Date(now.getTime() - (7 - i) * 60 * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ph: +(6.8 + Math.sin(i / 2) * 0.3).toFixed(2),
      temperature: +(25 + Math.cos(i / 3) * 1.5).toFixed(2),
      salinity: +(30 + Math.sin(i / 4) * 1).toFixed(1),
    }));
    setSelectedSensorData(demo);
  }

  useEffect(() => {
    fetchAquariums();
  }, []);

  function openSchedule(aq) {
    setScheduleTarget(aq);
  }
  function closeSchedule() {
    setScheduleTarget(null);
  }

  // Filter search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aquariums;
    return aquariums.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.device_uid || "").toLowerCase().includes(q)
    );
  }, [aquariums, query]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold">Daftar Aquarium</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form
            className="flex gap-2 flex-1 sm:flex-initial"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="aq-search"
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                placeholder="Cari nama atau device UID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Aquarium
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {aquariums.length}
              </p>
            </div>
            <div className="text-blue-500 bg-blue-50 p-3 rounded-lg">🐠</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Sedang Ditampilkan
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {filtered.length}
              </p>
            </div>
            <div className="text-purple-500 bg-purple-50 p-3 rounded-lg">📊</div>
          </div>
        </div>
      </div>

      <AddAquariumForm onAdded={(created) => { fetchAquariums(); if (created) openSchedule(created); }} />

      {/* Aquarium List */}
      {loading ? (
        <p className="text-center text-gray-500">Memuat data...</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white/50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">🌊</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Belum ada aquarium
          </h3>
          <p className="text-gray-500">
            Tambahkan aquarium pertama Anda menggunakan form di atas
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Volume (L)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Device UID
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((aq) => (
                <tr
                  key={aq.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{aq.name}</td>
                  <td className="px-6 py-4">{aq.size_litres ?? "–"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {aq.device_uid || <span className="text-gray-400 italic">No device</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        className={`action-btn primary ${!aq.device_uid ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => sendFeedCommand(aq)}
                        disabled={!aq.device_uid}
                        title={!aq.device_uid ? "No device connected" : "Send feed command"}
                      >
                        <span>🍽️</span>
                        <span>Feed</span>
                      </button>

                      <button
                        className="action-btn"
                        onClick={() => showSensorChartFor(aq)}
                      >
                        <ChartBarIcon className="w-4 h-4" />
                        <span>Grafik</span>
                      </button>
                      
                      <button
                        className="action-btn ghost"
                        onClick={() => openEdit(aq)}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        className="action-btn danger"
                        onClick={() => deleteAquarium(aq.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Grafik Sensor</h3>
        <SensorChart data={selectedSensorData} loading={chartLoading} />
      </div>

      {editing && (
        <EditAquariumModal
          aquarium={editing}
          onClose={closeEdit}
          onSaved={fetchAquariums}
        />
      )}

      {scheduleTarget && (
        <ScheduleModal
          aquarium={scheduleTarget}
          onClose={closeSchedule}
          onSaved={fetchAquariums}
        />
      )}
    </div>
  );
}