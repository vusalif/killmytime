// Game constants
const GRID_SIZE = 30;
const SNAKE_INITIAL_LENGTH = 4;
const SNAKE_SPEED = 150; // ms between moves
const GLOW_DURATION = 1000; // ms
let CELL_SIZE;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverModal = document.getElementById('gameOver');
const playerInfoModal = document.getElementById('playerInfo');
const finalScoreElement = document.getElementById('finalScore');
const leaderboardEntriesElement = document.getElementById('leaderboard-entries');

// Country name mapping
const COUNTRY_NAMES = {
        'AF': 'Afghanistan',
        'AL': 'Albania',
        'DZ': 'Algeria',
        'AD': 'Andorra',
        'AO': 'Angola',
        'AG': 'Antigua and Barbuda',
        'AR': 'Argentina',
        'AM': 'Armenia',
        'AU': 'Australia',
        'AT': 'Austria',
        'AZ': 'Azerbaijan',
        'BS': 'Bahamas',
        'BH': 'Bahrain',
        'BD': 'Bangladesh',
        'BB': 'Barbados',
        'BY': 'Belarus',
        'BE': 'Belgium',
        'BZ': 'Belize',
        'BJ': 'Benin',
        'BT': 'Bhutan',
        'BO': 'Bolivia',
        'BA': 'Bosnia and Herzegovina',
        'BW': 'Botswana',
        'BR': 'Brazil',
        'BN': 'Brunei',
        'BG': 'Bulgaria',
        'BF': 'Burkina Faso',
        'BI': 'Burundi',
        'CV': 'Cabo Verde',
        'KH': 'Cambodia',
        'CM': 'Cameroon',
        'CA': 'Canada',
        'CF': 'Central African Republic',
        'TD': 'Chad',
        'CL': 'Chile',
        'CN': 'China',
        'CO': 'Colombia',
        'KM': 'Comoros',
        'CG': 'Congo (Brazzaville)',
        'CD': 'Congo (Kinshasa)',
        'CR': 'Costa Rica',
        'CI': 'Côte d’Ivoire',
        'HR': 'Croatia',
        'CU': 'Cuba',
        'CY': 'Cyprus',
        'CZ': 'Czechia',
        'DK': 'Denmark',
        'DJ': 'Djibouti',
        'DM': 'Dominica',
        'DO': 'Dominican Republic',
        'EC': 'Ecuador',
        'EG': 'Egypt',
        'SV': 'El Salvador',
        'GQ': 'Equatorial Guinea',
        'ER': 'Eritrea',
        'EE': 'Estonia',
        'SZ': 'Eswatini',
        'ET': 'Ethiopia',
        'FJ': 'Fiji',
        'FI': 'Finland',
        'FR': 'France',
        'GA': 'Gabon',
        'GM': 'Gambia',
        'GE': 'Georgia',
        'DE': 'Germany',
        'GH': 'Ghana',
        'GR': 'Greece',
        'GD': 'Grenada',
        'GT': 'Guatemala',
        'GN': 'Guinea',
        'GW': 'Guinea-Bissau',
        'GY': 'Guyana',
        'HT': 'Haiti',
        'HN': 'Honduras',
        'HU': 'Hungary',
        'IS': 'Iceland',
        'IN': 'India',
        'ID': 'Indonesia',
        'IR': 'Iran',
        'IQ': 'Iraq',
        'IE': 'Ireland',
        'IL': 'Israel',
        'IT': 'Italy',
        'JM': 'Jamaica',
        'JP': 'Japan',
        'JO': 'Jordan',
        'KZ': 'Kazakhstan',
        'KE': 'Kenya',
        'KI': 'Kiribati',
        'KP': 'North Korea',
        'KR': 'South Korea',
        'KW': 'Kuwait',
        'KG': 'Kyrgyzstan',
        'LA': 'Laos',
        'LV': 'Latvia',
        'LB': 'Lebanon',
        'LS': 'Lesotho',
        'LR': 'Liberia',
        'LY': 'Libya',
        'LI': 'Liechtenstein',
        'LT': 'Lithuania',
        'LU': 'Luxembourg',
        'MG': 'Madagascar',
        'MW': 'Malawi',
        'MY': 'Malaysia',
        'MV': 'Maldives',
        'ML': 'Mali',
        'MT': 'Malta',
        'MH': 'Marshall Islands',
        'MR': 'Mauritania',
        'MU': 'Mauritius',
        'MX': 'Mexico',
        'FM': 'Micronesia',
        'MD': 'Moldova',
        'MC': 'Monaco',
        'MN': 'Mongolia',
        'ME': 'Montenegro',
        'MA': 'Morocco',
        'MZ': 'Mozambique',
        'MM': 'Myanmar (Burma)',
        'NA': 'Namibia',
        'NR': 'Nauru',
        'NP': 'Nepal',
        'NL': 'Netherlands',
        'NZ': 'New Zealand',
        'NI': 'Nicaragua',
        'NE': 'Niger',
        'NG': 'Nigeria',
        'MK': 'North Macedonia',
        'NO': 'Norway',
        'OM': 'Oman',
        'PK': 'Pakistan',
        'PW': 'Palau',
        'PA': 'Panama',
        'PG': 'Papua New Guinea',
        'PY': 'Paraguay',
        'PE': 'Peru',
        'PH': 'Philippines',
        'PL': 'Poland',
        'PT': 'Portugal',
        'QA': 'Qatar',
        'RO': 'Romania',
        'RU': 'Russia',
        'RW': 'Rwanda',
        'KN': 'Saint Kitts and Nevis',
        'LC': 'Saint Lucia',
        'VC': 'Saint Vincent and the Grenadines',
        'WS': 'Samoa',
        'SM': 'San Marino',
        'ST': 'São Tomé and Príncipe',
        'SA': 'Saudi Arabia',
        'SN': 'Senegal',
        'RS': 'Serbia',
        'SC': 'Seychelles',
        'SL': 'Sierra Leone',
        'SG': 'Singapore',
        'SK': 'Slovakia',
        'SI': 'Slovenia',
        'SB': 'Solomon Islands',
        'SO': 'Somalia',
        'ZA': 'South Africa',
        'SS': 'South Sudan',
        'ES': 'Spain',
        'LK': 'Sri Lanka',
        'SD': 'Sudan',
        'SR': 'Suriname',
        'SE': 'Sweden',
        'CH': 'Switzerland',
        'SY': 'Syria',
        'TJ': 'Tajikistan',
        'TZ': 'Tanzania',
        'TH': 'Thailand',
        'TL': 'Timor-Leste',
        'TG': 'Togo',
        'TO': 'Tonga',
        'TT': 'Trinidad and Tobago',
        'TN': 'Tunisia',
        'TR': 'Türkiye',
        'TM': 'Turkmenistan',
        'TV': 'Tuvalu',
        'UG': 'Uganda',
        'UA': 'Ukraine',
        'AE': 'United Arab Emirates',
        'GB': 'United Kingdom',
        'US': 'United States',
        'UY': 'Uruguay',
        'UZ': 'Uzbekistan',
        'VU': 'Vanuatu',
        'VA': 'Vatican City',
        'VE': 'Venezuela',
        'VN': 'Vietnam',
        'YE': 'Yemen',
        'ZM': 'Zambia',
        'ZW': 'Zimbabwe',
        'UN': 'Unknown'
};

