import React, { useRef, useEffect, useState } from 'react';

enum PathMode {
  MODE_1 = 'MODE_1',
  MODE_2 = 'MODE_2',
}

enum Mode {
  MODE_1,
  MODE_2,
}

enum SpreadMode {
  LerpIncrease = 'LerpIncrease',
  LerpDecrease = 'LerpDecrease',
  LinearDecrease = 'LinearDecrease',
}

const LINE_DURATION = 2;
const LINE_WIDTH_START = 5;
const DRAW_EVERY_FRAME = 1;

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points: { x: number; y: number; lifetime: number; flip: boolean }[] = [];
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

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
    const spread: SpreadMode = SpreadMode.LerpDecrease; // Explicitly set the type and initial value
    const mode = Mode.MODE_1;
    const pathMode: PathMode = PathMode.MODE_1;

    let frame = 0;
    let flipNext = true;

    function animatePoints() {
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;
      let point;

      if (pathMode === PathMode.MODE_2) {
        ctx.beginPath();
      }

      for (let i = 0; i < points.length; i++) {
        point = points[i];

        if (!lastPoint && point) {
          setLastPoint(point);
        }

        if (!point) {
          continue;
        }

        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        // Begin drawing stuff!
        const inc = point.lifetime / duration;
        const dec = 1 - inc;

        let spreadRate = 0;
        if (spread === SpreadMode.LerpIncrease) {
          spreadRate = lineWidthStart / (point.lifetime * 2);
        } else if (spread === SpreadMode.LerpDecrease) {
          spreadRate = lineWidthStart * (1 - inc);
        } else if (spread === SpreadMode.LinearDecrease) {
          spreadRate = lineWidthStart;
        }

        ctx.lineJoin = 'round';
        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

        const distance = Point.distance(lastPoint, point);
        const midpoint = Point.midPoint(lastPoint, point);
        const angle = Point.angle(lastPoint, point);

        if (pathMode === PathMode.MODE_1) {
          ctx.beginPath();
        }

        if (mode === Mode.MODE_1) {
          ctx.arc(midpoint?.x ?? 0, midpoint?.y ?? 0, distance / 2, angle, angle + Math.PI, point.flip);
        } else if (mode === Mode.MODE_2) {
          ctx.moveTo(lastPoint?.x ?? 0, lastPoint?.y ?? 0);
          ctx.lineTo(point.x, point.y);
        }

        if (pathMode === PathMode.MODE_1) {
          ctx.stroke();
          ctx.closePath();
        }

        // Update lastPoint for the next iteration
        if (point) {
          setLastPoint(point);
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
      if (ctx) {
        ctx.canvas.width = w;
        ctx.canvas.height = h;
      }
    }

    // Mouse Listeners
    function enableListeners() {
      document.addEventListener('mousemove', (e) => {
        if (frame === DRAW_EVERY_FRAME) {
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
    window.requestAnimFrame = (function(callback: (timestamp: number) => void) {
      return (
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback: (timestamp: number) => void) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })(animatePoints);

    function animate() {
      animatePoints();
      window.requestAnimFrame(animate);
    }

    enableListeners();
    animate();
    resizeCanvas(window.innerWidth, window.innerHeight);

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', () => {});
    };
  }, []);

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

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

  static midPoint(p1: Point | null, p2: Point | null) {
    if (!p1 || !p2) {
      return null;
    }
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0, false);
  }

  static distance(p1: Point | null, p2: Point | null) {
    if (!p1 || !p2) {
      return 0;
    }
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angle(p1: Point | null, p2: Point | null) {
    if (!p1 || !p2) {
      return 0;
    }
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}

export default MouseTrail;
