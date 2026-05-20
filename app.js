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
// TEAM PAGE LOGIC (Multi-Form Repeater / Bulk Edit)
// ==========================================
let playerList = document.getElementById('playerList');
let formContainer = document.getElementById('playerFormContainer'); // Your form container div
let addPlayerFormButton = document.getElementById('playerFormOpen'); // The "Add Player" button
let playerSubmitButton = document.getElementById('playerSubmit');

const currentTeamId = localStorage.getItem('currentTeamId');


/**
 * Generates a complete standalone Player Form Block dynamically.
 * Can take an existing player object for editing/bulk updates, or remain empty.
 */
const createPlayerFormCard = (playerData = null, docId = null) => {
    if (!formContainer) return;

    // Outer wrapper for this specific player card
    const cardWrapper = document.createElement('div');
    cardWrapper.className = "player-form-card";
    cardWrapper.style.border = "1px solid #ccc";
    cardWrapper.style.padding = "15px";
    cardWrapper.style.marginBottom = "15px";
    cardWrapper.style.borderRadius = "6px";
    
    // Store the database ID inside a data-attribute if it exists (crucial for updates!)
    if (docId) {
        cardWrapper.setAttribute('data-player-id', docId);
    }

    // Header / Delete Button block
    const cardHeader = document.createElement('div');
    cardHeader.style.display = "flex";
    cardHeader.style.justifyContent = "space-between";
    cardHeader.innerHTML = `<h3>${docId ? 'Edit Player' : 'New Player'}</h3>`;
    
    const removeCardBtn = document.createElement('button');
    removeCardBtn.type = "button";
    removeCardBtn.textContent = "Remove Form";
    removeCardBtn.onclick = () => cardWrapper.remove();
    cardHeader.appendChild(removeCardBtn);
    cardWrapper.appendChild(cardHeader);

    // Player Identity Fields (Name & Role)
    const identityGroup = document.createElement('div');
    identityGroup.style.marginBottom = "10px";

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Player Name';
    nameInput.className = 'player-name-field';
    nameInput.value = playerData ? playerData.name : "";
    nameInput.style.marginRight = "8px";

    const roleInput = document.createElement('input');
    roleInput.type = 'text';
    roleInput.placeholder = 'Role';
    roleInput.className = 'player-role-field';
    roleInput.value = playerData ? playerData.role : "";

    identityGroup.appendChild(nameInput);
    identityGroup.appendChild(roleInput);
    cardWrapper.appendChild(identityGroup);

    // Characters Subcollection Dynamic Section
    const charSectionWrapper = document.createElement('div');
    charSectionWrapper.className = "char-section-wrapper";
    
    const charRowContainer = document.createElement('div');
    charRowContainer.className = "char-rows-container";
    
    const addCharRowBtn = document.createElement('button');
    addCharRowBtn.type = "button";
    addCharRowBtn.textContent = "+ Add Character Data";
    addCharRowBtn.style.marginBottom = "10px";

    // Inner helper function to safely append isolated nested rows 
    const appendCharacterRow = (charName = "", charCount = 0) => {
        const rowWrapper = document.createElement('div');
        rowWrapper.className = "character-input-group";
        rowWrapper.style.marginBottom = "6px";

        const cName = document.createElement('input');
        cName.type = 'text';
        cName.placeholder = 'Character Name';
        cName.className = 'char-name-field';
        cName.value = charName;

        const cCount = document.createElement('input');
        cCount.type = 'number';
        cCount.placeholder = 'Times Played';
        cCount.min = '0';
        cCount.className = 'char-count-field';
        cCount.value = charCount;
        cCount.style.marginLeft = "8px";

        rowWrapper.appendChild(cName);
        rowWrapper.appendChild(cCount);
        charRowContainer.appendChild(rowWrapper);
    };

    addCharRowBtn.onclick = () => appendCharacterRow("", 0);

    // If parsing existing records, auto-populate all recorded traits
    if (playerData && playerData.characters) {
        Object.entries(playerData.characters).forEach(([name, count]) => {
            appendCharacterRow(name, count);
        });
    }

    charSectionWrapper.appendChild(addCharRowBtn);
    charSectionWrapper.appendChild(charRowContainer);
    cardWrapper.appendChild(charSectionWrapper);

    // Stick it down into our primary DOM tracking panel
    formContainer.appendChild(cardWrapper);
};

