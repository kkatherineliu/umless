import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { fillerWordCount = 0, transcript = "" } = location.state || {};

  const fillerWords = [
    "uh", "um", "mhmm", "mm-mm", "uh-uh", "uh-huh", "nuh-uh", "like"
  ];

  const highlightFillerWords = (text) => {
    const regex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
  };

  const handleNewRecording = () => {
    navigate("/record");
  };

  return (
    <div className="results-page-container">
      <h1>RECORDING RESULTS</h1>
      <div
        className="transcript-box"
        dangerouslySetInnerHTML={{ __html: highlightFillerWords(transcript) }}
      />
      <div className="results-stats">
        <div className="results-stat">
          <span>
            <span className="stat-label">FILLER</span>
            <span className="stat-label">WORDS:</span>
          </span>
          <span className="stat-value">{fillerWordCount}</span>
        </div>
        <div className="results-stat">
          <span>
            <span className="stat-label">AMOUNT</span>
            <span className="stat-label">DONATED:</span>
          </span>
          <span className="stat-value">${(fillerWordCount * 0.05).toFixed(2)}</span>
        </div>
        <div className="button-container">
          <button onClick={handleNewRecording}>new recording</button>
          <button onClick={() => navigate("/history")}>see history</button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
