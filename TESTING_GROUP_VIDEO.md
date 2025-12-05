# Testing the Group Video Call Fix

## Quick Test Steps

### Prerequisites
- Dev server is running (`npm run dev`)
- Access to multiple browser windows/devices
- Camera and microphone permissions granted

### Test Scenario 1: Direct Call (1-on-1)
1. Open `localhost:3000/communications` in Browser Window 1
2. Select or login as User A (e.g., Dr. Smith)
3. Open `localhost:3000/communications` in Browser Window 2 (incognito/private mode)
4. Select or login as User B (e.g., Nurse Johnson)
5. In Window 1, click on User B's conversation and click the video call icon
6. In Window 2, accept the incoming call
7. ✅ **Expected**: Both users should see each other's camera feed

### Test Scenario 2: Group Call (Multi-party)
1. Open `localhost:3000/communications` in 3 different browser windows/devices
   - Window 1: Login as User A (Mase)
   - Window 2: Login as User B (Dr. Wilson)
   - Window 3: Login as User C (Emily Davis)

2. In Window 1 (Mase):
   - Click "New Chat" button
   - Select "Group Chat"
   - Select Dr. Wilson and Emily Davis
   - Create the group
   - Click the video call icon (📹) in the group chat

3. In Windows 2 and 3:
   - You should see an incoming call notification
   - Click "Accept" to join the call

4. ✅ **Expected Result**: 
   - All 3 participants should see a grid layout (2x3 or 3x3)
   - Each participant's camera feed should be visible
   - Name labels should appear under each video
   - Connection status indicators should show "Live" or "Connecting"

### What to Look For

#### Grid Layout
- 2 participants: 2x1 grid
- 3-4 participants: 2x2 grid  
- 5-6 participants: 3x2 grid

#### Video Quality Indicators
- ✅ Green dot = Connected and streaming
- 🟡 Yellow dot = Connecting
- Camera icon = Placeholder while connecting

#### Controls (Bottom Bar)
- 📹 Camera toggle (on/off)
- 🎤 Microphone toggle (mute/unmute)
- ❌ End call button (red)

### Troubleshooting

#### Issue: Only seeing avatars/placeholders
**Possible Causes:**
1. Participants haven't joined yet - wait a few seconds
2. Network connectivity issues - check console for errors
3. Camera permissions not granted - check browser permissions

**Solution:**
- Open browser console (F12)
- Look for PeerJS connection logs like:
  ```
  ✅ [GROUP] Peer connection opened
  📞 [GROUP] Calling participant: Dr. Wilson
  ✅ [GROUP] Received stream from: Dr. Wilson
  ```

#### Issue: Only 2 people can see each other in group call
**Cause:** Third participant's peer ID not stored in database

**Solution:**
- Check the database `call_sessions` table
- Verify all participants have `caller_peer_id` or `callee_peer_id` set
- API endpoint: `GET /api/communications/calls/participants?callId=<call_id>`

#### Issue: Video freezes or connection drops
**Cause:** Network bandwidth limitations (mesh topology requires significant upload bandwidth)

**Solution:**
- For groups >6 people, consider implementing an SFU server
- Check network quality in browser console
- Reduce video quality if needed

### Developer Console Commands

Check participants in a call:
```javascript
// In browser console
fetch('/api/communications/calls/participants?callId=<your-call-id>')
  .then(r => r.json())
  .then(console.log)
```

Check PeerJS connection status:
```javascript
// Should log peer connections
console.log(peerRef.current)
console.log(peerConnectionsRef.current)
```

## Success Criteria

✅ All participants can see each other's video feeds
✅ Grid layout adjusts based on number of participants
✅ Name labels display correctly under each video
✅ Controls (mic/camera/end) work for all participants
✅ Connection status indicators show correct state
✅ Call ends properly when "End Call" is clicked

## Known Limitations

1. **Scalability**: Mesh network works well for 2-6 participants
   - Beyond 6, bandwidth becomes an issue
   - Each participant uploads N-1 streams

2. **Browser Compatibility**: Requires modern browser with WebRTC support
   - Chrome 74+
   - Firefox 66+
   - Safari 12.1+
   - Edge 79+

3. **Mobile**: Mobile browsers may limit video quality to save bandwidth

## Next Steps if Issues Persist

1. Check browser console for errors
2. Verify database has correct peer IDs stored
3. Test with 2 participants first (direct call)
4. Gradually add more participants
5. Check network connectivity (STUN/TURN servers)

