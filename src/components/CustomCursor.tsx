'use client';

import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);
    };

    // Mouse enter/leave handlers
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Hover state handlers
    const handleElementHover = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.getAttribute('role') === 'button'
      ) {
        ring.classList.add('hover');
        dot.classList.add('hover');
      }
    };

    const handleElementLeave = () => {
      ring.classList.remove('hover');
      dot.classList.remove('hover');
      ring.classList.remove('text');
      dot.classList.remove('text');
    };

    // Text cursor state
    const handleTextHover = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        ring.classList.add('text');
        dot.classList.add('text');
      }
    };

    // Animation loop for smooth cursor following
    const animate = () => {
      // Smooth follow for dot (faster)
      dotX += (mouseX - dotX) * 0.8;
      dotY += (mouseY - dotY) * 0.8;

      // Smooth follow for ring (slower, creates lag effect)
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (dot) {
        dot.style.left = `${dotX}px`;
        dot.style.top = `${dotY}px`;
      }

      if (ring) {
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
      }

      requestAnimationFrame(animate);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleElementHover);
    document.addEventListener('mouseout', handleElementLeave);
    document.addEventListener('mouseover', handleTextHover);

    // Start animation loop
    const animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleElementHover);
      document.removeEventListener('mouseout', handleElementLeave);
      document.removeEventListener('mouseover', handleTextHover);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="cursor-container" style={{ opacity: isVisible ? 1 : 0 }}>
      <div ref={dotRef} className="conclave-cursor-dot" />
      <div ref={ringRef} className="conclave-cursor-ring" />
    </div>
  );
}