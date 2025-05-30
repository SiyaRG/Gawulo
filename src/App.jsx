import React, { useState } from "react";
import { app } from "./firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import "./App.css";

// Initialize Firebase AI Logic (Gemini) for the current app
const ai = getAI(app, { backend: new GoogleAIBackend() });

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    try {
      const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      // result.response.text() returns a Promise<string>
      const text = await result.response.text();
      setResponse(text || "No response.");
    } catch (err) {
      setResponse("Error: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <h1>Gawulo Food App</h1>
      <form onSubmit={handleAsk} style={{ marginBottom: 24 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Gemini something..."
        />
        <button type="submit" disabled={loading || !prompt.trim()}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
      <h2>Gemini Response:</h2>
      <pre>{response}</pre>
    </div>
  );
}

export default App;
