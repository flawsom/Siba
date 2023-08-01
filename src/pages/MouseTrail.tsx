import React, { useRef, useEffect } from 'react';

const LINE_DURATION = 2;
const LINE_WIDTH_START = 5;

const MouseTrail: React.FC = () => {
  // Point Class
  class Point {
    x: number;
    y: number;
    lifetime: number;
    flip: boolean;

    constructor(x: number, y: number, lifetime: number, flip: boolean) {
      this.x = x;
      this.y = y;
      this.lifetime = lifetime;
      this.flip = flip;
    }

    distance(a: Point, b: Point) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    midPoint(a: Point, b: Point) {
      const mx = a.x + (b.x - a.x) * 0.5;
      const my = a.y + (b.y - a.y) * 0.5;
      return new Point(mx, my, 0, false);
    }

    angle(a: Point, b: Point) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.atan2(dy, dx);
    }
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctxRef.current = ctx;

    animatePoints();

    function animatePoints() {
      const points = pointsRef.current;
      const ctx = ctxRef.current;
      if (!ctx) return;

      const duration = LINE_DURATION * 1000 / 60;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineJoin = "round";

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        const inc = point.lifetime / duration; // 0 to 1 over lineDuration
        const dec = 1 - inc;

        const spreadRate = LINE_WIDTH_START * (1 - inc); // Linear Decrease

        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

        if (i > 0) {
          const lastPoint = points[i - 1];
          const distance = point.distance(lastPoint, point);
          const midpoint = point.midPoint(lastPoint, point);
          const angle = point.angle(lastPoint, point);

          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.closePath();
        }
      }

      requestAnimationFrame(animatePoints);
    }

    function resizeCanvas() {
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    }

    function enableListeners() {
      document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; // Adjust the x position based on the canvas position
        const y = e.clientY - rect.top; // Adjust the y position based on the canvas position
        addPoint(x, y);
      });
    }

    function addPoint(x: number, y: number) {
      const flipNext = pointsRef.current.length % 2 === 0;
      const point = new Point(x, y, 0, flipNext);
      pointsRef.current.push(point);
    }

    enableListeners();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

export default MouseTrail;
