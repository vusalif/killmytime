// Remove the surrenderHint function from its current location and place it here, at the top level
function surrenderHint() {
    if (!isGameActive || gameMode !== 'hints') return;
    
    // Show the country name instead of hint
    document.getElementById('country-to-find').innerHTML = 
        `<div style="font-size: 24px; color: #e74c3c;">The country was: ${targetCountry}</div>`;
    
    // Highlight the country in yellow
    geojsonLayer.eachLayer(function(layer) {
        if (layer.feature.properties.ADMIN === targetCountry) {
            layer.setStyle({
                fillColor: '#f1c40f',
                fillOpacity: 0.6,
                color: '#000',
                weight: 1
            });
        }
    });
    
    // Disable buttons
    document.getElementById('hint-btn').classList.add('hidden');
    document.getElementById('surrender-btn').classList.add('hidden');
    
    // Show game over after a short delay
    setTimeout(() => {
        endGame();
    }, 2000);
}

// Add this function at the top level (outside any other functions)
function updateAttemptsDisplay() {
    const display = document.getElementById('attempts-display');
    if (display) {
        display.classList.remove('hidden');
        display.innerHTML = `${`<i class="fas fa-heart" style="color: #7C4646;"></i>`.repeat(attemptsRemaining)}`;
    }
}

