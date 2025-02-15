/* filename: profile.js */

function getProfileCardContent() {
    // The exact same logic you previously had in base.js for "profile"
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
}
