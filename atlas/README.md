# 🌍 Atlas - Interactive Geography Learning Games

A collection of interactive geography games built with HTML, CSS, and JavaScript using Leaflet maps.

## 🎮 Game Modes

- **Population Mode**: Guess countries based on population data
- **Playground Mode**: Free exploration mode
- **Time Mode**: Race against time to identify countries
- **Hint Mode**: Get hints to identify countries
- **Football Mode**: Football-themed geography challenges
- **Duel Mode**: 1v1 competitive country guessing

## 🚀 Deploy Online (Make it Playable)

### Option 1: GitHub Pages (Recommended - Free)

1. **Create a GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Atlas Geography Games"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/atlas-geography.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

3. **Your game will be available at:**
   ```
   https://YOUR_USERNAME.github.io/atlas-geography/
   ```

### Option 2: Netlify (Free)

1. **Drag and drop your folder to [netlify.com](https://netlify.com)**
2. **Get instant live URL**
3. **Custom domain available**

### Option 3: Vercel (Free)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

## 📁 File Structure

```
atlas/
├── index.html          # Main menu
├── population.html     # Population mode
├── playground.html     # Playground mode
├── time.html          # Time mode
├── hint.html          # Hint mode
├── football.html      # Football mode
├── duel.html          # Duel mode (NEW!)
├── countries.geojson  # Country data
├── gifs/              # Game previews
└── README.md          # This file
```

## 🎯 Duel Mode Features

- **1v1 Competitive Gameplay**: Two players compete on the same map
- **Randomized Countries**: Each player gets different countries to identify
- **Visual Distinction**: Red (Player 1) vs Blue (Player 2) color scheme
- **Turn-based Play**: Players alternate after each guess
- **1-minute Timer**: Fast-paced competitive action
- **Score Tracking**: Real-time score updates
- **Winner Determination**: Player with most correct guesses wins

## 🔧 Requirements

- Modern web browser
- Internet connection (for map tiles)
- `countries.geojson` file in the same directory

## 🌟 Features

- Interactive world map using Leaflet
- Responsive design for mobile and desktop
- Dark/light theme support
- Touch-friendly controls
- Real-time game statistics
- Beautiful animations and feedback

## 📱 Mobile Support

- Touch-optimized controls
- Responsive design
- Works on all devices

## 🎨 Customization

- Easy to modify colors and themes
- Add new game modes
- Custom country datasets
- Personalized hints and challenges

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to contribute new game modes, improvements, or bug fixes!

---

**Play Now**: [Your deployed URL will be here]
**Source Code**: [Your GitHub repository URL]
