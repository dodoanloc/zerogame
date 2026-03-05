"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Pipe {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Game refs
  const birdRef = useRef({ x: 100, y: 200, velocity: 0, radius: 15, targetY: 200 });
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      dimensionsRef.current = { width, height };
      
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      canvas.width = width;
      canvas.height = height;
      
      // Reset bird position
      birdRef.current.x = width * 0.2;
      birdRef.current.y = height * 0.4;
      birdRef.current.targetY = height * 0.4;
      birdRef.current.velocity = 0;
      birdRef.current.radius = isMobile ? 12 : 15;
    };
    
    resize();
    window.addEventListener("resize", resize);
    [100, 300, 500].forEach(t => setTimeout(resize, t));

    return () => window.removeEventListener("resize", resize);
  }, [isMobile]);

  // Handle input (jump)
  const jump = useCallback(() => {
    if (gameState === "menu") {
      setGameState("playing");
      return;
    }
    if (gameState === "playing") {
      birdRef.current.velocity = -8;
      // Create jump particles
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x: birdRef.current.x - 10,
          y: birdRef.current.y + birdRef.current.radius,
          vx: -2 - Math.random() * 2,
          vy: Math.random() * 2 - 1,
          size: Math.random() * 4 + 2,
          alpha: 1,
          color: "#fff",
        });
      }
    }
  }, [gameState]);

  // Handle input events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    const handleClick = () => {
      jump();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    canvas.addEventListener("touchstart", handleTouch, { passive: false });
    canvas.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [jump]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensionsRef.current;
    const GRAVITY = 0.4;
    const PIPE_WIDTH = isMobile ? 50 : 60;
    const PIPE_GAP = isMobile ? 140 : 160;
    const PIPE_SPEED = 3;
    const SPAWN_RATE = 120;

    const gameLoop = () => {
      frameCountRef.current++;

      // Clear canvas with sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#4FC3F7");
      gradient.addColorStop(1, "#81D4FA");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      const cloudOffset = (frameCountRef.current * 0.5) % (width + 200);
      ctx.beginPath();
      ctx.arc(100 - cloudOffset, 80, 30, 0, Math.PI * 2);
      ctx.arc(140 - cloudOffset, 80, 40, 0, Math.PI * 2);
      ctx.arc(180 - cloudOffset, 80, 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(width - 50 - cloudOffset * 0.7, 150, 25, 0, Math.PI * 2);
      ctx.arc(width - 10 - cloudOffset * 0.7, 150, 35, 0, Math.PI * 2);
      ctx.arc(width + 30 - cloudOffset * 0.7, 150, 25, 0, Math.PI * 2);
      ctx.fill();

      // Update bird
      const bird = birdRef.current;
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;

      // Rotation based on velocity
      const rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);

      // Draw bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(rotation);

      // Bird body
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.strokeStyle = "#FFA000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bird eye
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      // Bird beak
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(18, 6);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fillStyle = "#FF6F00";
      ctx.fill();

      // Bird wing
      ctx.beginPath();
      ctx.ellipse(-5, 5, 8, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FFC107";
      ctx.fill();

      ctx.restore();

      // Spawn pipes
      if (frameCountRef.current % SPAWN_RATE === 0) {
        const minHeight = 50;
        const maxHeight = height - PIPE_GAP - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        pipesRef.current.push({
          x: width,
          topHeight,
          gap: PIPE_GAP,
          passed: false,
        });
      }

      // Update and draw pipes
      pipesRef.current = pipesRef.current.filter((pipe) => {
        pipe.x -= PIPE_SPEED;

        // Draw top pipe
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Top pipe cap
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20);

        // Draw bottom pipe
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, PIPE_WIDTH, height - pipe.topHeight - pipe.gap);
        // Bottom pipe cap
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(pipe.x - 2, pipe.topHeight + pipe.gap, PIPE_WIDTH + 4, 20);

        // Check collision
        const birdLeft = bird.x - bird.radius + 4;
        const birdRight = bird.x + bird.radius - 4;
        const birdTop = bird.y - bird.radius + 4;
        const birdBottom = bird.y + bird.radius - 4;
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        // Horizontal collision
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          // Vertical collision (hit top or bottom pipe)
          if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + pipe.gap) {
            setGameState("gameOver");
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
            }
            return false;
          }
        }

        // Score counting
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }

        return pipe.x > -PIPE_WIDTH;
      });

      // Check floor/ceiling collision
      if (bird.y + bird.radius > height || bird.y - bird.radius < 0) {
        setGameState("gameOver");
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.02;

        if (particle.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx.fill();

        return true;
      });

      // Draw floor
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(0, height - 20, width, 20);
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(0, height - 20, width, 4);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, highScore, isMobile]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    scoreRef.current = 0;
    frameCountRef.current = 0;
    pipesRef.current = [];
    particlesRef.current = [];
    const { width, height } = dimensionsRef.current;
    birdRef.current.y = height * 0.4;
    birdRef.current.velocity = 0;
  };

  const resetGame = () => {
    setGameState("menu");
    setScore(0);
    scoreRef.current = 0;
    frameCountRef.current = 0;
    pipesRef.current = [];
    particlesRef.current = [];
    const { width, height } = dimensionsRef.current;
    birdRef.current.y = height * 0.4;
    birdRef.current.velocity = 0;
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ touchAction: "none" }}
      />

      {/* Menu - Full Screen */}
      {gameState === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-sky-400">
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8 animate-fade-in">
            {/* Title */}
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-8xl sm:text-9xl md:text-[10rem] font-black text-yellow-400 drop-shadow-[0_6px_0_#F59E0B] tracking-tight leading-none">
                FLAPPY
              </h1>
              <p className="text-7xl sm:text-8xl md:text-9xl font-black text-green-500 drop-shadow-[0_6px_0_#16A34A] -mt-2 md:-mt-4">
                BIRD
              </p>
            </div>

            {/* Instructions Card */}
            <div className="w-full max-w-md md:max-w-xl bg-white/25 backdrop-blur-md rounded-3xl p-6 md:p-8 mb-8 border-4 border-white/30">
              <div className="text-center space-y-4">
                <p className="text-white text-xl md:text-3xl font-bold">
                  👆 Chạm để bay
                </p>
                <p className="text-white/90 text-lg md:text-2xl">
                  Vượt qua các ống xanh
                </p>
              </div>
            </div>

            {/* High Score */}
            {highScore > 0 && (
              <div className="mb-8">
                <div className="bg-yellow-400/90 text-yellow-900 px-8 py-4 rounded-2xl font-black text-2xl md:text-4xl shadow-lg">
                  🏆 {highScore}
                </div>
              </div>
            )}

            {/* Play Button - Large */}
            <button
              onClick={startGame}
              className="w-full max-w-sm md:max-w-md py-6 md:py-8 bg-gradient-to-b from-green-400 to-green-600 rounded-2xl font-black text-white text-3xl md:text-5xl shadow-[0_8px_0_#166534] active:shadow-none active:translate-y-2 transition-all border-b-8 border-green-700"
            >
              ▶ CHƠI NGAY
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {gameState === "playing" && (
        <div className="absolute top-4 md:top-8 left-0 right-0 text-center z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-8 py-3 rounded-full">
            <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              {score}
            </span>
          </div>
        </div>
      )}

      {/* Game Over - Full Screen */}
      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8 animate-fade-in">
            {/* Game Over Title */}
            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-red-500 drop-shadow-[0_4px_0_#991B1B] mb-8">
              GAME OVER
            </h2>

            {/* Score Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 mb-8 w-full max-w-md border-4 border-white/20">
              <div className="text-center space-y-4">
                <p className="text-white/80 text-xl md:text-3xl font-bold">Điểm của bạn</p>
                <div className="text-7xl md:text-9xl font-black text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                  {score}
                </div>
              </div>
            </div>

            {/* New Record */}
            {score >= highScore && score > 0 && (
              <div className="mb-8 animate-bounce">
                <div className="bg-yellow-400 text-yellow-900 px-8 py-4 rounded-2xl font-black text-2xl md:text-4xl shadow-lg">
                  🏆 KỶ LỤC MỚI!
                </div>
              </div>
            )}

            {/* Buttons - Large & Centered */}
            <div className="flex flex-col items-center justify-center gap-5 w-full px-6">
              <button
                onClick={startGame}
                className="w-full max-w-sm py-7 md:py-10 bg-gradient-to-b from-green-400 to-green-600 rounded-3xl font-black text-white text-4xl md:text-6xl shadow-[0_10px_0_#166534] active:shadow-none active:translate-y-3 transition-all border-b-8 border-green-700"
              >
                🔄 CHƠI LẠI
              </button>

              <button
                onClick={resetGame}
                className="w-full max-w-sm py-7 md:py-10 bg-gradient-to-b from-gray-400 to-gray-600 rounded-3xl font-black text-white text-4xl md:text-6xl shadow-[0_10px_0_#374151] active:shadow-none active:translate-y-3 transition-all border-b-8 border-gray-700"
              >
                📋 MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
