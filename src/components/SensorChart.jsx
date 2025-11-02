import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function SensorChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-pulse h-5 w-48 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-[280px] w-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
          <div className="text-gray-400 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memuat data sensor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Belum Ada Data Sensor</h4>
          <p className="text-gray-500 text-sm">Pilih aquarium untuk melihat data sensornya</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-medium">📊 Grafik Sensor Aquarium</h4>
        <div className="text-sm text-gray-500">Terakhir 8 jam</div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.some(d => d.ph != null) && (
            <Line type="monotone" dataKey="ph" stroke="#0ea5e9" name="pH" strokeWidth={2} dot={false} />
          )}
          {data.some(d => d.temperature != null) && (
            <Line type="monotone" dataKey="temperature" stroke="#f43f5e" name="Suhu (°C)" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