// Game state
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let deadlyTrap = { x: -1, y: -1 };
let penaltyTrap = { x: -1, y: -1 };
let speedTrap = { x: -1, y: -1 }; // New speed reduction trap
let powerUp = { x: -1, y: -1 }; // Helpful item
let score = 0;
let rainbow = 0;
let glowIntensity = 0;
let glowIncreasing = true;
let snakeGlowStart = 0;
let isSnakeGlowing = false;
let gameActive = true;
let isSubmitting = false;
let currentSortType = 'score';
let trapOpacity = 1;
let trapFading = false;
let pointLossText = null;
let lastTrapUpdate = 0;
let gameSpeed = SNAKE_SPEED;
let speedEffectEnd = 0;
let powerUpActive = false;
let powerUpEnd = 0;

// Player info
let playerName = '';
let playerCountry = '';

// Set canvas to full window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CELL_SIZE = Math.min(canvas.width, canvas.height) / GRID_SIZE;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Get player's country
function getSelectedCountry() {
    const countrySelect = document.getElementById('countrySelect');
    const selectedValue = countrySelect ? countrySelect.value : '';
    return selectedValue || 'UN';
}

// Start game with player info
async function startGame() {
    const nameInput = document.getElementById('initialPlayerName');
    if (!nameInput) return;
    
    playerName = nameInput.value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    // Get country from dropdown and validate
    playerCountry = getSelectedCountry();
    if (!playerCountry || playerCountry === '') {
        alert('Please select your country for the leaderboard!');
        return;
    }
    
    // Reset game state
    snake = [];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = { x: 0, y: 0 };
    deadlyTrap = { x: -1, y: -1 };
    penaltyTrap = { x: -1, y: -1 };
    speedTrap = { x: -1, y: -1 };
    powerUp = { x: -1, y: -1 };
    score = 0;
    gameSpeed = SNAKE_SPEED;
    speedEffectEnd = 0;
    powerUpActive = false;
    powerUpEnd = 0;
    gameActive = true;
    
    // Hide the player info modal
    playerInfoModal.style.display = 'none';
    
    // Initialize snake position
    const startX = Math.floor(GRID_SIZE / 4);
    const startY = Math.floor(GRID_SIZE / 2);
    
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    
    // Place initial food
    placeFood();
    updateScore();
    
    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Start game loop
    gameInterval = setInterval(gameLoop, SNAKE_SPEED);
}

