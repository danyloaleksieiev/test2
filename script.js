// Sound Effects
const clickSound = new Audio('sounds/click.wav');
const revealSound = new Audio('sounds/reveal.wav');
const mineHitSound = new Audio('sounds/mine_hit.wav');
const cashOutSound = new Audio('sounds/cash_out.wav');
const winSound = new Audio('sounds/win.wav');

// Helper function to play sounds
function playSound(soundObject) {
    soundObject.currentTime = 0; // Reset sound to start
    soundObject.play().catch(error => console.error("Error playing sound:", error)); // Basic error handling
}

// Global Variables / DOM Element References
const gameBoard = document.getElementById('game-board');
const betAmountInput = document.getElementById('bet-amount');
const startButton = document.getElementById('start-button');
const minesCountInput = document.getElementById('mines-count');
const messageArea = document.getElementById('message-area');
const winningsDisplay = document.getElementById('winnings-display');

// Default game parameters
let boardSize = 5; // 5x5 grid
let numberOfMines = 5; // Default number of mines
let boardData = []; // 2D array to store board state

// Game State Variables
let isGameActive = false;
let currentBet = 0;
let currentWinnings = 0;
let revealedSafeCellsCount = 0;
let totalSafeCells = 0; // Will be calculated in startGame or when settings change

/**
 * Creates the game board cells and initializes the board data.
 */
function createBoard() {
    // Clear existing cells
    gameBoard.innerHTML = '';
    boardData = []; // Reset board data

    for (let row = 0; row < boardSize; row++) {
        const rowData = [];
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            // Remove old listener before adding new one, or ensure cells are new
            cell.removeEventListener('click', handleCellClick); // Important if cells are reused/not cleared fully
            cell.addEventListener('click', handleCellClick);

            gameBoard.appendChild(cell);
            rowData.push({
                isMine: false,
                isRevealed: false,
                isFlagged: false, // For future use
                element: cell // Reference to the DOM element
            });
        }
        boardData.push(rowData);
    }
    placeMines();
}

/**
 * Randomly places mines on the boardData.
 */
function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < numberOfMines) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);

        if (!boardData[row][col].isMine) {
            boardData[row][col].isMine = true;
            minesPlaced++;
            // For debugging:
            // console.log(`Mine placed at: ${row}, ${col}`);
            // boardData[row][col].element.classList.add('mine'); // Temporary for visualization
        }
    }
    // For debugging:
    // console.log(boardData);
}

// Initial Call
document.addEventListener('DOMContentLoaded', () => {
    // Set default values for input fields if they are empty
    if (!minesCountInput.value) {
        minesCountInput.value = numberOfMines;
    }

    // Update numberOfMines if the input has a value (e.g. from user or previous session)
    // Also, ensure boardSize can be updated similarly if an input for it is added later.
    numberOfMines = parseInt(minesCountInput.value) || numberOfMines;

    createBoard();
});

// --- Game Logic Functions (to be implemented in later steps) ---

// function handleCellClick(event) { ... }
// function revealCell(row, col) { ... }
// function revealMines() { ... }
// function checkWinCondition() { ... }
// function updateWinnings(amount) { ... }
// function startGame() { ... }
// function cashOut() { ... }

// Event Listeners (some will be set up later)
// startButton.addEventListener('click', startGame);
// minesCountInput.addEventListener('change', () => {
//     numberOfMines = parseInt(minesCountInput.value);
//     if (numberOfMines > boardSize * boardSize) {
//         numberOfMines = boardSize * boardSize; // Cap at max possible mines
//         minesCountInput.value = numberOfMines;
//     }
    // Set default values for input fields if they are empty
    if (!minesCountInput.value) {
        minesCountInput.value = numberOfMines;
    }
    if(!betAmountInput.value) {
        betAmountInput.value = "10"; // Default bet
    }

    // Update numberOfMines if the input has a value
    numberOfMines = parseInt(minesCountInput.value) || numberOfMines;
    calculateTotalSafeCells(); // Calculate initial totalSafeCells
    createBoard(); // Create initial board

    startButton.textContent = "Start Game";
    messageArea.textContent = "Welcome! Enter bet and mines, then start.";
    winningsDisplay.textContent = `Current Winnings: 0.00`;
});

// --- Game Logic Functions ---

function calculateTotalSafeCells() {
    totalSafeCells = (boardSize * boardSize) - numberOfMines;
}

