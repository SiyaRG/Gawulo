# Testing WebSocket Connection

## Step 1: Verify Server is Running with Daphne

**CRITICAL**: The server MUST be running with Daphne, NOT `runserver`.

### Check if server is running with Daphne:
Look at the server console output. You should see:
```
Starting server at tcp:port=9033:interface=0.0.0.0
HTTP/2 support not enabled (install the http2 and tls Twisted extras)
```

If you see:
```
Starting development server at http://0.0.0.0:9033/
```

Then it's running with `runserver` (WRONG!) - you need to stop it and restart with Daphne.

### Start with Daphne:
```bash
cd Gawulo
..\gven\Scripts\activate
daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application
```

## Step 2: Check Server Logs

When you try to connect from the frontend, you should see in the server console:
```
WebSocket connection attempt from ['127.0.0.1', 12345]
Query string: token=eyJhbGc...
```

If you see errors like:
- "WebSocket connection rejected: No token provided"
- "WebSocket connection rejected: Authentication failed"
- "User X is neither vendor nor customer"

These will help identify the issue.

## Step 3: Verify Connection

1. Open browser console
2. Look for: "Connecting to WebSocket: ws://localhost:9033/ws/orders/customer/?token=***"
3. Check server logs for connection messages
4. The connection status chip should turn green

## Common Issues:

1. **Error 1006 (Abnormal Closure)**: Server is running with `runserver` instead of Daphne
2. **No server logs**: Server isn't receiving the connection (check firewall/port)
3. **Authentication errors**: Check server logs for specific error messages
4. **"User is neither vendor nor customer"**: User doesn't have a vendor or customer profile

