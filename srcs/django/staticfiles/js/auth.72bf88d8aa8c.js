document.addEventListener("DOMContentLoaded", function () {
    // Authentication handling
    async function checkAuth() {
        try {
            const response = await fetch('/api/user/profile/', {
                method: 'GET',
                credentials: 'include',
            });
    
            const contentType = response.headers.get('content-type');
    
            if (response.ok && contentType.includes('application/json')) {
                const user = await response.json();
                document.dispatchEvent(new CustomEvent('userLoaded', { detail: user }));
            } else if (response.status === 401) {
                console.warn('User not authenticated.');
                displayUnauthenticatedUser();
            } else {
                console.error('Unexpected response:', await response.text());
                displayUnauthenticatedUser();
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            displayUnauthenticatedUser();
        }
    }

    function logout() {
        fetch('/api/logout/', {
            method: 'POST',
            credentials: 'include',
        })
            .then(response => {
                if (response.ok) {
                    // Dispatch userLoggedOut event
                    document.dispatchEvent(new CustomEvent('userLoggedOut'));
                } else {
                    console.error('Logout failed:', response.statusText);
                }
            })
            .catch(err => console.error('Logout failed:', err));
    }

    function displayUnauthenticatedUser() {
        const authBtns = document.getElementById('auth-btns');
        if (authBtns) {
            authBtns.innerHTML = `
                <button type="button" onclick="window.location.href='/auth/login';">Log in with 42</button>
            `;
        }
        // Show welcome-section and hide main-content
        const welcomeSection = document.getElementById('welcome-section');
        const mainContent = document.getElementById('main-content');
        if (welcomeSection && mainContent) {
            welcomeSection.classList.remove('hidden');
            mainContent.classList.add('hidden');
        }
    }

    document.addEventListener('logoutRequest', logout);

    checkAuth();

    // Chat interactions handling
    /*const chatBtn = document.getElementById("chat-btn");
    const chatSection = document.getElementById("chat-section");

    if (!chatBtn || !chatSection) {
        console.error("One or more required elements are missing from the DOM!");
        return;
    }

    chatBtn.addEventListener("click", function () {
        chatSection.style.display = "block"; // Display chat sections
        chatBtn.style.display = "none"; // Hide button
        initializeChat(); // Calling chat initialization function (defined in chat.js)
    });*/
});