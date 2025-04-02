# Modern 2048

A sleek and modern implementation of the classic 2048 puzzle game, featuring smooth animations, responsive design, and enhanced gameplay features.

Try it here: https://neo-2048.vercel.app/

![image](https://github.com/user-attachments/assets/b85a8651-aeb3-4d35-b38b-ed85634eab92)
![image](https://github.com/user-attachments/assets/d4164dcf-6588-4512-a519-169b75ae28a4)



## Features

- 🎮 Sleek modern UI with responsive design
- 🎭 Welcome menu with difficulty selection
- 🔢 Three difficulty levels with varying starting tiles
- 📱 Mobile-friendly with touch gesture support
- 💻 Desktop support with arrow key controls
- 🌊 Smooth tile animations with GSAP
- 🏆 Score tracking with best score persistence
- 🎯 Game over and win detection
- 🎉 Victory celebration with confetti animation
- 📋 "How to Play" instructions
- 💾 Game state persistence with localStorage

## How to Play

1. Use **arrow keys** (or swipe on mobile) to move all tiles on the grid in one direction
2. When two tiles with the same number touch, they **merge into one** with their combined value
3. After each move, a new tile with a value of 2 or 4 appears
4. Try to reach the **2048 tile** to win!

## Game Rules

- Tiles can only move in four directions: up, down, left, and right
- All tiles on the grid will move as far as possible in the chosen direction
- Two tiles with the same value will merge when they collide
- Each merge creates a new tile with the sum of the merged tiles
- The game is won when a tile with the value 2048 is created
- The game is over when no valid moves remain (grid is full with no possible merges)

## Difficulty Levels

- **Easy**: Starts with 2 tiles for a gentler introduction
- **Medium**: Starts with 3 tiles for a balanced challenge
- **Hard**: Starts with 4 tiles for experienced players

## Game Features

### Home Screen
- Clean, intuitive main menu
- Difficulty selection before starting game
- Best score display
- Quick access to how-to-play instructions

### Gameplay Enhancements
- Smooth sliding animations for tile movements
- Visual feedback for merging tiles
- Score updates with animated +points indicator
- Best score tracking with celebration animation
- Game state saved automatically
- Mobile-optimized touch controls

### Visual Feedback
- Tile colors change based on their values
- Responsive grid layout that adapts to screen size
- Animated score changes
- Victory/game over overlays with stats
- Confetti celebration animation for wins

## Technical Details

The game is built using vanilla JavaScript with GSAP for animations. It features:

- Object-oriented design with Game2048 class structure
- Modern CSS techniques:
  - CSS Grid for responsive layouts
  - Flexbox for component alignment
  - Transitions for smooth animations
- Browser storage API for saving preferences and scores
- Touch API for mobile gesture support
- Responsive design principles for all screen sizes

## Setup

1. Clone the repository:
```bash
git clone https://github.com/lazzerex/Neo2048.git
```

2. Open `index.html` in your browser or serve through a local web server

## Browser Support

The game works on all modern browsers that support:
- CSS Grid and Flexbox
- ES6+ JavaScript features
- Touch events for mobile play
- localStorage API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
