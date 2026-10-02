import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize SQLite database (In-memory for simplicity, can be changed to a file)
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Create a resource
app.post('/api/items', (req: Request, res: Response) => {
    const { name, description, price } = req.body;
    
    if (!name || typeof price !== 'number') {
        return res.status(400).json({ error: 'Name and a valid price are required' });
    }

    const stmt = db.prepare('INSERT INTO items (name, description, price) VALUES (?, ?, ?)');
    stmt.run([name, description, price], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, name, description, price });
    });
    stmt.finalize();
});

// List resources with basic filters
app.get('/api/items', (req: Request, res: Response) => {
    const { name, minPrice } = req.query;
    let query = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];

    if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    
    if (minPrice) {
        query += ' AND price >= ?';
        params.push(Number(minPrice));
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get details of a resource
app.get('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Item not found' });
        res.json(row);
    });
});

// Update a resource
app.put('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!name || typeof price !== 'number') {
        return res.status(400).json({ error: 'Name and a valid price are required' });
    }

    db.run(
        'UPDATE items SET name = ?, description = ?, price = ? WHERE id = ?',
        [name, description, price, id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });
            res.json({ id: Number(id), name, description, price });
        }
    );
});

// Delete a resource
app.delete('/api/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });
        res.status(204).send();
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
