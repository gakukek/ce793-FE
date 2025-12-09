import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from '@clerk/clerk-react';

// Use Clerk only when configured; avoid passing empty frontendApi which can cause runtime errors
const clerkFrontendApi = import.meta.env.VITE_CLERK_FRONTEND_API;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {clerkFrontendApi ? (
      <ClerkProvider frontendApi={clerkFrontendApi}>
        <App />
        <Toaster position="top-right" />
      </ClerkProvider>
    ) : (
      <>
        <App />
        <Toaster position="top-right" />
      </>
    )}
  </React.StrictMode>
);
