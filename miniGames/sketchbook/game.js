// Get DOM elements
const container = document.getElementById('sticky-notes-container');
const showAllFramesBtn = document.getElementById('show-all-frames');
const framesGrid = document.getElementById('frames-grid');
const gridContent = framesGrid.querySelector('.grid-content');
const canvas = document.getElementById('current-canvas');
const ctx = canvas.getContext('2d');
const doneEditingBtn = document.getElementById('done-editing');

// Get pen settings elements
const penSizeInput = document.getElementById('pen-size');
const penOpacityInput = document.getElementById('pen-opacity');
const penColorInput = document.getElementById('pen-color');
const penTypeSelect = document.getElementById('pen-type');
const lineStyleSelect = document.getElementById('line-style');
const penSmoothingInput = document.getElementById('pen-smoothing');
const pressureSensitivityInput = document.getElementById('pressure-sensitivity');

// Animation state
const frames = [];
let isDrawing = false;
let currentFrame = [];
let frameCount = 0;
let isPlaying = false;
let lastFrameIndex = 0;
let editingFrameIndex = -1;
let currentPoint = null;

// Undo/Redo state
const maxUndoSteps = 50;
let undoStack = [];
let redoStack = [];

// Pen settings state
const defaultPenSettings = {
    size: 2,
    opacity: 100,
    color: '#000000',
    type: 'round',
    lineStyle: 'solid',
    smoothing: 50,
    pressureSensitivity: false,
    isEraser: false
};

let currentPenSettings = { ...defaultPenSettings };

// Save state for undo
function saveState() {
    const state = {
        frame: JSON.parse(JSON.stringify(editingFrameIndex === -1 ? currentFrame : frames[editingFrameIndex])),
        editingFrameIndex
    };
    
    undoStack.push(state);
    if (undoStack.length > maxUndoSteps) {
        undoStack.shift();
    }
    redoStack = []; // Clear redo stack when new action is performed
}

// Undo last action
function undo() {
    if (undoStack.length === 0) return;
    
    const currentState = {
        frame: JSON.parse(JSON.stringify(editingFrameIndex === -1 ? currentFrame : frames[editingFrameIndex])),
        editingFrameIndex
    };
    redoStack.push(currentState);
    
    const prevState = undoStack.pop();
    if (prevState.editingFrameIndex === -1) {
        currentFrame = prevState.frame;
    } else {
        frames[prevState.editingFrameIndex] = prevState.frame;
    }
    
    // Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame(prevState.frame, ctx);
    addFrameNumber(canvas, editingFrameIndex === -1 ? frames.length + 1 : editingFrameIndex + 1, editingFrameIndex !== -1);
}

// Redo last undone action
function redo() {
    if (redoStack.length === 0) return;
    
    const currentState = {
        frame: JSON.parse(JSON.stringify(editingFrameIndex === -1 ? currentFrame : frames[editingFrameIndex])),
        editingFrameIndex
    };
    undoStack.push(currentState);
    
    const nextState = redoStack.pop();
    if (nextState.editingFrameIndex === -1) {
        currentFrame = nextState.frame;
    } else {
        frames[nextState.editingFrameIndex] = nextState.frame;
    }
    
    // Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame(nextState.frame, ctx);
    addFrameNumber(canvas, editingFrameIndex === -1 ? frames.length + 1 : editingFrameIndex + 1, editingFrameIndex !== -1);
}

// Add keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
    }
});

// Event listeners for drawing
function startDrawing(e) {
    isDrawing = true;
    const point = getPoint(e);
    currentPoint = point;
    
    if (editingFrameIndex === -1) {
        currentFrame.push({
            points: [point],
            settings: { ...currentPenSettings }
        });
    } else {
        frames[editingFrameIndex].push({
            points: [point],
            settings: { ...currentPenSettings }
        });
    }
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const point = getPoint(e);
    if (point.x === currentPoint.x && point.y === currentPoint.y) return;
    currentPoint = point;
    
    if (editingFrameIndex === -1) {
        currentFrame[currentFrame.length - 1].points.push(point);
    } else {
        frames[editingFrameIndex][frames[editingFrameIndex].length - 1].points.push(point);
    }
    
    // Apply current line's settings
    const currentLine = editingFrameIndex === -1 ? 
        currentFrame[currentFrame.length - 1] : 
        frames[editingFrameIndex][frames[editingFrameIndex].length - 1];
    
    applyPenSettings(currentLine.settings);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
}

