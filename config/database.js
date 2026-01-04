const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database bestand pad
const dbPath = path.join(__dirname, '..', 'database.db');

// Maak connectie met de database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fout bij verbinden met database:', err.message);
    } else {
        console.log('✅ Verbonden met SQLite database');
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;
