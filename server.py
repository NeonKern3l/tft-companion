import asyncio
import http
import websockets
import json
from engine import TFTDecisionEngine

# Initialize the Set 17 decision engine
engine = TFTDecisionEngine()

# Pre-compile a lightweight list of all champions in the database to send to the UI on handshake
CHAMPION_LIST = [
    {
        "apiName": c["apiName"],
        "name": c["name"],
        "cost": c["cost"]
    }
    for c in engine.db["champions"]
]
# Sort alphabetically for easy UI selection
CHAMPION_LIST.sort(key=lambda x: x["name"])

def handle_http_request(connection, request):
    connection_header = request.headers.get("Connection", "")
    if "upgrade" not in connection_header.lower():
        response_body = (
            b"<h1>TFT Backend Server</h1>"
            b"<p>This port is reserved for WebSocket connections from the React Companion.</p>"
            b"<p>To view the companion app, please open: "
            b"<a href='http://localhost:5173'>http://localhost:5173</a> in your browser.</p>"
        )
        return (
            http.HTTPStatus.OK,
            [("Content-Type", "text/html; charset=utf-8")],
            response_body
        )
    return None

async def ws_handler(websocket):
    print("[Backend] React overlay connected.")
    try:
        # Step 1: Send the static champion database to the UI immediately on connection
        init_payload = {
            "type": "INIT",
            "champions": CHAMPION_LIST
        }
        await websocket.send(json.dumps(init_payload))

        # Step 2: Listen for manual user updates from the interface
        async for message in websocket:
            client_state = json.loads(message)
            
            # Extract current board, bench, gold, level, and opponents from client state
            current_board = client_state.get("board", [])
            current_bench = client_state.get("bench", [])
            opponents = client_state.get("opponents", [])
            gold = int(client_state.get("gold", 30))
            level = int(client_state.get("level", 6))
            
            # Feed state into the analytics engine
            analysis = engine.analyze_board(
                current_board=current_board,
                current_bench=current_bench,
                opponent_boards=opponents,
                gold=gold,
                level=level
            )
            
            # Reply with computed recommendations, synergies, and thinking logs
            reply_payload = {
                "type": "UPDATE",
                "active_traits": analysis["active_traits"],
                "recommended_comps": analysis["recommended_comps"],
                "custom_synergy_comps": analysis["custom_synergy_comps"],
                "ai_logs": analysis["ai_logs"]
            }
            await websocket.send(json.dumps(reply_payload))
            
    except websockets.exceptions.ConnectionClosed:
        print("[Backend] React overlay disconnected.")

async def main():
    # Bind strictly to IPv4 loopback
    async with websockets.serve(ws_handler, "127.0.0.1", 8000, process_request=handle_http_request):
        print("[Backend] Local Server started on ws://127.0.0.1:8000")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Backend] Server shut down successfully.")