class CircleFootball {
    constructor() {
        // Initialize recording properties
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

        // Add speed settings
        this.speedSettings = {
            ballSpeed: 1.0,
            goalSpeed: 1.0,
            timerSpeed: 1.0,
            bounceLevel: 1.0  // Add bounce level setting
        };

        // Add timer interval tracking
        this.timerInterval = null;

        // Add animation frame tracking
        this.animationFrameId = null;

        // Add pause state
        this.isPaused = false;

        // Add border color settings
        this.borderColors = {
            fieldBorder: '#ffffff',
            circleBorder: '#ffffff'
        };

        // Initialize customization properties
        this.customization = {
            player1: {
                name: 'Red Player',
                color: '#ff4444',
                image: null,
                size: 20
            },
            player2: {
                name: 'Blue Player',
                color: '#4444ff',
                image: null,
                size: 20
            }
        };

        // Initialize sounds with correct initial values
        this.sounds = {
            hit: {
                audio: new Audio('sound.wav'),
                volume: 0.3,
                enabled: true
            },
            goal: {
                audio: new Audio('goal.MP3'),
                volume: 0.5,
                enabled: true
            },
            ambient: {
                audio: new Audio('ambient.wav'),
                volume: 0.01,
                enabled: false
            }
        };

        // Set up ambient sound to loop
        this.sounds.ambient.audio.loop = true;

        // Initialize master volume with correct value
        this.masterVolume = 0.5;
        this.masterEnabled = true;

        // Add hit effects array
        this.hitEffects = [];

        // Initialize visual settings with correct initial values
        this.visualSettings = {
            trail: {
                enabled: true,
                length: 20,
                opacity: 0.5,
                fadeSpeed: 0.3
            },
            shadow: {
                enabled: true,
                offset: 5,
                blur: 10,
                opacity: 0.3
            }
        };

        // Initialize trail arrays for each ball
        this.trails = [[], []];

        // Add game state flag
        this.isGameRunning = false;

        // Initialize sound settings
        this.initializeSoundSettings();
        // Initialize visual settings
        this.initializeVisualSettings();

        // Wait for customization before initializing game
        this.initializeCustomization();

        // Initialize recording functionality
        this.initializeRecording();

        // Add injury time properties
        this.injuryTime = {
            firstHalf: 0,
            secondHalf: 0,
            showing: false,
            displayTimer: 0,
            displayDuration: 2000  // 2 seconds to show the added time message
        };

        // Add added time animation properties
        this.addedTimeDisplay = {
            showing: false,
            timer: 0,
            duration: 2000,
            text: ''
        };
    }

