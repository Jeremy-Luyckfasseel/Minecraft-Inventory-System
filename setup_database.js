const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database bestand pad (root van project)
const dbPath = path.join(__dirname, 'database.db');

// Maak nieuwe connectie
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fout bij aanmaken database:', err.message);
        process.exit(1);
    }
    console.log('📦 Database connectie geopend...');
});

// Serialize zorgt ervoor dat queries in volgorde worden uitgevoerd
db.serialize(() => {
    console.log('\n🗑️  Oude tabellen verwijderen...');
    
    // DROP TABLES (items eerst vanwege foreign key)
    db.run('DROP TABLE IF EXISTS items', (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Items tabel verwijderd');
    });
    
    db.run('DROP TABLE IF EXISTS players', (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Players tabel verwijderd');
    });

    console.log('\n🔨 Nieuwe tabellen aanmaken...');
    
    // CREATE PLAYERS TABLE
    db.run(`
        CREATE TABLE players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gamemode TEXT NOT NULL CHECK(gamemode IN ('survival', 'creative', 'adventure', 'spectator')),
            level INTEGER NOT NULL DEFAULT 1,
            email TEXT UNIQUE NOT NULL
        )
    `, (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Players tabel aangemaakt');
    });

    // CREATE ITEMS TABLE
    db.run(`
        CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 1,
            durability INTEGER NOT NULL DEFAULT 100,
            player_id INTEGER NOT NULL,
            FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Items tabel aangemaakt');
    });

    console.log('\n🌱 Dummy data invoegen...');

    // INSERT PLAYERS
    const players = [
        { name: 'Steve', gamemode: 'survival', level: 25, email: 'steve@minecraft.net' },
        { name: 'Alex', gamemode: 'creative', level: 50, email: 'alex@minecraft.net' },
        { name: 'Herobrine', gamemode: 'spectator', level: 99, email: 'herobrine@minecraft.net' }
    ];

    const insertPlayer = db.prepare('INSERT INTO players (name, gamemode, level, email) VALUES (?, ?, ?, ?)');
    
    players.forEach(player => {
        insertPlayer.run(player.name, player.gamemode, player.level, player.email);
    });
    
    insertPlayer.finalize(() => {
        console.log('   ✓ 3 spelers toegevoegd');
    });

    // INSERT ITEMS
    const items = [
        // Steve's items (player_id: 1)
        { name: 'Diamond Sword', amount: 1, durability: 85, player_id: 1 },
        { name: 'Iron Pickaxe', amount: 1, durability: 45, player_id: 1 },
        { name: 'Torch', amount: 64, durability: 100, player_id: 1 },
        { name: 'Cooked Steak', amount: 32, durability: 100, player_id: 1 },
        
        // Alex's items (player_id: 2)
        { name: 'Diamond Block', amount: 64, durability: 100, player_id: 2 },
        { name: 'Golden Apple', amount: 16, durability: 100, player_id: 2 },
        { name: 'Elytra', amount: 1, durability: 95, player_id: 2 },
        
        // Herobrine's items (player_id: 3)
        { name: 'Netherite Sword', amount: 1, durability: 100, player_id: 3 },
        { name: 'Enchanted Book', amount: 5, durability: 100, player_id: 3 },
        { name: 'End Crystal', amount: 4, durability: 100, player_id: 3 }
    ];

    const insertItem = db.prepare('INSERT INTO items (name, amount, durability, player_id) VALUES (?, ?, ?, ?)');
    
    items.forEach(item => {
        insertItem.run(item.name, item.amount, item.durability, item.player_id);
    });
    
    insertItem.finalize(() => {
        console.log('   ✓ 10 items toegevoegd');
    });
});

// Sluit database connectie
db.close((err) => {
    if (err) {
        console.error('❌ Fout bij sluiten database:', err.message);
    } else {
        console.log('\n✅ Database setup voltooid!');
        console.log('📁 Database bestand: database.db');
        console.log('\n🚀 Je kunt nu de server starten met: npm start\n');
    }
});
