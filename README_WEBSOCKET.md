# WebSocket Setup for Real-Time Order Updates

## Important: Server Configuration

**The Django server MUST be run with Daphne (ASGI server) instead of the regular `runserver` command to support WebSockets.**

### Running the Server

#### Option 1: Use the Updated Start Scripts

The start scripts have been updated to use Daphne automatically:
- `start-dev.bat` (Windows)
- `start-dev.ps1` (PowerShell)
- `start-simple.bat` (Windows)

#### Option 2: Manual Start with Daphne

```bash
cd Gawulo
# Activate virtual environment
..\gven\Scripts\activate  # Windows
# or
source gven/bin/activate  # macOS/Linux

# Start with Daphne
daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application
```

### Why Daphne?

- The regular `python manage.py runserver` uses WSGI which does NOT support WebSockets
- Daphne is an ASGI server that supports both HTTP and WebSocket connections
- WebSockets require ASGI to function properly

### Verifying WebSocket Connection

1. Start the server with Daphne
2. Open the vendor or customer dashboard
3. Look for the connection status indicator (should show "Connected" in green)
4. When an order status is updated, it should appear immediately without page refresh

### Troubleshooting

**If you see "Disconnected" status:**
1. Make sure the server is running with Daphne, not `runserver`
2. Check browser console for WebSocket connection errors
3. Verify the WebSocket URL is correct (should be `ws://localhost:9033/ws/orders/vendor/` or `ws://localhost:9033/ws/orders/customer/`)
4. Check that your JWT token is valid and not expired

**If WebSocket connection fails:**
- Check that Redis is running (or the in-memory channel layer is being used in DEBUG mode)
- Verify CORS settings allow WebSocket connections
- Check server logs for authentication errors

