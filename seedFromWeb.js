/**
 * Minecraft Catalog Seeder from PrismarineJS
 * Downloads official item data from Minecraft 1.21
 * Source: https://github.com/PrismarineJS/minecraft-data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// URL naar de officiële data van PrismarineJS (Minecraft 1.21)
const DATA_URL = "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.1/items.json";

// Hulpfunctie om categorie te bepalen op basis van naam
function detectCategory(name, id) {
    const n = name.toLowerCase();
    
    if (n.includes('sword') || n.includes('bow') || n.includes('trident') || n.includes('mace')) return 'weapon';
    if (n.includes('helmet') || n.includes('chestplate') || n.includes('leggings') || n.includes('boots') || n.includes('elytra')) return 'armor';
    if (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('shears') || n.includes('flint') || n.includes('fishing')) return 'tool';
    if (n.includes('potion') || n.includes('apple') || n.includes('bread') || n.includes('beef') || n.includes('pork') || n.includes('mutton') || n.includes('chicken') || n.includes('cod') || n.includes('salmon') || n.includes('stew') || n.includes('soup') || n.includes('cookie') || n.includes('pie') || n.includes('berries') || n.includes('melon') || n.includes('carrot') || n.includes('potato')) return 'consumable';
    if (n.includes('spawn_egg') || n.includes('music_disc') || n.includes('template') || n.includes('sherd')) return 'misc';
    if (n.includes('ingot') || n.includes('diamond') || n.includes('emerald') || n.includes('coal') || n.includes('lapis') || n.includes('redstone') || n.includes('raw')) return 'material';
    
    return 'block';
}

// Hulpfunctie voor Durability
function getDurability(name) {
    const n = name.toLowerCase();
    
    // Tools
    if (n.includes('netherite') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 2031;
    if (n.includes('diamond') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 1561;
    if (n.includes('iron') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 250;
    if (n.includes('stone') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 131;
    if (n.includes('wooden') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 59;
    if (n.includes('golden') && (n.includes('pickaxe') || n.includes('axe') || n.includes('shovel') || n.includes('hoe') || n.includes('sword'))) return 32;

    // Armor
    if (n.includes('leather_helmet')) return 55;
    if (n.includes('leather_chestplate')) return 80;
    if (n.includes('leather_leggings')) return 75;
    if (n.includes('leather_boots')) return 65;

    if (n.includes('chainmail_helmet')) return 165;
    if (n.includes('chainmail_chestplate')) return 240;
    if (n.includes('chainmail_leggings')) return 225;
    if (n.includes('chainmail_boots')) return 195;

    if (n.includes('iron_helmet')) return 165;
    if (n.includes('iron_chestplate')) return 240;
    if (n.includes('iron_leggings')) return 225;
    if (n.includes('iron_boots')) return 195;

    if (n.includes('golden_helmet')) return 77;
    if (n.includes('golden_chestplate')) return 112;
    if (n.includes('golden_leggings')) return 105;
    if (n.includes('golden_boots')) return 91;

    if (n.includes('diamond_helmet')) return 363;
    if (n.includes('diamond_chestplate')) return 528;
    if (n.includes('diamond_leggings')) return 495;
    if (n.includes('diamond_boots')) return 429;

    if (n.includes('netherite_helmet')) return 407;
    if (n.includes('netherite_chestplate')) return 592;
    if (n.includes('netherite_leggings')) return 555;
    if (n.includes('netherite_boots')) return 481;

    // Specials
    if (n.includes('turtle_helmet')) return 275;
    if (n.includes('elytra')) return 432;
    if (n.includes('shield')) return 336;
    if (n.includes('bow') && !n.includes('bowl')) return 384;
    if (n.includes('crossbow')) return 465;
    if (n.includes('trident')) return 250;
    if (n.includes('shears')) return 238;
    if (n.includes('fishing_rod')) return 64;
    if (n.includes('flint_and_steel')) return 64;
    if (n.includes('carrot_on_a_stick')) return 25;
    if (n.includes('warped_fungus_on_a_stick')) return 100;
    if (n.includes('brush')) return 64;
    if (n.includes('mace')) return 500;
    if (n.includes('wolf_armor')) return 64;

    return null;
}

async function seed() {
    console.log('🌐 Minecraft Catalog Seeder (PrismarineJS)');
    console.log('==========================================\n');
    console.log("⬇️  Data downloaden van PrismarineJS (Minecraft 1.21)...");
    
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Kon data niet downloaden");
        
        const items = await response.json();
        console.log(`✅ Gedownload! ${items.length} items gevonden.`);
        console.log("💾 Bezig met database vullen...\n");

        db.serialize(() => {
            // Tabel schoonmaken
            db.run("DELETE FROM item_catalog"); 
            db.run("DELETE FROM sqlite_sequence WHERE name='item_catalog'");

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO item_catalog (name, slug, category, stack_limit, max_durability) 
                VALUES (?, ?, ?, ?, ?)
            `);

            db.run("BEGIN TRANSACTION");

            let count = 0;
            const categories = {};
            
            items.forEach(item => {
                // Sla "Air" over
                if (item.name === 'air') return;

                const name = item.displayName;
                const slug = item.name;
                const stack = item.stackSize;
                const category = detectCategory(slug, item.id);
                const durability = getDurability(slug);

                stmt.run(name, slug, category, stack, durability);
                count++;
                
                // Track categories
                categories[category] = (categories[category] || 0) + 1;
            });

            stmt.finalize();

            db.run("COMMIT", () => {
                console.log(`🎉 Klaar! ${count} items toegevoegd aan de catalogus.\n`);
                console.log('📋 Categories:');
                Object.entries(categories)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([cat, num]) => console.log(`   ${cat}: ${num}`));
                console.log('');
                db.close();
            });
        });

    } catch (error) {
        console.error("❌ Fout:", error.message);
        console.log("\n💡 Tip: Zorg dat je Node.js 18+ hebt (voor fetch support)");
        db.close();
    }
}

seed();
