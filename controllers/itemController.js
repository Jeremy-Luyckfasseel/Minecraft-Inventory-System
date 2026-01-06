/**
 * Item Controller
 * All durability and stack limits come from the database catalog.
 * No hardcoded values - item_catalog is the single source of truth.
 */

const db = require('../config/database');

// ============================================
// SQL QUERIES
// ============================================

const INVENTORY_JOIN_QUERY = `
    SELECT 
        inventory.*,
        item_catalog.name,
        item_catalog.slug,
        item_catalog.category,
        item_catalog.stack_limit,
        item_catalog.max_durability,
        item_catalog.description as catalog_description,
        players.name as player_name
    FROM inventory
    JOIN item_catalog ON inventory.catalog_id = item_catalog.id
    LEFT JOIN players ON inventory.player_id = players.id
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Enrich inventory item with calculated stats (durability from catalog)
function enrichInventoryItem(row) {
    const enchantments = row.enchantments ? JSON.parse(row.enchantments) : [];
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    
    const enriched = {
        id: row.id,
        player_id: row.player_id,
        player_name: row.player_name,
        amount: row.amount,
        enchantments: enchantments,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        catalog: {
            id: row.catalog_id,
            name: row.name,
            slug: row.slug,
            category: row.category,
            stack_limit: row.stack_limit
        }
    };
    
    // Durability from catalog (single source of truth)
    if (row.max_durability !== null) {
        const current = row.current_durability !== null ? row.current_durability : row.max_durability;
        const percentage = Math.floor((current / row.max_durability) * 100);
        
        enriched.durability = {
            max: row.max_durability,
            current: current,
            percentage: percentage,
            status: percentage < 10 ? 'LOW' : 'OK'
        };
    } else {
        enriched.durability = null;
    }
    
    return enriched;
}

// Calculate damage with Unbreaking enchantment logic
function calculateDamage(currentDurability, enchantments) {
    const unbreaking = enchantments.find(e => e.id === 'unbreaking');
    
    if (unbreaking) {
        // Unbreaking: Level / (Level + 1) chance to ignore damage
        const ignoreChance = unbreaking.lvl / (unbreaking.lvl + 1);
        if (Math.random() < ignoreChance) {
            return currentDurability; // Damage ignored
        }
    }
    
    return Math.max(0, currentDurability - 1);
}

// ============================================
// INVENTORY CONTROLLERS
// ============================================

// GET all inventory items
exports.getAllItems = (req, res) => {
    let query = INVENTORY_JOIN_QUERY;
    const params = [];
    const conditions = [];
    
    if (req.query.search) {
        conditions.push('item_catalog.name LIKE ?');
        params.push(`%${req.query.search}%`);
    }
    
    if (req.query.player) {
        conditions.push('players.name LIKE ?');
        params.push(`%${req.query.player}%`);
    }
    
    if (req.query.category) {
        conditions.push('item_catalog.category = ?');
        params.push(req.query.category);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // SQL Injection Prevention: Whitelist allowed sort fields
    const ALLOWED_SORT_FIELDS = {
        'name': 'item_catalog.name',
        'amount': 'inventory.amount',
        'current_durability': 'inventory.current_durability',
        'id': 'inventory.id',
        'category': 'item_catalog.category'
    };
    const rawSort = req.query.sort;
    const sortField = ALLOWED_SORT_FIELDS[rawSort] || 'inventory.id';
    const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
            message: 'Inventory items opgehaald',
            count: rows.length,
            data: rows.map(enrichInventoryItem)
        });
    });
};

// GET inventory item by ID
exports.getItemById = (req, res) => {
    const query = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Item niet gevonden' });
        
        res.json({
            message: 'Item gevonden',
            data: enrichInventoryItem(row)
        });
    });
};

// POST create inventory item (with stacking logic)
exports.createItem = (req, res) => {
    const { catalog_item, slug, player_id, amount = 1, enchantments = [], metadata = {} } = req.body;
    
    // Input Validation: Prevent negative or zero amounts
    if (amount < 1 || !Number.isInteger(amount)) {
        return res.status(400).json({ 
            error: 'INVALID_AMOUNT', 
            message: 'Amount must be a positive integer (minimum 1)' 
        });
    }
    
    // Accept either "catalog_item" or "slug"
    const itemSlug = catalog_item || slug;
    
    if (!itemSlug) {
        return res.status(400).json({ 
            error: 'catalog_item is verplicht',
            example: '{ "catalog_item": "diamond_sword", "player_id": 1 }'
        });
    }
    if (!player_id) {
        return res.status(400).json({ error: 'player_id is verplicht' });
    }
    
    // Lookup catalog item by slug OR name
    db.get(`
        SELECT * FROM item_catalog 
        WHERE slug = ? OR LOWER(name) = LOWER(?)
    `, [itemSlug, itemSlug], (err, catalogItem) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!catalogItem) {
            return res.status(404).json({ 
                error: `Item '${itemSlug}' niet gevonden in catalog`,
                hint: 'Gebruik GET /api/items/catalog om beschikbare items te zien'
            });
        }
        
        // Validate player
        db.get('SELECT id FROM players WHERE id = ?', [player_id], (err, player) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!player) return res.status(404).json({ error: 'Speler niet gevonden' });
            
            // STACKING LOGIC
            db.get(`
                SELECT inventory.* FROM inventory 
                WHERE player_id = ? AND catalog_id = ?
            `, [player_id, catalogItem.id], (err, existingItem) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // If item exists and can stack
                if (existingItem && catalogItem.stack_limit > 1) {
                    const newAmount = existingItem.amount + amount;
                    
                    if (newAmount > catalogItem.stack_limit) {
                        return res.status(400).json({
                            error: 'STACK_OVERFLOW',
                            message: `Maximum stack is ${catalogItem.stack_limit}`,
                            current: existingItem.amount,
                            max: catalogItem.stack_limit
                        });
                    }
                    
                    db.run('UPDATE inventory SET amount = ? WHERE id = ?', 
                        [newAmount, existingItem.id], function(err) {
                            if (err) return res.status(500).json({ error: err.message });
                            
                            const returnQuery = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
                            db.get(returnQuery, [existingItem.id], (err, row) => {
                                if (err) return res.status(500).json({ error: err.message });
                                
                                res.json({
                                    message: `Stack bijgewerkt: ${existingItem.amount} → ${newAmount}`,
                                    stacked: true,
                                    data: enrichInventoryItem(row)
                                });
                            });
                        });
                    return;
                }
                
                // Create new inventory entry
                // Durability from catalog (NULL if no durability)
                const currentDurability = catalogItem.max_durability;
                
                db.run(`
                    INSERT INTO inventory (player_id, catalog_id, amount, current_durability, enchantments, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    player_id, 
                    catalogItem.id, 
                    amount, 
                    currentDurability,
                    JSON.stringify(enchantments),
                    JSON.stringify(metadata)
                ], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    const returnQuery = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
                    db.get(returnQuery, [this.lastID], (err, row) => {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        res.status(201).json({
                            message: 'Item toegevoegd aan inventory',
                            data: enrichInventoryItem(row)
                        });
                    });
                });
            });
        });
    });
};

