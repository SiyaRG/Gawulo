"""
Simple test to verify WebSocket routing works.
Run this while the server is running to test WebSocket connectivity.
"""
import asyncio
import websockets
import sys
import json

async def test_websocket():
    """Test WebSocket connection with a simple message."""
    # Get token from user or use test token
    token = input("Enter your JWT token (or press Enter to test without token): ").strip()
    
    if not token:
        uri = "ws://localhost:9033/ws/orders/customer/"
        print("Testing without token (will likely fail authentication)")
    else:
        uri = f"ws://localhost:9033/ws/orders/customer/?token={token}"
    
    print("=" * 60)
    print("Testing WebSocket Connection")
    print("=" * 60)
    print(f"URI: {uri.replace(token, '***') if token else uri}")
    print()
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket connection established!")
            print("✓ Server is handling WebSocket connections")
            print()
            
            # Try to receive a message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"✓ Received message: {message[:100]}")
            except asyncio.TimeoutError:
                print("ℹ No message received (this is OK)")
            
            # Send a ping
            await websocket.send(json.dumps({"type": "ping"}))
            print("✓ Sent ping message")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"✓ Received response: {response[:100]}")
            except asyncio.TimeoutError:
                print("ℹ No response to ping (this is OK)")
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"✗ Connection rejected with status code: {e.status_code}")
        print(f"  Response headers: {e.headers}")
        if e.status_code == 403:
            print("  → This suggests authentication failed")
        elif e.status_code == 404:
            print("  → This suggests the WebSocket route doesn't exist")
        else:
            print(f"  → Unexpected status code: {e.status_code}")
    except ConnectionRefusedError:
        print("✗ Connection refused!")
        print("  → Server is not running or not accessible on port 9033")
    except Exception as e:
        print(f"✗ Connection failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\nTest cancelled by user")
        sys.exit(0)

