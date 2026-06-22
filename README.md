# TFT Companion — Set 17 Decision Engine

**Status: Archived. This project is no longer actively maintained.**

A locally-hosted coaching tool for Teamfight Tactics (Set 17: Space Gods) that provides real-time board analysis, synergy recommendations, economy guidance, and optimal item suggestions. All processing runs on the local machine. No game client memory is read, no overlays are injected, and no visual OCR is used. The tool operates entirely through a manual input interface.

---

## Background

This project was built as a personal learning exercise in game-state decision modelling. It is published here as a completed, archived reference implementation.

Riot Vanguard's strict anti-cheat enforcement makes any form of automated screen capture or process attachment infeasible without risk of account action. This tool deliberately avoids any such approach. The user inputs their board state manually through the web interface, and the backend engine produces coaching output from that data alone.

---

## Architecture

```
tft-companion/
|
|-- engine.py                  # Core decision engine (Python)
|-- server.py                  # WebSocket server (Python / websockets)
|-- set17_space_gods.json      # Static champion and trait database (Set 17)
|-- set17_meta_comps.json      # Local fallback meta composition list
|
|-- frontend/                  # React + Vite user interface
|   |-- src/
|   |   |-- App.jsx            # Main application component
|   |   |-- App.css            # Component styles
|   |   |-- index.css          # Global styles
|   |   |-- main.jsx           # React entry point
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
```

### Backend (`engine.py` + `server.py`)

- Written in Python.
- `TFTDecisionEngine` loads champion and trait data from the static JSON database on startup.
- On initialisation it attempts to fetch a live meta composition list from a community-maintained endpoint. If that request fails it falls back to the local `set17_meta_comps.json`.
- The engine exposes two analysis processors:
  - **Meta Compiler** — scores current board units against known high-ELO meta compositions using weighted ownership and contestation penalties.
  - **Procedural Synergy Engine** — generates flexible team-building pathways from active trait counts when no strong meta match is found.
- Economy and levelling guidance is derived from gold, player level, and current stage.
- `server.py` wraps the engine in a WebSocket server listening on `ws://127.0.0.1:8000`. On connection it pushes the full champion list to the frontend. It then listens for board state payloads and replies with analysis results.

### Frontend (`frontend/`)

- Built with React 19 and Vite.
- Communicates with the backend over a local WebSocket connection.
- The user selects units for their board and bench from dropdown menus populated by the champion list received at handshake.
- Displays recommended compositions ranked by fit score, active trait counts, bench-to-board swap suggestions, shop buy recommendations, and item assignments per carry and tank.
- An AI log panel shows the engine's internal reasoning steps.

---

## Requirements

### Backend

- Python 3.10 or later
- `websockets` library
- `requests` library
- `urllib3` library

Install dependencies:

```
pip install websockets requests urllib3
```

### Frontend

- Node.js 18 or later
- npm

Install dependencies:

```
cd frontend
npm install
```

---

## Running Locally

**Step 1 — Start the backend server:**

```
python server.py
```

The server starts on `ws://127.0.0.1:8000`.

**Step 2 — Start the frontend development server:**

```
cd frontend
npm run dev
```

The interface is accessible at `http://localhost:5173`.

**Step 3 — Use the interface:**

1. Select units currently on your board and bench using the dropdown selectors.
2. Enter your current gold and player level.
3. Submit the board state.
4. Review the recommended compositions, synergy guidance, and item assignments returned by the engine.

---

## Limitations

- **Manual input only.** There is no automated board reading, OCR, or process injection of any kind. The user must enter their board state by hand each time it changes.
- **Set 17 only.** The champion and trait database is fixed to Set 17: Space Gods. The tool will not function correctly for other sets without replacing the data files.
- **Live meta endpoint.** The engine attempts to fetch a community-maintained meta list at runtime. If that endpoint becomes unavailable, it falls back to the bundled `set17_meta_comps.json`.
- **No opponent automation.** Opponent board data must also be entered manually if contestation scoring is required.

---

## Disclaimer

This project is not affiliated with, endorsed by, or associated with Riot Games. Teamfight Tactics is a trademark of Riot Games. Champion names, trait names, and game data referenced in this project belong to Riot Games. This tool is provided for educational and personal use only.

The project is archived and will not receive further updates.
