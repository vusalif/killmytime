const assets = {
    BTC: { price: 45000, name: 'Bitcoin' },
    AAPL: { price: 180, name: 'Apple' },
    NVDA: { price: 450, name: 'NVIDIA' },
    MSFT: { price: 330, name: 'Microsoft' },
    DOGE: { price: 0.08, name: 'Dogecoin' }
};

let balance = 10000;
let currentAsset = 'BTC';
let priceHistory = {};
let chart;
let positions = {};
let totalProfitLoss = 0;
let realizedProfitLoss = 0;

// Initialize price history for all assets
for (const symbol in assets) {
    priceHistory[symbol] = [];
    let currentPrice = assets[symbol].price;
    positions[symbol] = null;
    
    for (let i = 0; i < 100; i++) {
        const time = new Date(Date.now() - (100 - i) * 30000);
        const price = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
        currentPrice = price;
        priceHistory[symbol].push({ time, price });
    }
    assets[symbol].currentPrice = currentPrice;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function calculateTotalPL() {
    let unrealizedPL = 0;
    for (const symbol in positions) {
        if (positions[symbol]) {
            const currentPrice = assets[symbol].currentPrice;
            const position = positions[symbol];
            const pl = position.type === 'buy'
                ? (currentPrice - position.price) * (position.amount / position.price)
                : (position.price - currentPrice) * (position.amount / position.price);
            unrealizedPL += pl;
        }
    }
    return unrealizedPL + realizedProfitLoss;
}

function updateBalance(newBalance) {
    balance = newBalance;
    const totalPL = calculateTotalPL();
    document.getElementById('balance').textContent = 
        `Balance: ${formatMoney(balance)} (P/L: ${formatMoney(totalPL)})`;
}

function updatePositionsDisplay() {
    let positionsWindow = document.getElementById('positions-window');
    if (!positionsWindow) {
        positionsWindow = document.createElement('div');
        positionsWindow.id = 'positions-window';
        positionsWindow.className = 'positions-window';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'positions-header';
        header.innerHTML = '<h2>Active Positions</h2>';
        
        // Make window draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - positionsWindow.offsetLeft;
            initialY = e.clientY - positionsWindow.offsetTop;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                // Keep window within viewport
                const maxX = window.innerWidth - positionsWindow.offsetWidth;
                const maxY = window.innerHeight - positionsWindow.offsetHeight;
                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));
                
                positionsWindow.style.left = currentX + 'px';
                positionsWindow.style.top = currentY + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        const content = document.createElement('div');
        content.className = 'positions-content';
        content.id = 'positions-content';
        
        positionsWindow.appendChild(header);
        positionsWindow.appendChild(content);
        document.body.appendChild(positionsWindow);
    }
    
    const content = document.getElementById('positions-content');
    content.innerHTML = '';
    
    for (const symbol in positions) {
        if (positions[symbol]) {
            const position = positions[symbol];
            const currentPrice = assets[symbol].currentPrice;
            const pl = position.type === 'buy'
                ? (currentPrice - position.price) * (position.amount / position.price)
                : (position.price - currentPrice) * (position.amount / position.price);
            
            const positionItem = document.createElement('div');
            positionItem.className = `position-item ${pl >= 0 ? 'profit' : 'loss'}`;
            
            const positionHeader = document.createElement('div');
            positionHeader.className = 'position-header';
            positionHeader.innerHTML = `
                <div class="position-details">
                    <span class="position-asset">${assets[symbol].name}</span>
                    <span class="position-amount">${formatMoney(position.amount)} @ ${formatMoney(position.price)}</span>
                </div>
                <div class="position-pl">P/L: ${formatMoney(pl)}</div>
            `;
            
            const positionControls = document.createElement('div');
            positionControls.className = 'position-controls';
            
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';
            
            const sliderHeader = document.createElement('div');
            sliderHeader.className = 'slider-header';
            
            const sellAmount = document.createElement('div');
            sellAmount.className = 'sell-amount';
            sellAmount.textContent = formatMoney(position.amount);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = position.amount.toString();
            slider.step = '1';
            slider.value = position.amount.toString();
            slider.className = 'position-slider';
            
            slider.addEventListener('input', () => {
                sellAmount.textContent = formatMoney(parseFloat(slider.value));
            });
            
            const sellControls = document.createElement('div');
            sellControls.className = 'sell-controls';
            
            const quickSellBtn = document.createElement('button');
            quickSellBtn.className = 'quick-sell-btn';
            quickSellBtn.textContent = 'Sell';
            quickSellBtn.addEventListener('click', () => {
                const amount = parseFloat(slider.value);
                if (amount > 0) {
                    sellPosition(symbol, amount);
                }
            });
            
            sellControls.appendChild(sellAmount);
            sellControls.appendChild(quickSellBtn);
            
            sliderContainer.appendChild(sliderHeader);
            sliderContainer.appendChild(slider);
            
            positionControls.appendChild(sliderContainer);
            positionControls.appendChild(sellControls);
            
            positionItem.appendChild(positionHeader);
            positionItem.appendChild(positionControls);
            
            content.appendChild(positionItem);
        }
    }
    
    updateBalance(balance);
}

