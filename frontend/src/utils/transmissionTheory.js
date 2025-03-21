import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import SmithChartTransmissionLine from "./SmithChartTransmissionLine";

const TransmissionLineSimulator = () => {
  // State management
  const [termination, setTermination] = useState('match');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [reflectionCoefficient, setReflectionCoefficient] = useState(0);
  
  // Canvas reference
  const canvasRef = useRef(null);
  
  // Effect for reflection coefficient
  useEffect(() => {
    switch(termination) {
      case 'open': setReflectionCoefficient(1); break;
      case 'short': setReflectionCoefficient(-1); break;
      case 'match': setReflectionCoefficient(0); break;
      case 'low': setReflectionCoefficient(-0.33); break;
      case 'high': setReflectionCoefficient(0.33); break;
    }
  }, [termination]);
  
  // Oscilloscope drawing function
  const drawOscilloscope = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const time = (Date.now() / 1000) * animationSpeed;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw combined waveform
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = height / 2;
    ctx.moveTo(0, centerY);
    
    for (let x = 0; x < width; x++) {
      const normalizedX = x / width;
      
      // Incident wave calculation
      const incidentPhase = normalizedX * 10 - time * 2;
      const incidentComponent = Math.sin(incidentPhase);
      
      // Reflected wave calculation
      const reflectedPhase = (1 - normalizedX) * 10 + time * 2;
      const reflectedComponent = reflectionCoefficient * Math.sin(reflectedPhase);
      
      // Combined wave
      const totalWave = incidentComponent + reflectedComponent;
      
      const y = centerY - (totalWave * height * 0.2);
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    if (!isPaused) {
      requestAnimationFrame(drawOscilloscope);
    }
  };
  
  // Reset animation function with modern optimizations
  const resetAnimation = () => {
    const segments = document.querySelectorAll('.segment');
    
    segments.forEach((segment, index) => {
      requestAnimationFrame(() => {
        segment.style.animation = 'none';
        void segment.offsetWidth;
        segment.style.animation = '';
        segment.style.animationDelay = `${index * 0.05}s`;
      });
    });
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      drawOscilloscope();
    }
  };
  
  // Toggle pause state
  const togglePause = () => setIsPaused(!isPaused);
  
  // Effect for canvas initialization
  useEffect(() => {
    if (canvasRef.current) {
      drawOscilloscope();
    }
  }, [reflectionCoefficient, animationSpeed, isPaused]);
  
  return (
    <SimulationContainer>
            <h1>Transmission Line Simulator</h1>

<ControlPanel>
  <ControlGroup>
    <label htmlFor="termination">Termination:</label>
    <select
      id="termination"
      value={termination}
      onChange={(e) => setTermination(e.target.value)}
    >
      <option value="open">Open (∞Ω)</option>
      <option value="short">Short (0Ω)</option>
      <option value="match">Matched (50Ω)</option>
      <option value="low">Low Impedance (25Ω)</option>
      <option value="high">High Impedance (100Ω)</option>
    </select>
  </ControlGroup>

  <ControlGroup>
    <label htmlFor="speed">Animation Speed:</label>
    <input
      type="range"
      id="speed"
      min="0.1"
      max="2"
      step="0.1"
      value={animationSpeed}
      onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
    />
    <span>{animationSpeed.toFixed(1)}x</span>
  </ControlGroup>

  <ButtonGroup>
    <Button onClick={togglePause}>{isPaused ? "Play" : "Pause"}</Button>
    <Button onClick={resetAnimation}>Reset</Button>
  </ButtonGroup>
</ControlPanel>

<TransmissionLine
  className={`termination-${termination} ${isPaused ? "paused" : ""}`}
>
  <Source>
    <SourceIndicator />
  </Source>

  <Line>
    {/* Staggered segments to visualize the wave propagation */}
    <StaggeredSegments>
      {[...Array(20)].map((_, index) => (
        <div key={index} className="segment" style={{ "--i": index }} />
      ))}
    </StaggeredSegments>

    <IncidentWave speed={animationSpeed} />

    {reflectionCoefficient !== 0 && (
      <ReflectedWave
        speed={animationSpeed}
        coefficient={reflectionCoefficient}
      />
    )}

    <TotalWave
      speed={animationSpeed}
      showStanding={reflectionCoefficient !== 0}
    />
  </Line>

  <Load>
    <LoadIndicator type={termination} />
  </Load>
</TransmissionLine>
      <Oscilloscope>
        <canvas ref={canvasRef} width="800" height="200" />
      </Oscilloscope>
      <ExplanationPanel>
        <h3>Current Status:</h3>
        {termination === "match" && (
          <p>
            Matched termination (50Ω). No reflection, maximum power transfer.
          </p>
        )}
        {termination === "open" && (
          <p>
            Open circuit termination (∞Ω). Total reflection with same polarity.
          </p>
        )}
        {termination === "short" && (
          <p>
            Short circuit termination (0Ω). Total reflection with opposite
            polarity.
          </p>
        )}
        {termination === "low" && (
          <p>
            Low impedance termination (25Ω). Partial reflection with opposite
            polarity.
          </p>
        )}
        {termination === "high" && (
          <p>
            High impedance termination (100Ω). Partial reflection with same
            polarity.
          </p>
        )}
      </ExplanationPanel>
      <SmithChartTransmissionLine></SmithChartTransmissionLine>
    </SimulationContainer>
  );
};

