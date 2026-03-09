import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";


import "./App.css";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>
    </Router>
  );
}

export default App;
