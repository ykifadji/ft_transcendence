const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

const paddleWidth = 18, paddleHeight = 130;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;

let scoreLeft = 0, scoreRight = 0;

const maxTrailLength = 20; // Longueur maximale de la traînée
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
    trail: [] // Stocke les positions précédentes de la balle
};
let keysPressed = {};
let isPaused = false;
let gameMode = '';
let isModeSelected = false;

let leftPaddleX = 45; // Position horizontale du paddle gauche
let rightPaddleX = canvas.width - paddleWidth - 45; // Position horizontale du paddle droit
let paddleRecoilLeft = 0; // Recul du paddle gauche
let paddleRecoilRight = 0; // Recul du paddle droit
const recoilDistance = 20; // Distance du recul horizontal
const recoilSpeed = 2;

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

function drawBall() {
    for (let i = 0; i < ball.trail.length; i++) {
        const pos = ball.trail[i];
        const proximity = i / ball.trail.length;

        // Couleur et transparence basées sur la position dans la traînée
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

function draw() {
    drawCanvas();
    drawPaddle(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
    drawPaddle(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
    drawBall();
    
    updateScoreDisplay();
}


function drawVictoryScreen(winner) {
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} wins!`, canvas.width / 2, canvas.height / 2);
}

function resetGame() {
    leftPaddleY = canvas.height / 2 - paddleHeight / 2;
    rightPaddleY = canvas.height / 2 - paddleHeight / 2;
    scoreLeft = 0;
    scoreRight = 0;
    resetBall();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.dx < 0 ? -4 : 4;
    ball.dy = 4;
}

function updatePaddles() {
    if (keysPressed["w"] && leftPaddleY > 0) leftPaddleY -= 8;
    if (keysPressed["s"] && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += 8;

    if (gameMode !== 'ai' && keysPressed["ArrowUp"] && rightPaddleY > 0) rightPaddleY -= 8;
    if (gameMode !== 'ai' && keysPressed["ArrowDown"] && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += 8;

    // Ajouter l'effet de recul aux paddles
    if (paddleRecoilLeft > 0) {
        if (ball.x - ball.radius <= paddleWidth + 45) {  // Si la balle touche le paddle gauche
            leftPaddleX -= recoilSpeed;  // Le paddle recule légèrement
            paddleRecoilLeft -= recoilSpeed;  // Réduire l'effet de recul
        }
    }

    if (paddleRecoilRight > 0) {
        if (ball.x + ball.radius >= canvas.width - paddleWidth - 45) {  // Si la balle touche le paddle droit
            rightPaddleX -= recoilSpeed;  // Le paddle recule légèrement
            paddleRecoilRight -= recoilSpeed;  // Réduire l'effet de recul
        }
    }
    if (leftPaddleX < 0) leftPaddleX = 0;
    if (rightPaddleX + paddleWidth > canvas.width) rightPaddleX = canvas.width - paddleWidth;
}

function updateBall() {
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > maxTrailLength) {
        ball.trail.shift();
    }

    // Collision avec le paddle gauche
    if (ball.x - ball.radius <= paddleWidth + 45 && ball.y >= leftPaddleY && ball.y <= leftPaddleY + paddleHeight) {
        paddleRecoilLeft = recoilDistance; // Activer le recul
    }

    // Collision avec le paddle droit
    if (ball.x + ball.radius >= canvas.width - paddleWidth - 45 && ball.y >= rightPaddleY && ball.y <= rightPaddleY + paddleHeight) {
        paddleRecoilRight = recoilDistance; // Activer le recul
    }

    // Si la balle sort des limites, réinitialiser le recul
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
        paddleRecoilLeft = 0;
        paddleRecoilRight = 0;
    }
}

document.addEventListener('updateGameState', function(event) {
    // Récupérer le mode de jeu à partir des données de l'événement
    gameMode = event.detail.gameMode;
    console.log("Mode de jeu : " + gameMode);
    // Appeler la fonction updateGameState avec le mode de jeu
    updateGameState(gameMode);

    const playerPicContainerOpponent = document.querySelector('.player-pic-container.opponent');
    const opponentProfileImage = document.createElement('img');
    if (gameMode === "ai") {
        opponentProfileImage.src = botOpponentPic;
        opponentProfileImage.alt = 'Profile picture';
        playerPicContainerOpponent.appendChild(opponentProfileImage);
    }
    else if (gameMode === "local") {
        opponentProfileImage.src = localOpponentPic;
        opponentProfileImage.alt = 'Profile picture';
        playerPicContainerOpponent.appendChild(opponentProfileImage);
    }
    
    document.querySelector('.game-card').classList.add('hidden');  // Cache la div du mode
    document.querySelector('#pong').classList.remove('hidden');    // Affiche le canvas
     // Une fois le mode sélectionné et envoyé, démarrer la boucle de jeu
    if (!isModeSelected) {
        isModeSelected = true;
        setInterval(gameLoop, 1000 / 60); // Lancer la boucle de jeu à 60 FPS
}
});

function updateGameState(gameMode) { // Ajouter gameMode comme paramètre
    let url = 'api/update_game/?left_paddle=' + leftPaddleY + '&right_paddle=' + rightPaddleY;

    if (gameMode === 'ai') {
        url += '&mode=ai';
    } else if (gameMode === 'remote') {
        url += '&mode=remote';
    } else {
        url += '&mode=local';
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.game_over) {
                drawVictoryScreen(data.winner);
                clearInterval(gameLoop);
                return;
            }
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
    // Sélectionner les éléments de la score-card
    const leftScoreElement = document.querySelectorAll('#current-player-score')[0];
    const rightScoreElement = document.querySelectorAll('#opponent-score')[0];

    // Mettre à jour le contenu des éléments avec les scores actuels
    leftScoreElement.textContent = scoreLeft;
    rightScoreElement.textContent = scoreRight;
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
