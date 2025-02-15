/* filemame: themes.js */

/**
 *  THEMES.JS
 *  
 *  Contains all logic related to:
 *   - loading the saved theme
 *   - switching themes (bgVideo.src)
 *   - providing the HTML for the themes adaptive card
 *   - hooking up theme selection events
 */

function getThemesCardContent() {
    return `
        <h2 class="card-title">Themes</h2>
        <div class="themes-grid">
            <div class="theme-option" data-video="bg-clouds.mp4">
                <img src="${themeCloudsImg}" alt="Clouds">
                <span>Clouds</span>
            </div>
            <div class="theme-option" data-video="bg-sunset.mp4">
                <img src="${themeSunsetImg}" alt="Sunset">
                <span>Sunset</span>
            </div>
            <div class="theme-option" data-video="bg-cherry_blossoms.mp4">
                <img src="${themeCherryImg}" alt="Cherry blossom">
                <span>Cherry blossom</span>
            </div>
            <div class="theme-option" data-video="bg-nature.mp4">
                <img src="${themeNatureImg}" alt="Nature">
                <span>Nature</span>
            </div>
            <div class="theme-option" data-video="bg-galaxy.mp4">
                <img src="${themeGalaxyImg}" alt="Galaxy">
                <span>Galaxy</span>
            </div>
            <div class="theme-option" data-video="bg-fire.mp4">
                <img src="${themeFireImg}" alt="Fire">
                <span>Fire</span>
            </div>
        </div>
    `;
}

/**
 * Called right after the adaptive card for "themes" is shown in base.js
 */
function handleThemeSelection() {
    const adaptiveCard = document.querySelector('.adaptive-card');
    if (!adaptiveCard) return;

    const bgVideo = document.querySelector('.bg-video');
    const themeOptions = adaptiveCard.querySelectorAll('.theme-option');
    if (!themeOptions || !bgVideo) return;

    // Mark the currently-selected theme as 'selected'
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        themeOptions.forEach(to => {
            const dataVideo = to.getAttribute('data-video');
            if (dataVideo === `bg-${savedTheme}.mp4`) {
                to.classList.add('selected');
            }
        });
    } else {
        // If no saved theme, default is "clouds"
        themeOptions.forEach(to => {
            const dataVideo = to.getAttribute('data-video');
            if (dataVideo === 'bg-clouds.mp4') {
                to.classList.add('selected');
            }
        });
    }

    // Add click handlers
    themeOptions.forEach(thOpt => {
        thOpt.addEventListener('click', () => {
            themeOptions.forEach(to => to.classList.remove('selected'));
            thOpt.classList.add('selected');

            const chosenVideo = thOpt.getAttribute('data-video');
            console.log('Selected theme video:', chosenVideo);

            // Update the background video
            bgVideo.src = bgBasePath + chosenVideo;

            // Save the theme name in localStorage
            const selectedTheme = chosenVideo.replace('bg-', '').replace('.mp4', '');
            localStorage.setItem('selectedTheme', selectedTheme);

            // Dispatch an event so pong.js knows the new theme
            const event = new CustomEvent('themeChange', { detail: { theme: selectedTheme } });
            document.dispatchEvent(event);
        });
    });
}

// On page load, make sure the background is set to the last chosen theme
document.addEventListener('DOMContentLoaded', () => {
    const bgVideo = document.querySelector('.bg-video');
    const savedTheme = localStorage.getItem('selectedTheme');
    if (bgVideo) {
        if (savedTheme) {
            bgVideo.src = bgBasePath + savedTheme + '.mp4';
        } else {
            bgVideo.src = defaultBg; // e.g. "bg-clouds.mp4"
        }

        // Also dispatch a "themeChange" so pong's "currentTheme" matches on first load
        const initialTheme = savedTheme || 'clouds';
        console.log('Initial theme on load:', initialTheme);
        const event = new CustomEvent('themeChange', { detail: { theme: initialTheme } });
        document.dispatchEvent(event);
    }
});
