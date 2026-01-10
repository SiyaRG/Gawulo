# WebSocket Connection Diagnosis

## Current Issue
Error 1006: WebSocket connection closes immediately without reaching the consumer.

## Diagnostic Steps

### 1. Verify Server is Running with Daphne

When you start the server, you should see:
```
Starting server at tcp:port=9033:interface=0.0.0.0
HTTP/2 support not enabled (install the http2 and tls Twisted extras)
============================================================
ASGI Application Initialized
DEBUG mode: True
WebSocket URL patterns: 3 patterns
  - ws/orders/$
  - ws/orders/vendor/$
  - ws/orders/customer/$
============================================================
```

**If you DON'T see these messages, the server is NOT running with Daphne!**

### 2. Check Server Console When Connecting

When you try to connect from the browser, you should see:
```
============================================================
WebSocket connection attempt from ['127.0.0.1', ...]
Full query string: token=...
============================================================
```

**If you see NOTHING in the server console, the connection isn't reaching the server.**

### 3. Verify WebSocket URL

The frontend should be connecting to:
- `ws://localhost:9033/ws/orders/customer/` (for customers)
- `ws://localhost:9033/ws/orders/vendor/` (for vendors)

Check the browser console - you should see:
```
Constructed WebSocket URL: ws://localhost:9033/ws/orders/customer/
Connecting to WebSocket: ws://localhost:9033/ws/orders/customer/?token=***
```

### 4. Common Issues

**Issue 1: Server not running with Daphne**
- Solution: Stop server, restart with `daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application`
- Check: Look for "Starting server at tcp:port=9033" message

**Issue 2: Connection not reaching server**
- Check firewall/port blocking
- Verify server is listening on 0.0.0.0:9033 (not just 127.0.0.1)
- Check if another process is using port 9033

**Issue 3: URL mismatch**
- Frontend URL: `ws://localhost:9033/ws/orders/customer/`
- Backend pattern: `r'ws/orders/customer/$'`
- These should match exactly

**Issue 4: Token issues**
- Check if token is being passed correctly
- Verify token is not expired
- Check server logs for authentication errors

### 5. Test Connection Manually

You can test the WebSocket connection using browser console:

```javascript
const ws = new WebSocket('ws://localhost:9033/ws/orders/customer/?token=YOUR_TOKEN_HERE');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
```

### 6. Next Steps

1. **Restart Daphne server** - Make sure you see the initialization messages
2. **Try connecting from browser** - Check both browser console AND server console
3. **Share the logs** - Both browser console errors AND server console output
4. **Check port** - Verify nothing else is using port 9033

