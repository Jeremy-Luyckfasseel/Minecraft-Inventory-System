# 🎮 Minecraft Inventory System API

A professional RESTful API for managing a Minecraft-style inventory system, built with Node.js, Express, and SQLite.

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Starting the Project](#-starting-the-project)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Sources](#-sources)

---

## 🚀 Installation

### Requirements

- **Node.js** version 24.11.0
- **npm** (comes with Node.js)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Jeremy-Luyckfasseel/Minecraft-Inventory-System.git
   cd Minecraft-Inventory-System
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Initialize the database**

   ```bash
   npm run setup
   ```

   This automatically:

   - Creates all tables (players, item_catalog, inventory)
   - Downloads 1300+ Minecraft items from PrismarineJS
   - Adds 3 example players (Steve, Alex, Herobrine)
   - Adds example inventory items with enchantments

---

## ▶️ Starting the Project

```bash
npm start
```

The server runs on: **http://localhost:3000**

### Available Pages

| URL                                 | Description                   |
| ----------------------------------- | ----------------------------- |
| `http://localhost:3000/`            | Interactive API documentation |
| `http://localhost:3000/health`      | Health check endpoint         |
| `http://localhost:3000/api/items`   | Inventory items               |
| `http://localhost:3000/api/players` | Manage players                |

---

## 📁 Project Structure

```
Minecraft-Inventory-System/
├── server.js              # Express server entry point
├── setup_database.js      # Database schema & seed data
├── seedFromWeb.js         # PrismarineJS data importer
├── database.db            # SQLite database
├── package.json
│
├── config/
│   ├── database.js        # Database connection
│   └── endpoints.json     # API documentation data
│
├── controllers/
│   ├── itemController.js  # Item & Inventory logic
│   └── playerController.js
│
├── routes/
│   ├── itemRoutes.js      # /api/items routes
│   └── playerRoutes.js    # /api/players routes
│
└── public/
    └── index.html         # API documentation UI
```

---

## 📚 API Endpoints

### Catalog (Item Definitions)

| Method | Endpoint                   | Description                           |
| ------ | -------------------------- | ------------------------------------- |
| GET    | `/api/items/catalog`       | All items in catalog                  |
| GET    | `/api/items/catalog/:slug` | Specific item (e.g., `diamond_sword`) |

### Inventory (Player Items)

| Method | Endpoint                 | Description                   |
| ------ | ------------------------ | ----------------------------- |
| GET    | `/api/items`             | All inventory items           |
| GET    | `/api/items/:id`         | Specific inventory item       |
| POST   | `/api/items`             | Add item (with auto-stacking) |
| PUT    | `/api/items/:id`         | Update item                   |
| PUT    | `/api/items/:id/use`     | Use item (durability damage)  |
| POST   | `/api/items/:id/enchant` | Add enchantment               |
| DELETE | `/api/items/:id`         | Remove item                   |

### Players

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | `/api/players`     | All players     |
| GET    | `/api/players/:id` | Specific player |
| POST   | `/api/players`     | New player      |
| PUT    | `/api/players/:id` | Update player   |
| DELETE | `/api/players/:id` | Delete player   |

### Example Request

```bash
# Add item to inventory
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"catalog_item": "diamond_sword", "player_id": 1}'
```

---

## 🏗️ Architecture

This project uses the **Catalog Pattern**:

```
┌─────────────────────┐         ┌─────────────────────┐
│    ITEM_CATALOG     │         │      INVENTORY      │
├─────────────────────┤         ├─────────────────────┤
│ id                  │◄───────┐│ id                  │
│ name                │        ││ player_id (FK)      │
│ slug                │        └┤ catalog_id (FK)     │
│ category            │         │ amount              │
│ stack_limit         │         │ current_durability  │
│ max_durability      │         │ enchantments (JSON) │
└─────────────────────┘         │ metadata (JSON)     │
   Source of Truth              └─────────────────────┘
                                   Player Instances
```

**Benefits:**

- No duplication of item properties
- Durability values always come from the catalog via SQL JOIN
- Easy to extend with new items

---

## ⭐ Key Features

### 1. Minecraft-Accurate Durability

All durability values are exactly like in Minecraft:

- **Diamond Sword**: 1561
- **Diamond Chestplate**: 528 (not 1561!)
- **Netherite Helmet**: 407

### 2. Unbreaking Enchantment Logic

```
Chance to negate damage = Level / (Level + 1)

Unbreaking I:   50% chance (1/2)
Unbreaking II:  66.7% chance (2/3)
Unbreaking III: 75% chance (3/4)
```

### 3. Automatic Item Breaking

When `current_durability` ≤ 0, the item is **permanently deleted** from the database (just like in Minecraft).

### 4. Intelligent Stacking

- Items with `stack_limit > 1` are automatically stacked
- Stack overflow prevention (max 64 or 16 for certain items)

### 5. Potion Metadata

```json
{
  "catalog_item": "potion",
  "player_id": 1,
  "metadata": {
    "effect": "night_vision",
    "duration": 180
  }
}
```

### 6. Security Features

- SQL Injection prevention via whitelist for sort fields
- Input validation (amount must be ≥ 1)
- Parameterized queries

---

## 📖 Sources

### Data Sources

- **PrismarineJS/minecraft-data** - Official Minecraft 1.21 item data  
  https://github.com/PrismarineJS/minecraft-data

- **Minecraft Wiki** - Durability values verification  
  https://minecraft.wiki/w/Durability

### Frameworks & Libraries

- **Express.js** - Web framework  
  https://expressjs.com/

- **SQLite3** - Database engine  
  https://github.com/TryGhost/node-sqlite3

- **Node.js** - Runtime environment  
  https://nodejs.org/

### Minecraft Game Mechanics

- Unbreaking enchantment formula: `Level / (Level + 1)`
- Armor durability per piece (Helmet ≠ Chestplate ≠ Leggings ≠ Boots)
- Tool durability per material (Wood < Stone < Iron < Diamond < Netherite)

---

## 📝 License

ISC License

---

## 👤 Author

Created as a school project for Backend Web.

---

> 💡 **Tip:** Visit `http://localhost:3000/` for interactive API documentation with examples!