function handleStartButton() {
    if (!isGameActive) {
        // Start Game
        const bet = parseFloat(betAmountInput.value);
        if (isNaN(bet) || bet <= 0) {
            messageArea.textContent = "Please enter a valid bet amount greater than 0.";
            return;
        }
        currentBet = bet;
        isGameActive = true;
        currentWinnings = 0;
        revealedSafeCellsCount = 0;

        const newMinesCount = parseInt(minesCountInput.value);
        if (isNaN(newMinesCount) || newMinesCount < 1 || newMinesCount >= boardSize * boardSize) {
            messageArea.textContent = `Please enter a valid number of mines (1-${(boardSize * boardSize) - 1}).`;
            isGameActive = false; // Reset state
            return;
        }
        numberOfMines = newMinesCount;
        calculateTotalSafeCells();
        createBoard(); // This will also call placeMines and add cell click listeners

        startButton.textContent = "Cash Out";
        messageArea.textContent = "Game started. Click on a cell!";
        winningsDisplay.textContent = `Current Winnings: ${currentWinnings.toFixed(2)}`;

        betAmountInput.disabled = true;
        minesCountInput.disabled = true;

    } else {
        // Cash Out
        messageArea.textContent = `Congratulations! You cashed out ${currentWinnings.toFixed(2)}.`;
        playSound(cashOutSound);
        endGame(true); // Player chose to cash out, so it's a win
    }
}

function handleCellClick(event) {
    if (!isGameActive || event.target.classList.contains('revealed') || event.target.classList.contains('mine')) {
        return; // Do nothing if game is not active or cell already revealed/is a mine that was clicked
    }
    playSound(clickSound); // Play click sound on any valid cell interaction

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cellData = boardData[row][col];

    if (cellData.isMine) {
        cellData.element.classList.add('mine');
        messageArea.textContent = "Boom! You hit a mine!";
        playSound(mineHitSound);
        endGame(false); // Player lost
    } else {
        cellData.isRevealed = true;
        cellData.element.classList.add('revealed');
        playSound(revealSound);
        revealedSafeCellsCount++;

        // Update winnings - simple multiplier for now
        currentWinnings = currentBet * (1 + 0.1 * revealedSafeCellsCount);
        winningsDisplay.textContent = `Current Winnings: ${currentWinnings.toFixed(2)}`;

        if (revealedSafeCellsCount === totalSafeCells) {
            messageArea.textContent = "Congratulations! You found all safe spots!";
            playSound(winSound);
            endGame(true); // Player won
        }
    }
}

function revealAllMines() {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (boardData[r][c].isMine) {
                boardData[r][c].element.classList.add('mine');
                // Optionally, mark as revealed if you want to prevent further clicks,
                // but usually, game ends so it's not strictly needed.
                // boardData[r][c].isRevealed = true;
            }
        }
    }
}

function endGame(isWin) {
    isGameActive = false;
    startButton.textContent = "Start Game";
    betAmountInput.disabled = false;
    minesCountInput.disabled = false;

    if (!isWin) { // Player hit a mine
        currentWinnings = 0;
        winningsDisplay.textContent = `Current Winnings: ${currentWinnings.toFixed(2)}`;
        revealAllMines();
        // messageArea is already set in handleCellClick for hitting a mine
    } else { // Player cashed out or found all safe cells
        // messageArea is already set for cash out or finding all cells
        // currentWinnings is already calculated and displayed
    }
    // Disable further cell clicks indirectly by isGameActive flag,
    // but could also explicitly remove listeners if performance becomes an issue on very large boards / many resets.
}


// Event Listeners
startButton.addEventListener('click', handleStartButton);

// Optional: Update board if mine count changes when game is not active
minesCountInput.addEventListener('change', () => {
    if (!isGameActive) {
        const newMines = parseInt(minesCountInput.value);
        if (newMines > 0 && newMines < boardSize * boardSize) {
            numberOfMines = newMines;
            calculateTotalSafeCells();
            // Reset boardData and UI, but don't placeMines until game start for fairness
            // Or, for simplicity, just recreate it visually:
            createBoard();
        } else if (newMines >= boardSize * boardSize || newMines <= 0) {
            messageArea.textContent = `Mines must be between 1 and ${(boardSize * boardSize) -1}.`;
            minesCountInput.value = numberOfMines; // Reset to valid previous
        }
    }
});
