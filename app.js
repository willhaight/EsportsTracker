// 1. Imports (Make sure collection and getDocs are included inside the curly braces!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// 2. Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMXujAS58N41rA3opjDLHuM9iD6AEnD6M",
    authDomain: "esportstracker-59fd0.firebaseapp.com",
    projectId: "esportstracker-59fd0",
    storageBucket: "esportstracker-59fd0.firebasestorage.app",
    messagingSenderId: "284171623713",
    appId: "1:284171623713:web:702d97febab96231dd3260"
};

// 3. Initialize Firebase FIRST
const app = initializeApp(firebaseConfig);

// 4. Initialize Firestore SECOND (It now knows what [DEFAULT] app to use)
const db = getFirestore(app);

// LANDING PAGE 
let landingFormText = document.getElementById('gameNameInput');
let landingFormSubmit = document.getElementById('gameNameSubmit'); 
let gameList = document.getElementById('gameList')

if (gameList) {
    // We wrap the logic in an async function so we can use 'await'
    const displayGames = async () => {
        try {
            // Reference the top-level "games" collection
            const gamesCollectionRef = collection(db, "games");
            
            // Fetch all documents from that collection
            const querySnapshot = await getDocs(gamesCollectionRef);
            
            // Clear out any placeholder text inside the div
            gameList.innerHTML = "";

            // Loop through each document in the collection
            querySnapshot.forEach((doc) => {
                // doc.data() contains fields like { gameName: "Valorant", createdAt: ... }
                const gameData = doc.data();
                const gameId = doc.id; // e.g., "valorant"

                // Create a new anchor (link) element
                const gameLink = document.createElement('a');
                gameLink.href = "game.html";
                gameLink.className = "game-link"; // Clean class name for your CSS
                gameLink.textContent = gameData.gameName;

                // Add a click event to store data in localStorage before navigating
                gameLink.onclick = function() {
                    // Store the active game ID and name so game.html knows what to look up
                    localStorage.setItem('currentGameId', gameId);
                    localStorage.setItem('currentGameName', gameData.gameName);
                    
                    // Optional: If you want to store the entire object as a string
                    localStorage.setItem('currentGameFullData', JSON.stringify(gameData));
                };

                // Append the link to your #gameList container
                gameList.appendChild(gameLink);
            });

            // Handle case where database has no games yet
            if (querySnapshot.empty) {
                gameList.innerHTML = "<p>No games added yet!</p>";
            }

        } catch (error) {
            console.error("Error fetching games from Firestore: ", error);
            gameList.innerHTML = "<p>Error loading games.</p>";
        }
    };

    // Run the function
    displayGames();


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
        
    } catch (error) {
        console.error("Error adding game to Firestore: ", error);
    }
}
};

// GAME PAGE
let teamFormText = document.getElementById('teamNameInput');
let teamFormSubmit = document.getElementById('teamNameSubmit'); 
let teamList = document.getElementById('teamList');

// Retrieve the current active game context from local storage
const currentGameId = localStorage.getItem('currentGameId');
const currentGameName = localStorage.getItem('currentGameName');

