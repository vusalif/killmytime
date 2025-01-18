
class GameCardGifManager {
    constructor() {
        // Object to store GIF arrays for each category
        this.categoryGifs = {
            'movies': [
                'https://media.giphy.com/media/MC6eSuC3yypCU/giphy.gif',
                'https://media.giphy.com/media/MRxJqmk3MNta8/giphy.gif',
                'https://media.giphy.com/media/9UqRcQHzBou6A/giphy.gif',
                'https://media.giphy.com/media/J3NqKdCRBcQIU/giphy.gif',
                'https://media.giphy.com/media/cAHfy7VD1uHdK/giphy.gif'
            ],
            'football-clubs': [
                'https://media.giphy.com/media/Gpdjylm2smPjMCyZnw/giphy.gif',
                'https://media.giphy.com/media/rD7muVnfEQXKm3rvqN/giphy.gif',
                'https://media.giphy.com/media/96O1r1dNPEkwb3O213/giphy.gif',
                'https://media.giphy.com/media/ldqRW1zhhoFIUt520Z/giphy.gif',
                'https://media.giphy.com/media/JnUywhEhFhQUfZu666/giphy.gif',
                'https://media.giphy.com/media/IBr8z0tgPTCe8LLb2a/giphy.gif',
                'https://media.giphy.com/media/cXsBeK5btALAZIb0j8/giphy.gif',
                'https://media.giphy.com/media/JpdOuEmnjbi6o4OZAW/giphy.gif',
                'https://media.giphy.com/media/egSM7qZZYu9qw/giphy.gif',
                'https://media.giphy.com/media/mCSi3dr4vbCNO/giphy.gif',
                'https://media.giphy.com/media/9Pguy3d4ivtzu1XjsJ/giphy.gif',
                'https://media.giphy.com/media/vNEyIKNGgjKg/giphy.gif',
                'https://media.giphy.com/media/26FfgZCMWCLknHPAA/giphy.gif',
                'https://media.giphy.com/media/VWKqDoZmaHggo/giphy.gif',
                'https://media.giphy.com/media/jgR4DmFkjWOkuDeHzl/giphy.gif'
            ],
            'countries': [
                'https://media.giphy.com/media/UDZLeuSYv17KwPPxIq/giphy.gif',
                'https://media.giphy.com/media/SG5uQFsu7v0BflB8em/giphy.gif',
                'https://media.giphy.com/media/joeXDzWKhoZkiOlVeb/giphy.gif'
            ],
            'brands': [
                'https://media.giphy.com/media/iZWmYYWx0jBKZTkPXo/giphy.gif',
                'https://media.giphy.com/media/JyqmeSeG8US1UCuGDZ/giphy.gif',
                'https://media.giphy.com/media/SmWIdP3qEiZ2OweuU7/giphy.gif',
                'https://media.giphy.com/media/ThsSNjbxntlsY/giphy.gif'
            ],
            'games': [
                'https://media.giphy.com/media/SxbKaiyvFlXTwCQ2Ph/giphy.gif',
                'https://media.giphy.com/media/r2TVE1YWUZZy51A2tE/giphy.gif',
                'https://media.giphy.com/media/pkshuOzWpo9LG/giphy.gif',
                'https://media.giphy.com/media/ciQqMS4vcJZ4iZNpQl/giphy.gif',
                'https://media.giphy.com/media/hbNwVzTBwOkyB1lnPP/giphy.gif',
                'https://media.giphy.com/media/xBpdA8V62NNb6pkHBA/giphy.gif',
                'https://media.giphy.com/media/WqNmbi4La3IJg9PhcR/giphy.gif',
                'https://media.giphy.com/media/3oKIPnZGBWgVyqs3hm/giphy.gif'
            ],
            'books': [
                'https://media.giphy.com/media/AbuQeC846WKOs/giphy.gif',
                'https://media.giphy.com/media/3o7btW1Js39uJ23LAA/giphy.gif',
                'https://media.giphy.com/media/RgfrnHq2E87MYiAMeu/giphy.gif',
                'https://media.giphy.com/media/uDj0Fa3q8ipBS/giphy.gif',
                'https://media.giphy.com/media/QYYOUQJRcCGli/giphy.gif'
            ],
            'series': [
                'https://media.giphy.com/media/evp572k8wUVgcx1IkU/giphy.gif',
                'https://media.giphy.com/media/WIAxZtUxUY000/giphy.gif',
                'https://media.giphy.com/media/NXOF5rlaSXdAc/giphy.gif',
                'https://media.giphy.com/media/R3S6MfUoKvBVS/giphy.gif',
                'https://media.giphy.com/media/Yl8pfUmelpZMA/giphy.gif',
                'https://media.giphy.com/media/JUMnanXmQakoEE4b8m/giphy.gif',
                'https://media.giphy.com/media/S2u9Ldmx480O4/giphy.gif',
                'https://media.giphy.com/media/7wfWIcQyj2F68vmd18/giphy.gif',
                'https://media.giphy.com/media/typKusPD9nLDq/giphy.gif',
                'https://media.giphy.com/media/3o7TKRIo0WSvarDEPe/giphy.gif',
                'https://media.giphy.com/media/DTh1K6VuivY0gEuzWy/giphy.gif',
                'https://media.giphy.com/media/xTiN0MYLlSdVb6lw9W/giphy.gif',
                'https://media.giphy.com/media/xT9IggwStckcpja6d2/giphy.gif'
            ],
            'football-players': [
                'https://media.giphy.com/media/14csEbsxgASlZm/giphy.gif',
                'https://media.giphy.com/media/r1IMdmkhUcpzy/giphy.gif',
                'https://media.giphy.com/media/e7KWKwP5ukyUd5MFxL/giphy.gif',
                'https://media.giphy.com/media/fobo694eTN0ObrLF2l/giphy.gif',
                'https://media.giphy.com/media/GbCbHijjwtyMHfukpo/giphy.gif',
                'https://media.giphy.com/media/gzoOh4SkStpZQxZTzG/giphy.gif',
                'https://media.giphy.com/media/YaQvsZver3HArBFLtr/giphy.gif',
                'https://media.giphy.com/media/TtmrCo7zJDKSb3oawx/giphy.gif',
                'https://media.giphy.com/media/gwnV0swPFofUx09wTl/giphy.gif',
                'https://media.giphy.com/media/Nm9cjy2xI67TZnGYCd/giphy.gif',
                'https://media.giphy.com/media/AJbRzaA2l2fIs/giphy.gif',
                'https://media.giphy.com/media/xT1XH20RPY6rBmMBLa/giphy.gif',
                'https://media.giphy.com/media/l0HlUhhYa6Z2L9yo0/giphy.gif',
                'https://media.giphy.com/media/TIAdvu16QOtg591u29/giphy.gif',
                'https://media.giphy.com/media/ZvK4xbywt2uPcxqjTn/giphy.gif',
                'https://media.giphy.com/media/X6soHuQWUKxPR0PkgO/giphy.gif'
            ]
        };
    }