    initializeRecording() {
        const recordBtn = document.getElementById('recordBtn');
        
        recordBtn.addEventListener('click', async () => {
            if (!this.isRecording) {
                try {
                    // Get the game container element
                    const gameContainer = document.getElementById('gameContainer');
                    
                    // Configure screen capture
                    const displayMediaOptions = {
                        video: {
                            displaySurface: 'browser',
                            cursor: 'always'
                        },
                        audio: true
                    };

                    // Start screen capture
                    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                    
                    // Create MediaRecorder
                    this.mediaRecorder = new MediaRecorder(stream);
                    
                    // Handle recorded data
                    this.mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            this.recordedChunks.push(event.data);
                        }
                    };
                    
                    // Handle recording stop
                    this.mediaRecorder.onstop = () => {
                        // Create blob from recorded chunks
                        const blob = new Blob(this.recordedChunks, {
                            type: 'video/webm'
                        });
                        
                        // Create download link
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        document.body.appendChild(a);
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'circle-football-game.webm';
                        
                        // Trigger download
                        a.click();
                        
                        // Cleanup
                        window.URL.revokeObjectURL(url);
                        this.recordedChunks = [];
                        
                        // Update button state
                        recordBtn.classList.remove('recording');
                        recordBtn.innerHTML = '<span>🎥</span> Record';
                        this.isRecording = false;
                    };
                    
                    // Start recording
                    this.mediaRecorder.start();
                    this.isRecording = true;
                    
                    // Update button state
                    recordBtn.classList.add('recording');
                    recordBtn.innerHTML = '<span>⏺</span> Stop Recording';
                    
                    // Add event listener to stop recording when stream ends
                    stream.getVideoTracks()[0].onended = () => {
                        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                            this.mediaRecorder.stop();
                        }
                    };
                    
                } catch (err) {
                    console.error("Error: " + err);
                }
            } else {
                // Stop recording
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }
        });
    }

    initializeSoundSettings() {
        // Get DOM elements
        const soundSettingsBtn = document.getElementById('soundSettingsBtn');
        const soundSettingsModal = document.getElementById('soundSettingsModal');
        const settingsContainer = document.querySelector('.sound-settings-container');
        const closeSettingsBtn = document.querySelector('.close-settings');

        // Hide settings modal initially
        soundSettingsModal.style.display = 'none';

        // Set initial values for sound controls
        document.getElementById('masterVolume').value = this.masterVolume * 100;
        document.getElementById('masterVolume').nextElementSibling.textContent = `${this.masterVolume * 100}%`;
        document.getElementById('masterToggle').checked = this.masterEnabled;

        // Set initial values for individual sounds
        Object.entries(this.sounds).forEach(([type, sound]) => {
            const toggle = document.getElementById(`${type}SoundToggle`);
            const volume = document.getElementById(`${type}SoundVolume`);
            if (toggle && volume) {
                toggle.checked = sound.enabled;
                volume.value = sound.volume * 100;
                volume.nextElementSibling.textContent = `${sound.volume * 100}%`;
            }
        });

        // Special case for ambient which is named differently in HTML
        document.getElementById('ambientToggle').checked = this.sounds.ambient.enabled;
        document.getElementById('ambientVolume').value = this.sounds.ambient.volume * 100;
        document.getElementById('ambientVolume').nextElementSibling.textContent = `${this.sounds.ambient.volume * 100}%`;

        // Initialize dragging variables
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Show settings panel
        soundSettingsBtn.addEventListener('click', () => {
            soundSettingsModal.style.display = 'block';
        });

        // Make settings panel draggable
        settingsContainer.addEventListener('mousedown', (e) => {
            if (e.target === settingsContainer || e.target.closest('.sound-settings-header')) {
                isDragging = true;
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                soundSettingsModal.style.transform = 
                    `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Close settings panel
        closeSettingsBtn.addEventListener('click', () => {
            soundSettingsModal.style.display = 'none';
            // Reset position when closing
            xOffset = 0;
            yOffset = 0;
            soundSettingsModal.style.transform = 'translate(0px, 0px)';
        });

        // Sound controls
        const masterToggle = document.getElementById('masterToggle');
        const masterVolumeSlider = document.getElementById('masterVolume');
        const hitSoundToggle = document.getElementById('hitSoundToggle');
        const hitSoundVolume = document.getElementById('hitSoundVolume');
        const goalSoundToggle = document.getElementById('goalSoundToggle');
        const goalSoundVolume = document.getElementById('goalSoundVolume');
        const ambientToggle = document.getElementById('ambientToggle');
        const ambientVolume = document.getElementById('ambientVolume');

        // Master volume control
        masterToggle.addEventListener('change', (e) => {
            this.masterEnabled = e.target.checked;
            this.updateAllVolumes();
            soundSettingsBtn.querySelector('span').textContent = this.masterEnabled ? '🔊' : '🔈';
        });

        masterVolumeSlider.addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            e.target.parentElement.querySelector('.volume-value').textContent = `${e.target.value}%`;
            this.updateAllVolumes();
        });

        // Individual sound controls
        const setupSoundControl = (type, toggle, slider) => {
            toggle.addEventListener('change', (e) => {
                this.sounds[type].enabled = e.target.checked;
                this.updateVolume(type);
            });

            slider.addEventListener('input', (e) => {
                this.sounds[type].volume = e.target.value / 100;
                e.target.parentElement.querySelector('.volume-value').textContent = `${e.target.value}%`;
                this.updateVolume(type);
            });
        };

        setupSoundControl('hit', hitSoundToggle, hitSoundVolume);
        setupSoundControl('goal', goalSoundToggle, goalSoundVolume);
        setupSoundControl('ambient', ambientToggle, ambientVolume);

        // Handle sound file uploads
        const setupSoundUpload = (type, fileInput) => {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    this.sounds[type].audio.src = url;
                    // Reset sound to beginning if it was playing
                    this.sounds[type].audio.currentTime = 0;
                    if (type === 'ambient' && this.sounds.ambient.enabled) {
                        this.sounds[type].audio.play();
                    }
                }
            });
        };

        setupSoundUpload('hit', document.getElementById('hitSoundFile'));
        setupSoundUpload('goal', document.getElementById('goalSoundFile'));
        setupSoundUpload('ambient', document.getElementById('ambientSoundFile'));

        // Handle color settings
        const fieldColor = document.getElementById('fieldColor');
        const backgroundColor = document.getElementById('backgroundColor');

        fieldColor.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--field-color', e.target.value);
        });

        backgroundColor.addEventListener('input', (e) => {
            document.body.style.background = e.target.value;
        });

        // Initialize tab switching
        const visualTab = document.getElementById('visualTab');
        const soundTab = document.getElementById('soundTab');
        const customTab = document.getElementById('customTab');
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const tabName = button.getAttribute('data-tab');
                soundTab.style.display = tabName === 'sound' ? 'block' : 'none';
                visualTab.style.display = tabName === 'visual' ? 'block' : 'none';
                customTab.style.display = tabName === 'custom' ? 'block' : 'none';
            });
        });
    }

    updateAllVolumes() {
        Object.keys(this.sounds).forEach(type => {
            this.updateVolume(type);
        });
    }

    updateVolume(type) {
        const sound = this.sounds[type];
        sound.audio.volume = this.masterEnabled && sound.enabled ? 
            (this.masterVolume * sound.volume) : 0;
    }

    playSound(type) {
        if (this.masterEnabled && this.sounds[type].enabled) {
            const sound = this.sounds[type].audio.cloneNode();
            sound.volume = this.masterVolume * this.sounds[type].volume;
            sound.play().catch(e => console.log(`Error playing ${type} sound:`, e));
        }
    }

    // Replace old playHitSound method
    playHitSound() {
        this.playSound('hit');
    }

    // Add method to play goal sound
    playGoalSound() {
        this.playSound('goal');
    }

    // Add method to handle ambient sound
    startAmbientSound() {
        if (this.masterEnabled && this.sounds.ambient.enabled) {
            this.sounds.ambient.audio.play().catch(e => console.log('Error playing ambient sound:', e));
        }
    }

    stopAmbientSound() {
        this.sounds.ambient.audio.pause();
        this.sounds.ambient.audio.currentTime = 0;
    }

    initializeCustomization() {
        // Set up preview updates
        ['red', 'blue'].forEach((player, index) => {
            const colorInput = document.getElementById(`${player}Color`);
            const nameInput = document.getElementById(`${player}Name`);
            const imageInput = document.getElementById(`${player}Image`);
            const preview = document.getElementById(`${player}Preview`);
            const sizeInput = document.getElementById(`${player}Size`);
            const sizeValue = document.getElementById(`${player}SizeValue`);
            const chanceSlider = document.getElementById(`player${index + 1}Chance`);
            const chanceValue = document.getElementById(`player${index + 1}ChanceValue`);
            const chanceLabel = document.getElementById(`player${index + 1}ChanceLabel`);
            const warningDiv = document.getElementById(`player${index + 1}Warning`);
            const disclaimer = document.querySelector('.chance-disclaimer');

            // Add size handling
            sizeInput.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                sizeValue.textContent = `${size}px`;
                this.customization[`player${index + 1}`].size = size;
                
                // Update preview size
                preview.style.width = `${size * 2}px`;
                preview.style.height = `${size * 2}px`;
            });

            // Initialize preview size
            preview.style.width = `${this.customization[`player${index + 1}`].size * 2}px`;
            preview.style.height = `${this.customization[`player${index + 1}`].size * 2}px`;

            // Add cheat mode handling
            const cheatMode = document.getElementById('cheatMode');
            cheatMode.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Disable sliders and set to 100%
                    chanceSlider.disabled = true;
                    chanceSlider.value = 100;
                    chanceValue.textContent = '100%';
                    this.customization[`player${index + 1}`].goalChance = 1;
                    warningDiv.textContent = '';
                    disclaimer.style.display = 'none';
                } else {
                    // Re-enable sliders and reset to default
                    chanceSlider.disabled = false;
                    chanceSlider.value = 15;
                    chanceValue.textContent = '15%';
                    this.customization[`player${index + 1}`].goalChance = 0.15;
                }
            });

            // Update preview when color changes
            colorInput.addEventListener('input', (e) => {
                preview.style.backgroundImage = '';  // Remove any existing image
                preview.style.backgroundColor = e.target.value;
                this.customization[`player${index + 1}`].color = e.target.value;
                this.customization[`player${index + 1}`].image = null;  // Clear the stored image
                chanceLabel.style.color = e.target.value;
            });

            // Initialize preview color and label color
            preview.style.backgroundColor = colorInput.value;
            chanceLabel.style.color = colorInput.value;

            // Update name
            nameInput.addEventListener('input', (e) => {
                this.customization[`player${index + 1}`].name = e.target.value;
                chanceLabel.textContent = `${e.target.value} Goal Chance`;
            });

            // Update chance value display with warnings
            chanceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                chanceValue.textContent = `${value}%`;
                this.customization[`player${index + 1}`].goalChance = value / 100;

                // Show/hide warnings based on value
                if (value > 30) {
                    warningDiv.textContent = `High scoring chance!`;
                    disclaimer.style.display = 'block';
                } else {
                    warningDiv.textContent = '';
                    // Only hide disclaimer if both sliders are below 30
                    const otherSlider = document.getElementById(`player${index === 0 ? 2 : 1}Chance`);
                    if (parseInt(otherSlider.value) <= 30) {
                        disclaimer.style.display = 'none';
                    }
                }
            });

            // Initialize chance
            this.customization[`player${index + 1}`].goalChance = 0.15;

            // Handle image upload
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            // Create a canvas to resize the image
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = 100;
                            canvas.height = 100;
                            
                            // Draw the image circular
                            ctx.beginPath();
                            ctx.arc(50, 50, 50, 0, Math.PI * 2);
                            ctx.clip();
                            ctx.drawImage(img, 0, 0, 100, 100);
                            
                            // Store the image data
                            this.customization[`player${index + 1}`].image = canvas.toDataURL();
                            preview.style.backgroundImage = `url(${canvas.toDataURL()})`;
                            preview.style.backgroundColor = 'transparent';
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    initializeGame() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.center = { x: this.width / 2, y: this.height / 2 };
        this.radius = (Math.min(this.width, this.height) / 2) - 10;

        // Initialize restart button
        const restartBtn = document.getElementById('restartBtn');
        restartBtn.addEventListener('click', () => this.restartGame());

        // Initialize pause button
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.addEventListener('click', () => this.togglePause());

        // Update player displays
        const player1Image = document.getElementById('player1Image');
        const player2Image = document.getElementById('player2Image');
        const player1Name = document.getElementById('player1Name');
        const player2Name = document.getElementById('player2Name');

        // Set player images
        if (this.customization.player1.image) {
            player1Image.style.backgroundImage = `url(${this.customization.player1.image})`;
        } else {
            player1Image.style.backgroundColor = this.customization.player1.color;
        }
        if (this.customization.player2.image) {
            player2Image.style.backgroundImage = `url(${this.customization.player2.image})`;
        } else {
            player2Image.style.backgroundColor = this.customization.player2.color;
        }

        // Set player names
        player1Name.textContent = this.customization.player1.name;
        player2Name.textContent = this.customization.player2.name;
        player1Name.style.color = this.customization.player1.color;
        player2Name.style.color = this.customization.player2.color;

        // Initialize game state with customized properties
        this.timeLeft = 1;
        this.score = { player1: 0, player2: 0 };
        this.gameStarted = false;

        // Ball properties with customization
        this.balls = [
            {
                x: this.center.x - 50 + (Math.random() - 0.5) * 100,
                y: this.center.y + (Math.random() - 0.5) * 100,
                radius: this.customization.player1.size,
                color: this.customization.player1.color,
                image: this.customization.player1.image,
                velocityX: 0,
                velocityY: 0,
                angularVelocity: 0,
                rotation: 0,
                mass: 1,
                drag: 0.995,
                restitution: 1.0,
                bouncePower: 15,
                spinFactor: 0.3
            },
            {
                x: this.center.x + 50 + (Math.random() - 0.5) * 100,
                y: this.center.y + (Math.random() - 0.5) * 100,
                radius: this.customization.player2.size,
                color: this.customization.player2.color,
                image: this.customization.player2.image,
                velocityX: 0,
                velocityY: 0,
                angularVelocity: 0,
                rotation: 0,
                mass: 1,
                drag: 0.995,
                restitution: 1.0,
                bouncePower: 15,
                spinFactor: 0.3
            }
        ];

        // Game state
        this.timeLeft = 1;
        this.score = { player1: 0, player2: 0 };
        this.gameStarted = false;

        // Goal properties
        this.goalWidth = 80;  // Back to original width
        this.goalHeight = this.goalWidth * 0.7;
        this.goalDepth = this.goalWidth * 0.6;  // Increased from 0.3 to make posts extend further
        this.goalAngle = 0;
        this.goalRotationSpeed = 0.01;

        // Add halftime display properties
        this.showHalftime = false;
        this.halftimeTimer = 0;
        this.halftimeDisplayTime = 2000;

        // Mouse interaction
        this.selectedBall = null;
        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;

        // Physics constants
        this.gravity = 0.4;
        this.groundFriction = 0.98;
        this.rotationFriction = 0.98;
        this.tangentialFriction = 0.995;
        this.bounceSpeed = 20;

        // Bind event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Set game as running
        this.isGameRunning = true;

        // Start game loop and timer
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
        this.startTimer();

        // Confetti system
        this.confetti = [];
        this.showGoal = false;
        this.goalTimer = 0;
        this.goalDisplayTime = 2000;

        // Replace goalkeeper properties with goal probability
        this.goalProperties = {
            baseChance: this.getStartChance(),  // Initial random chance (0-20%)
            lastMissTime: 0,
            missAnimationDuration: 800,
            isMissed: false,
            lastHalfUpdate: 0
        };

        // Add statistics tracking
        this.stats = {
            player1: {
                shotsOnGoal: 0,
                wallHits: 0,
                ballCollisions: 0,
                goals: [],  // Array to store goal minutes
            },
            player2: {
                shotsOnGoal: 0,
                wallHits: 0,
                ballCollisions: 0,
                goals: [],  // Array to store goal minutes
            }
        };

        // Create stats display
        this.createStatsDisplay();

        // Start ambient sound when game starts
        this.startAmbientSound();

        // Initialize in-game customization
        this.initializeInGameCustomization();
    }

    // Different chance ranges for different stages
    getStartChance() {
        return Math.random() * 0.2;  // 0-20%
    }

    getHalftimeChance() {
        return 0.1 + Math.random() * 0.2;  // 10-30%
    }

    handleMouseUp() {
        if (this.isDragging && this.selectedBall !== null) {
            const ball = this.balls[this.selectedBall];
            const power = 0.8;  // Fixed shot power
            
            ball.velocityX = (this.mousePos.x - ball.x) * power;
            ball.velocityY = (this.mousePos.y - ball.y) * power;
            
            // Add spin
            const spinFactor = (Math.random() - 0.5) * 0.3;
            const tempVelX = ball.velocityX;
            ball.velocityX += ball.velocityY * spinFactor;
            ball.velocityY -= tempVelX * spinFactor;
        }
        this.isDragging = false;
        this.selectedBall = null;
    }

    update(deltaTime) {
        // Skip update if game is paused
        if (this.isPaused) return;

        // Update hit effects
        this.updateHitEffects();

        // Update goal position
        this.goalAngle += this.goalRotationSpeed;

        // Update trails
        this.updateTrails();

        // Update balls
        this.balls.forEach((ball, index) => {
            if (this.selectedBall === null || !this.isDragging) {
                // Apply gravity
                ball.velocityY += this.gravity;

                // Calculate ball's position relative to center
                const dx = ball.x - this.center.x;
                const dy = ball.y - this.center.y;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

                if (distanceFromCenter > 0) {
                    // Calculate tangential and radial components
                    const angle = Math.atan2(dy, dx);
                    const normalX = dx / distanceFromCenter;
                    const normalY = dy / distanceFromCenter;
                    const tangentX = -normalY;
                    const tangentY = normalX;

                    // Apply circular motion forces
                    if (distanceFromCenter + ball.radius > this.radius) {
                        // Create hit effect at collision point
                        const hitX = this.center.x + normalX * this.radius;
                        const hitY = this.center.y + normalY * this.radius;
                        this.createHitEffect(hitX, hitY, ball.color);

                        // Play hit sound
                        this.playHitSound();

                        // Track wall hits
                        this.stats[index === 0 ? 'player1' : 'player2'].wallHits++;
                        this.updateStatsDisplay();

                        // Collision with outer circle
                        ball.x = this.center.x + normalX * (this.radius - ball.radius);
                        ball.y = this.center.y + normalY * (this.radius - ball.radius);

                        // Apply fixed bounce speed
                        const bounceDirection = (Math.random() - 0.5) * 0.5;
                        const cos = Math.cos(bounceDirection);
                        const sin = Math.sin(bounceDirection);
                        
                        // Calculate bounce velocity with fixed speed and speed multiplier
                        const bounceVelX = -normalX * this.bounceSpeed * this.speedSettings.ballSpeed * this.speedSettings.bounceLevel;
                        const bounceVelY = -normalY * this.bounceSpeed * this.speedSettings.ballSpeed * this.speedSettings.bounceLevel;
                        
                        // Apply bounce with slight angle variation
                        ball.velocityX = bounceVelX * cos - bounceVelY * sin;
                        ball.velocityY = bounceVelX * sin + bounceVelY * cos;

                        // Update rotation based on new velocity
                        ball.angularVelocity = (ball.velocityX * tangentX + ball.velocityY * tangentY) * 0.05;
                    }
                }

                // Ball to ball collision
                this.balls.forEach((otherBall, otherIndex) => {
                    if (index !== otherIndex) {
                        const dx = otherBall.x - ball.x;
                        const dy = otherBall.y - ball.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = ball.radius + otherBall.radius;

                        if (distance < minDistance) {
                            // Create hit effect at collision point
                            const collisionX = ball.x + dx * 0.5;
                            const collisionY = ball.y + dy * 0.5;
                            this.createHitEffect(collisionX, collisionY, ball.color);
                            this.createHitEffect(collisionX, collisionY, otherBall.color);

                            // Play hit sound
                            this.playHitSound();

                            // Track ball collisions
                            this.stats[index === 0 ? 'player1' : 'player2'].ballCollisions++;
                            this.stats[otherIndex === 0 ? 'player1' : 'player2'].ballCollisions++;
                            this.updateStatsDisplay();

                            // Collision detected - move balls apart
                            const angle = Math.atan2(dy, dx);
                            const overlap = minDistance - distance;
                            
                            // Move balls apart to prevent sticking
                            const moveX = (overlap / 2) * Math.cos(angle);
                            const moveY = (overlap / 2) * Math.sin(angle);
                            
                            ball.x -= moveX;
                            ball.y -= moveY;
                            otherBall.x += moveX;
                            otherBall.y += moveY;

                            // Calculate collision normal
                            const normalX = dx / distance;
                            const normalY = dy / distance;

                            // Calculate relative velocity
                            const relativeVelX = otherBall.velocityX - ball.velocityX;
                            const relativeVelY = otherBall.velocityY - ball.velocityY;
                            
                            // Calculate relative velocity along normal
                            const relativeSpeed = relativeVelX * normalX + relativeVelY * normalY;

                            // Don't collide if balls are moving apart
                            if (relativeSpeed < 0) {
                                // Calculate bounce with fixed speed and speed multiplier
                                const bounceSpeed = 15 * this.speedSettings.ballSpeed * this.speedSettings.bounceLevel;  // Fixed bounce speed for ball collisions
                                
                                // Apply velocities
                                ball.velocityX -= normalX * bounceSpeed;
                                ball.velocityY -= normalY * bounceSpeed;
                                otherBall.velocityX += normalX * bounceSpeed;
                                otherBall.velocityY += normalY * bounceSpeed;

                                // Add some spin based on collision
                                const spinEffect = 0.2;
                                ball.angularVelocity += relativeSpeed * spinEffect;
                                otherBall.angularVelocity -= relativeSpeed * spinEffect;
                            }
                        }
                    }
                });

                // Apply friction
                const frictionFactor = Math.pow(this.tangentialFriction, deltaTime * 60);
                ball.velocityX *= frictionFactor;
                ball.velocityY *= frictionFactor;

                // Update rotation
                ball.rotation += ball.angularVelocity;
                ball.angularVelocity *= this.rotationFriction;

                // Update position
                ball.x += ball.velocityX;
                ball.y += ball.velocityY;
            }
        });

        // Update confetti and check goals
        this.updateConfetti();
        this.checkGoal();
    }

    // Reset ball position after goal
    resetBallPosition(ball, index) {
        // After a goal, start from center
        if (this.score.player1 > 0 || this.score.player2 > 0) {
            ball.x = this.center.x;
            ball.y = this.center.y + (index === 0 ? -30 : 30);  // Slightly offset vertically
        } else {
            // Initial game start positions
            const side = index === 0 ? -1 : 1;
            ball.x = this.center.x + (50 + Math.random() * 100) * side;
            ball.y = this.center.y + (Math.random() - 0.5) * 100;
        }
        ball.velocityX = 0;
        ball.velocityY = 0;
        ball.angularVelocity = 0;
        ball.rotation = 0;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Fill background with current field color
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--field-color') || '#2d572c';
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw field lines
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        this.ctx.clip();

        // Set line style for field markings
        this.ctx.strokeStyle = this.borderColors.circleBorder;
        this.ctx.lineWidth = 2;

        // Draw center line
        this.ctx.beginPath();
        this.ctx.moveTo(this.center.x - this.radius, this.center.y);
        this.ctx.lineTo(this.center.x + this.radius, this.center.y);
        this.ctx.stroke();

        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius * 0.2, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw center dot
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = this.borderColors.circleBorder;
        this.ctx.fill();

        this.ctx.restore();

        // Draw arena border
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.borderColors.fieldBorder;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw goal
        const goalX = this.center.x + Math.cos(this.goalAngle) * this.radius;
        const goalY = this.center.y + Math.sin(this.goalAngle) * this.radius;
        
        this.ctx.save();
        this.ctx.translate(goalX, goalY);
        this.ctx.rotate(this.goalAngle + Math.PI / 2);

        // Goal dimensions
        const goalWidth = this.goalWidth;
        const goalHeight = this.goalWidth * 0.7;
        const goalDepth = this.goalWidth * 0.6;  // Increased from 0.3 to make posts extend further

        // Draw goal frame
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.goalProperties.isMissed ? 'rgba(255, 0, 0, 0.8)' : 
                              (this.showGoal ? '#32CD32' : '#ffffff');  // Green when goal scored
        this.ctx.lineWidth = 4;

        // Draw front frame
        this.ctx.moveTo(-goalWidth/2, 0);
        this.ctx.lineTo(-goalWidth/2, -goalHeight);
        this.ctx.lineTo(goalWidth/2, -goalHeight);
        this.ctx.lineTo(goalWidth/2, 0);

        // Draw straight parallel posts extending into the field
        this.ctx.moveTo(-goalWidth/2, 0);
        this.ctx.lineTo(-goalWidth/2, goalDepth);  // Left post extending forward
        this.ctx.moveTo(goalWidth/2, 0);
        this.ctx.lineTo(goalWidth/2, goalDepth);   // Right post extending forward
        this.ctx.stroke();

        // Draw net with matching color
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.showGoal ? 'rgba(50, 205, 50, 0.3)' : 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;

        // Vertical net lines
        for (let x = -goalWidth/2; x <= goalWidth/2; x += goalWidth/8) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, goalDepth);  // Vertical lines going forward
        }

        // Horizontal net lines going forward
        for (let z = 0; z <= goalDepth; z += goalDepth/6) {
            this.ctx.moveTo(-goalWidth/2, z);
            this.ctx.lineTo(goalWidth/2, z);
        }

        // Top net
        this.ctx.moveTo(-goalWidth/2, -goalHeight);
        this.ctx.lineTo(-goalWidth/2, goalDepth);
        this.ctx.moveTo(goalWidth/2, -goalHeight);
        this.ctx.lineTo(goalWidth/2, goalDepth);

        this.ctx.stroke();

        // Add red glow effect for misses
        if (this.goalProperties.isMissed) {
            const timeSinceMiss = Date.now() - this.goalProperties.lastMissTime;
            if (timeSinceMiss < this.goalProperties.missAnimationDuration) {
                const progress = timeSinceMiss / this.goalProperties.missAnimationDuration;
                const opacity = 1 - progress;
                
                this.ctx.strokeStyle = `rgba(255, 0, 0, ${opacity * 0.5})`;
                this.ctx.lineWidth = 8;
                this.ctx.stroke();
            } else {
                this.goalProperties.isMissed = false;
            }
        }

        this.ctx.restore();

        // Draw hit effects
        this.drawHitEffects();

        // Draw trails before balls
        this.drawTrails();

        // Draw balls with customization
        this.balls.forEach(ball => {
            // Draw ball shadow if enabled
            if (this.visualSettings.shadow.enabled) {
                this.ctx.save();
                this.ctx.translate(
                    ball.x + this.visualSettings.shadow.offset,
                    ball.y + this.visualSettings.shadow.offset
                );
                this.ctx.rotate(ball.rotation);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 0, 0, ${this.visualSettings.shadow.opacity})`;
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                this.ctx.shadowBlur = this.visualSettings.shadow.blur;
                this.ctx.fill();
                this.ctx.restore();
            }

            // Draw ball shadow
            this.ctx.save();
            this.ctx.translate(ball.x + 5, ball.y + 5);  // Offset shadow slightly
            this.ctx.rotate(ball.rotation);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';  // Semi-transparent black
            this.ctx.fill();
            this.ctx.restore();

            // Draw the actual ball
            this.ctx.save();
            this.ctx.translate(ball.x, ball.y);
            this.ctx.rotate(ball.rotation);

            // Create clipping path for the ball
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            this.ctx.clip();

            if (ball.image) {
                // Load and draw the image
                const img = new Image();
                img.src = ball.image;
                
                // Calculate image drawing dimensions to fit in the ball
                const size = ball.radius * 2;
                this.ctx.drawImage(img, -ball.radius, -ball.radius, size, size);
            } else {
                // Fill with color if no image
                this.ctx.fillStyle = ball.color;
                this.ctx.fill();
            }

            // Draw ball border with shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Add stripe to show rotation
            this.ctx.beginPath();
            this.ctx.moveTo(-ball.radius, 0);
            this.ctx.lineTo(ball.radius, 0);
            this.ctx.strokeStyle = '#ffffff55';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 0;  // Remove shadow for stripe
            this.ctx.stroke();

            this.ctx.restore();
        });

        // Draw confetti with player colors
        this.confetti.forEach(particle => {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillStyle = `rgba(${this.hexToRgb(particle.color)}, ${particle.opacity})`;
            this.ctx.fillRect(
                -particle.width / 2,
                -particle.height / 2,
                particle.width,
                particle.height
            );
            this.ctx.restore();
        });

        // Draw GOAL! text with scoring player's color
        if (this.showGoal) {
            const timeSinceGoal = Date.now() - this.goalTimer;
            const opacity = Math.max(0, 1 - timeSinceGoal / this.goalDisplayTime);
            const scale = 1 + Math.sin(timeSinceGoal / 100) * 0.2;
            
            const scoringPlayerColor = this.score.player1 > this.score.player2 ? 
                this.customization.player1.color : this.customization.player2.color;
            
            this.ctx.save();
            // Move text 100 pixels below center (increased from 50)
            this.ctx.translate(this.width / 2, this.height / 2 + 100);
            this.ctx.scale(scale, scale);

            // Add shadow for depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 4;
            this.ctx.shadowOffsetY = 4;

            // Create gradient for main text using ball's color
            const gradient = this.ctx.createLinearGradient(0, -30, 0, 30);
            gradient.addColorStop(0, scoringPlayerColor);  // Ball's color at top
            gradient.addColorStop(0.5, scoringPlayerColor);  // Ball's color in middle
            gradient.addColorStop(1, this.adjustColor(scoringPlayerColor, -30));  // Darker version at bottom

            // Draw modern styled text with smaller size
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 70px Arial';  // Reduced from 90px

            // Draw outline
            this.ctx.lineWidth = 6;  // Slightly reduced outline thickness
            this.ctx.strokeStyle = 'white';
            this.ctx.globalAlpha = opacity;
            this.ctx.strokeText('GOAL!', 0, 0);

            // Draw inner stroke for depth
            this.ctx.lineWidth = 2;  // Slightly reduced inner stroke
            this.ctx.strokeStyle = scoringPlayerColor;  // Use ball's color for inner stroke
            this.ctx.strokeText('GOAL!', 0, 0);

            // Draw main text with gradient
            this.ctx.fillStyle = gradient;
            this.ctx.fillText('GOAL!', 0, 0);

            // Add highlight effect
            this.ctx.fillStyle = `rgba(${this.hexToRgb(scoringPlayerColor)}, ${opacity * 0.3})`;  // Use ball's color for highlight
            this.ctx.fillText('GOAL!', -2, -2);

            this.ctx.restore();
        }

        // Draw HALFTIME! text with transition
        if (this.showHalftime) {
            const timeSinceHalftime = Date.now() - this.halftimeTimer;
            const opacity = Math.max(0, 1 - timeSinceHalftime / this.halftimeDisplayTime);
            
            if (opacity <= 0) {
                this.showHalftime = false;
            } else {
                const scale = 1 + Math.sin(timeSinceHalftime / 150) * 0.1;
                const slideIn = Math.min(1, timeSinceHalftime / 500); // 500ms slide in
                const slideOffset = (1 - slideIn) * 100; // Slide from 100px to 0px
                
                this.ctx.save();
                // Position above center line with slide effect
                this.ctx.translate(this.width / 2, (this.height / 2 - 50) - slideOffset);
                this.ctx.scale(scale, scale);
                
                // Draw shadow
                this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = 'bold 40px Arial';
                this.ctx.fillText('HALFTIME', 2, 2);
                
                // Draw main text
                const gradient = this.ctx.createLinearGradient(0, -20, 0, 20);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(1, '#FFA500');
                this.ctx.fillStyle = gradient;
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('HALFTIME', 0, 0);
                this.ctx.fillText('HALFTIME', 0, 0);
                
                this.ctx.restore();
            }
        }

        // Draw Added Time text with transition
        if (this.addedTimeDisplay.showing) {
            const timeSinceShow = Date.now() - this.addedTimeDisplay.timer;
            const opacity = Math.max(0, 1 - timeSinceShow / this.addedTimeDisplay.duration);
            
            if (opacity <= 0) {
                this.addedTimeDisplay.showing = false;
            } else {
                const scale = 1 + Math.sin(timeSinceShow / 150) * 0.1;
                const slideIn = Math.min(1, timeSinceShow / 300); // 300ms slide in
                const slideOffset = (1 - slideIn) * 50; // Slide from 50px to 0px
                
                this.ctx.save();
                this.ctx.translate(this.width / 2, (this.height / 2 - 100) - slideOffset);
                this.ctx.scale(scale, scale);
                
                // Draw shadow
                this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = 'bold 30px Arial';
                this.ctx.fillText(`Added Time ${this.addedTimeDisplay.text}`, 2, 2);
                
                // Draw main text
                const gradient = this.ctx.createLinearGradient(0, -15, 0, 15);
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(1, '#2980b9');
                this.ctx.fillStyle = gradient;
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeText(`Added Time ${this.addedTimeDisplay.text}`, 0, 0);
                this.ctx.fillText(`Added Time ${this.addedTimeDisplay.text}`, 0, 0);
                
                this.ctx.restore();
            }
        }

        // Draw drag line if dragging
        if (this.isDragging && this.selectedBall !== null) {
            const ball = this.balls[this.selectedBall];
            this.ctx.beginPath();
            this.ctx.moveTo(ball.x, ball.y);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    updateConfetti() {
        this.confetti = this.confetti.filter(particle => particle.opacity > 0);
        this.confetti.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.rotation += particle.rotationSpeed;
            particle.opacity -= 0.01;
            particle.velocityY += 0.2;
        });

        if (this.showGoal && Date.now() - this.goalTimer > this.goalDisplayTime) {
            this.showGoal = false;
        }
    }

    checkGoal() {
        const goalX = this.center.x + Math.cos(this.goalAngle) * this.radius;
        const goalY = this.center.y + Math.sin(this.goalAngle) * this.radius;

        this.balls.forEach((ball, index) => {
            const dx = ball.x - goalX;
            const dy = ball.y - goalY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.goalWidth / 2) {
                // Track shots on goal
                const playerKey = index === 0 ? 'player1' : 'player2';
                this.stats[playerKey].shotsOnGoal++;
                this.updateStatsDisplay();

                // Use player-specific goal chance
                const playerChance = this.customization[`player${index + 1}`].goalChance;
                const isGoal = Math.random() < playerChance;
                
                if (!isGoal) {
                    // Miss! Show red effect with player color
                    this.goalProperties.isMissed = true;
                    this.goalProperties.lastMissTime = Date.now();
                    this.goalProperties.missColor = this.customization[`player${index + 1}`].color;

                    // Calculate deflection angle
                    const deflectionAngle = this.goalAngle + (Math.random() - 0.5) * Math.PI;
                    const deflectionSpeed = 15;

                    // Apply deflection velocity
                    ball.velocityX = Math.cos(deflectionAngle) * deflectionSpeed;
                    ball.velocityY = Math.sin(deflectionAngle) * deflectionSpeed;

                    // Add some spin
                    ball.angularVelocity = (Math.random() - 0.5) * 0.4;
                } else {
                    // Get current display time for goal tracking
                    let currentTime = '';
                    if (this.internalTime > 45 && this.internalTime <= 45 + this.injuryTime.firstHalf) {
                        currentTime = `45+${this.internalTime - 45}`;
                    } else if (this.internalTime > 90 && this.internalTime <= 90 + this.injuryTime.secondHalf) {
                        currentTime = `90+${this.internalTime - 90}`;
                    } else if (this.internalTime > 45 + this.injuryTime.firstHalf && this.internalTime < 90) {
                        currentTime = (this.internalTime - this.injuryTime.firstHalf).toString();
                    } else {
                        currentTime = this.internalTime.toString();
                    }

                    // Track goal minute with current player name
                    this.stats[playerKey].goals.push({
                        time: currentTime,
                        playerName: this.customization[`player${index + 1}`].name,
                        playerColor: this.customization[`player${index + 1}`].color
                    });
                    
                    // Goal scored!
                    if (index === 0) this.score.player1++;
                    else this.score.player2++;

                    // Play goal sound first (before visual effects)
                    this.playSound('goal');

                    // Create confetti in scoring player's color
                    this.createConfetti();

                    // Reset ball position
                    this.resetBallPosition(ball, index);
                }
            }
        });
    }

    createConfetti() {
        const scoringPlayerColor = this.score.player1 > this.score.player2 ? 
            this.customization.player1.color : this.customization.player2.color;
            
        for (let i = 0; i < 100; i++) {
            this.confetti.push({
                x: this.width / 2,
                y: this.height / 2,
                velocityX: (Math.random() - 0.5) * 15,
                velocityY: (Math.random() - 0.5) * 15,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                width: 8,
                height: 8,
                opacity: 1,
                color: scoringPlayerColor
            });
        }
        this.showGoal = true;
        this.goalTimer = Date.now();
    }

    gameLoop(currentTime) {
        // Only update if game is running
        if (!this.isGameRunning) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }

        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    startTimer() {
        const timerElement = document.getElementById('timer');
        const scoreElement = document.getElementById('scoreText');

        // Clear any existing timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Set random injury times at the start
        this.injuryTime.firstHalf = Math.floor(Math.random() * 4) + 2;  // Random between 2-5
        this.injuryTime.secondHalf = Math.floor(Math.random() * 4) + 2; // Random between 2-5

        // Calculate interval based on timer speed (1000ms / speed multiplier)
        const intervalTime = Math.floor(1000 / this.speedSettings.timerSpeed);

        this.timerInterval = setInterval(() => {
            if (!this.isGameRunning) {
                clearInterval(this.timerInterval);
                return;
            }

            // Handle first half injury time
            if (this.internalTime === 45) {
                this.injuryTime.showing = true;
                this.addedTimeDisplay.showing = true;
                this.addedTimeDisplay.timer = Date.now();
                this.addedTimeDisplay.text = `+${this.injuryTime.firstHalf}`;
            }
            
            // Handle second half injury time
            if (this.internalTime === 90) {
                this.injuryTime.showing = true;
                this.addedTimeDisplay.showing = true;
                this.addedTimeDisplay.timer = Date.now();
                this.addedTimeDisplay.text = `+${this.injuryTime.secondHalf}`;
            }

            if ((this.internalTime < 45 + this.injuryTime.firstHalf) || 
                (this.internalTime >= 45 && this.internalTime < 90 + this.injuryTime.secondHalf)) {
                this.internalTime++;
                
                // Update chance and reset ball positions at halftime
                if (this.internalTime === 45 && this.goalProperties.lastHalfUpdate !== 45) {
                    this.goalProperties.baseChance = this.getHalftimeChance();
                    this.goalProperties.lastHalfUpdate = 45;
                    
                    // Show halftime display
                    this.showHalftime = true;
                    this.halftimeTimer = Date.now();
                    
                    // Reset ball positions at halftime
                    this.balls.forEach((ball, index) => {
                        this.resetBallPosition(ball, index);
                    });
                }

                // Display timer with injury time
                let displayTime = '';
                
                // First half injury time
                if (this.internalTime > 45 && this.internalTime <= 45 + this.injuryTime.firstHalf) {
                    displayTime = `45+${this.internalTime - 45}`;
                }
                // Second half injury time
                else if (this.internalTime > 90 && this.internalTime <= 90 + this.injuryTime.secondHalf) {
                    displayTime = `90+${this.internalTime - 90}`;
                }
                // After first half injury time but before second half
                else if (this.internalTime > 45 + this.injuryTime.firstHalf && this.internalTime < 90) {
                    displayTime = (this.internalTime - this.injuryTime.firstHalf).toString();
                }
                // Normal time
                else {
                    displayTime = this.internalTime.toString();
                }

                timerElement.textContent = displayTime + "'";
                scoreElement.textContent = `${this.score.player1} - ${this.score.player2}`;
            } else {
                // Stop the game
                this.isGameRunning = false;
                clearInterval(this.timerInterval);
                
                // Only show match results if there were goals or if some time has passed
                if (this.score.player1 > 0 || this.score.player2 > 0 || this.internalTime > 2) {
                    this.showMatchResults();
                } else {
                    // If game ended too quickly with 0-0, just restart
                    this.restartGame();
                }
            }
        }, intervalTime);
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if mouse is on any ball
        this.balls.forEach((ball, index) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - ball.x, 2) + Math.pow(mouseY - ball.y, 2)
            );
            if (distance < ball.radius) {
                this.selectedBall = index;
                this.isDragging = true;
            }
        });
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }

    createStatsDisplay() {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'statsDisplay';
        statsDiv.style.left = '20px';
        statsDiv.style.top = '50px';

        // Create header with toggle button
        const header = document.createElement('div');
        header.id = 'statsHeader';
        header.innerHTML = `
            <h3>Match Statistics</h3>
            <button class="toggle-stats">▼</button>
        `;
        statsDiv.appendChild(header);

        // Create content container
        const content = document.createElement('div');
        content.id = 'statsContent';
        content.classList.add('visible');
        statsDiv.appendChild(content);

        document.body.appendChild(statsDiv);

        // Make stats display draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                statsDiv.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Toggle stats visibility
        const toggleBtn = header.querySelector('.toggle-stats');
        toggleBtn.addEventListener('click', () => {
            const content = document.getElementById('statsContent');
            content.classList.toggle('visible');
            toggleBtn.textContent = content.classList.contains('visible') ? '▼' : '▲';
        });

        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        const content = document.getElementById('statsContent');
        if (content) {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stats-header" style="color: ${this.customization.player1.color}">${this.customization.player1.name}</div>
                    <div class="stats-header stats-label">Stats</div>
                    <div class="stats-header" style="color: ${this.customization.player2.color}">${this.customization.player2.name}</div>
                    
                    <div>${this.stats.player1.shotsOnGoal}</div>
                    <div class="stats-label">Shots on Goal</div>
                    <div>${this.stats.player2.shotsOnGoal}</div>
                    
                    <div>${this.stats.player1.wallHits}</div>
                    <div class="stats-label">Wall Hits</div>
                    <div>${this.stats.player2.wallHits}</div>
                    
                    <div>${this.stats.player1.ballCollisions}</div>
                    <div class="stats-label">Ball Collisions</div>
                    <div>${this.stats.player2.ballCollisions}</div>
                </div>
                <div class="goals-section">
                    <div style="color: ${this.customization.player1.color}">
                        ${this.customization.player1.name} Goals: ${this.stats.player1.goals.length > 0 ? 
                            this.stats.player1.goals.map(goal => goal.time + "'").join(", ") : 'None'}
                    </div>
                    <div style="color: ${this.customization.player2.color}">
                        ${this.customization.player2.name} Goals: ${this.stats.player2.goals.length > 0 ? 
                            this.stats.player2.goals.map(goal => goal.time + "'").join(", ") : 'None'}
                    </div>
                </div>
            `;
        }
    }

    loadImage(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        return img;
    }

    showMatchResults() {
        // Stop all sounds when game ends
        this.stopAllSounds();

        const modal = document.getElementById('matchResultsModal');
        const resultsContainer = modal.querySelector('.results-container');
        
        // Set player names and scores with consistent colors
        const player1Color = this.customization.player1.color;
        const player2Color = this.customization.player2.color;
        
        // Create modern results layout
        resultsContainer.innerHTML = `
            <div class="results-header">
                <h2>Match Results</h2>
                <button class="close-results">×</button>
            </div>
            <div class="score-section">
                <div class="team-score" style="color: ${player1Color}">
                    <div class="team-logo" id="player1Logo"></div>
                    <div class="team-name">${this.customization.player1.name}</div>
                    <div class="score">${this.score.player1}</div>
                </div>
                <div class="score-divider">-</div>
                <div class="team-score" style="color: ${player2Color}">
                    <div class="team-logo" id="player2Logo"></div>
                    <div class="team-name">${this.customization.player2.name}</div>
                    <div class="score">${this.score.player2}</div>
                </div>
            </div>
            <div class="match-stats">
                <div class="stat-row">
                    <span style="color: ${player1Color}">${this.stats.player1.shotsOnGoal}</span>
                    <span class="stat-label">Shots</span>
                    <span style="color: ${player2Color}">${this.stats.player2.shotsOnGoal}</span>
                </div>
                <div class="stat-row">
                    <span style="color: ${player1Color}">${this.stats.player1.goals.length}</span>
                    <span class="stat-label">Goals</span>
                    <span style="color: ${player2Color}">${this.stats.player2.goals.length}</span>
                </div>
                <div class="stat-row">
                    <span style="color: ${player1Color}">${this.stats.player1.ballCollisions}</span>
                    <span class="stat-label">Collisions</span>
                    <span style="color: ${player2Color}">${this.stats.player2.ballCollisions}</span>
                </div>
            </div>
            <div class="timeline-section">
                <h3>Goals Timeline</h3>
                <div class="goals-timeline">
                    ${this.createGoalsTimeline(player1Color, player2Color)}
                </div>
            </div>
            <div class="action-buttons">
                <button class="play-again-btn" onclick="playAgain()">Play Again</button>
            </div>
        `;

        // Set player logos
        const player1Logo = document.getElementById('player1Logo');
        const player2Logo = document.getElementById('player2Logo');

        if (this.customization.player1.image) {
            player1Logo.style.backgroundImage = `url(${this.customization.player1.image})`;
        } else {
            player1Logo.style.backgroundColor = player1Color;
        }

        if (this.customization.player2.image) {
            player2Logo.style.backgroundImage = `url(${this.customization.player2.image})`;
        } else {
            player2Logo.style.backgroundColor = player2Color;
        }

        // Make results container draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.target.closest('.results-header')) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
            }
        };

        const dragEnd = () => {
            isDragging = false;
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                resultsContainer.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };

        resultsContainer.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Add close button functionality
        const closeButton = modal.querySelector('.close-results');
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
            this.restartGame();
        });

        // Show modal
        modal.style.display = 'flex';
    }

    createGoalsTimeline(player1Color, player2Color) {
        const allGoals = [
            ...this.stats.player1.goals,
            ...this.stats.player2.goals
        ].sort((a, b) => {
            const timeA = a.time.includes('+') ? parseInt(a.time.split('+')[0]) + parseInt(a.time.split('+')[1])/10 : parseInt(a.time);
            const timeB = b.time.includes('+') ? parseInt(b.time.split('+')[0]) + parseInt(b.time.split('+')[1])/10 : parseInt(b.time);
            return timeA - timeB;
        });

        if (allGoals.length === 0) {
            return '<div class="no-goals">No goals scored</div>';
        }

        return allGoals.map(goal => `
            <div class="goal-entry" style="color: ${goal.playerColor}">
                <span class="goal-time">${goal.time}'</span>
                <span class="goal-scorer">${goal.playerName}</span>
            </div>
        `).join('');
    }

    // Add hit effect method
    createHitEffect(x, y, color) {
        const particles = [];
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            particles.push({
                x,
                y,
                velocityX: Math.cos(angle) * 5,
                velocityY: Math.sin(angle) * 5,
                size: 4,
                color: color,
                opacity: 1,
                life: 1
            });
        }
        this.hitEffects.push(...particles);
    }

    // Update hit effects
    updateHitEffects() {
        this.hitEffects = this.hitEffects.filter(particle => particle.life > 0);
        this.hitEffects.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= 0.05;
            particle.opacity = particle.life;
            particle.size *= 0.95;
        });
    }

    // Add hit effect drawing
    drawHitEffects() {
        this.hitEffects.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // Helper function to convert hex color to RGB
    hexToRgb(hex) {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }

    // Add method to stop all sounds
    stopAllSounds() {
        Object.keys(this.sounds).forEach(type => {
            const sound = this.sounds[type].audio;
            sound.pause();
            sound.currentTime = 0;
        });
    }

    initializeVisualSettings() {
        // Set initial values for visual controls
        document.getElementById('trailToggle').checked = this.visualSettings.trail.enabled;
        document.getElementById('trailLength').value = this.visualSettings.trail.length;
        document.getElementById('trailOpacity').value = this.visualSettings.trail.opacity * 100;
        document.getElementById('trailFade').value = this.visualSettings.trail.fadeSpeed * 100;

        document.getElementById('shadowToggle').checked = this.visualSettings.shadow.enabled;
        document.getElementById('shadowOffset').value = this.visualSettings.shadow.offset;
        document.getElementById('shadowBlur').value = this.visualSettings.shadow.blur;
        document.getElementById('shadowOpacity').value = this.visualSettings.shadow.opacity * 100;

        // Update display values
        document.getElementById('trailLength').nextElementSibling.textContent = this.visualSettings.trail.length;
        document.getElementById('trailOpacity').nextElementSibling.textContent = `${this.visualSettings.trail.opacity * 100}%`;
        document.getElementById('trailFade').nextElementSibling.textContent = `${this.visualSettings.trail.fadeSpeed * 100}%`;
        document.getElementById('shadowOffset').nextElementSibling.textContent = `${this.visualSettings.shadow.offset}px`;
        document.getElementById('shadowBlur').nextElementSibling.textContent = `${this.visualSettings.shadow.blur}px`;
        document.getElementById('shadowOpacity').nextElementSibling.textContent = `${this.visualSettings.shadow.opacity * 100}%`;

        // Add event listeners for trail settings
        document.getElementById('trailToggle').addEventListener('change', (e) => {
            this.visualSettings.trail.enabled = e.target.checked;
            // Clear trails when disabled
            if (!e.target.checked) {
                this.trails = [[], []];
            }
        });

        document.getElementById('trailLength').addEventListener('input', (e) => {
            this.visualSettings.trail.length = parseInt(e.target.value);
            e.target.nextElementSibling.textContent = e.target.value;
            // Trim trails if new length is shorter
            this.trails.forEach(trail => {
                if (trail.length > this.visualSettings.trail.length) {
                    trail.length = this.visualSettings.trail.length;
                }
            });
        });

        document.getElementById('trailOpacity').addEventListener('input', (e) => {
            this.visualSettings.trail.opacity = parseInt(e.target.value) / 100;
            e.target.nextElementSibling.textContent = `${e.target.value}%`;
        });

        document.getElementById('trailFade').addEventListener('input', (e) => {
            this.visualSettings.trail.fadeSpeed = parseInt(e.target.value) / 100;
            e.target.nextElementSibling.textContent = `${e.target.value}%`;
        });

        // Add event listeners for shadow settings
        document.getElementById('shadowToggle').addEventListener('change', (e) => {
            this.visualSettings.shadow.enabled = e.target.checked;
        });

        document.getElementById('shadowOffset').addEventListener('input', (e) => {
            this.visualSettings.shadow.offset = parseInt(e.target.value);
            e.target.nextElementSibling.textContent = `${e.target.value}px`;
        });

        document.getElementById('shadowBlur').addEventListener('input', (e) => {
            this.visualSettings.shadow.blur = parseInt(e.target.value);
            e.target.nextElementSibling.textContent = `${e.target.value}px`;
        });

        document.getElementById('shadowOpacity').addEventListener('input', (e) => {
            this.visualSettings.shadow.opacity = parseInt(e.target.value) / 100;
            e.target.nextElementSibling.textContent = `${e.target.value}%`;
        });

        // Initialize tab switching
        const soundTab = document.getElementById('soundTab');
        const customTab = document.getElementById('customTab');
        const visualTab = document.getElementById('visualTab');
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const tabName = button.getAttribute('data-tab');
                soundTab.style.display = tabName === 'sound' ? 'block' : 'none';
                visualTab.style.display = tabName === 'visual' ? 'block' : 'none';
                customTab.style.display = tabName === 'custom' ? 'block' : 'none';
            });
        });
    }

    updateTrails() {
        this.balls.forEach((ball, index) => {
            if (this.visualSettings.trail.enabled) {
                // Add new position to trail
                this.trails[index].unshift({
                    x: ball.x,
                    y: ball.y,
                    opacity: 1
                });

                // Limit trail length
                if (this.trails[index].length > this.visualSettings.trail.length) {
                    this.trails[index].pop();
                }

                // Update trail opacities
                this.trails[index].forEach((point, i) => {
                    point.opacity = Math.max(0, 1 - (i / this.trails[index].length) - this.visualSettings.trail.fadeSpeed);
                });

                // Remove fully faded points
                this.trails[index] = this.trails[index].filter(point => point.opacity > 0);
            } else {
                // Clear trails if disabled
                this.trails[index] = [];
            }
        });
    }

    drawTrails() {
        if (this.visualSettings.trail.enabled) {
            this.trails.forEach((trail, ballIndex) => {
                const ball = this.balls[ballIndex];
                const playerColor = this.customization[`player${ballIndex + 1}`].color;
                trail.forEach((point, i) => {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, ball.radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(${this.hexToRgb(playerColor)}, ${point.opacity * this.visualSettings.trail.opacity})`;
                    this.ctx.fill();
                });
            });
        }
    }

    // Add restart game method
    restartGame() {
        // Stop the game temporarily
        this.isGameRunning = false;
        
        // Cancel existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear existing timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Reset scores
        this.score = { player1: 0, player2: 0 };
        
        // Reset internal time
        this.internalTime = 1;
        
        // Reset statistics
        this.stats = {
            player1: {
                shotsOnGoal: 0,
                wallHits: 0,
                ballCollisions: 0,
                goals: [],
            },
            player2: {
                shotsOnGoal: 0,
                wallHits: 0,
                ballCollisions: 0,
                goals: [],
            }
        };
        
        // Update stats display
        this.updateStatsDisplay();
        
        // Reset ball positions
        this.balls.forEach((ball, index) => {
            this.resetBallPosition(ball, index);
            // Reset ball velocities and rotation
            ball.velocityX = 0;
            ball.velocityY = 0;
            ball.angularVelocity = 0;
            ball.rotation = 0;
        });
        
        // Clear trails and effects
        this.trails = [[], []];
        this.hitEffects = [];
        this.confetti = [];
        
        // Reset goal properties
        this.goalProperties = {
            baseChance: this.getStartChance(),
            lastMissTime: 0,
            missAnimationDuration: 800,
            isMissed: false,
            lastHalfUpdate: 0
        };

        // Reset injury time properties
        this.injuryTime = {
            firstHalf: Math.floor(Math.random() * 4) + 2,
            secondHalf: Math.floor(Math.random() * 4) + 2,
            showing: false,
            displayTimer: 0,
            displayDuration: 2000
        };
        
        // Update score display
        document.getElementById('scoreText').textContent = '0 - 0';
        document.getElementById('timer').textContent = "1'";
        
        // Reset game loop timing
        this.lastTime = performance.now();
        
        // Restart game
        this.isGameRunning = true;
        
        // Start a new timer
        this.startTimer();

        // Start new game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Add method to update player customization during game
    updatePlayerCustomization(playerIndex, updates) {
        const player = `player${playerIndex + 1}`;
        const ball = this.balls[playerIndex];
        
        // Update customization object
        if (updates.name) {
            this.customization[player].name = updates.name;
            // Update display name
            document.getElementById(`${player}Name`).textContent = updates.name;
        }
        
        if (updates.color) {
            this.customization[player].color = updates.color;
            ball.color = updates.color;
            // Update display color
            document.getElementById(`${player}Name`).style.color = updates.color;
            if (!ball.image) {
                document.getElementById(`${player}Image`).style.backgroundColor = updates.color;
            }
        }
        
        if (updates.image) {
            this.customization[player].image = updates.image;
            ball.image = updates.image;
            // Update display image
            document.getElementById(`${player}Image`).style.backgroundImage = `url(${updates.image})`;
            document.getElementById(`${player}Image`).style.backgroundColor = 'transparent';
        }

        // Add size update handling
        if (updates.size) {
            this.customization[player].size = updates.size;
            ball.radius = updates.size;
        }

        // Update stats display colors
        this.updateStatsDisplay();
    }

    // Add method to handle in-game customization
    initializeInGameCustomization() {
        const settingsBtn = document.getElementById('soundSettingsBtn');
        const customTab = document.getElementById('customTab');

        // Add game appearance customization to custom tab
        customTab.innerHTML = `
            <div class="visual-control">
                <div class="control-header">
                    <span class="control-label">Game Speed Settings</span>
                </div>
                <div class="control-settings">
                    <div class="setting-group">
                        <label>Ball Speed Multiplier</label>
                        <div class="speed-control">
                            <input type="range" id="ballSpeedControl" min="0.5" max="2" step="0.1" value="${this.speedSettings.ballSpeed}">
                            <span class="speed-value">${this.speedSettings.ballSpeed}x</span>
                        </div>
                        <label>Goal Posts Rotation Speed</label>
                        <div class="speed-control">
                            <input type="range" id="goalSpeedControl" min="0.5" max="2" step="0.1" value="${this.speedSettings.goalSpeed}">
                            <span class="speed-value">${this.speedSettings.goalSpeed}x</span>
                        </div>
                        <label>Timer Speed</label>
                        <div class="speed-control">
                            <input type="range" id="timerSpeedControl" min="0.5" max="5" step="0.1" value="${this.speedSettings.timerSpeed}">
                            <span class="speed-value">${this.speedSettings.timerSpeed}x</span>
                        </div>
                        <label>Bounce Level</label>
                        <div class="speed-control">
                            <input type="range" id="bounceLevelControl" min="0.5" max="2" step="0.1" value="${this.speedSettings.bounceLevel}">
                            <span class="speed-value">${this.speedSettings.bounceLevel}x</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="visual-control">
                <div class="control-header">
                    <span class="control-label">Goal Chances</span>
                </div>
                <div class="control-settings">
                    <div class="setting-group">
                        <label style="color: ${this.customization.player1.color}">${this.customization.player1.name} Goal Chance</label>
                        <div class="chance-control">
                            <input type="range" id="player1ChanceControl" min="0" max="100" step="1" value="${this.customization.player1.goalChance * 100}">
                            <span class="chance-value">${this.customization.player1.goalChance * 100}%</span>
                        </div>
                        <label style="color: ${this.customization.player2.color}">${this.customization.player2.name} Goal Chance</label>
                        <div class="chance-control">
                            <input type="range" id="player2ChanceControl" min="0" max="100" step="1" value="${this.customization.player2.goalChance * 100}">
                            <span class="chance-value">${this.customization.player2.goalChance * 100}%</span>
                        </div>
                        <div class="chance-warning" style="color: #ff4444; font-size: 12px; margin-top: 5px;"></div>
                    </div>
                </div>
            </div>
            <div class="visual-control">
                <div class="control-header">
                    <span class="control-label">Game Appearance</span>
                </div>
                <div class="control-settings">
                    <div class="setting-group">
                        <label>Field Color</label>
                        <input type="color" id="fieldColor" value="${getComputedStyle(document.documentElement).getPropertyValue('--field-color').trim() || '#2d572c'}">
                        <label>Background Color</label>
                        <input type="color" id="backgroundColor" value="${document.body.style.background || '#1a1a1a'}">
                        <label>Field Border Color</label>
                        <input type="color" id="fieldBorderColor" value="${this.borderColors.fieldBorder}">
                        <label>Circle Lines Color</label>
                        <input type="color" id="circleBorderColor" value="${this.borderColors.circleBorder}">
                    </div>
                </div>
            </div>
            <div class="visual-control">
                <div class="control-header">
                    <span class="control-label">Player Customization</span>
                </div>
                <div class="control-settings">
                    <div class="setting-group">
                        <label>Player 1 Name</label>
                        <input type="text" id="inGamePlayer1Name" value="${this.customization.player1.name}">
                        <label>Player 1 Color</label>
                        <input type="color" id="inGamePlayer1Color" value="${this.customization.player1.color}">
                        <label>Player 1 Image</label>
                        <input type="file" id="inGamePlayer1Image" accept="image/*">
                        <label>Player 1 Size (10-30px)</label>
                        <div class="size-control">
                            <input type="range" id="inGamePlayer1Size" min="10" max="30" value="${this.customization.player1.size}">
                            <span class="size-value">${this.customization.player1.size}px</span>
                        </div>
                    </div>
                    <div class="setting-group">
                        <label>Player 2 Name</label>
                        <input type="text" id="inGamePlayer2Name" value="${this.customization.player2.name}">
                        <label>Player 2 Color</label>
                        <input type="color" id="inGamePlayer2Color" value="${this.customization.player2.color}">
                        <label>Player 2 Image</label>
                        <input type="file" id="inGamePlayer2Image" accept="image/*">
                        <label>Player 2 Size (10-30px)</label>
                        <div class="size-control">
                            <input type="range" id="inGamePlayer2Size" min="10" max="30" value="${this.customization.player2.size}">
                            <span class="size-value">${this.customization.player2.size}px</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for game appearance
        const fieldColor = document.getElementById('fieldColor');
        const backgroundColor = document.getElementById('backgroundColor');
        const fieldBorderColor = document.getElementById('fieldBorderColor');
        const circleBorderColor = document.getElementById('circleBorderColor');

        fieldColor.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--field-color', e.target.value);
        });

        backgroundColor.addEventListener('input', (e) => {
            document.body.style.background = e.target.value;
        });

        fieldBorderColor.addEventListener('input', (e) => {
            this.borderColors.fieldBorder = e.target.value;
        });

        circleBorderColor.addEventListener('input', (e) => {
            this.borderColors.circleBorder = e.target.value;
        });

        // Add event listeners for in-game customization
        ['1', '2'].forEach((playerNum, index) => {
            const nameInput = document.getElementById(`inGamePlayer${playerNum}Name`);
            const colorInput = document.getElementById(`inGamePlayer${playerNum}Color`);
            const imageInput = document.getElementById(`inGamePlayer${playerNum}Image`);
            const sizeInput = document.getElementById(`inGamePlayer${playerNum}Size`);
            const sizeValue = sizeInput.nextElementSibling;

            nameInput.addEventListener('change', (e) => {
                this.updatePlayerCustomization(index, { name: e.target.value });
            });

            colorInput.addEventListener('change', (e) => {
                this.updatePlayerCustomization(index, { color: e.target.value });
            });

            sizeInput.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                sizeValue.textContent = `${size}px`;
                this.updatePlayerCustomization(index, { size: size });
            });

            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = 100;
                            canvas.height = 100;
                            ctx.beginPath();
                            ctx.arc(50, 50, 50, 0, Math.PI * 2);
                            ctx.clip();
                            ctx.drawImage(img, 0, 0, 100, 100);
                            this.updatePlayerCustomization(index, { image: canvas.toDataURL() });
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        // Add event listeners for speed controls
        const ballSpeedControl = document.getElementById('ballSpeedControl');
        const goalSpeedControl = document.getElementById('goalSpeedControl');
        const timerSpeedControl = document.getElementById('timerSpeedControl');
        const bounceLevelControl = document.getElementById('bounceLevelControl');

        ballSpeedControl.addEventListener('input', (e) => {
            this.speedSettings.ballSpeed = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = `${this.speedSettings.ballSpeed}x`;
        });

        goalSpeedControl.addEventListener('input', (e) => {
            this.speedSettings.goalSpeed = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = `${this.speedSettings.goalSpeed}x`;
            // Update goal rotation speed
            this.goalRotationSpeed = 0.01 * this.speedSettings.goalSpeed;
        });

        timerSpeedControl.addEventListener('input', (e) => {
            this.speedSettings.timerSpeed = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = `${this.speedSettings.timerSpeed}x`;
            // Restart timer with new speed if game is running and not paused
            if (this.isGameRunning && !this.isPaused) {
                this.startTimer();
            }
        });

        bounceLevelControl.addEventListener('input', (e) => {
            this.speedSettings.bounceLevel = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = `${this.speedSettings.bounceLevel}x`;
            // Update bounce power for both balls
            this.balls.forEach(ball => {
                ball.bouncePower = 15 * this.speedSettings.bounceLevel;
            });
        });

        // Add event listeners for goal chance controls
        const player1ChanceControl = document.getElementById('player1ChanceControl');
        const player2ChanceControl = document.getElementById('player2ChanceControl');
        const chanceWarning = document.querySelector('.chance-warning');

        const updateChanceWarning = () => {
            const p1Chance = parseFloat(player1ChanceControl.value);
            const p2Chance = parseFloat(player2ChanceControl.value);
            if (p1Chance > 30 || p2Chance > 30) {
                chanceWarning.textContent = 'Warning: High scoring chance might affect gameplay balance!';
            } else {
                chanceWarning.textContent = '';
            }
        };

        player1ChanceControl.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.customization.player1.goalChance = value / 100;
            e.target.nextElementSibling.textContent = `${value}%`;
            updateChanceWarning();
        });

        player2ChanceControl.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.customization.player2.goalChance = value / 100;
            e.target.nextElementSibling.textContent = `${value}%`;
            updateChanceWarning();
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            // Pause the game
            pauseBtn.innerHTML = '<span>▶️</span> Resume';
            // Store current velocities
            this.balls.forEach(ball => {
                ball.storedVelocityX = ball.velocityX;
                ball.storedVelocityY = ball.velocityY;
                ball.storedAngularVelocity = ball.angularVelocity;
                ball.velocityX = 0;
                ball.velocityY = 0;
                ball.angularVelocity = 0;
            });
            // Clear the timer interval
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        } else {
            // Resume the game
            pauseBtn.innerHTML = '<span>⏸️</span> Pause';
            // Restore velocities
            this.balls.forEach(ball => {
                ball.velocityX = ball.storedVelocityX || 0;
                ball.velocityY = ball.storedVelocityY || 0;
                ball.angularVelocity = ball.storedAngularVelocity || 0;
            });
            // Restart the timer
            this.startTimer();
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const newHex = '#' + Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount)).toString(16).padStart(2, '0')
                     + Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount)).toString(16).padStart(2, '0')
                     + Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount)).toString(16).padStart(2, '0');
        return newHex;
    }
}

// Modified game initialization
function startGame() {
    document.getElementById('customizationModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    window.game.initializeGame();
}

// Modified play again function
function playAgain() {
    // Hide the results modal
    document.getElementById('matchResultsModal').style.display = 'none';
    // Restart the game with existing settings
    window.game.restartGame();
}

window.onload = () => {
    window.game = new CircleFootball();
}; 

// BEST ONE