# DeskNotify Live

Northvale Ops desk-alert board with live stats and cards. Zero dependencies.

```bash
npm start
# http://127.0.0.1:3901/
```

Open the board in a browser — you should see Open / Acked / Total stats and seeded cards. Tracks fill the dashed slots (filters, create panel, priority badges).

## API (starter)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | liveness |
| GET | `/api/alerts` | `{ alerts: [...] }` |
| POST | `/api/alerts` | **501** until Track Bravo |

## Team workflow

1. `git init` on a **copy** of this folder.
2. One branch per track (see challenge brief).
3. Merge to `main`, resolve conflicts, keep `npm start` green.