// Keyframe animations
const propagateRight = keyframes`
  0% {
    transform: translateX(-50px);
  }
  100% {
    transform: translateX(calc(100% + 50px));
  }
`;

const propagateLeft = keyframes`
  0% {
    transform: translateX(calc(100% + 50px));
  }
  100% {
    transform: translateX(-50px);
  }
`;

const standingWave = keyframes`
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const ripple = keyframes`
  0% {
    transform: translateY(0);
    background: rgba(231, 76, 60, 0.8);
  }
  50% {
    transform: translateY(-20px);
    background: rgba(231, 76, 60, 0.4);
  }
  100% {
    transform: translateY(0);
    background: rgba(231, 76, 60, 0.8);
  }
`;

// Styled components
const SimulationContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #2c3e50;
  }
`;

const ControlPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;

  label {
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 14px;
  }

  select,
  input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  span {
    margin-top: 5px;
    font-size: 14px;
    text-align: center;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2980b9;
  }
`;

const TransmissionLine = styled.div`
  display: flex;
  align-items: center;
  height: 150px;
  margin: 30px 0;
  position: relative;

  &.paused .incident-wave,
  &.paused .reflected-wave,
  &.paused .total-wave,
  &.paused .segment {
    animation-play-state: paused;
  }
`;

const Source = styled.div`
  width: 50px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f1f1f1;
  border: 2px solid #333;
  position: relative;
`;

const SourceIndicator = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e74c3c;
  animation: ${pulse} 2s infinite;
`;

const Line = styled.div`
  flex: 1;
  height: 10px;
  background-color: #bdc3c7;
  position: relative;
  overflow: hidden;
`;

const StaggeredSegments = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .segment {
    width: 5%;
    height: 100%;
    background: transparent;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(231, 76, 60, 0.8);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: ${ripple} 2s infinite;
      animation-delay: calc(0.05s * var(--i));
    }
  }
`;

const IncidentWave = styled.div.attrs({ className: "incident-wave" })`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.7;
  background: linear-gradient(
    90deg,
    transparent,
    transparent 20px,
    #e74c3c 20px,
    #e74c3c 25px,
    transparent 25px,
    transparent 45px
  );
  background-size: 50px 100%;
  animation: ${propagateRight} ${(props) => 2 / props.speed}s linear infinite;
`;

const ReflectedWave = styled.div.attrs({ className: "reflected-wave" })`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: ${(props) => Math.abs(props.coefficient) * 0.7};
  background: linear-gradient(
    90deg,
    transparent,
    transparent 20px,
    #3498db 20px,
    #3498db 25px,
    transparent 25px,
    transparent 45px
  );
  background-size: 50px 100%;
  animation: ${propagateLeft} ${(props) => 2 / props.speed}s linear infinite;
`;

const TotalWave = styled.div.attrs({ className: "total-wave" })`
  position: absolute;
  width: 100%;
  height: 0;
  border-top: 5px solid #2ecc71;
  bottom: 0;
  left: 0;
  animation: ${(props) => (props.showStanding ? standingWave : "none")}
    ${(props) => 2 / props.speed}s linear infinite;
`;

const Load = styled.div`
  width: 50px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f1f1f1;
  border: 2px solid #333;
`;

const LoadIndicator = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${(props) => {
    switch (props.type) {
      case "open":
        return "#f39c12";
      case "short":
        return "#2c3e50";
      case "match":
        return "#3498db";
      case "low":
        return "#9b59b6";
      case "high":
        return "#1abc9c";
      default:
        return "#3498db";
    }
  }};
`;

const Oscilloscope = styled.div`
  height: 200px;
  border: 2px solid #333;
  margin-bottom: 20px;
  background: #222;
  position: relative;
  overflow: hidden;

  canvas {
    width: 100%;
    height: 100%;
  }
`;

const ExplanationPanel = styled.div`
  padding: 15px;
  background: #ecf0f1;
  border-radius: 6px;

  h3 {
    margin-bottom: 10px;
  }

  p {
    line-height: 1.6;
  }
`;

export default TransmissionLineSimulator;
