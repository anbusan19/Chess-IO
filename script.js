let board = null;
let game = new Chess();
let currentMode = null;
let timers = {
    white: 0,
    black: 0
};
let activeTimer = null;

const gameModes = {
    blitz: 5 * 60, // 5 minutes in seconds
    rapid: 10 * 60, // 10 minutes in seconds
    classic: 30 * 60 // 30 minutes in seconds
};

// Player names
let player1Name = 'Player 1';
let player2Name = 'Player 2';

// Socket.io connection
const socket = io();
let playerColor = 'white';
let currentRoom = null;
let isMultiplayerGame = false;

// AI related variables
let isAIGame = false;
let playerSide = 'white';
let aiLevel = 1;
const LICHESS_API_TOKEN = 'lip_lAjJ1aPmRgmz7ynO2Ejv';

function setGameMode(mode) {
    currentMode = mode;
    const timeInSeconds = gameModes[mode];
    timers.white = timeInSeconds;
    timers.black = timeInSeconds;
    updateTimerDisplay('white');
    updateTimerDisplay('black');
    document.querySelector('.current-mode').textContent = 
        `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
}

function updateTimerDisplay(color) {
    const minutes = Math.floor(timers[color] / 60);
    const seconds = timers[color] % 60;
    document.querySelector(`.${color}-timer`).textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer(color) {
    if (activeTimer) clearInterval(activeTimer);
    activeTimer = setInterval(() => {
        timers[color]--;
        updateTimerDisplay(color);
        
        if (timers[color] <= 0) {
            clearInterval(activeTimer);
            alert(`Game Over! ${color === 'white' ? 'Black' : 'White'} wins on time!`);
        }
    }, 1000);
}

function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    
    // Get list of possible moves
    const moves = game.moves({
        square: source,
        verbose: true
    });
    
    // Highlight possible moves
    moves.forEach(move => {
        document.querySelector(`[data-square="${move.to}"]`).classList.add('highlight-possible-move');
    });
}

function onDragMove(newLocation, oldLocation, source, piece, position, orientation) {
    // Optional: Update highlights while dragging
}

function onDrop(source, target) {
    // Remove all highlights
    removeHighlights();
    
    if (isAIGame && game.turn() !== playerSide[0]) {
        return 'snapback';
    }

    if (isMultiplayerGame && game.turn() !== playerColor.charAt(0)) {
        return 'snapback';
    }

    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    if (isMultiplayerGame) {
        socket.emit('move', { roomId: currentRoom, move: move });
    } else if (isAIGame) {
        // Request AI move after player's move
        setTimeout(requestAIMove, 250);
    }

    // Start timer for the next player
    startTimer(game.turn() === 'w' ? 'white' : 'black');

    if (game.game_over()) {
        clearInterval(activeTimer);
        if (game.in_checkmate()) {
            const winner = game.turn() === 'w' ? 'Black' : 'White';
            showGameEventModal(
                'Checkmate!', 
                `${winner} wins! Would you like to start a new game?`
            );
        } else if (game.in_draw()) {
            showGameEventModal(
                'Game Over',
                'The game is a draw! Would you like to start a new game?'
            );
        }
    }
}

function removeHighlights() {
    document.querySelectorAll('.highlight-possible-move').forEach(square => {
        square.classList.remove('highlight-possible-move');
    });
}

function onMouseoverSquare(square, piece) {
    if (!piece) return;
    
    // Get list of possible moves for this square
    const moves = game.moves({
        square: square,
        verbose: true
    });
    
    // Exit if there are no moves available for this square
    if (moves.length === 0) return;
    
    // Check if it's the correct player's turn
    const pieceColor = piece.charAt(0);
    if ((game.turn() === 'w' && pieceColor === 'b') ||
        (game.turn() === 'b' && pieceColor === 'w')) {
        return;
    }
    
    // Highlight possible moves
    moves.forEach(move => {
        document.querySelector(`[data-square="${move.to}"]`).classList.add('highlight-possible-move');
    });
}

function onMouseoutSquare(square, piece) {
    removeHighlights();
}

function startGame() {
    if (!currentMode && !isMultiplayerGame) {
        showGameEventModal('Game Mode Required', 'Please select a game mode before starting the game.');
        return;
    }

    // Don't allow starting new game if one is in progress
    if (!isGameFinished() && 
        !confirm('Are you sure you want to quit the current game?')) {
        return;
    }

    game.reset();
    board.position('start');
    startTimer('white');
}

function resetGame() {
    // Check if game is in progress and not over
    if (!game.game_over() && 
        !isGameFinished() && 
        !confirm('Are you sure you want to quit the current game?')) {
        return;
    }

    if (activeTimer) clearInterval(activeTimer);
    game.reset();
    board.position('start');
    isAIGame = false;
    isMultiplayerGame = false;
    closeEventModal();
    document.querySelector('.current-mode').textContent = 'Select Game Mode';
    if (currentMode) {
        setGameMode(currentMode);
    }
}

// Multiplayer functions
function showMultiplayerModal() {
    document.getElementById('multiplayerModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('multiplayerModal').style.display = 'none';
}

function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit('joinRoom', roomId);
}

function joinRoom() {
    const roomId = document.getElementById('roomInput').value.toUpperCase();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
}

function copyRoomId() {
    const roomId = document.getElementById('roomId').textContent;
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
}

// Socket event handlers
socket.on('joinedRoom', ({ roomId, color }) => {
    currentRoom = roomId;
    playerColor = color;
    isMultiplayerGame = true;
    document.getElementById('roomId').textContent = roomId;
    document.getElementById('roomInfo').style.display = 'block';
});

socket.on('gameStart', () => {
    closeModal();
    startGame();
});

socket.on('opponentMove', (move) => {
    game.move(move);
    board.position(game.fen());
});

socket.on('playerLeft', () => {
    showDisconnectModal();
});

socket.on('roomFull', () => {
    showGameEventModal('Room Full', 'This room is already full. Please try another room or create a new one.');
});

function showGameEventModal(title, message) {
    document.getElementById('eventTitle').textContent = title;
    document.getElementById('eventMessage').textContent = message;
    document.getElementById('gameEventModal').style.display = 'block';

    // Update New Game button action based on game type
    const newGameBtn = document.querySelector('.event-actions .modal-btn:last-child');
    newGameBtn.onclick = () => {
        resetGame();
        if (isMultiplayerGame) {
            showMultiplayerModal();
        } else if (isAIGame) {
            showAIModal();
        }
    };
}

function closeEventModal() {
    document.getElementById('gameEventModal').style.display = 'none';
}

function showAIModal() {
    document.getElementById('aiModal').style.display = 'block';
}

function setPlayerColor(color) {
    playerSide = color;
    document.querySelectorAll('.color-buttons .modal-btn').forEach(btn => {
        btn.style.backgroundColor = btn.textContent.toLowerCase() === color ? '#F553FF' : '#7F76FF';
    });
}

function startAIGame() {
    isAIGame = true;
    aiLevel = parseInt(document.getElementById('aiLevel').value);
    document.getElementById('aiModal').style.display = 'none';
    
    // Start new game
    game.reset();
    board.position('start');
    
    // If AI plays white, make first move
    if (playerSide === 'black') {
        requestAIMove();
    }
}

async function requestAIMove() {
    if (game.game_over()) return;
    
    try {
        const fen = game.fen();
        const response = await fetch('https://lichess.org/api/cloud-eval', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${LICHESS_API_TOKEN}`,
                'Accept': 'application/json'
            },
            params: {
                fen: fen,
                multiPv: 1,
                variant: 'standard'
            }
        });
        
        if (!response.ok) {
            throw new Error('Lichess API request failed');
        }
        
        const data = await response.json();
        
        if (data.pvs && data.pvs.length > 0) {
            const bestMove = data.pvs[0].moves.split(' ')[0];
            makeAIMove(bestMove);
        } else {
            // Fallback to random move if no evaluation available
            const moves = game.moves();
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            makeAIMove(randomMove);
        }
    } catch (error) {
        console.error('Error getting AI move:', error);
        // Fallback to random move
        const moves = game.moves();
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        makeAIMove(randomMove);
    }
}

