import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist';
import '../styles/SmithChartVisualization.css';

const SmithChartVisualization = ({ termination }) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  
  // Calculate reflection coefficient based on termination type
  const calculateReflectionPoints = (terminationType) => {
    // Default values
    let real = [];
    let imag = [];
    
    // For simple fixed-point plots showing the reflection coefficient location
    switch(terminationType) {
      case "matched":
        // Γ = 0: Plot at the center of the Smith chart
        real = [0];
        imag = [0];
        break;
      case "open":
        // Γ = 1: Plot at the rightmost point of the Smith chart
        real = [1];
        imag = [0];
        break;
      case "short":
        // Γ = -1: Plot at the leftmost point of the Smith chart
        real = [-1];
        imag = [0];
        break;
      case "low":
        // Γ = -1/3: For a 25Ω load on a 50Ω line
        real = [-1/3];
        imag = [0];
        break;
      case "high":
        // Γ = 1/3: For a 100Ω load on a 50Ω line
        real = [1/3];
        imag = [0];
        break;
      default:
        real = [0];
        imag = [0];
    }
    
    return { real, imag };
  };
  
  // Generate transmission line points along the Smith chart
  const generateTransmissionLinePoints = (terminationType) => {
    const points = {
      real: [],
      imag: []
    };
    
    // Starting point (reflection coefficient at load)
    const { real: startReal, imag: startImag } = calculateReflectionPoints(terminationType);
    
    // For a lossless line, the reflection coefficient rotates along a circle
    // as we move away from the load
    const pointCount = 100;
    const maxAngle = Math.PI; // Half circle rotation (λ/2)
    
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / (pointCount - 1)) * maxAngle;
      
      // No rotation for matched load (Γ = 0)
      if (terminationType === "matched") {
        points.real.push(0);
        points.imag.push(0);
        continue;
      }
      
      // Calculate the magnitude of the reflection coefficient
      const magnitude = Math.sqrt(startReal[0] * startReal[0] + startImag[0] * startImag[0]);
      
      // Calculate the initial angle
      const initialAngle = Math.atan2(startImag[0], startReal[0]);
      
      // New angle after rotation
      const newAngle = initialAngle + angle;
      
      // Calculate new coordinates
      points.real.push(magnitude * Math.cos(newAngle));
      points.imag.push(magnitude * Math.sin(newAngle));
    }
    
    return points;
  };
  
  useEffect(() => {
    // Clear previous chart if it exists
    if (chartInstance) {
      Plotly.purge(chartRef.current);
    }
    
    // Get reflection coefficient point
    const { real, imag } = calculateReflectionPoints(termination);
    
    // Get transmission line points
    const linePoints = generateTransmissionLinePoints(termination);
    
    // Create data for the Smith Chart
    const data = [
      // Point showing the reflection coefficient
      {
        type: 'scattersmith',
        real: real,
        imag: imag,
        mode: 'markers',
        name: 'Reflection Coefficient',
        marker: {
          size: 12,
          color: '#e41a1c',
          symbol: 'circle'
        },
        text: [`Γ = ${real[0]}${imag[0] === 0 ? '' : ' + j' + imag[0]}`],
        hoverinfo: 'text'
      },
      // Line showing the transmission line behavior
      {
        type: 'scattersmith',
        real: linePoints.real,
        imag: linePoints.imag,
        mode: 'lines',
        name: 'Transmission Line',
        line: {
          color: '#377eb8',
          width: 2
        }
      }
    ];
    
    // Layout configuration
    const layout = {
      title: `Smith Chart - ${termination === "matched" ? "Matched (50Ω)" : 
              termination === "open" ? "Open Circuit" :
              termination === "short" ? "Short Circuit" :
              termination === "low" ? "Low Impedance (25Ω)" :
              "High Impedance (100Ω)"} Termination`,
      width: 500,
      height: 500,
      smith: {
        realaxis: {
          gridcolor: '#a9a9a9',
          showticklabels: true,
          tickcolor: '#000000',
          title: {
            text: 'Real Component'
          }
        },
        imaginaryaxis: {
          gridcolor: '#a9a9a9',
          showticklabels: true,
          tickcolor: '#000000',
          title: {
            text: 'Imaginary Component'
          }
        },
        bgcolor: '#f8f8f8'
      },
      margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 80
      }
    };
    
    // Create the Smith chart
    Plotly.newPlot(chartRef.current, data, layout).then(instance => {
      setChartInstance(instance);
    });
    
    // Cleanup function
    return () => {
      if (chartRef.current) {
      Plotly.purge(chartRef.current);
      }
    };
    }, [termination]);
    
    return (
    <div className="smith-chart-container" style={{ height: '150%' }}>
      <div className="chart-content" ref={chartRef} style={{ height: '50%' }}></div>
    </div>
    );
};

export default SmithChartVisualization;
//       <