import React, { useRef, useEffect } from 'react';

enum PathMode {
  MODE_1 = 1,
  MODE_2 = 2,
}

enum Spread {
  LERP_DECREASE = 1,
  LINEAR_DECREASE = 2,
}

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
    const spread = Spread.LINEAR_DECREASE;
    const mode = 1;
    const pathMode = PathMode.MODE_1;
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

      if (pathMode === PathMode.MODE_2) {
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

        if (spread === Spread.LERP_DECREASE) {
          spreadRate = lineWidthStart / (point.lifetime * 2);
        } // Lerp Decrease
        if (spread === Spread.LINEAR_DECREASE) {
          spreadRate = lineWidthStart * (1 - inc);
        } // Linear Decrease

        ctx.lineJoin = "round";
        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

        const distance = Point.distance(lastPoint, point);
        const midpoint = Point.midPoint(lastPoint, point);
        const angle = Point.angle(lastPoint, point);

        if (pathMode === PathMode.MODE_1) {
          ctx.beginPath();
        }

        if (mode === 1) {
          ctx.arc(midpoint.x, midpoint.y, distance / 2, angle, angle + Math.PI, point.flip);
        }

        if (mode === 2) {
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        if (pathMode === PathMode.MODE_1) {
          ctx.stroke();
          ctx.closePath();
        }
      }

      if (pathMode === PathMode.MODE_2) {
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
      const canvas = canvasRef.current;
      if (!canvas) return;

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

    enableListeners();
    draw();

    function draw() {
      animatePoints();
      requestAnimationFrame(draw);
    }

    function enableDrawingCanvas() {
      if (!canvasRef.current) {
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
  }, []); // <-- Add 'points' to the dependency array to remove the warning

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
