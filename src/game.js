/************* CANVAS *************/
document.body.style.margin = 0;
document.body.style.overflow = "hidden";
document.body.style.background = "#000";

const canvas = document.createElement("canvas");
canvas.tabIndex = 0;
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

let highScore = localStorage.getItem("phaseHighScore") || 0;

const player = {
  x: 120,
  y: canvas.height / 2,
  w: 40,
  h: 75
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
document.body.appendChild(overlay);


/* PLAY BUTTON */
const playBtn = document.createElement("button");
playBtn.innerText = "▶ PLAY";
playBtn.style.padding = "15px 40px";
playBtn.style.fontSize = "22px";
playBtn.style.transition = "0.25s";
overlay.appendChild(playBtn);

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

<b style="font-size:18px">CONTROLS</b><br>
🟦 Space / Tap → Change world<br>
⏸ P → Pause<br>
🔊 M → Mute
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
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  const key = e.key.toLowerCase();
  const code = e.code;

  if (code === "Space" || key === " ") {
    e.preventDefault();
    if (running && !paused) {
      dimension = dimension === "blue" ? "red" : "blue";
    }
  }

  if (code === "KeyP" || key === "p") {
    togglePause();
  }

  if (code === "KeyM" || key === "m") {
    toggleSound();
  }
});

canvas.addEventListener("touchstart", () => {
  if (running)
    dimension = dimension === "blue" ? "red" : "blue";
});

/************* SPAWN *************/
setInterval(() => {
  if (!running) return;

  obstacles.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 60),
    w: 50,
    h: 60,
    dim: Math.random() > 0.5 ? "blue" : "red"
  });
}, 1100);

setInterval(() => {
  if (!running) return;

  powerups.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 40),
    size: 20
  });
}, 7000);

/************* BACKGROUND *************/
let stars = Array(120).fill().map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height
}));

function drawStars() {
  ctx.fillStyle = "#ffffff22";
  stars.forEach(s => {
    s.x -= 1;
    if (s.x < 0) s.x = canvas.width;
    ctx.fillRect(s.x, s.y, 2, 2);
  });
}

function drawNavbar() {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  const padding = 20;

  ctx.fillText("Score: " + score, padding, 30);
  ctx.fillText("High: " + highScore, padding + 160, 30);
  ctx.fillText("Speed: " + speed.toFixed(1), padding + 320, 30);
  ctx.fillText("World: " + dimension, padding + 500, 30);
}

/************* LOOP *************/
function loop() {
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
      canvas.width / 2 - 90,
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