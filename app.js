// 1. Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMXujAS58N41rA3opjDLHuM9iD6AEnD6M",
    authDomain: "esportstracker-59fd0.firebaseapp.com",
    projectId: "esportstracker-59fd0",
    storageBucket: "esportstracker-59fd0.firebasestorage.app",
    messagingSenderId: "284171623713",
    appId: "1:284171623713:web:702d97febab96231dd3260"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// LANDING PAGE LOGIC
// ==========================================
let landingFormText = document.getElementById('gameNameInput');
let landingFormSubmit = document.getElementById('gameNameSubmit'); 
let gameList = document.getElementById('gameList');

if (gameList) {
    const displayGames = async () => {
        try {
            const gamesCollectionRef = collection(db, "games");
            const querySnapshot = await getDocs(gamesCollectionRef);
            
            gameList.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const gameData = doc.data();
                const gameId = doc.id;

                const gameLink = document.createElement('a');
                gameLink.href = "game.html";
                gameLink.className = "game-link";
                gameLink.textContent = gameData.gameName;

                gameLink.onclick = function() {
                    localStorage.setItem('currentGameId', gameId);
                    localStorage.setItem('currentGameName', gameData.gameName);
                    localStorage.setItem('currentGameFullData', JSON.stringify(gameData));
                };

                gameList.appendChild(gameLink);
            });

            if (querySnapshot.empty) {
                gameList.innerHTML = "<p>No games added yet!</p>";
            }
        } catch (error) {
            console.error("Error fetching games from Firestore: ", error);
            gameList.innerHTML = "<p>Error loading games.</p>";
        }
    };

    // Run the display configuration on setup
    displayGames();

    // FIXED: Form submission is now outside displayGames but properly nested within the gameList view gate
    if (landingFormSubmit) {
        landingFormSubmit.onclick = async function () {
            const gameName = landingFormText.value.trim();

            if (gameName === "") {
                alert("Please enter a game name!");
                return;
            }

            const gameId = gameName.toLowerCase().replace(/\s+/g, '-');

            try {
                await setDoc(doc(db, "games", gameId), {
                    gameName: gameName,
                    createdAt: new Date()
                });

                console.log(`Game "${gameName}" successfully added to Firestore!`);
                landingFormText.value = ""; 
                displayGames(); // Refresh list automatically
                
            } catch (error) {
                console.error("Error adding game to Firestore: ", error);
            }
        };
    }
}

// ==========================================
// GAME PAGE LOGIC
// ==========================================
let teamFormText = document.getElementById('teamNameInput');
let teamFormSubmit = document.getElementById('teamNameSubmit'); 
let teamList = document.getElementById('teamList');

const currentGameId = localStorage.getItem('currentGameId');
const currentGameName = localStorage.getItem('currentGameName');

if (teamList) {
    if (!currentGameId) {
        teamList.innerHTML = "<p>No game selected. <a href='index.html'>Go back to select a game.</a></p>";
    } else {
        console.log(`Viewing teams for game: ${currentGameName} (${currentGameId})`);
        
        const displayTeams = async () => {
            try {
                const teamsCollectionRef = collection(db, "games", currentGameId, "teams");
                const querySnapshot = await getDocs(teamsCollectionRef);
                
                teamList.innerHTML = ""; 

                querySnapshot.forEach((doc) => {
                    const teamData = doc.data();
                    const teamId = doc.id;

                    const teamLink = document.createElement('a');
                    teamLink.href = "team.html";
                    teamLink.className = "team-link"; 
                    teamLink.textContent = teamData.teamName;

                    teamLink.onclick = function() {
                        localStorage.setItem('currentTeamId', teamId);
                        localStorage.setItem('currentTeamName', teamData.teamName);
                    };

                    teamList.appendChild(teamLink);
                });

                if (querySnapshot.empty) {
                    teamList.innerHTML = "<p>No teams added to this game yet!</p>";
                }
            } catch (error) {
                console.error("Error fetching teams from Firestore: ", error);
                teamList.innerHTML = "<p>Error loading teams.</p>";
            }
        };

        displayTeams();

        teamFormSubmit.onclick = async function () {
            const teamName = teamFormText.value.trim();

            if (teamName === "") {
                alert("Please enter a team name!");
                return;
            }

            const teamId = teamName.toLowerCase().replace(/\s+/g, '-');

            try {
                await setDoc(doc(db, "games", currentGameId, "teams", teamId), {
                    teamName: teamName,
                    createdAt: new Date()
                });

                console.log(`Team "${teamName}" successfully added to ${currentGameName}!`);
                teamFormText.value = ""; 
                displayTeams();

            } catch (error) {
                console.error("Error adding team to Firestore: ", error);
                alert("Failed to add team.");
            }
        };
    }
}

// ==========================================
// TEAM PAGE LOGIC (With Edit Support)
// ==========================================
let playerList = document.getElementById('playerList');
let openForm = document.getElementById('openForm'); 
let openFormButton = document.getElementById('playerFormOpen');

let charRow = document.getElementById("charRow");
let charRowButton = document.getElementById("addCharacterRow");
let playerSubmitButton = document.getElementById("playerSubmit");

