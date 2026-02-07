/************* CANVAS *************/
const isMobile =
  (window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches) ||
  Math.min(window.innerWidth, window.innerHeight) < 768;
const mobileScale = isMobile ? 1.45 : 1;
document.body.style.margin = 0;
document.body.style.overflow = "hidden";
document.body.style.background = "#000";

const canvas = document.createElement("canvas");
canvas.tabIndex = 0;
canvas.style.touchAction = "none";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/************* GAME STATE *************/
let dimension = "blue";
let obstacles = [];
let powerups = [];
let speed = 6;
let score = 0;
let running = false;
let gameOver = false;
let paused = false;
let shield = false;
let shieldTimer = 0;
let intro = true;
let introAlpha = 0;
let introTimer = 0;
let gameFade = 0;

let highScore = localStorage.getItem("phaseHighScore") || 0;

const playerSize = isMobile ? 60 : 40;
const player = {
  x: isMobile ? 80 : 120,
  y: canvas.height / 2,
  size: playerSize,
  w: Math.round(playerSize * mobileScale),
  h: Math.round((isMobile ? 112 : 75) * mobileScale)
};


/************* UI *************/
const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.top = "50%";
overlay.style.left = "50%";
overlay.style.transform = "translate(-50%, -50%)";
overlay.style.color = "white";
overlay.style.textAlign = "center";
overlay.style.maxWidth = "420px";
overlay.style.display = "none";
document.body.appendChild(overlay);
if (isMobile) {
  overlay.style.width = "90%";
  overlay.style.fontSize = "20px";
}


/* PLAY BUTTON */
const playBtn = document.createElement("button");
playBtn.innerText = "▶ PLAY";
playBtn.style.padding = "15px 40px";
playBtn.style.fontSize = "22px";
playBtn.style.transition = "0.25s";
overlay.appendChild(playBtn);

if (isMobile) {
  playBtn.style.fontSize = "28px";
  playBtn.style.padding = "20px 60px";
}

playBtn.onmouseenter = () =>
  (playBtn.style.transform = "scale(1.1)");
playBtn.onmouseleave = () =>
  (playBtn.style.transform = "scale(1)");

/* GAME INFO */
const info = document.createElement("div");
info.style.marginTop = "20px";
info.style.fontSize = "16px";
info.style.lineHeight = "1.6";

info.innerHTML = `
<b style="font-size:18px">GAME RULES</b><br>
Avoid obstacles in wrong world.<br>
Collect green orb for shield.<br><br>

<span style="opacity:0.9">Game by <span style="color:#7fd9ff; font-weight:700;">Tasdid Siam</span></span><br><br>

<b style="font-size:18px">CONTROLS (DESKTOP)</b><br>
🟦 Space → Change world<br>
⬆/⬇ or W/S → Move<br>
⏸ P → Pause<br>
🔊 M → Mute<br><br>

<b style="font-size:18px">CONTROLS (MOBILE)</b><br>
🟦 Tap → Change world<br>
Swipe/Drag → Move
`;
overlay.appendChild(info);

/* Restart Button */
const restartBtn = document.createElement("button");
restartBtn.innerHTML = "⟳<br>Restart";
restartBtn.style.width = "160px";
restartBtn.style.height = "160px";
restartBtn.style.fontSize = "28px";
restartBtn.style.background = "transparent";
restartBtn.style.color = "white";
restartBtn.style.border = "2px solid white";
restartBtn.style.borderRadius = "50%";
restartBtn.style.marginTop = "20px";
restartBtn.style.display = "none";
restartBtn.style.transition = "0.25s";

if (isMobile) {
  restartBtn.style.width = "200px";
  restartBtn.style.height = "200px";
  restartBtn.style.fontSize = "32px";
}

restartBtn.onmouseenter = () => {
  restartBtn.style.background = "white";
  restartBtn.style.color = "black";
  restartBtn.style.transform = "scale(1.1)";
};
restartBtn.onmouseleave = () => {
  restartBtn.style.background = "transparent";
  restartBtn.style.color = "white";
  restartBtn.style.transform = "scale(1)";
};

/* overlay fix */
overlay.style.pointerEvents = "none";
playBtn.style.pointerEvents = "auto";
restartBtn.style.pointerEvents = "auto";

/************* PAUSE BUTTON *************/
const pauseBtn = document.createElement("button");
pauseBtn.innerText = "⏸";
pauseBtn.style.position = "absolute";
pauseBtn.style.top = "15px";
pauseBtn.style.right = "70px";
pauseBtn.style.padding = "8px 12px";
document.body.appendChild(pauseBtn);

pauseBtn.onclick = togglePause;

function togglePause() {
  if (!running || gameOver) return;
  paused = !paused;
  pauseBtn.innerText = paused ? "▶" : "⏸";
}

/************* SOUND BUTTON *************/
let soundOn = true;

const soundBtn = document.createElement("button");
soundBtn.innerText = "🔊";
soundBtn.style.position = "absolute";
soundBtn.style.top = "15px";
soundBtn.style.right = "15px";
soundBtn.style.padding = "8px 12px";
document.body.appendChild(soundBtn);

