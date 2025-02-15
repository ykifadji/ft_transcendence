/* filename: game.js */

// Existing global states for the game:
window.isInGame = false;        
window.currentGameMode = null;
let abortController = new AbortController(); // In case you use signals for fetch or had leftover references

document.addEventListener('DOMContentLoaded', () => {
    // Because we took them out of base.js, re-select them here:
    const scoreCard = document.querySelector('.score-card');
    const settingsBtn = document.querySelector('.settings-btn');
    const exitGameBtn = document.querySelector('.exit-game');
    const exitTournamentBtn = document.querySelector('.exit-tournament');
    const gameModeOptions = document.querySelectorAll('.game-mode-option');
    const container = document.querySelector('.base-container');

    /****************************************************************
     * 1) SHOW / HIDE EXIT BUTTONS BASED ON isInGame / isInTournament
     ****************************************************************/
    // This function was in base.js but also called in tournament.js.
    window.updateExitButtonsVisibility = function() {
        // This function references isInTournament (defined in tournament.js).
        if (isInTournament) {
            // Hide "Exit game", show "Exit tournament"
            exitGameBtn.style.display = 'none';
            exitTournamentBtn.style.display = '';
        } else {
            exitTournamentBtn.style.display = 'none';
            exitGameBtn.style.display = isInGame ? '' : 'none';
        }
    };

    /****************************************************************
     * 2) SETTINGS BUTTON (toggles the "score-card" side panel)
     ****************************************************************/
    settingsBtn.addEventListener('click', () => {
        settingsBtn.classList.toggle('rotated');
        scoreCard.classList.toggle('settings-active');

        exitGameBtn.classList.toggle('disabled', !isInGame);
        exitGameBtn.disabled = !isInGame;

        // For tournament mode:
        exitTournamentBtn.classList.toggle('disabled', !isInTournament);
        exitTournamentBtn.disabled = !isInTournament;
    });

    /****************************************************************
     * 3) SCOREBOARD UI
     ****************************************************************/
    function updateScoreboardUI(mode) {
        const leftPicContainer = document.querySelector('.player-pic-container');
        const rightPicContainer = document.querySelector('.player-pic-container.opponent');
        const labelLeft = document.getElementById('player-label-left');
        const labelRight = document.getElementById('player-label-right');
    
        leftPicContainer.style.display = 'flex';
        rightPicContainer.style.display = 'flex';
        
        labelLeft.style.display = 'none';
        labelRight.style.display = 'none';
        labelLeft.textContent = '';
        labelRight.textContent = '';
    
        if (mode === 'ai') {
            return;
        }
        if (mode === 'local' || mode === 'remote') {
            leftPicContainer.style.display = 'none';
            rightPicContainer.style.display = 'none';

            // If tournament
            if (isInTournament) {
                if (mode === 'local') {
                    const champion = tournamentPlayers[currentChampionIndex];
                    const challenger = tournamentPlayers[nextChallengerIndex];
                    labelLeft.textContent = champion.alias;
                    labelRight.textContent = challenger.alias;
                    labelLeft.style.display = 'inline-block';
                    labelRight.style.display = 'inline-block';
                } else {
                    // If remote tournament, do something else...
                }
            } 
            else {
                labelLeft.textContent = 'P1';
                labelRight.textContent = 'P2';
                labelLeft.style.display = 'inline-block';
                labelRight.style.display = 'inline-block';
            }
        }
    }
    window.updateScoreboardUI = updateScoreboardUI; // so that other files (tournament.js) can call it

    function revertGameCardToDefault() {
        const canvas = document.getElementById('pong');
        canvas.classList.add('hidden');
    
        document.querySelector('.game-card')?.classList.remove('hidden');
    
        const leftScoreElement = document.querySelector('#current-player-score');
        const rightScoreElement = document.querySelector('#opponent-score');
        if (leftScoreElement) leftScoreElement.textContent = "0";
        if (rightScoreElement) rightScoreElement.textContent = "0";
    }
    window.revertGameCardToDefault = revertGameCardToDefault;

    /****************************************************************
     * 4) GAME-MODE LOGIC + TRIGGER GAME UPDATE
     ****************************************************************/
    function triggerGameUpdate(mode) {
        currentGameMode = mode;
        isInGame = true;
        
        exitGameBtn.classList.remove('disabled');
        exitGameBtn.disabled = false;

        updateExitButtonsVisibility();
        updateScoreboardUI(mode);

        // Fire a custom event to let pong.js handle the loop
        const event = new CustomEvent('updateGameState', {
            detail: { gameMode: mode }
        });
        document.dispatchEvent(event);
    }

    // Listen for clicks on the "Game mode" options (AI, remote, local)
    gameModeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const mode = opt.getAttribute('data-mode');
            console.log('Game mode selected:', mode);

            // If the user explicitly chooses a normal local/AI/remote game,
            // we assume they're not in a tournament context:
            isInTournament = false;
            triggerGameUpdate(mode);
        });
    });
    
    /****************************************************************
     * 5) EXIT GAME BUTTON
     ****************************************************************/
    exitGameBtn.addEventListener('click', () => {
        if (!isInGame) return;

        // Just for demonstration, we always pick "Right Player" as the winner
        // or your existing logic. 
        let winner = 'Right Player';
        if (currentGameMode === 'ai') {
            winner = 'Right Player'; 
        } else if (currentGameMode === 'local') {
            winner = 'Right Player'; 
        } else if (currentGameMode === 'remote') {
            winner = 'Right Player'; 
        }

        // Let base.js / pong.js handle the actual "exitGame" event
        const exitEvent = new CustomEvent('exitGame', {
            detail: { winner, gameMode: currentGameMode }
        });
        document.dispatchEvent(exitEvent);

        isInGame = false;
        exitGameBtn.classList.add('disabled');
        exitGameBtn.disabled = true;

        revertGameCardToDefault();
        restoreDefaultScoreCard(); // from tournament.js

        updateExitButtonsVisibility();
    });

    /****************************************************************
     * 6) EXIT GAME EVENT LISTENER
     ****************************************************************/
    document.addEventListener('exitGame', function(e) {
        console.log("GAME.JS exitGame event handler triggered. Details:", e.detail);
        const { winner, gameMode } = e.detail;
        
        // If there's a tournament mode going on, tournament.js might handle the winner
        // Otherwise, we show normal victory screen (in pong.js).
        // The base code in pong.js also listens to 'exitGame' to show victoryScreen or handle tournament.

        // We keep the code that was in base.js to call showVictoryScreen or handleLocalPongWinner,
        // but in your original you had it partly in base.js, partly in pong.js.
        // The important lines are to keep the logic consistent:
        //   isInGame = false, revertGameCardToDefault(), etc.
        //   The actual victory screen or localTournament logic is in pong.js / tournament.js

        // Example debug only (the real logic is in pong.js / tournament.js):
        console.log("No direct changes here - game.js defers to pong.js or tournament.js for full handling.");
    });

    // Finally, initialize the exit buttons once
    updateExitButtonsVisibility();
});