// Initialize database
async function initializeDatabase() {
    try {
        const { error } = await window.supabaseClient.rpc('initialize_snake_game');
        if (error) throw error;
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Leaderboard functions
async function fetchLeaderboard() {
    try {
        let query = window.supabaseClient
            .from('snake_scores')
            .select('*');

        if (currentSortType === 'score') {
            query = query.order('score', { ascending: false }).limit(10);
        } else {
            // For country view, we'll get more data and process it
            query = query.order('score', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;

        let displayData = data;
        if (currentSortType === 'country') {
            // Group by country and calculate total points
            const countryStats = {};
            data.forEach(entry => {
                if (!countryStats[entry.country_code]) {
                    countryStats[entry.country_code] = {
                        country_code: entry.country_code,
                        total_score: 0,
                        best_score: 0,
                        player_count: 0
                    };
                }
                countryStats[entry.country_code].total_score += entry.score;
                countryStats[entry.country_code].best_score = Math.max(
                    countryStats[entry.country_code].best_score, 
                    entry.score
                );
                countryStats[entry.country_code].player_count++;
            });
            
            displayData = Object.values(countryStats)
                .sort((a, b) => b.total_score - a.total_score)
                .slice(0, 10);
        }

        leaderboardEntriesElement.innerHTML = displayData
            .map((entry, index) => {
                if (currentSortType === 'score') {
                    return `
                        <div class="leaderboard-entry">
                            <div class="player-info">
                                <span>${index + 1}.</span>
                                <img class="country-flag" 
                                     src="https://flagcdn.com/w40/${entry.country_code.toLowerCase()}.png"
                                     alt="${entry.country_code} flag - Modern Snake Game Player Ranking"
                                     title="${entry.country_code}">
                                <span>${entry.player_name}</span>
                            </div>
                            <span class="player-score">${entry.score}</span>
                        </div>
                    `;
                } else {
                    // Country view
                    return `
                        <div class="leaderboard-entry">
                            <div class="player-info">
                                <span>${index + 1}.</span>
                                <img class="country-flag" 
                                     src="https://flagcdn.com/w40/${entry.country_code.toLowerCase()}.png"
                                     alt="${entry.country_code} flag - Modern Snake Game Country Statistics"
                                     title="${entry.country_code}">
                                <span>${COUNTRY_NAMES[entry.country_code] || entry.country_code}</span>
                            </div>
                            <div class="country-stats">
                                <span class="player-score">${entry.total_score} pts</span>
                                <span class="player-count">(${entry.player_count} players)</span>
                            </div>
                        </div>
                    `;
                }
            })
            .join('');
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

function setSortType(type) {
    currentSortType = type;
    // Update button styles
    document.querySelectorAll('.sort-button').forEach(button => {
        button.classList.toggle('active', 
            button.getAttribute('onclick').includes(type));
    });
    fetchLeaderboard();
}

async function submitScore() {
    if (!playerName || isSubmitting) {
        return;
    }

    try {
        isSubmitting = true;
        const submitButton = document.querySelector('button[onclick="submitScore()"]');
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.textContent = 'Submitting...';

        const { error } = await window.supabaseClient
            .from('snake_scores')
            .insert([
                { 
                    player_name: playerName,
                    score: score,
                    country_code: playerCountry
                }
            ]);

        if (error) throw error;

        await fetchLeaderboard();
        gameOverModal.style.display = 'none';
        initGame();
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Error submitting score. Please try again.');
    } finally {
        isSubmitting = false;
        // No need to reset button state as we're starting a new game
    }
}

function restartGame() {
    gameOverModal.style.display = 'none';
    initGame();
}

// Initialize snake
function initGame() {
    if (!playerName) {
        playerInfoModal.style.display = 'block';
        gameActive = false;
        return;
    }

    // Reset game state
    snake = [];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = { x: 0, y: 0 };
    deadlyTrap = { x: -1, y: -1 };
    penaltyTrap = { x: -1, y: -1 };
    speedTrap = { x: -1, y: -1 };
    powerUp = { x: -1, y: -1 };
    score = 0;
    gameSpeed = SNAKE_SPEED;
    speedEffectEnd = 0;
    powerUpActive = false;
    powerUpEnd = 0;
    gameActive = true;
    
    // Initialize snake position
    const startX = Math.floor(GRID_SIZE / 4);
    const startY = Math.floor(GRID_SIZE / 2);
    
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    
    placeFood();
    updateScore();
    
    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Start game loop
    gameInterval = setInterval(gameLoop, SNAKE_SPEED);
}

function updateScore() {
    scoreElement.textContent = `SCORE: ${score}`;
}

function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverModal.style.display = 'block';
}

// Place food in random position
function placeFood() {
    do {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Draw grid
function drawGrid() {
    // Draw grid with glowing effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 2;
    
    // Draw vertical lines
    for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
    }
    
    // Reset shadow effect
    ctx.shadowBlur = 0;
}

// Draw snake
function drawSnake() {
    const currentTime = Date.now();
    const glowProgress = isSnakeGlowing ? 
        Math.max(0, 1 - (currentTime - snakeGlowStart) / GLOW_DURATION) : 0;
    
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Snake head with glow effect
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'white';
        } else {
            // Rainbow body with conditional glow
            const hue = (rainbow + index * 15) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            if (isSnakeGlowing) {
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 20 * glowProgress;
            } else {
                ctx.shadowBlur = 0;
            }
        }
        
        ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Update glow state
    if (isSnakeGlowing && currentTime - snakeGlowStart >= GLOW_DURATION) {
        isSnakeGlowing = false;
    }
}

// Update glow effect
function updateGlow() {
    if (glowIncreasing) {
        glowIntensity += 0.7;
        if (glowIntensity >= 30) {
            glowIncreasing = false;
        }
    } else {
        glowIntensity -= 0.7;
        if (glowIntensity <= 5) {
            glowIncreasing = true;
        }
    }
}

// Draw food
function drawFood() {
    // Update glow effect
    updateGlow();
    
    // Draw yellow square with pulsing glow
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = glowIntensity;
    ctx.fillStyle = 'yellow';
    
    const foodSize = CELL_SIZE - 4;
    ctx.fillRect(
        food.x * CELL_SIZE + (CELL_SIZE - foodSize) / 2,
        food.y * CELL_SIZE + (CELL_SIZE - foodSize) / 2,
        foodSize,
        foodSize
    );
    
    ctx.shadowBlur = 0;
}

// Notification animation class
class NotificationText {
    constructor(text, x, y, color = '#ff4444') {
        this.text = text;
        this.x = x;
        this.y = y;
        this.opacity = 1;
        this.scale = 1;
        this.startTime = Date.now();
        this.duration = 1500; // 1.5 seconds
        this.color = color;
    }

    draw(ctx) {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        this.opacity = 1 - progress;
        this.scale = 1 + progress * 0.5;
        this.y -= progress * 50; // Float upward
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = `${24 * this.scale}px Geo`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
        
        return progress < 1; // Return false when animation is complete
    }
}

// Place traps and power-ups
function placeTraps() {
    const currentTime = Date.now();
    
    // Only update every 12 seconds (increased from 8)
    if (currentTime - lastTrapUpdate < 12000) return;
    lastTrapUpdate = currentTime;
    
    // Quick fade out
    trapFading = true;
    trapOpacity = 0;
    
    setTimeout(() => {
        // Reset all traps and power-ups
        deadlyTrap = { x: -1, y: -1 };
        penaltyTrap = { x: -1, y: -1 };
        speedTrap = { x: -1, y: -1 };
        powerUp = { x: -1, y: -1 };
        
        // Determine which items to show based on score and randomness
        const showDeadly = score >= 30 && Math.random() < 0.2; // 20% chance after 30 points (reduced from 30%)
        const showPenalty = score >= 20 && Math.random() < 0.25; // 25% chance after 20 points (reduced from 40%)
        const showSpeed = score >= 25 && Math.random() < 0.2; // 20% chance after 25 points (reduced from 30%)
        const showPowerUp = score >= 15 && Math.random() < 0.3; // 30% chance after 15 points (reduced from 50%)
        
        const availablePositions = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!snake.some(segment => segment.x === x && segment.y === y) &&
                    food.x !== x && food.y !== y) {
                    availablePositions.push({ x, y });
                }
            }
        }
        
        // Shuffle available positions
        for (let i = availablePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePositions[i], availablePositions[j]] = 
            [availablePositions[j], availablePositions[i]];
        }
        
        let posIndex = 0;
        
        if (showDeadly && posIndex < availablePositions.length) {
            deadlyTrap = availablePositions[posIndex++];
        }
        
        if (showPenalty && posIndex < availablePositions.length) {
            penaltyTrap = availablePositions[posIndex++];
        }
        
        if (showSpeed && posIndex < availablePositions.length) {
            speedTrap = availablePositions[posIndex++];
        }
        
        if (showPowerUp && posIndex < availablePositions.length) {
            powerUp = availablePositions[posIndex++];
        }
        
        // Quick fade in
        trapFading = false;
        trapOpacity = 1;
    }, 100);
}

// Draw traps and power-ups
function drawTraps() {
    // Update opacity instantly for smoother transitions
    trapOpacity = trapFading ? 0 : 1;
    
    // Draw deadly trap (red square)
    if (deadlyTrap.x >= 0 && deadlyTrap.y >= 0) {
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 0, 0, ${trapOpacity})`;
        const trapSize = CELL_SIZE - 8;
        ctx.fillRect(
            deadlyTrap.x * CELL_SIZE + (CELL_SIZE - trapSize) / 2,
            deadlyTrap.y * CELL_SIZE + (CELL_SIZE - trapSize) / 2,
            trapSize,
            trapSize
        );
    }
    
    // Draw penalty trap (purple circle)
    if (penaltyTrap.x >= 0 && penaltyTrap.y >= 0) {
        ctx.shadowColor = 'purple';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(128, 0, 128, ${trapOpacity})`;
        const trapSize = CELL_SIZE - 8;
        ctx.beginPath();
        ctx.arc(
            penaltyTrap.x * CELL_SIZE + CELL_SIZE / 2,
            penaltyTrap.y * CELL_SIZE + CELL_SIZE / 2,
            trapSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw speed trap (blue triangle)
    if (speedTrap.x >= 0 && speedTrap.y >= 0) {
        ctx.shadowColor = 'blue';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 0, 255, ${trapOpacity})`;
        const trapSize = CELL_SIZE - 8;
        ctx.beginPath();
        ctx.moveTo(
            speedTrap.x * CELL_SIZE + CELL_SIZE / 2,
            speedTrap.y * CELL_SIZE + (CELL_SIZE - trapSize) / 2
        );
        ctx.lineTo(
            speedTrap.x * CELL_SIZE + (CELL_SIZE + trapSize) / 2,
            speedTrap.y * CELL_SIZE + (CELL_SIZE + trapSize) / 2
        );
        ctx.lineTo(
            speedTrap.x * CELL_SIZE + (CELL_SIZE - trapSize) / 2,
            speedTrap.y * CELL_SIZE + (CELL_SIZE + trapSize) / 2
        );
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw power-up (green star)
    if (powerUp.x >= 0 && powerUp.y >= 0) {
        ctx.shadowColor = 'lime';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 255, 0, ${trapOpacity})`;
        const starSize = CELL_SIZE - 8;
        drawStar(
            powerUp.x * CELL_SIZE + CELL_SIZE / 2,
            powerUp.y * CELL_SIZE + CELL_SIZE / 2,
            5,
            starSize / 2,
            starSize / 4
        );
    }
    
    ctx.shadowBlur = 0;
}

// Helper function to draw a star
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// Game loop
function gameLoop() {
    if (!gameActive || !snake || snake.length === 0) return;

    const currentTime = Date.now();
    
    // Add new head position
    const head = { x: snake[0].x + nextDirection.x, y: snake[0].y + nextDirection.y };
    
    // Check for collisions with walls
    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;
    
    // Check for collision with self (excluding the current head position)
    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        const screenX = (head.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (head.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        pointLossText = new NotificationText('GAME OVER!', screenX + CELL_SIZE/2, screenY, '#ff0000');
        setTimeout(() => gameOver(), 500);
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Update speed effects
    if (currentTime >= speedEffectEnd && gameSpeed !== SNAKE_SPEED) {
        gameSpeed = SNAKE_SPEED;
        updateGameSpeed();
        const screenX = (head.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (head.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        pointLossText = new NotificationText('Speed Normal', screenX + CELL_SIZE/2, screenY, '#4444ff');
    }
    
    // Update power-up effects
    if (currentTime >= powerUpEnd && powerUpActive) {
        powerUpActive = false;
        const screenX = (head.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (head.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        pointLossText = new NotificationText('Shield Deactivated', screenX + CELL_SIZE/2, screenY, '#44ff44');
    }
    
    // Check for collision with speed trap
    if (head.x === speedTrap.x && head.y === speedTrap.y) {
        gameSpeed = SNAKE_SPEED * 1.5; // 50% slower
        speedEffectEnd = currentTime + 5000; // 5 seconds
        const screenX = (speedTrap.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (speedTrap.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        speedTrap.x = -1;
        speedTrap.y = -1;
        updateGameSpeed();
        pointLossText = new NotificationText('Speed Reduced!', screenX + CELL_SIZE/2, screenY, '#4444ff');
    }
    
    // Check for collision with power-up
    if (head.x === powerUp.x && head.y === powerUp.y) {
        score += 5; // Bonus points
        powerUpActive = true;
        powerUpEnd = currentTime + 8000; // 8 seconds of invulnerability
        const screenX = (powerUp.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (powerUp.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        powerUp.x = -1;
        powerUp.y = -1;
        updateScore();
        pointLossText = new NotificationText('+5 Shield Active!', screenX + CELL_SIZE/2, screenY, '#44ff44');
    }
    
    // Check for collision with deadly trap (only if not powered up)
    if (!powerUpActive && head.x === deadlyTrap.x && head.y === deadlyTrap.y) {
        const screenX = (deadlyTrap.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (deadlyTrap.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        pointLossText = new NotificationText('GAME OVER!', screenX + CELL_SIZE/2, screenY, '#ff0000');
        setTimeout(() => gameOver(), 500);
        return;
    }
    
    // Check for collision with penalty trap (reduced penalty if powered up)
    if (head.x === penaltyTrap.x && head.y === penaltyTrap.y) {
        const basePenalty = Math.min(10, Math.floor(Math.random() * 6) + 5);
        const penalty = powerUpActive ? Math.floor(basePenalty / 2) : basePenalty;
        score = Math.max(0, score - penalty);
        updateScore();
        const screenX = (penaltyTrap.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (penaltyTrap.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        penaltyTrap.x = -1;
        penaltyTrap.y = -1;
        
        const penaltyText = powerUpActive ? 
            `-${penalty} (Reduced)` : 
            `-${penalty} Points`;
        pointLossText = new NotificationText(penaltyText, screenX + CELL_SIZE/2, screenY, '#ff44ff');
    }
    
    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        const screenX = (food.x * CELL_SIZE) + (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const screenY = (food.y * CELL_SIZE) + (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        placeFood();
        placeTraps();
        isSnakeGlowing = true;
        snakeGlowStart = Date.now();
        pointLossText = new NotificationText('+1', screenX + CELL_SIZE/2, screenY, '#ffff44');
    } else {
        snake.pop();
    }
    
    // Update rainbow effect
    rainbow = (rainbow + 2) % 360;
    
    // Draw everything
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center the game grid
    ctx.save();
    ctx.translate(
        (canvas.width - GRID_SIZE * CELL_SIZE) / 2,
        (canvas.height - GRID_SIZE * CELL_SIZE) / 2
    );
    
    drawGrid();
    drawTraps();
    drawSnake();
    drawFood();
    
    ctx.restore();
    
    // Draw point loss animation if active
    if (pointLossText) {
        const isActive = pointLossText.draw(ctx);
        if (!isActive) {
            pointLossText = null;
        }
    }
    
    direction = { ...nextDirection };
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (!event || !event.key) return;
    
    const key = event.key.toLowerCase();
    
    if (key === 'arrowup' || key === 'w') {
        if (direction.y === 0) nextDirection = { x: 0, y: -1 };
    }
    else if (key === 'arrowdown' || key === 's') {
        if (direction.y === 0) nextDirection = { x: 0, y: 1 };
    }
    else if (key === 'arrowleft' || key === 'a') {
        if (direction.x === 0) nextDirection = { x: -1, y: 0 };
    }
    else if (key === 'arrowright' || key === 'd') {
        if (direction.x === 0) nextDirection = { x: 1, y: 0 };
    }
});

// Initialize everything
let gameInterval;

async function initializeGame() {
    try {
        await initializeDatabase();
        await fetchLeaderboard();
        initGame();
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        gameInterval = setInterval(gameLoop, SNAKE_SPEED);
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

initializeGame();

// Function to update game speed
function updateGameSpeed() {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
} 