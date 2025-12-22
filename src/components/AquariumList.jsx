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
    console.log("🔄 Fetching aquariums...");

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const token = await getToken({ template: "backend" });
        console.log("✅ Got token, calling API...");

        const res = await axios.get(`${API_BASE}/aquariums`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000  // ✅ 30 second timeout for cold start
        });

        console.log("✅ Aquariums loaded:", res.data.length);
        setAquariums(Array.isArray(res.data) ? res.data : []);
        break;  // Success, exit loop

      } catch (err) {
        attempts++;
        console.error(`❌ Attempt ${attempts} failed:`, err.message);

        if (attempts < maxAttempts) {
          console.log("🔄 Retrying in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error("❌ Error fetching aquariums:", err);
          toast.error("Backend is starting up, please wait...");
          setAquariums([]);
        }
      }
    }

    setLoading(false);
  }

  // Edit table
  useEffect(() => {
    async function setAxiosAuth() {
      const token = await getToken({ template: "backend" });
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    }
    setAxiosAuth();
  }, [getToken]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await getToken({ template: "backend" });
      if (token && mounted) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [getToken]);

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

  // ✅ NEW: Send feed command
  async function sendFeedCommand(aquarium) {
    try {
      // prefer aquarium.feeding_volume_grams if set, otherwise estimate from size_litres or fallback to 5g
      const fv = aquarium?.feeding_volume_grams != null ? Number(aquarium.feeding_volume_grams) : null;
      const estimatedFromSize = aquarium?.size_litres ? Math.max(1, Math.round(aquarium.size_litres * 0.2)) : 5;
      const defaultFeed = fv && !isNaN(fv) && fv > 0 ? fv : estimatedFromSize;

      const input = window.prompt(
        `Masukkan volume pakan (gram) untuk "${aquarium.name}":`,
        String(defaultFeed)
      );
      if (input === null) return; // cancelled

      const volume = parseFloat(input);
      if (isNaN(volume) || volume <= 0) {
        toast.error("Masukkan volume yang valid (angka > 0)");
        return;
      }

      const token = await getToken({ template: "backend" });
      await axios.post(
        `${API_BASE}/feeding_logs`,
        {
          aquarium_id: aquarium.id,
          mode: "MANUAL",
          volume_grams: volume,
          actor: "manual_ui",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`🍽️ Feeding log created for ${aquarium.name} (${volume} g)`);
    } catch (err) {
      console.error("❌ Failed to create feeding log:", err);
      toast.error("Gagal membuat feeding log");
    }
  }

  // Edit mode
  function openEdit(aq) {
    setEditing(aq);
  }
  function closeEdit() {
    setEditing(null);
  }

  useEffect(() => {
    if (selectedAquarium?.id) {
      fetchDangerAlerts(selectedAquarium.id);

      // Set up polling to check for new alerts every 30 seconds
      const interval = setInterval(() => {
        fetchDangerAlerts(selectedAquarium.id);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [selectedAquarium?.id]);

  // Fetch sensor data
  async function showSensorChartFor(aq) {
    setChartLoading(true);

    // Fetch alerts immediately when viewing this aquarium
    fetchDangerAlerts(aq.id);

    try {
      const token = await getToken({ template: "backend" });
      const res = await axios.get(`${API_BASE}/sensor_data?aquarium_id=${aq.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const raw = Array.isArray(res.data) ? res.data : [];
      if (raw.length > 0) {
        const parsed = raw
          .map((d) => {
            const tsRaw = d.ts ?? d.timestamp ?? d.created_at ?? d.time ?? d.recorded_at;
            const date = tsRaw ? new Date(tsRaw) : null;
            const phVal = d.ph ?? d.pH ?? d.ph_value ?? null;
            const tempVal = d.temperature_c ?? d.temperature ?? d.temp_c ?? d.temp ?? null;
            const salVal = d.salinity ?? d.salinity_psu ?? d.specific_gravity ?? null;
            return {
              __date: date instanceof Date && !isNaN(date) ? date : null,
              time: date instanceof Date && !isNaN(date)
                ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--",
              ph: phVal != null ? Number(phVal) : null,
              temperature: tempVal != null ? Number(tempVal) : null,
              salinity: salVal != null ? Number(salVal) : null,
            };
          })
          .filter((p) => p.__date !== null)
          .sort((a, b) => a.__date - b.__date);

        const last = parsed.length > 8 ? parsed.slice(-8) : parsed;
        const mapped = last.map(({ __date, ...rest }) => rest);
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

  function DangerAlertBanner() {
    if (alertsLoading && dangerAlerts.length === 0) {
      return null; // Don't show loading state
    }

    if (dangerAlerts.length === 0) {
      return null; // No alerts to show
    }

    return (
      <div className="mb-4 space-y-2">
        {dangerAlerts.map(alert => (
          <div
            key={alert.id}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-pulse-slow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">
                    ⚠️ Sensor Alert
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    {new Date(alert.ts).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => resolveAlert(alert.id)}
                className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <DangerAlertBanner />
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

      <AddAquariumForm onAdded={fetchAquariums} />

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
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => sendFeedCommand(aq)}
                        disabled={!aq.device_uid}
                        title={!aq.device_uid ? "No device connected" : "Send feed command"}
                      >
                        <span>🍽️</span>
                        <span>Feed</span>
                      </button>

                      <button
                        className="bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
                        onClick={() => showSensorChartFor(aq)}
                      >
                        <ChartBarIcon className="w-4 h-4" />
                        <span>Grafik</span>
                      </button>

                      <button
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition"
                        onClick={() => openEdit(aq)}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-red-600 transition"
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
    </div>
  );
}