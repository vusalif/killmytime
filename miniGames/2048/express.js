const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

app.use(cors());
app.use(express.json());

let scores = [];

app.post('/scores', (req, res) => {
    const { name, score, timestamp } = req.body;
    scores.push({ name, score, timestamp });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep only top 10
    res.json({ success: true });
});

app.get('/scores', (req, res) => {
    res.json(scores);
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '../../404.html'));
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});