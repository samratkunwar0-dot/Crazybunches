import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from './database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyC0jNlS10juD2X8Hq_1FuRsrXYIJmo1qMo');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    db.run('INSERT INTO Users (username, password, displayName) VALUES (?, ?, ?)', [username, hashedPassword, username], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: 'Username already exists' });
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, userId: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM Users WHERE username = ?', [username], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row && bcrypt.compareSync(password, row.password)) {
            const { password: _, ...user } = row;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    });
});

// ─── User Profile ────────────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, displayName, pfpUrl, bannerColor, hasNitro, role, moderationStatus FROM Users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.patch('/api/user/:id/profile', (req, res) => {
    const { displayName, bannerColor, pfpUrl } = req.body;
    const userId = req.params.id;
    db.run('UPDATE Users SET displayName = ?, bannerColor = ?, pfpUrl = ? WHERE id = ?',
        [displayName, bannerColor, pfpUrl, userId], function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            db.get('SELECT id, username, displayName, pfpUrl, bannerColor, hasNitro, role, moderationStatus FROM Users WHERE id = ?', [userId], (err, row) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true, user: row });
            });
        });
});

// ─── Houses ──────────────────────────────────────────────────────────────────

app.get('/api/houses', (req, res) => {
    db.all('SELECT * FROM Houses', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/houses', (req, res) => {
    const { name, iconUrl, ownerId } = req.body;
    if (!name || !ownerId) return res.status(400).json({ error: 'Name and ownerId are required' });
    db.run('INSERT INTO Houses (name, ownerId, iconUrl) VALUES (?, ?, ?)', [name, ownerId, iconUrl || '🏡'], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        const houseId = this.lastID;
        // Add owner as member
        db.run('INSERT INTO HouseMembers (houseId, userId, role) VALUES (?, ?, ?)', [houseId, ownerId, 'owner']);
        // Create a default corner
        db.run('INSERT INTO Corners (name, houseId) VALUES (?, ?)', ['general', houseId]);
        db.get('SELECT * FROM Houses WHERE id = ?', [houseId], (err, row) => {
            res.json({ success: true, house: row });
        });
    });
});

app.get('/api/houses/:houseId/members', (req, res) => {
    const query = `
        SELECT u.id, u.username, u.displayName, u.pfpUrl, u.bannerColor, u.hasNitro, u.role, u.moderationStatus, hm.role as houseRole
        FROM HouseMembers hm
        JOIN Users u ON hm.userId = u.id
        WHERE hm.houseId = ?`;
    db.all(query, [req.params.houseId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/houses/:houseId/join', (req, res) => {
    const { userId } = req.body;
    db.run('INSERT OR IGNORE INTO HouseMembers (houseId, userId) VALUES (?, ?)', [req.params.houseId, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// ─── Corners ─────────────────────────────────────────────────────────────────

app.get('/api/houses/:houseId/corners', (req, res) => {
    db.all('SELECT * FROM Corners WHERE houseId = ?', [req.params.houseId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/houses/:houseId/corners', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Corner name required' });
    db.run('INSERT INTO Corners (name, houseId) VALUES (?, ?)', [name, req.params.houseId], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.get('SELECT * FROM Corners WHERE id = ?', [this.lastID], (err, row) => {
            res.json({ success: true, corner: row });
        });
    });
});

// ─── Messages ─────────────────────────────────────────────────────────────────

app.get('/api/corners/:cornerId/messages', (req, res) => {
    const query = `
        SELECT m.id, m.content, m.timestamp, u.username, u.displayName, u.hasNitro, u.pfpUrl, u.bannerColor, u.role, u.id as userId
        FROM Messages m
        JOIN Users u ON m.userId = u.id
        WHERE m.cornerId = ?
        ORDER BY m.timestamp ASC`;
    db.all(query, [req.params.cornerId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// ─── Admin / Moderation ───────────────────────────────────────────────────────

app.post('/api/admin/moderation', (req, res) => {
    const { action, targetUserId, duration, adminId } = req.body;
    // Simple role check
    db.get('SELECT role FROM Users WHERE id = ?', [adminId], (err, admin) => {
        if (err || !admin || admin.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: not an admin' });
        }
        let status = 'active';
        if (action === 'ban') status = 'banned';
        if (action === 'timeout') status = 'timeout';
        if (action === 'kick' || action === 'unban' || action === 'untimeout') status = 'active';

        db.run('UPDATE Users SET moderationStatus = ? WHERE id = ?', [status, targetUserId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            // Broadcast moderation event
            io.emit('moderation_action', { action, targetUserId, adminId });
            res.json({ success: true, action, targetUserId });
        });
    });
});

// ─── Shorts Media Feed ────────────────────────────────────────────────────────

app.get('/api/shorts', (req, res) => {
    const userId = req.query.userId;
    const query = `
        SELECT s.id, s.youtubeId, s.title, s.timestamp, u.username, u.displayName, u.pfpUrl, u.bannerColor,
               (SELECT COUNT(*) FROM ShortLikes WHERE shortId = s.id AND isLike = 1) as likes,
               (SELECT COUNT(*) FROM ShortLikes WHERE shortId = s.id AND isLike = 0) as dislikes,
               (SELECT COUNT(*) FROM ShortComments WHERE shortId = s.id) as commentsCount,
               (SELECT isLike FROM ShortLikes WHERE shortId = s.id AND userId = ?) as userInteraction
        FROM Shorts s
        JOIN Users u ON s.uploaderId = u.id
        ORDER BY s.timestamp DESC`;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/shorts', (req, res) => {
    const { url, uploaderId, title } = req.body;
    let youtubeId = '';

    // Extract YouTube Shorts ID
    const match = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&?/]+)/);
    if (match && match[1]) youtubeId = match[1];
    else return res.status(400).json({ error: 'Invalid YouTube URL' });

    db.run('INSERT INTO Shorts (youtubeId, uploaderId, title) VALUES (?, ?, ?)', [youtubeId, uploaderId, title || 'New Short'], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, shortId: this.lastID });
    });
});

app.post('/api/shorts/:id/rate', (req, res) => {
    const { userId, isLike } = req.body;
    const shortId = req.params.id;

    if (isLike === null) {
        db.run('DELETE FROM ShortLikes WHERE shortId = ? AND userId = ?', [shortId, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, state: null });
        });
    } else {
        db.run('INSERT OR REPLACE INTO ShortLikes (shortId, userId, isLike) VALUES (?, ?, ?)', [shortId, userId, isLike], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, state: isLike });
        });
    }
});

