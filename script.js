// Simple Pong Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddles
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const PADDLE_MARGIN = 10;
let playerY = (HEIGHT - PADDLE_HEIGHT) / 2;
let aiY = (HEIGHT - PADDLE_HEIGHT) / 2;
const PLAYER_SPEED = 6; // keyboard speed
const AI_MAX_SPEED = 4.2; // how fast AI can move (tweak difficulty)

// Ball
let ballX = WIDTH / 2;
let ballY = HEIGHT / 2;
let ballRadius = 8;
let ballSpeedX = 0;
let ballSpeedY = 0;
const BALL_SPEED_START = 4;
const BALL_SPEED_INCREMENT = 0.35; // speeds up on paddle hit

// Score
let playerScore = 0;
let aiScore = 0;

// Input
let upPressed = false;
let downPressed = false;
let paused = false;

// Setup initial serve
function serve(randomizeDirection = true) {
  ballX = WIDTH / 2;
  ballY = HEIGHT / 2;
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30deg to +30deg
  const dir = randomizeDirection ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
  ballSpeedX = dir * BALL_SPEED_START * Math.cos(angle);
  ballSpeedY = BALL_SPEED_START * Math.sin(angle);
}

// Utility: clamp
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Collision detection: ball with paddle
function ballHitsPaddle(px, py) {
  // paddle rectangle: x, y, width, height
  const paddleTop = py;
  const paddleBottom = py + PADDLE_HEIGHT;
  // For left paddle, px is PADDLE_MARGIN; for right paddle, px is WIDTH - PADDLE_MARGIN - PADDLE_WIDTH
  const paddleLeft = px;
  const paddleRight = px + PADDLE_WIDTH;
  // Simple circle vs rect check
  const closestX = clamp(ballX, paddleLeft, paddleRight);
  const closestY = clamp(ballY, paddleTop, paddleBottom);

  const dx = ballX - closestX;
  const dy = ballY - closestY;
  return (dx * dx + dy * dy) <= (ballRadius * ballRadius);
}

// Draw everything
function draw() {
  // clear
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // center dashed line
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // paddles
  ctx.fillStyle = '#e6eef8';
  // player (left)
  ctx.fillRect(PADDLE_MARGIN, Math.round(playerY), PADDLE_WIDTH, PADDLE_HEIGHT);
  // AI (right)
  ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, Math.round(aiY), PADDLE_WIDTH, PADDLE_HEIGHT);

  // ball
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(Math.round(ballX), Math.round(ballY), ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // scoreboard
  ctx.fillStyle = '#e6eef8';
  ctx.font = '34px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(playerScore, WIDTH * 0.25, 48);
  ctx.fillText(aiScore, WIDTH * 0.75, 48);

  // paused text
  if (paused) {
    ctx.fillStyle = 'rgba(230,238,248,0.9)';
    ctx.font = '20px system-ui, Arial';
    ctx.fillText('Paused — press Space to resume', WIDTH / 2, HEIGHT / 2);
  }
}

// Update game state
function update() {
  if (paused) return;

  // Player keyboard movement
  if (upPressed) playerY -= PLAYER_SPEED;
  if (downPressed) playerY += PLAYER_SPEED;

  // Ensure player paddle stays on screen
  playerY = clamp(playerY, 0, HEIGHT - PADDLE_HEIGHT);

  // AI: follow the ball with some maximum speed and a slight "aim" offset
  const aiCenter = aiY + PADDLE_HEIGHT / 2;
  const deltaY = ballY - aiCenter;
  // Basic proportional movement with clamp for max speed
  let aiMove = clamp(deltaY * 0.12, -AI_MAX_SPEED, AI_MAX_SPEED);
  aiY += aiMove;
  aiY = clamp(aiY, 0, HEIGHT - PADDLE_HEIGHT);

  // Ball movement
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Wall collision (top & bottom)
  if (ballY - ballRadius <= 0) {
    ballY = ballRadius;
    ballSpeedY = -ballSpeedY;
  } else if (ballY + ballRadius >= HEIGHT) {
    ballY = HEIGHT - ballRadius;
    ballSpeedY = -ballSpeedY;
  }

  // Left paddle collision
  const leftPaddleX = PADDLE_MARGIN;
  if (ballX - ballRadius <= leftPaddleX + PADDLE_WIDTH) {
    if (ballHitsPaddle(leftPaddleX, playerY)) {
      // reflect and add some angle based on hit position
      const relativeIntersectY = (playerY + PADDLE_HEIGHT / 2) - ballY;
      const normalized = (relativeIntersectY / (PADDLE_HEIGHT / 2)); // -1..1
      const bounceAngle = normalized * (Math.PI / 3); // up to 60deg
      const speed = Math.hypot(ballSpeedX, ballSpeedY) + BALL_SPEED_INCREMENT;
      ballSpeedX = Math.abs(speed * Math.cos(bounceAngle)); // ensure goes right
      ballSpeedY = -speed * Math.sin(bounceAngle);
      // nudge ball out to avoid multiple collisions
      ballX = leftPaddleX + PADDLE_WIDTH + ballRadius + 0.5;
    } else if (ballX + ballRadius < 0) {
      // missed: AI scores
      aiScore++;
      serve(false);
    }
  }

  // Right paddle collision
  const rightPaddleX = WIDTH - PADDLE_MARGIN - PADDLE_WIDTH;
  if (ballX + ballRadius >= rightPaddleX) {
    if (ballHitsPaddle(rightPaddleX, aiY)) {
      const relativeIntersectY = (aiY + PADDLE_HEIGHT / 2) - ballY;
      const normalized = (relativeIntersectY / (PADDLE_HEIGHT / 2));
      const bounceAngle = normalized * (Math.PI / 3);
      const speed = Math.hypot(ballSpeedX, ballSpeedY) + BALL_SPEED_INCREMENT;
      ballSpeedX = -Math.abs(speed * Math.cos(bounceAngle)); // ensure goes left
      ballSpeedY = -speed * Math.sin(bounceAngle);
      ballX = rightPaddleX - ballRadius - 0.5;
    } else if (ballX - ballRadius > WIDTH) {
      // missed: player scores
      playerScore++;
      serve(true);
    }
  }
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
  // compute mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  // center paddle on mouse
  playerY = mouseY - PADDLE_HEIGHT / 2;
  playerY = clamp(playerY, 0, HEIGHT - PADDLE_HEIGHT);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') { upPressed = true; e.preventDefault(); }
  if (e.key === 'ArrowDown') { downPressed = true; e.preventDefault(); }
  if (e.code === 'Space') { paused = !paused; e.preventDefault(); }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') upPressed = false;
  if (e.key === 'ArrowDown') downPressed = false;
});

// Keep paddles contained on resize (if canvas styled responsively later)
function clampPositions() {
  playerY = clamp(playerY, 0, HEIGHT - PADDLE_HEIGHT);
  aiY = clamp(aiY, 0, HEIGHT - PADDLE_HEIGHT);
}

// Start
serve();
loop();

// Expose some variables for tweaking in console if needed
window.pong = {
  serve, setAI: (v)=>{AI_MAX_SPEED = v;}, setBallSpeedStart: (v)=>{ /* no-op for now */ }
};
