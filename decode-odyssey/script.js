

const correctMessages = [
    "Perfect! 🎯",
    "Brilliant! ⭐",
    "Amazing! 🌟",
    "You got it! 🎉",
    "Well done! 🏆"
];

const incorrectMessages = [
    "Not quite! 🤔",
    "Try again! 💫",
    "Almost there! 🎯",
    "Keep trying! 💪",
    "Wrong answer! ❌"
];

class EmojiGame {
    constructor() {
        // Get category from URL parameters with fallback values
        const urlParams = new URLSearchParams(window.location.search);
        this.category = urlParams.get('mode');
        this.categoryTitle = urlParams.get('title');
        
        // Map old mode names to correct JSON file names
        const modeMapping = {
            'players': 'football-players',
            'football-players': 'football-players'
        };
        
        // Use mapped mode if it exists, otherwise use original mode
        this.category = modeMapping[this.category] || this.category;
        
        // Redirect to home if no category is specified
        if (!this.category) {
            window.location.href = 'home.html';
            return;
        }

        this.questions = null;
        this.currentQuestionKey = null;
        this.score = 100;
        this.timeLeft = 30;
        this.timer = null;
        this.questionKeys = [];
        this.currentIndex = 0;
        this.usedHints = new Set();
        
        this.stats = {
            startTime: Date.now(),
            totalAttempts: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            hintsUsed: 0
        };

        this.initialize();
    }

    async initialize() {
        try {
            console.log('Loading category:', this.category);
            
            // Check if required DOM elements exist
            const requiredElements = [
                'categoryTitle',
                'emojis',
                'guess-input',
                '.hint-text',
                '.hint-button'
            ];
            
            for (const selector of requiredElements) {
                const element = selector.startsWith('.') 
                    ? document.querySelector(selector)
                    : document.getElementById(selector);
                    
                if (!element) {
                    throw new Error(`Required element not found: ${selector}`);
                }
            }
            
            const response = await fetch(`questions/${this.category}.json`);
            if (!response.ok) {
                console.error(`Failed to load: questions/${this.category}.json`);
                throw new Error('Failed to load questions');
            }
            
            this.questions = await response.json();
            console.log('Loaded questions:', this.questions);
            
            this.questionKeys = Object.keys(this.questions);
            
            if (this.questionKeys.length === 0) {
                throw new Error('No questions found for this category');
            }
            
            this.shuffleArray(this.questionKeys);
            this.currentQuestionKey = this.questionKeys[this.currentIndex];
            
            this.setupUI();
            this.loadQuestion();
            this.createCircles();
            this.startTimer();
            
        } catch (error) {
            console.error('Error initializing game:', error);
            console.error('Stack trace:', error.stack);
            alert('Failed to load game. Please try again.');
            window.location.href = 'home.html';
        }
    }

    setupUI() {
        document.getElementById('categoryTitle').textContent = this.categoryTitle;
        this.updateQuestionCounter();
        this.setupEventListeners();
    }

    loadQuestion() {
        if (this.currentIndex >= this.questionKeys.length) {
            this.showGameComplete();
            return;
        }

        this.currentQuestionKey = this.questionKeys[this.currentIndex];
        const question = this.questions[this.currentQuestionKey];
        
        // Add error checking for DOM elements
        const emojisElement = document.getElementById('emojis');
        const guessInput = document.getElementById('guess-input');
        const hintText = document.querySelector('.hint-text');
        const hintButton = document.querySelector('.hint-button');
        
        if (!emojisElement || !guessInput || !hintText || !hintButton) {
            console.error('Required DOM elements not found');
            return;
        }
        
        emojisElement.textContent = question.emojis;
        guessInput.value = '';
        guessInput.placeholder = question.hint;
        
        this.timeLeft = question.time;
        hintText.textContent = '';
        hintButton.classList.remove('used');
        
        // Update question counter
        this.updateQuestionCounter();
    }

