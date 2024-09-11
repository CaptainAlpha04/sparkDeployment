'use client'
import React, { useEffect, useRef } from 'react';

const StarryCanvas = (props) => {
  const canvasRef = useRef(null);
  const stars = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const numStars = props.numberOfStars || 200;
    const starSize = props.givenStarSize || 2; // Base size of stars
    
    const initializeStars = () => {
      stars.current = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * starSize,
        dx: (Math.random() - 0.5) * 0.2, // Movement in x direction
        dy: (Math.random() - 0.5) * 0.2, // Movement in y direction
        twinkleSpeed: Math.random() * 0.01, // Speed of twinkling
        opacity: Math.random(),
      }));
    };

    const updateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.current.forEach(star => {
        // Update position
        star.x += star.dx;
        star.y += star.dy;

        // Wrap around the edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Update twinkle effect
        star.opacity = (Math.sin(star.twinkleSpeed * Date.now()) + 1) / 2;

        // Draw the star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeStars();
    };

    resizeCanvas(); // Initial setup
    window.addEventListener('resize', resizeCanvas); // Resize on window resize

    const animate = () => {
      updateStars();
      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-screen" />;
};

export default StarryCanvas;