if (playerList) {
    // Keep an inventory array cache handy to allow transforming the whole list at once
    let loadedPlayersCache = [];

    // 1. Fetch and Display the Player Roster
    const displayPlayers = async () => {
        if (!currentGameId || !currentTeamId) return;
        try {
            const playersRef = collection(db, "games", currentGameId, "teams", currentTeamId, "players");
            const querySnapshot = await getDocs(playersRef);
            
            playerList.innerHTML = "";
            loadedPlayersCache = []; // Reset local cache array

            querySnapshot.forEach((doc) => {
                const playerData = doc.data();
                
                // Keep record in memory for easy structural bulk loading later
                loadedPlayersCache.push({ id: doc.id, data: playerData });

                const p = document.createElement('p');
                p.className = "editable-player-item";
                p.style.cursor = "pointer";
                p.style.padding = "6px";
                p.style.borderBottom = "1px dashed #eee";
                p.title = "Click any player to flip the ENTIRE team into bulk edit mode!";
                
                const charsUsed = Object.entries(playerData.characters || {})
                    .map(([char, count]) => `${char} (${count}x)`)
                    .join(", ");

                p.innerHTML = `<strong>${playerData.name}</strong> - Role: ${playerData.role} ${charsUsed ? `[Plays: ${charsUsed}]` : ''}`;
                
                // CLICK EVENT: Populates forms for the ENTIRE team at once
                p.onclick = function() {
                    formContainer.innerHTML = ""; // Wipe current working forms clean
                    
                    // Generate editing form cards for every player saved in our cache
                    loadedPlayersCache.forEach(playerRecord => {
                        createPlayerFormCard(playerRecord.data, playerRecord.id);
                    });

                    playerSubmitButton.textContent = "Update All Players";
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

    // 2. Add New Blank Player Form (Appends smoothly without clearing current inputs)
    if (addPlayerFormButton) {
        addPlayerFormButton.onclick = function() {
            createPlayerFormCard(); // Creates a completely fresh form block
            playerSubmitButton.textContent = "Save All Changes";
        };
    }

    // 3. Process, Clean, & Save Every Card Inside the Container to Firestore
    if (playerSubmitButton) {
        playerSubmitButton.onclick = async function () {
            const formCards = formContainer.querySelectorAll('.player-form-card');

            if (formCards.length === 0) {
                alert("There are no active player forms to process.");
                return;
            }

            let successfulSaves = 0;

            // Loop through every form card in the container
            for (const card of formCards) {
                const nameField = card.querySelector('.player-name-field');
                const roleField = card.querySelector('.player-role-field');
                
                const playerName = nameField.value.trim();
                const playerRole = roleField.value.trim();

                // Validation check for identity fields
                if (playerName === "" || playerRole === "") {
                    continue; // Skip unfinished cards or alert your user accordingly
                }

                // Map character stats specific to this form block context
                const charactersDataMap = {};
                const inputGroups = card.querySelectorAll('.character-input-group');

                inputGroups.forEach(group => {
                    const charName = group.querySelector('.char-name-field').value.trim();
                    const charCount = parseInt(group.querySelector('.char-count-field').value, 10);

                    if (charName !== "") {
                        charactersDataMap[charName] = isNaN(charCount) ? 0 : charCount;
                    }
                });

                // Check if this card was generated from an existing player (has data attribute)
                const existingId = card.getAttribute('data-player-id');
                const playerId = existingId ? existingId : playerName.toLowerCase().replace(/\s+/g, '-');

                try {
                    await setDoc(doc(db, "games", currentGameId, "teams", currentTeamId, "players", playerId), {
                        name: playerName,
                        role: playerRole,
                        characters: charactersDataMap
                    });
                    successfulSaves++;
                } catch (error) {
                    console.error(`Error saving record for ${playerName}: `, error);
                }
            }

            console.log(`Successfully batched and saved ${successfulSaves} player files.`);
            
            // Clean up the playground workspace
            formContainer.innerHTML = "";
            playerSubmitButton.textContent = "Save All Changes";
            
            // Refresh structural listing array view targets
            displayPlayers();
        };
    }
}