function makeAIMove(move) {
    game.move(move);
    board.position(game.fen());
    
    if (game.game_over()) {
        handleGameOver();
    }
}

function handleGameOver() {
    if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        if (isMultiplayerGame && currentRoom) {
            socket.emit('gameEnd', {
                roomId: currentRoom,
                result: 'checkmate',
                winner: winner
            });
        }
        showGameEventModal('Checkmate!', `${winner} wins! Would you like to start a new game?`);
    } else if (game.in_draw()) {
        if (isMultiplayerGame && currentRoom) {
            socket.emit('gameEnd', {
                roomId: currentRoom,
                result: 'draw',
                winner: null
            });
        }
        showGameEventModal('Game Over', 'The game is a draw! Would you like to start a new game?');
    }
}

// Initialize the board
board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    pieceTheme: (piece) => {
        // Convert chess.js piece notation to filename
        const pieceMap = {
            'p': 'pawn',
            'r': 'rook',
            'n': 'knight',
            'b': 'bishop',
            'q': 'queen',
            'k': 'king'
        };
        const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
        const pieceName = pieceMap[piece.charAt(1).toLowerCase()];
        return `pieces/${pieceColor}-${pieceName}.png`;
    }
}); 

// Add event listeners for close buttons
document.addEventListener('DOMContentLoaded', () => {
    // Close button for multiplayer modal
    document.querySelector('#multiplayerModal .close').addEventListener('click', () => {
        document.getElementById('multiplayerModal').style.display = 'none';
    });

    // Close button for AI modal
    document.querySelector('#aiModal .close').addEventListener('click', () => {
        document.getElementById('aiModal').style.display = 'none';
    });

    // Close button for game event modal
    document.querySelector('.close-event').addEventListener('click', () => {
        closeEventModal();
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Close button for disconnect modal
    document.querySelector('#disconnectModal .close-event').addEventListener('click', () => {
        exitToMenu();
    });

    // Hide game container initially
    document.querySelector('.container').style.display = 'none';
    
    // Show menu after loading animation
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('menuPage').style.display = 'flex';
    }, 3000);

    // Add input event listeners for player names
    document.getElementById('player1Name').addEventListener('input', (e) => {
        player1Name = e.target.value || 'Player 1';
    });

    document.getElementById('player2Name').addEventListener('input', (e) => {
        player2Name = e.target.value || 'Player 2';
    });
}); 