// Function to apply specific pen settings
function applyPenSettings(settings) {
    ctx.lineWidth = settings.size;
    ctx.globalAlpha = settings.opacity / 100;
    ctx.strokeStyle = settings.color;
    ctx.lineCap = settings.type;
    ctx.lineJoin = settings.type;
    
    if (settings.lineStyle === 'dashed') {
        ctx.setLineDash([settings.size * 2, settings.size]);
    } else if (settings.lineStyle === 'dotted') {
        ctx.setLineDash([settings.size, settings.size * 2]);
    } else {
        ctx.setLineDash([]);
    }
}

// Function to draw a frame with its stored settings
function drawFrame(frame, context) {
    frame.forEach(line => {
        applyPenSettings(line.settings);
        context.beginPath();
        context.moveTo(line.points[0].x, line.points[0].y);
        line.points.forEach(point => {
            context.lineTo(point.x, point.y);
        });
        context.stroke();
    });
}

// Show frames grid
function showFramesGrid() {
    gridContent.innerHTML = '';
    
    frames.forEach((frame, i) => {
        const frameWrapper = document.createElement('div');
        frameWrapper.classList.add('frame-wrapper');
        
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = 400;
        frameCanvas.height = 400;
        const frameCtx = frameCanvas.getContext('2d');
        
        // Draw frame with its stored settings
        drawFrame(frame, frameCtx);
        
        addFrameNumber(frameCanvas, i + 1);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'minimal-button edit-frame-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editFrame(i);
        
        frameWrapper.appendChild(frameCanvas);
        frameWrapper.appendChild(editBtn);
        gridContent.appendChild(frameWrapper);
    });
    
    framesGrid.style.display = 'flex';
}

// Edit frame
function editFrame(index) {
    if (isPlaying) return;
    
    editingFrameIndex = index;
    currentFrame = [...frames[index]];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame(frames[index], ctx);
    
    doneEditingBtn.style.display = 'block';
    addFrameNumber(canvas, index + 1, true);
    framesGrid.style.display = 'none';
}

// Play animation
function startAnimation() {
    isPlaying = true;
    document.getElementById('play-animation').textContent = 'Stop Animation';
    
    let frameIndex = 0;
    function playNextFrame() {
        if (!isPlaying) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const frame = frames[frameIndex];
        drawFrame(frame, ctx);
        
        addFrameNumber(canvas, frameIndex + 1);
        
        frameIndex = (frameIndex + 1) % frames.length;
        setTimeout(playNextFrame, 200);
    }
    
    playNextFrame();
}

// Draw shadow of previous frame
function drawPreviousFrameShadow() {
    return;
}

// Event listeners for settings
penSizeInput.addEventListener('input', (e) => {
    currentPenSettings.size = parseInt(e.target.value);
    updateValueDisplay(e.target);
});

penOpacityInput.addEventListener('input', (e) => {
    currentPenSettings.opacity = parseInt(e.target.value);
    updateValueDisplay(e.target);
});

penColorInput.addEventListener('input', (e) => {
    currentPenSettings.color = e.target.value;
});

penTypeSelect.addEventListener('change', (e) => {
    currentPenSettings.type = e.target.value;
});

lineStyleSelect.addEventListener('change', (e) => {
    currentPenSettings.lineStyle = e.target.value;
});

penSmoothingInput.addEventListener('input', (e) => {
    currentPenSettings.smoothing = parseInt(e.target.value);
    updateValueDisplay(e.target);
});

pressureSensitivityInput.addEventListener('change', (e) => {
    currentPenSettings.pressureSensitivity = e.target.checked;
});

// Color presets
document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', () => {
        currentPenSettings.color = preset.style.backgroundColor;
        penColorInput.value = rgbToHex(preset.style.backgroundColor);
    });
});

