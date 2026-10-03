import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database (in-memory for simplicity; pass a file path instead to persist across restarts)
const db = new Database(':memory:');

db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

interface Item {
    id: number;
    name: string;
    description: string | null;
    price: number;
    createdAt: string;
}

// Create a resource
app.post('/api/items', (req: Request, res: Response) => {
    const { name, description, price } = req.body;

    if (!name || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Name and a non-negative price are required' });
    }

    const result = db
        .prepare('INSERT INTO items (name, description, price) VALUES (?, ?, ?)')
        .run(name, description ?? null, price);

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid) as Item;
    res.status(201).json(item);
});

// List resources with basic filters
app.get('/api/items', (req: Request, res: Response) => {
    const { name, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM items WHERE 1=1';
    const params: (string | number)[] = [];

    if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }

    if (minPrice) {
        query += ' AND price >= ?';
        params.push(Number(minPrice));
    }

    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(Number(maxPrice));
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows);
});

// Get details of a resource
app.get('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | undefined;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
});

// Update a resource
app.put('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!name || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Name and a non-negative price are required' });
    }

    const result = db
        .prepare('UPDATE items SET name = ?, description = ?, price = ? WHERE id = ?')
        .run(name, description ?? null, price, id);

    if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item;
    res.json(item);
});

// Delete a resource
app.delete('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
});

// Centralized error handler: Express forwards any error thrown inside a route
// handler here (incl. synchronous throws from better-sqlite3), so callers always
// get a consistent JSON error shape instead of Express's default HTML error page.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
