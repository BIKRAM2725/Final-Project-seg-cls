# webrtc_signaling.py
from fastapi import WebSocket

PEERS = {}

@app.websocket("/ws/webrtc/{session_id}")
async def webrtc_ws(ws: WebSocket, session_id: str):
    await ws.accept()
    PEERS[session_id] = ws
    try:
        while True:
            msg = await ws.receive_text()
            # forward SDP / ICE to other peer
            for sid, peer in PEERS.items():
                if sid != session_id:
                    await peer.send_text(msg)
    except:
        PEERS.pop(session_id, None)
