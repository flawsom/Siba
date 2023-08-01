import React, { useRef, useEffect } from 'react';

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
    let lastPoint: Point | undefined = undefined; // Initialize lastPoint as undefined

    function animatePoints() {
      // Add a check to ensure ctx is not null before using it
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;
      let point;

      if (pathMode === PathMode.MODE_2) {
        ctx.beginPath();
      }

      for (let i = 0; i < points.length; i++) {
        point = points[i];

        // Assign lastPoint with a default value if it is undefined
        if (lastPoint === undefined) {
          lastPoint = point || new Point(0, 0, 0, false); // Provide appropriate default values
        }

        if (point === undefined) {
          continue;
        }

        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        // Begin drawing stuff!
        const inc = point.lifetime / duration; // 0 to 1 over lineDuration
        const dec = 1 - inc;

        let spreadRate = 0;
        if (spread === SpreadMode.LerpIncrease) {
          spreadRate = lineWidthStart / (point.lifetime * 2);
        } else if (spread === SpreadMode.LerpDecrease) {
          spreadRate = lineWidthStart * (1 - inc);
        } else if (spread === SpreadMode.LinearDecrease) {
          spreadRate = lineWidthStart;
        }

        ctx.lineJoin = "round";
        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

        const distance = Point.distance(lastPoint, point);
        const midpoint = Point.midPoint(lastPoint, point);
        const angle = Point.angle(lastPoint, point);

        if (pathMode === PathMode.MODE_1) {
          ctx.beginPath();
        }

        if (mode === Mode.MODE_1) {
          ctx.arc(midpoint.x, midpoint.y, distance / 2, angle, angle + Math.PI, point.flip);
        } else if (mode === Mode.MODE_2) {
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        if (pathMode === PathMode.MODE_1) {
          ctx.stroke();
          ctx.closePath();
        }

        // Update lastPoint for the next iteration
        lastPoint = point;
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
      if (ctx !== null) {
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
    (window as any).requestAnimFrame = (function(callback: (timestamp: number) => void) {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
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
      (window as any).requestAnimFrame(animate);
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

  static midPoint(p1: Point, p2: Point) {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0, false);
  }

  static distance(p1: Point, p2: Point) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angle(p1: Point, p2: Point) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}

export default MouseTrail;