// Add helper function to check if game is finished
function isGameFinished() {
    return game.game_over() || 
           (currentMode && timers[game.turn()] <= 0) ||
           !currentMode;  // No mode selected means no game in progress
} 

function showDisconnectModal() {
    document.getElementById('disconnectModal').style.display = 'block';
}

function waitForNewPlayer() {
    // Keep the current room and wait for new player
    document.getElementById('disconnectModal').style.display = 'none';
    showGameEventModal('Waiting', 'Waiting for a new player to join...');
}

function findNewGame() {
    // Reset and create new room
    resetGame();
    document.getElementById('disconnectModal').style.display = 'none';
    createRoom();
}

function exitToMenu() {
    // Check if game is in progress
    if (!game.game_over() && !isGameFinished() && 
        !confirm('Are you sure you want to quit the current game?')) {
        return;
    }

    // Reset everything and go back to main menu
    resetGame();
    isMultiplayerGame = false;
    isAIGame = false;
    currentRoom = null;
    
    // Hide all modals
    document.getElementById('disconnectModal').style.display = 'none';
    document.getElementById('roomInfo').style.display = 'none';
    document.getElementById('aiModal').style.display = 'none';
    document.getElementById('multiplayerModal').style.display = 'none';
    document.getElementById('gameEventModal').style.display = 'none';

    // Hide game container and show menu
    document.querySelector('.container').style.display = 'none';
    document.getElementById('menuPage').style.display = 'flex';
} 

function selectMode(mode) {
    // Hide menu page
    document.getElementById('menuPage').style.display = 'none';
    
    // Show game container
    const container = document.querySelector('.container');
    container.style.display = 'block';
    container.style.opacity = '1';
    
    switch(mode) {
        case 'local':
            // Start local game
            setGameMode('blitz');
            break;
        case 'ai':
            showAIModal();
            break;
        case 'online':
            showMultiplayerModal();
            break;
    }
} 

// Add socket event listener for game over
socket.on('gameOver', ({ result, winner }) => {
    if (result === 'checkmate') {
        showGameEventModal('Checkmate!', `${winner} wins! Would you like to start a new game?`);
    } else if (result === 'draw') {
        showGameEventModal('Game Over', 'The game is a draw! Would you like to start a new game?');
    }
}); 