if (teamList) {
    // Safety check: If a user somehow lands on game.html without selecting a game, send them back
    if (!currentGameId) {
        teamList.innerHTML = "<p>No game selected. <a href='index.html'>Go back to select a game.</a></p>";
    } else {
        // Optional: Update your page title or heading dynamically to show the active game name
        console.log(`Viewing teams for game: ${currentGameName} (${currentGameId})`);
        
        // 1. ASYNC FUNCTION TO FETCH & DISPLAY TEAMS FROM FIRESTORE SUBCOLLECTION
        const displayTeams = async () => {
            try {
                // Target path: games/[currentGameId]/teams
                const teamsCollectionRef = collection(db, "games", currentGameId, "teams");
                const querySnapshot = await getDocs(teamsCollectionRef);
                
                teamList.innerHTML = ""; // Clear out existing placeholder text

                querySnapshot.forEach((doc) => {
                    const teamData = doc.data();
                    const teamId = doc.id; // e.g., "sentinels"

                    // Create a dynamic link anchor tag
                    const teamLink = document.createElement('a');
                    teamLink.href = "team.html";
                    teamLink.className = "team-link"; // For your CSS styling
                    teamLink.textContent = teamData.teamName;

                    // Click event: Save the selected team's info to localStorage before changing pages
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

        // Run the display loop immediately when the page loads
        displayTeams();

        // 2. SUBMIT EVENT TO ADD A NEW TEAM TO THE SUBCOLLECTION
        teamFormSubmit.onclick = async function () {
            const teamName = teamFormText.value.trim();

            if (teamName === "") {
                alert("Please enter a team name!");
                return;
            }

            // Create a clean database ID (e.g., "OpTic Gaming" -> "optic-gaming")
            const teamId = teamName.toLowerCase().replace(/\s+/g, '-');

            try {
                // Target path: doc(db, "games", gameId, "teams", teamId)
                await setDoc(doc(db, "games", currentGameId, "teams", teamId), {
                    teamName: teamName,
                    createdAt: new Date()
                });

                console.log(`Team "${teamName}" successfully added to ${currentGameName}!`);
                teamFormText.value = ""; // Clear out the input bar
                
                // Refresh the list automatically so the user instantly sees their new team
                displayTeams();

            } catch (error) {
                console.error("Error adding team to Firestore: ", error);
                alert("Failed to add team. Make sure your Firestore security rules are open!");
            }
        };
    }
}

// TEAM PAGE
let playerList = document.getElementById('playerList');
let openForm = document.getElementById('openForm'); 
let openFormButton = document.getElementById('playerFormOpen');

let charRow = document.getElementById("charRow");
let charRowButton = document.getElementById("addCharacterRow");
let playerSubmitButton = document.getElementById("playerSubmit");

// Active Contexts
const currentTeamId = localStorage.getItem('currentTeamId');

if (playerList) {
    // 1. Toggle Form Visibility
    openFormButton.onclick = function(){
        if (openForm.style.display === 'block') {
            openForm.style.display = 'none';
        } else {
            openForm.style.display = 'block';
        }
    };

    // 2. Generate Dynamic Character Inputs Safely
    charRowButton.onclick = function() {
        // Create a wrapper div for this specific single character row
        const rowWrapper = document.createElement('div');
        rowWrapper.className = "character-input-group"; // For styling
        rowWrapper.style.marginBottom = "8px";

        // Create the Character Name Input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Character Name';
        nameInput.className = 'char-name-field'; // Class target to read later

        // Create the Count Number Input
        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.placeholder = 'Times Played';
        countInput.min = '0';
        countInput.value = '0';
        countInput.className = 'char-count-field'; // Class target to read later
        countInput.style.marginLeft = "8px";

        // Append the inputs to our single row wrapper
        rowWrapper.appendChild(nameInput);
        rowWrapper.appendChild(countInput);

        // Append the whole row wrapper into the primary charRow container
        charRow.appendChild(rowWrapper);
    };

    // 3. Submit Everything to Firebase
    playerSubmitButton.onclick = async function () {
        const playerName = document.getElementById('playerName').value.trim();
        const playerRole = document.getElementById('playerRole').value.trim();

        if (playerName === "" || playerRole === "") {
            alert("Please provide a Player Name and Role!");
            return;
        }

        // --- MANUALLY BUILD THE COMPLEX CHARACTERS OBJECT ---
        const charactersDataMap = {};
        
        // Grab all generated row blocks inside our container
        const inputGroups = charRow.querySelectorAll('.character-input-group');

        inputGroups.forEach(group => {
            const charName = group.querySelector('.char-name-field').value.trim();
            const charCount = parseInt(group.querySelector('.char-count-field').value, 10);

            // Only add to object if user actually filled out the name
            if (charName !== "") {
                // Key = Character Name, Value = Numerical Count (e.g. {"Jett": 42})
                charactersDataMap[charName] = isNaN(charCount) ? 0 : charCount;
            }
        });

        // Unique ID format for doc tracking (e.g., "Tyson Ngo" -> "tyson-ngo")
        const playerId = playerName.toLowerCase().replace(/\s+/g, '-');

        try {
        await setDoc(doc(db, "games", currentGameId, "teams", currentTeamId, "players", playerId), {
            name: playerName,
            role: playerRole,
            characters: charactersDataMap
        });

        console.log(`Player "${playerName}" successfully added to Firestore!`);
        
        // FIXED: Make sure these targets match your HTML IDs exactly
        document.getElementById('playerName').value = ""; // Was likely causing the crash
        document.getElementById('playerRole').value = ""; // Was likely causing the crash
        
        // Clean up the dynamic rows and hide the form container
        charRow.innerHTML = ""; 
        openForm.style.display = 'none'; 
        
    } catch (error) {
        console.error("Error submitting player to Firestore: ", error);
        alert("Submission failed. Check console for error details.");
    }
    };
}