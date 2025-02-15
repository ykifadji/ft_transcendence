/* filename: tournament.js */

/***************************************************/
/*          TOURNAMENT-RELATED GLOBALS            */
/***************************************************/
var isInTournament = false;  // was let isInTournament = false in your original code
var tournamentPlayers = [];
var currentChampionIndex = 0;
var nextChallengerIndex = 1;
var REQUIRED_WINS = 5;

/***************************************************/
/*     LOCAL "TOURNAMENT MODE" FOR PONG LOGIC      */
/***************************************************/
// This was originally in pong.js, but we keep the exact variable name:
var localTournamentMode = false;

// Listen for an event from base.js that sets localTournamentMode true/false
document.addEventListener('setLocalTournamentMode', (e) => {
    localTournamentMode = e.detail.value;
});

/***************************************************/
/*       EXIT TOURNAMENT BUTTON EVENT LISTENER     */
/***************************************************/
document.addEventListener('DOMContentLoaded', () => {
    const exitTournamentBtn = document.querySelector('.exit-tournament');
    exitTournamentBtn.addEventListener('click', () => {
        if (!isInTournament) return;
    
        // 1) End the tournament
        isInTournament = false;
        tournamentPlayers = [];
        currentChampionIndex = 0;
        nextChallengerIndex = 1;
    
        // 2) If a game is running, stop it
        if (isInGame) {
            isModeSelected = false;
            isInGame = false;
        
            // Optionally reset the backend
            fetch('api/update_game/?force_reset=true')
                .catch(err => console.error('Error forcing reset on the server:', err));
        }
    
        // 3) Revert UI
        revertGameCardToDefault();    // Hide canvas, show game mode menu
        restoreDefaultScoreCard();    // Reset scoreboard to 0-0, pictures, etc.
        updateTournamentCard();       // Show "No ongoing tournament"
        updateExitButtonsVisibility();

        // 4) Dispatch a custom event to inform pong.js
        document.dispatchEvent(new CustomEvent('tournamentExited'));
    });
});

/***************************************************/
/*         ATTACHING THE "START TOURNAMENT" BTN    */
/***************************************************/
function attachTournamentListeners() {
    const adaptiveCard = document.querySelector('.adaptive-card');
    const startBtn = adaptiveCard.querySelector('#start-tournament-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            isInTournament = true;
            promptNumberOfPlayers();
            updateExitButtonsVisibility(); // show/hide buttons accordingly
        });
    }
}

/***************************************************/
/*         PROMPTING FOR # PLAYERS (3-6)           */
/***************************************************/
function promptNumberOfPlayers() {
    const adaptiveCard = document.querySelector('.adaptive-card');
    const container = document.querySelector('.base-container');

    adaptiveCard.innerHTML = `
        <button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
        <div class="adaptive-content">
            <h2 class="card-title">New Tournament</h2>
            <p id="player-count-p">Enter number of players (3-6):</p>
            <div style="text-align:center;">
                <input id="tournament-player-count" type="number" min="3" max="6">
                <button id="confirm-player-count">Confirm</button>
            </div>
        </div>
    `;
    adaptiveCard.classList.remove('hidden');
    container.classList.remove('centered-layout');

    const closeBtn = adaptiveCard.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideAdaptiveCard();
            isInTournament = false;
            tournamentPlayers = [];
            updateExitButtonsVisibility();
        });
    }

    const confirmBtn = adaptiveCard.querySelector('#confirm-player-count');
    confirmBtn.addEventListener('click', () => {
        const countInput = adaptiveCard.querySelector('#tournament-player-count');
        const n = parseInt(countInput.value);
        if (n >= 3 && n <= 6) {
            collectPlayerAliases(n);
        } else {
            alert("Please enter a value between 3 and 6.");
        }
    });
}

