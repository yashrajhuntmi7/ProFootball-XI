# Pro football 11 API

Small Node.js football data API built from the `EAFC26-Men.csv` file.

## Endpoints

- `GET /health`
- `GET /players`
- `GET /players/:id`
- `GET /meta`

## Query Parameters

- `search`
- `team`
- `league`
- `position`
- `nationality`
- `preferredFoot`
- `sortBy`
- `order`
- `page`
- `limit`

Example:

```bash
http://localhost:3000/players?league=Premier%20League&sortBy=overall&order=desc&limit=10
```

## Run

```bash
node api/server.js
```

If your CSV file is in a different place:

```bash
PLAYER_CSV_PATH="/absolute/path/to/EAFC26-Men.csv" node api/server.js
```
