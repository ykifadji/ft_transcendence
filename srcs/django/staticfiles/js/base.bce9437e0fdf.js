/* filename: base.js */

document.addEventListener("DOMContentLoaded", function () {
    // We keep your original checkAuth usage in auth.js, so nothing special here
});

function scaleLayout() {
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const container = document.querySelector('.base-container');
    const windowWidth = document.querySelector('.scaling-wrapper').clientWidth;
    const windowHeight = document.querySelector('.scaling-wrapper').clientHeight;
    
    const scale = Math.min(windowWidth / baseWidth, windowHeight / baseHeight);
    container.style.transform = `scale(${scale})`;
}

let currentUser = null; // Keep the user object for profile logic

document.addEventListener('userLoaded', (event) => {
    currentUser = event.detail;
    if (currentUser && currentUser.image_url) {
        const playerPicContainer = document.querySelector('.player-pic-container');
        const profileImage = document.createElement('img');
        profileImage.src = currentUser.image_url;
        profileImage.alt = 'Profile picture';
        playerPicContainer.appendChild(profileImage);
    }

    const welcomeSection = document.getElementById('welcome-section');
    const mainContent = document.getElementById('main-content');
    if (welcomeSection && mainContent) {
        welcomeSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
});

document.addEventListener('userLoggedOut', () => {
    const playerPicContainers = document.querySelectorAll('.player-pic-container img');
    playerPicContainers.forEach(img => img.remove());

    const welcomeSection = document.getElementById('welcome-section');
    const mainContent = document.getElementById('main-content');
    if (welcomeSection && mainContent) {
        welcomeSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    scaleLayout();
    window.addEventListener('resize', scaleLayout);

    const adaptiveCard = document.querySelector('.adaptive-card');
    const navButtons = document.querySelectorAll('.nav-btn');
    const container = document.querySelector('.base-container');

    // The rest is for the adaptive card / nav logic
    function showAdaptiveCard(content) {
        adaptiveCard.innerHTML = `
            <button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
            <div class="adaptive-content">
                ${content}
            </div>
        `;
        adaptiveCard.classList.remove('hidden');
        container.classList.remove('centered-layout');
    }

    function hideAdaptiveCard() {
        adaptiveCard.classList.add('hidden');
        container.classList.add('centered-layout');
    }
    window.hideAdaptiveCard = hideAdaptiveCard;

    function getCardContent(section) {
        if (section === 'profile') {
            return getProfileCardContent(); // from profile.js
        } else if (section === 'players') {
            return '<h2 class="card-title">Players</h2><p style="text-align:center;">List of players...</p>';
        } else if (section === 'languages') {
            return getLanguagesCardContent(); // from languages.js
        } else if (section === 'messages') {
            return '<h2 class="card-title">Messages</h2><p style="text-align:center;">Your messages...</p>';
        } else if (section === 'tournament') {
            return renderTournamentCard();   // from tournament.js
        } else if (section === 'themes') {
            return getThemesCardContent();   // from themes.js
        }
        return '';
    }

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

            // If themes, call handleThemeSelection (themes.js)
            if (section === 'themes') {
                handleThemeSelection();
            }
            // If languages, call handleLanguageSelection (languages.js)
            else if (section === 'languages') {
                handleLanguageSelection();
            }

            // Logout button in profile card
            const logoutBtn = adaptiveCard.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    const logoutEvent = new CustomEvent('logoutRequest');
                    document.dispatchEvent(logoutEvent);
                });
            }

            // If tournament, attachTournamentListeners (tournament.js)
            if (section === 'tournament') {
                attachTournamentListeners();
            }
        } else {
            hideAdaptiveCard();
            localStorage.removeItem('activeNav');
        }
    }

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

    adaptiveCard.addEventListener('click', (e) => {
        if (e.target.closest('.close-btn')) {
            hideAdaptiveCard();
            navButtons.forEach(nb => nb.classList.remove('active'));
            localStorage.removeItem('activeNav');
        }
    });

    // Restore last active nav
    const savedActiveNav = localStorage.getItem('activeNav');
    if (savedActiveNav) {
        openSection(savedActiveNav);
    }

    // Delay enabling CSS transitions
    setTimeout(() => {
        document.documentElement.classList.remove('no-transitions');
        document.documentElement.classList.add('transitions-enabled');
    }, 50);
});
