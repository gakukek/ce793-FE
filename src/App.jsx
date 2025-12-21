import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AquariumList from "./components/AquariumList";
import AuthPage from "./pages/authPage.jsx";
import { SignedIn, SignedOut, useAuth, SignOutButton } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = "https://aquascape.onrender.com";


function DashboardShell() {
  const { isSignedIn, getToken } = useAuth();
  const syncAttemptedRef = useRef(false);
  const [syncing, setSyncing] = useState(false);


  useEffect(() => {
    if (!isSignedIn) return;
    if (syncAttemptedRef.current) return;

    async function syncUser() {
      syncAttemptedRef.current = true;
      setSyncing(true);

      try {
        const token = await getToken({ template: "backend" });
        if (!token) return;

        await axios.post(`${API_BASE}/sync-user`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success("Berhasil login!");
      } catch (err) {
        console.error("❌ Sync user error:", err);
        toast.error("Sinkronisasi user gagal");
        syncAttemptedRef.current = false;
      } finally {
        setSyncing(false);
      }
    }

    syncUser();
  }, [isSignedIn, getToken]);



  {
    syncing && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Menyinkronkan user…</p>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <header className="site-header text-white p-6 relative overflow-hidden">
        <div className="header-inner site-container">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-3">
                <span className="inline-block transform hover:scale-110 transition-transform duration-200">🐠</span>
                Smart Aquarium Dashboard
              </h1>
              <p className="text-sm text-white/90 mt-1">
                Pantau pH, suhu, dan aktivitas aquarium Anda secara realtime
              </p>
            </div>
            <div className="absolute top-0 right-0 opacity-10 text-6xl select-none">
              🌊
            </div>
          </div>
        </div>
        <div className="site-wave" aria-hidden>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
            <path className="wave-path" d="M0,64 C120,96 240,16 360,48 C480,80 600,96 720,64 C840,32 960,48 1080,64 C1200,80 1320,32 1440,64 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
            <path className="wave-path" d="M0,44 C160,84 320,4 480,44 C640,84 800,104 960,44 C1120,-16 1280,24 1440,44 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.06)" style={{ animationDelay: '1.5s' }} />
          </svg>
          <div className="bubble b1 small" />
          <div className="bubble b2 medium" />
          <div className="bubble b3 small" />
          <div className="bubble b4 large" />
          <div className="bubble b5 medium" />
        </div>
      </header>

      <main className="site-container p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <AquariumList />
        </div>
      </main>
      <div className="fixed-signout">
        <SignOutButton>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition">
            🚪 Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}

// Small error boundary to surface runtime problems in the UI (helps debugging blank page)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // keep a console error for diagnostics
    console.error('Uncaught render error in App:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="site-container p-6">
          <div className="bg-white rounded-lg shadow p-6 text-red-700">
            <h2 className="text-xl font-semibold mb-2">Terjadi kesalahan saat merender aplikasi</h2>
            <pre className="whitespace-pre-wrap text-sm bg-red-50 p-3 rounded">{String(this.state.error)}</pre>
            <p className="mt-3 text-sm text-gray-600">Lihat console browser untuk detail stack trace.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth"
            element={
              <>
                <SignedOut>
                  <AuthPage />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/" replace />
                </SignedIn>
              </>
            }
          />

          {/* Protected dashboard route */}
          <Route
            path="/*"
            element={
              <>
                <SignedIn>
                  <DashboardShell />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/auth" replace />
                </SignedOut>
              </>
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}