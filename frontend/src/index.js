// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Beachboy from "./Beachboy";
import Login from "./Login";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Pagina de autentificare */}
        <Route path="/" element={<Login />} />

        {/* Pagina completă pentru administrator */}
        <Route path="/admin" element={<App />} />

        {/* Pagina simplificată pentru beachboy */}
        <Route path="/beachboy" element={<Beachboy />} />

        {/* Redirect pentru orice altceva către login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
