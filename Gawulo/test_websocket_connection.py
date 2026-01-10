"""
Test script to verify WebSocket server is running and accessible.
Run this while the server is running to check if WebSocket connections are possible.
"""
import asyncio
import websockets
import sys

async def test_websocket():
    """Test WebSocket connection to the server."""
    uri = "ws://localhost:9033/ws/orders/customer/?token=test"
    
    print("=" * 60)
    print("WebSocket Connection Test")
    print("=" * 60)
    print(f"Attempting to connect to: {uri}")
    print()
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket connection established!")
            print("✓ Server is running with ASGI (Daphne)")
            print()
            print("Waiting for message...")
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received: {message}")
            except asyncio.TimeoutError:
                print("No message received (this is OK if authentication fails)")
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"✗ Connection rejected with status code: {e.status_code}")
        if e.status_code == 403:
            print("  This is expected - authentication failed (token is invalid)")
            print("  But it means the server IS handling WebSocket connections!")
        else:
            print(f"  Unexpected status code: {e.status_code}")
    except ConnectionRefusedError:
        print("✗ Connection refused!")
        print("  The server is not running or not accessible on port 9033")
        print("  Make sure the server is running with: daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application")
    except Exception as e:
        print(f"✗ Connection failed: {type(e).__name__}: {e}")
        if "1006" in str(e) or "abnormal closure" in str(e).lower():
            print("  Error 1006 means the server closed the connection immediately")
            print("  This usually means the server is running with 'runserver' instead of Daphne")
            print("  Stop the server and restart with: daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application")
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\nTest cancelled by user")
        sys.exit(0)

