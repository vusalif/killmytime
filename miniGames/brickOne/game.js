class Game {
    constructor(canvasId, controlType = 'mouse', playerName = 'Player 1') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        this.controlType = controlType;
        
        this.isMultiplayer = false;
        this.currentPlayer = 1;
        this.scores = {
            player1: 0,
            player2: 0
        };
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            radius: 8,
            speed: 5,
            dx: 0,
            dy: 0,
            launched: false
        };
        
        this.paddle = {
            width: 80,
            height: 10,
            x: this.canvas.width / 2 - 40,
            y: this.canvas.height - 20,
            color: this.controlType === 'wasd' ? '#4CAF50' : '#2196F3',
            speed: 7,
            originalWidth: 80
        };
        
        this.keys = {
            left: false,
            right: false,
            launch: false
        };
        
        this.bricks = [];
        this.brickRows = 5;
        this.brickCols = 6;
        this.gameFinished = false;
        this.finalScore = 0;
        this.playAgainButton = {
            x: this.canvas.width / 2 - 60,
            y: this.canvas.height / 2 + 100,
            width: 120,
            height: 45
        };
        
        this.level = 1;
        this.combo = 0;
        this.comboTimer = null;
        this.particles = [];
        
        this.playerName = playerName;
        
        this.powerBoxes = [];
        this.activeEffects = {
            widthMultiplier: 1,
            pointMultiplier: 1,
            extraBalls: [],
            activeEffectTimers: []
        };
        this.lastPowerBoxSpawn = 0;
        this.powerBoxSpawnInterval = 5000;
        
        this.borderHits = {
            count: 0,
            lastHitTime: 0,
            lastHitSide: null
        };
        
        this.initBricks();
        this.setupCanvas();
        this.setupKeyboardControls();
        this.gameLoop();
        
        this.updateThemeColors();
    }
    
    initBricks() {
        const brickWidth = (this.canvas.width - 60) / this.brickCols;
        const brickHeight = 25;
        
        // Clear existing bricks if any
        this.bricks = [];
        
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const value = Math.floor(Math.random() * (this.level + 8)) + this.level;
                this.bricks.push({
                    x: 30 + col * brickWidth,
                    y: 50 + row * (brickHeight + 5),
                    width: brickWidth - 4,
                    height: brickHeight,
                    value: value,
                    color: `hsl(${value * 25}, 70%, 50%)`
                });
            }
        }
    }
    
    setupCanvas() {
        if (this.controlType === 'mouse') {
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                if (!this.gameFinished) {
                    this.paddle.x = Math.max(0, Math.min(mouseX - this.paddle.width / 2, 
                        this.canvas.width - this.paddle.width));
                    
                    if (!this.ball.launched) {
                        this.ball.x = this.paddle.x + this.paddle.width / 2;
                        
                        // Draw launch direction guide
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.setLineDash([5, 5]);
                        this.ctx.moveTo(this.ball.x, this.ball.y);
                        const angle = Math.atan2(mouseX - this.ball.x, this.paddle.y - mouseY);
                        this.ctx.lineTo(
                            this.ball.x + Math.sin(angle) * 50,
                            this.ball.y - Math.cos(angle) * 50
                        );
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                    }
                }
            });
        }

        // Add click event listener for both single and multiplayer modes
        this.canvas.addEventListener('click', (e) => {
            if (this.gameFinished) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                if (mouseX >= this.playAgainButton.x && 
                    mouseX <= this.playAgainButton.x + this.playAgainButton.width &&
                    mouseY >= this.playAgainButton.y && 
                    mouseY <= this.playAgainButton.y + this.playAgainButton.height) {
                    this.restartGame();
                }
            } else if (!this.ball.launched && this.controlType === 'mouse') {
                this.ball.launched = true;
                this.ball.dx = this.ball.speed;
                this.ball.dy = -this.ball.speed;
            }
        });
    }

    setupKeyboardControls() {
        if (this.controlType === 'wasd' || this.controlType === 'arrows') {
            window.addEventListener('keydown', (e) => {
                if (this.controlType === 'wasd') {
                    if (e.key === 'a' || e.key === 'A') this.keys.left = true;
                    if (e.key === 'd' || e.key === 'D') this.keys.right = true;
                    if (e.key === 'w' || e.key === 'W' || e.key === ' ') this.keys.launch = true;
                } else if (this.controlType === 'arrows') {
                    if (e.key === 'ArrowLeft') this.keys.left = true;
                    if (e.key === 'ArrowRight') this.keys.right = true;
                    if (e.key === 'ArrowUp') this.keys.launch = true;
                }
            });
            
            window.addEventListener('keyup', (e) => {
                if (this.controlType === 'wasd') {
                    if (e.key === 'a' || e.key === 'A') this.keys.left = false;
                    if (e.key === 'd' || e.key === 'D') this.keys.right = false;
                    if (e.key === 'w' || e.key === 'W' || e.key === ' ') this.keys.launch = false;
                } else if (this.controlType === 'arrows') {
                    if (e.key === 'ArrowLeft') this.keys.left = false;
                    if (e.key === 'ArrowRight') this.keys.right = false;
                    if (e.key === 'ArrowUp') this.keys.launch = false;
                }
            });
        }
    }

    updatePaddlePosition() {
        if (this.controlType === 'wasd' || this.controlType === 'arrows') {
            if (this.keys.left) {
                this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
            }
            if (this.keys.right) {
                this.paddle.x = Math.min(this.canvas.width - this.paddle.width, 
                    this.paddle.x + this.paddle.speed);
            }
            
            if (!this.ball.launched) {
                this.ball.x = this.paddle.x + this.paddle.width / 2;
            }

            if (this.keys.launch && !this.ball.launched) {
                this.ball.launched = true;
                this.ball.dx = this.ball.speed;
                this.ball.dy = -this.ball.speed;
            }
        }
    }
    
    update() {
        if (this.gameFinished) return;
        
        this.updatePaddlePosition();
        this.updateParticles();
        this.updatePowerBoxes();
        
        if (!this.ball.launched) return;

        // Function to handle ball physics and collisions
        const updateBall = (ball) => {
            // Add slight random variation to prevent getting stuck
            const randomFactor = 0.05;
            ball.dx += (Math.random() - 0.5) * randomFactor;
            ball.dy += (Math.random() - 0.5) * randomFactor;

            // Normalize speed to prevent ball from getting too fast or slow
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = (ball.dx / currentSpeed) * ball.speed;
            ball.dy = (ball.dy / currentSpeed) * ball.speed;

            // Update ball position
            const nextX = ball.x + ball.dx;
            const nextY = ball.y + ball.dy;
            
            // Ball collision with walls - with repetitive hit detection
            const currentTime = Date.now();
            if (nextX + ball.radius > this.canvas.width || nextX - ball.radius < 0) {
                const hitSide = nextX + ball.radius > this.canvas.width ? 'right' : 'left';
                
                // Check if this is a repetitive hit
                if (currentTime - this.borderHits.lastHitTime < 1000 && // Within 1 second
                    this.borderHits.lastHitSide === hitSide) {
                    this.borderHits.count++;
                    
                    if (this.borderHits.count >= 3) {
                        // Force ball to go in completely opposite direction
                        if (hitSide === 'right') {
                            ball.dx = -ball.speed; // Force ball to go left
                            ball.dy = (Math.random() > 0.5 ? 1 : -1) * ball.speed * 0.8; // Random up/down
                        } else {
                            ball.dx = ball.speed; // Force ball to go right
                            ball.dy = (Math.random() > 0.5 ? 1 : -1) * ball.speed * 0.8; // Random up/down
                        }
                        
                        // Reset counter
                        this.borderHits.count = 0;
                        // Add more particles for visual feedback
                        for (let i = 0; i < 3; i++) {
                            this.addParticles(ball.x, ball.y, '#fff');
                        }
                    } else {
                        ball.dx *= -1;
                        ball.dy += (Math.random() - 0.5) * 0.5;
                        this.addParticles(ball.x, ball.y, '#fff');
                    }
                } else {
                    // Reset counter if too much time has passed
                    this.borderHits.count = 1;
                    ball.dx *= -1;
                    ball.dy += (Math.random() - 0.5) * 0.5;
                    this.addParticles(ball.x, ball.y, '#fff');
                }
                
                this.borderHits.lastHitTime = currentTime;
                this.borderHits.lastHitSide = hitSide;
            }
            
            if (nextY - ball.radius < 0) {
                ball.dy *= -1;
                ball.dx += (Math.random() - 0.5) * 0.5;
                this.addParticles(ball.x, ball.y, '#fff');
                // Reset border hits when hitting ceiling
                this.borderHits.count = 0;
            }
            
            // Ball collision with paddle
            if (nextY + ball.radius > this.paddle.y &&
                nextX > this.paddle.x &&
                nextX < this.paddle.x + this.paddle.width) {
                const hitPos = (nextX - this.paddle.x) / this.paddle.width;
                const angle = (hitPos - 0.5) * Math.PI * 0.7;
                
                ball.dx = Math.sin(angle) * ball.speed;
                ball.dy = -Math.cos(angle) * ball.speed;
                
                this.addParticles(ball.x, ball.y, this.paddle.color);
            }

            // Ball collision with bricks - improved collision detection
            for (let i = this.bricks.length - 1; i >= 0; i--) {
                const brick = this.bricks[i];
                const brickLeft = brick.x;
                const brickRight = brick.x + brick.width;
                const brickTop = brick.y;
                const brickBottom = brick.y + brick.height;

                if (nextX + ball.radius > brickLeft &&
                    nextX - ball.radius < brickRight &&
                    nextY + ball.radius > brickTop &&
                    nextY - ball.radius < brickBottom) {
                    
                    // Determine which side of the brick was hit
                    const hitFromLeft = ball.x < brickLeft;
                    const hitFromRight = ball.x > brickRight;
                    const hitFromTop = ball.y < brickTop;
                    const hitFromBottom = ball.y > brickBottom;

                    if (hitFromLeft || hitFromRight) {
                        ball.dx *= -1;
                    } else if (hitFromTop || hitFromBottom) {
                        ball.dy *= -1;
                    } else {
                        // Corner hit
                        ball.dx *= -1;
                        ball.dy *= -1;
                    }

                    brick.value--;
                    this.scores.player1 += (1 + Math.floor(this.combo / 3)) * this.activeEffects.pointMultiplier;
                    
                    clearTimeout(this.comboTimer);
                    this.combo++;
                    this.comboTimer = setTimeout(() => {
                        this.combo = 0;
                    }, 1000);
                    
                    this.addParticles(ball.x, ball.y, brick.color);
                    
                    if (brick.value <= 0) {
                        this.bricks.splice(i, 1);
                        this.addParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color);
                    } else {
                        brick.color = `hsl(${brick.value * 25}, 70%, 50%)`;
                    }
                    
                    if (!this.isMultiplayer && this.scores.player1 > this.bestScore) {
                        this.bestScore = this.scores.player1;
                        localStorage.setItem('bestScore', this.bestScore);
                    }
                    
                    this.updateScoreDisplay();
                    break;
                }
            }

            // Update ball position after all collision checks
            ball.x = nextX;
            ball.y = nextY;
        };

        // Update main ball
        updateBall(this.ball);
        
        // Update extra balls
        this.activeEffects.extraBalls.forEach(ball => {
            updateBall(ball);
        });
        
        // Remove extra balls that go below paddle
        this.activeEffects.extraBalls = this.activeEffects.extraBalls.filter(ball => 
            ball.y + ball.radius < this.canvas.height);
        
        // Game over condition - only if main ball is lost and no extra balls remain
        if (this.ball.y + this.ball.radius > this.canvas.height && this.activeEffects.extraBalls.length === 0) {
            this.finishGame();
        }

        // Check if all bricks are destroyed - Level up!
        if (this.bricks.length === 0) {
            this.level++;
            this.ball.speed += 0.2;
            this.paddle.width = Math.max(40, this.paddle.width - 2);
            this.initBricks();
        }
    }
    
    finishGame() {
        // For single player mode, proceed as normal
        if (window.gameManager && window.gameManager.currentMode === 'single') {
            this.gameFinished = true;
            this.finalScore = this.scores.player1;
            this.ball.launched = false;
            
            if (this.finalScore > this.bestScore) {
                this.bestScore = this.finalScore;
                localStorage.setItem('bestScore', this.bestScore);
                const bestScoreElement = document.getElementById('best-score');
                if (bestScoreElement) {
                    bestScoreElement.textContent = this.bestScore;
                }
                
                window.gameManager.addLogEntry(
                    `New Best Score! ${this.finalScore} points at Level ${this.level}`,
                    {
                        score: this.finalScore,
                        level: this.level,
                        isBestScore: true
                    }
                );
            } else {
                window.gameManager.finishGame(this);
            }
            return;
        }
        
        // For multiplayer mode
        if (window.gameManager && window.gameManager.currentMode === 'sideBySide') {
            // Set final score before storing
            this.finalScore = this.scores.player1;
            
            // Store final score but don't end game yet
            const playerKey = this.canvas.id === 'gameCanvas' ? 'player1FinalScore' : 'player2FinalScore';
            localStorage.setItem(playerKey, this.finalScore);
            
            // Stop the ball and movement but keep the game visible
            this.ball.launched = false;
            this.ball.dx = 0;
            this.ball.dy = 0;
            
            const otherPlayerScore = this.canvas.id === 'gameCanvas' 
                ? localStorage.getItem('player2FinalScore') 
                : localStorage.getItem('player1FinalScore');
            
            // Only proceed with game over if both players have finished
            if (otherPlayerScore !== null) {
                const player1Score = parseInt(localStorage.getItem('player1FinalScore'));
                const player2Score = parseInt(localStorage.getItem('player2FinalScore'));
                
                const player1Name = window.gameManager.player1Name;
                const player2Name = window.gameManager.player2Name;
                
                let resultText = '';
                if (player1Score > player2Score) {
                    resultText = `${player1Name} wins! (${player1Score} vs ${player2Score})`;
                } else if (player2Score > player1Score) {
                    resultText = `${player2Name} wins! (${player2Score} vs ${player1Score})`;
                } else {
                    resultText = `It's a tie! (${player1Score} points each)`;
                }

                // Add to game log with detailed information
                if (window.gameManager) {
                    window.gameManager.addLogEntry(resultText, {
                        player1: {
                            name: player1Name,
                            score: player1Score
                        },
                        player2: {
                            name: player2Name,
                            score: player2Score
                        },
                        winner: player1Score > player2Score ? player1Name : 
                               player2Score > player1Score ? player2Name : 'tie'
                    });
                }
                
                // Now we can set both games as finished
                this.gameFinished = true;
                if (window.gameManager.game1) {
                    window.gameManager.game1.gameFinished = true;
                    window.gameManager.game1.finalScore = player1Score;
                }
                if (window.gameManager.game2) {
                    window.gameManager.game2.gameFinished = true;
                    window.gameManager.game2.finalScore = player2Score;
                }
                
                // Clear the stored scores
                localStorage.removeItem('player1FinalScore');
                localStorage.removeItem('player2FinalScore');
                
                // Show alert after a short delay
                setTimeout(() => {
                    alert(`Game Over!\n\n${resultText}`);
                }, 100);
            } else {
                // If this player finished first, show waiting message
                this.waitingForOtherPlayer = true;
            }
        }
    }
    
    restartGame() {
        // Reset game state
        this.gameFinished = false;
        this.finalScore = 0;
        this.scores.player1 = 0;
        this.level = 1;
        this.combo = 0;
        this.ball.speed = 5;
        this.paddle.width = 80;
        this.waitingForOtherPlayer = false;
        
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 30;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.ball.launched = false;
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        
        // Clear particles
        this.particles = [];
        
        // Reinitialize bricks
        this.bricks = [];
        this.initBricks();
        
        // Update score display
        this.updateScoreDisplay();
        
        // In multiplayer mode, restart both games
        if (window.gameManager && window.gameManager.currentMode === 'sideBySide') {
            // Clear any stored scores
            localStorage.removeItem('player1FinalScore');
            localStorage.removeItem('player2FinalScore');
            
            // If this is game1, also restart game2
            if (this === window.gameManager.game1 && window.gameManager.game2) {
                window.gameManager.game2.restartGame();
            }
            // If this is game2, also restart game1
            else if (this === window.gameManager.game2 && window.gameManager.game1) {
                window.gameManager.game1.restartGame();
            }
        }
        
        this.powerBoxes = [];
        this.activeEffects = {
            widthMultiplier: 1,
            pointMultiplier: 1,
            extraBalls: [],
            activeEffectTimers: []
        };
        this.lastPowerBoxSpawn = 0;
    }

    updateScoreDisplay() {
        const scoreId = this.canvas.id === 'gameCanvas' ? 'score1' : 'score2_2';
        document.getElementById(scoreId).textContent = this.scores.player1;
        
        // Update best score for both players in multiplayer mode
        const bestScoreId = this.canvas.id === 'gameCanvas' ? 'best-score' : 'best-score2';
        document.getElementById(bestScoreId).textContent = this.bestScore;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.drawParticles();
        
        // Draw level indicator
        if (!this.gameFinished) {
            this.ctx.fillStyle = this.levelTextColor || 'rgba(255, 255, 255, 0.2)';
            this.ctx.font = 'bold 40px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw combo indicator
        if (this.combo > 0) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 24px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combo x${this.combo}`, this.canvas.width / 2, 30);
        }

        // Draw power boxes with glow effect
        this.powerBoxes.forEach(box => {
            const currentTime = Date.now();
            const glowIntensity = Math.sin((currentTime - box.spawnTime) / 200) * 0.5 + 0.5; // Pulsing effect
            
            // Draw outer glow
            this.ctx.shadowColor = box.type === 'good' ? '#4CAF50' : '#FF5252';
            this.ctx.shadowBlur = 15 * glowIntensity;
            this.ctx.fillStyle = box.color;
            
            // Draw box with rounded corners
            this.ctx.beginPath();
            const radius = 5;
            this.ctx.moveTo(box.x + radius, box.y);
            this.ctx.lineTo(box.x + box.width - radius, box.y);
            this.ctx.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + radius);
            this.ctx.lineTo(box.x + box.width, box.y + box.height - radius);
            this.ctx.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - radius, box.y + box.height);
            this.ctx.lineTo(box.x + radius, box.y + box.height);
            this.ctx.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - radius);
            this.ctx.lineTo(box.x, box.y + radius);
            this.ctx.quadraticCurveTo(box.x, box.y, box.x + radius, box.y);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw inner glow
            const innerGlow = this.ctx.createRadialGradient(
                box.x + box.width/2, box.y + box.height/2, 0,
                box.x + box.width/2, box.y + box.height/2, box.width/2
            );
            innerGlow.addColorStop(0, `${box.color}FF`);
            innerGlow.addColorStop(1, `${box.color}00`);
            this.ctx.fillStyle = innerGlow;
            this.ctx.fill();

            // Draw icon or symbol based on effect
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let symbol = '';
            if (box.type === 'good') {
                switch(box.effect) {
                    case 0: symbol = '↔️'; break; // Paddle width
                    case 1: symbol = '×3'; break; // Triple points
                    case 2: symbol = '⚪'; break; // Extra balls
                }
            } else {
                symbol = '⚡'; // Level jump
            }
            
            this.ctx.fillText(symbol, 
                box.x + box.width/2, 
                box.y + box.height/2
            );
        });
        
        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;
        
        // Draw ball with trail effect
        if (!this.gameFinished) {
            this.ctx.beginPath();
            const gradient = this.ctx.createRadialGradient(
                this.ball.x, this.ball.y, 0,
                this.ball.x, this.ball.y, this.ball.radius
            );
            gradient.addColorStop(0, this.ballColor || '#ffffff');
            gradient.addColorStop(1, this.ballTrailColor || 'rgba(255, 255, 255, 0.3)');
            this.ctx.fillStyle = gradient;
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
            
            // Draw paddle
            this.ctx.fillStyle = this.paddle.color;
            this.ctx.fillRect(this.paddle.x, this.paddle.y, 
                this.paddle.width, this.paddle.height);
        }
        
        // Draw extra balls with same trail effect
        this.activeEffects.extraBalls.forEach(ball => {
            this.ctx.beginPath();
            const gradient = this.ctx.createRadialGradient(
                ball.x, ball.y, 0,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, this.ballColor || '#ffffff');
            gradient.addColorStop(1, this.ballTrailColor || 'rgba(255, 255, 255, 0.3)');
            this.ctx.fillStyle = gradient;
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Draw bricks
        this.bricks.forEach(brick => {
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Draw brick value with smaller font
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '500 14px Inter'; // Smaller font size
            this.ctx.textAlign = 'center';
            this.ctx.fillText(brick.value, 
                brick.x + brick.width / 2, 
                brick.y + brick.height / 2 + 5);
        });

        // Draw final score and play again button if game is finished
        if (this.gameFinished) {
            // Create semi-transparent dark overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw decorative lines
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(50, this.canvas.height / 2 - 80);
            this.ctx.lineTo(this.canvas.width - 50, this.canvas.height / 2 - 80);
            this.ctx.moveTo(50, this.canvas.height / 2 + 80);
            this.ctx.lineTo(this.canvas.width - 50, this.canvas.height / 2 + 80);
            this.ctx.stroke();
            
            // Draw game over text with shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '500 25px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 120);
            
            // Only show new best score message in single player mode
            if (window.gameManager && window.gameManager.currentMode === 'single' && this.finalScore > this.bestScore) {
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.font = '600 25px Inter';
                this.ctx.fillText('NEW BEST SCORE!', this.canvas.width / 2, this.canvas.height / 2 - 70);
            }
            
            // Draw score details
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '500 28px Inter';
            this.ctx.fillText('Final Score', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '700 35px Inter';
            this.ctx.fillText(this.finalScore, this.canvas.width / 2, this.canvas.height / 2 + 30);
            this.ctx.font = '500 24px Inter';
            this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 70);

            // Draw play again button with gradient and shadow
            const buttonGradient = this.ctx.createLinearGradient(
                this.playAgainButton.x,
                this.playAgainButton.y,
                this.playAgainButton.x,
                this.playAgainButton.y + this.playAgainButton.height
            );
            buttonGradient.addColorStop(0, '#2196F3');
            buttonGradient.addColorStop(1, '#1976D2');
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetY = 3;
            
            // Draw button background with larger radius
            this.ctx.fillStyle = buttonGradient;
            this.ctx.beginPath();
            this.ctx.roundRect(
                this.playAgainButton.x,
                this.playAgainButton.y,
                this.playAgainButton.width,
                this.playAgainButton.height,
                10
            );
            this.ctx.fill();
            
            // Draw button text
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '600 15px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PLAY AGAIN', 
                this.playAgainButton.x + this.playAgainButton.width / 2,
                this.playAgainButton.y + this.playAgainButton.height / 2 + 7
            );
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // Add waiting message in multiplayer mode
        if (this.waitingForOtherPlayer && !this.gameFinished) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '500 24px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Waiting for other player...', 
                this.canvas.width / 2, 
                this.canvas.height / 2);
        }

        // Draw launch guide when ball is not launched
        if (!this.ball.launched && !this.gameFinished) {
            // Calculate trajectory points
            const points = this.calculateTrajectoryPoints();
            
            // Draw dotted line connecting the points
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.setLineDash([5, 5]);
            
            points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Update control text with active effects
        const controlText = document.querySelector('.control-text');
        if (controlText) {
            if (!this.ball.launched) {
                controlText.innerHTML = `
                    Click to launch the ball!<br>
                    <span style="font-size: 12px; color: var(--text-light)">
                        The ball will follow the dotted line
                    </span>
                `;
            } else {
                let activeEffects = this.activeEffects.activeEffectTimers
                    .filter(timer => timer.endTime > Date.now())
                    .map(timer => {
                        const timeLeft = Math.ceil((timer.endTime - Date.now()) / 1000);
                        return `${timer.name} (${timeLeft}s)`;
                    })
                    .join(' • ');
                
                controlText.innerHTML = activeEffects || 'Break the bricks!';
            }
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    addParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                color: color,
                life: 1,
                size: 4
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life -= 0.02;
            particle.size *= 0.95;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();
            this.ctx.closePath();
        });
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    updateThemeColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        this.ballColor = computedStyle.getPropertyValue('--ball-color').trim();
        this.ballTrailColor = computedStyle.getPropertyValue('--ball-trail').trim();
        this.levelTextColor = computedStyle.getPropertyValue('--level-text').trim();
        
        // Update paddle color based on control type and theme
        if (this.controlType === 'wasd') {
            this.paddle.color = computedStyle.getPropertyValue('--primary').trim();
        } else if (this.controlType === 'arrows') {
            this.paddle.color = computedStyle.getPropertyValue('--secondary').trim();
        }
    }

    spawnPowerBox() {
        const box = {
            x: Math.random() * (this.canvas.width - 30),
            y: 100 + Math.random() * (this.canvas.height - 300),
            width: 30,
            height: 30,
            color: '#4CAF50',
            type: 'good',
            effect: Math.floor(Math.random() * 3), // 0-2 for good effects only
            spawnTime: Date.now()
        };
        this.powerBoxes.push(box);
    }

    applyPowerEffect(box) {
        const addEffectTimer = (name, duration) => {
            this.activeEffects.activeEffectTimers.push({
                name,
                endTime: Date.now() + duration
            });
            setTimeout(() => {
                this.activeEffects.activeEffectTimers = 
                    this.activeEffects.activeEffectTimers.filter(t => t.endTime > Date.now());
            }, duration);
        };

        switch (box.effect) {
            case 0: // Increase paddle width
                this.paddle.width = this.paddle.originalWidth * 1.5;
                addEffectTimer('Wide Paddle', 20000);
                setTimeout(() => {
                    this.paddle.width = this.paddle.originalWidth;
                }, 20000);
                break;
            case 1: // Triple points
                this.activeEffects.pointMultiplier = 3;
                addEffectTimer('Triple Points', 10000);
                setTimeout(() => {
                    this.activeEffects.pointMultiplier = 1;
                }, 10000);
                break;
            case 2: // Spawn 5 extra balls with exact same speed as main ball
                // Get the current velocity magnitude of the main ball
                const mainBallVelocity = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
                
                for (let i = 0; i < 5; i++) {
                    // Create a copy of the main ball
                    const extraBall = {
                        ...this.ball,  // Copy all properties including speed
                        x: this.ball.x,
                        y: this.ball.y,
                        launched: true
                    };
                    
                    // Calculate new direction while maintaining the same velocity magnitude
                    const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;  // Random angle between -45 and 45 degrees
                    const ratio = mainBallVelocity / Math.sqrt(2);  // Maintain exact velocity magnitude
                    extraBall.dx = Math.cos(angle) * ratio;
                    extraBall.dy = -Math.abs(Math.sin(angle) * ratio);  // Force upward direction
                    
                    this.activeEffects.extraBalls.push(extraBall);
                }
                addEffectTimer('Multi Ball', 10000);
                break;
        }

        // Show power-up message
        const message = document.createElement('div');
        message.className = 'power-up-message';
        message.style.position = 'absolute';
        message.style.left = `${box.x}px`;
        message.style.top = `${box.y}px`;
        message.style.color = box.color;
        message.style.fontWeight = 'bold';
        message.style.pointerEvents = 'none';
        message.style.animation = 'fadeUp 1s forwards';
        message.textContent = ['Wide Paddle!', 'Triple Points!', 'Multi Ball!'][box.effect];
        document.querySelector('.game-container').appendChild(message);
        setTimeout(() => message.remove(), 1000);
    }

    updatePowerBoxes() {
        const currentTime = Date.now();
        
        // Spawn new power box every 5 seconds
        if (currentTime - this.lastPowerBoxSpawn >= this.powerBoxSpawnInterval) {
            this.spawnPowerBox();
            this.lastPowerBoxSpawn = currentTime;
        }

        // Remove boxes after 5 seconds
        this.powerBoxes = this.powerBoxes.filter(box => {
            return currentTime - box.spawnTime < 5000;
        });

        // Check collision with ball and extra balls
        const balls = [this.ball, ...this.activeEffects.extraBalls];
        balls.forEach(ball => {
            // Check collision with power boxes
            this.powerBoxes.forEach((box, index) => {
                if (ball.x + ball.radius > box.x &&
                    ball.x - ball.radius < box.x + box.width &&
                    ball.y + ball.radius > box.y &&
                    ball.y - ball.radius < box.y + box.height) {
                    this.applyPowerEffect(box);
                    this.powerBoxes.splice(index, 1);
                    this.addParticles(box.x + box.width/2, box.y + box.height/2, box.color);
                }
            });
        });

        // Update extra balls
        this.activeEffects.extraBalls.forEach(ball => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Ball collision with walls
            if (ball.x + ball.radius > this.canvas.width || ball.x - ball.radius < 0) {
                ball.dx *= -1;
            }
            if (ball.y - ball.radius < 0) {
                ball.dy *= -1;
            }

            // Ball collision with paddle
            if (ball.y + ball.radius > this.paddle.y &&
                ball.x > this.paddle.x &&
                ball.x < this.paddle.x + this.paddle.width) {
                ball.dy = -ball.speed;
                const hitPos = (ball.x - this.paddle.x) / this.paddle.width;
                ball.dx = ball.speed * (hitPos - 0.5) * 2;
            }
        });

        // Remove extra balls that go below paddle
        this.activeEffects.extraBalls = this.activeEffects.extraBalls.filter(ball => 
            ball.y + ball.radius < this.canvas.height);

        // Don't end game if main ball is still in play
        if (this.ball.y + this.ball.radius < this.canvas.height) {
            return;
        }

        // Only end game if main ball is lost and no extra balls are left
        if (this.activeEffects.extraBalls.length === 0) {
            this.finishGame();
        }
    }

    calculateTrajectoryPoints() {
        const points = [{x: this.ball.x, y: this.ball.y}];
        let simX = this.ball.x;
        let simY = this.ball.y;
        let simDx = this.ball.speed;
        let simDy = -this.ball.speed;
        
        // Simulate ball path for a few steps
        for (let i = 0; i < 10; i++) {
            simX += simDx;
            simY += simDy;
            
            // Check wall collisions
            if (simX + this.ball.radius > this.canvas.width || simX - this.ball.radius < 0) {
                simDx *= -1;
            }
            if (simY - this.ball.radius < 0) {
                simDy *= -1;
            }
            
            // Check brick collisions
            for (const brick of this.bricks) {
                if (simX + this.ball.radius > brick.x &&
                    simX - this.ball.radius < brick.x + brick.width &&
                    simY + this.ball.radius > brick.y &&
                    simY - this.ball.radius < brick.y + brick.height) {
                    // Stop trajectory at first brick hit
                    return points;
                }
            }
            
            points.push({x: simX, y: simY});
        }
        
        return points;
    }
}

class GameManager {
    constructor() {
        this.game1 = null;
        this.game2 = null;
        this.currentMode = 'single';
        this.logEntries = JSON.parse(localStorage.getItem('gameHistory')) || [];
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.player1Name = localStorage.getItem('singlePlayerName') || 'Player 1';
        this.player2Name = 'Player 2';
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.startSinglePlayer();
        this.displayGameHistory();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }

    setupEventListeners() {
        const multiplayerBtn = document.getElementById('multiplayerBtn');
        const backToSingleBtn = document.getElementById('backToSingleBtn');
        const modal = document.getElementById('multiplayerModal');
        const startGameBtn = document.getElementById('startGameBtn');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const logFilter = document.getElementById('logFilter');
        const clearLogBtn = document.getElementById('clearLogBtn');
        const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
        const closeLogBtn = document.getElementById('closeLogBtn');
        const togglePowerupsBtn = document.getElementById('togglePowerupsBtn');
        const closePowerupsBtn = document.getElementById('closePowerupsBtn');
        const namePopup = document.getElementById('nameUpdatePopup');
        const nameInput = document.getElementById('nameUpdateInput');
        const saveNameBtn = document.getElementById('saveNameBtn');
        const cancelNameBtn = document.getElementById('cancelNameBtn');
        const player1Score = document.querySelector('.player1');

        if (!multiplayerBtn || !backToSingleBtn || !modal || !startGameBtn || !themeToggleBtn) {
            console.error('Required elements not found');
            return;
        }

        // Theme toggle
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            
            // Update ball colors in existing games
            if (this.game1) {
                this.game1.updateThemeColors();
            }
            if (this.game2) {
                this.game2.updateThemeColors();
            }
        });

        // Toggle history window
        if (toggleHistoryBtn) {
            toggleHistoryBtn.addEventListener('click', () => {
                const gameLog = document.querySelector('.game-log');
                if (gameLog) {
                    gameLog.classList.toggle('hidden');
                }
            });
        }

        // Close history window
        if (closeLogBtn) {
            closeLogBtn.addEventListener('click', () => {
                const gameLog = document.querySelector('.game-log');
                if (gameLog) {
                    gameLog.classList.add('hidden');
                }
            });
        }

        // Log filtering
        if (logFilter) {
            logFilter.addEventListener('change', () => {
                this.displayGameHistory(logFilter.value);
            });
        }

        // Clear game history
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all game history?')) {
                    this.logEntries = [];
                    localStorage.removeItem('gameHistory');
                    this.displayGameHistory();
                }
            });
        }

        // Multiplayer button
        multiplayerBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        // Back to single player
        backToSingleBtn.addEventListener('click', () => {
            this.startSinglePlayer();
            backToSingleBtn.classList.add('hidden');
            multiplayerBtn.classList.remove('hidden');
        });

        // Start multiplayer game
        startGameBtn.addEventListener('click', () => {
            const player1Input = document.getElementById('player1Name');
            const player2Input = document.getElementById('player2Name');
            
            if (player1Input && player2Input) {
                this.player1Name = player1Input.value.trim() || 'Player 1';
                this.player2Name = player2Input.value.trim() || 'Player 2';
            }

            this.startMultiplayer();
            modal.classList.remove('active');
            backToSingleBtn.classList.remove('hidden');
            multiplayerBtn.classList.add('hidden');
        });

        // Handle player name click in single player mode
        if (player1Score) {
            player1Score.addEventListener('click', () => {
                if (this.currentMode === 'single') {
                    nameInput.value = this.player1Name;
                    namePopup.classList.remove('hidden');
                }
            });
        }

        // Handle name update
        if (saveNameBtn && nameInput) {
            saveNameBtn.addEventListener('click', () => {
                const newName = nameInput.value.trim() || 'Player 1';
                this.player1Name = newName;
                localStorage.setItem('singlePlayerName', newName);
                
                const player1Element = document.querySelector('.player1');
                const scoreSpan = document.getElementById('score1');
                if (player1Element && scoreSpan) {
                    player1Element.textContent = `${newName}: `;
                    player1Element.appendChild(scoreSpan);
                }
                
                namePopup.classList.add('hidden');
            });
        }

        // Handle cancel name update
        if (cancelNameBtn) {
            cancelNameBtn.addEventListener('click', () => {
                namePopup.classList.add('hidden');
            });
        }

        // Close popup when clicking outside
        if (namePopup) {
            namePopup.addEventListener('click', (e) => {
                if (e.target === namePopup) {
                    namePopup.classList.add('hidden');
                }
            });
        }

        // Power-ups info panel toggle
        if (togglePowerupsBtn) {
            togglePowerupsBtn.addEventListener('click', () => {
                const powerupsInfo = document.querySelector('.powerups-info');
                if (powerupsInfo) {
                    powerupsInfo.classList.toggle('hidden');
                    // Hide game log if it's open
                    const gameLog = document.querySelector('.game-log');
                    if (gameLog && !gameLog.classList.contains('hidden')) {
                        gameLog.classList.add('hidden');
                    }
                }
            });
        }

        // Close power-ups info panel
        if (closePowerupsBtn) {
            closePowerupsBtn.addEventListener('click', () => {
                const powerupsInfo = document.querySelector('.powerups-info');
                if (powerupsInfo) {
                    powerupsInfo.classList.add('hidden');
                }
            });
        }
    }

    startSinglePlayer() {
        document.getElementById('game2').classList.add('hidden');
        this.game1 = new Game('gameCanvas', 'mouse', this.player1Name);
        this.currentMode = 'single';
        
        // Show best score in single player mode
        const bestScoreElement = document.querySelector('.best');
        if (bestScoreElement) {
            bestScoreElement.classList.remove('hidden');
        }
        
        // Update player name display
        const player1ScoreElement = document.querySelector('.player1');
        const scoreSpan = document.getElementById('score1');
        if (player1ScoreElement && scoreSpan) {
            player1ScoreElement.textContent = `${this.player1Name}: `;
            player1ScoreElement.appendChild(scoreSpan);
        }
    }

    startMultiplayer() {
        // Clear any existing scores from localStorage
        localStorage.removeItem('player1FinalScore');
        localStorage.removeItem('player2FinalScore');
        
        // Reset scores in UI
        const score1 = document.getElementById('score1');
        const score2 = document.getElementById('score2_2');
        
        if (score1) score1.textContent = '0';
        if (score2) score2.textContent = '0';
        
        // Hide best scores in multiplayer mode
        const bestScoreElements = document.querySelectorAll('.best');
        bestScoreElements.forEach(element => {
            element.classList.add('hidden');
        });
        
        // Show second game
        document.getElementById('game2').classList.remove('hidden');
        
        // Create new games with fresh scores
        this.game1 = new Game('gameCanvas', 'wasd', this.player1Name);
        this.game2 = new Game('gameCanvas2', 'arrows', this.player2Name);
        
        // Update player name displays
        const player1Element = document.querySelector('.player1');
        const player2Element = document.querySelector('.player2');
        
        if (player1Element && score1) {
            player1Element.textContent = `${this.player1Name}: `;
            player1Element.appendChild(score1);
        }
        
        if (player2Element && score2) {
            player2Element.textContent = `${this.player2Name}: `;
            player2Element.appendChild(score2);
        }
        
        // Set mode
        this.currentMode = 'sideBySide';
        
        // Refresh the game log display with current filter
        const logFilter = document.getElementById('logFilter');
        this.displayGameHistory(logFilter ? logFilter.value : 'all');
    }

    addLogEntry(text, details = {}) {
        // Load existing entries from localStorage first
        this.logEntries = JSON.parse(localStorage.getItem('gameHistory')) || [];
        
        const entry = {
            timestamp: new Date().toISOString(),
            text: text,
            gameType: this.currentMode,
            playerName: this.currentMode === 'single' ? this.player1Name : null,
            level: this.game1 ? this.game1.level : 1,
            score: details.score || 0,
            details: details
        };

        this.logEntries.unshift(entry);
        
        // Save to localStorage
        localStorage.setItem('gameHistory', JSON.stringify(this.logEntries));
        
        // Update display
        this.displayGameHistory();
    }

    displayGameHistory(filter = 'all') {
        const logContainer = document.getElementById('logEntries');
        if (!logContainer) return;

        // Always load the latest data from localStorage
        this.logEntries = JSON.parse(localStorage.getItem('gameHistory')) || [];

        logContainer.innerHTML = '';
        const filteredEntries = this.logEntries.filter(entry => {
            if (filter === 'all') return true;
            if (filter === 'single') return entry.gameType === 'single';
            if (filter === 'multi') return entry.gameType === 'sideBySide';
            return true;
        });

        filteredEntries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';

            const timestamp = new Date(entry.timestamp).toLocaleString();
            const gameType = entry.gameType === 'single' ? 'Single Player' : 'Multiplayer';
            
            let detailsHtml = '';
            if (entry.gameType === 'single') {
                detailsHtml = `
                    <div class="details">
                        Player: ${entry.playerName}<br>
                        Level: ${entry.level}<br>
                        Score: ${entry.score}
                    </div>
                `;
            } else if (entry.details.player1 && entry.details.player2) {
                detailsHtml = `
                    <div class="details">
                        ${entry.details.player1.name}: ${entry.details.player1.score}<br>
                        ${entry.details.player2.name}: ${entry.details.player2.score}
                    </div>
                `;
            }

            logEntry.innerHTML = `
                <div class="timestamp">${timestamp}</div>
                <div class="game-type">${gameType}</div>
                <div class="score">${entry.text}</div>
                ${detailsHtml}
            `;

            logContainer.appendChild(logEntry);
        });
    }

    finishGame(game) {
        const details = {
            score: game.finalScore,
            level: game.level,
            playerName: game.playerName
        };

        if (this.currentMode === 'single') {
            this.addLogEntry(
                `Game Over - Score: ${game.finalScore} - Level: ${game.level}`,
                details
            );
        }
    }
}

// Start the game manager when the page loads
window.onload = () => {
    // Make the GameManager instance globally accessible
    window.gameManager = new GameManager();
}; 