/***************************************************/
/*     GATHERING PLAYER ALIASES & VALIDATING       */
/***************************************************/
function collectPlayerAliases(playerCount) {
    const adaptiveCard = document.querySelector('.adaptive-card');
    const container = document.querySelector('.base-container');

    let inputsHtml = '';
    for (let i = 1; i <= playerCount; i++) {
        inputsHtml += `
            <div id="players-input-list">
                <label id="player-n-list">Player ${i}: </label>
                <input type="text" id="alias-${i}">
            </div>
        `;
    }

    adaptiveCard.innerHTML = `
        <button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
        <div class="adaptive-content">
            <h2 id="card-title-p-aliases">Player Aliases</h2>
            <div style="text-align:center;">
                ${inputsHtml}
            </div>
            <div style="text-align:center; margin-top:20px;">
                <button id="start-tournament-play">Begin Tournament</button>
            </div>
        </div>
    `;
    adaptiveCard.classList.remove('hidden');
    container.classList.remove('centered-layout');

    const closeBtn = adaptiveCard.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideAdaptiveCard();
            isInTournament = false;
            tournamentPlayers = [];
            updateExitButtonsVisibility();
        });
    }

    const beginBtn = adaptiveCard.querySelector('#start-tournament-play');
    beginBtn.addEventListener('click', () => {
        let tempAliases = [];

        for (let i = 1; i <= playerCount; i++) {
            const aliasInput = adaptiveCard.querySelector(`#alias-${i}`);
            let aliasVal = aliasInput.value.trim() || `Player${i}`;

            if (aliasVal.length > 10) {
                alert(`Alias for Player ${i} is too long (max 10 characters). Please correct it.`);
                return;
            }
            if (!/^[A-Za-z]+$/.test(aliasVal)) {
                alert(`Alias for Player ${i} must be alphabetical only (A-Z, a-z). Please correct it.`);
                return;
            }

            tempAliases.push(aliasVal);
        }

        tournamentPlayers = [];
        for (let aliasVal of tempAliases) {
            tournamentPlayers.push({ alias: aliasVal, wins: 0 });
        }

        currentChampionIndex = 0;
        nextChallengerIndex = 1;
        updateTournamentCard();

        // Start the first local match
        triggerLocalTournamentGame();
    });
}

/***************************************************/
/*         RENDER / UPDATE THE TOURNAMENT CARD     */
/***************************************************/
function renderTournamentCard() {
    if (!isInTournament) {
        return `
            <div class="tournament-card">
                <h2 class="card-title">Tournament</h2>
                <div style="text-align:center;">
                    <p id="tournament-presentation">No ongoing tournament</p>
                    <button id="start-tournament-btn">Start a new tournament</button>
                </div>
            </div>
        `;
    }

    if (tournamentPlayers.length === 0) {
        return `
            <div class="tournament-card">
                <h2 class="card-title">Tournament Setup</h2>
                <div style="text-align:center;">
                    <p>Loading...</p>
                </div>
            </div>
        `;
    }

    const champion = tournamentPlayers[currentChampionIndex];
    const challenger = tournamentPlayers[nextChallengerIndex];

    let playersHtml = tournamentPlayers.map(p => {
        return `<li>${p.alias} - ${p.wins}</li>`;
    }).join('');

    return `
        <div class="tournament-card">
            <h2 class="card-title">Tournament</h2>
            <div id="tournament-players-ingame">
                <ul>
                    ${playersHtml}
                </ul>
                <p id="current-game-info">
                    Current match:
                    <br> 
                    <strong>${champion.alias}</strong> 
                    vs 
                    <strong>${challenger.alias}</strong>
                </p>
            </div>
        </div>
    `;
}

function updateTournamentCard() {
    const adaptiveCard = document.querySelector('.adaptive-card');
    const container = document.querySelector('.base-container');

    adaptiveCard.innerHTML = `
        <button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
        <div class="adaptive-content">
            ${renderTournamentCard()}
        </div>
    `;
    adaptiveCard.classList.remove('hidden');
    container.classList.remove('centered-layout');

    const closeBtn = adaptiveCard.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideAdaptiveCard();
        });
    }
}

/***************************************************/
/*   TRIGGER A NEW LOCAL TOURNAMENT GAME ROUND     */
/***************************************************/
function triggerLocalTournamentGame() {
    fetch('api/update_game/?force_reset=true')
        .then(() => {
            const inTournamentEvent = new CustomEvent('setLocalTournamentMode', {
                detail: { value: true }
            });
            document.dispatchEvent(inTournamentEvent);

            currentGameMode = 'local';
            isInGame = true;

            const exitGameBtn = document.querySelector('.exit-game');
            exitGameBtn.classList.remove('disabled');
            exitGameBtn.disabled = false;

            showTournamentAliasesOnScoreCard();
            updateExitButtonsVisibility();
            updateScoreboardUI('local');

            const event = new CustomEvent('updateGameState', {
                detail: { gameMode: 'local' }
            });
            document.dispatchEvent(event);
        })
        .catch(err => console.error('Error forcing reset on the server:', err));
}

/***************************************************/
/*    SHOWING ALIASES ON THE SCORE CARD (LEFT/RIGHT)  */
/***************************************************/
function showTournamentAliasesOnScoreCard() {
    if (!isInTournament || currentGameMode !== 'local') return;
  
    const champion = tournamentPlayers[currentChampionIndex];
    const challenger = tournamentPlayers[nextChallengerIndex];

    const leftPicContainer = document.querySelector('.player-pic-container');
    const rightPicContainer = document.querySelector('.player-pic-container.opponent');

    leftPicContainer.innerHTML = '';
    rightPicContainer.innerHTML = '';

    const leftLabel = document.createElement('div');
    leftLabel.classList.add('alias-label');
    leftLabel.textContent = champion.alias;

    const rightLabel = document.createElement('div');
    rightLabel.classList.add('alias-label');
    rightLabel.textContent = challenger.alias;

    leftPicContainer.appendChild(leftLabel);
    rightPicContainer.appendChild(rightLabel);
}

