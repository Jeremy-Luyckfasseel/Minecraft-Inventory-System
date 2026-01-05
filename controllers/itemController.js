const db = require('../config/database');

// GET alle items (met search & pagination)
exports.getAllItems = (req, res) => {
    const { search, limit = 10, offset = 0 } = req.query;
    
    let sql = 'SELECT items.*, players.name as player_name FROM items LEFT JOIN players ON items.player_id = players.id';
    let countSql = 'SELECT COUNT(*) as total FROM items';
    let params = [];
    let countParams = [];
    
    // Search functionaliteit
    if (search) {
        sql += ' WHERE items.name LIKE ?';
        countSql += ' WHERE name LIKE ?';
        params.push(`%${search}%`);
        countParams.push(`%${search}%`);
    }
    
    // Pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Get total count first
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                message: search ? `Items gevonden voor "${search}"` : 'Alle items opgehaald',
                count: rows.length,
                total: countResult.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                data: rows
            });
        });
    });
};

// GET item op ID
exports.getItemById = (req, res) => {
    const sql = `SELECT items.*, players.name as player_name 
                 FROM items 
                 LEFT JOIN players ON items.player_id = players.id 
                 WHERE items.id = ?`;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Item niet gevonden' });
        
        res.json({
            message: 'Item gevonden',
            data: row
        });
    });
};

// POST nieuw item
exports.createItem = (req, res) => {
    const { name, amount, durability, player_id } = req.body;
    
    // Validatie
    const errors = [];
    if (!name || name.trim() === '') errors.push('Name is verplicht');
    if (!player_id) errors.push('Player_id is verplicht');
    if (amount && (isNaN(amount) || amount < 1)) errors.push('Amount moet een positief nummer zijn');
    if (durability && (isNaN(durability) || durability < 0 || durability > 100)) {
        errors.push('Durability moet tussen 0 en 100 zijn');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    // Check of player bestaat
    db.get('SELECT * FROM players WHERE id = ?', [player_id], (err, player) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!player) return res.status(400).json({ error: 'Speler niet gevonden' });
        
        const sql = 'INSERT INTO items (name, amount, durability, player_id) VALUES (?, ?, ?, ?)';
        
        db.run(sql, [name, amount || 1, durability || 100, player_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.status(201).json({
                message: 'Item aangemaakt',
                data: {
                    id: this.lastID,
                    name,
                    amount: amount || 1,
                    durability: durability || 100,
                    player_id,
                    player_name: player.name
                }
            });
        });
    });
};

// PUT update item
exports.updateItem = (req, res) => {
    const { name, amount, durability, player_id } = req.body;
    
    // Validatie
    const errors = [];
    if (amount && (isNaN(amount) || amount < 1)) errors.push('Amount moet een positief nummer zijn');
    if (durability && (isNaN(durability) || durability < 0 || durability > 100)) {
        errors.push('Durability moet tussen 0 en 100 zijn');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    db.get('SELECT * FROM items WHERE id = ?', [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        // Check nieuwe player_id als meegegeven
        const checkPlayer = (callback) => {
            if (player_id) {
                db.get('SELECT * FROM players WHERE id = ?', [player_id], (err, player) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!player) return res.status(400).json({ error: 'Speler niet gevonden' });
                    callback();
                });
            } else {
                callback();
            }
        };
        
        checkPlayer(() => {
            const sql = `UPDATE items SET 
                name = COALESCE(?, name),
                amount = COALESCE(?, amount),
                durability = COALESCE(?, durability),
                player_id = COALESCE(?, player_id)
                WHERE id = ?`;
            
            db.run(sql, [name, amount, durability, player_id, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    message: 'Item bijgewerkt',
                    changes: this.changes
                });
            });
        });
    });
};

// DELETE item
exports.deleteItem = (req, res) => {
    db.get('SELECT * FROM items WHERE id = ?', [req.params.id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
        
        db.run('DELETE FROM items WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                message: 'Item verwijderd',
                deletedItem: item
            });
        });
    });
};
