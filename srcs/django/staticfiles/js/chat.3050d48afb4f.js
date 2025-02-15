/* filemame: chat.js */

function initializeChat() {
	const chatForm = document.getElementById("chat-form");
	const chatInput = document.getElementById("chat-input");
	const chatMessages = document.getElementById("chat-messages");
	const chatSection = document.getElementById("chat-section");
	const closeBtn = document.querySelector(".close-chat-btn");
	const chatBtn = document.getElementById("chat-btn");

	if (!chatForm || !chatInput || !chatMessages || !closeBtn || !chatBtn) {
		console.error("Missing chat elements!");
		return;
	}

	// WebSocket configuration
	const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
	const url = `${protocol}${window.location.host}/ws/chat/`;
	const chatSocket = new WebSocket(url);

	// Handle message sending
	chatForm.addEventListener("submit", function (e) {
		e.preventDefault();
		const message = chatInput.value.trim();

		if (message) {
			chatSocket.send(
				JSON.stringify({ message: message, sender: "me" }) //
			);
			chatInput.value = "";
			scrollToBottom();
		}
	});

	// Handle receiving messages
	chatSocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		if (data.sender === "me") {
			chatMessages.insertAdjacentHTML(
				"beforeend",
				`<p class="sent">${data.message}</p>`
			);
		} else {
			chatMessages.insertAdjacentHTML(
				"beforeend",
				`<p class="received">${data.message}</p>`
			);
		}
		scrollToBottom();
	};

	// Handle WebSocket errors
	chatSocket.onerror = function (e) {
		console.error("WebSocket error found :", e);
	};

	chatSocket.onclose = function () {
		console.warn("WebSocket closed !");
	};

	// Close WebSocket when page is closed
	window.addEventListener("beforeunload", () => {
		if (chatSocket.readyState === WebSocket.OPEN) {
			chatSocket.close();
		}
	});

	// Close the chat when user clicks on the cross
	closeBtn.addEventListener("click", function () {
		chatSection.classList.add("hidden");
	});
	chatBtn.addEventListener("click", function () {
		chatSection.classList.remove("hidden");
	});

	function scrollToBottom() {
		setTimeout(() => {
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}, 0);
	}
}

window.initializeChat = initializeChat;
