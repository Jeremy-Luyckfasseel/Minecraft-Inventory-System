const db = require('../config/database');

// GET alle spelers
exports.getAllPlayers = (req, res) => {
    const sql = 'SELECT * FROM players';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'Alle spelers opgehaald',
            count: rows.length,
            data: rows
        });
    });
};

// GET speler op ID
exports.getPlayerById = (req, res) => {
    const sql = 'SELECT * FROM players WHERE id = ?';
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Speler niet gevonden' });
        }
        res.json({
            message: 'Speler gevonden',
            data: row
        });
    });
};

// POST nieuwe speler
exports.createPlayer = (req, res) => {
    const { name, gamemode, level, email } = req.body;
    
    // Validatie
    const errors = [];
    if (!name || name.trim() === '') {
        errors.push('Name is verplicht');
    } else if (/\d/.test(name)) {
        errors.push('Name mag geen cijfers bevatten');
    }
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('Geldig email is verplicht');
    if (!gamemode || !['survival', 'creative', 'adventure', 'spectator'].includes(gamemode)) {
        errors.push('Gamemode moet survival, creative, adventure of spectator zijn');
    }
    if (level && (isNaN(level) || level < 1)) errors.push('Level moet een positief nummer zijn');
    
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    const sql = 'INSERT INTO players (name, gamemode, level, email) VALUES (?, ?, ?, ?)';
    
    db.run(sql, [name, gamemode, level || 1, email], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email bestaat al' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'Speler aangemaakt',
            data: { id: this.lastID, name, gamemode, level: level || 1, email }
        });
    });
};

// PUT update speler
exports.updatePlayer = (req, res) => {
    const { name, gamemode, level, email } = req.body;
    
    // Validatie
    const errors = [];
    if (name && /\d/.test(name)) {
        errors.push('Name mag geen cijfers bevatten');
    }
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('Ongeldig email formaat');
    if (gamemode && !['survival', 'creative', 'adventure', 'spectator'].includes(gamemode)) {
        errors.push('Gamemode moet survival, creative, adventure of spectator zijn');
    }
    if (level && (isNaN(level) || level < 1)) errors.push('Level moet een positief nummer zijn');
    
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    // Check of speler bestaat
    db.get('SELECT * FROM players WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Speler niet gevonden' });
        
        const sql = `UPDATE players SET 
            name = COALESCE(?, name),
            gamemode = COALESCE(?, gamemode),
            level = COALESCE(?, level),
            email = COALESCE(?, email)
            WHERE id = ?`;
        
        db.run(sql, [name, gamemode, level, email, req.params.id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email bestaat al' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Speler bijgewerkt',
                changes: this.changes
            });
        });
    });
};

// DELETE speler
exports.deletePlayer = (req, res) => {
    db.get('SELECT * FROM players WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Speler niet gevonden' });
        
        db.run('DELETE FROM players WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Speler verwijderd',
                deletedPlayer: row
            });
        });
    });
};

// GET items van speler
exports.getPlayerItems = (req, res) => {
    db.get('SELECT * FROM players WHERE id = ?', [req.params.id], (err, player) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!player) return res.status(404).json({ error: 'Speler niet gevonden' });
        
        db.all('SELECT * FROM items WHERE player_id = ?', [req.params.id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: `Items van ${player.name}`,
                player: player,
                count: items.length,
                items: items
            });
        });
    });
};