/***************************************************/
/*   RESTORE DEFAULT SCORE CARD AFTER TOURNAMENT   */
/***************************************************/
function restoreDefaultScoreCard() {
    const leftPic = document.querySelector('.player-pic-container');
    leftPic.innerHTML = '';

    if (currentUser && currentUser.image_url) {
        const profileImage = document.createElement('img');
        profileImage.src = currentUser.image_url;
        profileImage.alt = 'Profile picture';
        leftPic.appendChild(profileImage);
    }

    const rightPic = document.querySelector('.player-pic-container.opponent');
    rightPic.innerHTML = '';
    // Could also place a default pic or keep it empty
}

/***************************************************/
/*   HANDLE WHO WINS A MATCH IN LOCAL TOURNAMENT   */
/***************************************************/
function handleLocalPongWinner(winnerAlias) {
    const winnerIndex = tournamentPlayers.findIndex(p => p.alias === winnerAlias);
    if (winnerIndex === -1) return;

    tournamentPlayers[winnerIndex].wins++;

    if (tournamentPlayers[winnerIndex].wins >= REQUIRED_WINS) {
        alert(`${winnerAlias} has won the tournament! Congratulations!`);
    
        isInTournament = false;
        tournamentPlayers = [];
        currentChampionIndex = 0;
        nextChallengerIndex = 1;

        restoreDefaultScoreCard();
        updateTournamentCard();

        if (isInGame) {
            revertGameCardToDefault();
            isInGame = false;
        }

        const inTournamentEvent = new CustomEvent('setLocalTournamentMode', {
            detail: { value: false }
        });
        document.dispatchEvent(inTournamentEvent);

        updateExitButtonsVisibility(); 
        return;
    }

    currentChampionIndex = winnerIndex;
    do {
        nextChallengerIndex = (nextChallengerIndex + 1) % tournamentPlayers.length;
    } while (nextChallengerIndex === currentChampionIndex);

    const nextChampion = tournamentPlayers[currentChampionIndex].alias;
    const nextChallenger = tournamentPlayers[nextChallengerIndex].alias;

    alert(`${winnerAlias} has won the match!\nNext match: ${nextChampion} vs ${nextChallenger}`);
    updateTournamentCard();
    triggerLocalTournamentGame();
}

/***************************************************/
/*  WHEN THE TOURNAMENT IS EXITED (FROM base.js)   */
/***************************************************/
document.addEventListener('tournamentExited', () => {
    console.log("tournamentExited event received.");
    
    scoreLeft = 0;
    scoreRight = 0;
    updateScoreDisplay();
    console.log(`Scores reset: ${scoreLeft} - ${scoreRight}`);

    resetBall();

    const gameCard = document.querySelector('.game-card');
    if (gameCard) {
        gameCard.classList.remove('hidden');
    }
    const canvas = document.getElementById('pong');
    canvas.classList.add('hidden');

    if (gameLoopId) {
        clearInterval(gameLoopId);
        console.log("Game loop cleared.");
        gameLoopId = null;
    }

    isModeSelected = false;
    isInGame = false;
    console.log("Tournament state reset.");
});

/***************************************************/
/*  LISTEN FOR 'exitGame' AND DETERMINE WINNER     */
/***************************************************/
/** 
 * In tournament mode, once the backend says "game_over":true, 
 * pong.js dispatches 'exitGame' instead of calling showVictoryScreen().
 * We capture that here and call handleLocalPongWinner() to proceed 
 * to the next match or end the tournament.
 */
document.addEventListener('exitGame', (e) => {
    const { winner, gameMode } = e.detail;

    // Only handle if in a local tournament game
    if (isInTournament && localTournamentMode && gameMode === 'local') {
        // Map "Left Player" / "Right Player" => the correct alias
        let winnerAlias = null;
        if (winner === 'Left Player') {
            winnerAlias = tournamentPlayers[currentChampionIndex].alias;
        } else {
            winnerAlias = tournamentPlayers[nextChallengerIndex].alias;
        }

        console.log(`Tournament mode exitGame event: winner = ${winner} => alias = ${winnerAlias}`);
        handleLocalPongWinner(winnerAlias);
    } else {
        // Not a local-tournament scenario, do nothing special
        console.log("exitGame event in tournament.js, but not in localTournamentMode or not inTournament.");
    }
});
