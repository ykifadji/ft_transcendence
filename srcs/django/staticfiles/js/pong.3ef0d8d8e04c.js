const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

const paddleWidth = 18, paddleHeight = 130;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let scoreLeft = 0, scoreRight = 0;

const maxTrailLength = 20;
const trailImages = { 
    clouds: "☁️", 
    cherryBlossom: "🌸", 
    thunderstorm: "⚡️", 
    forest: "🍃", 
    galaxy: "✨", 
    arena: "🔥"
};
let currentTheme = localStorage.getItem('selectedTheme') || "clouds";

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 4,
    dy: 4,
    radius: 10,
    trail: []
};

let keysPressed = {};
let isPaused = false;
let gameMode = '';
let isModeSelected = false;
let gameLoopId = null; // Will store our setInterval reference

// Paddles positioning + recoil
let leftPaddleX = 45;
let rightPaddleX = canvas.width - paddleWidth - 45;
let paddleRecoilLeft = 0;
let paddleRecoilRight = 0;
const recoilDistance = 30;
const recoilSpeed = 1;

// Listen for keydown/up
document.addEventListener("keydown", function(event) {
    if (event.key === " ") {
        isPaused = !isPaused;
    }
    if (!isPaused) {
        keysPressed[event.key] = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (!isPaused) {
        keysPressed[event.key] = false;
    }
});

// Listen for theme changes
document.addEventListener("themeChange", function(event) {
    currentTheme = event.detail.theme;
});

// Basic drawing
function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const radius = 70;
    context.beginPath();
    context.moveTo(radius, 0);
    context.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
    context.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
    context.arcTo(0, canvas.height, 0, 0, radius);
    context.arcTo(0, 0, canvas.width, 0, radius);
    context.closePath();
}

function drawPaddle(x, y, width, height) {
    const radius = 10;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
    context.fillStyle = "white";
    context.fill();
}

