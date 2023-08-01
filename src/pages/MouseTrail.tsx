import React, { useRef, useEffect } from 'react';

enum SpreadMode {
  LERP_INCREASE = 1,
  LERP_DECREASE = 2,
}

enum PathMode {
  MODE_1 = 1,
  MODE_2 = 2,
}

class Point {
  x: number;
  y: number;
  lifetime: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.lifetime = 0;
  }

  static distance(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

const lineDuration = 2; // seconds
const lineWidthStart = 5;
const spread = SpreadMode.LERP_INCREASE;
const mode = PathMode.MODE_1;
const pathMode = PathMode.MODE_2;
const drawEveryFrame = 2;

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clickCount = 0;
    const points: Point[] = [];

    function addPoint(x: number, y: number) {
      points.push(new Point(x, y));
    }

    function animatePoints() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        const spreadRate = spread === SpreadMode.LERP_INCREASE
          ? lineWidthStart / (point.lifetime * 2)
          : lineWidthStart - (lineWidthStart / (point.lifetime * 2));

        let lastPoint;
        if (i === 0 || point.lifetime === 0) {
          lastPoint = point;
        } else {
          lastPoint = points[i - 1];
        }

        ctx.beginPath();
        ctx.lineJoin = "round";
        ctx.lineWidth = spreadRate;
        ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * 0.5)}, ${Math.floor(200 - 255 * 0.5)})`;

        if (mode === PathMode.MODE_1) {
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        if (mode === PathMode.MODE_2) {
          const distance = Point.distance(lastPoint, point);
          const spc = 5;
          let lastPoint2 = new Point(lastPoint.x, lastPoint.y);

          while (Point.distance(lastPoint2, point) >= spc) {
            lastPoint2 = new Point(
              lastPoint2.x + ((point.x - lastPoint2.x) / distance) * spc,
              lastPoint2.y + ((point.y - lastPoint2.y) / distance) * spc
            );
            ctx.lineTo(lastPoint2.x, lastPoint2.y);
          }
        }

        ctx.stroke();
      }

      requestAnimationFrame(animatePoints);
    }

    document.addEventListener('mousemove', (e) => {
      if (points.length % drawEveryFrame === 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addPoint(x, y);
      }
    });

    animatePoints();

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

export default MouseTrail;
