import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import RecordingPage from "./RecordingPage";
import ResultsPage from "./ResultsPage";
import LoginButton from "./login";
import LogoutButton from "./logout";
import { useAuth0 } from "@auth0/auth0-react";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/record" element={<RecordingPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function LandingPage() {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="App-header">
      <h1>umless</h1>
      <NavigateButton />
      {!isAuthenticated ? <LoginButton /> : <LogoutButton />}
    </div>
  );
}

function NavigateButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/record");
  };

  return <button onClick={handleClick}>Go to Recording Page</button>;
}

export default App;