const currentTeamId = localStorage.getItem('currentTeamId');

// Track if we are editing an existing player (null means we are creating a new player)
let editingPlayerId = null;

// Helper function to dynamically add a character row and populate it if data exists
const createCharacterRow = (charName = "", charCount = 0) => {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = "character-input-group";
    rowWrapper.style.marginBottom = "8px";

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Character Name';
    nameInput.className = 'char-name-field';
    nameInput.value = charName;

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.placeholder = 'Times Played';
    countInput.min = '0';
    countInput.className = 'char-count-field';
    countInput.value = charCount;
    countInput.style.marginLeft = "8px";

    rowWrapper.appendChild(nameInput);
    rowWrapper.appendChild(countInput);
    charRow.appendChild(rowWrapper);
};

if (playerList) {
    // 1. Fetch & Display Players
    const displayPlayers = async () => {
        if (!currentGameId || !currentTeamId) return;
        try {
            const playersRef = collection(db, "games", currentGameId, "teams", currentTeamId, "players");
            const querySnapshot = await getDocs(playersRef);
            playerList.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const playerData = doc.data();
                const p = document.createElement('p');
                p.className = "editable-player-item";
                p.style.cursor = "pointer"; // Visual cue that it's clickable
                p.title = "Click to edit player details";
                
                const charsUsed = Object.entries(playerData.characters || {})
                    .map(([char, count]) => `${char} (${count}x)`)
                    .join(", ");

                p.innerHTML = `<strong>${playerData.name}</strong> - Role: ${playerData.role} ${charsUsed ? `[Plays: ${charsUsed}]` : ''}`;
                
                // CLICK EVENT TO POPULATE FORM FOR EDITING
                p.onclick = function() {
                    // Set our global editing tracking state to this document's ID
                    editingPlayerId = doc.id;
                    
                    // Populate the main fields
                    document.getElementById('playerName').value = playerData.name;
                    document.getElementById('playerRole').value = playerData.role;
                    
                    // Clear out old dynamic character rows, then rebuild them from player data
                    charRow.innerHTML = "";
                    if (playerData.characters) {
                        Object.entries(playerData.characters).forEach(([name, count]) => {
                            createCharacterRow(name, count);
                        });
                    }
                    
                    // Open the form and change submit button text to reflect editing status
                    openForm.style.display = 'block';
                    playerSubmitButton.textContent = "Update Player";
                };

                playerList.appendChild(p);
            });

            if (querySnapshot.empty) {
                playerList.innerHTML = "<p>No players added to this team yet.</p>";
            }
        } catch (error) {
            console.error("Error loading players: ", error);
        }
    };

    displayPlayers();

    // 2. Toggle Form Visibility
    if (openFormButton) {
        openFormButton.onclick = function(){
            if (openForm.style.display === 'block') {
                openForm.style.display = 'none';
            } else {
                // If opening blank, clear editing status and reset button text
                editingPlayerId = null;
                playerSubmitButton.textContent = "Submit Player";
                openForm.style.display = 'block';
            }
        };
    }

    // 3. Generate Dynamic Character Inputs Safely
    if (charRowButton) {
        charRowButton.onclick = function() {
            createCharacterRow("", 0); // Create an empty row
        };
    }

    // 4. Submit or Update Everything to Firebase
    if (playerSubmitButton) {
        playerSubmitButton.onclick = async function () {
            const nameField = document.getElementById('playerName');
            const roleField = document.getElementById('playerRole');

            if (!nameField || !roleField) return;

            const playerName = nameField.value.trim();
            const playerRole = roleField.value.trim();

            if (playerName === "" || playerRole === "") {
                alert("Please provide a Player Name and Role!");
                return;
            }

            const charactersDataMap = {};
            const inputGroups = charRow.querySelectorAll('.character-input-group');

            inputGroups.forEach(group => {
                const charName = group.querySelector('.char-name-field').value.trim();
                const charCount = parseInt(group.querySelector('.char-count-field').value, 10);

                if (charName !== "") {
                    charactersDataMap[charName] = isNaN(charCount) ? 0 : charCount;
                }
            });

            // ID DETERMINATION STRATEGY:
            // If editingPlayerId exists, we overwrite that specific document.
            // If it's null, we generate a fresh clean slug from their name string.
            const playerId = editingPlayerId ? editingPlayerId : playerName.toLowerCase().replace(/\s+/g, '-');

            try {
                await setDoc(doc(db, "games", currentGameId, "teams", currentTeamId, "players", playerId), {
                    name: playerName,
                    role: playerRole,
                    characters: charactersDataMap
                });

                console.log(`Player successfully saved to Firestore!`);
                
                // Reset state variables completely back to pristine layout values
                nameField.value = "";
                roleField.value = "";
                charRow.innerHTML = ""; 
                openForm.style.display = 'none'; 
                editingPlayerId = null;
                playerSubmitButton.textContent = "Submit Player";
                
                displayPlayers(); // Refresh list interface target
                
            } catch (error) {
                console.error("Error submitting player to Firestore: ", error);
                alert("Submission failed. Check console for details.");
            }
        };
    }
}