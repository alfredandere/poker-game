# Fullstack Poker Application

A complete Texas Hold'em poker game implementation with Next.js frontend and FastAPI backend.

## Project Structure

```
poker-game/
├── docker-compose.yml          # Docker orchestration
├── README.md                   # This file
├── frontend/                   # Next.js frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json         # shadcn/ui config
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── poker/
│       │       |__ActionPanel.tsx
│       │       |__GameSetup.tsx
|       |       |__GameTable.tsx
|       |       |__HandHistory.tsx
|       |       |__PlayerCard.tsx
|       |       |__PlayingCard.tsx
|       |
│       ├── lib/
│       │   ├── poker-engine.ts
│       │   ├── api.ts
│       │   └── utils.ts
│       └── __tests__/
│           └── poker-engine.test.ts
└── backend/                    # FastAPI backend
    ├── Dockerfile
    ├── pyproject.toml
    ├── main.py
    ├── init.sql
    ├── src/
    │   ├── api/
    │   │   └── hands.py
    |   |   └── poker_calculator.py
    │   ├── domain/
    │   │   ├── hand.py
    │   │   
    │   └── database/
    │   |    ├── connection.py
    |   └── repository/
    │       ├── hand_repository.py
    └── tests/
        └── test_api.py
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No other services running on ports 3000, 8000, or 5432

### Running the Application

1. Clone the repository
2. Navigate to the project root
3. Run:

```bash
docker compose up -d
```

4. Wait for all services to start (about 30-60 seconds)
5. Open your browser to:

```
http://localhost:3000
```

### Stopping the Application

```bash
docker compose down
```

To remove all data:

```bash
docker compose down -v
```

## Features

### Game Rules
- 6-player Texas Hold'em
- Big Blind: 40 chips
- Small Blind: 20 chips
- No ante
- Standard betting rounds: preflop, flop, turn, river

### Frontend Features
- Interactive poker table interface
- Stack configuration for all players
- Action buttons (Fold, Check, Call, Bet, Raise, All-in)
- Real-time play log
- Hand history display
- Single-page application

### Backend Features
- RESTful API for hand management
- PostgreSQL database with repository pattern
- Automatic win/loss calculation using pokerkit
- @dataclass entities
- Raw SQL queries (no ORM)

## API Endpoints

### Create Hand
```http
POST /api/hands
Content-Type: application/json

{
  "stacks": [1000, 1000, 1000, 1000, 1000, 1000],
  "dealer_position": 0,
  "small_blind_position": 1,
  "big_blind_position": 2,
  "hole_cards": ["AsKs", "QhQd", "JcTc", "9h8h", "7d6d", "5c4c"],
  "action_sequence": "c c c c c x 5c6c7c x x x 8d x x 9s x x",
  "board_cards": "5c6c7c8d9s"
}
```

### Get All Hands
```http
GET /api/hands?limit=100
```

### Get Single Hand
```http
GET /api/hands/{hand_id}
```

### Health Check
```http
GET /health
```

## Development

### Backend Development

```bash
cd backend
poetry install
poetry run uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

Backend:
```bash
cd backend
poetry run pytest
```

Frontend:
```bash
cd frontend
npm test
```

## Architecture

### Backend Architecture
- **API Layer**: FastAPI endpoints following RESTful principles
- **Domain Layer**: Business logic and entities with @dataclass
- **Infrastructure Layer**: Database access with repository pattern
- **Poker Calculator**: Win/loss calculation using pokerkit library

### Frontend Architecture
- **Poker Engine**: Pure TypeScript game logic
- **UI Components**: React components with shadcn/ui
- **API Client**: Fetch-based API communication
- **State Management**: React hooks for local state

### Database Schema

```sql
CREATE TABLE hands (
    id VARCHAR(36) PRIMARY KEY,
    stacks INTEGER[],
    dealer_position INTEGER,
    small_blind_position INTEGER,
    big_blind_position INTEGER,
    hole_cards TEXT[],
    action_sequence TEXT,
    board_cards TEXT,
    payoffs INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Technology Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- shadcn/ui
- Tailwind CSS
- Jest & React Testing Library

### Backend
- Python 3.11
- FastAPI
- PostgreSQL
- psycopg2
- pokerkit
- pytest

### Infrastructure
- Docker
- Docker Compose

## Action Format

### Short Format
Used in action_sequence field:
- `f` - Fold
- `x` - Check
- `c` - Call
- `bAMOUNT` - Bet (e.g., b80)
- `rAMOUNT` - Raise (e.g., r160)
- `allin` - All-in
- Board cards - e.g., "5c6c7c 8d 9s"

### Example Sequence
```
c c c c c x 5c6c7c x x x 8d x x 9s x x
```

This represents:
- Preflop: 5 calls, 1 check
- Flop (5c6c7c): 3 checks
- Turn (8d): 2 checks
- River (9s): 2 checks

## Troubleshooting

### Port Conflicts
If ports 3000, 8000, or 5432 are in use, stop the conflicting services or modify `docker-compose.yml`

### Database Connection Issues
```bash
docker compose logs postgres
docker compose restart backend
```

### Frontend Build Issues
```bash
docker compose logs frontend
docker compose restart frontend
```

### Clearing All Data
```bash
docker compose down -v
docker compose up -d
```

## License

This is a coding exercise. Please do not share this code or solutions with others.