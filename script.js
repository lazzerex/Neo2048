// New enhanced animation system for 2048

class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameContainer = document.querySelector('.grid-container');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.newGameButton = document.getElementById('new-game');
        this.animationInProgress = false;
        
        // Animation tracking properties
        this.previousState = null;
        this.mergedTiles = [];
        this.movedTiles = [];
        this.newTiles = [];
        
        // Menu elements
        this.container = document.querySelector('.container');
        this.gameMenu = document.getElementById('game-menu');
        this.startButton = document.getElementById('start-game');
        this.howToPlayButton = document.getElementById('how-to-play');
        this.startingTilesSelect = document.getElementById('starting-tiles');
        this.menuBestScore = document.getElementById('menu-best-score');
        
        this.setupMenu();
    }

    setupMenu() {
        // Update best score in menu
        this.menuBestScore.textContent = this.bestScore;

        // Create How to Play modal
        const modal = document.createElement('div');
        modal.className = 'how-to-play-modal';
        modal.innerHTML = `
            <button class="close-button">&times;</button>
            <h2>How to Play 2048</h2>
            <p>Use your <strong>arrow keys</strong> to move the tiles. When two tiles with the same number touch, they <strong>merge into one!</strong></p>
            <p>Start with 2 tiles and combine them to create a tile with the number 2048 to win the game.</p>
            <p><strong>Tips:</strong></p>
            <ul style="text-align: left; margin-bottom: 15px;">
                <li>Plan your moves ahead</li>
                <li>Keep your highest tiles in a corner</li>
                <li>Keep tiles organized</li>
            </ul>
        `;
        document.body.appendChild(modal);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        // Event Listeners
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

        this.howToPlayButton.addEventListener('click', () => {
            modal.classList.add('active');
            overlay.classList.add('active');
        });

        modal.querySelector('.close-button').addEventListener('click', () => {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    startGame() {
        // Hide menu and show game
        gsap.to(this.gameMenu, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                this.gameMenu.style.display = 'none';
                this.container.style.display = 'block';
                gsap.from(this.container, {
                    opacity: 0,
                    y: 20,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        });

        // Initialize game
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.previousState = null;
        this.mergedTiles = [];
        this.movedTiles = [];
        this.newTiles = [];
        this.updateScoreDisplay();

        // Add initial tiles based on difficulty
        const numStartingTiles = parseInt(this.startingTilesSelect.value);
        for (let i = 0; i < numStartingTiles; i++) {
            const position = this.addRandomTile();
            if (position) {
                this.newTiles.push(position);
            }
        }

        this.setupEventListeners();
        this.renderGrid();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.newGameButton.addEventListener('click', () => this.resetGame());
        
        // Touch events for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.gameContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) this.move('right');
                else this.move('left');
            } else {
                if (deltaY > 0) this.move('down');
                else this.move('up');
            }
        });
    }

    handleKeyPress(event) {
        if (event.key.startsWith('Arrow')) {
            event.preventDefault();
            const direction = event.key.replace('Arrow', '').toLowerCase();
            this.move(direction);
        }
    }

    // Store the current state before making a move
    saveState() {
        // Deep copy the current grid
        this.previousState = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        };
    }

    move(direction) {
        if (this.animationInProgress) return;
        
        // Save current state
        this.saveState();
        
        // Clear animation tracking
        this.mergedTiles = [];
        this.movedTiles = [];
        this.newTiles = [];
        
        let moved = false;
        
        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }
        
        if (moved) {
            this.animationInProgress = true;
            
            // Add new random tile
            const newTilePosition = this.addRandomTile();
            if (newTilePosition) {
                this.newTiles.push(newTilePosition);
            }
            
            // Render grid with animations
            this.renderGrid();
            
            // Check game state after animations complete
            setTimeout(() => {
                this.animationInProgress = false;
                
                if (this.isGameOver()) {
                    this.handleGameOver();
                }
                
                if (this.isWin()) {
                    this.handleWin();
                }
            }, 400); // Wait for animations to complete
        }
    }

    // Enhanced tracking of tile movements and merges
    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < 4; row++) {
            // Create a copy of the original row
            const originalRow = [...this.grid[row]];
            
            // Create an array to track the new positions of each tile
            const tileMovements = originalRow.map((value, col) => {
                return { originalCol: col, value: value, newCol: null, merged: false };
            });
            
            // First pass: remove empty cells and track new positions
            const nonEmptyTiles = tileMovements.filter(tile => tile.value !== 0);
            
            // Second pass: perform merges and build the new row
            const mergedRow = [];
            for (let i = 0; i < nonEmptyTiles.length; i++) {
                // If we can merge with the next tile
                if (i < nonEmptyTiles.length - 1 && 
                    nonEmptyTiles[i].value === nonEmptyTiles[i + 1].value &&
                    !nonEmptyTiles[i].merged && !nonEmptyTiles[i + 1].merged) {
                    
                    // Create merged tile
                    const newValue = nonEmptyTiles[i].value * 2;
                    mergedRow.push(newValue);
                    
                    // Mark both tiles as merged
                    nonEmptyTiles[i].merged = true;
                    nonEmptyTiles[i + 1].merged = true;
                    
                    // Track merge in our array
                    this.mergedTiles.push({
                        row: row,
                        toCol: mergedRow.length - 1,
                        fromCol1: nonEmptyTiles[i].originalCol,
                        fromCol2: nonEmptyTiles[i + 1].originalCol,
                        value: newValue
                    });
                    
                    // Update score
                    this.score += newValue;
                    
                    // Skip the next tile since we merged it
                    i++;
                } else if (!nonEmptyTiles[i].merged) {
                    // Just move this tile
                    mergedRow.push(nonEmptyTiles[i].value);
                    
                    // Track movement in our movedTiles array if it actually moved
                    const newCol = mergedRow.length - 1;
                    if (nonEmptyTiles[i].originalCol !== newCol) {
                        this.movedTiles.push({
                            row: row,
                            fromCol: nonEmptyTiles[i].originalCol,
                            toCol: newCol,
                            value: nonEmptyTiles[i].value
                        });
                    }
                }
            }
            
            // Fill with zeros
            while (mergedRow.length < 4) {
                mergedRow.push(0);
            }
            
            // Check if row changed
            if (JSON.stringify(this.grid[row]) !== JSON.stringify(mergedRow)) {
                moved = true;
                this.grid[row] = mergedRow;
            }
        }
        
        return moved;
    }
    
    // Similar updates for moveRight, moveUp, and moveDown functions
    // Here's moveRight as an example:
    moveRight() {
        let moved = false;
        
        for (let row = 0; row < 4; row++) {
            // Create a copy of the original row
            const originalRow = [...this.grid[row]];
            
            // Create an array to track the new positions of each tile
            const tileMovements = originalRow.map((value, col) => {
                return { originalCol: col, value: value, newCol: null, merged: false };
            });
            
            // First pass: remove empty cells and track new positions
            const nonEmptyTiles = tileMovements.filter(tile => tile.value !== 0);
            
            // Second pass: perform merges and build the new row
            const mergedRow = Array(4).fill(0);
            let mergePosition = 3;
            
            for (let i = nonEmptyTiles.length - 1; i >= 0; i--) {
                // If we can merge with the previous tile
                if (i > 0 && 
                    nonEmptyTiles[i].value === nonEmptyTiles[i - 1].value &&
                    !nonEmptyTiles[i].merged && !nonEmptyTiles[i - 1].merged) {
                    
                    // Create merged tile
                    const newValue = nonEmptyTiles[i].value * 2;
                    mergedRow[mergePosition] = newValue;
                    
                    // Mark both tiles as merged
                    nonEmptyTiles[i].merged = true;
                    nonEmptyTiles[i - 1].merged = true;
                    
                    // Track merge in our array
                    this.mergedTiles.push({
                        row: row,
                        toCol: mergePosition,
                        fromCol1: nonEmptyTiles[i].originalCol,
                        fromCol2: nonEmptyTiles[i - 1].originalCol,
                        value: newValue
                    });
                    
                    // Update score
                    this.score += newValue;
                    
                    // Skip the next tile since we merged it
                    i--;
                } else if (!nonEmptyTiles[i].merged) {
                    // Just move this tile
                    mergedRow[mergePosition] = nonEmptyTiles[i].value;
                    
                    // Track movement in our movedTiles array if it actually moved
                    if (nonEmptyTiles[i].originalCol !== mergePosition) {
                        this.movedTiles.push({
                            row: row,
                            fromCol: nonEmptyTiles[i].originalCol,
                            toCol: mergePosition,
                            value: nonEmptyTiles[i].value
                        });
                    }
                }
                
                mergePosition--;
            }
            
            // Check if row changed
            if (JSON.stringify(this.grid[row]) !== JSON.stringify(mergedRow)) {
                moved = true;
                this.grid[row] = mergedRow;
            }
        }
        
        return moved;
    }
    

   // Updated moveUp function with improved tracking
