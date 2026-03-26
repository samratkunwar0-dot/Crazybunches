import db from './database.js';
import bcrypt from 'bcryptjs';

const initialUsers = [
    { username: 'chhewang', displayName: 'Chhewang', role: 'user', bannerColor: '#ff4444' },
    { username: 'aadesh', displayName: 'Aadesh', role: 'user', bannerColor: '#44ff44' },
    { username: 'pranesh', displayName: 'Pranesh', role: 'user', bannerColor: '#4444ff' },
    { username: 'samrat', displayName: 'Samrat', role: 'admin', bannerColor: '#ffff44' },
    { username: 'aarush', displayName: 'Aarush', role: 'user', bannerColor: '#ff44ff' },
    { username: 'AntigravityBot', displayName: 'Antigravity Bot', role: 'bot', bannerColor: '#00ffff' }
];

const initialHouses = [
    { name: 'General House', icon: 'bx-home' },
    { name: 'Gaming Zone', icon: 'bx-game' },
    { name: 'Dev Corner', icon: 'bx-code-alt' }
];

const initialCorners = [
    { name: 'Lobby', houseIndex: 0 },
    { name: 'Chill Room', houseIndex: 0 },
    { name: 'Mobile Legends', houseIndex: 1 },
    { name: 'Roblox', houseIndex: 1 },
    { name: 'Code Help', houseIndex: 2 },
    { name: 'Project Ideas', houseIndex: 2 }
];

setTimeout(() => {
    db.serialize(() => {
        // Clear existing data (mostly redundant if deleting sqlite file, but safe)
        db.run('DELETE FROM Users');
        db.run('DELETE FROM Houses');
        db.run('DELETE FROM Corners');
        db.run('DELETE FROM Messages');
        db.run('DELETE FROM HouseMembers');
        db.run('DELETE FROM Friends');
        db.run('DELETE FROM Shorts');
        db.run('DELETE FROM ShortLikes');
        db.run('DELETE FROM ShortComments');

        // 1. Insert Users
        const insertUser = db.prepare('INSERT INTO Users (username, password, displayName, role, bannerColor) VALUES (?, ?, ?, ?, ?)');
        for (const user of initialUsers) {
            const passwordPlain = user.username + "123";
            const salt = bcrypt.genSaltSync(10);
            const hashedPass = bcrypt.hashSync(passwordPlain, salt);
            insertUser.run(user.username, hashedPass, user.displayName, user.role, user.bannerColor);
        }
        insertUser.finalize();

        // 2. Insert Houses and Corners
        db.all('SELECT id, username FROM Users', [], (err, userRows) => {
            if (err) return console.error(err);
            const adminId = userRows.find(u => u.username === 'samrat')?.id;

            const houseIds = [];
            const insertHouse = db.prepare('INSERT INTO Houses (name, ownerId, iconUrl) VALUES (?, ?, ?)', function (err) {
                if (err) console.error(err);
            });

            initialHouses.forEach((house, index) => {
                db.run('INSERT INTO Houses (name, ownerId, iconUrl) VALUES (?, ?, ?)', [house.name, adminId, house.icon], function (err) {
                    if (err) return console.error(err);
                    const houseId = this.lastID;

                    // Insert Corners for this house
                    initialCorners.filter(c => c.houseIndex === index).forEach(corner => {
                        db.run('INSERT INTO Corners (name, houseId) VALUES (?, ?)', [corner.name, houseId]);
                    });

                    // Add all users to this house
                    userRows.forEach(user => {
                        db.run('INSERT INTO HouseMembers (houseId, userId, role) VALUES (?, ?, ?)', [houseId, user.id, user.username === 'samrat' ? 'owner' : 'member']);
                    });
                });
            });

            // 3. Seed Friends
            const userIds = userRows.map(r => r.id);
            const insertFriend = db.prepare('INSERT INTO Friends (user1Id, user2Id) VALUES (?, ?)');
            for (let i = 0; i < userIds.length; i++) {
                for (let j = i + 1; j < userIds.length; j++) {
                    insertFriend.run(userIds[i], userIds[j]);
                    insertFriend.run(userIds[j], userIds[i]);
                }
            }
            insertFriend.finalize();
        });

        console.log('Database restructured and seeded successfully.');
    });

    // Give SQLite a moment to finish async ops before closing
    setTimeout(() => {
        db.close();
    }, 1000);
}, 500);
