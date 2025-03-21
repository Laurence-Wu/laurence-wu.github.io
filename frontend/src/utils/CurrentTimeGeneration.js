import React, { useState, useEffect } from 'react';
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';

const CurrentTimeGeneration = ()  => {
    const [mathFormula, setMathFormula] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    // Fixed LaTeX syntax with proper integral formatting
    // Get derived values from currentTime state
    const currentMathFormula = function(currentTime) {
        const seconds = currentTime.getSeconds();
        const milliseconds = currentTime.getMilliseconds();
        const math = `f(x, y) = f(a, b) 
+ \\begin{bmatrix} \\dfrac{\\partial f}{\\partial x}(a, b) & \\dfrac{\\partial f}{\\partial y}(a, b) \\end{bmatrix} 
\\begin{pmatrix} x - a \\\\ y - b \\end{pmatrix} 
+ \\frac{1}{2} \\begin{bmatrix} x - a & y - b \\end{bmatrix} 
\\mathbf{H}f(a, b) 
\\begin{bmatrix} x - a \\\\ y - b \\end{bmatrix} 
+ \\mathcal{O}\\left( \\|\\mathbf{x} - \\mathbf{a}\\|^3 \\right)`;

        return math;
    }

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString());
            setMathFormula(currentMathFormula(new Date()));
        }, 512);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="currentTime">
            <h2>Current Time: {currentTime}</h2>
        </div>
        
    )
}
export default CurrentTimeGeneration;
