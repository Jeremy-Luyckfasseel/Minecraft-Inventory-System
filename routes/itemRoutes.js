const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// GET /api/items - Alle items ophalen (met search & pagination)
router.get('/', itemController.getAllItems);

// GET /api/items/:id - Specifiek item ophalen
router.get('/:id', itemController.getItemById);

// POST /api/items - Nieuw item aanmaken
router.post('/', itemController.createItem);

// PUT /api/items/:id - Item updaten
router.put('/:id', itemController.updateItem);

// DELETE /api/items/:id - Item verwijderen
router.delete('/:id', itemController.deleteItem);

module.exports = router;
