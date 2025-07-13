import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        setError(data.error || "Eroare la autentificare");
        return;
      }
  
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);
  
      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "staff") {
        navigate("/beachboy");
      }
    } catch (err) {
      setError("Eroare de rețea");
      console.error(err);
    }
  };
  

export default Login;