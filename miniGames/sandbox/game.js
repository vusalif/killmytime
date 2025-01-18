class SandboxGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pixelSize = 4;
        this.brushSize = 3;
        this.isPaused = false;
        this.selectedTool = null;
        this.isMouseDown = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.windForce = 0;
        this.gravity = 0.5;
        this.draggedHuman = null;
        this.borderWidth = 20; // Width of the border in pixels
        this.humanColors = [
            '#ff9800', // Orange
            '#e91e63', // Pink
            '#2196f3', // Blue
            '#4caf50', // Green
            '#9c27b0', // Purple
            '#00bcd4', // Cyan
            '#ffeb3b', // Yellow
            '#ff5722', // Deep Orange
        ];
        this.fireSpreadChance = 0.3;
        this.waterFlowSpeed = 2;
        this.fireLifetime = 200; // Base lifetime for fire particles
        this.fireDecayRate = 2; // How quickly fire dies out
        this.lightningLifetime = 4; // Reduced to 4 frames (very short)
        this.lavaLifetime = Infinity;
        this.glassFormationTemp = 0.7; // Threshold for sand to turn into glass
        this.isToolbarCollapsed = false;

        // Initialize grid
        this.initializeCanvas();
        this.grid = [];
        this.nextGrid = [];
        this.initializeGrid();
        this.humans = [];

        this.setupEventListeners();
        this.animate();
    }

    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.cols = Math.floor(this.canvas.width / this.pixelSize);
        this.rows = Math.floor(this.canvas.height / this.pixelSize);
        this.initializeGrid();
    }

    initializeGrid() {
        this.grid = new Array(this.rows);
        this.nextGrid = new Array(this.rows);
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = new Array(this.cols).fill(null);
            this.nextGrid[y] = new Array(this.cols).fill(null);
        }
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('selected'));
                tool.classList.add('selected');
                this.selectedTool = tool.dataset.tool;
            });
        });

        // Brush size control
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.handleMouse(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) this.handleMouse(e);
        });
        this.canvas.addEventListener('mouseup', () => {
            if (this.draggedHuman) {
                this.draggedHuman.isDragged = false;
                this.draggedHuman = null;
            }
            this.isMouseDown = false;
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });

        // Controls
        document.getElementById('clear').addEventListener('click', () => this.clear());
        document.getElementById('pause').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pause').textContent = this.isPaused ? 'Resume' : 'Pause';
        });

        // Add toolbar toggle
        document.getElementById('toolbar-toggle').addEventListener('click', () => {
            const toolbar = document.getElementById('toolbar');
            toolbar.classList.toggle('collapsed');
            this.isToolbarCollapsed = !this.isToolbarCollapsed;
        });
    }

    handleMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridX = Math.floor(mouseX / this.pixelSize);
        const gridY = Math.floor(mouseY / this.pixelSize);

        // Only handle mouse events within the border
        if (mouseX < this.borderWidth || mouseX > this.canvas.width - this.borderWidth ||
            mouseY < this.borderWidth || mouseY > this.canvas.height - this.borderWidth) {
            return;
        }

        // Check if we're dragging a human
        if (this.isMouseDown && !this.draggedHuman) {
            const clickedHuman = this.humans.find(human => {
                const humanBounds = {
                    left: human.x,
                    right: human.x + this.pixelSize * 4,
                    top: human.y,
                    bottom: human.y + this.pixelSize * 9
                };
                return mouseX >= humanBounds.left && mouseX <= humanBounds.right &&
                       mouseY >= humanBounds.top && mouseY <= humanBounds.bottom;
            });
            
            if (clickedHuman) {
                this.draggedHuman = clickedHuman;
                this.draggedHuman.isDragged = true;
                this.draggedHuman.dragOffsetX = mouseX - clickedHuman.x;
                this.draggedHuman.dragOffsetY = mouseY - clickedHuman.y;
                return;
            }
        }

        // Update dragged human position
        if (this.draggedHuman) {
            const newX = mouseX - this.draggedHuman.dragOffsetX;
            const newY = mouseY - this.draggedHuman.dragOffsetY;
            
            this.draggedHuman.x = Math.max(this.borderWidth, Math.min(this.canvas.width - this.borderWidth - this.pixelSize * 4, newX));
            this.draggedHuman.y = Math.max(this.borderWidth, Math.min(this.canvas.height - this.borderWidth - this.pixelSize * 9, newY));
            this.draggedHuman.vx = 0;
            this.draggedHuman.vy = 0;
            return;
        }

        // Handle other tools
        if (this.selectedTool) {
            if (this.selectedTool === 'human') {
                if (Math.random() < 0.3) {
                    this.humans.push({
                        x: Math.max(this.borderWidth, Math.min(this.canvas.width - this.borderWidth - this.pixelSize * 4, gridX * this.pixelSize)),
                        y: Math.max(this.borderWidth, Math.min(this.canvas.height - this.borderWidth - this.pixelSize * 9, gridY * this.pixelSize)),
                        vx: (Math.random() - 0.5) * 2,
                        vy: 0,
                        isJumping: false,
                        isDragged: false,
                        direction: Math.random() < 0.5 ? -1 : 1,
                        lifetime: 1000,
                        color: this.humanColors[Math.floor(Math.random() * this.humanColors.length)],
                        state: 'idle',
                        zIndex: Date.now() // Add timestamp for z-index ordering
                    });
                }
            } else {
                for (let dy = -this.brushSize; dy <= this.brushSize; dy++) {
                    for (let dx = -this.brushSize; dx <= this.brushSize; dx++) {
                        if (dx * dx + dy * dy <= this.brushSize * this.brushSize) {
                            const newX = gridX + dx;
                            const newY = gridY + dy;
                            if (newX * this.pixelSize >= this.borderWidth && 
                                newX * this.pixelSize < this.canvas.width - this.borderWidth &&
                                newY * this.pixelSize >= this.borderWidth && 
                                newY * this.pixelSize < this.canvas.height - this.borderWidth) {
                                if (this.selectedTool === 'eraser') {
                                    this.grid[newY][newX] = null;
                                } else if (Math.random() < 0.3) {
                                    let particle = {
                                        type: this.selectedTool,
                                        velocity: { x: 0, y: 0 },
                                        lifetime: this.selectedTool === 'fire' ? this.fireLifetime :
                                                this.selectedTool === 'lightning' ? this.lightningLifetime :
                                                this.selectedTool === 'lava' ? this.lavaLifetime : Infinity,
                                        wetness: 0,
                                        temperature: this.selectedTool === 'lava' ? 1 : 0
                                    };

                                    if (this.selectedTool === 'water') {
                                        particle.velocity.y = this.waterFlowSpeed;
                                    }

                                    if (this.selectedTool === 'lightning') {
                                        this.createLightningStrike(newX, newY);
                                    } else {
                                        this.grid[newY][newX] = particle;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    createLightningStrike(x, y) {
        // Create straight lightning bolt
        const maxHeight = Math.min(15, this.rows - y); // Maximum height of lightning
        for (let i = 0; i < maxHeight; i++) {
            if (y + i < this.rows) {
                this.grid[y + i][x] = {
                    type: 'lightning',
                    lifetime: this.lightningLifetime - i * 0.2, // Fade out as it goes down
                    velocity: { x: 0, y: 1 }
                };

                // Create small horizontal branches occasionally
                if (Math.random() < 0.3) {
                    const branchLength = Math.floor(Math.random() * 3) + 1;
                    const direction = Math.random() < 0.5 ? -1 : 1;
                    
                    for (let j = 1; j <= branchLength; j++) {
                        const branchX = x + (j * direction);
                        if (branchX >= 0 && branchX < this.cols) {
                            this.grid[y + i][branchX] = {
                                type: 'lightning',
                                lifetime: this.lightningLifetime - i * 0.2 - j * 0.5,
                                velocity: { x: 0, y: 1 }
                            };
                        }
                    }
                }
            }
        }

        // Create impact effect at the end
        if (y + maxHeight < this.rows) {
            const impactRadius = 3;
            for (let dy = -impactRadius; dy <= impactRadius; dy++) {
                for (let dx = -impactRadius; dx <= impactRadius; dx++) {
                    const impactX = x + dx;
                    const impactY = y + maxHeight + dy;
                    if (impactX >= 0 && impactX < this.cols && 
                        impactY >= 0 && impactY < this.rows &&
                        dx * dx + dy * dy <= impactRadius * impactRadius) {
                        // Create fire or transform materials at impact point
                        const target = this.grid[impactY][impactX];
                        if (target) {
                            if (target.type === 'sand') {
                                this.grid[impactY][impactX] = {
                                    type: 'glass',
                                    lifetime: Infinity,
                                    velocity: { x: 0, y: 0 }
                                };
                            } else if (target.type !== 'glass') {
                                this.grid[impactY][impactX] = {
                                    type: 'fire',
                                    lifetime: this.fireLifetime,
                                    velocity: { x: 0, y: 0 }
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    updatePhysics() {
        if (this.isPaused) return;

        // Reset next grid
        for (let y = 0; y < this.rows; y++) {
            this.nextGrid[y].fill(null);
        }

        // Sort humans by y-position for proper rendering order
        this.humans.sort((a, b) => a.y - b.y);

        // Update humans with water and fire interactions
        this.humans = this.humans.filter(human => {
            if (human.lifetime <= 0) return false;
            if (human.isDragged) return true;

            // Get grid position of human
            const gridX = Math.floor(human.x / this.pixelSize);
            const gridY = Math.floor(human.y / this.pixelSize);

            // Check for water and fire interactions
            for (let dy = 0; dy < 9; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = gridX + dx;
                    const checkY = gridY + dy;
                    if (checkX >= 0 && checkX < this.cols && checkY >= 0 && checkY < this.rows) {
                        const particle = this.grid[checkY][checkX];
                        if (particle) {
                            if (particle.type === 'water') {
                                // Humans can swim in water (reduced gravity and movement)
                                human.vy *= 0.7;
                                human.vx *= 0.8;
                                // Chance to drown if submerged too long
                                if (Math.random() < 0.001) human.lifetime -= 10;
                            } else if (particle.type === 'fire') {
                                // Humans take damage from fire
                                human.lifetime -= 5;
                            }
                        }
                    }
                }
            }

            // Apply normal physics
            human.vy += this.gravity;
            human.x += human.vx;
            human.y += human.vy;

            // Border collisions (keep existing collision code)
            if (human.y > this.canvas.height - this.borderWidth - this.pixelSize * 9) {
                human.y = this.canvas.height - this.borderWidth - this.pixelSize * 9;
                human.vy = 0;
                human.isJumping = false;
                if (Math.random() < 0.02) {
                    human.vy = -8;
                    human.isJumping = true;
                }
            }

            // Keep existing border collision code
            return true;
        });

        // Update particles
        for (let y = this.rows - 1; y >= 0; y--) {
            for (let x = 0; x < this.cols; x++) {
                const particle = this.grid[y][x];
                if (!particle) continue;

                // Update lifetime
                if (particle.lifetime !== Infinity) {
                    if (particle.type === 'fire') {
                        particle.lifetime -= this.fireDecayRate;
                        if (Math.random() < 0.05) {
                            particle.lifetime -= this.fireDecayRate * 2;
                        }
                    } else if (particle.type === 'lightning') {
                        particle.lifetime -= 1;
                    } else {
                        particle.lifetime--;
                    }
                    
                    if (particle.lifetime <= 0) {
                        this.grid[y][x] = null;
                        continue;
                    }
                }

                let newX = x;
                let newY = y;

                switch (particle.type) {
                    case 'sand':
                        // Check for water below
                        if (y < this.rows - 1 && this.grid[y + 1][x]?.type === 'water') {
                            particle.wetness = Math.min((particle.wetness || 0) + 0.1, 1);
                        }

                        // Wet sand moves slower and can stack
                        if (particle.wetness > 0) {
                            if (y < this.rows - 1 && !this.grid[y + 1][x]) {
                                newY = y + 1;
                            }
                        } else {
                            // Normal sand behavior
                            if (y < this.rows - 1 && !this.grid[y + 1][x]) {
                                newY = y + 1;
                            } else if (y < this.rows - 1) {
                                const leftFree = x > 0 && !this.grid[y + 1][x - 1];
                                const rightFree = x < this.cols - 1 && !this.grid[y + 1][x + 1];
                                if (leftFree && rightFree) {
                                    newX = Math.random() < 0.5 ? x - 1 : x + 1;
                                    newY = y + 1;
                                } else if (leftFree) {
                                    newX = x - 1;
                                    newY = y + 1;
                                } else if (rightFree) {
                                    newX = x + 1;
                                    newY = y + 1;
                                }
                            }
                        }
                        break;

                    case 'water':
                        if (y < this.rows - 1) {
                            // Try to flow down
                            if (!this.grid[y + 1][x]) {
                                newY = y + 1;
                            } else {
                                // Try to flow sideways
                                const leftFree = x > 0 && !this.grid[y][x - 1];
                                const rightFree = x < this.cols - 1 && !this.grid[y][x + 1];
                                if (leftFree && rightFree) {
                                    newX = Math.random() < 0.5 ? x - 1 : x + 1;
                                } else if (leftFree) {
                                    newX = x - 1;
                                } else if (rightFree) {
                                    newX = x + 1;
                                }
                            }
                        }
                        break;

                    case 'lava':
                        // Lava flows and affects materials
                        if (y < this.rows - 1) {
                            if (!this.grid[y + 1][x]) {
                                newY = y + 1;
                            } else {
                                const leftFree = x > 0 && !this.grid[y][x - 1];
                                const rightFree = x < this.cols - 1 && !this.grid[y][x + 1];
                                if (leftFree && rightFree) {
                                    newX = Math.random() < 0.5 ? x - 1 : x + 1;
                                } else if (leftFree) {
                                    newX = x - 1;
                                } else if (rightFree) {
                                    newX = x + 1;
                                }
                            }
                        }

                        // Lava effects on surrounding particles
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const checkX = x + dx;
                                const checkY = y + dy;
                                if (checkX >= 0 && checkX < this.cols && checkY >= 0 && checkY < this.rows) {
                                    const target = this.grid[checkY][checkX];
                                    if (target) {
                                        if (target.type === 'sand') {
                                            this.grid[checkY][checkX] = {
                                                type: 'glass',
                                                lifetime: Infinity,
                                                velocity: { x: 0, y: 0 }
                                            };
                                        } else if (target.type === 'water') {
                                            this.grid[checkY][checkX] = null;
                                            if (Math.random() < 0.5) {
                                                particle.temperature *= 0.95;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;

                    case 'fire':
                        // Fire spreads and affects materials
                        if (Math.random() < this.fireSpreadChance) {
                            const spreadDirections = [
                                { x: -1, y: 0 }, { x: 1, y: 0 }, // Left, Right
                                { x: 0, y: -1 }, // Up
                                { x: -1, y: -1 }, { x: 1, y: -1 } // Diagonally up
                            ];
                            
                            for (const dir of spreadDirections) {
                                const spreadX = x + dir.x;
                                const spreadY = y + dir.y;
                                if (spreadX >= 0 && spreadX < this.cols && 
                                    spreadY >= 0 && spreadY < this.rows) {
                                    const targetParticle = this.grid[spreadY][spreadX];
                                    if (!targetParticle) {
                                        if (Math.random() < 0.1) {
                                            this.grid[spreadY][spreadX] = {
                                                type: 'fire',
                                                lifetime: this.fireLifetime,
                                                velocity: { x: 0, y: 0 }
                                            };
                                        }
                                    } else if (targetParticle.type === 'water') {
                                        this.grid[y][x] = null;
                                        this.grid[spreadY][spreadX] = null;
                                    }
                                }
                            }
                        }
                        break;
                }

                // Update position if the new spot is empty
                if (newX !== x || newY !== y) {
                    if (!this.nextGrid[newY][newX]) {
                        this.nextGrid[newY][newX] = particle;
                    } else {
                        this.nextGrid[y][x] = particle;
                    }
                } else {
                    this.nextGrid[y][x] = particle;
                }
            }
        }

        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    }

    clear() {
        this.initializeGrid();
        this.humans = [];
    }

    drawStickman(human) {
        const x = human.x;
        const y = human.y;
        const direction = human.direction;
        const isJumping = human.isJumping;
        
        this.ctx.strokeStyle = human.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        // Head
        this.ctx.arc(x + this.pixelSize * 2, y + this.pixelSize * 2, this.pixelSize * 1.5, 0, Math.PI * 2);
        
        // Body
        this.ctx.moveTo(x + this.pixelSize * 2, y + this.pixelSize * 3.5);
        this.ctx.lineTo(x + this.pixelSize * 2, y + this.pixelSize * 7);
        
        // Arms
        const armAngle = isJumping ? Math.PI / 4 : Math.sin(Date.now() / 200) * 0.3;
        this.ctx.moveTo(x + this.pixelSize * 2, y + this.pixelSize * 4.5);
        this.ctx.lineTo(x + this.pixelSize * (2 - direction * 2), y + this.pixelSize * (4.5 - Math.sin(armAngle) * 2));
        this.ctx.moveTo(x + this.pixelSize * 2, y + this.pixelSize * 4.5);
        this.ctx.lineTo(x + this.pixelSize * (2 + direction * 2), y + this.pixelSize * (4.5 + Math.sin(armAngle) * 2));
        
        // Legs
        const legAngle = isJumping ? Math.PI / 6 : Math.sin(Date.now() / 200) * 0.5;
        this.ctx.moveTo(x + this.pixelSize * 2, y + this.pixelSize * 7);
        this.ctx.lineTo(x + this.pixelSize * (2 - Math.sin(legAngle) * 1.5), y + this.pixelSize * 9);
        this.ctx.moveTo(x + this.pixelSize * 2, y + this.pixelSize * 7);
        this.ctx.lineTo(x + this.pixelSize * (2 + Math.sin(legAngle) * 1.5), y + this.pixelSize * 9);
        
        this.ctx.stroke();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw border
        this.ctx.fillStyle = '#2d2d2d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.borderWidth);
        this.ctx.fillRect(0, this.canvas.height - this.borderWidth, this.canvas.width, this.borderWidth);
        this.ctx.fillRect(0, 0, this.borderWidth, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - this.borderWidth, 0, this.borderWidth, this.canvas.height);

        // Draw particles
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const particle = this.grid[y][x];
                if (particle) {
                    switch (particle.type) {
                        case 'lightning':
                            const lightningIntensity = particle.lifetime / this.lightningLifetime;
                            this.ctx.fillStyle = `rgba(255, 255, 0, ${lightningIntensity})`;
                            // Add stronger glow effect
                            this.ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
                            this.ctx.shadowBlur = 15;
                            break;
                        case 'lava':
                            const lavaR = 255;
                            const lavaG = Math.floor(69 + particle.temperature * 50);
                            const lavaB = 0;
                            this.ctx.fillStyle = `rgb(${lavaR}, ${lavaG}, ${lavaB})`;
                            // Add glow effect
                            this.ctx.shadowColor = 'rgba(255, 69, 0, 0.5)';
                            this.ctx.shadowBlur = 8;
                            break;
                        case 'glass':
                            this.ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
                            break;
                        case 'fire':
                            const fireIntensity = (particle.lifetime / this.fireLifetime);
                            const fireR = 255;
                            const fireG = Math.floor(140 * fireIntensity);
                            const fireB = Math.floor(50 * fireIntensity);
                            const fireA = Math.max(0, fireIntensity);
                            this.ctx.fillStyle = `rgba(${fireR}, ${fireG}, ${fireB}, ${fireA})`;
                            break;
                        case 'sand':
                            const wetness = particle.wetness || 0;
                            const sandColor = `rgb(${230 - wetness * 60}, ${195 - wetness * 40}, ${76 - wetness * 20})`;
                            this.ctx.fillStyle = sandColor;
                            break;
                        case 'water':
                            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.8)';
                            break;
                    }
                    this.ctx.fillRect(
                        x * this.pixelSize,
                        y * this.pixelSize,
                        this.pixelSize,
                        this.pixelSize
                    );
                    // Reset shadow effects
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // Draw humans (sorted by y-position)
        this.humans.sort((a, b) => a.y - b.y).forEach(human => {
            this.drawStickman(human);
        });
    }

    animate() {
        this.updatePhysics();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    new SandboxGame();
}); 