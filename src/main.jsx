import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/clerk-react";

const VITE_CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!VITE_CLERK_PUBLISHABLE_KEY) {
  VITE_CLERK_PUBLISHABLE_KEY="pk_live_Y2xlcmsuY2U3MzktZmUucGFnZXMuZGV2JA";
  console.log(VITE_CLERK_PUBLISHABLE_KEY);
  throw new Error("Missing Clerk publishable key");

}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{ layout: { unsafe_disableDevelopmentModeWarnings: true } }}>
      <App />
      <Toaster position="top-right" />
    </ClerkProvider>
  </React.StrictMode>
);