app.get('/api/shorts/:id/comments', (req, res) => {
    const query = `
        SELECT c.id, c.content, c.timestamp, u.username, u.displayName, u.pfpUrl, u.bannerColor
        FROM ShortComments c
        JOIN Users u ON c.userId = u.id
        WHERE c.shortId = ?
        ORDER BY c.timestamp DESC`;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/shorts/:id/comments', (req, res) => {
    const { userId, content } = req.body;
    db.run('INSERT INTO ShortComments (shortId, userId, content) VALUES (?, ?, ?)', [req.params.id, userId, content], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Fetch back the new comment with user data
        const query = `SELECT c.id, c.content, c.timestamp, u.username, u.displayName, u.pfpUrl, u.bannerColor
                       FROM ShortComments c JOIN Users u ON c.userId = u.id WHERE c.id = ?`;
        db.get(query, [this.lastID], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, comment: row });
        });
    });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} `);

    socket.on('join_corner', ({ cornerId }) => {
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });
        socket.join(`corner_${cornerId} `);
    });

    socket.on('send_message', (data) => {
        const { cornerId, userId, content } = data;

        // Check moderation status
        db.get('SELECT moderationStatus FROM Users WHERE id = ?', [userId], (err, user) => {
            if (err || !user) return;
            if (user.moderationStatus === 'banned' || user.moderationStatus === 'timeout') {
                socket.emit('moderation_blocked', { message: `You are currently ${user.moderationStatus} and cannot send messages.` });
                return;
            }

            db.run('INSERT INTO Messages (cornerId, userId, content) VALUES (?, ?, ?)', [cornerId, userId, content], function (err) {
                if (err) { console.error('Error saving message:', err.message); return; }
                const msgId = this.lastID;
                const query = `
                    SELECT m.id, m.content, m.timestamp, u.username, u.displayName, u.hasNitro, u.pfpUrl, u.bannerColor, u.role, u.id as userId
                    FROM Messages m JOIN Users u ON m.userId = u.id WHERE m.id = ? `;

                db.get(query, [msgId], (err, row) => {
                    if (err) return;
                    io.to(`corner_${cornerId} `).emit('receive_message', row);

                    // /Ask bot command
                    if (content.startsWith('/Ask ')) {
                        const question = content.slice(5);
                        db.get('SELECT id FROM Users WHERE username = ?', ['AntigravityBot'], async (err, bot) => {
                            if (err || !bot) return;

                            let aiResponse = '';
                            try {
                                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                                const result = await model.generateContent(`You are AntigravityBot, a helpful AI assistant in a Discord clone.Answer the user's question concisely: ${question}`);
                                aiResponse = result.response.text();
                            } catch (e) {
                                console.error('Gemini error:', e);
                                aiResponse = "⚠️ Sorry, I encountered an error connecting to my AI brain.";
                            }

                            const botReply = `🤖 **Answering:** "${question}"\n\n${aiResponse}`;

                            setTimeout(() => {
                                db.run('INSERT INTO Messages (cornerId, userId, content) VALUES (?, ?, ?)', [cornerId, bot.id, botReply], function (err) {
                                    if (err) return;
                                    db.get(query, [this.lastID], (err, botRow) => {
                                        if (botRow) io.to(`corner_${cornerId}`).emit('receive_message', botRow);
                                    });
                                });
                            }, 500); // Slight delay for realism
                        });
                    }
                });
            });
        });
    });

    socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