// PUT update inventory item
exports.updateItem = (req, res) => {
    const { amount, current_durability, enchantments, metadata } = req.body;
    const query = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
    
    db.get(query, [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        const updates = [];
        const params = [];
        
        if (amount !== undefined) {
            if (amount > item.stack_limit) {
                return res.status(400).json({ 
                    error: `Amount kan niet groter zijn dan ${item.stack_limit}` 
                });
            }
            updates.push('amount = ?');
            params.push(amount);
        }
        
        if (current_durability !== undefined) {
            if (item.max_durability === null) {
                return res.status(400).json({ error: 'Dit item heeft geen durability' });
            }
            if (current_durability > item.max_durability) {
                return res.status(400).json({ 
                    error: `Durability kan niet groter zijn dan ${item.max_durability}` 
                });
            }
            updates.push('current_durability = ?');
            params.push(current_durability);
        }
        
        if (enchantments !== undefined) {
            updates.push('enchantments = ?');
            params.push(JSON.stringify(enchantments));
        }
        
        if (metadata !== undefined) {
            updates.push('metadata = ?');
            params.push(JSON.stringify(metadata));
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Geen velden om te updaten' });
        }
        
        params.push(req.params.id);
        
        db.run(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            db.get(query, [req.params.id], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    message: 'Item bijgewerkt',
                    data: enrichInventoryItem(row)
                });
            });
        });
    });
};

