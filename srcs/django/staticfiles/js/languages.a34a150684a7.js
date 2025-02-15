/* filename: languages.js */

/**
 * Returns the HTML for the "languages" adaptive card content.
 * (Originally inline in base.js)
 */
function getLanguagesCardContent() {
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
        </div>
    `;
}

/**
 * Called right after the "languages" adaptive card is shown in base.js
 * Sets up highlighting the saved language and wiring click events to change it.
 */
function handleLanguageSelection() {
    const adaptiveCard = document.querySelector('.adaptive-card');
    if (!adaptiveCard) return;

    const languageOptions = adaptiveCard.querySelectorAll('.language-option');
    if (languageOptions.length > 0) {
        let savedLang = localStorage.getItem('selectedLanguage');
        if (!savedLang) {
            savedLang = 'english';
            localStorage.setItem('selectedLanguage', 'english');
        }

        // Mark the saved language as selected
        languageOptions.forEach(lo => {
            if (lo.getAttribute('data-lang') === savedLang) {
                lo.classList.add('selected');
            } else {
                lo.classList.remove('selected');
            }
        });

        // On click, store the chosen language in localStorage and highlight
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
}
