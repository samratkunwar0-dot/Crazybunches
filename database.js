import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'discord.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            displayName TEXT,
            pfpUrl TEXT,
            bannerColor TEXT DEFAULT '#5c64f2',
            hasNitro BOOLEAN DEFAULT 1,
            role TEXT DEFAULT 'user',
            moderationStatus TEXT DEFAULT 'active'
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS Houses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ownerId INTEGER NOT NULL,
            iconUrl TEXT,
            FOREIGN KEY (ownerId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS Corners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            houseId INTEGER NOT NULL,
            FOREIGN KEY (houseId) REFERENCES Houses(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS Messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cornerId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cornerId) REFERENCES Corners(id),
            FOREIGN KEY (userId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS HouseMembers (
            houseId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            PRIMARY KEY (houseId, userId),
            FOREIGN KEY (houseId) REFERENCES Houses(id),
            FOREIGN KEY (userId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS Friends (
            user1Id INTEGER NOT NULL,
            user2Id INTEGER NOT NULL,
            PRIMARY KEY (user1Id, user2Id),
            FOREIGN KEY (user1Id) REFERENCES Users(id),
            FOREIGN KEY (user2Id) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS Shorts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            youtubeId TEXT NOT NULL,
            uploaderId INTEGER NOT NULL,
            title TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaderId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS ShortLikes (
            shortId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            isLike BOOLEAN NOT NULL,
            PRIMARY KEY (shortId, userId),
            FOREIGN KEY (shortId) REFERENCES Shorts(id),
            FOREIGN KEY (userId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS ShortComments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shortId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shortId) REFERENCES Shorts(id),
            FOREIGN KEY (userId) REFERENCES Users(id)
        )`, (err) => {
      if (err) console.error(err.message);
    });
  }
});

export default db;