// PUT use item (damage with Unbreaking logic)
exports.useItem = (req, res) => {
    const { times = 1 } = req.body;
    const query = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
    
    db.get(query, [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        // Check durability from catalog
        if (item.max_durability === null) {
            return res.status(400).json({ 
                error: 'Dit item heeft geen durability' 
            });
        }
        
        let currentDurability = item.current_durability !== null 
            ? item.current_durability 
            : item.max_durability;
            
        const enchantments = item.enchantments ? JSON.parse(item.enchantments) : [];
        
        // Apply damage
        let damageApplied = 0;
        for (let i = 0; i < times && currentDurability > 0; i++) {
            const newDurability = calculateDamage(currentDurability, enchantments);
            if (newDurability < currentDurability) {
                damageApplied++;
            }
            currentDurability = newDurability;
        }
        
        // Item broke - delete from inventory
        if (currentDurability <= 0) {
            db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    message: `💥 ${item.name} is kapot gegaan!`,
                    item_broken: true,
                    uses: times,
                    damage_applied: damageApplied,
                    deletedItem: enrichInventoryItem(item)
                });
            });
            return;
        }
        
        // Update durability
        db.run('UPDATE inventory SET current_durability = ? WHERE id = ?', 
            [currentDurability, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                db.get(query, [req.params.id], (err, updatedItem) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.json({
                        message: `Item ${times}x gebruikt`,
                        uses: times,
                        damage_applied: damageApplied,
                        damage_blocked: times - damageApplied,
                        data: enrichInventoryItem(updatedItem)
                    });
                });
            });
    });
};

// POST add enchantment
exports.addEnchantment = (req, res) => {
    const { id: enchantmentId, lvl = 1 } = req.body;
    
    if (!enchantmentId) {
        return res.status(400).json({ error: 'enchantment id is verplicht' });
    }
    
    const query = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
    
    db.get(query, [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        // Add or update enchantment
        const enchantments = item.enchantments ? JSON.parse(item.enchantments) : [];
        const existingIndex = enchantments.findIndex(e => e.id === enchantmentId.toLowerCase());
        
        if (existingIndex >= 0) {
            enchantments[existingIndex].lvl = lvl;
        } else {
            enchantments.push({ id: enchantmentId.toLowerCase(), lvl });
        }
        
        db.run('UPDATE inventory SET enchantments = ? WHERE id = ?', 
            [JSON.stringify(enchantments), req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                db.get(query, [req.params.id], (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.status(201).json({
                        message: `Enchantment ${enchantmentId} toegevoegd`,
                        data: enrichInventoryItem(row)
                    });
                });
            });
    });
};

// DELETE item
exports.deleteItem = (req, res) => {
    const query = INVENTORY_JOIN_QUERY + ' WHERE inventory.id = ?';
    
    db.get(query, [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                message: 'Item verwijderd',
                deletedItem: enrichInventoryItem(item)
            });
        });
    });
};

// ============================================
// CATALOG CONTROLLERS
// ============================================

// GET all catalog items
exports.getCatalog = (req, res) => {
    let query = 'SELECT * FROM item_catalog';
    const params = [];
    
    if (req.query.category) {
        query += ' WHERE category = ?';
        params.push(req.query.category);
    }
    
    if (req.query.search) {
        query += params.length ? ' AND' : ' WHERE';
        query += ' name LIKE ?';
        params.push(`%${req.query.search}%`);
    }
    
    query += ' ORDER BY category, name';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
            message: 'Item catalog opgehaald',
            count: rows.length,
            data: rows
        });
    });
};

// GET catalog item by slug
exports.getCatalogItem = (req, res) => {
    db.get('SELECT * FROM item_catalog WHERE slug = ?', [req.params.slug], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Item niet gevonden in catalog' });
        
        res.json({
            message: 'Catalog item gevonden',
            data: row
        });
    });
};
