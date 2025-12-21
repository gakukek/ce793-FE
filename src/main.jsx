import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

console.log("CLERK KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}
      appearance={{ layout: { unsafe_disableDevelopmentModeWarnings: true } }}>
      <App />
      <Toaster position="top-right" />
    </ClerkProvider>
  </React.StrictMode>
);

