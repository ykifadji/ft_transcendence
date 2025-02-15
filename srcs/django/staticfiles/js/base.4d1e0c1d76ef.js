function scaleLayout() {
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const container = document.querySelector('.base-container');
    const windowWidth = document.querySelector('.scaling-wrapper').clientWidth;
    const windowHeight = document.querySelector('.scaling-wrapper').clientHeight;
    
    const scale = Math.min(windowWidth / baseWidth, windowHeight / baseHeight);
    container.style.transform = `scale(${scale})`;
}

let isInGame = false;        
let isInTournament = false;
let currentUser = null;
let currentGameMode = null; // Keep track of which game mode we're using

// Handle userLoaded event
document.addEventListener('userLoaded', (event) => {
    currentUser = event.detail;
    if (currentUser && currentUser.image_url) {
        const playerPicContainer = document.querySelector('.player-pic-container');
        const profileImage = document.createElement('img');
        profileImage.src = currentUser.image_url;
        profileImage.alt = 'Profile picture';
        playerPicContainer.appendChild(profileImage);
    }

    // Show main content and hide welcome section
    const welcomeSection = document.getElementById('welcome-section');
    const mainContent = document.getElementById('main-content');
    if (welcomeSection && mainContent) {
        welcomeSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
});

// Handle userLoggedOut event
document.addEventListener('userLoggedOut', () => {
    // Remove user-related UI elements
    const playerPicContainers = document.querySelectorAll('.player-pic-container img');
    playerPicContainers.forEach(img => img.remove());

    // Hide main content and show welcome section
    const welcomeSection = document.getElementById('welcome-section');
    const mainContent = document.getElementById('main-content');
    if (welcomeSection && mainContent) {
        welcomeSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }

    // Optionally reset other UI elements or variables
});

document.addEventListener('DOMContentLoaded', () => {
    scaleLayout();
    window.addEventListener('resize', scaleLayout);
    
    const settingsBtn = document.querySelector('.settings-btn');
    const scoreCard = document.querySelector('.score-card');
    const exitGameBtn = document.querySelector('.exit-game');
    const exitTournamentBtn = document.querySelector('.exit-tournament');
    const adaptiveCard = document.querySelector('.adaptive-card');
    const navButtons = document.querySelectorAll('.nav-btn');
    const bgVideo = document.querySelector('.bg-video');
    const container = document.querySelector('.base-container');

    // Theme logic
    const savedTheme = localStorage.getItem('selectedTheme');
    const themeName = savedTheme ? savedTheme : 'clouds';
    bgVideo.src = savedTheme ? bgBasePath + savedTheme + '.mp4' : defaultBg;

    // When the settings button is clicked, show/hide the exit buttons, etc.
    settingsBtn.addEventListener('click', () => {
        settingsBtn.classList.toggle('rotated');
        scoreCard.classList.toggle('settings-active');

        // If we are not in a game => "Exit game" should be truly disabled
        exitGameBtn.classList.toggle('disabled', !isInGame);
        exitGameBtn.disabled = !isInGame;

        exitTournamentBtn.classList.toggle('disabled', !isInTournament);
        exitTournamentBtn.disabled = !isInTournament;
    });

    // Show adaptive card (e.g., for profile, languages, themes, etc.)
    function showAdaptiveCard(content) {
        adaptiveCard.innerHTML = `
            <button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
            <div class="adaptive-content">
                ${content}
            </div>
        `;
        adaptiveCard.classList.remove('hidden');
        container.classList.remove('centered-layout');

        // Language options logic
        const languageOptions = adaptiveCard.querySelectorAll('.language-option');
        if (languageOptions.length > 0) {
            let savedLang = localStorage.getItem('selectedLanguage');
            if (!savedLang) {
                savedLang = 'english';
                localStorage.setItem('selectedLanguage', 'english');
            }

            languageOptions.forEach(lo => {
                if (lo.getAttribute('data-lang') === savedLang) {
                    lo.classList.add('selected');
                } else {
                    lo.classList.remove('selected');
                }
            });

            languageOptions.forEach(langOpt => {
                langOpt.addEventListener('click', () => {
                    languageOptions.forEach(lo => lo.classList.remove('selected'));
                    langOpt.classList.add('selected');
                    const chosenLang = langOpt.getAttribute('data-lang');
                    console.log('Selected language:', chosenLang);
                    localStorage.setItem('selectedLanguage', chosenLang);
                });
            });
        }

        // Theme options logic
        const themeOptions = adaptiveCard.querySelectorAll('.theme-option');
        if (themeOptions.length > 0) {
            const st = localStorage.getItem('selectedTheme');
            if (st) {
                themeOptions.forEach(to => {
                    if (to.getAttribute('data-video') === st + '.mp4') {
                        to.classList.add('selected');
                    }
                });
            } else {
                // default to clouds if none selected
                themeOptions.forEach(to => {
                    if (to.getAttribute('data-video') === 'bg-clouds.mp4') {
                        to.classList.add('selected');
                    }
                });
            }

            themeOptions.forEach(thOpt => {
                thOpt.addEventListener('click', () => {
                    themeOptions.forEach(to => to.classList.remove('selected'));
                    thOpt.classList.add('selected');
                    const chosenVideo = thOpt.getAttribute('data-video');
                    console.log('Selected theme video:', chosenVideo);

                    // Update the background video source
                    bgVideo.src = bgBasePath + chosenVideo;
                    
                    // Extract theme name from the video filename
                    const selectedTheme = chosenVideo.replace('bg-', '').replace('.mp4', '');
                    console.log('Selected theme name:', selectedTheme);
                    
                    // Save the selected theme to localStorage
                    localStorage.setItem('selectedTheme', selectedTheme);
                    
                    // Dispatch a custom event to notify other scripts about the theme change
                    const event = new CustomEvent('themeChange', { detail: { theme: selectedTheme } });
                    document.dispatchEvent(event);
                });
            });
        }
    }

    // Hide the adaptive card
    function hideAdaptiveCard() {
        adaptiveCard.classList.add('hidden');
        container.classList.add('centered-layout');
    }

    // Define different sections of content (profile, players, etc.)
    function getCardContent(section) {
        if (section === 'profile') {
            if (!currentUser) {
                return `<div class="profile-card-content"><h2 class="card-title">Loading user...</h2></div>`;
            }
            return `
                <div class="profile-card-content">
                    <h2 class="card-title">Profile</h2>
                    <div class="profile-pic-container">
                       <img src="${currentUser.image_url || profilePicDefault}" alt="Profile Picture">
                    </div>
                    <div class="profile-info">
                        <h3 class="profile-name">${currentUser.first_name} ${currentUser.last_name}</h3>
                        <p class="profile-handle">@${currentUser.username}</p>
                    </div>
                    <button class="logout-btn" id="logout-btn">Logout</button>
                </div>
            `;
        } else if (section === 'players') {
            return '<h2 class="card-title">Players</h2><p style="text-align:center;">List of players...</p>';
        } else if (section === 'languages') {
            return `
                <div class="languages-card-content">
                    <h2 class="card-title">Languages</h2>
                    <div class="language-option" data-lang="english">
                        <img src="${langEnImg}" alt="English">
                        <p>English</p>
                    </div>
                    <div class="language-option" data-lang="french">
                        <img src="${langFrImg}" alt="French">
                        <p>Français</p>
                    </div>
                    <div class="language-option" data-lang="korean">
                        <img src="${langKrImg}" alt="Korean">
                        <p>한국인</p>
                    </div>
                </div>
            `;
        } else if (section === 'messages') {
            return '<h2 class="card-title">Messages</h2><p style="text-align:center;">Your messages...</p>';
        } else if (section === 'tournament') {
            return '<h2 class="card-title">Tournament</h2><p style="text-align:center;">Tournament info...</p>';
        } else if (section === 'themes') {
            return `
                <h2 class="card-title">Themes</h2>
                <div class="themes-grid">
                    <div class="theme-option" data-video="bg-clouds.mp4">
                        <img src="${themeCloudsImg}" alt="Clouds">
                        <span>Clouds</span>
                    </div>
                    <div class="theme-option" data-video="bg-cherry_blossoms.mp4">
                        <img src="${themeCherryImg}" alt="Cherry blossom">
                        <span>Cherry blossom</span>
                    </div>
                    <div class="theme-option" data-video="bg-thunderstorm.mp4">
                        <img src="${themeThunderImg}" alt="Thunderstorm">
                        <span>Thunderstorm</span>
                    </div>
                    <div class="theme-option" data-video="bg-forest.mp4">
                        <img src="${themeForestImg}" alt="Forest">
                        <span>Forest</span>
                    </div>
                    <div class="theme-option" data-video="bg-galaxy.mp4">
                        <img src="${themeGalaxyImg}" alt="Galaxy">
                        <span>Galaxy</span>
                    </div>
                    <div class="theme-option" data-video="bg-arena.mp4">
                        <img src="${themeArenaImg}" alt="Arena">
                        <span>Arena</span>
                    </div>
                </div>
            `;
        }
        return '';
    }

    // Show or hide sections of the UI
    function openSection(section) {
        navButtons.forEach(nb => nb.classList.remove('active'));
        const btnToActivate = Array.from(navButtons).find(b => b.classList.contains(section));
        if (btnToActivate) {
            btnToActivate.classList.add('active');
        }

        const content = getCardContent(section);
        if (content) {
            showAdaptiveCard(content);
            localStorage.setItem('activeNav', section);

            // Additional logic for themes, attach listeners, etc.
            if (section === 'themes') {
                const themesGrid = adaptiveCard.querySelector('.themes-grid');
                themesGrid.addEventListener('click', (e) => {
                    const themeOption = e.target.closest('.theme-option');
                    if (themeOption && themeOption.getAttribute('data-video')) {
                        const chosenVideo = themeOption.getAttribute('data-video');
                        bgVideo.src = bgBasePath + chosenVideo;
                        const selectedTheme = chosenVideo.replace('bg-', '').replace('.mp4', '');
                        localStorage.setItem('selectedTheme', selectedTheme);
                        
                        // Dispatch the 'themeChange' event
                        const event = new CustomEvent('themeChange', { detail: { theme: selectedTheme } });
                        document.dispatchEvent(event);
                    }
                });
            }

            // Attach logout logic after card is shown
            const logoutBtn = adaptiveCard.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    const logoutEvent = new CustomEvent('logoutRequest');
                    document.dispatchEvent(logoutEvent);
                });
            }
        } else {
            hideAdaptiveCard();
            localStorage.removeItem('activeNav');
        }
    }

    // Navbar section switching
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sections = ['profile','players','languages','messages','tournament','themes'];
            const activeNav = sections.find(c => btn.classList.contains(c)) || '';
            if (activeNav) {
                openSection(activeNav);
            } else {
                hideAdaptiveCard();
                localStorage.removeItem('activeNav');
            }
        });
    });

    // Close card if user hits the "close" button
    adaptiveCard.addEventListener('click', (e) => {
        if (e.target.closest('.close-btn')) {
            hideAdaptiveCard();
            navButtons.forEach(nb => nb.classList.remove('active'));
            localStorage.removeItem('activeNav');
        }
    });

    // Dispatch an event so pong.js can start a new game in the chosen mode
    function triggerGameUpdate(mode) {
        currentGameMode = mode;
        isInGame = true; // We are now in a game

        // Make sure the exit game button is truly enabled (class + HTML attr)
        exitGameBtn.classList.remove('disabled');
        exitGameBtn.disabled = false;

        // Fire a custom event that pong.js will listen for
        const event = new CustomEvent('updateGameState', {
            detail: { gameMode: mode }
        });
        document.dispatchEvent(event);
    }
    
    // Listen for click on game mode options
    const gameModeOptions = document.querySelectorAll('.game-mode-option');
    gameModeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const mode = opt.getAttribute('data-mode');
            console.log('Game mode selected:', mode);
            triggerGameUpdate(mode);
        });
    });
    
    // Restore active navigation if any
    const savedActiveNav = localStorage.getItem('activeNav');
    if (savedActiveNav) {
        openSection(savedActiveNav);
    }

    // Initialize theme on page load
    if (themeName) {
        const initialTheme = themeName;
        console.log('Initial theme on load:', initialTheme);
        const event = new CustomEvent('themeChange', { detail: { theme: initialTheme } });
        document.dispatchEvent(event);
    }

    // Re-enable transitions after a short delay to avoid flickering
    setTimeout(() => {
        document.documentElement.classList.remove('no-transitions');
        document.documentElement.classList.add('transitions-enabled');
    }, 50);

    // >>> EXIT GAME BUTTON CLICK <<<
    exitGameBtn.addEventListener('click', () => {
        // If no game in progress, ignore
        if (!isInGame) return;

        // Decide a winner (the "other side")
        let winner = 'Right Player';
        if (currentGameMode === 'ai') {
            winner = 'Right Player'; // AI
        } else if (currentGameMode === 'local') {
            winner = 'Right Player'; // or maybe P2
        } else if (currentGameMode === 'remote') {
            winner = 'Right Player'; // or logic for local vs remote
        }

        // Dispatch the exitGame event so pong.js can show the victory screen
        const exitEvent = new CustomEvent('exitGame', {
            detail: { winner, gameMode: currentGameMode }
        });
        document.dispatchEvent(exitEvent);

        // Mark that the game is now over
        isInGame = false;

        // Fully disable the exit button (CSS + HTML attribute)
        exitGameBtn.classList.add('disabled');
        exitGameBtn.disabled = true;
    });
});