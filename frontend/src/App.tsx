import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import SignIn from "./pages/auth/SignIn";

type ApiResponse = {
  message: string;
};

const App: React.FC = () => {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    axios
      .get<ApiResponse>("http://127.0.0.1:5000/api/get")
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <Router>  
      <Routes>
        <Route path="/" element={<div><h1>Flask + React + TypeScript</h1><p>{message}</p></div>} />
        <Route path="/auth/signin" element={<SignIn />} />
      </Routes>
    </Router>
  );
};

export default App;