function sellPosition(symbol, amount) {
    const position = positions[symbol];
    if (!position || amount <= 0 || amount > position.amount) return;
    
    const currentPrice = assets[symbol].currentPrice;
    const profitLoss = position.type === 'buy'
        ? (currentPrice - position.price) * (amount / position.price)
        : (position.price - currentPrice) * (amount / position.price);
    
    updateBalance(balance + amount + profitLoss);
    addToHistory('Sold', amount, currentPrice, symbol, profitLoss);
    
    if (amount === position.amount) {
        positions[symbol] = null;
        if (symbol === currentAsset) {
            chart.options.plugins.annotation.annotations = {};
        }
    } else {
        position.amount -= amount;
    }
    
    updatePositionsDisplay();
    if (symbol === currentAsset) {
        chart.update();
    }
}

// Update all asset prices
function updatePrices() {
    for (const symbol in assets) {
        const currentPrice = assets[symbol].currentPrice;
        assets[symbol].currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    }
}

// Modify updateChart function
function updateChart() {
    updatePrices(); // Update all asset prices
    
    const time = new Date();
    const currentPrice = assets[currentAsset].currentPrice;
    
    priceHistory[currentAsset].push({ time, price: currentPrice });
    priceHistory[currentAsset].shift();
    
    chart.data.labels = priceHistory[currentAsset].map(data => data.time);
    chart.data.datasets[0].data = priceHistory[currentAsset].map(data => data.price);
    
    if (positions[currentAsset]) {
        chart.options.plugins.annotation.annotations = {
            tradeLine: createTradeAnnotation(chart, positions[currentAsset], currentPrice)
        };
    }
    
    updatePositionsDisplay(); // Update all positions
    chart.update('none');
}

function addToHistory(action, amount, price, symbol, profitLoss = 0) {
    const historyList = document.getElementById('historyList');
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const timeText = document.createElement('span');
    timeText.textContent = formatTime(new Date());
    timeText.className = 'time';
    
    const details = document.createElement('div');
    details.className = 'trade-details';
    
    const actionText = document.createElement('div');
    actionText.className = 'action';
    actionText.textContent = `${action} ${formatMoney(amount)} of ${assets[symbol].name} at ${formatMoney(price)}`;
    
    const profitLossText = document.createElement('div');
    if (profitLoss !== 0) {
        realizedProfitLoss += profitLoss;
        profitLossText.textContent = `Trade P/L: ${formatMoney(profitLoss)} | Total Realized P/L: ${formatMoney(realizedProfitLoss)}`;
        profitLossText.className = profitLoss > 0 ? 'profit' : 'loss';
    }
    
    details.appendChild(actionText);
    details.appendChild(profitLossText);
    
    item.appendChild(timeText);
    item.appendChild(details);
    
    historyList.insertBefore(item, historyList.firstChild);
}