    getRandomGif(category) {
        const gifs = this.categoryGifs[category];
        if (!gifs || gifs.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * gifs.length);
        return gifs[randomIndex];
    }
}

class HomeScreen {
    constructor() {
        this.initializeCircles();
        this.setupEventListeners();
        this.loadStats();
        this.gifManager = new GameCardGifManager();
        this.gameData = [
            {
                title: "Movies",
                description: "Guess movies from emoji combinations",
                image: "images/movies.png",
                mode: "movies"
            },
            {
                title: "Football Clubs",
                description: "Test your knowledge of football clubs",
                image: "images/footballteams.png",
                mode: "football-clubs"
            },
            {
                title: "Countries",
                description: "Identify countries through emojis",
                image: "images/countriesflags.jpg",
                mode: "countries"
            },
            {
                title: "Series",
                description: "Popular TV series in emoji form",
                image: "images/tvseries.jpg",
                mode: "series"
            },
            {
                title: "Football Players",
                description: "Guess the football players",
                image: "images/footballplayers.jpeg",
                mode: "football-players"
            },
            {
                title: "Games",
                description: "Video game titles in emoji form",
                image: "images/games.jpg",
                mode: "games"
            },
            {
                title: "Books",
                description: "Famous books and literary works",
                image: "images/books.jpeg",
                mode: "books"
            },
            {
                title: "Brands",
                description: "Popular brands and tech gadgets",
                image: "images/brands.webp",
                mode: "brands"
            }
        ];
    }

