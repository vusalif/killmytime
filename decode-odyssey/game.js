
class EmojiGame {
    constructor() {
        this.currentMode = new URLSearchParams(window.location.search).get('mode');
        this.currentTitle = decodeURIComponent(new URLSearchParams(window.location.search).get('title'));
        this.questions = null;
        this.currentQuestion = null;
        this.score = 0;
        this.questionKeys = [];
        this.currentQuestionIndex = 0;
        this.timer = null;
        this.timeLeft = 30;
        
        this.initialize();
    }

    async initialize() {
        try {
            // Load questions for the selected category
            const response = await fetch(`questions/${this.currentMode}.json`);
            if (!response.ok) throw new Error('Failed to load questions');
            this.questions = await response.json();
            
            // Get all question keys and shuffle them
            this.questionKeys = Object.keys(this.questions);
            this.shuffleArray(this.questionKeys);
            
            // Setup UI
            this.setupUI();
            
            // Start the first question
            this.loadNextQuestion();
        } catch (error) {
            console.error('Error initializing game:', error);
            alert('Failed to load game. Please try again.');
        }
    }

    setupUI() {
        document.getElementById('categoryTitle').textContent = this.currentTitle;
        document.getElementById('score').textContent = this.score;
        
        // Setup answer submission
        document.getElementById('answerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkAnswer();
        });

        // Setup hint button
        document.getElementById('hintButton').addEventListener('click', () => {
            this.showHint();
        });
    }

    loadNextQuestion() {
        if (this.currentQuestionIndex >= this.questionKeys.length) {
            this.endGame();
            return;
        }

        const questionKey = this.questionKeys[this.currentQuestionIndex];
        this.currentQuestion = this.questions[questionKey];
        
        // Update UI with new question
        document.getElementById('emojis').textContent = this.currentQuestion.emojis;
        document.getElementById('hint').textContent = this.currentQuestion.hint;
        document.getElementById('answerInput').value = '';
        
        // Reset and start timer
        this.timeLeft = this.currentQuestion.time;
        this.startTimer();
        
        // Update question counter
        document.getElementById('questionCounter').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questionKeys.length}`;
    }

    checkAnswer() {
        const userAnswer = document.getElementById('answerInput').value.toLowerCase().trim();
        const correctAnswer = this.questionKeys[this.currentQuestionIndex].toLowerCase();

        if (userAnswer === correctAnswer) {
            this.score += Math.ceil(this.timeLeft / 3); // More time left = more points
            document.getElementById('score').textContent = this.score;
            this.showFeedback(true);
        } else {
            this.showFeedback(false);
        }
    }

    showFeedback(isCorrect) {
        clearInterval(this.timer);
        const feedback = document.getElementById('feedback');
        feedback.textContent = isCorrect ? 'Correct!' : 'Wrong!';
        feedback.className = isCorrect ? 'feedback correct' : 'feedback wrong';
        
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = 'feedback';
            this.currentQuestionIndex++;
            this.loadNextQuestion();
        }, 1500);
    }

    showHint() {
        document.getElementById('additionalHint').textContent = 
            this.currentQuestion.additionalHint;
    }

    startTimer() {
        clearInterval(this.timer);
        document.getElementById('timer').textContent = this.timeLeft;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.showFeedback(false);
            }
        }, 1000);
    }

    endGame() {
        // Save score to localStorage if it's a new best score
        const bestScore = localStorage.getItem('bestScore') || 0;
        if (this.score > bestScore) {
            localStorage.setItem('bestScore', this.score);
        }
        
        // Update games played count
        const gamesPlayed = (parseInt(localStorage.getItem('gamesPlayed')) || 0) + 1;
        localStorage.setItem('gamesPlayed', gamesPlayed);
        
        // Show end game screen
        document.getElementById('gameContainer').innerHTML = `
            <div class="end-game">
                <h2>Game Over!</h2>
                <p>Final Score: ${this.score}</p>
                <p>Best Score: ${Math.max(bestScore, this.score)}</p>
                <button onclick="location.href='index.html'">Play Again</button>
            </div>
        `;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmojiGame();
}); 