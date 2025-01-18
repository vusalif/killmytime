// Initialize Supabase client
const { createClient } = supabase;
const supabaseUrl = 'https://dvijohdoaatticeimjxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWpvaGRvYWF0dGljZWltanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjU3NzYsImV4cCI6MjA1MDU0MTc3Nn0.x45HY9ONbAtWFR2UuobkoKDcABgG834Nd-ay9tBInic';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Create the maze_scores table if it doesn't exist
async function initializeDatabase() {
    try {
        // Check if table exists by trying to select from it
        const { error: checkError } = await supabaseClient
            .from('maze_scores')
            .select('id')
            .limit(1);

        if (checkError) {
            console.error('Error checking table:', checkError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

class CursorMaze {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.time = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.speed = 0.5;
        this.mazeWidth = 600;
        this.mazeHeight = 800;
        this.cellSize = 40;
        this.maze = [];
        this.playerPos = { x: 0, y: 0 };
        this.scrollOffset = 0;
        this.lastTime = 0;
        this.timeCounter = 0;
        this.prepPhase = false;
        this.prepTimer = 2000;
        this.level = 1;
        this.obstacleChance = 0.15;
        this.speedIncreaseRate = 0.02;
        this.initialClearRows = 15;
        this.countryFlags = {}; // Store country to flag emoji mappings
        this.countryCode = ''; // Store country code

        // Initialize canvas size
        this.canvas.width = this.mazeWidth;
        this.canvas.height = this.mazeHeight;

        // UI elements
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.startButton = document.getElementById('startButton');
        this.startScreen = document.getElementById('startScreen');
        this.startGameButton = document.getElementById('startGameButton');
        this.nameInput = document.getElementById('nameInput');
        this.submitNameButton = document.getElementById('submitName');
        this.welcomeBack = document.getElementById('welcomeBack');
        this.savedPlayerName = document.getElementById('savedPlayerName');
        this.leaderboardContent = document.getElementById('leaderboardContent');

        // Add new properties for player info
        this.playerName = localStorage.getItem('playerName') || '';
        this.playerCountry = '';

        // Event listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.startButton.addEventListener('click', this.restart.bind(this));
        this.startGameButton.addEventListener('click', this.startGame.bind(this));
        this.submitNameButton.addEventListener('click', this.submitName.bind(this));
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchLeaderboardTab(tab.dataset.tab));
        });

        // Hide all screens initially
        this.startScreen.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        this.nameInput.style.display = 'none';

        // Initialize the game
        this.initializeGame();
    }

    async initializeGame() {
        // Initialize database
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            console.warn('Database initialization failed. Leaderboard functionality may be limited.');
        }

        // Get player's country and load leaderboard
        await this.getPlayerCountry();
        await this.loadLeaderboard('global');

        // Show appropriate screen based on whether we have a player name
        if (this.playerName) {
            this.welcomeBack.style.display = 'block';
            this.savedPlayerName.textContent = this.playerName;
            this.startScreen.style.display = 'block';
            this.nameInput.style.display = 'none';
        } else {
            this.startScreen.style.display = 'none';
            this.nameInput.style.display = 'block';
            this.welcomeBack.style.display = 'none';
        }

        // Start game loop
        this.gameLoop(0);
    }

    async getPlayerCountry() {
        try {
            // First try using ipdata.co (you need to sign up for a free API key)
            const API_KEY = 'c6d4d5d3f2a1b7e77d4c2b43'; // Replace with your API key from ipdata.co
            const response = await fetch(`https://api.ipdata.co?api-key=${API_KEY}`);
            const data = await response.json();
            
            if (data.country_name && data.country_code) {
                this.playerCountry = data.country_name;
                this.countryCode = data.country_code.toLowerCase();
                return;
            }

            // Fallback to ip-api.com if ipdata fails
            const fallbackResponse = await fetch('http://ip-api.com/json/');
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.status === 'success') {
                this.playerCountry = fallbackData.country;
                this.countryCode = fallbackData.countryCode.toLowerCase();
            } else {
                throw new Error('Could not detect country');
            }
        } catch (error) {
            console.error('Error getting country:', error);
            // Use geolocation API as a last resort
            try {
                const position = await this.getCurrentPosition();
                const reverseGeocode = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                );
                const geoData = await reverseGeocode.json();
                
                if (geoData.address && geoData.address.country_code) {
                    this.playerCountry = geoData.address.country;
                    this.countryCode = geoData.address.country_code.toLowerCase();
                } else {
                    throw new Error('Could not detect country from geolocation');
                }
            } catch (geoError) {
                console.error('Geolocation error:', geoError);
                // Set default values if all methods fail
                this.playerCountry = 'Unknown';
                this.countryCode = 'xx';
            }
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    }

    async getCountryFlag(countryCode) {
        if (!countryCode) return '🌐';
        
        // Convert country code to flag emoji
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        
        return String.fromCodePoint(...codePoints);
    }

    init() {
        this.gameOver = false;
        this.gameStarted = false;
        this.score = 0;
        this.time = 0;
        this.speed = 0.5;
        this.scrollOffset = 0;
        this.level = 1;
        this.obstacleChance = 0.15;
        this.speedIncreaseRate = 0.02;
        this.initialClearRows = 15;
        this.maze = this.generateEmptyMaze();
        this.gameOverElement.style.display = 'none';
        this.prepPhase = false;
        this.prepTimer = 2000;
        this.updateUI();

        // Show appropriate screen
        if (this.playerName) {
            this.startScreen.style.display = 'block';
            this.nameInput.style.display = 'none';
            this.welcomeBack.style.display = 'block';
            this.savedPlayerName.textContent = this.playerName;
        } else {
            this.startScreen.style.display = 'none';
            this.nameInput.style.display = 'block';
            this.welcomeBack.style.display = 'none';
        }
    }

    updateDifficulty() {
        // Increase difficulty based on score
        const scoreThresholds = [500, 1000, 2000, 3500, 5000, 7500, 10000];
        const newLevel = scoreThresholds.findIndex(threshold => this.score < threshold) + 1;
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            // Gradually increase obstacle chance (max 0.35)
            this.obstacleChance = Math.min(0.15 + (this.level - 1) * 0.03, 0.35);
            // Gradually increase speed increase rate (max 0.15)
            this.speedIncreaseRate = Math.min(0.02 + (this.level - 1) * 0.01, 0.15);
        }
    }

    startGame() {
        this.gameStarted = true;
        this.prepPhase = true;
        this.startScreen.style.display = 'none';
        this.maze = this.generateEmptyMaze();
    }

    generateEmptyMaze() {
        const rows = Math.ceil(this.mazeHeight / this.cellSize) + 1;
        const cols = Math.ceil(this.mazeWidth / this.cellSize);
        let maze = [];

        for (let i = 0; i < rows; i++) {
            maze.push(Array(cols).fill(0));
        }
        return maze;
    }

    generateMaze() {
        const rows = Math.ceil(this.mazeHeight / this.cellSize) + 1;
        const cols = Math.ceil(this.mazeWidth / this.cellSize);
        let maze = [];

        // Keep top rows clear at the start of the game
        if (this.time < 5) { // Changed from 10 to 5 seconds
            const clearRows = Math.max(this.initialClearRows - Math.floor(this.time), 0);
            for (let i = 0; i < clearRows; i++) {
                maze.push(Array(cols).fill(0));
            }
            return maze;
        }

        for (let i = 0; i < rows; i++) {
            let row = [];
            let obstaclesInRow = 0;
            const maxObstaclesPerRow = Math.floor(cols * 0.5);

            // Gradually introduce obstacles based on time
            let currentObstacleChance = this.obstacleChance;
            if (this.time < 20) {
                currentObstacleChance *= (this.time / 20);
            }

            for (let j = 0; j < cols; j++) {
                if (Math.random() < currentObstacleChance && obstaclesInRow < maxObstaclesPerRow) {
                    row.push(1);
                    obstaclesInRow++;
                } else {
                    row.push(0);
                }
            }

            // Ensure at least two paths exist
            if (obstaclesInRow > cols - 2) {
                const gap1 = Math.floor(Math.random() * cols);
                let gap2;
                do {
                    gap2 = Math.floor(Math.random() * cols);
                } while (Math.abs(gap2 - gap1) < 2);
                row[gap1] = 0;
                row[gap2] = 0;
            }

            maze.push(row);
        }

        return maze;
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.playerPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    checkCollision() {
        if (!this.gameStarted || this.prepPhase) return false;
        
        const cellX = Math.floor(this.playerPos.x / this.cellSize);
        const cellY = Math.floor((this.playerPos.y + this.scrollOffset) / this.cellSize);

        if (cellX < 0 || cellX >= this.maze[0].length || 
            cellY < 0 || cellY >= this.maze.length) {
            return true;
        }

        return this.maze[cellY][cellX] === 1;
    }

    update(deltaTime) {
        if (this.gameOver || !this.gameStarted) return;

        if (this.prepPhase) {
            this.prepTimer -= deltaTime;
            if (this.prepTimer <= 0) {
                this.prepPhase = false;
                this.maze = this.generateMaze();
            }
            return;
        }

        // Update scroll position
        this.scrollOffset += this.speed;
        this.timeCounter += deltaTime;

        // Update time every second
        if (this.timeCounter >= 1000) {
            this.time++;
            this.timeCounter = 0;
            // Only start increasing speed after 5 seconds (changed from 10)
            if (this.time > 5) {
                this.speed += this.speedIncreaseRate;
            }
            this.score += 10 + Math.floor(this.level * 2);
            this.updateDifficulty();
            this.updateUI();
        }

        // Generate new maze section when needed
        if (this.scrollOffset >= this.cellSize) {
            this.maze.shift();
            this.maze.push(this.generateMaze()[0]);
            this.scrollOffset = 0;
        }

        // Check for collision
        if (this.checkCollision()) {
            this.endGame();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.gameStarted) return;

        // Draw maze
        for (let i = 0; i < this.maze.length; i++) {
            for (let j = 0; j < this.maze[i].length; j++) {
                if (this.maze[i][j] === 1) {
                    const hue = (this.level - 1) * 30;
                    this.ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
                    this.ctx.fillRect(
                        j * this.cellSize,
                        i * this.cellSize - this.scrollOffset,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // Draw player cursor
        this.ctx.beginPath();
        this.ctx.arc(this.playerPos.x, this.playerPos.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
        this.ctx.closePath();

        // Draw preparation countdown
        if (this.prepPhase) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Get Ready! ${Math.ceil(this.prepTimer / 1000)}`,
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }

        // Draw current level
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Level ${this.level}`,
            this.canvas.width - 20,
            30
        );
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.timeElement.textContent = this.time;
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        this.saveScore(); // Save score when game ends
    }

    restart() {
        this.init();
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    submitName() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();
        if (name.length >= 2) {
            this.playerName = name;
            localStorage.setItem('playerName', name);
            this.nameInput.style.display = 'none';
            this.startScreen.style.display = 'block';
            this.welcomeBack.style.display = 'block';
            this.savedPlayerName.textContent = name;
        } else {
            alert('Please enter a name with at least 2 characters');
        }
    }

    async saveScore() {
        if (!this.playerName || !this.score) return;

        try {
            const scoreData = {
                player_name: this.playerName,
                score: this.score,
                country: this.playerCountry || 'Unknown',
                time_played: this.time
            };

            const { error } = await supabaseClient
                .from('maze_scores')
                .insert(scoreData);

            if (error) {
                console.error('Error details:', error);
                throw error;
            }
            
            await this.loadLeaderboard('global');
        } catch (error) {
            console.error('Error saving score:', error);
            this.showErrorMessage('Failed to save score. Please try again.');
        }
    }

    async loadLeaderboard(type = 'global') {
        try {
            let query = supabaseClient
                .from('maze_scores')
                .select('id, player_name, score, country, time_played')
                .order('score', { ascending: false })
                .limit(10);

            if (type === 'country' && this.playerCountry !== 'Unknown') {
                query = query.eq('country', this.playerCountry);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error details:', error);
                throw error;
            }

            // Update leaderboard UI
            this.updateLeaderboardUI(data || [], type);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.updateLeaderboardUI([], type);
            this.showErrorMessage('Failed to load leaderboard. Please try again.');
        }
    }

    updateLeaderboardUI(scores, type) {
        const title = type === 'global' ? 'Global Top 10' : `Top 10 in ${this.playerCountry}`;
        let html = `<h3>${title}</h3>`;
        
        scores.forEach((score, index) => {
            let countryCode = 'xx';
            
            // Try to get the correct country code
            if (score.country && score.country !== 'Unknown') {
                // Map of common country names to ISO codes
                const countryMap = {
                    'United States': 'us',
                    'USA': 'us',
                    'United Kingdom': 'gb',
                    'UK': 'gb',
                    // Add more mappings as needed
                };
                
                countryCode = countryMap[score.country] || 
                             score.country_code?.toLowerCase() || 
                             score.country.slice(0, 2).toLowerCase();
            }

            const flagUrl = `https://flagcdn.com/16x12/${countryCode}.png`;
            
            html += `
                <div class="leaderboard-entry">
                    <span>#${index + 1}</span>
                    <span><img src="${flagUrl}" alt="${score.country} flag - Maze Game Player Country" title="${score.country}"></span>
                    <span>${score.player_name}</span>
                    <span>${score.score}</span>
                </div>
            `;
        });

        if (scores.length === 0) {
            html += '<div class="leaderboard-entry">No scores yet</div>';
        }

        this.leaderboardContent.innerHTML = html;
    }

    switchLeaderboardTab(tab) {
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.loadLeaderboard(tab);
    }

    showErrorMessage(message) {
        // Create or update error message element
        let errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorMessage';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Hide message after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Start the game when the page loads
window.onload = () => {
    new CursorMaze();
}; 