import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please drop a valid PDF file.");
      setFile(null);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
    return interval;
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");
    
    const progressInterval = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setResponse(res.data.result);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timed out. Please try again with a smaller file.");
      } else if (err.response?.data?.error?.includes('safety reasons')) {
        setError("The AI declined to process this content for safety reasons. Please try with different content.");
      } else {
        setError("An error occurred while processing your file. Please try again.");
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!response) return;

    const blob = new Blob([response], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-evaluation-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResponse("");
    setError("");
    setProgress(0);
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1 className="title">Course Evaluation Summarizer</h1>
            <p className="subtitle">
              Transform your course evaluations into constructive insights with AI
            </p>
            <div className="powered-by">
              <span>Powered by</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="anthropic-logo">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Anthropic Claude 4</span>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="upload-section">
            <div 
              className="upload-card"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              
              <h2 className="upload-title">Upload Your PDF</h2>
              <p className="upload-description">
                Select or drag and drop a PDF file containing course evaluations
              </p>
              
              <div className="file-input-container">
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                  {file ? (
                    <span className="file-selected">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                      </svg>
                      {file.name}
                    </span>
                  ) : (
                    <span>Choose PDF file or drag here</span>
                  )}
                </label>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </div>
              )}

              {loading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {progress < 30 ? "Extracting text from PDF..." : 
                     progress < 70 ? "Analyzing with AI..." : 
                     "Generating summary..."}
                  </p>
                </div>
              )}

              <div className="button-group">
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v6m0 0l4-4m-4 4L8 3"/>
                        <path d="M8 5H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      </svg>
                      Analyze Evaluations
                    </>
                  )}
                </button>
                
                {(file || response) && (
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
                      <path d="M3 21v-5h5"/>
                    </svg>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {response && (
            <div className="results-section">
              <div className="results-card">
                <div className="results-header">
                  <h3 className="results-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                    </svg>
                    Analysis Complete
                  </h3>
                  <button
                    onClick={handleDownload}
                    className="btn btn-download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <path d="M7 10l5 5 5-5"/>
                      <path d="M12 15V3"/>
                    </svg>
                    Download Summary
                  </button>
                </div>
                
                <div className="results-content">
                  <div className="results-text">{response}</div>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>Built with care for educators everywhere • Powered by Anthropic Claude 4</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