soundBtn.onclick = toggleSound;

function toggleSound() {
  soundOn = !soundOn;
  soundBtn.innerText = soundOn ? "🔊" : "🔇";
  musicAudio.muted = !soundOn;
  gameOverAudio.muted = !soundOn;
  if (!soundOn) {
    stopMusic();
  } else if (running && !gameOver) {
    startMusic();
  }
}

/************* AUDIO *************/
const musicAudio = new Audio("assets/sounds/music.mp3");
musicAudio.loop = true;
musicAudio.preload = "auto";
musicAudio.volume = 0.25;
musicAudio.load();

const gameOverAudio = new Audio("assets/sounds/gameover.mp3");
gameOverAudio.preload = "auto";
gameOverAudio.volume = 0.5;
gameOverAudio.load();

function startMusic() {
  if (!soundOn) return;
  if (!musicAudio.paused) return;
  musicAudio.currentTime = 0;
  musicAudio.play().catch(() => {});
}

function stopMusic() {
  if (!musicAudio.paused) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
  }
}

function gameOverSound() {
  if (!soundOn) return;
  gameOverAudio.currentTime = 0;
  gameOverAudio.play().catch(() => {});
}

/************* CONTROLS *************/
function movePlayer(deltaY) {
  const nextY = player.y + deltaY;
  player.y = Math.max(0, Math.min(canvas.height - player.h, nextY));
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const code = e.code;
  const isMoveUp =
    code === "ArrowUp" || code === "KeyW" || key === "w";
  const isMoveDown =
    code === "ArrowDown" || code === "KeyS" || key === "s";

  if (e.repeat && !isMoveUp && !isMoveDown) return;

  if (code === "Space" || key === " ") {
    e.preventDefault();
    if (running && !paused) {
      dimension = dimension === "blue" ? "red" : "blue";
    }
  }

  if (isMoveUp || isMoveDown) {
    if (running && !paused) {
      const step = Math.round(player.h * 0.6);
      movePlayer(isMoveUp ? -step : step);
    }
  }

  if (code === "KeyP" || key === "p") {
    togglePause();
  }

  if (code === "KeyM" || key === "m") {
    toggleSound();
  }
});

if (isMobile) {
  const touchState = { x: 0, y: 0, startY: 0, t: 0 };
  const tapDistance = 14;
  const tapTime = 280;

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      touchState.x = touch.clientX;
      touchState.y = touch.clientY;
      touchState.startY = player.y;
      touchState.t = Date.now();
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (!running || paused || gameOver) return;
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const dragDelta = touch.clientY - touchState.y;
      const targetY = touchState.startY + dragDelta;
      player.y = Math.max(
        0,
        Math.min(canvas.height - player.h, targetY)
      );
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      if (!running || paused || gameOver) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchState.x;
      const dy = touch.clientY - touchState.y;
      const dt = Date.now() - touchState.t;
      if (
        Math.abs(dx) <= tapDistance &&
        Math.abs(dy) <= tapDistance &&
        dt <= tapTime
      ) {
        dimension = dimension === "blue" ? "red" : "blue";
      }
    },
    { passive: false }
  );
}

/************* SPAWN *************/
setInterval(() => {
  if (!running) return;

  obstacles.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 60 * mobileScale),
    w: Math.round(50 * mobileScale),
    h: Math.round(60 * mobileScale),
    dim: Math.random() > 0.5 ? "blue" : "red"
  });
}, 1100);

setInterval(() => {
  if (!running) return;

  powerups.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 40 * mobileScale),
    size: Math.round(20 * mobileScale)
  });
}, 7000);

/************* BACKGROUND *************/
let stars = Array(120).fill().map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height
}));

const introImage = new Image();
introImage.src = "assets/images/intro.png";

function drawStars() {
  ctx.fillStyle = "#ffffff22";
  stars.forEach(s => {
    s.x -= 1;
    if (s.x < 0) s.x = canvas.width;
    ctx.fillRect(s.x, s.y, 2, 2);
  });
}

