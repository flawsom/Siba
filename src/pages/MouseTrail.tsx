import React, { useRef, useEffect } from 'react';

const LINE_DURATION = 2;
const LINE_WIDTH_START = 5;

interface Point {
  x: number;
  y: number;
  lifetime: number;
  flip: boolean;
}

const MouseTrail: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points: Point[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Set canvas size to match the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let lineDuration = LINE_DURATION;
    let lineWidthStart = LINE_WIDTH_START;
    let spread = 2;
    let mode = 1;
    let pathMode = 1;
    let drawEveryFrame = 1; // Only adds a Point after these many 'mousemove' or 'touchmove' events

    let clickCount = 0;
    let frame = 0;
    let flipNext = true;

    function animatePoints() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;
      let point: Point | undefined;
      let lastPoint: Point;

      if (pathMode === 2) {
        ctx.beginPath();
      }

      for (let i = 0; i < points.length; i++) {
        point = points[i];

        if (points[i - 1] !== undefined) {
          lastPoint = points[i - 1];
        } else {
          lastPoint = points[i];
        }

        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.splice(i, 1);
          continue;
        }

        // Begin drawing stuff!
        const inc = point.lifetime / duration; // 0 to 1 over lineDuration
        const dec = 1 - inc;

        let spreadRate;
        if (spread === 1) {
          spreadRate = lineWidthStart / (point.lifetime * 2);
        } else if (spread === 2) {
          spreadRate = lineWidthStart * (1 - inc);
        } else {
          spreadRate = 0;
        }

        const fadeRate = dec;

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
        } else if (mode === 2) {
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
      const point: Point = { x, y, lifetime: 0, flip: flipNext };
      points.push(point);
    }

    function resizeCanvas(w: number, h: number) {
      canvas.width = w;
      canvas.height = h;
    }

    // Mouse and Touch Listeners
    function enableListeners() {
      const handler = (e: MouseEvent | TouchEvent) => {
        if (frame === drawEveryFrame) {
          const rect = canvas.getBoundingClientRect();
          let x, y;
          if (e instanceof MouseEvent) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
          } else if (e instanceof TouchEvent && e.touches.length) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
          }
          addPoint(x, y);
          frame = 0;
        }
        frame++;
      };
      
      document.addEventListener('mousemove', handler);
      document.addEventListener('touchmove', handler);
    }

    // RequestAnimFrame definition
    window.requestAnimFrame = (function (callback) {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
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
      if (!canvas) {
        const newCanvas = document.createElement('canvas');
        newCanvas.setAttribute('id', 'myCanvas');
        newCanvas.style.position = 'fixed';
        newCanvas.style.top = '0';
        newCanvas.style.left = '0';
        newCanvas.style.pointerEvents = 'none';
        newCanvas.style.zIndex = '9999'; /* Ensure it's above other elements on the page */
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
});

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
