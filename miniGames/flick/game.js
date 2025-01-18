const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const flicksElement = document.getElementById('flicks');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const multiplierElement = document.getElementById('multiplier');
const comboElement = document.getElementById('combo');
const highestComboElement = document.getElementById('highestCombo');
const gameTimerElement = document.getElementById('gameTimer');

// Power-up elements and prices
const powerUpPrices = {
    guidedFlick: 300,
    explosiveFlick: 500,
    slowTime: 400,
    multiFlick: 600,
    buyFlicks: 1000,
    gun: 5000,  // Updated base price
    flickZone: 800
};

const powerUpLevels = {
    guidedFlick: 0,
    explosiveFlick: 0,
    slowTime: 0,
    multiFlick: 0,
    gun: 0,  // Add gun level tracking
    flickZone: 0
};

// Power-up scaling factors
const powerUpScaling = {
    guidedFlick: {
        price: 1.5,
        effect: 5,    // Additional trajectory points per level
        duration: 2   // Additional seconds per level
    },
    explosiveFlick: {
        price: 1.5,
        effect: 20,   // Additional explosion radius per level
        extraFlicks: 1 // Additional flicks after level 10
    },
    slowTime: {
        price: 1.5,
        effect: 1,    // Additional seconds per level
        slowFactor: 0.05 // Additional slowdown per level
    },
    multiFlick: {
        price: 1.5,
        effect: 0.5   // Additional spread per level
    }
};

const powerUpElements = {
    guidedFlick: document.getElementById('guidedFlick'),
    explosiveFlick: document.getElementById('explosiveFlick'),
    slowTime: document.getElementById('slowTime'),
    multiFlick: document.getElementById('multiFlick'),
    buyFlicks: document.getElementById('buyFlicks'),
    gun: document.getElementById('gun'),
    flickZone: document.getElementById('flickZone')
};

let score = 0;
let flicksLeft = 5;
let isDragging = false;
let startX, startY, currentX, currentY;
let isGameOver = false;
let currentMultiplier = 1;
let highestCombo = 1;
let timeScale = 1;
let gameOverTimer = null;

// Add gun state variables
let gunActive = false;
let remainingGunShots = 0;
let lastGunShot = 0;
let gunX = 0;
let gunY = 0;

// Power-up states
let powerUps = {
    guidedFlick: { active: false, uses: 0 },
    explosiveFlick: { active: false, uses: 0 },
    slowTime: false,
    multiFlick: false
};

// Add difficulty tracking
let currentLevel = 1;
let levelElement = document.createElement('h3');
levelElement.textContent = 'Level: 1';
document.getElementById('gameInfo').appendChild(levelElement);

// Add level-up notification element
const levelUpElement = document.createElement('div');
levelUpElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #4CAF50;
    font-size: 48px;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s;
    text-align: center;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
`;
document.body.appendChild(levelUpElement);

// Add target count tracking
let targetsNeededForLevel = 5;  // Starting targets needed

// Add level completion tracking
let levelCompletions = 0;
let completionsNeeded = 5;  // Start with 5 completions needed

// Update the levelElement to show completions
levelElement.style.cssText = `
    margin: 0;
    padding: 5px 0;
