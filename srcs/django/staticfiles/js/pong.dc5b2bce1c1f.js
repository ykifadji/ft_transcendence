const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

const paddleWidth = 25, paddleHeight = 200;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;

let scoreLeft = 0, scoreRight = 0;
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 4,
    dy: 4,
    radius: 10,
};
let keysPressed = {};
let isPaused = false;
let gameMode = '';
let isModeSelected = false;

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
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
    } else if (ball.y + ball.radius >= canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.dy = -ball.dy;
    }

    if (ball.x - ball.radius <= 0) {
        scoreRight++;
        if (scoreRight == 10) {
            scoreRight = 0;
            scoreLeft = 0;
        }
        resetBall();
    } else if (ball.x + ball.radius >= canvas.width) {
        scoreLeft++;
        if (scoreLeft == 10) {
            scoreRight = 0;
            scoreLeft = 0;
        }
        resetBall();
    }

    if (ball.dx < 0 && 
        ball.x - ball.radius <= paddleWidth + 45 && ball.x >= 45 && 
        ball.y >= leftPaddleY && ball.y <= leftPaddleY + paddleHeight
    ) {
        if (ball.y - ball.radius <= leftPaddleY || ball.y + ball.radius >= leftPaddleY + paddleHeight) {
            ball.dx = -ball.dx;
            let impact = (ball.y - (leftPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dy = impact * 5;
            if (Math.abs(ball.dx) < 4) ball.dx = ball.dx > 0 ? 4 : -4;
            ball.dx *= 1.05;
        } else {
            let impact = (ball.y - (leftPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dx = -ball.dx;
            ball.dy = impact * 5;

            if (Math.abs(ball.dx) < 4) ball.dx = ball.dx > 0 ? 4 : -4;

            ball.dx *= 1.05;

            ball.x = paddleWidth + 45 + ball.radius;
        }
    }

    if (ball.dx > 0 && 
        ball.x + ball.radius >= canvas.width - paddleWidth - 45 && ball.x + ball.radius <= canvas.width - 45 &&
        ball.y >= rightPaddleY && ball.y <= rightPaddleY + paddleHeight
    ) {
        if (ball.y - ball.radius <= rightPaddleY || ball.y + ball.radius >= rightPaddleY + paddleHeight) {
            ball.dx = -ball.dx;
            let impact = (ball.y - (rightPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dy = impact * 5;
            if (Math.abs(ball.dx) < 4) ball.dx = ball.dx > 0 ? 4 : -4;
            ball.dx *= 1.05;
        } else {
            let impact = (ball.y - (rightPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dx = -ball.dx;
            ball.dy = impact * 5;

            if (Math.abs(ball.dx) < 4) ball.dx = ball.dx > 0 ? 4 : -4;

            ball.dx *= 1.05;

            ball.x = canvas.width - paddleWidth - 45 - ball.radius;
        }
    }
}

document.addEventListener('updateGameState', function(event) {
    // Récupérer le mode de jeu à partir des données de l'événement
    gameMode = event.detail.gameMode;
    console.log("Mode de jeu : " + gameMode);
    // Appeler la fonction updateGameState avec le mode de jeu
    updateGameState(gameMode);

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

function draw() {
    drawCanvas();

    drawPaddle(45, leftPaddleY, paddleWidth, paddleHeight);
    drawPaddle(canvas.width - paddleWidth - 45, rightPaddleY, paddleWidth, paddleHeight);

    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = "white";
    context.fill();

    updateScoreDisplay();
}

function updateScoreDisplay() {
    // Sélectionner les éléments de la score-card
    const leftScoreElement = document.querySelectorAll('#current-player-score')[0];
    const rightScoreElement = document.querySelectorAll('#opponent-score')[0];

    // Mettre à jour le contenu des éléments avec les scores actuels
    leftScoreElement.textContent = scoreLeft;
    rightScoreElement.textContent = scoreRight;
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

function gameLoop() {
    if (isPaused) {
        drawPauseScreen();
    } else {
        updatePaddles();
        updateBall();
        updateGameState(gameMode);
    }
}