function drawBall() {
    for (let i = 0; i < ball.trail.length; i++) {
        const pos = ball.trail[i];
        const proximity = i / ball.trail.length;
        const alpha = (0.5 + proximity * 0.5).toFixed(2);
        const size = ball.radius * (0.8 + proximity * 1.5);

        context.save();
        context.globalAlpha = alpha;
        context.font = `${size}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.fillText(trailImages[currentTheme] || "•", pos.x, pos.y);
        context.restore();
    }
    context.globalAlpha = 1.0;
    context.fillStyle = "white";
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
}

function drawPauseScreen() {
    const radius = 70;
    context.beginPath();
    context.moveTo(radius, 0);
    context.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
    context.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
    context.arcTo(0, canvas.height, 0, 0, radius);
    context.arcTo(0, 0, canvas.width, 0, radius);
    context.closePath();
    context.fillStyle = "white";
    context.font = "48px Inter";
    context.textAlign = "center";
    context.fillText("Pause", canvas.width / 2, canvas.height / 2);
}

// Victory screen logic
function showVictoryScreen(winner, mode) {
    const victoryScreen = document.getElementById('victory-screen');
    const winnerPic = document.getElementById('winner-pic');
    const winnerMsg = document.getElementById('winner-msg');

    let displayMsg = '';
    let winnerImage = '';

    if (mode === 'ai') {
        if (winner === 'Left Player') {
            winnerImage = (currentUser && currentUser.image_url) 
                ? currentUser.image_url 
                : profilePicDefault;
            displayMsg = `@${currentUser?.username || 'You'} won!`;
        } else {
            winnerImage = botOpponentPic;
            displayMsg = 'The AI has won!';
        }
    } else if (mode === 'local') {
        if (winner === 'Left Player') {
            winnerImage = localOpponentPic; // P1
            displayMsg = 'P1 has won!';
        } else {
            winnerImage = localOpponentPic; // P2
            displayMsg = 'P2 has won!';
        }
    } else if (mode === 'remote') {
        if (winner === 'Left Player') {
            winnerImage = localOpponentPic;
            displayMsg = 'Left player has won!';
        } else {
            winnerImage = localOpponentPic;
            displayMsg = 'Right player has won!';
        }
    }

    winnerPic.src = winnerImage;
    winnerMsg.textContent = displayMsg;
    victoryScreen.classList.remove('hidden');
}

function hideVictoryScreen() {
    document.getElementById('victory-screen').classList.add('hidden');
}

// Resetting front-end state
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4;
    ball.dy = 4;
    ball.trail = [];
}

function resetGame() {
    leftPaddleY = canvas.height / 2 - paddleHeight / 2;
    rightPaddleY = canvas.height / 2 - paddleHeight / 2;
    scoreLeft = 0;
    scoreRight = 0;
    resetBall();
}

// Paddle updates
function updatePaddles() {
    if (keysPressed["w"] && leftPaddleY > 0) leftPaddleY -= 8;
    if (keysPressed["s"] && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += 8;

    if (gameMode !== 'ai' && keysPressed["ArrowUp"] && rightPaddleY > 0) rightPaddleY -= 8;
    if (gameMode !== 'ai' && keysPressed["ArrowDown"] && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += 8;

    // Recoil logic
    if (paddleRecoilLeft > 0) {
        leftPaddleX -= recoilSpeed;
        paddleRecoilLeft -= recoilSpeed;
    }
    if (paddleRecoilLeft <= 0 && leftPaddleX < 45) {
        leftPaddleX += recoilSpeed;
    }
    if (paddleRecoilRight > 0) {
        rightPaddleX += recoilSpeed;
        paddleRecoilRight -= recoilSpeed;
    }
    if (paddleRecoilRight <= 0 && rightPaddleX > canvas.width - paddleWidth - 45 ) {
        rightPaddleX -= recoilSpeed;
    }

    // Keep paddles in-bounds
    if (leftPaddleX < 0) leftPaddleX = 45;
    if (rightPaddleX + paddleWidth > canvas.width) rightPaddleX = canvas.width - paddleWidth - 45;
}

// Ball recoil triggers
function updateBall() {
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > maxTrailLength) {
        ball.trail.shift();
    }

    if (ball.x - ball.radius == paddleWidth + 45 && ball.y >= leftPaddleY && ball.y <= leftPaddleY + paddleHeight) {
        paddleRecoilLeft = recoilDistance;
    }
    if (ball.x + ball.radius == canvas.width - paddleWidth - 45 && ball.y >= rightPaddleY && ball.y <= rightPaddleY + paddleHeight) {
        paddleRecoilRight = recoilDistance;
    }
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
        paddleRecoilLeft = 0;
        paddleRecoilRight = 0;
    }
}

// Communicate with Django
function updateGameState(gameMode) {
    let url = 'api/update_game/?left_paddle=' + leftPaddleY + '&right_paddle=' + rightPaddleY;
    if (gameMode === 'ai') url += '&mode=ai';
    else if (gameMode === 'remote') url += '&mode=remote';
    else url += '&mode=local';

    fetch(url)
      .then(response => response.json())
      .then(data => {
          if (data.game_over) {
              showVictoryScreen(data.winner, gameMode);
              clearInterval(gameLoopId); // Stop the loop
              return;
          }
          // Update local positions
          ball.x = data.ball_x;
          ball.y = data.ball_y;
          scoreLeft = data.score_left;
          scoreRight = data.score_right;
          leftPaddleY = data.left_paddle_y;
          rightPaddleY = data.right_paddle_y;
          draw();
      })
      .catch(error => console.error('Error updating game state:', error));
}

function updateScoreDisplay() {
    const leftScoreElement = document.querySelector('#current-player-score');
    const rightScoreElement = document.querySelector('#opponent-score');
    if (leftScoreElement && rightScoreElement) {
        leftScoreElement.textContent = scoreLeft;
        rightScoreElement.textContent = scoreRight;
    }
}

function draw() {
    drawCanvas();
    drawPaddle(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
    drawPaddle(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
    drawBall();
    updateScoreDisplay();
}

// Game loop
function gameLoop() {
    if (isPaused) {
        drawPauseScreen();
    } else {
        updatePaddles();
        updateBall();
        updateGameState(gameMode);
    }
}

// Listen for new mode from base.js
document.addEventListener('updateGameState', function(event) {
    gameMode = event.detail.gameMode;
    console.log("Game mode:", gameMode);

    // Immediately update so back-end knows we're in a new mode
    updateGameState(gameMode);

    // If there's an opponent pic container
    const playerPicContainerOpponent = document.querySelector('.player-pic-container.opponent');
    if (playerPicContainerOpponent) {
        playerPicContainerOpponent.innerHTML = ''; // Clear any old image
        const opponentProfileImage = document.createElement('img');
        if (gameMode === "ai") {
            opponentProfileImage.src = botOpponentPic;
        }
        else if (gameMode === "local") {
            opponentProfileImage.src = localOpponentPic;
        }
        opponentProfileImage.alt = 'Profile picture';
        playerPicContainerOpponent.appendChild(opponentProfileImage);
    }

    // Hide the game-mode card, show the canvas
    document.querySelector('.game-card')?.classList.add('hidden');
    canvas.classList.remove('hidden');

    // If we haven't started a loop yet, start it now
    if (!isModeSelected) {
        isModeSelected = true;
        gameLoopId = setInterval(gameLoop, 1000 / 60);
    }
});

// >>> BACK TO MENU <<<
document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    // 1) Hide the victory screen
    hideVictoryScreen();
    
    // 2) Reset front-end state (scores and paddle positions)
    resetGame();
    
    // 3) Immediately refresh the scoreboard on the client
    updateScoreDisplay(); // Now the UI shows 0-0
  
    // 4) Stop the existing game loop
    clearInterval(gameLoopId);
    isModeSelected = false;
  
    // 5) Also reset on the BACK-END
    fetch('api/update_game/?force_reset=true')
      .then(response => response.json())
      .then(() => {
        // 6) Hide the canvas, show the menu
        canvas.classList.add('hidden');
        document.querySelector('.game-card')?.classList.remove('hidden');

        // Also disable the Exit game button, since no game is active
        const exitGameBtn = document.querySelector('.exit-game');
        exitGameBtn.classList.add('disabled');
        exitGameBtn.disabled = true;
      })
      .catch(error => console.error('Error forcing reset:', error));
});

// >>> EXIT GAME <<<
document.addEventListener('exitGame', function(e) {
    // e.detail has { winner, gameMode }
    const { winner, gameMode } = e.detail;
    
    // 1) Show the victory screen
    showVictoryScreen(winner, gameMode);

    // 2) Stop the existing loop
    clearInterval(gameLoopId);
    isModeSelected = false;
});