`;

function updateLevelDisplay() {
    levelElement.textContent = `Level: ${currentLevel} (${levelCompletions}/${completionsNeeded})`;
}

function showLevelUp(level) {
    let message = `Level ${level}!`;
    
    // Add special messages for new ball types
    if (level === 2) {
        message += '<br><span style="font-size: 24px">Fast targets unlocked!</span>';
    } else if (level === 4) {
        message += '<br><span style="font-size: 24px">Small targets unlocked!</span>';
    } else if (level === 7) {
        message += '<br><span style="font-size: 24px">Teleporting targets unlocked!</span>';
    } else if (level === 11) {
        message += '<br><span style="font-size: 24px">Armored targets unlocked!</span>';
    } else if (level === 15) {
        message += '<br><span style="font-size: 24px">Super Armored targets unlocked!</span>';
    } else if (level === 19) {
        message += '<br><span style="font-size: 24px">Ultra Fast targets unlocked!</span>';
    } else {
        message += '<br><span style="font-size: 24px">Get ready for a new challenge!</span>';
    }
    
    levelUpElement.innerHTML = message;
    levelUpElement.style.opacity = '1';
    setTimeout(() => {
        levelUpElement.style.opacity = '0';
    }, 2000);
}

class Projectile {
    constructor(x, y, velocityX, velocityY, isExplosive = false) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.gravity = 0.5;
        this.friction = 0.99;
        this.active = true;
        this.isExplosive = isExplosive;
        this.explosionRadius = 100 + (getPowerUpLevel('explosiveFlick') * powerUpScaling.explosiveFlick.effect);
        this.creationTime = Date.now();  // Add creation timestamp
        this.maxLifetime = 10000;  // 10 seconds in milliseconds
    }

    update() {
        // Check if projectile has exceeded its lifetime
        if (Date.now() - this.creationTime >= this.maxLifetime) {
            return false;  // Remove the projectile
        }

        this.velocityY += this.gravity * timeScale;
        this.x += this.velocityX * timeScale;
        this.y += this.velocityY * timeScale;
        
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocityX *= -0.7;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.velocityY *= -0.7;
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }
        
        return true;
    }

    draw() {
        const age = Date.now() - this.creationTime;
        if (age >= this.maxLifetime) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isExplosive ? '#FF9800' : '#4CAF50';
        
        // Start fading out in the last 2 seconds
        const fadeStart = this.maxLifetime - 2000;
        if (age > fadeStart) {
            ctx.globalAlpha = Math.max(0, 1 - (age - fadeStart) / 2000);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    explode() {
        if (!this.isExplosive) return [];
        
        const explosionProjectiles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const velocity = 10;
            explosionProjectiles.push(
                new Projectile(
                    this.x,
                    this.y,
                    Math.cos(angle) * velocity,
                    Math.sin(angle) * velocity
                )
            );
        }
        return explosionProjectiles;
    }
}

class Target {
    constructor(type = 'normal') {
        this.radius = 20;
        this.type = type;
        this.active = true;
        this.reset();
        
        // Set properties based on type
        switch(type) {
            case 'fast':  // Level 5+
                this.speedMultiplier = 2;
                this.points = 200;
                this.color = '#FF1744';  // Red
                break;
            case 'small':  // Level 10+
                this.radius = 10;
                this.points = 250;
                this.color = '#00E676';  // Green
                this.speedMultiplier = 1.5;
                break;
            case 'teleporting':  // Level 15+
                this.speedMultiplier = 1.3;
                this.points = 300;
                this.color = '#2979FF';  // Blue
                this.teleportTimer = 0;
                this.teleportInterval = Math.max(60 - currentLevel * 2, 20);
                break;
            case 'armored':  // Level 20+
                this.speedMultiplier = 0.8;
                this.points = 400;
                this.color = '#FFD600';  // Gold
                this.hits = 2;
                break;
            case 'superArmored':  // Level 25+
                this.speedMultiplier = 0.7;
                this.points = 600;
                this.color = '#FFC107';  // Orange
                this.hits = 3;
                this.radius = 25;
                break;
            case 'ultraFast':  // Level 30+
                this.speedMultiplier = 3;
                this.points = 800;
                this.color = '#F50057';  // Pink
                this.radius = 8;
                break;
            default:  // Normal (always available)
                this.speedMultiplier = 1;
                this.points = 100;
                this.color = '#FF4081';
        }
        
        // Increase points based on level
        this.points = Math.floor(this.points * (1 + currentLevel * 0.1));
    }

    reset() {
        this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
        this.velocityX = (Math.random() - 0.5) * 4 * (this.speedMultiplier || 1);
        this.velocityY = (Math.random() - 0.5) * 4 * (this.speedMultiplier || 1);
        this.active = true;
        if (this.type === 'armored' || this.type === 'superArmored') this.hits = 2;
    }

    update() {
        if (!this.active) return;

        if (this.type === 'teleporting') {
            this.teleportTimer++;
            if (this.teleportTimer >= this.teleportInterval) {
                this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
                this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
                this.teleportTimer = 0;
            }
        }
        
        this.x += this.velocityX * timeScale;
        this.y += this.velocityY * timeScale;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocityX *= -1;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.velocityY *= -1;
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }
    }

    draw() {
        if (!this.active) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw armor indicator
        if ((this.type === 'armored' || this.type === 'superArmored') && this.hits > 1) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.closePath();
    }

    checkCollision(projectile) {
        const dx = this.x - projectile.x;
        const dy = this.y - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = this.radius + (projectile.isExplosive ? projectile.explosionRadius : projectile.radius);
        
        if (distance < hitRadius) {
            if ((this.type === 'armored' || this.type === 'superArmored') && this.hits > 1) {
                this.hits--;
                return false;
            }
            this.active = false;
            return true;
        }
        return false;
    }
}

let projectiles = [];
let targets = generateTargets();

function showCombo(multiplier) {
    comboElement.textContent = `COMBO x${multiplier}!`;
    comboElement.style.opacity = '1';
    setTimeout(() => {
        comboElement.style.opacity = '0';
    }, 1000);
}

function updateMultiplier(hitCount) {
    if (hitCount > 1) {
        currentMultiplier = hitCount;
        multiplierElement.textContent = currentMultiplier;
        showCombo(currentMultiplier);
        highestCombo = Math.max(highestCombo, currentMultiplier);
        highestComboElement.textContent = highestCombo;
    }
}

function getPowerUpLevel(powerUp) {
    return powerUpLevels[powerUp] || 0;
}

function getCurrentPrice(powerUp) {
    const basePrice = powerUpPrices[powerUp];
    const level = getPowerUpLevel(powerUp);
    
    // Special pricing for gun
    if (powerUp === 'gun') {
        return basePrice + (level * 2000);
    }
    
    // Special pricing for Flick Zone
    if (powerUp === 'flickZone') {
        return basePrice + (level * 500);  // Increase by 500 points per level
    }
    
    // Return base price for buyFlicks
    if (powerUp === 'buyFlicks') {
        return basePrice;
    }
    
    // For power-ups with scaling
    if (powerUpScaling[powerUp]) {
        return Math.floor(basePrice * Math.pow(powerUpScaling[powerUp].price, level));
    }
    
    // Default case: return base price
    return basePrice;
}

function updatePowerUpAvailability() {
    Object.entries(powerUpPrices).forEach(([powerUp, basePrice]) => {
        const element = powerUpElements[powerUp];
        if (!element) return;  // Skip if element doesn't exist
        
        const currentPrice = getCurrentPrice(powerUp);
        const priceElement = element.querySelector('.power-up-price');
        const levelElement = element.querySelector('.power-up-level');
        
        if (priceElement) {
            priceElement.textContent = currentPrice;
        }
        
        // Only show level for power-ups that can be upgraded
        if (levelElement && powerUp !== 'buyFlicks' && powerUp !== 'gun') {
            levelElement.textContent = `Level ${getPowerUpLevel(powerUp)}`;
        }
        
        if (score < currentPrice) {
            element.classList.add('disabled');
        } else {
            element.classList.remove('disabled');
        }
    });
}

function showGameTimer(seconds) {
    if (seconds > 0) {
        gameTimerElement.textContent = seconds;
        gameTimerElement.style.opacity = '1';
    } else {
        gameTimerElement.style.opacity = '0';
    }
}

function startGameOverSequence() {
    if (gameOverTimer) return;
    
    let timeLeft = 5;
    showGameTimer(timeLeft);
    
    gameOverTimer = setInterval(() => {
        // Check if flicks were replenished
        if (flicksLeft > 0) {
            clearInterval(gameOverTimer);
            gameOverTimer = null;
            gameTimerElement.style.opacity = '0';
            return;
        }
        
        timeLeft--;
        showGameTimer(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(gameOverTimer);
            gameOverTimer = null;
            gameTimerElement.style.opacity = '0';
            isGameOver = true;
            gameOverScreen.style.display = 'block';
            finalScoreElement.textContent = score;
        }
    }, 1000);
}

function activatePowerUp(powerUp) {
    if (!powerUp) {
        Object.keys(powerUps).forEach(key => {
            if (typeof powerUps[key] === 'object') {
                powerUps[key].active = false;
                powerUps[key].uses = 0;
            } else {
                powerUps[key] = false;
            }
            powerUpElements[key].classList.remove('active');
        });
        return;
    }

    const currentPrice = getCurrentPrice(powerUp);
    if (score < currentPrice) return;

    score -= currentPrice;
    scoreElement.textContent = score;

    if (powerUp === 'buyFlicks') {
        flicksLeft += 10;
        flicksElement.textContent = flicksLeft;
    } else if (powerUp === 'gun') {
        gunActive = true;
        const gunLevel = powerUpLevels.gun;
        remainingGunShots = 30 + (gunLevel * 20);  // Increase flicks with level
        lastGunShot = Date.now();
        powerUpLevels.gun++;  // Increment gun level after purchase
    } else {
        powerUpLevels[powerUp]++;
        
        if (powerUp === 'guidedFlick') {
            const usesPerPurchase = 1 + Math.floor(powerUpLevels[powerUp] / 5);
            powerUps[powerUp] = { active: true, uses: usesPerPurchase };
        } else if (powerUp === 'explosiveFlick') {
            const extraFlicks = powerUpLevels[powerUp] >= 10 ? 
                1 + Math.floor((powerUpLevels[powerUp] - 10) / 5) : 1;
            powerUps[powerUp] = { active: true, uses: extraFlicks };
        } else {
            powerUps[powerUp] = true;
        }
        
        powerUpElements[powerUp].classList.add('active');
    }
    
    updatePowerUpAvailability();

    if (powerUp === 'flickZone') {
        powerUpLevels.flickZone++;
        placingFlickZone = true;
        canvas.style.cursor = 'crosshair';
    }
}

// Power-up event listeners
Object.entries(powerUpElements).forEach(([powerUp, element]) => {
    element.addEventListener('click', () => {
        if (!element.classList.contains('disabled') && !isGameOver) {
            if (powerUp === 'slowTime') {
                const duration = 5 + (getPowerUpLevel('slowTime') * powerUpScaling.slowTime.effect);
                const slowFactor = 0.5 - (getPowerUpLevel('slowTime') * powerUpScaling.slowTime.slowFactor);
                activatePowerUp(powerUp);
                timeScale = Math.max(0.1, slowFactor);
                setTimeout(() => {
                    timeScale = 1;
                    activatePowerUp(null);
                }, duration * 1000);
            } else {
                activatePowerUp(powerUp);
            }
        }
    });
});

function drawFlickLine() {
    if (isDragging) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function checkGameOver() {
    if (flicksLeft <= 0 && !gameOverTimer && !isGameOver) {
        startGameOverSequence();
    }
}

function resetGame() {
    score = 0;
    flicksLeft = 5;
    isGameOver = false;
    currentMultiplier = 1;
    highestCombo = 1;
    currentLevel = 1;
    levelCompletions = 0;
    completionsNeeded = 5;  // Start with 5 completions needed
    updateLevelDisplay();
    projectiles = [];
    targets = generateTargets();
    timeScale = 1;
    
    if (gameOverTimer) {
        clearInterval(gameOverTimer);
        gameOverTimer = null;
    }
    
    gameTimerElement.style.opacity = '0';
    activatePowerUp(null);
    
    scoreElement.textContent = score;
    flicksElement.textContent = flicksLeft;
    multiplierElement.textContent = currentMultiplier;
    gameOverScreen.style.display = 'none';
    updatePowerUpAvailability();
    gunActive = false;
    remainingGunShots = 0;
    powerUpLevels.gun = 0;  // Reset gun level
    flickZones = [];
    placingFlickZone = false;
    canvas.style.cursor = 'default';
    powerUpLevels.flickZone = 0;
}

canvas.addEventListener('mousedown', (e) => {
    if (flicksLeft <= 0 || isGameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    currentX = startX;
    currentY = startY;
    isDragging = true;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gunX = e.clientX - rect.left;
    gunY = e.clientY - rect.top;

    if (isDragging && !isGameOver) {
        currentX = e.clientX - rect.left;
        currentY = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging && flicksLeft > 0 && !isGameOver) {
        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        
        const velocityX = (startX - endX) * 0.1;
        const velocityY = (startY - endY) * 0.1;
        
        if (powerUps.multiFlick) {
            const spread = 0.2 + (getPowerUpLevel('multiFlick') * powerUpScaling.multiFlick.effect);
            const projectileCount = 3 + Math.floor(getPowerUpLevel('multiFlick') / 2);
            const halfCount = Math.floor(projectileCount / 2);
            
            for (let i = -halfCount; i <= halfCount; i++) {
                projectiles.push(new Projectile(
                    startX,
                    startY,
                    velocityX * (1 + i * spread),
                    velocityY * (1 + i * spread),
                    powerUps.explosiveFlick.active
                ));
            }
            activatePowerUp(null);
        } else {
            projectiles.push(new Projectile(startX, startY, velocityX, velocityY, powerUps.explosiveFlick.active));
            
            // Update uses for guided and explosive flicks
            if (powerUps.explosiveFlick.active) {
                powerUps.explosiveFlick.uses--;
                if (powerUps.explosiveFlick.uses <= 0) {
                    activatePowerUp(null);
                }
            }
            if (powerUps.guidedFlick.active) {
                powerUps.guidedFlick.uses--;
                if (powerUps.guidedFlick.uses <= 0) {
                    activatePowerUp(null);
                }
            }
        }
        
        flicksLeft--;
        flicksElement.textContent = flicksLeft;
    }
    isDragging = false;
});

restartButton.addEventListener('click', resetGame);

function checkCollisions() {
    let hitTargets = new Set();
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (!projectile.active) continue;
        
        for (let target of targets) {
            if (!target.active) continue;
            
            if (target.checkCollision(projectile)) {
                hitTargets.add(target);
                
                if (projectile.isExplosive) {
                    projectiles.push(...projectile.explode());
                    projectile.active = false;
                }
            }
        }
    }
    
    if (hitTargets.size > 0) {
        const basePoints = Array.from(hitTargets).reduce((sum, target) => 
            sum + target.points, 0);
        const comboPoints = basePoints * currentMultiplier;
        score += comboPoints;
        scoreElement.textContent = score;
        updateMultiplier(hitTargets.size);
        updatePowerUpAvailability();
    } else {
        currentMultiplier = 1;
        multiplierElement.textContent = currentMultiplier;
    }
}

function drawTrajectoryLine() {
    // Only show trajectory if guided flick is active and level is greater than 0
    if (isDragging && powerUps.guidedFlick.active && getPowerUpLevel('guidedFlick') > 0) {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        
        const velocityX = (startX - currentX) * 0.1;
        const velocityY = (startY - currentY) * 0.1;
        
        let simX = startX;
        let simY = startY;
        let simVX = velocityX;
        let simVY = velocityY;
        
        ctx.moveTo(simX, simY);
        
        const points = 30 + (getPowerUpLevel('guidedFlick') * powerUpScaling.guidedFlick.effect);
        
        for (let i = 0; i < points; i++) {
            simVY += 0.5;
            simX += simVX;
            simY += simVY;
            
            ctx.lineTo(simX, simY);
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function generateTargets() {
    const baseCount = Math.min(3 + Math.floor(currentLevel / 2), 12);  // Max 12 base targets
    const targets = [];
    
    // Calculate probabilities based on level and unlocked types
    const probabilities = {
        fast: currentLevel >= 2 ? Math.min(0.3 + (currentLevel - 2) * 0.05, 0.5) : 0,      // Level 2
        small: currentLevel >= 4 ? Math.min(0.3 + (currentLevel - 4) * 0.05, 0.5) : 0,     // Level 4 (+2)
        teleporting: currentLevel >= 7 ? Math.min(0.2 + (currentLevel - 7) * 0.04, 0.4) : 0, // Level 7 (+3)
        armored: currentLevel >= 11 ? Math.min(0.2 + (currentLevel - 11) * 0.03, 0.3) : 0,   // Level 11 (+4)
        superArmored: currentLevel >= 15 ? Math.min(0.15 + (currentLevel - 15) * 0.02, 0.25) : 0, // Level 15 (+4)
        ultraFast: currentLevel >= 19 ? Math.min(0.15 + (currentLevel - 19) * 0.02, 0.25) : 0     // Level 19 (+4)
    };
    
    // Add different types of targets based on level
    for (let i = 0; i < baseCount; i++) {
        let targetType = 'normal';
        let speedMultiplier = 1 + (currentLevel * 0.1); // Base speed increase with level
        
        // Roll for each type in order of introduction
        const roll = Math.random();
        if (currentLevel >= 19 && roll < probabilities.ultraFast) {
            targetType = 'ultraFast';
        } else if (currentLevel >= 15 && roll < probabilities.superArmored) {
            targetType = 'superArmored';
        } else if (currentLevel >= 11 && roll < probabilities.armored) {
            targetType = 'armored';
        } else if (currentLevel >= 7 && roll < probabilities.teleporting) {
            targetType = 'teleporting';
        } else if (currentLevel >= 4 && roll < probabilities.small) {
            targetType = 'small';
        } else if (currentLevel >= 2 && roll < probabilities.fast) {
            targetType = 'fast';
        }
        
        const target = new Target(targetType);
        target.speedMultiplier *= speedMultiplier;
        targets.push(target);
    }
    
    return targets;
}

function updateGun() {
    if (!gunActive || remainingGunShots <= 0) {
        if (remainingGunShots <= 0) {
            gunActive = false;
        }
        return;
    }

    const currentTime = Date.now();
    if (currentTime - lastGunShot >= 200) {  // Fire every 200ms
        // Create a projectile from gun position
        const angle = Math.random() * Math.PI * 0.25 - Math.PI * 0.125;  // Random spread of ±22.5 degrees
        const speed = 15;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        projectiles.push(new Projectile(gunX, gunY, velocityX, velocityY));
        remainingGunShots--;
        lastGunShot = currentTime;
    }
}

function drawGun() {
    if (!gunActive) return;

    // Draw gun
    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(Math.PI / 4);  // 45-degree rotation
    
    // Gun body
    ctx.fillStyle = '#333';
    ctx.fillRect(-15, -5, 30, 10);
    
    // Gun barrel
    ctx.fillStyle = '#666';
    ctx.fillRect(15, -3, 10, 6);
    
    ctx.restore();
}

// Add Flick Zone state
let placingFlickZone = false;
let flickZones = [];

class FlickZone {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.creationTime = Date.now();
        this.duration = 10000 + (level * 5000); // 10 seconds + 5 seconds per level
        this.flickForce = 10 + (level * 2); // Base force + 2 per level
        this.active = true;
        this.cooldown = 0;
        this.cooldownTime = 500; // 0.5 second cooldown between flicks
    }

    update() {
        if (Date.now() - this.creationTime >= this.duration) {
            this.active = false;
            return;
        }

        if (this.cooldown > 0) {
            this.cooldown -= 16; // Approximately 60fps
        }

        // Check for targets in range
        for (let target of targets) {
            if (!target.active || this.cooldown > 0) continue;

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.radius + target.radius) {
                // Normalize direction and apply force
                const angle = Math.atan2(dy, dx);
                target.velocityX = Math.cos(angle) * this.flickForce;
                target.velocityY = Math.sin(angle) * this.flickForce;
                this.cooldown = this.cooldownTime;
            }
        }
    }

    draw() {
        const timeLeft = this.duration - (Date.now() - this.creationTime);
        if (timeLeft <= 0) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 175, 80, ${this.cooldown > 0 ? 0.3 : 0.5})`;
        ctx.fill();

        // Draw duration indicator
        const progress = timeLeft / this.duration;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.closePath();
    }
}

