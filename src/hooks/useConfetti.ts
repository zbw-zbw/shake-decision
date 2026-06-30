"use client";

import { useCallback, useRef } from "react";

const CONFETTI_COLORS = ["#4f46e5", "#7c3aed", "#fbbf24", "#34d399", "#f472b6"];
const PARTICLE_COUNT = 65;
const ANIMATION_DURATION = 1500;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
  opacity: number;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useConfetti(): {
  triggerConfetti: () => void;
} {
  const animFrameRef = useRef<number | null>(null);

  const triggerConfetti = useCallback(() => {
    if (typeof document === "undefined") return;

    // Clean up any previous confetti
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    if (!ctx) {
      document.body.removeChild(canvas);
      return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = randomRange(-Math.PI * 0.8, -Math.PI * 0.2); // upward spread
      const speed = randomRange(3, 9);

      particles.push({
        x: centerX + randomRange(-50, 50),
        y: canvas.height * randomRange(0.05, 0.15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * randomRange(0.5, 1.5),
        size: randomRange(4, 10),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: randomRange(0, Math.PI * 2),
        rotationSpeed: randomRange(-0.1, 0.1),
        shape: Math.random() > 0.5 ? "rect" : "circle",
        opacity: 1,
      });
    }

    const startTime = performance.now();
    const gravity = 0.12;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;

      if (elapsed > ANIMATION_DURATION) {
        // Cleanup
        document.body.removeChild(canvas);
        animFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fade out in the last 400ms
      const fadeStart = ANIMATION_DURATION - 400;
      const globalAlpha = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / 400 : 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = globalAlpha;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  return { triggerConfetti };
}
