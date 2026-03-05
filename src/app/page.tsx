"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface Obstacle {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  type: "meteor" | "crystal" | "comet";
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export default function ZeroGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);

  // Game refs
  const playerRef = useRef({ x: 0, y: 0, targetX: 0, size: 30 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const frameCountRef = useRef(0);

  // Initialize canvas and game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with mobile viewport fix
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set display size (css pixels)
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      
      // Normalize coordinate system to use css pixels
      ctx.scale(dpr, dpr);
      
      playerRef.current.y = height - 150;
      playerRef.current.x = width / 2;
      playerRef.current.targetX = width / 2;
    };
    
    resize();
    window.addEventListener("resize", resize);
    
    // Force resize after a short delay for mobile browsers
    setTimeout(resize, 100);

    // Initialize stars
    starsRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width / (window.devicePixelRatio || 1),
      y: Math.random() * canvas.height / (window.devicePixelRatio || 1),
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      brightness: Math.random(),
    }));

    return () => window.removeEventListener("resize", resize);
  }, []);

  // Handle input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      playerRef.current.targetX = touch.clientX - rect.left;
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerRef.current.targetX = e.clientX - rect.left;
    };

    // Add touch events to document for better mobile response
    canvas.addEventListener("touchstart", handleTouch, { passive: false });
    canvas.addEventListener("touchmove", handleTouch, { passive: false });
    canvas.addEventListener("touchend", (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener("mousemove", handleMouse);
    
    // Prevent default touch behaviors
    document.body.addEventListener("touchmove", (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    }, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("touchmove", handleTouch);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const getWidth = () => canvas.width / dpr;
    const getHeight = () => canvas.height / dpr;

    const gameLoop = () => {
      frameCountRef.current++;
      const width = getWidth();
      const height = getHeight();

      // Clear canvas
      ctx.fillStyle = "rgba(5, 5, 15, 0.3)";
      ctx.fillRect(0, 0, width, height);

      // Draw and update stars
      starsRef.current.forEach((star) => {
        star.y += star.speed * (1 + levelRef.current * 0.1);
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.5})`;
        ctx.fill();
      });

      // Update player position with smooth interpolation
      const player = playerRef.current;
      player.x += (player.targetX - player.x) * 0.15;
      player.x = Math.max(player.size, Math.min(width - player.size, player.x));

      // Draw player (spaceship)
      ctx.save();
      ctx.translate(player.x, player.y);

      // Engine trail particles
      if (frameCountRef.current % 3 === 0) {
        particlesRef.current.push({
          x: player.x + (Math.random() - 0.5) * 10,
          y: player.y + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 8 + 4,
          alpha: 1,
          color: `hsl(${180 + Math.random() * 60}, 100%, 60%)`,
        });
      }

      // Draw spaceship body
      const gradient = ctx.createLinearGradient(0, -20, 0, 20);
      gradient.addColorStop(0, "#00d4ff");
      gradient.addColorStop(0.5, "#0099cc");
      gradient.addColorStop(1, "#006699");

      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(-15, 15);
      ctx.lineTo(-8, 20);
      ctx.lineTo(0, 10);
      ctx.lineTo(8, 20);
      ctx.lineTo(15, 15);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Cockpit
      ctx.beginPath();
      ctx.ellipse(0, -5, 6, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();

      // Engine glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00d4ff";
      ctx.beginPath();
      ctx.moveTo(-8, 20);
      ctx.lineTo(0, 35 + Math.sin(frameCountRef.current * 0.3) * 5);
      ctx.lineTo(8, 20);
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 212, 255, ${0.6 + Math.sin(frameCountRef.current * 0.2) * 0.3})`;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Spawn obstacles
      const spawnRate = Math.max(30, 60 - levelRef.current * 5);
      if (frameCountRef.current % spawnRate === 0) {
        const types: Obstacle["type"][] = ["meteor", "crystal", "comet"];
        const type = types[Math.floor(Math.random() * types.length)];
        obstaclesRef.current.push({
          x: Math.random() * (width - 40) + 20,
          y: -50,
          size: type === "comet" ? 25 : 20 + Math.random() * 20,
          speed: (2 + Math.random() * 2) * (1 + levelRef.current * 0.15),
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          type,
        });
      }

      // Update and draw obstacles
      obstaclesRef.current = obstaclesRef.current.filter((obstacle) => {
        obstacle.y += obstacle.speed;
        obstacle.rotation += obstacle.rotationSpeed;

        // Draw obstacle
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        ctx.rotate(obstacle.rotation);

        if (obstacle.type === "meteor") {
          // Meteor
          const meteorGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.size);
          meteorGradient.addColorStop(0, "#ff6b6b");
          meteorGradient.addColorStop(0.5, "#ee5a5a");
          meteorGradient.addColorStop(1, "#cc4444");

          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = obstacle.size * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = meteorGradient;
          ctx.fill();

          // Craters
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.beginPath();
          ctx.arc(-obstacle.size * 0.3, -obstacle.size * 0.2, obstacle.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obstacle.type === "crystal") {
          // Crystal
          const crystalGradient = ctx.createLinearGradient(-obstacle.size, -obstacle.size, obstacle.size, obstacle.size);
          crystalGradient.addColorStop(0, "#a855f7");
          crystalGradient.addColorStop(0.5, "#c084fc");
          crystalGradient.addColorStop(1, "#e879f9");

          ctx.beginPath();
          ctx.moveTo(0, -obstacle.size);
          ctx.lineTo(obstacle.size * 0.7, 0);
          ctx.lineTo(0, obstacle.size);
          ctx.lineTo(-obstacle.size * 0.7, 0);
          ctx.closePath();
          ctx.fillStyle = crystalGradient;
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Comet
          const cometGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.size);
          cometGradient.addColorStop(0, "#fbbf24");
          cometGradient.addColorStop(0.5, "#f59e0b");
          cometGradient.addColorStop(1, "#d97706");

          ctx.beginPath();
          ctx.arc(0, 0, obstacle.size, 0, Math.PI * 2);
          ctx.fillStyle = cometGradient;
          ctx.fill();

          // Tail
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-obstacle.size * 2, -obstacle.size * 3);
          ctx.lineTo(obstacle.size * 2, -obstacle.size * 3);
          ctx.closePath();
          ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
          ctx.fill();
        }

        ctx.restore();

        // Collision detection
        const dx = player.x - obstacle.x;
        const dy = player.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.size + obstacle.size * 0.7) {
          // Create explosion particles
          for (let i = 0; i < 20; i++) {
            particlesRef.current.push({
              x: obstacle.x,
              y: obstacle.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              size: Math.random() * 10 + 5,
              alpha: 1,
              color: obstacle.type === "meteor" ? "#ff6b6b" : obstacle.type === "crystal" ? "#a855f7" : "#fbbf24",
            });
          }

          setGameState("gameOver");
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
          }
          return false;
        }

        // Score for dodging
        if (obstacle.y > height) {
          scoreRef.current += 10;
          setScore(scoreRef.current);

          // Level up every 100 points
          const newLevel = Math.floor(scoreRef.current / 100) + 1;
          if (newLevel > levelRef.current) {
            levelRef.current = newLevel;
            setLevel(newLevel);
          }

          return false;
        }

        return true;
      });

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.02;
        particle.size *= 0.98;

        if (particle.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(")", `, ${particle.alpha})`).replace("rgb", "rgba").replace("hsl", "hsla");
        ctx.fill();

        return true;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, highScore]);

  // Start game
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    scoreRef.current = 0;
    levelRef.current = 1;
    frameCountRef.current = 0;
    obstaclesRef.current = [];
    particlesRef.current = [];
  };

  // Initialize on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#05050f]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#05050f] to-[#0a0a2a]" />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none cursor-none"
        style={{ touchAction: "none" }}
      />

      {/* UI Overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-6xl sm:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
                ZERO
              </h1>
              <p className="text-xl sm:text-2xl text-cyan-300 tracking-[0.3em]">GRAVITY</p>
            </div>

            <div className="space-y-4">
              <p className="text-slate-400 text-sm sm:text-base max-w-md px-4">
                Vuốt hoặc di chuyển chuột để điều khiển phi thuyền
                <br />
                Né tránh thiên thạch và thu thập điểm
              </p>

              {highScore > 0 && (
                <div className="text-cyan-400 text-lg">
                  Điểm cao nhất: <span className="font-bold text-2xl">{highScore}</span>
                </div>
              )}
            </div>

            <button
              onClick={startGame}
              className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white text-lg shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">CHƠI NGAY</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {score.toString().padStart(6, "0")}
            </div>
            <div className="text-cyan-400 text-sm sm:text-base">
              LEVEL {level}
            </div>
          </div>

          <div className="text-right">
            <div className="text-slate-400 text-xs sm:text-sm">High Score</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-300">{highScore}</div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
          <div className="text-center space-y-6 animate-fade-in">
            <h2 className="text-5xl sm:text-6xl font-bold text-red-500">GAME OVER</h2>

            <div className="space-y-2">
              <div className="text-slate-400 text-lg">Điểm của bạn</div>
              <div className="text-5xl sm:text-6xl font-bold text-white">{score}</div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="text-yellow-400 text-xl font-bold animate-bounce">
                🏆 KỶ LỤC MỚI!
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={startGame}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all hover:scale-105 active:scale-95"
              >
                Chơi Lại
              </button>

              <button
                onClick={() => setGameState("menu")}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-white transition-all hover:scale-105 active:scale-95"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch hint */}
      {gameState === "playing" && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-slate-500 text-xs sm:text-sm animate-pulse">
          Vuốt để di chuyển
        </div>
      )}
    </div>
  );
}