    setupEventListeners() {
        const submitGuess = () => {
            // Check if we're in cooldown
            if (this.isInputCooldown) return;
            
            const guess = document.getElementById('guess-input').value.toLowerCase();
            
            // Set cooldown state and disable button
            this.isInputCooldown = true;
            this.disableSubmitButton();
            
            setTimeout(() => {
                this.isInputCooldown = false;
            }, 2500);
            
            this.stats.totalAttempts++;
            
            if (guess === this.currentQuestionKey) {
                this.stats.correctAnswers++;
                this.score += 50;
                this.updateScoreDisplay();
                this.showNotification(this.getRandomMessage(true), true);
                this.updateCircleColors(true);
                setTimeout(() => this.nextQuestion(), 2000);
            } else {
                this.stats.wrongAnswers++;
                this.score = Math.max(0, this.score - 10);
                this.updateScoreDisplay();
                
                if (this.score <= 0) {
                    this.showGameOver(false, "Game Over - Score reached zero!");
                    return;
                }
                
                this.showNotification(this.getRandomMessage(false), false);
                this.updateCircleColors(false);
                document.getElementById('guess-input').value = '';
            }
        };

        // Submit with arrow button
        const submitArrow = document.querySelector('.submit-arrow');
        if (submitArrow) {
            submitArrow.addEventListener('click', submitGuess);
        }

        // Submit with enter key
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitGuess();
                }
            });

            // Format input to maintain spacing
            guessInput.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase();
                e.target.value = value;
            });
        }

        // Add pause functionality
        const pauseButton = document.querySelector('.pause-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                clearInterval(this.timer);
                this.showPauseScreen();
            });
        }

        // Add surrender functionality
        const surrenderButton = document.querySelector('.surrender-button');
        if (surrenderButton) {
            surrenderButton.addEventListener('click', () => {
                this.showSurrenderScreen();
            });
        }

        // Update hint functionality
        const hintButton = document.querySelector('.hint-button');
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                if (!hintButton.classList.contains('used') && !this.usedHints.has(this.currentIndex)) {
                    const hintText = document.querySelector('.hint-text');
                    hintText.textContent = this.questions[this.currentQuestionKey].additionalHint;
                    hintButton.classList.add('used');
                    this.usedHints.add(this.currentIndex);
                    this.timeLeft = Math.max(this.timeLeft - 5, 1);
                    this.score = Math.max(0, this.score - 25); // Deduct points for hint
                    this.stats.hintsUsed++;
                    this.updateScoreDisplay();
                }
            });
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            document.querySelector('.timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.showGameOver(false, "Time's up!");
            }
        }, 1000);
    }

    createCircles() {
        const container = document.querySelector('.circle-container');
        container.innerHTML = '';
        
        // Get the color from current question, fallback to default if not available
        const currentQuestion = this.questions[this.currentQuestionKey];
        const backgroundColor = currentQuestion ? currentQuestion.color : '#4CAF50';
        
        for (let i = 0; i < 8; i++) {
            const circle = document.createElement('div');
            circle.className = 'circle';
            
            const size = Math.random() * 200 + 100 + 'px';
            circle.style.width = size;
            circle.style.height = size;
            
            circle.style.left = Math.random() * 100 + '%';
            circle.style.top = Math.random() * 100 + '%';
            
            circle.style.backgroundColor = backgroundColor;
            
            circle.style.animationDelay = `${i * -2}s`;
            circle.style.animationDuration = `${20 + i * 5}s`;
            
            container.appendChild(circle);
        }
    }

    showGameOver(won, message = '') {
        clearInterval(this.timer);

        // Update games played in localStorage
        const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed')) || 0;
        localStorage.setItem('gamesPlayed', gamesPlayed + 1);

        const gameBox = document.querySelector('.game-box');
        gameBox.innerHTML = `
            <div class="surrender-screen show">
                <h2>${message || (won ? 'Game Over' : `The answer was: ${this.currentQuestionKey.toUpperCase()}`)}</h2>
                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-label2">Final Score</span>
                        <span class="stat-value2">${this.score}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label2">Games Played</span>
                        <span class="stat-value2">${gamesPlayed + 1}</span>
                    </div>
                </div>
                <div class="button-container">
                    <button class="control-button restart-button">
                        <i class="fas fa-redo"></i> Play Again
                    </button>
                    <button class="control-button home-button">
                        <i class="fas fa-home"></i> Go Home
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for the buttons
        document.querySelector('.restart-button').addEventListener('click', () => {
            location.reload();
        });
        document.querySelector('.home-button').addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    showGameComplete() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.stats.startTime) / 1000);
        const accuracy = Math.round((this.stats.correctAnswers / this.questionKeys.length) * 100);

        // Update stats in localStorage
        const currentBestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed')) || 0;

        // Update best score if current score is higher
        if (this.score > currentBestScore) {
            localStorage.setItem('bestScore', this.score);
        }

        // Increment games played
        localStorage.setItem('gamesPlayed', gamesPlayed + 1);

        const gameBox = document.querySelector('.game-box');
        gameBox.innerHTML = `
            <div class="game-complete show">
                <h2>Congratulations!</h2>
                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-label2">Final Score</span>
                        <span class="stat-value2">${this.score}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label2">Best Score</span>
                        <span class="stat-value2">${Math.max(currentBestScore, this.score)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label2">Games Played</span>
                        <span class="stat-value2">${gamesPlayed + 1}</span>
                    </div>
                </div>
                <div class="detailed-stats">
                    <p>Accuracy: ${accuracy}%</p>
                    <p>Total Time: ${this.formatTime(totalTime)}</p>
                    <p>Correct Answers: ${this.stats.correctAnswers}</p>
                    <p>Wrong Answers: ${this.stats.wrongAnswers}</p>
                    <p>Hints Used: ${this.stats.hintsUsed}</p>
                </div>
                <div class="button-container">
                    <button class="control-button restart-button">
                        <i class="fas fa-redo"></i> Play Again
                    </button>
                    <button class="control-button home-button">
                        <i class="fas fa-home"></i> Go Home
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for both buttons
        document.querySelector('.restart-button').addEventListener('click', () => {
            location.reload();
        });
        document.querySelector('.home-button').addEventListener('click', () => {
            window.location.href = 'home.html';
        });

        // Trigger confetti
        this.celebrateCompletion();
    }

    celebrateCompletion() {
        const duration = 10000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    showPauseScreen() {
        const gameBox = document.querySelector('.game-box');
        gameBox.innerHTML = `
            <div class="pause-screen show">
                <h2>Game Paused</h2>
                <div class="button-container">
                    <button class="control-button resume-button">
                        <i class="fas fa-play"></i> Resume Game
                    </button>
                    <button class="control-button restart-button">
                        <i class="fas fa-redo"></i> Restart Game
                    </button>
                    <button class="control-button home-button">
                        <i class="fas fa-home"></i> Go Home
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for the new buttons
        document.querySelector('.resume-button').addEventListener('click', () => {
            this.resumeGame();
        });
        document.querySelector('.restart-button').addEventListener('click', () => {
            location.reload();
        });
        document.querySelector('.home-button').addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    resumeGame() {
        const gameBox = document.querySelector('.game-box');
        gameBox.innerHTML = `
            <div class="timer">00:${this.timeLeft}</div>
            <div class="stats-row">
                <div class="question-counter">${this.currentIndex + 1}/${this.questionKeys.length}</div>
                <div class="score-display">Score: ${this.score}</div>
            </div>
            <div class="emojis">${this.questions[this.currentQuestionKey].emojis}</div>
            <div class="hint-text">${this.usedHints.has(this.currentIndex) ? this.questions[this.currentQuestionKey].additionalHint : ''}</div>
            <div class="input-container">
                <input type="text" id="guess-input" placeholder="${this.questions[this.currentQuestionKey].hint}" maxlength="6">
                <button class="submit-arrow">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="control-buttons">
                <button class="control-button hint-button ${this.usedHints.has(this.currentIndex) ? 'used' : ''}" title="Get Hint">
                    <i class="fas fa-lightbulb"></i>
                </button>
                <button class="control-button pause-button" title="Pause">
                    <i class="fas fa-pause"></i>
                </button>
                <button class="control-button surrender-button" title="Surrender">
                    <i class="fas fa-flag"></i>
                </button>
            </div>
        `;

        this.setupEventListeners();
        this.startTimer();
    }

    showSurrenderScreen() {
        clearInterval(this.timer);

        // Update games played in localStorage
        const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed')) || 0;
        localStorage.setItem('gamesPlayed', gamesPlayed + 1);

        const gameBox = document.querySelector('.game-box');
        gameBox.innerHTML = `
            <div class="surrender-screen show">
                <h2>Game Over</h2>
                <p class="answer-reveal">The answer was: <span>${this.currentQuestionKey.toUpperCase()}</span></p>
                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-label2">Games Played</span>
                        <span class="stat-value2">${gamesPlayed + 1}</span>
                    </div>
                </div>
                <div class="button-container">
                    <button class="control-button restart-button">Play Again</button>
                    <button class="control-button home-button">Go Home</button>
                </div>
            </div>
        `;

        // Add event listeners for the new buttons
        document.querySelector('.restart-button').addEventListener('click', () => {
            location.reload();
        });
        document.querySelector('.home-button').addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    showNotification(message, isSuccess) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.game-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `game-notification ${isSuccess ? 'success' : 'error'}`;
        notification.textContent = message;
        
        // Add to game box
        document.querySelector('.game-box').appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    getRandomMessage(isSuccess) {
        const messages = isSuccess ? correctMessages : incorrectMessages;
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }

    // Add this method to reset hint state
    resetHintState() {
        const hintButton = document.querySelector('.hint-button');
        const hintText = document.querySelector('.hint-text');
        if (hintButton) {
            hintButton.classList.remove('used');
        }
        if (hintText) {
            hintText.textContent = '';
        }
    }

    updateScoreDisplay() {
        document.querySelector('.score-display').textContent = `Score: ${this.score}`;
    }

    // Add this method to the EmojiDecoder class
    disableSubmitButton(duration = 2500) {
        const submitButton = document.querySelector('.submit-arrow');
        if (!submitButton) return;

        // Get the icon if it exists
        const submitIcon = submitButton.querySelector('i');
        
        // Disable the button
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.style.cursor = 'not-allowed';
        
        // Update icon opacity if it exists
        if (submitIcon) {
            submitIcon.style.opacity = '0.5';
        }
        
        // Re-enable after duration
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
            if (submitIcon) {
                submitIcon.style.opacity = '1';
            }
        }, duration);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Add this method to update question counter
    updateQuestionCounter() {
        document.querySelector('.question-counter').textContent = 
            `${this.currentIndex + 1}/${this.questionKeys.length}`;
    }

    // Add this method to handle next question
    nextQuestion() {
        this.currentIndex++;
        this.loadQuestion();
    }

    // Add this method to update circle colors
    updateCircleColors(isSuccess) {
        const circles = document.querySelectorAll('.circle');
        const originalColor = this.questions[this.currentQuestionKey].color;
        const newColor = isSuccess ? '#4CAF50' : '#f44336';

        circles.forEach(circle => {
            circle.style.backgroundColor = newColor;
        });

        setTimeout(() => {
            circles.forEach(circle => {
                circle.style.backgroundColor = originalColor;
            });
        }, 2000);
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmojiGame();
}); 