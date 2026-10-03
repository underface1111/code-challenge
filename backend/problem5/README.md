# Problem 5: A Crude Server

A simple CRUD API for an `items` resource, built with ExpressJS + TypeScript, backed by SQLite (via `better-sqlite3`) for persistence.

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Running

**Development** (auto-runs TypeScript via `ts-node`, no build step needed):

```bash
npm run dev
```

**Production** (compile then run the output in `dist/`):

```bash
npm run build
npm start
```

The server listens on `http://localhost:3000` by default. Set the `PORT` environment variable to use a different port.

The database is an **in-memory SQLite database** — data resets every time the server restarts. To persist data across restarts, change `new Database(':memory:')` to `new Database('./data.db')` in [src/index.ts](src/index.ts).

## API

| Method | Path              | Description                              |
|--------|-------------------|-------------------------------------------|
| POST   | `/api/items`      | Create an item                            |
| GET    | `/api/items`      | List items (optional `name`, `minPrice`, `maxPrice` filters) |
| GET    | `/api/items/:id`  | Get a single item by id                   |
| PUT    | `/api/items/:id`  | Update an item                            |
| DELETE | `/api/items/:id`  | Delete an item                            |

### Item shape

```json
{
  "id": 1,
  "name": "Keyboard",
  "description": "Mechanical",
  "price": 49.99,
  "createdAt": "2026-10-02 15:56:30"
}
```

### Examples

```bash
# Create
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Keyboard","description":"Mechanical","price":49.99}'

# List (with filters)
curl "http://localhost:3000/api/items?name=key&minPrice=30&maxPrice=100"

# Get one
curl http://localhost:3000/api/items/1

# Update
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Keyboard Pro","description":"Mechanical RGB","price":59.99}'

# Delete
curl -X DELETE http://localhost:3000/api/items/1
```

`POST`/`PUT` return `400` if `name` is missing or `price` is not a non-negative number. `GET`/`PUT`/`DELETE` on an unknown `:id` return `404`. CORS is enabled for all origins so the API can be called directly from a browser-based client during review/testing.
