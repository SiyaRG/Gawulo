# Verify WebSocket Server Setup

## Critical Issue: Error 1006

Error 1006 means "WebSocket is closed before the connection is established". This **always** means the server is NOT running with Daphne (ASGI server).

## How to Fix

### Step 1: Check Current Server Status

Look at your Django server console window. You should see one of these:

**✅ CORRECT (Daphne):**
```
Starting server at tcp:port=9033:interface=0.0.0.0
HTTP/2 support not enabled (install the http2 and tls Twisted extras)
```

**❌ WRONG (runserver):**
```
Starting development server at http://0.0.0.0:9033/
Quit the server with CTRL-BREAK.
```

### Step 2: Stop Current Server

If you see "Starting development server", you're running with `runserver`. Stop it:
- Press `CTRL+C` in the server console
- Or close the console window

### Step 3: Start with Daphne

**Option A: Use the start script**
```bash
# From project root
.\start-dev.bat
```

**Option B: Manual start**
```bash
cd Gawulo
..\gven\Scripts\activate
daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application
```

### Step 4: Verify Connection

1. **Check server console** - You should see:
   ```
   Starting server at tcp:port=9033:interface=0.0.0.0
   ```

2. **Open browser** - Go to customer/vendor dashboard

3. **Check browser console** - Should see:
   ```
   Connecting to WebSocket: ws://localhost:9033/ws/orders/customer/?token=***
   WebSocket connected
   ```

4. **Check server console** - Should see:
   ```
   WebSocket connection attempt from ['127.0.0.1', ...]
   Query string: token=eyJhbGc...
   WebSocket connected: customer_X_orders for user username
   ```

### Step 5: Test Connection

Run the test script:
```bash
cd Gawulo
python test_websocket_connection.py
```

This will tell you if the server is handling WebSocket connections.

## Common Issues

1. **"Connection refused"** - Server is not running
2. **"Error 1006"** - Server is running with `runserver` instead of Daphne
3. **"Authentication failed"** - Check server logs for specific error
4. **No server logs** - Server isn't receiving connections (check firewall/port)

## Still Not Working?

1. Check that `daphne` is installed:
   ```bash
   pip list | findstr daphne
   ```

2. If not installed:
   ```bash
   pip install daphne
   ```

3. Verify ASGI configuration:
   ```bash
   cd Gawulo
   python check_websocket.py
   ```

