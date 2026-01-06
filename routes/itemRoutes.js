const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// ============================================
// CATALOG ROUTES (read-only item definitions)
// ============================================

// GET /api/catalog - Get all catalog items
router.get('/catalog', itemController.getCatalog);

// GET /api/catalog/:slug - Get specific catalog item
router.get('/catalog/:slug', itemController.getCatalogItem);

// ============================================
// INVENTORY ROUTES (player-owned instances)
// ============================================

// GET /api/items - Get all inventory items
router.get('/', itemController.getAllItems);

// GET /api/items/:id - Get specific inventory item
router.get('/:id', itemController.getItemById);

// POST /api/items - Add item to inventory (with stacking logic)
router.post('/', itemController.createItem);

// PUT /api/items/:id - Update inventory item
router.put('/:id', itemController.updateItem);

// PUT /api/items/:id/use - Use item (damage with Unbreaking logic)
router.put('/:id/use', itemController.useItem);

// POST /api/items/:id/enchant - Add enchantment (with validation)
router.post('/:id/enchant', itemController.addEnchantment);

// DELETE /api/items/:id - Remove item from inventory
router.delete('/:id', itemController.deleteItem);

module.exports = router;
