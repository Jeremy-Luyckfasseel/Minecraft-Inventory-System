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
    
    // DROP TABLES (inventory eerst vanwege foreign key)
    db.run('DROP TABLE IF EXISTS inventory');
    db.run('DROP TABLE IF EXISTS items'); // Legacy cleanup
    db.run('DROP TABLE IF EXISTS item_catalog');
    db.run('DROP TABLE IF EXISTS players', () => {
        console.log('   ✓ Alle tabellen verwijderd');
    });

    console.log('\n🔨 Nieuwe tabellen aanmaken...');
    
    // CREATE PLAYERS TABLE
    db.run(`
        CREATE TABLE players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gamemode TEXT NOT NULL CHECK(gamemode IN ('survival', 'creative', 'adventure', 'spectator')),
            level INTEGER NOT NULL DEFAULT 1,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Players tabel aangemaakt');
    });

    // CREATE ITEM_CATALOG TABLE (The Definitions)
    db.run(`
        CREATE TABLE item_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL DEFAULT 'misc',
            stack_limit INTEGER NOT NULL DEFAULT 64,
            max_durability INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Item Catalog tabel aangemaakt');
    });

    // CREATE INVENTORY TABLE (The Instances)
    db.run(`
        CREATE TABLE inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            catalog_id INTEGER NOT NULL,
            amount INTEGER NOT NULL DEFAULT 1,
            current_durability INTEGER,
            enchantments TEXT DEFAULT '[]',
            metadata TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
            FOREIGN KEY (catalog_id) REFERENCES item_catalog(id)
        )
    `, (err) => {
        if (err) console.error(err.message);
        else console.log('   ✓ Inventory tabel aangemaakt');
    });

    console.log('\n🌱 Item Catalog seeden...');

    // SEED ITEM CATALOG
    const catalogItems = [
        // ===== TOOLS: SWORDS =====
        { name: 'Wooden Sword', slug: 'wooden_sword', category: 'weapon', stack_limit: 1, max_durability: 59 },
        { name: 'Stone Sword', slug: 'stone_sword', category: 'weapon', stack_limit: 1, max_durability: 131 },
        { name: 'Iron Sword', slug: 'iron_sword', category: 'weapon', stack_limit: 1, max_durability: 250 },
        { name: 'Golden Sword', slug: 'golden_sword', category: 'weapon', stack_limit: 1, max_durability: 32 },
        { name: 'Diamond Sword', slug: 'diamond_sword', category: 'weapon', stack_limit: 1, max_durability: 1561 },
        { name: 'Netherite Sword', slug: 'netherite_sword', category: 'weapon', stack_limit: 1, max_durability: 2031 },
        
        // ===== TOOLS: PICKAXES =====
        { name: 'Wooden Pickaxe', slug: 'wooden_pickaxe', category: 'tool', stack_limit: 1, max_durability: 59 },
        { name: 'Stone Pickaxe', slug: 'stone_pickaxe', category: 'tool', stack_limit: 1, max_durability: 131 },
        { name: 'Iron Pickaxe', slug: 'iron_pickaxe', category: 'tool', stack_limit: 1, max_durability: 250 },
        { name: 'Golden Pickaxe', slug: 'golden_pickaxe', category: 'tool', stack_limit: 1, max_durability: 32 },
        { name: 'Diamond Pickaxe', slug: 'diamond_pickaxe', category: 'tool', stack_limit: 1, max_durability: 1561 },
        { name: 'Netherite Pickaxe', slug: 'netherite_pickaxe', category: 'tool', stack_limit: 1, max_durability: 2031 },
        
        // ===== TOOLS: AXES =====
        { name: 'Wooden Axe', slug: 'wooden_axe', category: 'tool', stack_limit: 1, max_durability: 59 },
        { name: 'Stone Axe', slug: 'stone_axe', category: 'tool', stack_limit: 1, max_durability: 131 },
        { name: 'Iron Axe', slug: 'iron_axe', category: 'tool', stack_limit: 1, max_durability: 250 },
        { name: 'Golden Axe', slug: 'golden_axe', category: 'tool', stack_limit: 1, max_durability: 32 },
        { name: 'Diamond Axe', slug: 'diamond_axe', category: 'tool', stack_limit: 1, max_durability: 1561 },
        { name: 'Netherite Axe', slug: 'netherite_axe', category: 'tool', stack_limit: 1, max_durability: 2031 },
        
        // ===== TOOLS: SHOVELS =====
        { name: 'Wooden Shovel', slug: 'wooden_shovel', category: 'tool', stack_limit: 1, max_durability: 59 },
        { name: 'Stone Shovel', slug: 'stone_shovel', category: 'tool', stack_limit: 1, max_durability: 131 },
        { name: 'Iron Shovel', slug: 'iron_shovel', category: 'tool', stack_limit: 1, max_durability: 250 },
        { name: 'Golden Shovel', slug: 'golden_shovel', category: 'tool', stack_limit: 1, max_durability: 32 },
        { name: 'Diamond Shovel', slug: 'diamond_shovel', category: 'tool', stack_limit: 1, max_durability: 1561 },
        { name: 'Netherite Shovel', slug: 'netherite_shovel', category: 'tool', stack_limit: 1, max_durability: 2031 },
        
        // ===== TOOLS: HOES =====
        { name: 'Wooden Hoe', slug: 'wooden_hoe', category: 'tool', stack_limit: 1, max_durability: 59 },
        { name: 'Stone Hoe', slug: 'stone_hoe', category: 'tool', stack_limit: 1, max_durability: 131 },
        { name: 'Iron Hoe', slug: 'iron_hoe', category: 'tool', stack_limit: 1, max_durability: 250 },
        { name: 'Golden Hoe', slug: 'golden_hoe', category: 'tool', stack_limit: 1, max_durability: 32 },
        { name: 'Diamond Hoe', slug: 'diamond_hoe', category: 'tool', stack_limit: 1, max_durability: 1561 },
        { name: 'Netherite Hoe', slug: 'netherite_hoe', category: 'tool', stack_limit: 1, max_durability: 2031 },
        
        // ===== ARMOR: HELMETS =====
        { name: 'Leather Helmet', slug: 'leather_helmet', category: 'armor', stack_limit: 1, max_durability: 55 },
        { name: 'Chainmail Helmet', slug: 'chainmail_helmet', category: 'armor', stack_limit: 1, max_durability: 165 },
        { name: 'Iron Helmet', slug: 'iron_helmet', category: 'armor', stack_limit: 1, max_durability: 165 },
        { name: 'Golden Helmet', slug: 'golden_helmet', category: 'armor', stack_limit: 1, max_durability: 77 },
        { name: 'Diamond Helmet', slug: 'diamond_helmet', category: 'armor', stack_limit: 1, max_durability: 363 },
        { name: 'Netherite Helmet', slug: 'netherite_helmet', category: 'armor', stack_limit: 1, max_durability: 407 },
        { name: 'Turtle Shell', slug: 'turtle_shell', category: 'armor', stack_limit: 1, max_durability: 275 },
        
        // ===== ARMOR: CHESTPLATES =====
        { name: 'Leather Chestplate', slug: 'leather_chestplate', category: 'armor', stack_limit: 1, max_durability: 80 },
        { name: 'Chainmail Chestplate', slug: 'chainmail_chestplate', category: 'armor', stack_limit: 1, max_durability: 240 },
        { name: 'Iron Chestplate', slug: 'iron_chestplate', category: 'armor', stack_limit: 1, max_durability: 240 },
        { name: 'Golden Chestplate', slug: 'golden_chestplate', category: 'armor', stack_limit: 1, max_durability: 112 },
        { name: 'Diamond Chestplate', slug: 'diamond_chestplate', category: 'armor', stack_limit: 1, max_durability: 528 },
        { name: 'Netherite Chestplate', slug: 'netherite_chestplate', category: 'armor', stack_limit: 1, max_durability: 592 },
        { name: 'Elytra', slug: 'elytra', category: 'armor', stack_limit: 1, max_durability: 432 },
        
        // ===== ARMOR: LEGGINGS =====
        { name: 'Leather Leggings', slug: 'leather_leggings', category: 'armor', stack_limit: 1, max_durability: 75 },
        { name: 'Chainmail Leggings', slug: 'chainmail_leggings', category: 'armor', stack_limit: 1, max_durability: 225 },
        { name: 'Iron Leggings', slug: 'iron_leggings', category: 'armor', stack_limit: 1, max_durability: 225 },
        { name: 'Golden Leggings', slug: 'golden_leggings', category: 'armor', stack_limit: 1, max_durability: 105 },
        { name: 'Diamond Leggings', slug: 'diamond_leggings', category: 'armor', stack_limit: 1, max_durability: 495 },
        { name: 'Netherite Leggings', slug: 'netherite_leggings', category: 'armor', stack_limit: 1, max_durability: 555 },
        
        // ===== ARMOR: BOOTS =====
        { name: 'Leather Boots', slug: 'leather_boots', category: 'armor', stack_limit: 1, max_durability: 65 },
        { name: 'Chainmail Boots', slug: 'chainmail_boots', category: 'armor', stack_limit: 1, max_durability: 195 },
        { name: 'Iron Boots', slug: 'iron_boots', category: 'armor', stack_limit: 1, max_durability: 195 },
        { name: 'Golden Boots', slug: 'golden_boots', category: 'armor', stack_limit: 1, max_durability: 91 },
        { name: 'Diamond Boots', slug: 'diamond_boots', category: 'armor', stack_limit: 1, max_durability: 429 },
        { name: 'Netherite Boots', slug: 'netherite_boots', category: 'armor', stack_limit: 1, max_durability: 481 },
        
        // ===== SPECIAL WEAPONS =====
        { name: 'Bow', slug: 'bow', category: 'weapon', stack_limit: 1, max_durability: 384 },
        { name: 'Crossbow', slug: 'crossbow', category: 'weapon', stack_limit: 1, max_durability: 465 },
        { name: 'Trident', slug: 'trident', category: 'weapon', stack_limit: 1, max_durability: 250 },
        { name: 'Shield', slug: 'shield', category: 'armor', stack_limit: 1, max_durability: 336 },
        
        // ===== SPECIAL TOOLS =====
        { name: 'Fishing Rod', slug: 'fishing_rod', category: 'tool', stack_limit: 1, max_durability: 64 },
        { name: 'Shears', slug: 'shears', category: 'tool', stack_limit: 1, max_durability: 238 },
        { name: 'Flint and Steel', slug: 'flint_and_steel', category: 'tool', stack_limit: 1, max_durability: 64 },
        { name: 'Carrot on a Stick', slug: 'carrot_on_a_stick', category: 'tool', stack_limit: 1, max_durability: 25 },
        { name: 'Warped Fungus on a Stick', slug: 'warped_fungus_on_a_stick', category: 'tool', stack_limit: 1, max_durability: 100 },
        
        // ===== CONSUMABLES =====
        { name: 'Potion', slug: 'potion', category: 'consumable', stack_limit: 1, max_durability: null, description: 'Use metadata for effect type' },
        { name: 'Splash Potion', slug: 'splash_potion', category: 'consumable', stack_limit: 1, max_durability: null },
        { name: 'Lingering Potion', slug: 'lingering_potion', category: 'consumable', stack_limit: 1, max_durability: null },
        { name: 'Golden Apple', slug: 'golden_apple', category: 'consumable', stack_limit: 64, max_durability: null },
        { name: 'Enchanted Golden Apple', slug: 'enchanted_golden_apple', category: 'consumable', stack_limit: 64, max_durability: null },
        { name: 'Cooked Steak', slug: 'cooked_steak', category: 'consumable', stack_limit: 64, max_durability: null },
        { name: 'Bread', slug: 'bread', category: 'consumable', stack_limit: 64, max_durability: null },
        
        // ===== RESOURCES =====
        { name: 'Diamond', slug: 'diamond', category: 'resource', stack_limit: 64, max_durability: null },
        { name: 'Netherite Ingot', slug: 'netherite_ingot', category: 'resource', stack_limit: 64, max_durability: null },
        { name: 'Iron Ingot', slug: 'iron_ingot', category: 'resource', stack_limit: 64, max_durability: null },
        { name: 'Gold Ingot', slug: 'gold_ingot', category: 'resource', stack_limit: 64, max_durability: null },
        { name: 'Emerald', slug: 'emerald', category: 'resource', stack_limit: 64, max_durability: null },
        { name: 'Ender Pearl', slug: 'ender_pearl', category: 'resource', stack_limit: 16, max_durability: null },
        { name: 'Blaze Rod', slug: 'blaze_rod', category: 'resource', stack_limit: 64, max_durability: null },
        
        // ===== BLOCKS =====
        { name: 'Diamond Block', slug: 'diamond_block', category: 'block', stack_limit: 64, max_durability: null },
        { name: 'Cobblestone', slug: 'cobblestone', category: 'block', stack_limit: 64, max_durability: null },
        { name: 'Oak Log', slug: 'oak_log', category: 'block', stack_limit: 64, max_durability: null },
        { name: 'Torch', slug: 'torch', category: 'block', stack_limit: 64, max_durability: null },
        { name: 'Chest', slug: 'chest', category: 'block', stack_limit: 64, max_durability: null }
    ];

    const insertCatalog = db.prepare(`
        INSERT INTO item_catalog (name, slug, category, stack_limit, max_durability, description) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    catalogItems.forEach(item => {
        insertCatalog.run(item.name, item.slug, item.category, item.stack_limit, item.max_durability, item.description || null);
    });
    
    insertCatalog.finalize(() => {
        console.log(`   ✓ ${catalogItems.length} items toegevoegd aan catalog`);
    });

    console.log('\n🌱 Players en Inventory seeden...');

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
});

// Na tables: run web seeder en dan inventory
setTimeout(() => {
    console.log('\n🌐 Nu de catalog vullen vanuit PrismarineJS...\n');
    
    const { spawn } = require('child_process');
    const seeder = spawn('node', ['seedFromWeb.js'], { 
        cwd: __dirname,
        stdio: 'inherit'
    });
    
    seeder.on('close', (code) => {
        if (code !== 0) {
            console.log('\n⚠️  Web seeder mislukt, handmatig inventory toevoegen...');
        }
        
        // Inventory vullen NA catalog is geladen
        setTimeout(() => {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.resolve(__dirname, 'database.db');
            const db2 = new sqlite3.Database(dbPath);
            
            console.log('\n🎒 Voorbeeld inventory toevoegen...');
            
            const inventoryItems = [
                // Steve's items (player_id: 1)
                { player_id: 1, slug: 'diamond_sword', amount: 1, current_durability: 1400, enchantments: '[{"id":"sharpness","lvl":3},{"id":"unbreaking","lvl":2}]' },
                { player_id: 1, slug: 'diamond_pickaxe', amount: 1, current_durability: 1561, enchantments: '[{"id":"efficiency","lvl":4}]' },
                { player_id: 1, slug: 'cobblestone', amount: 64, current_durability: null, enchantments: '[]' },
                { player_id: 1, slug: 'oak_log', amount: 32, current_durability: null, enchantments: '[]' },
                { player_id: 1, slug: 'torch', amount: 64, current_durability: null, enchantments: '[]' },
                
                // Alex's items (player_id: 2)
                { player_id: 2, slug: 'diamond_block', amount: 64, current_durability: null, enchantments: '[]' },
                { player_id: 2, slug: 'golden_apple', amount: 16, current_durability: null, enchantments: '[]' },
                { player_id: 2, slug: 'elytra', amount: 1, current_durability: 400, enchantments: '[{"id":"unbreaking","lvl":3},{"id":"mending","lvl":1}]' },
                
                // Herobrine's items (player_id: 3)
                { player_id: 3, slug: 'netherite_sword', amount: 1, current_durability: 2031, enchantments: '[{"id":"sharpness","lvl":5},{"id":"looting","lvl":3}]' },
                { player_id: 3, slug: 'ender_pearl', amount: 16, current_durability: null, enchantments: '[]' },
                { player_id: 3, slug: 'diamond_pickaxe', amount: 1, current_durability: 1500, enchantments: '[{"id":"efficiency","lvl":5},{"id":"fortune","lvl":3}]' }
            ];

            db2.serialize(() => {
                inventoryItems.forEach(inv => {
                    db2.run(`
                        INSERT INTO inventory (player_id, catalog_id, amount, current_durability, enchantments, metadata)
                        SELECT ?, id, ?, ?, ?, '{}' FROM item_catalog WHERE slug = ?
                    `, [inv.player_id, inv.amount, inv.current_durability, inv.enchantments, inv.slug]);
                });
            });
            
            db2.close(() => {
                console.log(`   ✓ ${inventoryItems.length} inventory items toegevoegd`);
                console.log('\n✅ SETUP VOLTOOID!');
                console.log('📁 Database: database.db');
                console.log('\n🚀 Start de server met: npm start\n');
            });
        }, 1000);
    });
}, 200);
