/* filename: pong.js */

const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

const paddleWidth = 18, paddleHeight = 130;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let scoreLeft = 0, scoreRight = 0;

const maxTrailLength = 20;
const trailImages = { 
    clouds: "☁️", 
    cherry_blossoms: "🌸", 
    sunset: "☀️", 
    nature: "🍃", 
    galaxy: "✨", 
    fire: "🔥"
};

let currentTheme = localStorage.getItem('selectedTheme') || "clouds";

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 0, // Initialize to 0 or fetch from server
    dy: 0,
    radius: 10,
    trail: []
};

let keysPressed = {};
let isPaused = false;
let gameMode = '';
let isModeSelected = false;
let gameLoopId = null; 

// Paddles positioning + recoil
let leftPaddleX = 45;
let rightPaddleX = canvas.width - paddleWidth - 45;
let paddleRecoilLeft = 0;
let paddleRecoilRight = 0;
const recoilDistance = 30;
const recoilSpeed = 1;

// Keydown/up for paddles
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
        const rotation = pos.rotation; // Get the rotation angle

        context.save();
        context.translate(pos.x, pos.y); // Move to the trail position
        context.rotate(rotation); // Apply rotation
        context.globalAlpha = alpha;
        context.font = `${size}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.fillText(trailImages[currentTheme] || "•", 0, 0); // Draw at the translated origin
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

// Victory screen
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
            winnerImage = localOpponentPic;
            displayMsg = 'P1 has won!';
        } else {
            winnerImage = localOpponentPic;
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

// Reset front-end state
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

// Paddles
function updatePaddles() {
    if (keysPressed["w"] && leftPaddleY > 0) leftPaddleY -= 8;
    if (keysPressed["s"] && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += 8;

    if (gameMode !== 'ai' && keysPressed["ArrowUp"] && rightPaddleY > 0) rightPaddleY -= 8;
    if (gameMode !== 'ai' && keysPressed["ArrowDown"] && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += 8;

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

    if (leftPaddleX < 0) leftPaddleX = 45;
    if (rightPaddleX + paddleWidth > canvas.width) rightPaddleX = canvas.width - paddleWidth - 45;
}

function updateBall() {
    // Add a new trail segment with random rotation
    ball.trail.push({ 
        x: ball.x, 
        y: ball.y,
        rotation: Math.random() * Math.PI * 2 // Random rotation between 0 and 2π radians
    });
    if (ball.trail.length > maxTrailLength) {
        ball.trail.shift();
    }

    // Recoil triggers
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

function updateGameState(gameMode) {
    let url = 'api/update_game/?left_paddle=' + leftPaddleY + '&right_paddle=' + rightPaddleY;
    if (gameMode === 'ai') url += '&mode=ai';
    else if (gameMode === 'remote') url += '&mode=remote';
    else url += '&mode=local';

    fetch(url, { signal: abortController.signal })
      .then(response => response.json())
      .then(data => {
          if (!isInGame) return; 

          if (data.reset_done) {
              scoreLeft = 0;
              scoreRight = 0;
              resetBall();
              updateScoreDisplay();
              clearInterval(gameLoopId);
              isModeSelected = false;
              isInGame = false;
              document.querySelector('.game-card')?.classList.remove('hidden');
              canvas.classList.add('hidden');
              return;
          }

          if (data.game_over) {
              if (localTournamentMode && gameMode === 'local') {
                  const winnerFromBackend = data.winner || 'Left Player';
                  const exitEvent = new CustomEvent('exitGame', {
                      detail: { winner: winnerFromBackend, gameMode: 'local' }
                  });
                  document.dispatchEvent(exitEvent);
                  console.log("DISPATCHING exitGame event from pong.js with winner =", winnerFromBackend);
                  clearInterval(gameLoopId);
                  return;
              } else {
                  showVictoryScreen(data.winner, gameMode);
                  clearInterval(gameLoopId);
                  return;
              }
          }

          ball.x = data.ball_x;
          ball.y = data.ball_y;
          ball.dx = data.ball_dx; // Update ball.dx
          ball.dy = data.ball_dy; // Update ball.dy
          scoreLeft = data.score_left;
          scoreRight = data.score_right;
          leftPaddleY = data.left_paddle_y;
          rightPaddleY = data.right_paddle_y;
          draw();
      })
      .catch(error => {
          if (error.name === 'AbortError') {
              console.log('Fetch aborted');
          } else {
              console.error('Error updating game state:', error);
          }
      });
}

function updateScoreDisplay() {
    const leftScoreElement = document.querySelector('#current-player-score');
    const rightScoreElement = document.querySelector('#opponent-score');
    if (leftScoreElement && rightScoreElement) {
        leftScoreElement.textContent = scoreLeft;
        rightScoreElement.textContent = scoreRight;
        console.log(`Score Display Updated: ${scoreLeft} - ${scoreRight}`);
    } else {
        console.error('Score elements not found in the DOM.');
    }
}

function draw() {
    drawCanvas();
    drawPaddle(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
    drawPaddle(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
    drawBall();
    updateScoreDisplay();
}

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

    updateGameState(gameMode);

    const playerPicContainerOpponent = document.querySelector('.player-pic-container.opponent');
    if (playerPicContainerOpponent) {
        playerPicContainerOpponent.innerHTML = ''; 
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

    document.querySelector('.game-card')?.classList.add('hidden');
    canvas.classList.remove('hidden');

    if (!isModeSelected) {
        isModeSelected = true;
        gameLoopId = setInterval(gameLoop, 1000 / 60);
    }
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    hideVictoryScreen();
    resetGame();
    updateScoreDisplay();
    clearInterval(gameLoopId);
    isModeSelected = false;
  
    fetch('api/update_game/?force_reset=true')
      .then(response => response.json())
      .then(() => {
        canvas.classList.add('hidden');
        document.querySelector('.game-card')?.classList.remove('hidden');

        const exitGameBtn = document.querySelector('.exit-game');
        exitGameBtn.classList.add('disabled');
        exitGameBtn.disabled = true;
      })
      .catch(error => console.error('Error forcing reset:', error));

    restoreDefaultScoreCard(); // from tournament.js
});

document.addEventListener('exitGame', function(e) {
    const { winner, gameMode } = e.detail;
    clearInterval(gameLoopId);
    isModeSelected = false;
    // base.js handles localTournamentMode scenario
});