// Helper function to convert RGB to HEX
function rgbToHex(rgb) {
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#000000';
    
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Initialize settings with default values
applyPenSettings(defaultPenSettings);

// Add share button
const shareBtn = document.createElement('button');
shareBtn.id = 'share-animation';
shareBtn.className = 'minimal-button';
shareBtn.textContent = 'Share Animation';
document.querySelector('.controls').appendChild(shareBtn);

// Video creation function
async function createAnimationVideo() {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary canvas for the animation
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Get supported MIME type
            const mimeTypes = ['video/webm;codecs=vp8', 'video/webm'];
            const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

            // Set up MediaRecorder with the canvas stream
            const stream = tempCanvas.captureStream(30); // 30 FPS
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                resolve(blob);
            };
            mediaRecorder.onerror = (err) => reject(err);

            // Start recording
            mediaRecorder.start();

            // Draw each frame
            let frameIndex = 0;
            function drawNextFrame() {
                if (frameIndex >= frames.length) {
                    mediaRecorder.stop();
                    return;
                }

                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                drawFrame(frames[frameIndex], tempCtx);
                frameIndex++;

                // Wait for next frame
                setTimeout(drawNextFrame, 200); // Same timing as animation playback
            }

            drawNextFrame();
        } catch (error) {
            reject(error);
        }
    });
}

// Event listeners for sharing
shareBtn.addEventListener('click', async () => {
    if (frames.length === 0) {
        alert('Please create an animation first!');
        return;
    }

    const originalText = shareBtn.textContent;
    shareBtn.textContent = 'Creating video...';
    shareBtn.disabled = true;

    try {
        const blob = await createAnimationVideo();
        
        // Get file extension based on mime type
        const fileExtension = blob.type.includes('webm') ? 'webm' : 'mp4';
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `animation.${fileExtension}`;
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(downloadLink.href);
        
        alert('Animation downloaded! You can now share this video file.');
    } catch (error) {
        console.error('Failed to create video:', error);
        alert('Failed to create video. Please try again.');
    } finally {
        shareBtn.textContent = originalText;
        shareBtn.disabled = false;
    }
});

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    currentPoint = null;
    ctx.beginPath();
    saveState(); // Save state after completing a stroke
}

function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Add frame number to canvas
function addFrameNumber(canvas, number, isEditing = false) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = isEditing ? '#ff4444' : '#666';
    ctx.font = '16px Pangolin';
    ctx.fillText(`Frame ${number}${isEditing ? ' (Editing)' : ''}`, 10, 25);
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (editingFrameIndex === -1) {
        currentFrame = [];
    } else {
        frames[editingFrameIndex] = [];
    }
    drawPreviousFrameShadow();
    addFrameNumber(canvas, editingFrameIndex === -1 ? frames.length + 1 : editingFrameIndex + 1, editingFrameIndex !== -1);
}

// Update value displays
function updateValueDisplay(input) {
    const display = input.parentElement.querySelector('.value-display');
    if (display) {
        display.textContent = input.type === 'range' ? 
            (input.id === 'pen-opacity' || input.id === 'pen-smoothing' ? `${input.value}%` : `${input.value}px`) :
            input.value;
    }
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Add frame number to initial canvas
addFrameNumber(canvas, 1);

// Event listeners for grid view
showAllFramesBtn.addEventListener('click', showFramesGrid);
document.getElementById('close-grid').addEventListener('click', () => {
    framesGrid.style.display = 'none';
});

// Clear current frame
document.getElementById('clear-current').addEventListener('click', clearCanvas);

// Add new frame
document.getElementById('add-frame').addEventListener('click', () => {
    if (isPlaying) {
        stopAnimation();
        return;
    }
    
    if (currentFrame.length === 0) {
        alert('Please draw something first!');
        return;
    }
    
    if (editingFrameIndex !== -1) {
        frames[editingFrameIndex] = [...currentFrame];
        editingFrameIndex = -1;
        doneEditingBtn.style.display = 'none';
    } else {
        frames.push([...currentFrame]);
    }
    
    currentFrame = [];
    currentPenSettings = { ...defaultPenSettings };
    clearCanvas();
    showAllFramesBtn.style.display = frames.length > 1 ? 'block' : 'none';
});

// Done editing
doneEditingBtn.addEventListener('click', () => {
    if (editingFrameIndex !== -1) {
        frames[editingFrameIndex] = [...currentFrame];
        editingFrameIndex = -1;
        currentFrame = [];
        doneEditingBtn.style.display = 'none';
        clearCanvas();
    }
});

// Play animation
document.getElementById('play-animation').addEventListener('click', () => {
    if (frames.length === 0) {
        alert('Please add some frames first!');
        return;
    }
    
    if (isPlaying) {
        stopAnimation();
    } else {
        startAnimation();
    }
});

function stopAnimation() {
    isPlaying = false;
    document.getElementById('play-animation').textContent = 'Play Animation';
    clearCanvas();
    drawPreviousFrameShadow();
}

// Pen settings panel functionality
const penSettingsPanel = document.getElementById('pen-settings-panel');
const penSettingsBtn = document.getElementById('pen-settings-btn');

// Make panel draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const panelHeader = penSettingsPanel.querySelector('.panel-header');

panelHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === panelHeader) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, penSettingsPanel);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// Panel controls
penSettingsBtn.addEventListener('click', () => {
    penSettingsPanel.classList.toggle('hidden');
});

