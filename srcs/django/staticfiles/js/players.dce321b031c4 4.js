async function fetchActivePlayers() {
	try {
		const response = await fetch('/api/active-players/', {
			method: 'GET',
			credentials: 'include',
		});

		if (response.ok) {
			const players = await response.json();
			displayActivePlayers(players);
		} else {
			console.error('Failed to fetch active players:', response.statusText);
		}
	} catch (error) {
		console.error('Error fetching active players:', error);
	}
}

function displayActivePlayers(players) {
	const playersList = document.getElementById('active-players-list');
	playersList.innerHTML = '';

	if (players.length === 0) {
		playersList.innerHTML = '<p>No players available yet !</p>';
	} else {
		players.forEach(player => {
			const playerItem = document.createElement('li');
			playerItem.textContent = `${player.first_name} ${player.last_name}<img src="${player.image_url}" alt="Profile Picture" style="width: 100px; height: 140px; border-radius: 50%; margin-right: 10px;">`;
			playersList.appendChild(playerItem);
		});
	}
}
