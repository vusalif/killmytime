// Initialize Supabase client
const supabaseUrl = 'https://rcagbgmdmuoxvziumqrx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYWdiZ21kbXVveHZ6aXVtcXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTczNjksImV4cCI6MjA1MDUzMzM2OX0.jw60EiOrxG8_Ou8RkWaVOoZxqo-Ky6vMrQ9S5ftl18w';
const supabaseClient = window.createClient(supabaseUrl, supabaseKey);

const galleryGrid = document.getElementById('gallery-grid');

// Get the highlighted animation ID from URL
const urlParams = new URLSearchParams(window.location.search);
const highlightId = urlParams.get('highlight');

// Create placeholder SVG
const placeholderSVG = `
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">
        Failed to load animation
    </text>
</svg>
`;
const placeholderImage = 'data:image/svg+xml;base64,' + btoa(placeholderSVG);

async function loadGallery() {
    try {
        // Fetch animations from Supabase
        const { data: animations, error } = await supabaseClient
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Fetched animations:', animations.map(a => ({
            id: a.id,
            author: a.author_name,
            created: a.created_at,
            dataLength: a.animation_data?.length || 0,
            dataPreview: a.animation_data?.substring(0, 50) + '...'
        })));

        // Clear existing content
        galleryGrid.innerHTML = '';

        // Display animations
        animations.forEach(animation => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            // Add highlight class if this is the newly added animation
            if (highlightId && animation.id === parseInt(highlightId)) {
                item.classList.add('highlight');
                // Scroll into view with smooth animation
                setTimeout(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
            
            const img = document.createElement('img');
            
            // Handle the animation data
            try {
                let imageData = animation.animation_data;
                console.log('Processing animation:', animation.id, 'Data:', {
                    length: imageData?.length || 0,
                    preview: imageData?.substring(0, 50) + '...',
                    isDataUrl: imageData?.startsWith('data:'),
                    isGif: imageData?.includes('image/gif')
                });
                
                // Check if it's a valid data URL
                if (imageData && !imageData.startsWith('data:image/gif;base64,')) {
                    console.error('Invalid data URL format for animation:', animation.id);
                    imageData = placeholderImage;
                }
                
                // Set the image source
                img.src = imageData || placeholderImage;
                console.log('Set image source for animation:', animation.id, 'Length:', img.src.length);
            } catch (e) {
                console.error('Error processing animation data:', animation.id, e);
                img.src = placeholderImage;
            }
            
            img.alt = `Online Sketchbook Drawing - ${animation.author_name}'s Artwork on Kill My Time Gaming Platform`;
            img.onerror = () => {
                console.error('Failed to load image:', animation.id, 'Source length:', img.src.length);
                img.src = placeholderImage;
            };
            
            const title = document.createElement('h3');
            title.textContent = animation.author_name;
            
            const date = document.createElement('p');
            date.textContent = new Date(animation.created_at).toLocaleDateString();
            
            item.appendChild(img);
            item.appendChild(title);
            item.appendChild(date);
            
            // Add click handler to view animation in full size
            img.addEventListener('click', () => {
                if (img.src === placeholderImage) return; // Don't show modal for placeholder
                
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal">
                        <img src="${img.src}" alt="${img.alt}" style="max-width: 90vw; max-height: 90vh;">
                        <button class="close-button">Close</button>
                    </div>
                `;
                document.body.appendChild(modal);
                
                modal.querySelector('.close-button').onclick = () => {
                    modal.remove();
                };
                
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                };
            });
            
            galleryGrid.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryGrid.innerHTML = '<p>Failed to load animations. Please try again later.</p>';
    }
}

// Add CSS for highlighted animation
const style = document.createElement('style');
style.textContent = `
    .gallery-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
        cursor: pointer;
        margin: 10px;
        flex: 0 1 calc(33.333% - 20px);
        max-width: calc(33.333% - 20px);
        box-sizing: border-box;
    }

    .gallery-item:hover {
        transform: translateY(-5px);
    }

    .gallery-item img {
        width: 100%;
        height: 300px;
        object-fit: contain;
        border-radius: 4px;
        background: #f5f5f5;
    }

    .gallery-item h3 {
        margin: 10px 0 5px;
        font-size: 1.2em;
        color: #333;
    }

    .gallery-item p {
        margin: 5px 0;
        color: #666;
    }

    .gallery-item.highlight {
        animation: highlight 2s ease-in-out;
        border: 3px solid #4CAF50;
    }

    @keyframes highlight {
        0% { transform: scale(1); box-shadow: 0 0 0 rgba(76, 175, 80, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
        100% { transform: scale(1); box-shadow: 0 0 0 rgba(76, 175, 80, 0.5); }
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        padding: 20px;
        border-radius: 8px;
        position: relative;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .close-button:hover {
        background: #ff6666;
    }

    #gallery-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 20px;
        padding: 20px;
    }
`;
document.head.appendChild(style);

// Load gallery when page loads
loadGallery(); 