moveUp() {
    let moved = false;
    
    for (let col = 0; col < 4; col++) {
        // Create a copy of the original column
        const originalCol = this.grid.map(row => row[col]);
        
        // Create an array to track the new positions of each tile
        const tileMovements = originalCol.map((value, row) => {
            return { originalRow: row, value: value, newRow: null, merged: false };
        });
        
        // First pass: remove empty cells and track new positions
        const nonEmptyTiles = tileMovements.filter(tile => tile.value !== 0);
        
        // Second pass: perform merges and build the new column
        const mergedCol = [];
        for (let i = 0; i < nonEmptyTiles.length; i++) {
            // If we can merge with the next tile
            if (i < nonEmptyTiles.length - 1 && 
                nonEmptyTiles[i].value === nonEmptyTiles[i + 1].value &&
                !nonEmptyTiles[i].merged && !nonEmptyTiles[i + 1].merged) {
                
                // Create merged tile
                const newValue = nonEmptyTiles[i].value * 2;
                mergedCol.push(newValue);
                
                // Mark both tiles as merged
                nonEmptyTiles[i].merged = true;
                nonEmptyTiles[i + 1].merged = true;
                
                // Track merge in our array
                this.mergedTiles.push({
                    col: col,
                    toRow: mergedCol.length - 1,
                    fromRow1: nonEmptyTiles[i].originalRow,
                    fromRow2: nonEmptyTiles[i + 1].originalRow,
                    value: newValue
                });
                
                // Update score
                this.score += newValue;
                
                // Skip the next tile since we merged it
                i++;
            } else if (!nonEmptyTiles[i].merged) {
                // Just move this tile
                mergedCol.push(nonEmptyTiles[i].value);
                
                // Track movement in our movedTiles array if it actually moved
                const newRow = mergedCol.length - 1;
                if (nonEmptyTiles[i].originalRow !== newRow) {
                    this.movedTiles.push({
                        col: col,
                        fromRow: nonEmptyTiles[i].originalRow,
                        toRow: newRow,
                        value: nonEmptyTiles[i].value
                    });
                }
            }
        }
        
        // Fill with zeros
        while (mergedCol.length < 4) {
            mergedCol.push(0);
        }
        
        // Check if column changed and update grid
        let colChanged = false;
        for (let row = 0; row < 4; row++) {
            if (this.grid[row][col] !== mergedCol[row]) {
                colChanged = true;
                this.grid[row][col] = mergedCol[row];
            }
        }
        
        if (colChanged) {
            moved = true;
        }
    }
    
    return moved;
}