// Modify the startNewRound function
function startNewRound() {
    if (!isGameActive) return;

    // Reset map colors first
    resetMapColors();
    
    // Check if this is the first question for a new user
    const isFirstTime = !localStorage.getItem('hasPlayedBefore');
    
    if (gameMode === 'population') {
        // Wait for geojsonLayer to be initialized
        if (!geojsonLayer) {
            setTimeout(startNewRound, 100); // Try again in 100ms
            return;
        }
        
        // Get available countries for current difficulty that have population data
        let availableCountries = [...countries[difficulty]].filter(country => 
            !foundCountries.has(country) && countryPopulation[country]
        );
        
        if (availableCountries.length === 0) {
            endGame();
            return;
        }
        
        // Select random country and comparison type
        const randomIndex = Math.floor(Math.random() * availableCountries.length);
        referenceCountry = availableCountries[randomIndex];
        referencePopulation = countryPopulation[referenceCountry];
        
        // Determine comparison type
        if (referenceCountry === 'China') {
            comparisonType = 'less';
        } else if (referenceCountry === 'Monaco') {
            comparisonType = 'more';
        } else {
            comparisonType = Math.random() < 0.5 ? 'more' : 'less';
        }
        
        // Update display
        document.getElementById('country-to-find').innerHTML = `
            <div style="font-size: 18px;">
                Find a country with <span style="color: ${comparisonType === 'less' ? '#A21A1A' : '#23A21A'}; font-weight: 1000;">${comparisonType.toUpperCase()}</span> 
                population than <span style="color: #3498db; font-weight: 1000;">${referenceCountry}</span>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                    (${referenceCountry}'s population: ${referencePopulation.toLocaleString()})
                </div>
            </div>
        `;
        
        // Highlight reference country
        geojsonLayer.eachLayer(function(layer) {
            const countryName = layer.feature.properties.ADMIN;
            if (countryName === referenceCountry) {
                layer.setStyle({
                    fillColor: '#f1c40f',
                    fillOpacity: 0.6,
                    color: '#000',
                    weight: 1
                });
            } else if (foundCountries.has(countryName)) {
                layer.setStyle({
                    fillColor: '#2ecc71',
                    fillOpacity: 0.6,
                    color: '#000',
                    weight: 1
                });
            }
        });
        
        updateAttemptsDisplay();
        return;
    }
    
    // For other modes (except alphabetic), keep the existing logic
    else if (gameMode !== 'alphabetic') {
        // Get available countries for current difficulty that haven't been found yet
        let availableCountries = countries[difficulty].filter(country => !foundCountries.has(country));
        
        if (availableCountries.length === 0) {
            endGame();
            return;
        }
        
        // For first-time users, set target as USA if it's available
        if (isFirstTime && availableCountries.includes('United States of America')) {
            targetCountry = 'United States of America';
            // Mark that the user has played before
            localStorage.setItem('hasPlayedBefore', 'true');
        } else {
            const randomIndex = Math.floor(Math.random() * availableCountries.length);
            targetCountry = availableCountries[randomIndex];
        }
        
        // Update display for non-hints modes
        if (gameMode !== 'hints') {
            document.getElementById('country-to-find').textContent = targetCountry;
            
            // Update score display
            document.getElementById('current-score').textContent = currentScore;
            
            // Add tutorial highlight for first country in find all countries mode
            if (gameMode === 'all' && foundCountries.size === 0) {
                const message = document.createElement('div');
                message.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                         background-color: rgba(241, 196, 15, 0.95); padding: 20px; border-radius: 10px;
                         box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 1000; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold;">👆 Find ${targetCountry}!</div>
                        <div style="font-size: 14px; margin-top: 5px;">Click on the highlighted country</div>
                    </div>
                `;
                document.body.appendChild(message);
                setTimeout(() => document.body.removeChild(message), 4000);
                
                geojsonLayer.eachLayer(function(layer) {
                    if (layer.feature.properties.ADMIN === targetCountry) {
                        layer.setStyle({
                            fillColor: '#f1c40f',
                            fillOpacity: 1,
                            color: '#e67e22',
                            weight: 3
                        });
                    }
                });
            }
        }
    }
}


// Helper function to extract post ID from Tenor URL
function getPostIdFromUrl(url) {
    console.log('Processing URL:', url); // Debug log
    
    // First try to match the ID from the standard format
    let match = url.match(/view\/.*?-(\d+)/);
    if (match) {
        console.log('Found ID (format 1):', match[1]);
        return match[1];
    }
    
    // Try alternate format
    match = url.match(/\/(\d+)$/);
    if (match) {
        console.log('Found ID (format 2):', match[1]);
        return match[1];
    }
    
    // Try extracting just numbers if all else fails
    match = url.match(/(\d{6,})/); // Look for 6+ digit numbers
    if (match) {
        console.log('Found ID (format 3):', match[1]);
        return match[1];
    }
    
    console.error('Could not extract Tenor ID from URL:', url);
    return '';
}

// Modify the initMap function
function initMap() {
    // ... existing initMap code ...

    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        fillColor: '#95a5a6',
                        weight: 1,
                        opacity: 1,
                        color: '#2c3e50',
                        fillOpacity: 0.2
                    };
                }
            }).addTo(map);

            geojsonLayer.eachLayer(function(layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: countryClick
                });
            });

            // Only start new round after geojsonLayer is initialized
            if (gameMode === 'population') {
                startNewRound();
            }
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    // Create video containers
    const videoContainers = `
        <div id="left-video-container" style="display: none; position: fixed; left: 10px; top: 50%; transform: translateY(-50%); z-index: 1000;">
            <button onclick="hideVideos()" style="position: absolute; top: -30px; right: 0; background: rgba(0,0,0,0.5); color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">✕</button>
            <video id="left-video" style="width: auto; height: 80vh; max-width: 20vw; object-fit: cover;" loop muted autoplay>
                <source src="path/to/your/left-video.mp4" type="video/mp4">
            </video>
        </div>
        <div id="right-video-container" style="display: none; position: fixed; right: 10px; top: 50%; transform: translateY(-50%); z-index: 1000;">
            <button onclick="hideVideos()" style="position: absolute; top: -30px; right: 0; background: rgba(0,0,0,0.5); color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">✕</button>
            <video id="right-video" style="width: auto; height: 80vh; max-width: 20vw; object-fit: cover;" loop muted autoplay>
                <source src="path/to/your/right-video.mp4" type="video/mp4">
            </video>
        </div>
    `;
    
    // Add containers to body
    document.body.insertAdjacentHTML('beforeend', videoContainers);
}

function toggleLog() {
    const logContent = document.getElementById('log-content');
    const logHeader = document.querySelector('.log-header');
    const arrow = logContent.style.display === 'none' ? '▲' : '▼';
    
    if (logContent.style.display === 'none') {
        logContent.style.display = 'block';
    } else {
        logContent.style.display = 'none';
    }

    // Update only the arrow in the header while preserving the counters
    const headerSpan = logHeader.querySelector('span');
    headerSpan.textContent = `Log History ${arrow}`;
}

function addLogEntry(clickedCountry, targetCountry, isCorrect) {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${isCorrect ? 'correct' : 'incorrect'}`;
    
    // Don't show target country in hints mode
    if (gameMode === 'hints') {
        entry.innerHTML = `${isCorrect ? '✓' : '✗'} Clicked: ${clickedCountry}`;
    } else {
        entry.innerHTML = `
            ${isCorrect ? '✓' : '✗'} Clicked: ${clickedCountry}
            ${isCorrect ? '' : `(Target: ${targetCountry})`}
        `;
    }
    
    logContent.insertBefore(entry, logContent.firstChild);
    
    // Update counters
    updateLogCounters(isCorrect);
}

// Add this new function
function updateLogCounters(isCorrect) {
    const correctCounter = document.querySelector('.correct-count');
    const incorrectCounter = document.querySelector('.incorrect-count');
    const accuracyCounter = document.querySelector('.accuracy-count');
    
    if (isCorrect) {
        const current = parseInt(correctCounter.textContent.split(': ')[1]);
        correctCounter.textContent = `Correct: ${current + 1}`;
    } else {
        const current = parseInt(incorrectCounter.textContent.split(': ')[1]);
        incorrectCounter.textContent = `Incorrect: ${current + 1}`;
    }
    
    // Calculate and update accuracy
    const correct = parseInt(correctCounter.textContent.split(': ')[1]);
    const incorrect = parseInt(incorrectCounter.textContent.split(': ')[1]);
    const total = correct + incorrect;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    accuracyCounter.textContent = `Accuracy: ${accuracy}%`;
}

// Then your existing code starts here
let map;
let currentScore = 0;
let targetCountry = '';
let difficulty = 'normal';
let geojsonLayer;
let gameTimer;
let timeLeft;
let isGameActive = false;
let usedCountries = new Set();
let availableCountries = [];
let gameMode = 'time';
let foundCountries = new Set();
let correctAttempts = 0;
let incorrectAttempts = 0;
let alphabeticIndex = 0;
let sortedCountries = [];
let currentStreak = 0;
let isChristmasActive = false;  // Add this line

// Add these near other game state variables at the top of the file
let comparisonType = '';
let referenceCountry = '';
let referencePopulation = 0;

// Add this with other game state variables at the top
let attemptsRemaining = 3;

// Add these with other message constants
const populationMessages = {
    correct: [
        "Perfect population comparison! 📊",
        "Statistical genius! 📈",
        "Demographics master! 👥",
        "Population pro! 🎯",
        "Number cruncher extraordinaire! 🔢"
    ],
    incorrect: [
        "Wrong population range! 📉",
        "Check those numbers again! 🔍",
        "Not quite the right size! 📊",
        "Population mismatch! ❌",
        "Demographics need work! 👥"
    ]
};

function hideStartMenu() {
    document.getElementById('game-overlay').style.display = 'none';
    document.getElementById('start-menu').style.display = 'none';
    gameMode = 'all';
    isGameActive = true;
    resetGame();
    initializeGame();
    document.getElementById('finish-btn').classList.remove('hidden');
    document.getElementById('menu-btn').classList.remove('hidden');
    document.getElementById('feedback-btn').classList.remove('hidden');
}

        const countries = {
            easy: [
        'United States of America', 'Canada', 'Brazil', 'Russia', 'China',
        'India', 'Australia', 'South Africa', 'Egypt', 'France', 'United Kingdom',
        'Italy', 'Germany', 'Japan', 'Spain', 'Mexico', 'Argentina', 'Saudi Arabia',
        'Turkey', 'South Korea', 'Austria', 'Belgium', 'Switzerland', 'Ireland',
        'Portugal', 'Greece', 'Sweden', 'Netherlands', 'Denmark',
        'Norway', 'Poland', 'Azerbaijan', 'Vietnam', 'Indonesia', 'Pakistan', 
        'Iran', 'Georgia'
    ],
    normal: [
        'Ukraine', 'Cuba', 'Venezuela', 'Colombia', 'Malaysia', 'Myanmar', 
        'Iraq', 'Chile', 'Kazakhstan', 'Romania', 'Peru', 'Morocco', 'Algeria', 
        'Ethiopia', 'Kenya', 'Afghanistan', 'Armenia', 'Belarus', 'Bolivia', 
        'Bosnia and Herzegovina', 'Botswana', 'Bulgaria', 'Croatia', 'New Zealand',
        'Hungary', 'Jordan', 'Lebanon', 'Lithuania', 'Madagascar', 'Moldova', 
        'Republic of Serbia', 'Slovakia', 'Slovenia', 'United Republic of Tanzania', 'Uganda', 'Uzbekistan', 
        'Zambia', 'Zimbabwe', 'Malawi', 'Rwanda', 'Paraguay', 'Swaziland', 'Estonia',
        'Czech Republic', 'Iceland', 'Montenegro', 'Panama', 'Latvia','Singapore',
        'Mozambique', 'Bangladesh', 'Philippines', 'South Sudan', 'Uruguay', 'Israel'
    ],
    hard: [
        'Tunisia', 'Cambodia', 'Laos', 'Nepal', 'Mongolia', 
        'Qatar', 'Kuwait', 'Bahrain', 'Bhutan', 'Brunei', 
        'Djibouti', 'Burundi', 'Saint Kitts and Nevis', 'Dominica', 
        'Saint Lucia', 'Grenada', 'Barbados', 'Antigua and Barbuda', 
        'Malta', 'Liechtenstein', 'Andorra', 'Monaco', 'San Marino', 
        'Benin', 'Cape Verde', 'Chad', 'Equatorial Guinea', 'Luxembourg',
        'Eritrea', 'Gabon', 'Gambia', 'Guinea', 'Guinea-Bissau', 'Jamaica',
        'Liberia', 'Maldives', 'Mauritania', 'Guatemala',
        'Mauritius', 'Namibia', 'Papua New Guinea', 'Solomon Islands', 
        'Suriname', 'Tajikistan', 'Togo', 'Honduras', 'Haiti', 'Ecuador',
        'Trinidad and Tobago', 'Turkmenistan', 'Vanuatu', 'Lesotho', 
        'Swaziland'
    ],
    ultra: [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
        'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
        'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
        'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
        'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
        'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
         'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
        'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
        'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
        'Eritrea', 'Swaziland', 'Ethiopia', 'Finland', 'France',
        'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
        'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
        'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
        'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
        'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
        'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
        'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
        'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco',
        'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
         'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
        'Nigeria', 'North Korea', 'Macedonia', 'Norway', 'Oman', 'Pakistan',
         'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
        'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
        'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
        'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
        'Republic of Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
        'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
        'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
        'Taiwan', 'Tajikistan', 'United Republic of Tanzania', 'Thailand', 'Togo',
        'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
        'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 
        'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu',
        'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
    ]
        };

        const difficultyZoom = {
            easy: 2,
            normal: 3,
            hard: 3,
            ultra: 2
        };

        const errorMessages = [
            "Bruh... That ain't it! 🤦‍♂️",
            "Task failed successfully! 😅",
            "Nope! Keep trying bestie! 💅",
            "Emotional Damage! Wrong answer! 😭",
            "Geography has left the chat ❌",
            "404: Correct Answer Not Found 🔍",
            "Plot twist: That's the wrong country! 🌪️",
            "Oof! Not even close! 🙈",
            "Mission failed, we'll get 'em next time! 🎮",
            "Wrong answers only challenge? 🤔",
            "Close... but not close enough! 🌍",  
            "Oops, you just invented a new country! 🗺️",  
            "Try again, cartographer-in-training! 🧭",  
            "Geography gods are not impressed. 😔",  
            "That's not even in the same hemisphere! 🌐",  
            "If guessing was a sport, you'd be benched! 🏀",  
            "Nope. But hey, points for confidence! 👍",  
            "Almost... just kidding, not even close! 😂",  
            "Looks like your compass is broken! 🧭",  
            "Wrong! But your effort is... noticeable! 🤔",  
            "You're making the map blush! 😳",  
            "History books won't remember this guess. 📖",  
            "Did you just close your eyes and pick one? 🎯",  
            "Somewhere in another timeline, thats right! 🕰️",  
            "Try harder, globe trotter! 🌎" 
        ];

        const successMessages = [
            "Let's gooooo! 🚀",
            "Geography Master has entered the chat! 🎓",
            "You're just built different! 💪",
            "Absolutely cracked at geography! 🔥",
            "W rizz on the geography game! 👑",
            "No cap, that's correct! 🎯",
            "Sheeeesh! You nailed it! ✨",
            "Main character energy right there!",
            "Certified geography moment! 📍",
            "You're dropped this 👑",
            "Youre on fire! 🔥",  
            "World traveler vibes! ✈️",  
            "You ate that map up! 🗺️✨",  
            "Big brain energy right here! 🧠💡",  
            "Thats a dub for the geography squad! 🏆",  
            "Geography genius spotted! 👀",  
            "King/Queen of the map! 👑",  
            "Absolutely goated with the globe! 🐐🌍",  
            "Legend behavior unlocked! 💯",  
            "Geography got nothing on you! 😎",  
            "Straight to the point, like a compass! 🧭",  
            "Chefs kiss for that answer! 👌🍴",  
            "World domination starts here! 🌐",  
            "Certified cartographer moment! 📜",  
            "Youre mapping out greatness! 🗺️"  
        ];

        const streakMessages = {
            milestone: [
                "🔥 ON FIRE! STREAK OF",
                "⚡ UNSTOPPABLE! STREAK OF",
                "⚡LEGENDARY! STREAK OF",
                "👑 DOMINATING! STREAK OF",
                "🌟 INCREDIBLE! STREAK OF"
            ],
            gameOver: [
                "Streak Ended! Final Count:",
                "The Streak is Over! You reached:",
                "Amazing Run! Final Streak:",
                "What a Streak! Final Count:",
                "Impressive! Final Streak:"
            ]
        };

        // Update the countryHints with more countries
        const countryHints = {
            'Afghanistan': [
        'Home to the ancient city of Herat',
        'Famous for the Taliban and conflicts in the 21st century',
        'Rugged mountainous terrain, including the Hindu Kush',
        'Famous figures: Ahmad Shah Durrani, Malala Yousafzai'
    ],
    'Albania': [
        'Known for its beautiful coastline on the Adriatic Sea',
        'Famous for the city of Berat, known as the "city of a thousand windows"',
        'Famous figures: Mother Teresa (born in Albania), Enver Hoxha'
    ],
    'Algeria': [
        'The largest country in Africa',
        'Home to the Sahara Desert',
        'Famous figures: Albert Camus, Houari Boumédiene'
    ],
    'Andorra': [
        'A small country nestled in the Pyrenees mountains',
        'Famous for its ski resorts and duty-free shopping',
        'Known for being a co-principality with France and Spain'
    ],
    'Angola': [
        'Famous for its oil reserves',
        'Home to the Angolan Civil War (1975-2002)',
        'Famous figures: Agostinho Neto, Eduardo dos Santos'
    ],
    'Antigua and Barbuda': [
        'Famous for its pristine beaches and resorts',
        'Home to Nelsons Dockyard, a UNESCO World Heritage site',
        'Known for being a popular cruise ship destination'
    ],
    'Argentina': [
        'Home to the famous tango dance',
        'Famous for its beef, wine, and Patagonia region',
        'Famous figures: Diego Maradona, Lionel Messi, Eva Perón'
    ],
    'Armenia': [
        'One of the worlds first Christian nations',
        'Smallest country in Caucasus, famous for genocides, and diasporas',
        'Famous figures: Serj Tankian, Hovhannes Shiraz'
    ],
    'Australia': [
        'Famous for the Great Barrier Reef and unique wildlife like kangaroos and koalas',
        'Home to iconic landmarks like the Sydney Opera House and Uluru',
        'Famous figures: Steve Irwin, Cate Blanchett, Hugh Jackman'
    ],
    'Austria': [
        'Known for classical music, particularly composers like Mozart and Beethoven',
        'Famous for skiing in the Alps and the city of Vienna',
        'Famous figures: Wolfgang Amadeus Mozart, Sigmund Freud'
    ],
    'Azerbaijan': [
        'Famous for its rich history in the Caucasus region',
        'Home to the Caspian Sea and beautiful landscapes',
        'Famous figures: Heydar Aliyev, Garry Kasparov, Lotfi A. Zadeh, Teimour Radjabov'
    ],
    'Bahamas': [
        'Famous for its pristine beaches and crystal-clear waters',
        'A popular destination for tourists and cruise ships',
        'Famous figures: Sidney Poitier, Shontelle'
    ],
    'Bahrain': [
        'A small island country in the Persian Gulf',
        'Famous for its Formula 1 Grand Prix',
        'Famous figures: Hamad bin Isa Al Khalifa'
    ],
    'Bangladesh': [
        'Home to the Sundarbans, the largest mangrove forest in the world',
        'Known for its textile industry and vibrant culture',
        'Famous figures: Sheikh Mujibur Rahman, Muhammad Yunus'
    ],
    'Barbados': [
        'Famous for its sugar cane industry and rum production',
        'Home to beautiful beaches and coral reefs',
        'Famous figures: Rihanna, Sir Garfield Sobers'
    ],
    'Belarus': [
        'Known for its rich history of Soviet influence',
        'Home to the Brest Fortress, a symbol of World War II',
        'Famous figures: Svetlana Alexievich, Alexander Lukashenko'
    ],
    'Belgium': [
        'Famous for its chocolates, waffles, and beer',
        'Known for medieval towns, castles, and the city of Brussels',
        'Famous figures: Audrey Hepburn, Jean-Claude Van Damme'
    ],
    'Belize': [
        'Home to the Great Blue Hole, a popular diving destination',
        'Known for its ancient Mayan ruins',
        'Famous figures: Jade McCulloch, George Price'
    ],
    'Benin': [
        'Famous for its history as the birthplace of the voodoo religion',
        'Home to the Royal Palaces of Abomey, a UNESCO World Heritage site',
        'Famous figures: Mathieu Kérékou, Wally Seck'
    ],
    'Bhutan': [
        'Known for its unique measure of happiness called Gross National Happiness',
        'Famous for the Paro Taktsang monastery',
        'Famous figures: Jigme Singye Wangchuck, Tshering Tobgay'
    ],
    'Bolivia': [
        'Home to the Salar de Uyuni, the worlds largest salt flat',
        'Known for its indigenous cultures and political history',
        'Famous figures: Evo Morales, Túpac Katari'
    ],
    'Bosnia and Herzegovina': [
        'Known for its war history during the 1990s',
        'Famous for the old town of Mostar and its iconic bridge',
        'Famous figures: Goran Višnjić, Edin Džeko'
    ],
    'Botswana': [
        'Home to the Okavango Delta, a UNESCO World Heritage site',
        'Famous for its wildlife and safari tourism',
        'Famous figures: Desmond Tutu, Seretse Khama'
    ],
    'Brazil': [
        'Home to the Amazon Rainforest',
        'Famous for Carnival, soccer, and samba music',
        'Famous figures: Pelé, Neymar, Carmen Miranda'
    ],
    'Brunei': [
        'A small, wealthy nation on the island of Borneo',
        'Known for its vast oil reserves and luxury lifestyle',
        'Famous figures: Sultan Hassanal Bolkiah'
    ],
    'Bulgaria': [
        'Known for its ancient ruins, like those in Plovdiv',
        'Famous for its roses, which are used to make rose oil',
        'Famous figures: Hristo Stoichkov, Vasil Levski'
    ],
    'Burkina Faso': [
        'Known for its cultural festivals, like FESPACO (film festival)',
        'Famous for its music scene, including Afrobeat',
        'Famous figures: Thomas Sankara, Rasmane Ouedraogo'
    ],
    'Burundi': [
        'Famous for its mountainous terrain and Lake Tanganyika',
        'Known for its tea and coffee industries',
        'Famous figures: Pierre Nkurunziza, Melchior Ndadaye'
    ],
    'Cabo Verde': [
        'An archipelago off the coast of West Africa',
        'Known for its Creole culture and music, especially morna',
        'Famous figures: Cesária Évora, Amílcar Cabral'
    ],
    'Cambodia': [
        'Home to the ancient temple complex of Angkor Wat',
        'Known for its tragic history under the Khmer Rouge regime',
        'Famous figures: Pol Pot, Norodom Sihamoni'
    ],
    'Cameroon': [
        'Known for its diverse culture and languages',
        'Home to Mount Cameroon, the highest peak in West Africa',
        'Famous figures: Samuel Etoo, Paul Biya'
    ],
    'Canada': [
        'Known for its natural beauty, including Niagara Falls and the Rocky Mountains',
        'Famous for its multiculturalism and the CN Tower',
        'Famous figures: Justin Trudeau, Celine Dion, Drake'
    ],
    'Central African Republic': [
        'Famous for its wildlife, including the Dzanga-Sangha National Park',
        'Has faced political instability and civil war',
        'Famous figures: François Bozizé, Catherine Samba-Panza'
    ],
    'Chad': [
        'Known for its vast deserts and Lake Chad',
        'Famous for its cultural diversity and wildlife',
        'Famous figures: Idriss Déby, Hissène Habré'
    ],
    'Chile': [
        'Home to the Atacama Desert, one of the driest places on Earth',
        'Known for the Andes mountains and Easter Island',
        'Famous figures: Pablo Neruda, Augusto Pinochet'
    ],
    'China': [
        'Home to the Great Wall of China',
        'The world\'s most populous country',
        'Known for pandas and traditional tea culture',
        'Famous figures: Confucius, Mao Zedong, Jackie Chan'
    ],
    'Colombia': [
        'Known for its coffee and beautiful beaches on both the Pacific and Caribbean coasts',
        'Home to the Andes mountains and the Amazon rainforest',
        'Famous figures: Shakira, Gabriel García Márquez, Juan Gabriel'
    ],
    'Costa Rica': [
        'Known for its biodiversity and eco-tourism',
        'Home to volcanoes and national parks',
        'Famous figures: Óscar Arias, Franklin Chang-Díaz'
    ],
    'Croatia': [
        'Famous for its stunning coastline along the Adriatic Sea',
        'Home to the historic city of Dubrovnik',
        'Famous figures: Nikola Tesla, Marin Čilić'
    ],
    'Cuba': [
        'Known for its revolutionary history and the Cuban Missile Crisis',
        'Famous for its cigars, music (salsa), and vintage cars',
        'Famous figures: Fidel Castro, Che Guevara, Gloria Estefan'
    ],
    'Cyprus': [
        'An island nation in the Mediterranean Sea',
        'Known for its ancient ruins and archaeological sites',
        'Famous figures: Archimedes, Glafcos Clerides'
    ],
    'Czech Republic': [
        'Home to the historic city of Prague, known for its medieval architecture',
        'Famous for its beer and glass-making industry',
        'Famous figures: Václav Havel, Antonín Dvořák'
    ],
    'Democratic Republic of the Congo': [
        'Home to the Congo River and vast rainforests',
        'Known for its mineral resources and historical conflicts',
        'Famous figures: Patrice Lumumba, Joseph Kabila'
    ],
    'Denmark': [
        'Known for its strong welfare state and happiness index',
        'Home to iconic landmarks like the Little Mermaid statue',
        'Famous figures: Hans Christian Andersen, Søren Kierkegaard'
    ],
    'Djibouti': [
        'A small country in the Horn of Africa, known for its strategic location near the Red Sea',
        'Famous for its salt flats and the Lake Assal',
        'Famous figures: Ismaïl Omar Guelleh, Hassan Gouled Aptidon'
    ],
    'Dominica': [
        'An island known for its rainforests and volcanic mountains',
        'Home to the Boiling Lake, the second-largest fumarole in the world',
        'Famous figures: Roosevelt Skerrit, Dominica Jackson'
    ],
    'Dominican Republic': [
        'Famous for its beautiful beaches and all-inclusive resorts',
        'Home to the oldest European cathedral in the Americas, in Santo Domingo',
        'Famous figures: Juan Pablo Duarte, Oscar de la Renta'
    ],
    'Ecuador': [
        'Known for its biodiversity, the Galápagos Islands, and Amazon Rainforest',
        'Home to the Equator line, where the country gets its name',
        'Famous figures: Rafael Correa, Oswaldo Guayasamín'
    ],
    'Egypt': [
        'Famous for its ancient pyramids and Sphinx',
        'The Nile River runs through this country',
        'Home to the ancient Pharaohs',
        'Famous figures: Cleopatra, Tutankhamun, Naguib Mahfouz'
    ],
    'El Salvador': [
        'Known for its volcanic landscape and coffee production',
        'Famous for its beaches and surf spots along the Pacific Ocean',
        'Famous figures: Óscar Romero, Nayib Bukele'
    ],
    'Equatorial Guinea': [
        'An island nation off the coast of Central Africa',
        'Known for its oil reserves and economic wealth',
        'Famous figures: Teodoro Obiang, Francisco Macías Nguema'
    ],
    'Eritrea': [
        'Located in the Horn of Africa, bordering the Red Sea',
        'Known for its history of conflict with Ethiopia',
        'Famous figures: Isaias Afwerki, Haile Selassie'
    ],
    'Estonia': [
        'Known for its advanced digital society and e-residency program',
        'Famous for its medieval old town of Tallinn',
        'Famous figures: Jaan Kross, Arvo Pärt'
    ],
    'Swaziland': [
        'Known for its monarchy and rich cultural traditions',
        'Famous for its national parks and wildlife, including rhinos',
        'Famous figures: King Mswati III'
    ],
    'Ethiopia': [
        'Home to ancient civilizations, including the Kingdom of Aksum',
        'Known for its coffee, which is believed to have originated here',
        'Famous figures: Haile Selassie, Abiy Ahmed'
    ],
    'Finland': [
        'Known for its saunas and Northern Lights',
        'Famous for its education system and high quality of life',
        'Famous figures: Sanna Marin, Jean Sibelius'
    ],
    'France': [
        'Home to iconic landmarks like the Eiffel Tower and the Louvre Museum',
        'Famous for its cuisine, fashion, and wine',
        'Famous figures: Napoleon Bonaparte, Marie Curie, Claude Monet'
    ],
    'Gabon': [
        'Known for its lush rainforests and wildlife, including gorillas',
        'Home to beautiful beaches and the largest national park in Africa',
        'Famous figures: Omar Bongo, Ali Bongo Ondimba'
    ],
    'Gambia': [
        'A small country in West Africa, known for its beaches and wildlife',
        'Home to the Gambia River, a key landmark',
        'Famous figures: Yahya Jammeh, Ousman Sillah'
    ],
    'Georgia': [
        'Known for its wine-making history and the Caucasus Mountains',
        'Home to one of the worlds oldest wine-making regions',
        'Famous figures: Joseph Stalin, Nino Katamadze'
    ],
    'Germany': [
        'Home to iconic landmarks like the Brandenburg Gate and Neuschwanstein Castle',
        'Famous for its beer, sausages, and automobiles (Mercedes, BMW)',
        'Famous figures: Albert Einstein, Ludwig van Beethoven, Angela Merkel'
    ],
    'Ghana': [
        'Known for its rich gold resources and colorful culture',
        'Famous for its historic slave forts and independence movement',
        'Famous figures: Kwame Nkrumah, Kofi Annan'
    ],
    'Greece': [
        'Home to the ancient ruins of Athens and the Acropolis',
        'Known for its rich mythology and beautiful islands like Santorini',
        'Famous figures: Alexander the Great, Socrates, Maria Callas'
    ],
    'Grenada': [
        'Known as the "Island of Spice" for its production of nutmeg',
        'Home to beautiful beaches and the Grand Anse Beach',
        'Famous figures: Maurice Bishop, Kirani James'
    ],
    'Guatemala': [
        'Home to ancient Mayan ruins, including Tikal',
        'Known for its coffee and vibrant indigenous culture',
        'Famous figures: Rigoberta Menchú, Juan José Arévalo'
    ],
    'Guinea': [
        'Known for its rich natural resources, including bauxite and gold',
        'Famous for its diverse ethnic groups and culture',
        'Famous figures: Sekou Touré, Alpha Condé'
    ],
    'Guinea-Bissau': [
        'A small country in West Africa known for its wildlife and tropical beaches',
        'Famous for its groundnut (peanut) exports',
        'Famous figures: Amílcar Cabral, José Mário Vaz'
    ],
    'Guyana': [
        'Known for its diverse ethnic groups and Amazon rainforest',
        'Famous for its gold, sugar, and rice exports',
        'Famous figures: Cheddi Jagan, Janet Jagan'
    ],
    'Haiti': [
        'The first independent nation in Latin America and the Caribbean',
        'Known for its rich cultural history and art',
        'Famous figures: Toussaint Louverture, Jean-Bertrand Aristide'
    ],
    'Honduras': [
        'Known for its Mayan ruins, including Copán',
        'Home to beautiful beaches and the Bay Islands',
        'Famous figures: Juan Orlando Hernández, Rigoberto Urán'
    ],
    'Hungary': [
        'Famous for its architecture, including the Buda Castle and Parliament Building',
        'Known for its folk music, paprika, and thermal baths',
        'Famous figures: Franz Liszt, László Nemes'
    ],
    'Iceland': [
        'Known for its stunning landscapes, including glaciers, volcanoes, and geysers',
        'Famous for its geothermal energy and eco-friendly practices',
        'Famous figures: Björk, Halldór Laxness'
    ],
    'India': [
        'Famous for its rich history, including the Taj Mahal and ancient temples',
        'Known for its diverse cultures, languages, and cuisine',
        'Famous figures: Mahatma Gandhi, Indira Gandhi, Sachin Tendulkar'
    ],
    'Indonesia': [
        'Home to thousands of islands, including Bali and Java',
        'Known for its biodiversity, including endangered species like the orangutan',
        'Famous figures: Sukarno, B.J. Habibie, Anggun'
    ],
    'Iran': [
        'Known for its ancient civilization, including Persepolis',
        'Famous for its rich cultural heritage, including poetry and Persian carpets',
        'Famous figures: Cyrus the Great, Mohammad Reza Pahlavi, Shirin Ebadi'
    ],
    'Iraq': [
        'Known for its ancient Mesopotamian civilization and the Tigris-Euphrates river system',
        'Home to ancient ruins, including Babylon and Nineveh',
        'Famous figures: Saddam Hussein, Nuri al-Maliki'
    ],
    'Ireland': [
        'Known for its lush green landscapes and rich cultural heritage',
        'Famous for its traditional music, literature, and Irish whiskey',
        'Famous figures: James Joyce, W.B. Yeats, Conor McGregor'
    ],
    'Israel': [
        'Known for its religious significance to Judaism, Christianity, and Islam',
        'Home to the Dead Sea, the Sea of Galilee, and the city of Jerusalem',
        'Famous figures: David Ben-Gurion, Golda Meir, Shimon Peres'
    ],
    'Italy': [
        'Famous for its art, architecture, and cuisine (pizza, pasta)',
        'Home to the Vatican City, the Colosseum, and the Leaning Tower of Pisa',
        'Famous figures: Leonardo da Vinci, Michelangelo, Sophia Loren'
    ],
    'Jamaica': [
        'Known for its reggae music and famous musicians like Bob Marley',
        'Famous for its beautiful beaches and resorts',
        'Famous figures: Bob Marley, Usain Bolt, Marcus Garvey'
    ],
    'Japan': [
        'Known for its advanced technology, cherry blossoms, and Mount Fuji',
        'Famous for its cuisine, including sushi, and traditional tea ceremonies',
        'Famous figures: Haruki Murakami, Akira Kurosawa, Shigeru Miyamoto'
    ],
    'Jordan': [
        'Home to the ancient city of Petra, a UNESCO World Heritage site',
        'Known for the Dead Sea, the lowest point on Earth',
        'Famous figures: King Hussein, Queen Rania, Zaha Hadid'
    ],
    'Kazakhstan': [
        'Known for its vast steppe and the spaceport of Baikonur',
        'Famous for its nomadic traditions and the countrys rich mineral resources',
        'Famous figures: Nursultan Nazarbayev, Gennady Golovkin'
    ],
    'Kenya': [
        'Famous for its safaris and wildlife, including the "Big Five" animals',
        'Known for its long-distance runners and athletics',
        'Famous figures: Jomo Kenyatta, Wangari Maathai, Eliud Kipchoge'
    ],
    'Kuwait': [
        'Famous for its oil reserves and modern skyline',
        'Home to the Kuwait Towers and a rich cultural history',
        'Famous figures: Sheikh Sabah Al-Ahmad Al-Jaber Al-Sabah, Nasser Al-Dosari'
    ],
    'Kyrgyzstan': [
        'Known for its mountainous landscapes and nomadic heritage',
        'Famous for the Issyk-Kul lake and Tien Shan mountains',
        'Famous figures: Askar Akayev, Chinghiz Aitmatov'
    ],
    'Laos': [
        'Famous for its Buddhist temples and natural beauty, including waterfalls',
        'Home to the UNESCO World Heritage site of Luang Prabang',
        'Famous figures: Kaysone Phomvihane, Thongsing Thammavong'
    ],
    'Latvia': [
        'Known for its beautiful landscapes, including beaches and forests',
        'Famous for its art nouveau architecture in Riga',
        'Famous figures: Arvīds Žukausks, Maris Štrombergs'
    ],
    'Lebanon': [
        'Famous for its rich cultural heritage and ancient ruins like Baalbek',
        'Known for its Mediterranean beaches, wine, and cuisine',
        'Famous figures: Khalil Gibran, Fairuz, Rami Makhlouf'
    ],
    'Lesotho': [
        'Known as the "Kingdom in the Sky" due to its high altitude',
        'Famous for its unique culture and colorful handicrafts',
        'Famous figures: King Letsie III, Nehemiah Sekhonyana'
    ],
    'Liberia': [
        'The first African country to declare independence',
        'Known for its tropical forests and wildlife',
        'Famous figures: Ellen Johnson Sirleaf, George Weah'
    ],
    'Libya': [
        'Known for its ancient Roman ruins, including Sabratha and Leptis Magna',
        'Home to the Sahara Desert and the Mediterranean coast',
        'Famous figures: Muammar Gaddafi, Fathi Terbil'
    ],
    'Liechtenstein': [
        'A small, landlocked country known for its mountainous landscapes',
        'Famous for its status as a tax haven and financial services industry',
        'Famous figures: Prince Hans-Adam II, Alois, Hereditary Prince of Liechtenstein'
    ],
    'Lithuania': [
        'Famous for its medieval history and beautiful capital, Vilnius',
        'Known for its rich traditions in basketball',
        'Famous figures: Dainius Šuliauskas, Antanas Smetona'
    ],
    'Luxembourg': [
        'A small, wealthy country known for its banking and finance sectors',
        'Home to medieval castles and stunning forests',
        'Famous figures: Jean-Claude Juncker, Henri, Grand Duke of Luxembourg'
    ],
    'Madagascar': [
        'Famous for its unique biodiversity and wildlife, including lemurs',
        'Home to the Avenue of the Baobabs and tropical rainforests',
        'Famous figures: Marc Ravalomanana, Andry Rajoelina'
    ],
    'Malawi': [
        'Known for Lake Malawi, one of the largest lakes in Africa',
        'Famous for its diverse wildlife and national parks',
        'Famous figures: Hastings Banda, Joyce Banda'
    ],
    'Malaysia': [
        'Famous for its mix of Malay, Chinese, and Indian cultures',
        'Known for its stunning islands, including Langkawi and Penang',
        'Famous figures: Mahathir Mohamad, Anwar Ibrahim'
    ],
    'Maldives': [
        'Known for its overwater bungalows and coral reefs',
        'Famous for being a popular luxury tourist destination',
        'Famous figures: Mohamed Nasheed, Maumoon Abdul Gayoom'
    ],
    'Mali': [
        'Famous for its rich history, including the ancient city of Timbuktu',
        'Known for its music, especially the desert blues genre',
        'Famous figures: Amadou Toumani Touré, Salif Keita'
    ],
    'Malta': [
        'Known for its ancient architecture, including the Megalithic Temples',
        'Famous for its strategic location in the Mediterranean Sea',
        'Famous figures: Dom Mintoff, George Cross'
    ],
    'Mauritania': [
        'Known for its desert landscapes, including the Sahara',
        'Famous for its nomadic culture and salt mines',
        'Famous figures: Moktar Ould Daddah, Aziz Abdelaziz'
    ],
    'Mauritius': [
        'Famous for its tropical climate, beaches, and diverse wildlife',
        'Known for the extinct dodo bird, once native to the island',
        'Famous figures: Sir Seewoosagur Ramgoolam, Anerood Jugnauth'
    ],
    'Mexico': [
        'Famous for its rich history, including ancient Mayan and Aztec cultures',
        'Known for its vibrant food, including tacos, guacamole, and tequila',
        'Famous figures: Frida Kahlo, Diego Rivera, Carlos Slim'
    ],
    'Moldova': [
        'Famous for its vineyards and wine production',
        'Known for its rich history of Soviet influence',
        'Famous figures: Nicolae Ceaușescu, Igor Dodon'
    ],
    'Monaco': [
        'A small, wealthy country known for its luxurious casinos and yachts',
        'Famous for hosting the Monaco Grand Prix and its royal family',
        'Famous figures: Grace Kelly, Prince Albert II'
    ],
    'Mongolia': [
        'Known for its vast steppes, nomadic traditions, and the Gobi Desert',
        'Famous for its historical figures like Genghis Khan',
        'Famous figures: Tsakhiagiin Elbegdorj, Munkhbat'
    ],
    'Montenegro': [
        'Known for its stunning Adriatic coastline and historic cities',
        'Famous for its mountainous landscapes and medieval towns',
        'Famous figures: Milo Đukanović, Duško Ivanović'
    ],
    'Morocco': [
        'Known for its beautiful cities like Marrakesh, Casablanca, and Fes',
        'Famous for its cuisine, including couscous and tagine',
        'Famous figures: King Mohammed VI, Ibn Battuta'
    ],
    'Mozambique': [
        'Famous for its Indian Ocean coastline and pristine beaches',
        'Known for its natural resources, including coal and natural gas',
        'Famous figures: Samora Machel, Graça Machel'
    ],
    'Myanmar': [
        'Known for its ancient temples, including those in Bagan',
        'Famous for its long political struggle and military dictatorship',
        'Famous figures: Aung San Suu Kyi, General Ne Win'
    ],
    'Namibia': [
        'Famous for its stunning desert landscapes, including the Namib Desert',
        'Known for wildlife safaris and the Etosha National Park',
        'Famous figures: Sam Nujoma, Hifikepunye Pohamba'
    ],
    'Nepal': [
        'Known for the Himalayas, including Mount Everest, the worlds highest peak',
        'Famous for its Buddhist heritage, including the city of Lumbini, Buddhas birthplace',
        'Famous figures: Sir Edmund Hillary, Tenzing Norgay, Sushil Koirala'
    ],
    'Netherlands': [
        'Famous for its windmills, tulip fields, and canals',
        'Known for being one of the most bike-friendly countries in the world',
        'Famous figures: Anne Frank, Vincent van Gogh, Marco van Basten'
    ],
    'New Zealand': [
        'Known for its beautiful landscapes and adventure tourism',
        'Famous for being the filming location for the *Lord of the Rings* series',
        'Famous figures: Sir Edmund Hillary, Peter Jackson, Jacinda Ardern'
    ],
    'Nicaragua': [
        'Known for its volcanoes, lakes, and colonial architecture',
        'Famous for its historical struggle for political independence',
        'Famous figures: Daniel Ortega, Violeta Chamorro'
    ],
    'Niger': [
        'Famous for its vast Sahara Desert landscapes',
        'Known for the Aïr Mountains and ancient trade routes',
        'Famous figures: Mahamadou Issoufou, Seyni Oumarou'
    ],
    'Nigeria': [
        'Known for its diverse ethnic groups and the bustling city of Lagos',
        'Famous for its film industry, Nollywood',
        'Famous figures: Chinua Achebe, Wole Soyinka, Muhammadu Buhari'
    ],
    'North Korea': [
        'Known for its authoritarian regime and secrecy',
        'Famous for its military parades and the Kim family dictatorship',
        'Famous figures: Kim Il-sung, Kim Jong-il, Kim Jong-un'
    ],
    'Macedonia': [
        'Known for its rich history and ancient ruins, including those in Ohrid',
        'Famous for its diverse mix of ethnic groups and languages',
        'Famous figures: Mother Teresa, Boris Trajkovski'
    ],
    'Norway': [
        'Known for its dramatic fjords and coastal beauty',
        'Famous for its Viking heritage and royal family',
        'Famous figures: Henrik Ibsen, Edvard Munch, Roald Amundsen'
    ],
    'Oman': [
        'Known for its deserts, beaches, and historic forts',
        'Famous for its culture of hospitality and traditional architecture',
        'Famous figures: Sultan Qaboos bin Said'
    ],
    'Pakistan': [
        'Known for its diverse landscapes, including the Himalayas and the Thar Desert',
        'Famous for its rich history, including the Indus Valley Civilization',
        'Famous figures: Malala Yousafzai, Imran Khan, Abdul Sattar Edhi'
    ],
    'Palestine': [
        'Known for its historical and religious significance, including Jerusalem',
        'Famous for the ongoing Israeli-Palestinian conflict',
        'Famous figures: Yasser Arafat, Mahmoud Abbas'
    ],
    'Panama': [
        'Known for the Panama Canal, a crucial shipping route',
        'Famous for its tropical rainforests and biodiversity',
        'Famous figures: Omar Torrijos, Ricardo Martinelli'
    ],
    'Papua New Guinea': [
        'Known for its diverse languages and indigenous cultures',
        'Famous for its coral reefs and biodiversity in the Pacific Ocean',
        'Famous figures: Michael Somare, Sam Basil'
    ],
    'Paraguay': [
        'Known for its rivers, such as the Paraná and Paraguay Rivers',
        'Famous for its Guarani culture and language',
        'Famous figures: Alfredo Stroessner, Mario Abdo Benítez'
    ],
    'Peru': [
        'Famous for the ancient Inca city of Machu Picchu',
        'Known for its rich cultural heritage and diverse landscapes',
        'Famous figures: Mario Vargas Llosa, César Vallejo, Ollanta Humala'
    ],
    'Philippines': [
        'Known for its beautiful beaches, including Boracay and Palawan',
        'Famous for its vibrant culture, music, and festivals',
        'Famous figures: José Rizal, Ferdinand Marcos, Manny Pacquiao'
    ],
    'Poland': [
        'Known for its historical sites like Auschwitz and the Wawel Castle',
        'Famous for its contributions to science, including Marie Curie',
        'Famous figures: Lech Walesa, Andrzej Wajda, Wisława Szymborska'
    ],
    'Portugal': [
        'Famous for its rich history of exploration, including Vasco da Gama',
        'Known for its beautiful coastline and beaches',
        'Famous figures: Cristiano Ronaldo, Fernando Pessoa, Amália Rodrigues'
    ],
    'Qatar': [
        'Known for its wealth, particularly from oil and natural gas',
        'Famous for hosting the 2022 FIFA World Cup',
        'Famous figures: Tamim bin Hamad Al Thani'
    ],
    'Romania': [
        'Known for its castles, including Bran Castle, associated with Dracula',
        'Famous for the Carpathian Mountains and the Danube River',
        'Famous figures: Nadia Comăneci, Vlad the Impaler, George Enescu'
    ],
    'Russia': [
        'The world\'s largest country by area, spanning Europe and Asia',
        'Known for its rich cultural heritage, including literature and ballet',
        'Famous figures: Leo Tolstoy, Pyotr Ilyich Tchaikovsky, Vladimir Putin'
    ],
    'Rwanda': [
        'Known for its breathtaking landscapes, including volcanoes and lakes',
        'Famous for its tragic 1994 genocide and subsequent recovery',
        'Famous figures: Paul Kagame, Dian Fossey'
    ],
    'Saint Kitts and Nevis': [
        'Known as the smallest country in the Western Hemisphere by land area',
        'Famous for its sugar plantations and the scenic St. Kitts mountain',
        'Famous figures: Timothy Harris, Vance Amory'
    ],
    'Saint Lucia': [
        'Famous for its twin volcanic mountains, the Pitons',
        'Known for its tropical rainforests and luxury tourism',
        'Famous figures: Derek Walcott, Kenny Anthony'
    ],
    'Saint Vincent and the Grenadines': [
        'Known for its beautiful beaches and islands',
        'Famous for its volcano, La Soufrière',
        'Famous figures: Ralph Gonsalves'
    ],
    'Samoa': [
        'Known for its Polynesian culture and stunning beaches',
        'Famous for its traditional tattoo art and the fiafia night',
        'Famous figures: David Tua, Tuilaepa Aiono Sailele Malielegaoi'
    ],
    'San Marino': [
        'One of the world\'s smallest countries, surrounded by Italy',
        'Known for its medieval architecture and ancient history',
        'Famous figures: Federico Cini, Giovanni Francesco'
    ],
    'Sao Tome and Principe': [
        'Famous for its cocoa production and tropical rainforests',
        'Known for its volcanic landscapes and pristine beaches',
        'Famous figures: Evaristo Carvalho'
    ],
    'Saudi Arabia': [
        'Known for being the birthplace of Islam and housing Mecca and Medina',
        'Famous for its oil wealth and the ongoing modernization under Vision 2030',
        'Famous figures: King Salman, Mohammed bin Salman'
    ],
    'Senegal': [
        'Known for its vibrant culture, music (like mbalax), and art',
        'Famous for the historical slave port of Gorée Island',
        'Famous figures: Leopold Sedar Senghor, Youssou N\'Dour'
    ],
    'Republic of Serbia': [
        'Known for its historic fortresses, including Kalemegdan',
        'Famous for its vibrant music and cultural festivals',
        'Famous figures: Novak Djokovic, Nikola Tesla'
    ],
    'Sierra Leone': [
        'Famous for its beautiful beaches and rich cultural heritage',
        'Known for its diamond mines and history of civil conflict',
        'Famous figures: Ernest Bai Koroma, Mohamed Kallon'
    ],
    'Singapore': [
        'Known for its impressive skyline, including the Marina Bay Sands',
        'Famous for its strict laws and cleanliness',
        'Famous figures: Lee Kuan Yew, Joseph Schooling'
    ],
    'Slovakia': [
        'Known for its medieval towns, castles, and the Tatra Mountains',
        'Famous for its folk music and traditional crafts',
        'Famous figures: Milan Kňažko, Rudolf Vrba'
    ],
    'Slovenia': [
        'Famous for its beautiful lakes, including Lake Bled',
        'Known for its caves, like the Postojna Cave',
        'Famous figures: Melania Trump, Primož Roglič'
    ],
    'Solomon Islands': [
        'Known for its WWII history, especially the Battle of Guadalcanal',
        'Famous for its beautiful beaches and coral reefs',
        'Famous figures: Sir Frank Kabui'
    ],
    'Somalia': [
        'Known for its long coastline along the Horn of Africa',
        'Famous for its rich oral tradition and poetry',
        'Famous figures: Mohamed Siad Barre, Nuruddin Farah'
    ],
    'South Africa': [
        'Known for its diverse culture, wildlife, and history of apartheid',
        'Famous for landmarks like Table Mountain and Kruger National Park',
        'Famous figures: Nelson Mandela, Desmond Tutu, Charlize Theron'
    ],
    'South Korea': [
        'Known for its technology companies like Samsung and LG',
        'Famous for its K-pop music industry and global influence',
        'Famous figures: Psy, BTS, Park Geun-hye'
    ],
    'South Sudan': [
        'The worlds newest country, gaining independence in 2011',
        'Known for its diverse ethnic groups and civil conflict',
        'Famous figures: Salva Kiir Mayardit'
    ],
    'Spain': [
        'Known for its rich history, art, and flamenco dance',
        'Famous for landmarks like La Sagrada Familia and Alhambra',
        'Famous figures: Pablo Picasso, Salvador Dalí, Rafael Nadal'
    ],
    'Sri Lanka': [
        'Known for its beautiful beaches and tea plantations',
        'Famous for its Buddhist temples and cultural festivals',
        'Famous figures: Kumar Sangakkara, Muttiah Muralitharan'
    ],
    'Sudan': [
        'Known for its ancient pyramids in Meroë',
        'Famous for its role in African history and the Nile River',
        'Famous figures: Omar al-Bashir, Abiy Ahmed'
    ],
    'Suriname': [
        'Known for its vast rainforests and wildlife',
        'Famous for its Dutch colonial architecture',
        'Famous figures: Dési Bouterse, Rudi Krol'
    ],
    'Sweden': [
        'Known for its beautiful landscapes, including the Northern Lights',
        'Famous for its Viking history and modern welfare state',
        'Famous figures: Greta Garbo, Alfred Nobel, ABBA'
    ],
    'Switzerland': [
        'Famous for its neutrality in global conflicts',
        'Known for its alpine landscapes and luxury watches',
        'Famous figures: Albert Einstein, Jean-Jacques Rousseau'
    ],
    'Syria': [
        'Known for its rich ancient history, including the ruins of Palmyra',
        'Famous for its ongoing civil war and humanitarian crisis',
        'Famous figures: Bashar al-Assad, Omar Mukhtar'
    ],
    'Taiwan': [
        'Known for its advanced technology industry and electronics',
        'Famous for its bustling capital, Taipei, and its night markets',
        'Famous figures: Tsai Ing-wen, Ang Lee'
    ],
    'Tajikistan': [
        'Known for its mountainous terrain and the Pamir Mountains',
        'Famous for its Soviet-era history and cultural diversity',
        'Famous figures: Emomali Rahmon'
    ],
    'United Republic of Tanzania': [
        'Known for the Serengeti National Park and Mount Kilimanjaro',
        'Famous for its wildlife and cultural diversity',
        'Famous figures: Julius Nyerere, Ali Hassan Mwinyi'
    ],
    'Thailand': [
        'Known for its beautiful beaches, temples, and cuisine',
        'Famous for its vibrant culture, including Muay Thai',
        'Famous figures: King Bhumibol Adulyadej, Somtow Sucharitkul'
    ],
    'Togo': [
        'Known for its palm-lined beaches and Togo Mountains',
        'Famous for its rich culture and history of French colonial rule',
        'Famous figures: Gnassingbé Eyadéma, Emmanuelle Gattuso'
    ],
    'Trinidad and Tobago': [
        'Known for its vibrant Carnival celebration',
        'Famous for its rich cultural diversity, especially Afro-Caribbean culture',
        'Famous figures: Brian Lara, Nicki Minaj, Michael Lee-Chin'
    ],
    'Tunisia': [
        'Known for its ancient ruins, including Carthage',
        'Famous for its Mediterranean beaches and rich history',
        'Famous figures: Habib Bourguiba, Zine El Abidine Ben Ali'
    ],
    'Turkey': [
        'Famous for its rich history as the center of the Ottoman Empire',
        'Known for landmarks like Hagia Sophia and the Blue Mosque, plus Tea, Coffee, Doner, Baklava and Cats',
        'Famous figures: Mustafa Kemal Atatürk, Orhan Pamuk, Hidayet Turkoglu'
    ],
    'Turkmenistan': [
        'Known for its vast deserts, especially the Karakum Desert',
        'Famous for the Door to Hell, a natural gas field that has been burning for decades',
        'Famous figures: Gurbanguly Berdimuhamedow'
    ],
    'Tuvalu': [
        'Known for being one of the smallest and least populated countries in the world',
        'Famous for its low-lying islands and vulnerability to climate change',
        'Famous figures: Enele Sopoaga'
    ],
    'Uganda': [
        'Known for its diverse wildlife, including mountain gorillas',
        'Famous for its rich culture and music',
        'Famous figures: Yoweri Museveni, Idi Amin'
    ],
    'Ukraine': [
        'Known for its rich cultural heritage and history',
        'Famous for its agricultural products, especially wheat and sunflower oil',
        'Famous figures: Volodymyr Zelenskyy, Andriy Shevchenko'
    ],
    'United Arab Emirates': [
        'Known for its modern architecture, especially in Dubai',
        'Famous for the Burj Khalifa, the tallest building in the world',
        'Famous figures: Mohammed bin Zayed, Sheikh Zayed'
    ],
    'United Kingdom': [
        'Known for its monarchy and historic landmarks like Buckingham Palace',
        'Famous for cultural contributions in music, literature, and art',
        'Famous figures: Queen Elizabeth II, William Shakespeare, Winston Churchill'
    ],
    'United States of America': [
        'Known for its global influence, especially in politics, economy, and culture',
        'Famous for landmarks like the Statue of Liberty and the White House',
        'Famous figures: George Washington, Abraham Lincoln, Martin Luther King Jr., Michael Jackson'
    ],
    'Uruguay': [
        'Known for its beautiful beaches along the Atlantic coast',
        'Famous for its strong soccer culture and being the first World Cup winners',
        'Famous figures: José Mujica, Diego Forlán'
    ],
    'Uzbekistan': [
        'Known for its rich history as a part of the Silk Road',
        'Famous for landmarks like Registan Square in Samarkand',
        'Famous figures: Islam Karimov, Mirza Ulugh Beg'
    ],
    'Vanuatu': [
        'Known for its volcanic landscapes and coral reefs',
        'Famous for its indigenous Melanesian culture',
        'Famous figures: Joe Natuman, Maxime Carlot Korman'
    ],
    'Venezuela': [
        'Known for its vast oil reserves and political instability',
        'Famous for Angel Falls, the worlds tallest uninterrupted waterfall',
        'Famous figures: Hugo Chávez, Simón Bolívar'
    ],
    'Vietnam': [
        'Known for its beautiful landscapes, including Ha Long Bay',
        'Famous for its role in the Vietnam War and its communist government',
        'Famous figures: Ho Chi Minh, Võ Nguyên Giáp'
    ],
    'Yemen': [
        'Known for its ancient cities, including Sanaa, a UNESCO World Heritage site',
        'Famous for its coffee and rich cultural history',
        'Famous figures: Ali Abdullah Saleh, Abdul-Malik al-Houthi'
    ],
    'Zambia': [
        'Known for its natural beauty, including Victoria Falls',
        'Famous for its rich wildlife and national parks',
        'Famous figures: Kenneth Kaunda, Michael Sata'
    ],
    'Zimbabwe': [
        'Known for its rich mineral resources and stunning landscapes',
        'Famous for the Great Zimbabwe Ruins and Victoria Falls',
        'Famous figures: Robert Mugabe, Morgan Tsvangirai'
    ]
    
        };

        const countryPopulation = {
            'Afghanistan': 42425231,
            'Albania': 2793376,
            'Algeria': 44915829,
            'Andorra': 78014,
            'Angola': 37725288,
            'Argentina': 46692187,
            'Armenia': 2962826,
            'Australia': 26604858,
            'Austria': 8982800,
            'Azerbaijan': 10478448,
            'Bahrain': 1785708,
            'Bangladesh': 174477133,
            'Barbados': 287437,
            'Belarus': 9440871,
            'Belgium': 11725356,
            'Belize': 448709,
            'Benin': 14207254,
            'Bhutan': 782604,
            'Bolivia': 12439623,
            'Bosnia and Herzegovina': 3220218,
            'Botswana': 2528500,
            'Brazil': 216675162,
            'Bulgaria': 6600807,
            'Burkina Faso': 24578410,
            'Burundi': 14717896,
            'Cambodia': 17891990,
            'Cameroon': 29392771,
            'Canada': 39575468,
            'Central African Republic': 5976234,
            'Chad': 18473481,
            'Chile': 20247451,
            'China': 1418657325,
            'Colombia': 53212670,
            'Comoros': 939482,
            'Costa Rica': 5257876,
            'Croatia': 3885487,
            'Cuba': 11167269,
            'Cyprus': 1314390,
            'Czech Republic': 10505811,
            'Democratic Republic of the Congo': 108528197,
            'Denmark': 5949286,
            'Djibouti': 1122478,
            'Dominican Republic': 11466721,
            'Ecuador': 18851258,
            'Egypt': 111442535,
            'El Salvador': 6406269,
            'Eritrea': 3761165,
            'Estonia': 1321590,
            'Swaziland': 1185428,
            'Ethiopia': 130236667,
            'Finland': 5551253,
            'France': 65416725,
            'Gabon': 2591648,
            'Gambia': 2786063,
            'Georgia': 3681528,
            'Germany': 83517045,
            'Ghana': 34872130,
            'Greece': 10289579,
            'Grenada': 125438,
            'Guatemala': 19405999,
            'Haiti': 11914522,
            'Honduras': 10814260,
            'Hungary': 9953618,
            'Iceland': 388813,
            'India': 1439370078,
            'Indonesia': 282169816,
            'Iran': 89366453,
            'Iraq': 47593846,
            'Ireland': 5099941,
            'Israel': 9357362,
            'Italy': 58766729,
            'Jamaica': 2935293,
            'Japan': 123694815,
            'Jordan': 11403986,
            'Kazakhstan': 19827515,
            'Kenya': 55336216,
            'Kiribati': 126868,
            'Kuwait': 4923091,
            'Kyrgyzstan': 6754562,
            'Laos': 8048478,
            'Latvia': 1790193,
            'Lebanon': 5723349,
            'Lesotho': 2334010,
            'Liberia': 5738082,
            'Libya': 7384455,
            'Liechtenstein': 39489,
            'Lithuania': 2744392,
            'Luxembourg': 655514,
            'Madagascar': 31880597,
            'Malawi': 22841859,
            'Malaysia': 35015315,
            'Maldives': 540985,
            'Mali': 25789848,
            'Mexico': 131912888,
            'Micronesia': 113787,
            'Moldova': 2562645,
            'Monaco': 39457,
            'Mongolia': 3563072,
            'Morocco': 38189942,
            'Mozambique': 36445264,
            'Myanmar': 55598285,
            'Namibia': 2598204,
            'Nepal': 32349214,
            'Netherlands': 17938973,
            'New Zealand': 5287951,
            'Nicaragua': 7188706,
            'Niger': 27343815,
            'Nigeria': 230567170,
            'North Korea': 26206547,
            'North Macedonia': 2040821,
            'Norway': 5487397,
            'Oman': 4737598,
            'Pakistan': 248282750,
            'Palestine': 5301188,
            'Panama': 4748271,
            'Papua New Guinea': 10612470,
            'Paraguay': 7639649,
            'Peru': 35151733,
            'Philippines': 119900391,
            'Poland': 37714693,
            'Portugal': 10295933,
            'Qatar': 2959207,
            'Romania': 19007863,
            'Russia': 143426940,
            'Rwanda': 14282383,
            'Saudi Arabia': 37326935,
            'Senegal': 18430415,
            'Republic of Serbia': 6811459,
            'Singapore': 5880400,
            'Slovakia': 5442540,
            'Slovenia': 2091514,
            'Somalia': 18057805,
            'South Africa': 60882505,
            'South Korea': 51796406,
            'South Sudan': 13237840,
            'Spain': 47872250,
            'Sri Lanka': 22033458,
            'Sudan': 48275874,
            'Sweden': 10633032,
            'Switzerland': 8901447,
            'Syria': 23474132,
            'Taiwan': 23780300,
            'Tajikistan': 10586249,
            'United Republic of Tanzania': 67892972,
            'Thailand': 70136567,
            'Tunisia': 12681833,
            'Turkey': 85768238,
            'Turkmenistan': 6643693,
            'Ukraine': 35117334,
            'United Arab Emirates': 10174677,
            'United Kingdom': 67604873,
            'United States of America': 335749859,
            'Uruguay': 3540362,
            'Uzbekistan': 36632428,
            'Venezuela': 33185634,
            'Vietnam': 100206289,
            'Yemen': 35117335,
            'Zambia': 20609156,
            'Zimbabwe': 17100789
        };
        // Add this near the top with other global variables
        let secretCodes = {
            'christmas': () => {
                // Check if Christmas theme is already active
                if (isChristmasActive) {
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = "🎄 Christmas theme is already active! 🎅";
                    messageContainer.className = 'error-message';
                    messageContainer.style.opacity = '1';
                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                    }, 2000);
                    return;
                }

                // Set the flag to true
                isChristmasActive = true;

                // Add Christmas theme class to body
                document.body.classList.add('christmas-theme');

                // Create containers and elements
                const containers = {
                    snowContainer: document.createElement('div'),
                    santa: document.createElement('div'),
                    background: document.createElement('div'),
                    lights: document.createElement('div'),
                    trail: document.createElement('div')
                };

                // Initialize all elements
                // Snow container
                containers.snowContainer.id = 'snow-container';
                containers.snowContainer.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1000;
                `;

                // Santa
                containers.santa.id = 'santa';
                containers.santa.innerHTML = '🎅';
                containers.santa.style.cssText = `
                    position: fixed;
                    font-size: 50px;
                    top: 20px;
                    left: -50px;
                    z-index: 1001;
                    animation: santaFly 15s linear infinite;
                `;

                // Background
                containers.background.id = 'christmas-bg';
                containers.background.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(229, 115, 115, 0.2), rgba(129, 199, 132, 0.2));
                    pointer-events: none;
                    z-index: -1;
                `;

                // Trail container
                containers.trail.id = 'mouse-trail';
                containers.trail.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1001;
                `;

                // Add all containers to body
                Object.values(containers).forEach(container => {
                    document.body.appendChild(container);
                });

                // Add styles
                const styles = {
                    cursor: document.createElement('style'),
                    christmas: document.createElement('style')
                };

                // Cursor style
                styles.cursor.id = 'christmas-cursor';
                styles.cursor.textContent = `
                    * {
                        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" style="fill: red;"><text y="16" font-size="16">🎄</text></svg>'), auto !important;
                    }

                    .trail-dot {
                        position: fixed;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #66BB6A;
                        pointer-events: none;
                        z-index: 1003;
                        opacity: 0.4;
                        transition: all 0.2s ease;
                    }

                    .christmas-light {
                        position: relative;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        margin: 5px;
                        animation: lightGlow 1s infinite alternate;
                    }

                    .christmas-light::after {
                        content: '';
                        position: absolute;
                        width: 2px;
                        height: 10px;
                        background: #2c3e50;
                        top: -8px;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                `;

                // Christmas style
                styles.christmas.id = 'christmas-style';
                styles.christmas.textContent = `
                    @keyframes santaFly {
                        0% { left: -50px; transform: translateY(0); }
                        50% { transform: translateY(20px); }
                        100% { left: 100vw; transform: translateY(0); }
                    }

                    @keyframes fall {
                        0% { transform: translateY(0) rotate(0deg); }
                        100% { transform: translateY(100vh) rotate(360deg); }
                    }

                    @keyframes lightGlow {
                        0% { opacity: 0.4; transform: scale(0.8); }
                        100% { opacity: 1; transform: scale(1); }
                    }

                    .christmas-theme #message-container {
                        background: #E1BEE7 !important;
                    }

                    .christmas-theme .game-btn:hover {
                        background: #EF9A9A !important;
                        transform: scale(1.05);
                    }
                `;

                // Add styles to head
                Object.values(styles).forEach(style => {
                    document.head.appendChild(style);
                });

                // Initialize Christmas lights
                containers.lights.id = 'christmas-lights';
                containers.lights.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 30px;
                    z-index: 1002;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 10px;
                    pointer-events: none;
                `;

                // Create lights
                for (let i = 0; i < 20; i++) {
                    const light = document.createElement('div');
                    light.className = 'christmas-light';
                    light.style.cssText = `
                        animation-delay: ${Math.random() * 1}s;
                        background: ${['#66BB6A', '#F44336', '#66BB6A', '#F44336'][i % 4]};
                    `;
                    containers.lights.appendChild(light);
                }
                document.body.appendChild(containers.lights);

                // Initialize animations and intervals
                const intervals = {
                    snow: null,
                    trail: null
                };

                // Mouse trail variables
                const dots = [];
                let mouseX = 0;
                let mouseY = 0;

                // Mouse trail handler
                function handleMouseMove(e) {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    
                    const dot = document.createElement('div');
                    dot.className = 'trail-dot';
                    dot.style.left = mouseX + 'px';
                    dot.style.top = mouseY + 'px';
                    containers.trail.appendChild(dot);
                    
                    dots.push({
                        element: dot,
                        alpha: 1
                    });

                    if (dots.length > 20) {
                        const oldDot = dots.shift();
                        oldDot.element.remove();
                    }
                }

                // Add mouse trail
                document.addEventListener('mousemove', handleMouseMove);

                // Trail animation
                intervals.trail = setInterval(() => {
                    dots.forEach((dot, index) => {
                        dot.alpha *= 0.9;
                        dot.element.style.opacity = dot.alpha;
                        if (dot.alpha < 0.1) {
                            dot.element.remove();
                            dots.splice(index, 1);
                        }
                    });
                }, 30);

                // Define the createSnowflake function before it's used
                function createSnowflake() {
                    const snowflake = document.createElement('div');
                    snowflake.innerHTML = '❄';
                    snowflake.style.cssText = `
                        position: fixed;
                        color: white;
                        font-size: ${Math.random() * 20 + 10}px;
                        opacity: ${Math.random() * 0.8 + 0.2};
                        left: ${Math.random() * 100}vw;
                        top: -20px;
                        animation: fall ${Math.random() * 3 + 2}s linear forwards;
                        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                        pointer-events: none;
                        z-index: 1000;
                    `;
                    return snowflake;
                }

                // Ensure this function is defined before this block
                intervals.snow = setInterval(() => {
                    const snowflake = createSnowflake();
                    containers.snowContainer.appendChild(snowflake);
                    setTimeout(() => snowflake.remove(), 5000);
                }, 50);

                // Show success message
                const messageContainer = document.getElementById('message-container');
                messageContainer.textContent = "🎄 Merry Christmas! Ho Ho Ho! 🎅";
                messageContainer.className = 'success-message';
                messageContainer.style.opacity = '1';
                setTimeout(() => {
                    messageContainer.style.opacity = '0';
                }, 2000);

                // Cleanup function
                const cleanup = () => {
                    Object.values(intervals).forEach(interval => {
                        if (interval) clearInterval(interval);
                    });
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.body.classList.remove('christmas-theme');
                    [...Object.values(containers), ...Object.values(styles)].forEach(el => {
                        if (el && el.parentNode) el.parentNode.removeChild(el);
                    });
                    document.querySelectorAll('.game-btn').forEach(btn => {
                        btn.style.background = '';
                        btn.style.boxShadow = '';
                    });
                };

                // Set cleanup timeout
                setTimeout(cleanup, 60000);

                // Add Christmas GIF and message
                const christmasMessage = document.createElement('div');
                christmasMessage.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.95);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    z-index: 1004;
                    animation: fadeInOut 5s forwards;
                `;

                christmasMessage.innerHTML = `
                    <h2 style="color: #c62828; margin-bottom: 15px; font-family: 'Inter', sans-serif;">
                         Wishing you all a magical year ahead! 🎄
                    </h2>
                    <p style="color: #000000; margin-bottom: 20px; font-family: 'Inter', sans-serif;">
                        May your adventures in geography be filled with endless joy and exciting discoveries! 🌍✨
                    </p>
                    <div class="tenor-gif-embed" data-postid="24569905" data-share-method="host" data-aspect-ratio="1.78771" data-width="100%">
                        <a href="https://tenor.com/view/bastones-de-caramelo-papaleta-un-show-mas-%C3%A1rbol-de-navidad-candy-canes-gif-24569905">
                            Bastones De Caramelo Papaleta GIF
                        </a>
                    </div>
                `;

                document.body.appendChild(christmasMessage);

                // Add Tenor script
                const tenorScript = document.createElement('script');
                tenorScript.type = 'text/javascript';
                tenorScript.src = 'https://tenor.com/embed.js';
                tenorScript.async = true;
                document.body.appendChild(tenorScript);

                // Add animation for the message
                const messageAnimation = document.createElement('style');
                messageAnimation.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    }
                `;
                document.head.appendChild(messageAnimation);

                // Remove message after animation
                setTimeout(() => {
                    christmasMessage.remove();
                    messageAnimation.remove();
                    tenorScript.remove();
                }, 10000);

                // Add message and animation cleanup to the cleanup function
                const originalCleanup = cleanup;
                cleanup = () => {
                    originalCleanup();
                    isChristmasActive = false;  // Reset the flag when cleanup happens
                    if (christmasMessage.parentNode) christmasMessage.remove();
                    if (messageAnimation.parentNode) messageAnimation.remove();
                    if (tenorScript.parentNode) tenorScript.remove();
                };
            },

            'mordecai': () => {
                // Skip current country in hints mode
                if (gameMode === 'hints') {
                    showMessage(true);
                    currentScore += 1;
                    document.getElementById('current-score').textContent = currentScore;
                    startNewRound();
                }
            },
            'odyssey': () => {
                // Check if targetCountry is set
                if (targetCountry) {
                    geojsonLayer.eachLayer(function(layer) {
                        const countryName = layer.feature.properties.ADMIN;

                        // Check if the current layer matches the target country
                        if (countryName === targetCountry) {
                            layer.setStyle({
                                fillColor: '#f1c40f',
                                fillOpacity: 0.6
                            });

                            // Reset the style after 2 seconds
                            setTimeout(() => {
                                layer.setStyle({
                                    fillColor: '#95a5a6',
                                    fillOpacity: 0.2
                                });
                            }, 2000);
                        }
                    });
                }
            },
            'imranli': () => {
                // Add 30 seconds in time mode
                if (gameMode === 'time' && timeLeft > 0) {
                    timeLeft += 30;
                    updateTimer();
                    showMessage(true);
                }
            },
            'geosong': () => {
                // Create and show music player
                const playerHtml = `
                    <div id="audio-container" style="display: none;">
                        <audio id="audio-player">
                            <source src="music1.mp3" type="audio/mp3">
                            <source src="music2.mp3" type="audio/mp3">
                            <source src="music3.mp3" type="audio/mp3">
                            <source src="music4.mp3" type="audio/mp3">
                            <source src="music5.mp3" type="audio/mp3">
                        </audio>
                    </div>
                    <div id="music-player" style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); 
                        background: rgba(33, 33, 33, 0.95); padding: 15px 20px; border-radius: 15px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 1000; width: 600px; 
                        font-family: Inter, sans-serif; color: white; transition: all 0.3s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 16px; color: #fff;">
                                <svg style="width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;" viewBox="0 0 24 24" fill="none" stroke="#64B5F6">
                                    <path d="M9 18V5l12-2v13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="6" cy="18" r="3" stroke-width="2"/>
                                    <circle cx="21" cy="16" r="3" stroke-width="2"/>
                                </svg>
                                GeoSongs - CountryOdyssey Radio
                            </h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button id="minimize-btn" onclick="toggleMinimize()" style="background: none; border: none; cursor: pointer; 
                                    font-size: 18px; color: #64B5F6; padding: 5px; transition: transform 0.3s ease;">
                                    <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M19 13H5v-2h14v2z" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                                <button onclick="closePlayer()" style="background: none; border: none; cursor: pointer; 
                                    font-size: 18px; color: #64B5F6; padding: 5px;">
                                    <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div id="player-content" style="transition: all 0.3s ease; overflow: hidden;">
                            <select id="song-select" onchange="changeSong()" 
                                style="width: 100%; margin: 10px 0; padding: 6px; border-radius: 8px; 
                                background: #333; color: white; border: 1px solid #444;">
                                <option value="music1.mp3">Chill Lofi</option>
                                <option value="music2.mp3">Upbeat Study</option>
                                <option value="music3.mp3">Ambient Focus</option>
                                <option value="music4.mp3">Jazz Cafe</option>
                                <option value="music5.mp3">Spaghetti</option>
                            </select>
                            
                            <div style="margin: 10px 0;">
                                <input type="range" id="duration-slider" min="0" value="0" step="1" 
                                    style="width: 100%; margin: 5px 0; accent-color: #64B5F6; height: 4px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                                    <span id="current-time">0:00</span>
                                    <span id="total-duration">0:00</span>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: center; gap: 30px; margin: 10px 0;">
                                <button onclick="previousSong()" style="background: none; border: none; color: #64B5F6; 
                                    cursor: pointer;">
                                    <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button id="play-pause-btn" onclick="togglePlay()" style="background: none; border: none; 
                                    color: #64B5F6; cursor: pointer;">
                                    <svg style="width: 28px; height: 28px;" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" id="play-icon"/>
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" id="pause-icon" style="display: none;"/>
                                    </svg>
                                </button>
                                <button onclick="nextSong()" style="background: none; border: none; color: #64B5F6; 
                                    cursor: pointer;">
                                    <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                            </div>

                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="#64B5F6">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                                </svg>
                                <input type="range" id="volume-control" min="0" max="1" step="0.1" value="0.5" 
                                    style="width: 80px; accent-color: #64B5F6; height: 3px;" onchange="updateVolume(this.value)">
                                <span id="volume-label" style="color: #888; font-size: 11px;">50%</span>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing player if present
                const existingPlayer = document.getElementById('music-player');
                if (existingPlayer) {
                    existingPlayer.remove();
                }

                // Add player to document
                document.body.insertAdjacentHTML('beforeend', playerHtml);

                // Initialize audio player
                const audio = document.getElementById('audio-player');
                const durationSlider = document.getElementById('duration-slider');
                audio.volume = 0.5;

                // Define all functions in the global scope
                window.closePlayer = function() {
                    const player = document.getElementById('music-player');
                    const audioContainer = document.getElementById('audio-container');
                    if (player && audioContainer) {
                        audio.pause();
                        player.remove();
                        audioContainer.remove();
                    }
                };

                window.changeSong = function() {
                    const select = document.getElementById('song-select');
                    audio.src = select.value;
                    audio.play().then(() => {
                        const playIcon = document.querySelector('#play-icon');
                        const pauseIcon = document.querySelector('#pause-icon');
                        if (playIcon && pauseIcon) {
                            playIcon.style.display = 'none';
                            pauseIcon.style.display = 'block';
                        }
                    }).catch(error => console.error('Error playing audio:', error));
                };

                window.togglePlay = function() {
                    const playIcon = document.querySelector('#play-icon');
                    const pauseIcon = document.querySelector('#pause-icon');
                    
                    if (audio.paused) {
                        audio.play().then(() => {
                            if (playIcon && pauseIcon) {
                                playIcon.style.display = 'none';
                                pauseIcon.style.display = 'block';
                            }
                        }).catch(error => console.error('Error playing audio:', error));
                    } else {
                        audio.pause();
                        if (playIcon && pauseIcon) {
                            playIcon.style.display = 'block';
                            pauseIcon.style.display = 'none';
                        }
                    }
                };

                window.previousSong = function() {
                    const select = document.getElementById('song-select');
                    const currentIndex = select.selectedIndex;
                    select.selectedIndex = currentIndex > 0 ? currentIndex - 1 : select.options.length - 1;
                    changeSong();
                };

                window.nextSong = function() {
                    const select = document.getElementById('song-select');
                    const currentIndex = select.selectedIndex;
                    select.selectedIndex = currentIndex < select.options.length - 1 ? currentIndex + 1 : 0;
                    changeSong();
                };

                window.updateVolume = function(value) {
                    const label = document.getElementById('volume-label');
                    if (audio && label) {
                        audio.volume = value;
                        label.textContent = `${Math.round(value * 100)}%`;
                    }
                };

                window.toggleMinimize = function() {
                    const player = document.getElementById('music-player');
                    const content = document.getElementById('player-content');
                    const minimizeBtn = document.getElementById('minimize-btn');
                    const isMinimized = content.style.maxHeight === '0px';

                    if (!isMinimized) {
                        content.style.maxHeight = '0px';
                        content.style.marginTop = '0px';
                        minimizeBtn.style.transform = 'rotate(180deg)';
                        player.style.background = 'rgba(33, 33, 33, 0.85)';
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        content.style.marginTop = '15px';
                        minimizeBtn.style.transform = 'rotate(0deg)';
                        player.style.background = 'rgba(33, 33, 33, 0.95)';
                    }
                };

                // Add event listeners
                audio.addEventListener('timeupdate', function() {
                    const durationSlider = document.getElementById('duration-slider');
                    const currentTimeSpan = document.getElementById('current-time');
                    if (durationSlider && currentTimeSpan) {
                        durationSlider.value = audio.currentTime;
                        currentTimeSpan.textContent = formatTime(audio.currentTime);
                    }
                });

                audio.addEventListener('loadedmetadata', function() {
                    const durationSlider = document.getElementById('duration-slider');
                    const totalDurationSpan = document.getElementById('total-duration');
                    if (durationSlider && totalDurationSpan) {
                        durationSlider.max = audio.duration;
                        totalDurationSpan.textContent = formatTime(audio.duration);
                    }
                });

                durationSlider.addEventListener('input', function() {
                    if (audio) {
                        audio.currentTime = this.value;
                    }
                });

                // Initialize content height
                setTimeout(() => {
                    const content = document.getElementById('player-content');
                    if (content) {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        content.style.marginTop = '15px';
                    }
                }, 0);

                // Helper function to format time
                function formatTime(seconds) {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = Math.floor(seconds % 60);
                    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                }
            },

            'focus': () => {
                // Function to get random video path
                const getRandomVideo = () => {
                    const vimeoVideos = [
                        'https://player.vimeo.com/video/1043404435?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043404500?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043404570?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043404671?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043404779?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043404901?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043405009?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043405104?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043405264?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043405401?autoplay=1&loop=1&background=1&muted=1',
                        'https://player.vimeo.com/video/1043405565?autoplay=1&loop=1&background=1&muted=1'
                    ];
                    return vimeoVideos[Math.floor(Math.random() * vimeoVideos.length)];
                };

                // Function to make element draggable
                const makeDraggable = (element) => {
                    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                    const dragTab = document.createElement('div');
                    dragTab.style.cssText = `
                        width: 100%;
                        height: 30px;
                        background: rgba(0, 0, 0, 0.7);
                        cursor: move;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                        user-select: none;
                        border-radius: 10px 10px 0 0;
                    `;
                    dragTab.innerHTML = '⋮⋮ Drag to move';

                    dragTab.onmousedown = dragMouseDown;

                    function dragMouseDown(e) {
                        e = e || window.event;
                        e.preventDefault();
                        // get the mouse cursor position at startup
                        pos3 = e.clientX;
                        pos4 = e.clientY;
                        document.onmouseup = closeDragElement;
                        // call a function whenever the cursor moves
                        document.onmousemove = elementDrag;
                    }

                    function elementDrag(e) {
                        e = e || window.event;
                        e.preventDefault();
                        // calculate the new cursor position
                        pos1 = pos3 - e.clientX;
                        pos2 = pos4 - e.clientY;
                        pos3 = e.clientX;
                        pos4 = e.clientY;
                        // set the element's new position
                        const newTop = element.offsetTop - pos2;
                        const newLeft = element.offsetLeft - pos1;
                        
                        // Keep the element within viewport bounds
                        const maxX = window.innerWidth - element.offsetWidth;
                        const maxY = window.innerHeight - element.offsetHeight;
                        
                        element.style.top = `${Math.min(Math.max(0, newTop), maxY)}px`;
                        element.style.left = `${Math.min(Math.max(0, newLeft), maxX)}px`;
                    }

                    function closeDragElement() {
                        // stop moving when mouse button is released
                        document.onmouseup = null;
                        document.onmousemove = null;
                    }

                    // Insert drag tab at the beginning of the container
                    element.insertBefore(dragTab, element.firstChild);
                };

                // Check if video containers already exist
                let leftVideo = document.getElementById('left-video-container');
                let rightVideo = document.getElementById('right-video-container');
                
                // Create video containers if they don't exist
                if (!leftVideo) {
                    leftVideo = document.createElement('div');
                    leftVideo.id = 'left-video-container';
                    leftVideo.style.cssText = `
                        position: fixed;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 270px;
                        height: 510px;
                        z-index: 999;
                        display: none;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        background: black;
                    `;
                    
                    // Create close button for left video
                    const leftCloseBtn = document.createElement('button');
                    leftCloseBtn.style.cssText = `
                        position: absolute;
                        top: 40px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.5);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        transition: background 0.3s;
                    `;
                    leftCloseBtn.innerHTML = '×';
                    leftCloseBtn.onclick = () => leftVideo.style.display = 'none';
                    leftCloseBtn.onmouseover = () => leftCloseBtn.style.background = 'rgba(0, 0, 0, 0.8)';
                    leftCloseBtn.onmouseout = () => leftCloseBtn.style.background = 'rgba(0, 0, 0, 0.5)';
                    
                    const leftVideoFrame = document.createElement('iframe');
                    leftVideoFrame.id = 'left-video';
                    leftVideoFrame.src = getRandomVideo();
                    leftVideoFrame.style.cssText = `
                        width: 100%;
                        height: calc(100% - 30px);
                        border: none;
                        pointer-events: none;
                    `;
                    leftVideoFrame.allow = "autoplay; fullscreen; picture-in-picture";
                    leftVideoFrame.setAttribute('frameborder', '0');
                    leftVideoFrame.setAttribute('webkitallowfullscreen', 'true');
                    leftVideoFrame.setAttribute('mozallowfullscreen', 'true');
                    leftVideoFrame.setAttribute('allowfullscreen', 'true');
                    
                    leftVideo.appendChild(leftVideoFrame);
                    leftVideo.appendChild(leftCloseBtn);
                    document.body.appendChild(leftVideo);
                    makeDraggable(leftVideo);
                }
                
                if (!rightVideo) {
                    rightVideo = document.createElement('div');
                    rightVideo.id = 'right-video-container';
                    rightVideo.style.cssText = `
                        position: fixed;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 270px;
                        height: 510px;
                        z-index: 999;
                        display: none;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        background: black;
                    `;
                    
                    // Create close button for right video
                    const rightCloseBtn = document.createElement('button');
                    rightCloseBtn.style.cssText = `
                        position: absolute;
                        top: 40px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.5);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        transition: background 0.3s;
                    `;
                    rightCloseBtn.innerHTML = '×';
                    rightCloseBtn.onclick = () => rightVideo.style.display = 'none';
                    rightCloseBtn.onmouseover = () => rightCloseBtn.style.background = 'rgba(0, 0, 0, 0.8)';
                    rightCloseBtn.onmouseout = () => rightCloseBtn.style.background = 'rgba(0, 0, 0, 0.5)';
                    
                    const rightVideoFrame = document.createElement('iframe');
                    rightVideoFrame.id = 'right-video';
                    rightVideoFrame.src = getRandomVideo();
                    rightVideoFrame.style.cssText = `
                        width: 100%;
                        height: calc(100% - 30px);
                        border: none;
                        pointer-events: none;
                    `;
                    rightVideoFrame.allow = "autoplay; fullscreen; picture-in-picture";
                    rightVideoFrame.setAttribute('frameborder', '0');
                    rightVideoFrame.setAttribute('webkitallowfullscreen', 'true');
                    rightVideoFrame.setAttribute('mozallowfullscreen', 'true');
                    rightVideoFrame.setAttribute('allowfullscreen', 'true');
                    
                    rightVideo.appendChild(rightVideoFrame);
                    rightVideo.appendChild(rightCloseBtn);
                    document.body.appendChild(rightVideo);
                    makeDraggable(rightVideo);
                }
                
                // Toggle video display
                if (leftVideo.style.display === 'none' || leftVideo.style.display === '') {
                    // Get two different random videos
                    const video1 = getRandomVideo();
                    let video2;
                    do {
                        video2 = getRandomVideo();
                    } while (video2 === video1);

                    // Update video sources when showing
                    document.getElementById('left-video').src = video1;
                    document.getElementById('right-video').src = video2;
                    
                    // Reset positions when showing
                    leftVideo.style.transform = 'none';
                    rightVideo.style.transform = 'none';
                    leftVideo.style.top = '100px';
                    rightVideo.style.top = '100px';
                    leftVideo.style.left = '20px';
                    rightVideo.style.right = '20px';
                    
                    leftVideo.style.display = 'block';
                    rightVideo.style.display = 'block';
                } else {
                    hideVideos();
                }
            }
        };

        // Add this function near other utility functions
        function hideVideos() {
            const leftVideo = document.getElementById('left-video-container');
            const rightVideo = document.getElementById('right-video-container');
            
            if (leftVideo) leftVideo.style.display = 'none';
            if (rightVideo) rightVideo.style.display = 'none';
            
            // Update src to stop videos
            const leftVideoFrame = document.getElementById('left-video');
            const rightVideoFrame = document.getElementById('right-video');
            if (leftVideoFrame) leftVideoFrame.src = '';
            if (rightVideoFrame) rightVideoFrame.src = '';
        }

        // Add this code to handle secret code detection
        let currentCode = '';
        let codeTimeout;

        document.addEventListener('keydown', (e) => {
            // Only track alphabetical keys
            if (/^[a-zA-Z]$/.test(e.key)) {
                currentCode += e.key.toLowerCase();
                
                // Check if any secret code matches
                Object.keys(secretCodes).forEach(code => {
                    if (currentCode.endsWith(code)) {
                        secretCodes[code]();
                        // Flash effect on successful code
                        document.body.style.backgroundColor = '#f0f0f0';
                        setTimeout(() => {
                            document.body.style.backgroundColor = '';
                        }, 200);
                    }
                });
                
                // Reset after 2 seconds of no input
                clearTimeout(codeTimeout);
                codeTimeout = setTimeout(() => {
                    currentCode = '';
                }, 2000);
            }
        });

        // Add this function at the top level, with other global functions
        function resetMapColors() {
            if (geojsonLayer) {
                geojsonLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        fillColor: '#95a5a6',
                        fillOpacity: 0.2,
                        weight: 1,
                        opacity: 1,
                        color: '#2c3e50'
                    });
                });
            }
        }

        // Modify the initMap function
        function initMap() {
            map = L.map('map-container', {
                zoomControl: true,
                minZoom: 2,
                maxZoom: 8,
                worldCopyJump: true
            }).setView([20, 0], difficultyZoom[difficulty]);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB'
            }).addTo(map);

            // Add reset button to map
            const resetButton = L.control({position: 'topright'});
            resetButton.onAdd = function(map) {
                const btn = L.DomUtil.create('button', 'reset-map-btn');
                btn.innerHTML = '';
                
                // Prevent the click from propagating to the map
                L.DomEvent.disableClickPropagation(btn);
                
                btn.addEventListener('click', function() {
                    resetMapColors();
                });
                
                return btn;
            };
            resetButton.addTo(map);

            fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
                .then(response => response.json())
                .then(data => {
                    geojsonLayer = L.geoJSON(data, {
                        style: function(feature) {
                            return {
                                fillColor: '#95a5a6',
                                weight: 1,
                                opacity: 1,
                                color: '#2c3e50',
                                fillOpacity: 0.2
                            };
                        }
                    }).addTo(map);

                    geojsonLayer.eachLayer(function(layer) {
                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: countryClick
                        });
                    });

                    // Only start new round after geojsonLayer is initialized
                    if (gameMode === 'population') {
                        startNewRound();
                    }
                })
                .catch(error => console.error('Error loading GeoJSON:', error));

            startNewRound();
        }

        function countryClick(e) {
            if (!isGameActive) return;
            
            const layer = e.target;
            const clickedCountry = layer.feature.properties.ADMIN;
            
            if (gameMode === 'population') {
                // Don't allow clicking on already found countries
                if (foundCountries.has(clickedCountry)) return;
                
                const clickedPopulation = countryPopulation[clickedCountry];
                let isCorrect = false;

                if (comparisonType === 'more') {
                    isCorrect = clickedPopulation > referencePopulation;
                } else {
                    isCorrect = clickedPopulation < referencePopulation;
                }

                // Add log entry with population information
                const logMessage = `${clickedCountry} (${clickedPopulation.toLocaleString()}) vs ${referenceCountry} (${referencePopulation.toLocaleString()})`;
                addLogEntry(logMessage, '', isCorrect);

                if (isCorrect) {
                    // Mark country as found and style it green
                    foundCountries.add(clickedCountry);
                    layer.setStyle({
                        fillColor: '#2ecc71',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                    
                    correctAttempts++;
                    currentScore++;
                    document.getElementById('current-score').textContent = currentScore;
                    
                    // Show success message
                    const message = populationMessages.correct[Math.floor(Math.random() * populationMessages.correct.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'success-message';
                    messageContainer.style.opacity = '1';

                    // Start new round with new reference country
                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        startNewRound();
                    }, 2000);
                } else {
                    // Decrease attempts
                    attemptsRemaining--;
                    updateAttemptsDisplay();
                    
                    if (attemptsRemaining <= 0) {
                        // Game over when no attempts remaining
                        const messageContainer = document.getElementById('message-container');
                        messageContainer.textContent = "Game Over! No attempts remaining!";
                        messageContainer.className = 'error-message';
                        messageContainer.style.opacity = '1';
                        
                        setTimeout(() => {
                            messageContainer.style.opacity = '0';
                            endGame();
                        }, 2000);
                        return;
                    }

                    // Show temporary red highlight for incorrect answer
                    layer.setStyle({
                        fillColor: '#e74c3c',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                    
                    incorrectAttempts++;
                    
                    // Show error message
                    const message = populationMessages.incorrect[Math.floor(Math.random() * populationMessages.incorrect.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'error-message';
                    messageContainer.style.opacity = '1';

                    // Reset the country's style after a delay
                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        if (!foundCountries.has(clickedCountry)) {
                            layer.setStyle({
                                fillColor: '#95a5a6',
                                fillOpacity: 0.2,
                                color: '#2c3e50',
                                weight: 1
                            });
                        }
                    }, 2000);
                }
                return;
            } else {
                // Call checkAnswer first to handle game logic
                checkAnswer({ countryName: clickedCountry });
                
                if (clickedCountry === targetCountry) {
                    // Correct guess - color green
                    layer.setStyle({
                        fillColor: '#2ecc71',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                } else {
                    // Wrong guess - temporary red color
                    layer.setStyle({
                        fillColor: '#e74c3c',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                    
                    // Reset color after delay
                    setTimeout(() => {
                        if (!foundCountries.has(clickedCountry)) {
                            layer.setStyle({
                                fillColor: '#95a5a6',
                                fillOpacity: 0.2,
                                color: '#2c3e50',
                                weight: 1
                            });
                        }
                    }, 2000);
                }
            }
        }

        function highlightFeature(e) {
            const layer = e.target;
            
            layer.setStyle({
                fillOpacity: 0.5,
                weight: 2,
                color: '#666'
            });
        }

        function resetHighlight(e) {
            const layer = e.target;
            layer.setStyle({
                fillOpacity: 0.2,
                weight: 1,
                color: '#2c3e50'
            });
        }

        function showMessage(isSuccess) {
            const messageContainer = document.getElementById('message-container');
            let messages;
            
            if (gameMode === 'hints') {
                messages = isSuccess ? hintSuccessMessages : errorMessages;
            } else if (difficulty === 'ultra') {
                messages = isSuccess ? ultraSuccessMessages : errorMessages;
            } else {
                messages = isSuccess ? successMessages : errorMessages;
            }
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            messageContainer.textContent = randomMessage;
            messageContainer.className = isSuccess ? 'success-message' : 'error-message';
            messageContainer.style.opacity = '1';

            setTimeout(() => {
                messageContainer.style.opacity = '0';
            }, 2000);
        }

        function checkAnswer(clicked) {
            if (!isGameActive) return;
            
            const clickedCountry = clicked.countryName || clicked.ADMIN;
            
            // Add log entry
            addLogEntry(clickedCountry, targetCountry, clickedCountry === targetCountry);
            
            if (clickedCountry === targetCountry) {
                correctAttempts++;
                
                if (gameMode === 'hints') {
                    currentScore += {
                        easy: 1,
                        normal: 2,
                        hard: 3,
                        ultra: 5
                    }[difficulty];
                    
                    foundCountries.add(targetCountry); // Add this line to track found countries
                    
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer._path.classList.add('correct');
                        }
                    });
                    
                    document.getElementById('current-score').textContent = currentScore;
                    document.getElementById('timer').textContent = 
                        `Hints Mode - Score: ${currentScore}`;
                    
                    // Add this check before starting new round
                    if (foundCountries.size >= countries[difficulty].length) {
                        endGame();
                        return;
                    }
                    
                    startNewRound();
                    showMessage(true);
                } else if (gameMode === 'streak') {
                    currentStreak++;
                    
                    document.getElementById('current-streak').textContent = currentStreak;
                    document.getElementById('current-score').textContent = currentStreak;
                    
                    const streakCounter = document.getElementById('streak-counter');
                    streakCounter.classList.add('streak-highlight');
                    setTimeout(() => streakCounter.classList.remove('streak-highlight'), 500);
                    
                    showStreakMessage(true);
                    startNewRound();
                } else if (gameMode === 'alphabetic') {
                    foundCountries.add(targetCountry);
                    
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer._path.classList.add('correct');
                        }
                    });
                    
                    alphabeticIndex++;
                    document.getElementById('current-score').textContent = 
                        `${foundCountries.size}/${sortedCountries.length}`;
                    
                    if (alphabeticIndex >= sortedCountries.length) {
                        endGame();
                        return;
                    }
                    
                    targetCountry = sortedCountries[alphabeticIndex];
                    const nextCountry = alphabeticIndex + 1 < sortedCountries.length ? 
                        sortedCountries[alphabeticIndex + 1] : 'Last country!';
                    document.getElementById('country-to-find').innerHTML = 
                        `${targetCountry}<div id="next-country">Next: ${nextCountry}</div>`;
                    
                } else if (gameMode === 'time') {
                    currentScore += {
                        easy: 1,
                        normal: 2,
                        hard: 3,
                        ultra: 5
                    }[difficulty];
                    
                    foundCountries.add(targetCountry); // Add this line to track found countries
                    
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer._path.classList.add('correct');
                        }
                    });
                    
                    document.getElementById('current-score').textContent = currentScore;
                    
                    // Add this check before starting new round
                    if (foundCountries.size >= countries[difficulty].length) {
                        endGame();
                        return;
                    }
                    
                    startNewRound();
                    showMessage(true);
                } else if (gameMode === 'all') {
                    foundCountries.add(targetCountry);
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer._path.classList.add('correct');
                        }
                    });
                    
                    document.getElementById('current-score').textContent = 
                        `${foundCountries.size}/${countries[difficulty].length}`;
                    
                    if (foundCountries.size >= countries[difficulty].length) {
                        endGame();
                        return;
                    }
                    startNewRound();
                }
                
                showMessage(true);
            } else {
                incorrectAttempts++;
                
                if (gameMode === 'streak') {
                    showStreakMessage(false);
                    // Show simple game over menu
                    const overlay = document.getElementById('game-overlay');
                    const startMenu = document.getElementById('start-menu');
                    
                    overlay.style.display = 'flex';
                    startMenu.setAttribute('data-menu-type', 'in-game');
                    startMenu.innerHTML = `
                        <h2 style="font-size: 36px; font-weight: 800;">Game Over!</h2>
                        <div style="margin-top: 20px;">
                            <button class="game-btn" onclick="showMainMenu()">
                                Back to Menu
                            </button>
                        </div>
                    `;
                    
                    // End the game immediately
                    endGame();
                } else {
                    showMessage(false);
                }
            }
        }

        function setDifficulty(level) {
            difficulty = level;
            map.setZoom(difficultyZoom[level]);
            currentScore = 0;
            document.getElementById('current-score').textContent = currentScore;
            startNewRound();
        }

        function startNewRound() {
            if (!isGameActive) return;

            if (gameMode === 'population') {
                // Wait for geojsonLayer to be initialized
                if (!geojsonLayer) {
                    setTimeout(startNewRound, 100); // Try again in 100ms
                    return;
                }

                // Reset map colors first
                resetMapColors();
                
                // Get available countries that haven't been used as reference
                const availableCountries = countries[difficulty].filter(country => 
                    !foundCountries.has(country) && countryPopulation[country]
                );
                
                if (availableCountries.length === 0) {
                    endGame();
                    return;
                }

                // Select random country and comparison type
                const randomIndex = Math.floor(Math.random() * availableCountries.length);
                referenceCountry = availableCountries[randomIndex];
                referencePopulation = countryPopulation[referenceCountry];

                // Determine comparison type based on reference country
                if (referenceCountry === 'China') {
                    comparisonType = 'less'; // China can only ask for countries with LESS population
                } else if (referenceCountry === 'Monaco') {
                    comparisonType = 'more'; // Monaco can only ask for countries with MORE population
                } else {
                    comparisonType = Math.random() < 0.5 ? 'more' : 'less';
                }

                // Update display
                document.getElementById('country-to-find').innerHTML = `
                    <div style="font-size: 18px;">
                        Find a country with <span style="color: ${comparisonType === 'less' ? '#A21A1A' : '#23A21A'}; font-weight: 1000;">${comparisonType.toUpperCase()}</span> 
                        population than <span style="color: #3498db; font-weight: 1000;">${referenceCountry}</span>
                        <div style="font-size: 14px; color: #666; margin-top: 5px;">
                            (${referenceCountry}'s population: ${referencePopulation.toLocaleString()})
                        </div>
                    </div>
                `;

                // Highlight reference country in yellow and maintain found countries in green
                geojsonLayer.eachLayer(function(layer) {
                    const countryName = layer.feature.properties.ADMIN;
                    if (countryName === referenceCountry) {
                        layer.setStyle({
                            fillColor: '#f1c40f',
                            fillOpacity: 0.6,
                            color: '#000',
                            weight: 1
                        });
                    } else if (foundCountries.has(countryName)) {
                        layer.setStyle({
                            fillColor: '#2ecc71',
                            fillOpacity: 0.6,
                            color: '#000',
                            weight: 1
                        });
                    }
                });
                
                // Update attempts display
                updateAttemptsDisplay();
                return;
            }
            
            // For time mode, check if all countries have been found
            if (gameMode === 'time') {
                const remainingCountries = countries[difficulty].filter(country => !foundCountries.has(country));
                
                if (remainingCountries.length === 0) {
                    endGame();
                    return;
                }
                
                const randomIndex = Math.floor(Math.random() * remainingCountries.length);
                targetCountry = remainingCountries[randomIndex];
            }
            // For hints mode
            else if (gameMode === 'hints') {
                // Reset hints for new country
                hintsRemaining = 2;
                
                // Get available countries that haven't been found yet
                const remainingCountries = countries[difficulty].filter(country => !foundCountries.has(country));
                
                if (remainingCountries.length === 0) {
                    endGame();
                    return;
                }
                
                // Select random country from remaining countries
                const randomIndex = Math.floor(Math.random() * remainingCountries.length);
                targetCountry = remainingCountries[randomIndex];
                
                // Get hints for the country
                const hints = countryHints[targetCountry];
                if (!hints) {
                    console.error('No hints available for:', targetCountry);
                    return;
                }
                
                // Show first hint with clear formatting
                document.getElementById('country-to-find').innerHTML = `
                    <div style="font-size: 13px; color: #666; margin-top: 10px; padding: 5px;">
                        Hint 1: ${hints[0]}
                    </div>
                `;
                
                updateHintButton();
            }
            // For other modes (except alphabetic), keep the existing logic
            else if (gameMode !== 'alphabetic') {
                let availableCountries = countries[difficulty].filter(country => !foundCountries.has(country));
                if (availableCountries.length === 0) {
                    endGame();
                    return;
                }
                const randomIndex = Math.floor(Math.random() * availableCountries.length);
                targetCountry = availableCountries[randomIndex];
            }
            
            // Update display for non-hints modes
            if (gameMode !== 'alphabetic' && gameMode !== 'hints') {
                document.getElementById('country-to-find').textContent = targetCountry;
            }
        }
    

        function startGame(selectedDifficulty) {
            // Set the game mode and difficulty
            gameMode = 'all';
            difficulty = selectedDifficulty;  // Use the selected difficulty
            
            // Hide the start menu and show game elements
            document.getElementById('game-overlay').style.display = 'none';
            document.getElementById('start-menu').style.display = 'none';
            
            // Initialize game with selected difficulty
            availableCountries = [...countries[difficulty]];
            isGameActive = true;
            
            // Reset game state
            foundCountries.clear();
            resetGame();
            
            // Initialize game components
            initializeGame();
            
            // Show necessary buttons
            document.getElementById('finish-btn').classList.remove('hidden');
            document.getElementById('menu-btn').classList.remove('hidden');
            document.getElementById('feedback-btn').classList.remove('hidden');
            
            // Set appropriate zoom level for difficulty
            if (map) {
                map.setZoom(difficultyZoom[difficulty]);
            }
        }

        function finishGame() {
            if (gameMode === 'hints') {
                endGame(); // Immediately end the game in hints mode
            } else if (confirm('Are you sure you want to end the game?')) {
                endGame();
            }
        }

        function startTimer() {
            gameTimer = setInterval(() => {
                timeLeft--;
                updateTimer();
                
                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);
        }

        function updateTimer() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timer').textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        function endGame() {
            isGameActive = false;
            clearInterval(gameTimer);

            // For streak mode, just show the simple menu
            if (gameMode === 'streak') {
                const overlay = document.getElementById('game-overlay');
                const startMenu = document.getElementById('start-menu');
                
                overlay.style.display = 'flex';
                startMenu.setAttribute('data-menu-type', 'in-game');
                startMenu.innerHTML = `
                    <h2 style="font-size: 36px; font-weight: 800;">Game Over!</h2>
                    <div style="margin-top: 20px;">
                        <button class="game-btn" onclick="showMainMenu()">
                            Back to Menu
                        </button>
                    </div>
                `;
            }

            // Reset game elements
            document.getElementById('finish-btn').classList.add('hidden');
            document.getElementById('menu-btn').classList.add('hidden');
            document.getElementById('feedback-btn').classList.add('hidden');
            document.getElementById('timer').classList.add('hidden');
            document.querySelector('.hint-controls').style.display = 'none';
            
            // Highlight remaining countries in yellow for 'all' and 'alphabetic' modes
            if ((gameMode === 'all' || gameMode === 'alphabetic') && geojsonLayer) {
                const remainingCountries = gameMode === 'alphabetic' 
                    ? sortedCountries.slice(alphabeticIndex)
                    : countries[difficulty].filter(country => !foundCountries.has(country));
                    
                geojsonLayer.eachLayer(function(layer) {
                    const countryName = layer.feature.properties.ADMIN;
                    // Handle special cases mapping
                    const countryMapping = {
                        'United Republic of Tanzania': 'Tanzania',
                        'The former Yugoslav Republic of Macedonia': 'North Macedonia',
                        'Republic of North Macedonia': 'North Macedonia',
                        'Cape Verde': 'Cabo Verde',
                        "The Bahamas": "Bahamas",    
                        "Republic of Serbia": "Serbia",
                        "Republic of the Congo": "Congo",
                    };
                    const normalizedCountry = countryMapping[countryName] || countryName;
                    
                    if (remainingCountries.includes(normalizedCountry)) {
                        layer.setStyle({
                            fillColor: '#f1c40f',  // Yellow color
                            fillOpacity: 0.6,
                            weight: 1,
                            opacity: 1,
                            color: '#2c3e50'
                        });
                    }
                });
            }
            
            // Trigger confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            
            (function frame() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return;
                
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });

                requestAnimationFrame(frame);
            }());
            
            const accuracy = correctAttempts + incorrectAttempts > 0 
                ? Math.round((correctAttempts / (correctAttempts + incorrectAttempts)) * 100)
                : 0;
                    
            const gameEndMessage = gameMode === 'hints'
                ? `Final Score: ${currentScore}<br>Countries Found: ${correctAttempts}`
                : gameMode === 'streak'
                ? `Game Over! Final Streak: ${currentStreak}`
                : gameMode === 'time'
                ? `Final Score: ${currentScore}`
                : gameMode === 'alphabetic'
                ? `Congratulations! You completed the alphabetic challenge!`
                : `Congratulations! You found ${foundCountries.size} countries!`;
                    
            // Show the overlay and menu for all game modes
            const overlay = document.getElementById('game-overlay');
            const startMenu = document.getElementById('start-menu');
            if (overlay) overlay.classList.remove('hidden');
            
            if (startMenu) {
                startMenu.innerHTML = `
                    <div style="position: relative;">
                        <button style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 24px; cursor: pointer; padding: 10px;" 
                                onclick="closeEndGameOverlay()">×</button>
                        <h2>Game Over!</h2>
                        <p style="font-size: 24px; margin: 20px 0;">${gameEndMessage}</p>
                        
                        <div id="stats-container">
                            <div class="stat-box">
                                <div class="stat-label">Correct Attempts</div>
                                <div class="stat-value" style="color: #2ecc71;">${correctAttempts}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">Incorrect Attempts</div>
                                <div class="stat-value" style="color: #e74c3c;">${incorrectAttempts}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">Total Attempts</div>
                                <div class="stat-value">${correctAttempts + incorrectAttempts}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">Accuracy</div>
                                <div class="stat-value">${accuracy}%</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                            <button class="game-btn" onclick="restartGame('${difficulty}')">Restart Game</button>
                            <button class="game-btn" onclick="showMainMenu()">Main Menu</button>
                        </div>
                    </div>
                `;
            }
            
            // Hide streak counters if they exist
            const streakCounter = document.getElementById('streak-counter');
            if (streakCounter) streakCounter.classList.add('hidden');
            
            // Hide hint elements if they exist
            const hintBtn = document.getElementById('hint-btn');
            const hintContainer = document.getElementById('hint-container');
            const hintsLeft = document.querySelector('.hints-left');
            
            if (hintBtn) hintBtn.classList.add('hidden');
            if (hintContainer) hintContainer.style.display = 'none';
            if (hintsLeft) hintsLeft.style.display = 'none';

            // Add cleanup function for when overlay is closed
            window.closeEndGameOverlay = function() {
                document.getElementById('game-overlay').classList.add('hidden');
                
                // Remove any existing restart button first
                const existingBtn = document.getElementById('restart-game-btn');
                if (existingBtn) {
                    existingBtn.remove();
                }
                
                // Create restart button when overlay is closed
                const restartBtn = document.createElement('button');
                restartBtn.className = 'game-btn';
                restartBtn.id = 'restart-game-btn';
                restartBtn.innerHTML = '<i class="fas fa-redo"></i> Restart Game';
                restartBtn.style.cssText = `
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #27ae60;
                    z-index: 1000;
                    transition: all 0.3s ease;
                `;
                
                restartBtn.onclick = () => {
                    // Remove the button immediately
                    restartBtn.remove();
                    
                    // Store current game mode and difficulty
                    localStorage.setItem('pendingGameMode', gameMode);
                    localStorage.setItem('pendingDifficulty', difficulty);
                    
                    // Reload the page
                    window.location.reload();
                };
                
                document.body.appendChild(restartBtn);
            };


        }

        // Add new function to close end game overlay
        function closeEndGameOverlay() {
            document.getElementById('game-overlay').classList.add('hidden');
        }

        // Add some CSS for the end game overlay
        const styles = `
            #start-menu {
                position: relative;
                min-width: 300px;
                padding: 40px;
            }

            .close-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 10px;
                color: #666;
                transition: color 0.3s;
            }

            .close-btn:hover {
                color: #000;
            }

            #game-overlay {
                background: rgba(0, 0, 0, 0.8);
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // Remove the difficulty buttons from game controls div
        document.getElementById('game-controls').innerHTML = '';

        function showDifficultySelect(mode) {
            // Store the selected game mode first
            gameMode = mode;
            localStorage.setItem('selectedGameMode', mode);
            
            // Hide game modes and show difficulty selection
            document.getElementById('mode-select-texts').style.display = 'none';
            document.getElementById('game-modes').style.display = 'none';
            document.getElementById('documentation-link').style.display = 'none';
            document.getElementById('difficulty-select').style.display = 'block';
        }
        function restartGame(selectedDifficulty) {
            // Store current game mode
            localStorage.setItem('selectedGameMode', gameMode);
            
            // Hide the overlay
            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
            
            // Reset map colors
            resetMapColors();
            
            // Start new game with same settings
            startGame(selectedDifficulty);
        }
        function showGameModes() {
            // Show mode selection elements
            document.getElementById('mode-select-texts').style.display = 'block';
            document.getElementById('game-modes').style.display = 'grid'; // or 'flex' depending on your layout
            document.getElementById('documentation-link').style.display = 'block';
            
            // Hide difficulty selection
            document.getElementById('difficulty-select').style.display = 'none';
        }

        function showMainMenu() {
            // Don't reset the game state or clear timer if game is active
            if (isGameActive) {
                // Just pause the timer if it's a time mode game
                if (gameMode === 'time') {
                    clearInterval(gameTimer);
                }
            }

            const wasGameActive = isGameActive;
            const gameState = wasGameActive ? {
                mode: gameMode,
                difficulty: difficulty,
                score: currentScore,
                correctAttempts: correctAttempts,
                incorrectAttempts: incorrectAttempts,
                targetCountry: targetCountry,
                timeLeft: timeLeft,
                foundCountries: Array.from(foundCountries),
                currentStreak: currentStreak,
            } : null;
            
            // Show overlay without hiding the game elements
            const overlay = document.getElementById('game-overlay');
            overlay.style.background = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent background
            overlay.classList.remove('hidden');
            
            // Reset menu to show game modes
            const startMenu = document.getElementById('start-menu');
            
            // Set the menu type to in-game when showing menu during gameplay
            startMenu.setAttribute('data-menu-type', 'in-game');
            
            // Add resume button if there was an active game
            const resumeButton = wasGameActive ? `
                <div style="text-align: center; margin-bottom: 20px;">
                    <button class="game-btn" style="background: #27ae60;" onclick="resumeGame(${JSON.stringify(gameState).replace(/"/g, '&quot;')})">
                        <i class="fas fa-play"></i> Resume Game
                    </button>
                </div>
            ` : '';
            
            startMenu.innerHTML = ` <!-- MAIN MENU -->
                ${resumeButton}
                <div id="mode-select-texts">
                    <h2 style="font-size: 36px; font-weight: 800;">Select Game Mode</h2>
                    <h2 style="font-size: 16px; font-weight: 200; padding-bottom: 10px; margin-top: -20px;">You need to choose a game mode in order to start the game.</h2>
                </div>
                <div id="game-modes">
                    <div class="mode-card" onclick="showDifficultySelect('time')">
                        <div class="mode-title">Against Time ⏱️</div>
                        <div class="mode-description">Find as many countries as you can in 3 minutes!</div>
                    </div>
                    <div class="mode-card" onclick="showDifficultySelect('all')">
                        <div class="mode-title">Find All Countries 🌎</div>
                        <div class="mode-description">Take your time to find all countries in the selected region.</div>
                    </div>
                    <div class="mode-card" onclick="showDifficultySelect('alphabetic')">
                        <div class="mode-title">Alphabetic Challenge 🔤</div>
                        <div class="mode-description">Find countries in alphabetical order!</div>
                    </div>
                    <div class="mode-card" onclick="showDifficultySelect('streak')">
                        <div class="mode-title">Streak Mode 🔥</div>
                        <div class="mode-description">How many countries can you find in a row without mistakes?</div>
                    </div>
                    <div class="mode-card" onclick="showDifficultySelect('hints')">
                        <div class="mode-title" style="position: relative;">
                            <span class="new-tag" style="background: #2ecc71;">POPULAR</span>
                            Hints Mode 💡
                        </div>
                        <div class="mode-description">Use hints wisely to find countries! Limited hints per game.</div>
                    </div>
                    <div class="mode-card" onclick="window.open('https://countryodyssey.onrender.com/')">
                        <div class="mode-title" style="position: relative;">
                            <span class="new-tag">NEW</span>
                            Multiplayer Mode 🎮
                        </div>
                        <div class="mode-description">Challenge your friends in real-time geography battles!</div>
                    </div>
                    <div class="mode-card" onclick="showDifficultySelect('population')">
                    <div class="mode-title" style="position: relative;">
                        <span class="new-tag" style="background: #006eff; color: #ffffff;">NEW</span>
                        Population Guesser 🎯
                    </div>
                        <div class="mode-description">Find countries with higher or lower populations!</div>
                    </div>
                    <div class="mode-card decode-odyssey" onclick="window.open('https://emoji-odyssey.vercel.app/')" 
                         style="background: #000000; position: relative; overflow: hidden; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <div class="rainbow-circles" style="z-index: 1;"></div>
                        <div class="card-content" style="position: relative; z-index: 3;">
                        <div class="mode-title" style="position: relative; color: white; font-family: 'Instagram Sans Bold', sans-serif;">
                            <span class="new-tag" style="background: #FFD700; color: #000000;">BEST</span>
                            Decode Odyssey 🤠
                        </div>
                            <div class="mode-description" style="color: rgba(255,255,255,0.9); font-family: 'Inter', sans-serif; font-weight: 200;">
                                Test your emoji decoding skills in this fun puzzle game!
                            </div>
                        </div>
                        <div class="card-blur" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; backdrop-filter: blur(4px); z-index: 2;"></div>
                    </div>
                </div>

                <a id="documentation-link" class="documentation-link" style="text-decoration:none; font-size: 16px; font-weight: 230; position: relative; top: 10px; cursor: pointer; color: #333;" href="documention.html" target="_blank">Click me to learn more about the game 📄</a>

                <div id="difficulty-select" class="difficulty-select" style="display: none;">
                    <h2 style="font-size: 36px; font-weight: 800;">Select Difficulty</h2>
                <button class="back-btn" onclick="showGameModes()">←</button>
                    <div class="difficulty-buttons">
                <button class="game-btn" onclick="startGame('easy')">Easy</button>
                <button class="game-btn" onclick="startGame('normal')">Normal</button>
                <button class="game-btn" onclick="startGame('hard')">Hard</button>
                <button class="game-btn" style="background: #e74c3c" onclick="confirmUltraMode()">Ultra</button>
            </div>
        </div>
            `
            ;
            
            showGameModes();
        }

        // Add the resume game function
        function resumeGame(gameState) {
            // Hide the menu overlay
            document.getElementById('game-overlay').classList.add('hidden');
            
            // If it was a time mode game, restart the timer
            if (gameMode === 'time') {
                startTimer();
            }
            
            // No need to restore other state since we kept it in the background
        }

        // Add confirmation for Ultra mode
        function confirmUltraMode() {
            if (confirm('Ultra mode includes ALL countries in the world! Are you ready for this challenge?')) {
                startGame('ultra');
            }
        }

        // Add Ultra-specific messages
        const ultraSuccessMessages = [
            "GEOGRAPHY LEGEND! 🌍👑",
            "ULTRA INSTINCT ACTIVATED! 💫",
            "WORLD MASTER! 🌎",
            "ABSOLUTELY INCREDIBLE! 🔥",
            "ULTRA RARE FIND! ⭐",
            "MAP WIZARD IN THE HOUSE! 🗺️✨",
            "BIG BRAIN ENERGY! 🧠⚡",
            "EARTH EXPLORER LEVEL 100! 🌏🎮",
            "NEXT-LEVEL GENIUS! 🚀🔥",
            "EPIC WINNER VIBES! 🏆",
            "LEGENDARY DISCOVERY UNLOCKED! 🔓✨",
            "CHAMPION OF THE WORLD! 🌎💪",
            "BOSS MODE ACTIVATED! 👑⚡",
            "RARE GEM SPOTTED! 💎🌟",
            "ABSOLUTE ICON! 🔥🌍",
        ];

        // Add hint-specific success messages
        const hintSuccessMessages = [
            "Detective Skills: 100% ",
            "Puzzle Master! 🧩",
            "Brilliant Deduction! 🎯",
            "Geography Sleuth! 🗺️",
            "Case Solved! 🔎",
            "Clue Finder Extraordinaire! 💡",
            "Sharp as a Tack! 🦊",
            "Investigation Complete! ✅",
            "Mystery Unlocked! 🔓",
            "Trailblazer Award! 🛤️",
            "Map Detective! 🗺️🔍",
            "Nothing Escapes You! 🕵️‍♂️",
            "Piece of the Puzzle Found! 🧩✨",
            "Perfect Guess! 🎉",
            "Mind Games Champion! 🏆🧠"
        ];

        // Initialize with game modes view
        window.onload = function() {
            const storedMode = localStorage.getItem('selectedGameMode');
            const storedDifficulty = localStorage.getItem('selectedDifficulty');
            
            if (storedMode && storedDifficulty) {
                gameMode = storedMode;
                difficulty = storedDifficulty;
                
                localStorage.removeItem('selectedGameMode');
                localStorage.removeItem('selectedDifficulty');
                
                startGameWithoutRefresh(storedDifficulty);
            }
        }

        // Create a version of startGame that doesn't refresh
        function startGameWithoutRefresh(selectedDifficulty) {
            // Get the selected game mode from localStorage if not set
            if (!gameMode) {
                gameMode = localStorage.getItem('selectedGameMode');
            }
            console.log('Starting game with mode:', gameMode, 'difficulty:', selectedDifficulty);

            // Set the difficulty properly, default to 'easy' if not specified
            difficulty = selectedDifficulty || 'easy';
            
            // Show/hide skip button based on game mode
            const skipButton = document.getElementById('skip-btn');
            if (skipButton) {
                if (gameMode === 'all') {
                    skipButton.classList.remove('hidden');
                    skipButton.style.display = 'inline-block';
                    console.log('Showing skip button for Find All Countries mode');
                } else {
                    skipButton.classList.add('hidden');
                    skipButton.style.display = 'none';
                    console.log('Hiding skip button');
                }
            }
            
            // Show/hide population mode notice
            if (gameMode === 'population') {
                document.getElementById('population-mode-notice').style.display = 'block';
            } else {
                document.getElementById('population-mode-notice').style.display = 'none';
            }
            
            isGameActive = true;
            currentScore = 0;
            correctAttempts = 0;
            incorrectAttempts = 0;
            
            // Hide hint controls and timer by default
            document.querySelector('.hint-controls').style.display = 'none';
            document.getElementById('timer').classList.add('hidden');
            
            document.getElementById('game-overlay').classList.add('hidden');
            document.getElementById('menu-btn').classList.remove('hidden');
            document.getElementById('finish-btn').classList.remove('hidden');
            document.getElementById('feedback-btn').classList.remove('hidden');
            
            // Reset country pools with the correct difficulty
            usedCountries.clear();
            foundCountries.clear();
            availableCountries = [...countries[difficulty]];  // Use the potentially defaulted difficulty
            
            // Initialize map if not already done
            if (!map) {
                initMap();
            }
            
            // Mode-specific initializations
            if (gameMode === 'hints') {
                // ... existing hints mode code ...
            } else if (gameMode === 'streak') {
                // ... existing streak mode code ...
            } else if (gameMode === 'alphabetic') {
                // ... existing alphabetic mode code ...
            } else if (gameMode === 'time') {
                // ... existing time mode code ...
            } else if (gameMode === 'population') {
                // ... existing population mode code ...
            } else if (gameMode === 'all') {
                // Initialize tutorial for first country
                foundCountries = new Set();
                startNewRound();
                
                // Add tutorial highlight for the first country
                if (targetCountry) {
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer.bindPopup('<div style="text-align: center; font-weight: bold;">Click me!</div>', {
                                closeButton: false,
                                className: 'tutorial-popup'
                            }).openPopup();
                            layer.setStyle({
                                fillColor: '#f1c40f',
                                fillOpacity: 0.6,
                                color: '#000',
                                weight: 2
                            });
                        }
                    });
                }
            }

            map.setZoom(difficultyZoom[difficulty]);  // Use the potentially defaulted difficulty
        }

        function showStreakMessage(isSuccess) {
            const messageContainer = document.getElementById('message-container');
            let message;
            
            if (isSuccess) {
                if (currentStreak % 5 === 0) { // Show special message every 5 streaks
                    const randomMilestone = streakMessages.milestone[Math.floor(Math.random() * streakMessages.milestone.length)];
                    message = `${randomMilestone} ${currentStreak}!`;
                } else {
                    message = successMessages[Math.floor(Math.random() * successMessages.length)];
                }
            } else {
                const randomGameOver = streakMessages.gameOver[Math.floor(Math.random() * streakMessages.gameOver.length)];
                message = `${randomGameOver} ${currentStreak}`;
            }
            
            messageContainer.textContent = message;
            messageContainer.className = isSuccess ? 'success-message' : 'error-message';
            messageContainer.style.opacity = '1';

            setTimeout(() => {
                messageContainer.style.opacity = '0';
            }, 2000);
        }

        // Add hint-related variables
        let hintsRemaining = 3;
        let currentHint = '';

        function showHint() {
            if (hintsRemaining <= 0) return;
            
            const hints = countryHints[targetCountry];
            if (!hints) {
                console.error('No hints available for:', targetCountry);
                return;
            }
            
            // Calculate which hint to show (3 - hintsRemaining gives us hint index 1, then 2)
            const hintIndex = 3 - hintsRemaining;
            
            // Add new hint while keeping previous hints
            const targetElement = document.getElementById('country-to-find');
            const newHintHtml = `
                <div class="hint" style="font-size: 13px; color: #666; margin-top: 10px; padding: 5px;">
                    Hint ${hintIndex + 1}: ${hints[hintIndex]}
                </div>
            `;
            
            // Append the new hint after existing content
            targetElement.innerHTML += newHintHtml;
            
            hintsRemaining--;
            updateHintButton();
        }

        function updateHintButton() {
            const hintBtn = document.getElementById('hint-btn');
            const hintText = document.querySelector('.hints-left');
            
            if (hintBtn) {
                hintBtn.textContent = `Get Hint (${hintsRemaining})`;
                hintBtn.disabled = hintsRemaining <= 0;
                hintBtn.style.opacity = hintsRemaining <= 0 ? '0.5' : '1';
                
                if (hintText) {
                    hintText.textContent = `Hints remaining: ${hintsRemaining}`;
                }
            }

        // Helper functions for default hints
        function getRegion(country) {
            // This would need a proper database of country regions
            return "specific region"; // Placeholder
        }

        function getCapital(country) {
            // This would need a proper database of capitals
            return "capital city"; // Placeholder
        }

        function getPopulation(country) {
            // This would need a proper database of populations
            return "X million"; // Placeholder
        }

        // Helper function for snow
        function createSnowflake() {
            const snowflake = document.createElement('div');
            snowflake.innerHTML = '❄';
            snowflake.style.cssText = `
                position: fixed;
                color: white;
                font-size: ${Math.random() * 20 + 10}px;
                opacity: ${Math.random() * 0.8 + 0.2};
                left: ${Math.random() * 100}vw;
                top: -20px;
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
                text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                pointer-events: none;
                z-index: 1000;
            `;
            return snowflake;
        }

        // Helper function for trail dots
        function createTrailDot(e) {
            const dot = document.createElement('div');
            dot.className = 'trail-dot';
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            containers.trail.appendChild(dot);
            dots.push({
                element: dot,
                x: e.clientX,
                y: e.clientY,
                alpha: 1
            });

            if (dots.length > 20) {
                const oldDot = dots.shift();
                oldDot.element.remove();
            }
        }

        // Helper function for trail animation
        function updateTrail() {
            dots.forEach((dot, index) => {
                dot.alpha *= 0.9;
                dot.element.style.opacity = dot.alpha;
                if (dot.alpha < 0.1) {
                    dot.element.remove();
                    dots.splice(index, 1);
                }
            });
        }

        // Floating Emoji class
        class FloatingEmoji {
            constructor(emoji) {
                this.element = document.createElement('div');
                this.element.className = 'floating-emoji';
                this.element.textContent = emoji;
                this.element.style.cssText = `
                    position: fixed;
                    font-size: 24px;
                    cursor: pointer;
                    user-select: none;
                    z-index: 1002;
                `;
                
                this.x = Math.random() * (window.innerWidth - 30);
                this.y = Math.random() * (window.innerHeight - 30);
                this.velocityY = 0;
                this.velocityX = 0;
                this.gravity = 0.5;
                this.bounce = 0.7;
                this.friction = 0.99;
                this.isJumping = false;

                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;

                this.element.addEventListener('mouseover', () => {
                    if (!this.isJumping) {
                        this.velocityY = -15;
                        this.velocityX = (Math.random() - 0.5) * 10;
                        this.isJumping = true;
                    }
                });

                containers.emojiContainer.appendChild(this.element);
            }

            update() {
                if (this.isJumping) {
                    this.velocityY += this.gravity;
                    this.velocityX *= this.friction;
                    
                    this.x += this.velocityX;
                    this.y += this.velocityY;

                    // Bounce off walls
                    if (this.x < 0 || this.x > window.innerWidth - 30) {
                        this.velocityX *= -this.bounce;
                        this.x = this.x < 0 ? 0 : window.innerWidth - 30;
                    }

                    // Bounce off floor
                    if (this.y > window.innerHeight - 30) {
                        this.velocityY *= -this.bounce;
                        this.y = window.innerHeight - 30;
                        
                        if (Math.abs(this.velocityY) < 0.5) {
                            this.isJumping = false;
                            this.velocityY = 0;
                            this.velocityX = 0;
                        }
                    }

                    this.element.style.left = `${this.x}px`;
                    this.element.style.top = `${this.y}px`;
                    this.element.style.transform = `rotate(${this.velocityX * 2}deg)`;
                }
            }
        }

        // Add Christmas lights
        function createChristmasLights() {
            containers.lights.id = 'christmas-lights';
            containers.lights.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 30px;
                z-index: 1002;
                display: flex;
                justify-content: space-between;
                padding: 0 10px;
                pointer-events: none;
            `;

            for (let i = 0; i < 20; i++) {
                const light = document.createElement('div');
                light.className = 'christmas-light';
                light.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    margin: 5px;
                    animation: lightGlow 1s infinite alternate;
                    animation-delay: ${Math.random() * 1}s;
                    background: ${['#66BB6A', '#F44336', '#66BB6A', '#F44336'][i % 4]};
                `;
                containers.lights.appendChild(light);
            }
        }

        // Add this new function after endGame
        function restartGame(selectedDifficulty) {
            // Store current game mode
            localStorage.setItem('selectedGameMode', gameMode);
            
            // Hide the overlay
            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
            // Reset map colors
            resetMapColors();
            
            // Start new game with same settings
            startGame(selectedDifficulty);
        }

        // Add this function to handle population mode initialization
        function initializePopulationRound() {
            if (!isGameActive || gameMode !== 'population') return;

            // Get available countries that haven't been used
            const availableCountries = countries[difficulty].filter(country => !foundCountries.has(country));
            if (availableCountries.length === 0) {
                endGame();
                return;
            }

            // Select random country and comparison type
            const randomIndex = Math.floor(Math.random() * availableCountries.length);
            referenceCountry = availableCountries[randomIndex];
            referencePopulation = countryPopulation[referenceCountry];

            // Determine comparison type based on reference country
            if (referenceCountry === 'China') {
                comparisonType = 'less'; // China can only ask for countries with LESS population
            } else if (referenceCountry === 'Monaco') {
                comparisonType = 'more'; // Monaco can only ask for countries with MORE population
            } else {
                comparisonType = Math.random() < 0.5 ? 'more' : 'less';
            }

            // Update display
            document.getElementById('country-to-find').innerHTML = `
                <div style="font-size: 18px;">
                    Find a country with <span style="color: ${comparisonType === 'less' ? '#A21A1A' : '#23A21A'}; font-weight: 1000;">${comparisonType.toUpperCase()}</span> 
                    population than <span style="color: #3498db; font-weight: 1000;">${referenceCountry}</span>
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        (${referenceCountry}'s population: ${referencePopulation.toLocaleString()})
                    </div>
                </div>
            `;

            // Highlight reference country in yellow
            geojsonLayer.eachLayer(function(layer) {
                if (layer.feature.properties.ADMIN === referenceCountry) {
                    layer.setStyle({
                        fillColor: '#f1c40f',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                }
            });
        }

        // Modify the startNewRound function to include population mode
        function startNewRound() {
            if (!isGameActive) return;

            if (gameMode === 'population') {
                // Get available countries that haven't been used
                initializePopulationRound();
                return;
            }
            // ... rest of the existing startNewRound function ...
        }

        // Modify the checkAnswer function to handle population mode
        function checkAnswer(clicked) {
            if (!isGameActive) return;

            const clickedCountry = clicked.countryName || clicked.ADMIN;
            
            if (gameMode === 'population') {
                const clickedPopulation = countryPopulation[clickedCountry];
                let isCorrect = false;

                if (comparisonType === 'more') {
                    isCorrect = clickedPopulation > referencePopulation;
                } else {
                    isCorrect = clickedPopulation < referencePopulation;
                }

                // Add log entry with population information
                const logMessage = `${clickedCountry} (${clickedPopulation.toLocaleString()}) vs ${referenceCountry} (${referencePopulation.toLocaleString()})`;
                addLogEntry(logMessage, '', isCorrect);

                if (isCorrect) {
                    correctAttempts++;
                    currentScore++;
                    document.getElementById('current-score').textContent = currentScore;
                    
                    // Show success message
                    const message = populationMessages.correct[Math.floor(Math.random() * populationMessages.correct.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'success-message';
                    messageContainer.style.opacity = '1';

                    // Add to found countries
                    foundCountries.add(referenceCountry);

                    // Start new round
                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        startNewRound();
                    }, 2000);
                } else {
                    incorrectAttempts++;
                    
                    // Show error message
                    const message = populationMessages.incorrect[Math.floor(Math.random() * populationMessages.incorrect.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'error-message';
                    messageContainer.style.opacity = '1';

                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                    }, 2000);
                }
                return;
            }
            // ... rest of the existing checkAnswer function ...
        }

        // Modify the startGame function to handle population mode
        function startGame(selectedDifficulty) {
            // ... existing startGame code ...

            if (gameMode === 'population') {
                document.getElementById('current-score').textContent = '0';
                document.getElementById('attempts-display').classList.remove('hidden');
                currentScore = 0;
                foundCountries.clear();
                attemptsRemaining = 3;
                updateAttemptsDisplay();
                startNewRound();
            } else {
                document.getElementById('attempts-display').classList.add('hidden');
            }
            // ... rest of the existing startGame function ...
        }

        // Add this new function to update attempts display
        function updateAttemptsDisplay() {
            const display = document.getElementById('attempts-display');
            if (display) {
                display.classList.remove('hidden');
                display.innerHTML = `${`<i class="fas fa-heart" style="color: #7C4646;"></i>`.repeat(attemptsRemaining)}`;
            }
        }

        // Modify the countryClick function for population mode
        function countryClick(e) {
            if (!isGameActive) return;
            
            const layer = e.target;
            const clickedCountry = layer.feature.properties.ADMIN;
            
            if (gameMode === 'population') {
                // Don't allow clicking on already found countries
                if (foundCountries.has(clickedCountry)) return;
                
                const clickedPopulation = countryPopulation[clickedCountry];
                let isCorrect = false;

                if (comparisonType === 'more') {
                    isCorrect = clickedPopulation > referencePopulation;
                } else {
                    isCorrect = clickedPopulation < referencePopulation;
                }

                // Add log entry with population information
                const logMessage = `${clickedCountry} (${clickedPopulation.toLocaleString()}) vs ${referenceCountry} (${referencePopulation.toLocaleString()})`;
                addLogEntry(logMessage, '', isCorrect);

                if (isCorrect) {
                    // Mark country as found and style it green
                    foundCountries.add(clickedCountry);
                    layer.setStyle({
                        fillColor: '#2ecc71',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                    
                    correctAttempts++;
                    currentScore++;
                    document.getElementById('current-score').textContent = currentScore;
                    
                    // Show success message
                    const message = populationMessages.correct[Math.floor(Math.random() * populationMessages.correct.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'success-message';
                    messageContainer.style.opacity = '1';

                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        startNewRound();
                    }, 2000);
                } else {
                    // Decrease attempts
                    attemptsRemaining--;
                    updateAttemptsDisplay();
                    
                    if (attemptsRemaining <= 0) {
                        // Game over when no attempts remaining
                        const messageContainer = document.getElementById('message-container');
                        messageContainer.textContent = "Game Over! No attempts remaining!";
                        messageContainer.className = 'error-message';
                        messageContainer.style.opacity = '1';
                        
                        setTimeout(() => {
                            messageContainer.style.opacity = '0';
                            isGameActive = false; // Add this line to end the game
                            endGame();
                        }, 2000);
                        return;
                    }

                    // Show temporary red highlight for incorrect answer
                    layer.setStyle({
                        fillColor: '#e74c3c',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                    
                    incorrectAttempts++;
                    
                    // Show error message
                    const message = populationMessages.incorrect[Math.floor(Math.random() * populationMessages.incorrect.length)];
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = message;
                    messageContainer.className = 'error-message';
                    messageContainer.style.opacity = '1';

                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        if (!foundCountries.has(clickedCountry)) {
                            layer.setStyle({
                                fillColor: '#95a5a6',
                                fillOpacity: 0.2,
                                color: '#2c3e50',
                                weight: 1
                            });
                        }
                    }, 2000);
                }
                return;
            }

            // ... rest of the existing countryClick function ...
        }

        // Modify startNewRound to select a new reference country after each correct guess
        function startNewRound() {
            if (!isGameActive) return;

            if (gameMode === 'population') {
                // Reset map colors first
                resetMapColors();
                
                // Get available countries that haven't been used as reference
                const availableCountries = countries[difficulty].filter(country => 
                    !foundCountries.has(country) && countryPopulation[country]
                );
                
                if (availableCountries.length === 0) {
                    endGame();
                    return;
                }

                // Select random country and comparison type
                const randomIndex = Math.floor(Math.random() * availableCountries.length);
                referenceCountry = availableCountries[randomIndex];
                referencePopulation = countryPopulation[referenceCountry];

                // Determine comparison type based on reference country
                if (referenceCountry === 'China') {
                    comparisonType = 'less'; // China can only ask for countries with LESS population
                } else if (referenceCountry === 'Monaco') {
                    comparisonType = 'more'; // Monaco can only ask for countries with MORE population
                } else {
                    comparisonType = Math.random() < 0.5 ? 'more' : 'less';
                }

                // Update display
                document.getElementById('country-to-find').innerHTML = `
                    <div style="font-size: 18px;">
                        Find a country with <span style="color: ${comparisonType === 'less' ? '#A21A1A' : '#23A21A'}; font-weight: 1000;">${comparisonType.toUpperCase()}</span> 
                        population than <span style="color: #3498db; font-weight: 1000;">${referenceCountry}</span>
                        <div style="font-size: 14px; color: #666; margin-top: 5px;">
                            (${referenceCountry}'s population: ${referencePopulation.toLocaleString()})
                        </div>
                    </div>
                `;

                // Highlight reference country in yellow and maintain found countries in green
                geojsonLayer.eachLayer(function(layer) {
                    const countryName = layer.feature.properties.ADMIN;
                    if (countryName === referenceCountry) {
                        layer.setStyle({
                            fillColor: '#f1c40f',
                            fillOpacity: 0.6,
                            color: '#000',
                            weight: 1
                        });
                    } else if (foundCountries.has(countryName)) {
                        layer.setStyle({
                            fillColor: '#2ecc71',
                            fillOpacity: 0.6,
                            color: '#000',
                            weight: 1
                        });
                    }
                });
                
                // Update attempts display
                updateAttemptsDisplay();
                return;
            }

            // ... rest of the existing startNewRound function ...
        }

        // Also modify the endGame function to handle population mode
        function endGame() {
            isGameActive = false;
            if (gameMode === 'population') {
                document.getElementById('attempts-display').classList.add('hidden');
            }
            // ... rest of existing endGame code ...
        }

        // Add this with other game state variables at the top
        let usedHintCountries = new Set();

        // Modify the startNewRound function for hints mode
        function startNewRound() {
            if (!isGameActive) return;

            if (gameMode === 'hints') {
                // Get available countries that haven't been used in hints
                const availableCountries = countries[difficulty].filter(country => 
                    !usedHintCountries.has(country)
                );

                if (availableCountries.length === 0) {
                    // If all countries have been used, show game completion
                    const messageContainer = document.getElementById('message-container');
                    messageContainer.textContent = "Congratulations! You've seen all countries in this difficulty!";
                    messageContainer.className = 'success-message';
                    messageContainer.style.opacity = '1';
                    
                    setTimeout(() => {
                        messageContainer.style.opacity = '0';
                        endGame();
                    }, 2000);
                    return;
                }

                // Select a random country that hasn't been used
                const randomIndex = Math.floor(Math.random() * availableCountries.length);
                targetCountry = availableCountries[randomIndex];
                
                // Add the country to used set
                usedHintCountries.add(targetCountry);

                // Reset hints for new country
                hintsRemaining = 2;
                document.getElementById('hint-container').style.display = 'none';
                document.getElementById('hint-text').textContent = '';
                
                // Update display
                document.getElementById('country-to-find').innerHTML = 
                    `<div style="font-size: 24px;">Find: <span style="color: #3498db;">???</span></div>`;
                
                // Show hint buttons
                document.getElementById('hint-btn').classList.remove('hidden');
                document.getElementById('surrender-btn').classList.remove('hidden');
                updateHintButton();
                return;
            }

            // ... rest of the existing startNewRound function ...
        }

        // Modify the startGame function to reset usedHintCountries when starting a new game
        function startGame(selectedDifficulty) {
            // ... existing startGame code ...

            if (gameMode === 'hints') {
                usedHintCountries.clear(); // Reset used countries when starting new game
                document.getElementById('hint-container').style.display = 'none';
                document.getElementById('hint-text').textContent = '';
                hintsRemaining = 2;
                updateHintButton();
            }

            // ... rest of the existing startGame code ...
        }

        function startNewRound() {
            if (!isGameActive) return;

            else {
                // For other modes, show the country name
                if (document.getElementById('country-to-find')) {
                    document.getElementById('country-to-find').style.display = 'block';
                }
                // ... rest of the existing startNewRound function ...
            }
        }

        // Add this to endGame function
        function endGame() {
        }

        // Add this CSS to the existing style element or create a new one
        const style = document.createElement('style');
        style.textContent = `
            .decode-odyssey {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .decode-odyssey:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }

            .rainbow-circles {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }

            @keyframes floatCircle {
                0% { transform: translate(0, 0); opacity: 0; }
                50% { opacity: 0.5; }
                100% { transform: translate(var(--moveX), var(--moveY)); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Add this function to create and animate circles
        function createRainbowCircles() {
            const cards = document.querySelectorAll('.decode-odyssey');
            cards.forEach(card => {
                const circles = card.querySelector('.rainbow-circles');
                if (circles) {
                    const intervalId = setInterval(() => {
                        const circle = document.createElement('div');
                        const size = Math.random() * 50 + 30; // Increased size
                        const colors = [
                            'rgba(255, 0, 0, 0.4)',    // Red with opacity
                            'rgba(255, 127, 0, 0.4)',  // Orange with opacity
                            'rgba(255, 255, 0, 0.4)',  // Yellow with opacity
                            'rgba(0, 255, 0, 0.4)',    // Green with opacity
                            'rgba(0, 0, 255, 0.4)',    // Blue with opacity
                            'rgba(75, 0, 130, 0.4)',   // Indigo with opacity
                            'rgba(139, 0, 255, 0.4)'   // Violet with opacity
                        ];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        
                        circle.style.cssText = `
                            position: absolute;
                            width: ${size}px;
                            height: ${size}px;
                            background: ${color};
                            border-radius: 50%;
                            opacity: 0;
                            pointer-events: none;
                            --moveX: ${(Math.random() - 0.5) * 200}px;
                            --moveY: ${(Math.random() - 0.5) * 200}px;
                            animation: floatCircle 3s ease-out forwards;
                            left: ${Math.random() * 100}%;
                            top: ${Math.random() * 100}%;
                            filter: blur(8px);
                            mix-blend-mode: screen;
                        `;
                        
                        circles.appendChild(circle);
                        setTimeout(() => circle.remove(), 3000);
                    }, 300);

                    // Store the interval ID on the card element
                    card.dataset.circleInterval = intervalId;
                }
            });
        }

        // Add cleanup function
        function cleanupRainbowCircles() {
            const cards = document.querySelectorAll('.decode-odyssey');
            cards.forEach(card => {
                if (card.dataset.circleInterval) {
                    clearInterval(parseInt(card.dataset.circleInterval));
                    delete card.dataset.circleInterval;
                }
            });
        }

        // Modify showMainMenu to properly initialize circles
        function showMainMenu() {
            // ... existing code ...
            
            showGameModes();
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
                cleanupRainbowCircles(); // Clean up any existing circles
                createRainbowCircles(); // Create new circles
            }, 100);
        }

        // Clean up when page is unloaded
        window.addEventListener('unload', cleanupRainbowCircles);

        function skipCountry() {
            if (!isGameActive || gameMode !== 'all') return;
            
            // Add the current country to found countries to skip it
            foundCountries.add(targetCountry);
            
            // Show skipped country in yellow
            geojsonLayer.eachLayer(function(layer) {
                const countryName = layer.feature.properties.ADMIN;
                if (countryName === targetCountry) {
                    layer.setStyle({
                        fillColor: '#f1c40f',  // Yellow color
                        fillOpacity: 0.6,
                        weight: 1,
                        opacity: 1,
                        color: '#2c3e50'
                    });
                }
            });
            
            // Show skip message
            const messageContainer = document.getElementById('message-container');
            messageContainer.textContent = `Skipped ${targetCountry}`;
            messageContainer.className = 'warning-message';
            messageContainer.style.opacity = '1';
            
            setTimeout(() => {
                messageContainer.style.opacity = '0';
                // Start new round after message fades
                startNewRound();
            }, 1500);
        }

        function startGameWithoutRefresh(selectedDifficulty) {
            // Get the selected game mode from localStorage
            const selectedGameMode = localStorage.getItem('selectedGameMode');
            if (selectedGameMode) {
                gameMode = selectedGameMode;
            }

            // Show/hide skip button based on game mode
            const skipButton = document.getElementById('skip-btn');
            if (gameMode === 'all') {
                skipButton.classList.remove('hidden');
                skipButton.style.display = 'block';  // Explicitly set display to block
            } else {
                skipButton.classList.add('hidden');
                skipButton.style.display = 'none';  // Explicitly set display to none
            }

            // Show/hide population mode notice based on game mode
            if (gameMode === 'population') {
                document.getElementById('population-mode-notice').style.display = 'block';
            } else {
                document.getElementById('population-mode-notice').style.display = 'none';
            }

            // Set the difficulty properly
            difficulty = selectedDifficulty;
            localStorage.setItem('selectedDifficulty', selectedDifficulty);
            
            isGameActive = true;
            currentScore = 0;
            correctAttempts = 0;
            incorrectAttempts = 0;
            
            // Hide hint controls and timer by default
            document.querySelector('.hint-controls').style.display = 'none';
            document.getElementById('timer').classList.add('hidden');
            
            document.getElementById('game-overlay').classList.add('hidden');
            document.getElementById('menu-btn').classList.remove('hidden');
            document.getElementById('finish-btn').classList.remove('hidden');
            document.getElementById('feedback-btn').classList.remove('hidden');
            
            // Reset country pools with the correct difficulty
            usedCountries.clear();
            foundCountries.clear();
            availableCountries = [...countries[selectedDifficulty]];
            
            // Initialize map if not already done
            if (!map) {
                initMap();
            }
            
            // Mode-specific initializations
            if (gameMode === 'hints') {
                // ... existing hints mode code ...
            } else if (gameMode === 'streak') {
                // ... existing streak mode code ...
            } else if (gameMode === 'alphabetic') {
                // ... existing alphabetic mode code ...
            } else if (gameMode === 'time') {
                // ... existing time mode code ...
            } else if (gameMode === 'population') {
                // ... existing population mode code ...
            } else if (gameMode === 'all') {
                // Show skip button for Find All Countries mode
                const skipBtn = document.getElementById('skip-btn');
                if (skipBtn) {
                    skipBtn.classList.remove('hidden');
                    skipBtn.style.display = 'inline-block';
                }
                
                // Initialize tutorial for first country
                foundCountries = new Set();
                startNewRound();
                
                // Add tutorial highlight for the first country
                if (targetCountry) {
                    geojsonLayer.eachLayer(function(layer) {
                        if (layer.feature.properties.ADMIN === targetCountry) {
                            layer.bindPopup('<div style="text-align: center; font-weight: bold;">Click me!</div>', {
                                closeButton: false,
                                className: 'tutorial-popup'
                            }).openPopup();
                            layer.setStyle({
                                fillColor: '#f1c40f',
                                fillOpacity: 0.6,
                                color: '#000',
                                weight: 2
                            });
                        }
                    });
                }
            }

            map.setZoom(difficultyZoom[selectedDifficulty]);
        }
    }

    function skipCountry() {
        if (!isGameActive || gameMode !== 'all') return;
        
        // Add the skipped country to foundCountries to prevent it from appearing again
        if (targetCountry) {
            foundCountries.add(targetCountry);
            
            // Show a message indicating the country was skipped
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background-color: rgba(231, 76, 60, 0.95); padding: 20px; border-radius: 10px;
                     box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 1000; text-align: center; color: white;">
                    <div style="font-size: 18px; font-weight: bold;">Skipped ${targetCountry}</div>
                </div>
            `;
            document.body.appendChild(message);
            setTimeout(() => document.body.removeChild(message), 2000);
            
            // Mark the skipped country in gray on the map
            geojsonLayer.eachLayer(function(layer) {
                if (layer.feature.properties.ADMIN === targetCountry) {
                    layer.setStyle({
                        fillColor: '#95a5a6',
                        fillOpacity: 0.6,
                        color: '#000',
                        weight: 1
                    });
                }
            });
            
            // Add a log entry for the skipped country
            const logContent = document.getElementById('log-content');
            if (logContent) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry incorrect';
                logEntry.textContent = `Skipped: ${targetCountry}`;
                logContent.insertBefore(logEntry, logContent.firstChild);
            }
            
            // Update incorrect attempts counter
            incorrectAttempts++;
            updateLogCounters();
            
            // Start a new round
            startNewRound();
        }
    }

    function startGame(difficulty) {
        // Get the current game mode
        const currentMode = gameMode || localStorage.getItem('selectedGameMode');
        console.log('Starting game with mode:', currentMode, 'difficulty:', difficulty); // Debug log
        
        if (!currentMode) {
            console.error('No game mode selected!');
            return;
        }
        
        // Store both mode and difficulty
        localStorage.setItem('selectedGameMode', currentMode);
        localStorage.setItem('selectedDifficulty', difficulty);
        
        // Start the game
        startGameWithoutRefresh(difficulty);
    }

    function showDifficultySelect(mode) {
        // Set and store the game mode
        gameMode = mode;
        localStorage.setItem('selectedGameMode', mode);
        console.log('Setting game mode to:', mode); // Debug log
        
        // Hide game modes and show difficulty selection
        document.getElementById('mode-select-texts').style.display = 'none';
        document.getElementById('game-modes').style.display = 'none';
        document.getElementById('documentation-link').style.display = 'none';
        document.getElementById('difficulty-select').style.display = 'block';
    }

    // Remove any duplicate startGameWithoutRefresh functions
    // Keep only the one that's most complete