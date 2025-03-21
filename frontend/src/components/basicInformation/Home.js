// src/pages/Home.js
import React from "react";
import { useState } from "react";
import TypewriterEffect from "../../utils/TypewriterEffect";
import CurrentTimeGeneration from "../../utils/CurrentTimeGeneration";
import "../../styles/Home.css";

const Home = () => {

  const Inception = () => {
    // Get the h1 element
    const h1Element = document.querySelector('.home-header h1');
    if (!h1Element) return;
    
    // Store original content and style for potential reversion
    const originalContent = h1Element.innerHTML;
    const originalClasses = h1Element.className;
    
    // Add the Van Gogh starry night effect CSS
    if (!document.getElementById('inception-style')) {
      const style = document.createElement('style');
      style.id = 'inception-style';
      style.textContent = `
        @keyframes vanGoghRotate {
          0% { transform: rotate(0deg) scale(1); filter: blur(2px); }
          25% { transform: rotate(90deg) scale(1.1); filter: blur(3px); }
          50% { transform: rotate(180deg) scale(0.9); filter: blur(4px); }
          75% { transform: rotate(270deg) scale(1.1); filter: blur(3px); }
          100% { transform: rotate(360deg) scale(1); filter: blur(2px); }
        }
        
        .vangogh-effect {
          animation: vanGoghRotate 15s infinite cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--color-gold);
          display: inline-block;
          transform-origin: center;
          text-shadow: 0 0 10px var(--color-gold-light), 0 0 20px var(--color-gold), 0 0 30px var(--color-ivory);
          position: relative;
          transition: all 1s ease;
        }
        
        .vangogh-stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
        
        .vangogh-star {
          position: absolute;
          background: radial-gradient(circle, var(--color-gold-light) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(2px);
          animation: twinkle 4s infinite alternate;
        }
        
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.3); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create the starry sky container
    const starContainer = document.createElement('div');
    starContainer.className = 'vangogh-stars';
    
    // Add random stars in the background
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'vangogh-star';
      star.style.width = `${3 + Math.random() * 5}px`;
      star.style.height = star.style.width;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      starContainer.appendChild(star);
    }
    
    // Apply the effect to the h1
    h1Element.className = `${originalClasses} vangogh-effect`;
    h1Element.appendChild(starContainer);
  };
  

  return (
    <div className="home">
      <header className="home-header">
        <h1>This is Laurence Wu</h1>
      </header>
      
      <main className="home-main">
        <div className="typewriter-container">
          <span className="typewriter-text">
            <h2>My fire's in 
            <TypewriterEffect             
            strings={[
              "avionics engineering",
              "soft robotics",
              "embedded systems",
              "web development",
            ]}
            typeSpeed={80}
            backSpeed={50}
            loop={true}/>
            </h2>
          </span>
        </div>
      </main>
      
      <aside className="home-sidebar">
        The Voyer d'Argenson Park in Asnieres by Vincent van Gogh
        <button onClick={Inception}>Inception</button>
      </aside>
      
      

      <section className="home-features">
        <div className="feature-card">
          <div className="face">
            <h3>Education:</h3>
          </div>
          <p>Georgia Institute of Technology where no one likes neo-impressionism</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Major and Minors:</h3>
          </div>
          <p>Major in Computer Engineering and Minor in Robotics</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Fun Fact:</h3>
          </div>
          <p>I'm a strong ENTJ but loves impressionism</p>
        </div>
        
        <div className="feature-card">
          <div className="face">
            <h3>Hot Take:</h3>
          </div>
          <p>Frontends will not lose their jobs in the face of AI!</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Favorite Sport:</h3>
          </div>
          <p>I love badminton and gym</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Favorite AI:</h3>
          </div>
          <p>Perplexity: free and powerful ~~</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Favorite board:</h3>
          </div>
          <p>Raspberry 3B: cheap and support ethernet</p>
        </div>

        <div className="feature-card">
          <div className="face">
            <h3>Current Status:</h3>
          </div>
          <p>Single and open to work...</p>
        </div>
      </section>
    </div>
  );
};
export default Home;