const minimizeBtn = penSettingsPanel.querySelector('.minimize-btn');
minimizeBtn.addEventListener('click', () => {
    penSettingsPanel.classList.toggle('minimized');
});

const closeBtn = penSettingsPanel.querySelector('.close-btn');
closeBtn.addEventListener('click', () => {
    penSettingsPanel.classList.add('hidden');
});

// Pen presets
const penPresets = {
    pencil: {
        size: 2,
        opacity: 100,
        color: '#000000',
        type: 'round',
        lineStyle: 'solid',
        smoothing: 50
    },
    marker: {
        size: 8,
        opacity: 100,
        color: '#000000',
        type: 'square',
        lineStyle: 'solid',
        smoothing: 30
    },
    brush: {
        size: 5,
        opacity: 80,
        color: '#000000',
        type: 'round',
        lineStyle: 'solid',
        smoothing: 70
    },
    highlighter: {
        size: 20,
        opacity: 30,
        color: '#ffff00',
        type: 'square',
        lineStyle: 'solid',
        smoothing: 50
    }
};

// Initialize pen presets
document.querySelectorAll('.preset-btn').forEach(preset => {
    preset.addEventListener('click', () => {
        const presetName = preset.dataset.preset;
        const presetValues = penPresets[presetName];
        
        Object.assign(currentPenSettings, presetValues);
        updatePenSettingsUI();
    });
});

// Function to update UI with current pen settings
function updatePenSettingsUI() {
    penSizeInput.value = currentPenSettings.size;
    penOpacityInput.value = currentPenSettings.opacity;
    penColorInput.value = currentPenSettings.color;
    penTypeSelect.value = currentPenSettings.type;
    lineStyleSelect.value = currentPenSettings.lineStyle;
    penSmoothingInput.value = currentPenSettings.smoothing;
    pressureSensitivityInput.checked = currentPenSettings.pressureSensitivity;

    // Update value displays
    document.querySelectorAll('input[type="range"]').forEach(updateValueDisplay);
}

// Function to copy previous frame
function copyPreviousFrame() {
    if (editingFrameIndex === -1 && frames.length > 0) {
        // Copy the last frame to current frame
        currentFrame = JSON.parse(JSON.stringify(frames[frames.length - 1]));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(currentFrame, ctx);
        saveState();
    } else if (editingFrameIndex > 0) {
        // Copy the previous frame to current editing frame
        frames[editingFrameIndex] = JSON.parse(JSON.stringify(frames[editingFrameIndex - 1]));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(frames[editingFrameIndex], ctx);
        saveState();
    }
}

// Add eraser functionality
function setEraser(enabled) {
    currentPenSettings.isEraser = enabled;
    if (enabled) {
        // Store previous settings
        currentPenSettings.previousColor = currentPenSettings.color;
        currentPenSettings.previousOpacity = currentPenSettings.opacity;
        // Set eraser settings
        currentPenSettings.color = '#FEFFD7';
        currentPenSettings.opacity = 100;
    } else {
        // Restore previous settings
        if (currentPenSettings.previousColor) {
            currentPenSettings.color = currentPenSettings.previousColor;
            currentPenSettings.opacity = currentPenSettings.previousOpacity;
        }
    }
    updatePenSettingsUI();
}

// Get tool elements
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const copyPrevFrameBtn = document.getElementById('copy-prev-frame');
const penToolBtn = document.getElementById('pen-tool');
const eraserToolBtn = document.getElementById('eraser-tool');

// Add event listeners for new buttons
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
copyPrevFrameBtn.addEventListener('click', copyPreviousFrame);

// Tool selection
penToolBtn.addEventListener('click', () => {
    penToolBtn.classList.add('active');
    eraserToolBtn.classList.remove('active');
    setEraser(false);
});

eraserToolBtn.addEventListener('click', () => {
    eraserToolBtn.classList.add('active');
    penToolBtn.classList.remove('active');
    setEraser(true);
}); 