// Add to canvas click event for placing Flick Zones
canvas.addEventListener('click', (e) => {
    if (placingFlickZone) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        flickZones.push(new FlickZone(x, y, powerUpLevels.flickZone));
        placingFlickZone = false;
        canvas.style.cursor = 'default';
    }
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateGun();
    
    // Update and filter out inactive Flick Zones
    flickZones = flickZones.filter(zone => {
        if (zone.active) {
            zone.update();
            zone.draw();
            return true;
        }
        return false;
    });
    
    projectiles = projectiles.filter(p => p.update());
    projectiles.forEach(p => p.draw());
    
    targets.forEach(t => {
        t.update();
        t.draw();
    });
    
    drawGun();
    
    checkCollisions();
    
    // Check if all targets are completely gone (not just fading)
    if (targets.every(t => !t.active)) {
        levelCompletions++;
        
        if (levelCompletions >= completionsNeeded) {
            currentLevel++;
            levelCompletions = 0;
            completionsNeeded = 5 + (currentLevel - 1) * 3;
            showLevelUp(currentLevel);
        }
        
        updateLevelDisplay();
        targets = generateTargets();
        flicksLeft += Math.min(3 + Math.floor(currentLevel / 5), 8);
        flicksElement.textContent = flicksLeft;
    }
    
    drawFlickLine();
    drawTrajectoryLine();
    checkGameOver();
    requestAnimationFrame(update);
}

// Initialize the game with the first set of targets
targets = generateTargets();
updatePowerUpAvailability();
update(); 