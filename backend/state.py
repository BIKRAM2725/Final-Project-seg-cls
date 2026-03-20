from collections import defaultdict

PAIR_TOKENS = {}       # token -> session_id
WS_CLIENTS = {}        # session_id -> websocket
GPS_DATA = {}          # session_id -> {lat, lng}
LAST_FRAMES = {}       # session_id -> jpeg bytes
DRONE_SESSIONS = {}    # session_id -> LiveSession
