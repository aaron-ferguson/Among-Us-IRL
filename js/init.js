// Initialize on load
window.onload = async () => {
initializeRoomsAndTasks();
updateMeetingRoomDropdown();
setupUniqueRadioListeners();

// Check if joining existing game via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room');

if (roomCode && supabaseClient) {
// Hide menu, try to join existing game
document.getElementById('main-menu').classList.add('hidden');
document.getElementById('setup-phase').classList.add('hidden');

const gameData = await joinGameFromDB(roomCode);

if (gameData) {
// Successfully joined game
document.getElementById('room-code').textContent = roomCode;

// Update displays
document.getElementById('min-players-display').textContent = gameState.settings.minPlayers;
document.getElementById('max-players-display').textContent = gameState.settings.maxPlayers;
document.getElementById('imposter-count-display').textContent = gameState.settings.imposterCount;

// Show appropriate stage
if (gameState.stage === 'waiting') {
document.getElementById('waiting-room').classList.remove('hidden');
generateQRCode();
updateJoinSection();
updateLobby();
} else if (gameState.stage === 'playing') {
document.getElementById('game-phase').classList.remove('hidden');
// Don't call displayGameplay() yet - player needs to join first
}
} else {
alert(`Game with room code "${roomCode}" not found.`);
// Show menu since game wasn't found
document.getElementById('main-menu').classList.remove('hidden');
}
} else {
// No room code in URL - show main menu
document.getElementById('setup-phase').classList.add('hidden');
document.getElementById('main-menu').classList.remove('hidden');
}
};
