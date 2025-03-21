import React, { useState } from 'react';
import TeX from '@matejmazur/react-katex';
import SmithChartVisualization from './SmiteChartVisualization';
import 'katex/dist/katex.min.css';
import '../styles/SmithChartTransmissionLine.css'

const SmithChartTransmissionLine = () => {
  const [termination, setTermination] = useState("matched");
  
  // Smith chart formulas based on termination type
  const getSmithChartFormulas = () => {
    switch(termination) {
      case "matched":
        return {
          reflectionCoefficient: "\\Gamma = 0",
          impedanceFormula: "Z_L = Z_0 = 50\\Omega",
          description: "Matched termination (50Ω). No reflection, maximum power transfer."
        };
      case "open":
        return {
          reflectionCoefficient: "\\Gamma = 1",
          impedanceFormula: "Z_L = \\infty",
          description: "Open circuit termination (∞Ω). Total reflection with same polarity."
        };
      case "short":
        return {
          reflectionCoefficient: "\\Gamma = -1",
          impedanceFormula: "Z_L = 0",
          description: "Short circuit termination (0Ω). Total reflection with opposite polarity."
        };
      case "low":
        return {
          reflectionCoefficient: "\\Gamma = \\frac{Z_L - Z_0}{Z_L + Z_0} = \\frac{25 - 50}{25 + 50} = -\\frac{1}{3}",
          impedanceFormula: "Z_L = 25\\Omega",
          description: "Low impedance termination (25Ω). Partial reflection with opposite polarity."
        };
      case "high":
        return {
          reflectionCoefficient: "\\Gamma = \\frac{Z_L - Z_0}{Z_L + Z_0} = \\frac{100 - 50}{100 + 50} = \\frac{1}{3}",
          impedanceFormula: "Z_L = 100\\Omega",
          description: "High impedance termination (100Ω). Partial reflection with same polarity."
        };
      default:
        return {
          reflectionCoefficient: "\\Gamma = 0",
          impedanceFormula: "Z_L = Z_0",
          description: "Matched termination. No reflection."
        };
    }
  };

  // Smith chart general formulas
  const generalFormulas = {
    reflectionCoefficient: "\\Gamma = \\frac{Z_L - Z_0}{Z_L + Z_0}",
    vswr: "\\text{VSWR} = \\frac{1 + |\\Gamma|}{1 - |\\Gamma|}",
    inputImpedance: "Z_{in} = Z_0 \\frac{Z_L + jZ_0\\tan(\\beta l)}{Z_0 + jZ_L\\tan(\\beta l)}"
  };

  const formulas = getSmithChartFormulas();

  return (
    <div className="smith-chart-container">
      <h2>Smith Chart and Transmission Line Theory</h2>
      
      <div className="termination-selector">
        <h3>Select Termination Type:</h3>
        <div className="button-group">
          <button 
            className={termination === "matched" ? "active" : ""} 
            onClick={() => setTermination("matched")}>
            Matched (50Ω)
          </button>
          <button 
            className={termination === "open" ? "active" : ""} 
            onClick={() => setTermination("open")}>
            Open Circuit
          </button>
          <button 
            className={termination === "short" ? "active" : ""} 
            onClick={() => setTermination("short")}>
            Short Circuit
          </button>
          <button 
            className={termination === "low" ? "active" : ""} 
            onClick={() => setTermination("low")}>
            Low Impedance (25Ω)
          </button>
          <button 
            className={termination === "high" ? "active" : ""} 
            onClick={() => setTermination("high")}>
            High Impedance (100Ω)
          </button>
        </div>
      </div>

      <div className="theory-section">
        <h3>Transmission Line Behavior</h3>
        <p>{formulas.description}</p>
      </div>

      <div className="formulas-section">
        <h3>Smith Chart Formulas</h3>
        
        <div className="formula-box">
          <h4>General Formulas</h4>
          <div className="formula">
            <p>Reflection Coefficient:</p>
            <TeX math={generalFormulas.reflectionCoefficient} block />
          </div>
          <div className="formula">
            <p>Voltage Standing Wave Ratio (VSWR):</p>
            <TeX math={generalFormulas.vswr} block />
          </div>
          <div className="formula">
            <p>Input Impedance at Distance l from Load:</p>
            <TeX math={generalFormulas.inputImpedance} block />
          </div>
        </div>
          <SmithChartVisualization></SmithChartVisualization>
        <div className="formula-box">
          <h4>For {termination === "matched" ? "Matched (50Ω)" : 
                    termination === "open" ? "Open Circuit" :
                    termination === "short" ? "Short Circuit" :
                    termination === "low" ? "Low Impedance (25Ω)" :
                    "High Impedance (100Ω)"} Termination</h4>
          <div className="formula">
            <p>Load Impedance:</p>
            <TeX math={formulas.impedanceFormula} block />
          </div>
          <div className="formula">
            <p>Reflection Coefficient:</p>
            <TeX math={formulas.reflectionCoefficient} block />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmithChartTransmissionLine;
