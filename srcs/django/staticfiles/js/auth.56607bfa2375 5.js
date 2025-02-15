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
					location.reload(); // Reload page to update UI
				} else {
					console.error('Logout failed:', response.statusText);
				}
			})
			.catch(err => console.error('Logout failed:', err));
	}

	function displayUnauthenticatedUser() {
		const authBtns = document.getElementById('auth-btns');
		if (authBtns) {
			authBtns.innerHTML = '<button type="button" onclick="window.location.href=\'/auth/login\';">Log in</button>';
		}
	}

	document.addEventListener('logoutRequest', logout);

	checkAuth();

	// Chat interactions handling
	/*const chatBtn = document.getElementById("chat-btn");
	const chatSection = document.getElementById("chat-section");

	if (!chatBtn || !chatSection) {
		console.error("Un ou plusieurs éléments nécessaires sont absents dans le DOM !");
		return;
	}

	chatBtn.addEventListener("click", function () {
		chatSection.style.display = "block"; // Display chat sections
		chatBtn.style.display = "none"; // Hide button
		initializeChat(); // Calling chat initialization function (defined in chat.js)
	});*/
});