    initializeCircles() {
        const container = document.querySelector('.circle-container');
        container.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            const circle = document.createElement('div');
            circle.className = 'circle';
            
            const size = Math.random() * 200 + 100 + 'px';
            circle.style.width = size;
            circle.style.height = size;
            
            circle.style.left = Math.random() * 100 + '%';
            circle.style.top = Math.random() * 100 + '%';
            
            circle.style.backgroundColor = this.getRandomColor();
            
            circle.style.animationDelay = `${i * -2}s`;
            circle.style.animationDuration = `${20 + i * 5}s`;
            
            container.appendChild(circle);
        }
    }

    getRandomColor() {
        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupEventListeners() {
        // Play button
        document.querySelector('.play-button').addEventListener('click', () => {
            this.showGameSelection();
        });

        // Update mouse move handler for play button
        const playButton = document.querySelector('.play-button');
        
        const updateCoordinates = (e) => {
            const rect = playButton.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            requestAnimationFrame(() => {
                playButton.style.setProperty('--x', `${x}px`);
                playButton.style.setProperty('--y', `${y}px`);
            });
        };

        playButton.addEventListener('mousemove', updateCoordinates);
        playButton.addEventListener('mouseenter', updateCoordinates);
        
        playButton.addEventListener('mouseleave', () => {
            playButton.style.removeProperty('--x');
            playButton.style.removeProperty('--y');
        });

        // Make all children non-interactive for the hover effect
        playButton.querySelectorAll('*').forEach(child => {
            child.style.pointerEvents = 'none';
        });

        // Category headers click handler
        document.querySelectorAll('.category-header.clickable').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.dataset.category;
                const content = document.querySelector(`[data-category-content="${category}"]`);
                const wasActive = header.classList.contains('active');

                // Close all categories first
                document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));
                document.querySelectorAll('.filter-options').forEach(o => {
                    o.classList.remove('show');
                    o.innerHTML = ''; // Clear previous content
                });

                // Toggle clicked category
                if (!wasActive) {
                    header.classList.add('active');
                    content.classList.add('show');
                    
                    // Display games for this category
                    const games = this.gameData[category];
                    if (games) {
                        games.forEach(game => {
                            content.appendChild(this.createGameCard(game));
                        });
                    }
                }
            });
        });

        // All Categories button handler
        const allCategoriesBtn = document.querySelector('.all-categories .filter-option');
        if (allCategoriesBtn) {
            allCategoriesBtn.addEventListener('click', () => {
                // Clear any open categories
                document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));
                document.querySelectorAll('.filter-options').forEach(o => {
                    o.classList.remove('show');
                    o.innerHTML = '';
                });

                // Show all games in the grid
                this.updateGamesDisplay();
            });
        }

        // Filter options click handler
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-option').forEach(opt => 
                    opt.classList.remove('active'));
                e.target.classList.add('active');
                this.updateGamesDisplay();
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    loadStats() {
        // Load stats from localStorage
        const bestScore = localStorage.getItem('bestScore') || 0;
        const gamesPlayed = localStorage.getItem('gamesPlayed') || 0;

        document.getElementById('bestScore').textContent = bestScore;
        document.getElementById('gamesPlayed').textContent = gamesPlayed;
    }

    showGameSelection() {
        const homeBox = document.querySelector('.home-box');
        const gameSelection = document.querySelector('.game-selection-container');
        
        homeBox.classList.add('disabled');
        gameSelection.style.display = 'block';
        
        // Display all games
        this.updateGamesDisplay();
    }

    updateGamesDisplay() {
        const gamesGrid = document.getElementById('gamesGrid');
        gamesGrid.innerHTML = '';

        this.gameData.forEach(game => {
            gamesGrid.appendChild(this.createGameCard(game));
        });
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.category = game.mode;
        
        // Get random GIF for the category if available
        const randomGif = this.gifManager.getRandomGif(game.mode);
        
        if (randomGif) {
            // Create and add GIF background
            const gifBackground = document.createElement('div');
            gifBackground.className = 'gif-background';
            gifBackground.style.backgroundImage = `url(${randomGif})`;
            card.appendChild(gifBackground);
        } else {
            // Fallback to static image if no GIF available
            const img = document.createElement('img');
            img.src = game.image;
            img.alt = game.title;
            img.onerror = () => {
                console.log(`Failed to load image: ${game.image}`);
                img.src = 'images/default-game.jpg';
            };
            card.appendChild(img);
        }

        // Create title element
        const title = document.createElement('h3');
        title.textContent = game.title;
        card.appendChild(title);
        
        // Add click event with proper URL parameters
        card.addEventListener('click', () => {
            const params = new URLSearchParams({
                mode: game.mode,
                title: game.title
            });
            window.location.href = `index.html?${params.toString()}`;
        });
        
        return card;
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomeScreen();
}); 