const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// GET /api/players - Alle spelers ophalen
router.get('/', playerController.getAllPlayers);

// GET /api/players/:id - Specifieke speler ophalen
router.get('/:id', playerController.getPlayerById);

// POST /api/players - Nieuwe speler aanmaken
router.post('/', playerController.createPlayer);

// PUT /api/players/:id - Speler updaten
router.put('/:id', playerController.updatePlayer);

// DELETE /api/players/:id - Speler verwijderen
router.delete('/:id', playerController.deletePlayer);

// GET /api/players/:id/items - Alle items van een speler
router.get('/:id/items', playerController.getPlayerItems);

module.exports = router;