function createTradeAnnotation(chart, position, currentPrice) {
    const profitLoss = position.type === 'buy' 
        ? (currentPrice - position.price) * (position.amount / position.price)
        : (position.price - currentPrice) * (position.amount / position.price);
    
    return {
        type: 'line',
        mode: 'horizontal',
        scaleID: 'y',
        value: position.price,
        borderColor: profitLoss >= 0 ? 'rgba(0, 184, 148, 0.3)' : 'rgba(255, 118, 117, 0.3)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
            enabled: true,
            content: `${position.type.toUpperCase()} ${formatMoney(position.amount)} @ ${formatMoney(position.price)}`,
            position: 'start',
            backgroundColor: profitLoss >= 0 ? 'rgba(0, 184, 148, 0.9)' : 'rgba(255, 118, 117, 0.9)',
            color: '#fff',
            font: {
                size: 11
            },
            padding: 4
        }
    };
}

function initChart() {
    const ctx = document.getElementById('tradingChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 184, 148, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 184, 148, 0)');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: priceHistory[currentAsset].map(data => data.time),
            datasets: [{
                label: `${assets[currentAsset].name} Price`,
                data: priceHistory[currentAsset].map(data => data.price),
                borderColor: '#00b894',
                borderWidth: 2,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm:ss'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#888',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return formatMoney(value);
                        }
                    },
                    position: 'right'
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1d1d1d',
                    titleColor: '#888',
                    bodyColor: '#fff',
                    bodyFont: {
                        family: 'Inter'
                    },
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Price: ${formatMoney(context.parsed.y)}`;
                        }
                    }
                },
                annotation: {
                    annotations: {}
                }
            }
        }
    });
}

function switchAsset(symbol) {
    currentAsset = symbol;
    chart.data.labels = priceHistory[symbol].map(data => data.time);
    chart.data.datasets[0].data = priceHistory[symbol].map(data => data.price);
    chart.data.datasets[0].label = `${assets[symbol].name} Price`;
    
    // Update trade line for the selected asset
    if (positions[symbol]) {
        chart.options.plugins.annotation.annotations = {
            tradeLine: createTradeAnnotation(chart, positions[symbol], assets[symbol].currentPrice)
        };
    } else {
        chart.options.plugins.annotation.annotations = {};
    }
    
    chart.update();
}

document.getElementById('buyBtn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('buyAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    if (amount > balance) {
        alert('Insufficient balance');
        return;
    }
    
    positions[currentAsset] = {
        type: 'buy',
        price: assets[currentAsset].currentPrice,
        amount: amount,
        time: new Date(),
        symbol: currentAsset
    };
    
    updateBalance(balance - amount);
    addToHistory('Bought', amount, assets[currentAsset].currentPrice, currentAsset);
    document.getElementById('buyAmount').value = '';
    
    // Add trade line
    chart.options.plugins.annotation.annotations = {
        tradeLine: createTradeAnnotation(chart, positions[currentAsset], assets[currentAsset].currentPrice)
    };
    chart.update();
    updatePositionsDisplay();
});

document.getElementById('sellBtn').addEventListener('click', () => {
    const position = positions[currentAsset];
    if (!position) {
        alert('No position to sell for this asset');
        return;
    }
    
    const amount = parseFloat(document.getElementById('sellAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    if (amount > position.amount) {
        alert('Cannot sell more than your position');
        return;
    }
    
    const profitLoss = position.type === 'buy'
        ? (assets[currentAsset].currentPrice - position.price) * (amount / position.price)
        : (position.price - assets[currentAsset].currentPrice) * (amount / position.price);
    
    updateBalance(balance + amount + profitLoss);
    addToHistory('Sold', amount, assets[currentAsset].currentPrice, currentAsset, profitLoss);
    
    if (amount === position.amount) {
        positions[currentAsset] = null;
        chart.options.plugins.annotation.annotations = {};
    } else {
        position.amount -= amount;
    }
    
    document.getElementById('sellAmount').value = '';
    chart.update();
    updatePositionsDisplay();
});

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updatePositionsDisplay();
    // Update price every second
    setInterval(updateChart, 1000);
}); 