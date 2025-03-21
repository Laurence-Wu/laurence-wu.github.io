// src/components/TypewriterEffect.js
import React, { useEffect, useRef } from 'react';
import Typed from 'typed.js';

const TypewriterEffect = ({ strings, typeSpeed = 2, backSpeed = 50, loop = true }) => {
  const el = useRef(null);

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings,
      typeSpeed,
      backSpeed,
      loop,
      cursorChar: '|',
    });

    return () => {
      typed.destroy();
    };
  }, [strings, typeSpeed, backSpeed, loop]);

  return <span ref={el} className="typewriter-text"></span>;
};

export default TypewriterEffect;
