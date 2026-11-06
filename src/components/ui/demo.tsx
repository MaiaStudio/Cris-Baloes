'use client';

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BalloonBackgroundProps {
  className?: string;
}

export default function BalloonBackground({ className }: BalloonBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface ColorSet {
      base: string;
      light: string;
      dark: string;
    }

    let balloons: Balloon[] = [];
    let particles: Particle[] = [];
    const mouse = { x: -2000, y: -2000 };
    const balloonCount = 30;

    const colors: ColorSet[] = [
      { base: "#ff2e63", light: "#ff6b8f", dark: "#9d0b2e" },
      { base: "#00d2ff", light: "#80eaff", dark: "#006a80" },
      { base: "#ffd700", light: "#fff080", dark: "#998100" },
      { base: "#9d50bb", light: "#c089d8", dark: "#4f285e" },
      { base: "#43e97b", light: "#a6f7c1", dark: "#1e6a38" },
      { base: "#ff9a9e", light: "#fecfef", dark: "#cc7a7e" },
      { base: "#00c9ff", light: "#92fe9d", dark: "#00607a" },
    ];

    let currentDpr = 1;
    let logicalW = window.innerWidth;
    let logicalH = window.innerHeight;

    /* ================= PARTICLES ================= */

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      gravity = 0.2;
      opacity = 1;
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 12;
        this.speedY = (Math.random() - 0.5) * 12;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.025;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* ================= BALLOONS ================= */

    class Balloon {
      x = 0;
      y = 0;
      r = 0;
      speed = 0;
      angle = 0;
      wobbleSpeed = 0;
      popped = false;
      colorSet: ColorSet = colors[0];

      // Tail physics
      tailMidY = 0;
      tailEndY = 0;
      tailVelMid = 0;
      tailVelEnd = 0;
      prevX = 0;

      constructor(first = true) {
        this.init(first);
      }

      init(firstLoad: boolean) {
        if (!canvas) return;
        this.r = Math.random() * 15 + 30;
        this.x = Math.random() * logicalW;
        this.y = firstLoad
          ? Math.random() * logicalH
          : logicalH + this.r + 200;

        this.colorSet = colors[Math.floor(Math.random() * colors.length)];
        this.speed = Math.random() * 1 + 0.4;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.angle = Math.random() * Math.PI * 2;
        this.popped = false;

        this.prevX = this.x;
        this.tailMidY = this.r + 40;
        this.tailEndY = this.r + 120;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
      }

      drawBalloonPath(r: number) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.2, r * 0.8, -r * 1.3, -r * 1.2, 0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.3, -r * 1.2, r * 1.2, r * 0.8, 0, r);
        ctx.closePath();
      }

      drawString() {
        if (!ctx) return;
        const dx = this.x - this.prevX;
        this.prevX = this.x;

        const stiffness = 0.08;
        const damping = 0.85;
        const gravity = 0.35;

        const midTarget = this.r + 40 + Math.abs(dx) * 8;
        this.tailVelMid += (midTarget - this.tailMidY) * stiffness;
        this.tailVelMid *= damping;
        this.tailMidY += this.tailVelMid;

        const endTarget = this.r + 120 + Math.abs(dx) * 14;
        this.tailVelEnd += (endTarget - this.tailEndY) * stiffness;
        this.tailVelEnd *= damping;
        this.tailVelEnd += gravity;
        this.tailEndY += this.tailVelEnd;

        const sway = Math.sin(this.angle * 1.8) * 6 + dx * 4;

        ctx.beginPath();
        ctx.moveTo(0, this.r + 5);
        ctx.bezierCurveTo(
          sway,
          this.tailMidY * 0.5,
          -sway,
          this.tailMidY,
          sway * 0.6,
          this.tailEndY
        );
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      pop() {
        if (this.popped) return;
        this.popped = true;

        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(this.x, this.y, this.colorSet.base));
        }

        setTimeout(() => this.init(false), 1000 + Math.random() * 1000);
      }

      update() {
        if (this.popped) return;

        this.y -= this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle * 0.6) * 0.8;

        const dx = this.x - mouse.x;
        const dy = this.y - this.r * 0.2 - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.r + 10) {
          this.pop();
        }

        if (this.y < -this.r - 200) this.init(false);

        this.draw();
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.angle) * 0.06);

        // 🪢 Natural string
        this.drawString();

        // 🎈 Balloon body
        this.drawBalloonPath(this.r);
        const grad = ctx.createRadialGradient(
          -this.r * 0.3,
          -this.r * 0.5,
          this.r * 0.1,
          0,
          0,
          this.r * 1.5
        );
        grad.addColorStop(0, this.colorSet.light);
        grad.addColorStop(0.4, this.colorSet.base);
        grad.addColorStop(1, this.colorSet.dark);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.92;
        ctx.fill();

        ctx.restore();
      }
    }

    /* ================= LOOP ================= */

    const resize = () => {
      currentDpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      logicalW = width;
      logicalH = height;
      canvas.width = Math.round(width * currentDpr);
      canvas.height = Math.round(height * currentDpr);
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      balloons = [];
      for (let i = 0; i < balloonCount; i++) {
        balloons.push(new Balloon(true));
      }
    };

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, logicalW, logicalH);

      particles = particles.filter((p) => p.opacity > 0);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      balloons.forEach((b) => b.update());

      animId = requestAnimationFrame(animate);
    };

    let lastClientX = -2000;
    let lastClientY = -2000;
    const updateMouse = () => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = lastClientX - rect.left;
      mouse.y = lastClientY - rect.top;
    };

    const onMouseMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      updateMouse();
    };

    const onScroll = () => {
      if (lastClientX > -1000) updateMouse();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll, { passive: true });

    resize();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 w-full h-full overflow-hidden bg-zinc-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black",
        className
      )}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