moveDown() {
    let moved = false;
    
    for (let col = 0; col < 4; col++) {
        // Create a copy of the original column
        const originalCol = this.grid.map(row => row[col]);
        
        // Create an array to track the new positions of each tile
        const tileMovements = originalCol.map((value, row) => {
            return { originalRow: row, value: value, newRow: null, merged: false };
        });
        
        // First pass: remove empty cells and track new positions
        const nonEmptyTiles = tileMovements.filter(tile => tile.value !== 0);
        
        // Second pass: perform merges and build the new column
        const mergedCol = Array(4).fill(0);
        let mergePosition = 3;
        
        for (let i = nonEmptyTiles.length - 1; i >= 0; i--) {
            // If we can merge with the previous tile
            if (i > 0 && 
                nonEmptyTiles[i].value === nonEmptyTiles[i - 1].value &&
                !nonEmptyTiles[i].merged && !nonEmptyTiles[i - 1].merged) {
                
                // Create merged tile
                const newValue = nonEmptyTiles[i].value * 2;
                mergedCol[mergePosition] = newValue;
                
                // Mark both tiles as merged
                nonEmptyTiles[i].merged = true;
                nonEmptyTiles[i - 1].merged = true;
                
                // Track merge in our array
                this.mergedTiles.push({
                    col: col,
                    toRow: mergePosition,
                    fromRow1: nonEmptyTiles[i].originalRow,
                    fromRow2: nonEmptyTiles[i - 1].originalRow,
                    value: newValue
                });
                
                // Update score
                this.score += newValue;
                
                // Skip the next tile since we merged it
                i--;
            } else if (!nonEmptyTiles[i].merged) {
                // Just move this tile
                mergedCol[mergePosition] = nonEmptyTiles[i].value;
                
                // Track movement in our movedTiles array if it actually moved
                if (nonEmptyTiles[i].originalRow !== mergePosition) {
                    this.movedTiles.push({
                        col: col,
                        fromRow: nonEmptyTiles[i].originalRow,
                        toRow: mergePosition,
                        value: nonEmptyTiles[i].value
                    });
                }
            }
            
            mergePosition--;
        }
        
        // Check if column changed and update grid
        let colChanged = false;
        for (let row = 0; row < 4; row++) {
            if (this.grid[row][col] !== mergedCol[row]) {
                colChanged = true;
                this.grid[row][col] = mergedCol[row];
            }
        }
        
        if (colChanged) {
            moved = true;
        }
    }
    
    return moved;
}

    // Helper to find original position of a value in a row/column
    findOriginalPosition(index, value, originalArray, direction, skipPosition = null, isColumn = false) {
        if (direction === 'left' || direction === 'up') {
            for (let i = 0; i < originalArray.length; i++) {
                if (originalArray[i] === value && i !== skipPosition) {
                    return i;
                }
            }
        } else { // right or down
            for (let i = originalArray.length - 1; i >= 0; i--) {
                if (originalArray[i] === value && i !== skipPosition) {
                    return i;
                }
            }
        }
        return null;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
            return {row, col, value: this.grid[row][col]};
        }
        return null;
    }

    // New method for rendering the grid with clean animations
   // Update the renderGrid method to fix overlapping animations

   renderGrid() {
    // Create new grid
    const newGrid = document.createElement('div');
    newGrid.className = 'grid-container';
    
    // Create empty cells
    for (let i = 0; i < 4; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            row.appendChild(cell);
        }
        
        newGrid.appendChild(row);
    }
    
    // Replace the current grid with the new grid
    this.gameContainer.replaceWith(newGrid);
    this.gameContainer = newGrid;
    
    // Calculate cell dimensions
    const cellRect = this.gameContainer.querySelector('.grid-cell').getBoundingClientRect();
    const cellSize = cellRect.width;
    const cellGap = parseInt(getComputedStyle(this.gameContainer).gap) || 10;
    
    // Create a timeline for better animation control
    const timeline = gsap.timeline();
    
    // First stage: Add and animate static tiles (tiles that don't move)
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (this.grid[i][j] !== 0) {
                const value = this.grid[i][j];
                
                // Skip new tiles, merged tiles, and moved tiles in this first pass
                const isNewTile = this.newTiles.some(t => t.row === i && t.col === j);
                const isMergedTile = this.mergedTiles.some(m => 
                    (m.row === i && m.toCol === j) || 
                    (m.col === j && m.toRow === i)
                );
                const isMovedTile = this.movedTiles.some(m => 
                    (m.row === i && m.toCol === j) || 
                    (m.col === j && m.toRow === i)
                );
                
                // If it's a tile that doesn't move or change, add it without animation
                if (!isNewTile && !isMergedTile && !isMovedTile) {
                    const targetCell = this.gameContainer.querySelector(`.grid-cell[data-row="${i}"][data-col="${j}"]`);
                    
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.dataset.value = value;
                    
                    targetCell.appendChild(tile);
                }
            }
        }
    }
    
    // Second stage: add and animate tiles that move
    timeline.add(() => {
        this.movedTiles.forEach(moveInfo => {
            let row, col, fromRow, fromCol;
            
            if (moveInfo.hasOwnProperty('toCol')) {
                row = moveInfo.row;
                col = moveInfo.toCol;
                fromRow = moveInfo.row;
                fromCol = moveInfo.fromCol;
            } else {
                row = moveInfo.toRow;
                col = moveInfo.col;
                fromRow = moveInfo.fromRow;
                fromCol = moveInfo.col;
            }
            
            const value = moveInfo.value;
            const targetCell = this.gameContainer.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            
            // Check if target cell already has a tile
            if (targetCell.querySelector('.tile')) {
                return; // Skip if there's already a tile
            }
            
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = value;
            tile.dataset.value = value;
            
            targetCell.appendChild(tile);
            
            // Set starting position
            if (fromRow !== row) {
                gsap.fromTo(tile,
                    { y: (fromRow - row) * (cellSize + cellGap) },
                    { y: 0, duration: 0.2, ease: "power2.out" }
                );
            } else if (fromCol !== col) {
                gsap.fromTo(tile,
                    { x: (fromCol - col) * (cellSize + cellGap) },
                    { x: 0, duration: 0.2, ease: "power2.out" }
                );
            }
        });
    });
    
    // Third stage: add merged tiles with ghost animations
    timeline.add(() => {
        this.mergedTiles.forEach(mergeInfo => {
            let row, col, fromPos1, fromPos2;
            
            if (mergeInfo.hasOwnProperty('toCol')) {
                row = mergeInfo.row;
                col = mergeInfo.toCol;
                fromPos1 = { row: mergeInfo.row, col: mergeInfo.fromCol1 };
                fromPos2 = { row: mergeInfo.row, col: mergeInfo.fromCol2 };
            } else {
                row = mergeInfo.toRow;
                col = mergeInfo.col;
                fromPos1 = { row: mergeInfo.fromRow1, col: mergeInfo.col };
                fromPos2 = { row: mergeInfo.fromRow2, col: mergeInfo.col };
            }
            
            const value = mergeInfo.value;
            const targetCell = this.gameContainer.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            
            // Check if target cell already has a non-ghost tile
            const existingTile = targetCell.querySelector('.tile:not(.ghost)');
            if (existingTile) {
                existingTile.remove();
            }
            
            // Create the main tile (initially hidden)
            const tile = document.createElement('div');
            tile.className = 'tile merged';
            tile.textContent = value;
            tile.dataset.value = value;
            
            // Add the tile to the cell
            targetCell.appendChild(tile);
            
            // Hide the real tile initially
            gsap.set(tile, { autoAlpha: 0, scale: 0.8 });
            
            // Create ghost tiles for the merge animation
            const ghost1 = document.createElement('div');
            ghost1.className = 'tile ghost';
            ghost1.textContent = value / 2;
            ghost1.dataset.value = value / 2;
            
            const ghost2 = document.createElement('div');
            ghost2.className = 'tile ghost';
            ghost2.textContent = value / 2;
            ghost2.dataset.value = value / 2;
            
            // Position ghosts at their original locations
            if (fromPos1.row === row && fromPos1.col !== col) {
                gsap.set(ghost1, { 
                    x: (fromPos1.col - col) * (cellSize + cellGap),
                    y: 0
                });
            } else if (fromPos1.col === col && fromPos1.row !== row) {
                gsap.set(ghost1, { 
                    x: 0,
                    y: (fromPos1.row - row) * (cellSize + cellGap)
                });
            }
            
            if (fromPos2.row === row && fromPos2.col !== col) {
                gsap.set(ghost2, { 
                    x: (fromPos2.col - col) * (cellSize + cellGap),
                    y: 0
                });
            } else if (fromPos2.col === col && fromPos2.row !== row) {
                gsap.set(ghost2, { 
                    x: 0,
                    y: (fromPos2.row - row) * (cellSize + cellGap)
                });
            }
            
            // Add ghosts to the target cell (temporarily)
            targetCell.appendChild(ghost1);
            targetCell.appendChild(ghost2);
            
            // Animate ghosts to center in a controlled timeline
            const ghostTimeline = gsap.timeline({
                onComplete: () => {
                    // Show the real tile with a pop animation
                    gsap.to(tile, {
                        autoAlpha: 1,
                        scale: 1.2,
                        duration: 0.15,
                        ease: "power2.out",
                        onComplete: () => {
                            // Scale back to normal
                            gsap.to(tile, {
                                scale: 1,
                                duration: 0.1,
                                ease: "power2.out"
                            });
                            
                            // Remove ghost tiles
                            ghost1.remove();
                            ghost2.remove();
                        }
                    });
                }
            });
            
            ghostTimeline.to([ghost1, ghost2], {
                x: 0,
                y: 0,
                duration: 0.2,
                ease: "power2.out"
            });
        });
    }, "+=0.05");
    
    // Fourth stage: add new tiles with pop animation
    timeline.add(() => {
        this.newTiles.forEach(tileInfo => {
            const {row, col, value} = tileInfo;
            
            // Find the target cell
            const targetCell = this.gameContainer.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            
            // Skip if there's already a tile
            if (targetCell.querySelector('.tile')) {
                return;
            }
            
            // Create the tile
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = value;
            tile.dataset.value = value;
            
            // Add the tile to the cell
            targetCell.appendChild(tile);
            
            // Animate new tile appearing
            gsap.fromTo(tile, 
                { scale: 0 },
                { scale: 1, duration: 0.3, ease: "back.out(1.4)" }
            );
        });
    }, "+=0.1");
    
    // Update score after animation
    this.updateScoreDisplay();
}

    updateScoreDisplay() {
        const oldScore = parseInt(this.scoreDisplay.textContent);
        const scoreDiff = this.score - oldScore;
        
        if (scoreDiff > 0) {
            // Create and animate score increase indicator
            const scoreAddition = document.createElement('div');
            scoreAddition.className = 'score-addition';
            scoreAddition.textContent = '+' + scoreDiff;
            this.scoreDisplay.parentNode.appendChild(scoreAddition);
            
            // Remove the element after animation
            setTimeout(() => {
                scoreAddition.remove();
            }, 500);
        }
        
        this.scoreDisplay.textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreDisplay.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
            
            // Add celebration animation
            this.bestScoreDisplay.classList.add('best-score-updated');
            setTimeout(() => {
                this.bestScoreDisplay.classList.remove('best-score-updated');
            }, 500);
        }
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if (
                    (i < 3 && current === this.grid[i + 1][j]) ||
                    (j < 3 && current === this.grid[i][j + 1])
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    isWin() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 2048) return true;
            }
        }
        return false;
    }

    handleGameOver() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>Game Over!</h2>
                <p>Your score: ${this.score}</p>
                <p class="final-score">${this.score === this.bestScore ? 'New Best Score!' : `Best score: ${this.bestScore}`}</p>
                <button onclick="this.parentElement.parentElement.remove(); game.resetGame();">Try Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add fade-in animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    handleWin() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over win';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>You Win! 🎉</h2>
                <p>Congratulations!</p>
                <p class="final-score">Score: ${this.score}</p>
                <p class="achievement">You reached 2048!</p>
                <button onclick="this.parentElement.parentElement.remove(); game.resetGame();">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add confetti animation
        this.createConfetti();
        
        // Animate overlay appearing
        gsap.fromTo(overlay, 
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        
        // Animate content sliding up
        const content = overlay.querySelector('.game-over-content');
        gsap.fromTo(content,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
    }

    createConfetti() {
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }

    resetGame() {
        // Show menu again
        this.container.style.display = 'none';
        this.gameMenu.style.display = 'flex';
        gsap.fromTo(this.gameMenu,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out" }
        );

        // Update best score in menu
        this.menuBestScore.textContent = this.bestScore;
        
        // Reset animation states
        this.animationInProgress = false;
        this.previousState = null;
        this.mergedTiles = [];
        this.movedTiles = [];
        this.newTiles = [];
    }
}

// Add this CSS class for ghost tiles used in merge animations
// You'll need to add this to your CSS file
/*
.tile.ghost {
    opacity: 0.8;
    z-index: 1;
}
*/

// Start the game
const game = new Game2048();