function drawIntro() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const introDelay = 12;
  const introFadeIn = 55;
  const introHold = 80;
  const introFadeOut = 55;
  const introTotal =
    introDelay + introFadeIn + introHold + introFadeOut;

  introTimer++;

  const smootherStep = (t) =>
    t * t * t * (t * (t * 6 - 15) + 10);

  let alpha = 0;
  let animScale = 0.92;
  let yOffset = 30;

  if (introTimer > introDelay) {
    if (introTimer <= introDelay + introFadeIn) {
      const p = (introTimer - introDelay) / introFadeIn;
      const ep = smootherStep(p);
      alpha = ep;
      animScale = 0.92 + 0.08 * ep;
      yOffset = 28 * (1 - ep);
    } else if (introTimer <= introDelay + introFadeIn + introHold) {
      alpha = 1;
      animScale = 1;
      yOffset = 0;
    } else if (introTimer <= introTotal) {
      const p =
        (introTimer - introDelay - introFadeIn - introHold) /
        introFadeOut;
        const ep = smootherStep(p);
        alpha = 1 - ep;
        animScale = 1 + 0.02 * ep;
        yOffset = -8 * ep;
    }
  }

  const imgReady = introImage.complete && introImage.naturalWidth > 0;
  if (imgReady) {
    const maxW = Math.min(canvas.width * 0.7, 520);
    const imgScale = maxW / introImage.naturalWidth;
    const drawW = introImage.naturalWidth * imgScale;
    const drawH = introImage.naturalHeight * imgScale;

    const floatY = Math.sin(introTimer * 0.06) * 3;
    const glowSize = Math.max(drawW, drawH) * 0.9;
    const glow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      glowSize
    );
    glow.addColorStop(0, `rgba(120,200,255,${0.18 * alpha})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.save();
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      introImage,
      canvas.width / 2 - (drawW * animScale) / 2,
      canvas.height / 2 - (drawH * animScale) / 2 + yOffset + floatY,
      drawW * animScale,
      drawH * animScale
    );
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#7fd9ff";
  ctx.textAlign = "center";
  ctx.font = "bold 17px Arial";
  ctx.fillText(
    "A Game by Tasdid Siam",
    canvas.width / 2,
    canvas.height / 2 + 140
  );
  ctx.restore();

  if (introTimer > introTotal) {
    intro = false;
    gameFade = 1;
    overlay.style.display = "block";
  }
}


function drawNavbar() {
  ctx.fillStyle = "white";
  ctx.font = isMobile ? "26px Arial" : "18px Arial";

  const padding = 20;

  ctx.fillText("Score: " + score, padding, 30);
  ctx.fillText("High: " + highScore, padding + 180, 30);
  ctx.fillText("Speed: " + speed.toFixed(1), padding + 360, 30);
  ctx.fillText("World: " + dimension, padding + 540, 30);
}

/************* LOOP *************/
function loop() {

  if (intro) {
  drawIntro();
  requestAnimationFrame(loop);
  return;
}

  ctx.fillStyle =
    dimension === "blue" ? "#001933" : "#330000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();

  /* PAUSE TEXT */
  if (paused && running && !gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText(
  "PAUSED",
  canvas.width / 2 - (isMobile ? 120 : 90),
  canvas.height / 2
);
  }

  if (running && !gameOver && !paused) {
    speed += 0.002;
    score++;

    ctx.fillStyle =
      dimension === "blue" ? "#00bfff" : "#ff4040";

    ctx.fillRect(player.x, player.y, player.w, player.h);

    /* SHIELD */
    if (shield) {
      shieldTimer--;
      ctx.strokeStyle = "#00ff88";
      ctx.strokeRect(
        player.x - 6,
        player.y - 6,
        player.w + 12,
        player.h + 12
      );
      if (shieldTimer <= 0) shield = false;
    }

    /* OBSTACLES */
    obstacles.forEach((o, i) => {
      o.x -= speed;

      ctx.fillStyle =
        o.dim === "blue" ? "#00bfff" : "#ff4040";
      ctx.fillRect(o.x, o.y, o.w, o.h);

      if (
        dimension === o.dim &&
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        if (shield) {
          shield = false;
          obstacles.splice(i, 1);
        } else endGame();
      }

      if (o.x + o.w < 0) obstacles.splice(i, 1);
    });

    /* POWERUPS */
    powerups.forEach((p, i) => {
      p.x -= speed;

      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (
        player.x < p.x + p.size &&
        player.x + player.w > p.x &&
        player.y < p.y + p.size &&
        player.y + player.h > p.y
      ) {
        shield = true;
        shieldTimer = 300;
        powerups.splice(i, 1);
      }

      if (p.x < 0) powerups.splice(i, 1);
    });
  }

  drawNavbar();

  if (gameFade > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${gameFade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    gameFade = Math.max(0, gameFade - 0.03);
  }

  requestAnimationFrame(loop);
}
loop();

/************* GAME END *************/
function endGame() {
  gameOver = true;
  running = false;

  stopMusic();
  gameOverSound();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("phaseHighScore", highScore);
  }

  let stars = score > 2000 ? 3 : score > 1000 ? 2 : 1;
  overlay.style.display = "block";
  overlay.innerHTML = `
    <h1>GAME OVER</h1>
    <p>Score: ${score}</p>
    <p>High Score: ${highScore}</p>
    <h2 style="font-size:50px; letter-spacing:10px;">
      ${"★".repeat(stars)}${"☆".repeat(3 - stars)}
    </h2>
  `;

  overlay.appendChild(restartBtn);
  restartBtn.style.display = "inline-block";
}

/************* START *************/
function startGame() {
  overlay.style.display = "none";
  canvas.focus();
  running = true;
  paused = false;
  startMusic();
}

function restart() {
  obstacles = [];
  powerups = [];
  speed = 6;
  score = 0;
  gameOver = false;
  running = true;
  paused = false;
  shield = false;
  shieldTimer = 0;

  overlay.style.display = "none";
  canvas.focus();
  startMusic();
}

playBtn.onclick = startGame;
restartBtn.onclick = restart;