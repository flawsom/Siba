import React, { useRef, useEffect } from 'react';

const LINE_DURATION = 2;
const LINE_WIDTH_START = 5;

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points: { x: number; y: number; lifetime: number; flip: boolean }[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lineDuration = LINE_DURATION;
    const lineWidthStart = LINE_WIDTH_START;
    const spread: number = 2;
    const mode: number = 1;
    const pathMode: number | string = 1;
    const drawEveryFrame = 1;

    let frame = 0;
    let flipNext = true;

    function animatePoints() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;

      if (pathMode === 2) {
        ctx.beginPath();
      }

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (!point) continue;

        const lastPoint = points[i - 1] || point;

        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        // Begin drawing stuff!
        const inc = point.lifetime / duration;
        const dec = 1 - inc;

        let spreadRate = 0;

        if (spread === 1) {
          spreadRate = lineWidthStart / (point.lifetime * 2);
        } // Lerp Decrease
        if (spread === 2) {
          spreadRate = lineWidthStart * (1 - inc);
        } // Linear Decrease

        ctx.lineJoin = "round";
        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

        const distance = Point.distance(lastPoint, point);
        const midpoint = Point.midPoint(lastPoint, point);
        const angle = Point.angle(lastPoint, point);

        if (pathMode === 1) {
          ctx.beginPath();
        }

        if (mode === 1) {
          ctx.arc(midpoint.x, midpoint.y, distance / 2, angle, angle + Math.PI, point.flip);
        }

        if (mode === 2) {
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        if (pathMode === 1) {
          ctx.stroke();
          ctx.closePath();
        }
      }

      if (pathMode === 2) {
        ctx.stroke();
        ctx.closePath();
      }
    }

    function addPoint(x: number, y: number) {
      flipNext = !flipNext;
      const point = new Point(x, y, 0, flipNext);
      points.push(point);
    }

    function resizeCanvas(w: number, h: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.canvas.width = w;
      ctx.canvas.height = h;
    }

    // Mouse Listeners
    function enableListeners() {
      document.addEventListener('mousemove', (e) => {
        if (frame === drawEveryFrame) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          addPoint(x, y);
          frame = 0;
        }
        frame++;
      });
    }

    // RequestAnimFrame definition
    window.requestAnimFrame = (function (callback) {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function () {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })();

    enableListeners();
    draw();

    function draw() {
      animatePoints();
      requestAnimationFrame(draw);
    }

    function enableDrawingCanvas() {
      if (canvas === undefined) {
        const newCanvas = document.createElement('canvas');
        newCanvas.setAttribute('id', 'myCanvas');
        newCanvas.style.position = 'fixed';
        newCanvas.style.top = '0';
        newCanvas.style.left = '0';
        newCanvas.style.pointerEvents = 'none';
        newCanvas.style.zIndex = '9999';
        document.body.appendChild(newCanvas);
      }
    }

    enableDrawingCanvas();
    resizeCanvas(window.innerWidth, window.innerHeight);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

export default MouseTrail;

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

  static distance(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  static midPoint(a: Point, b: Point) {
    const mx = a.x + (b.x - a.x) * 0.5;
    const my = a.y + (b.y - a.y) * 0.5;

    return new Point(mx, my, 0, false);
  }

  static angle(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.atan2(dy, dx);
  }
}
