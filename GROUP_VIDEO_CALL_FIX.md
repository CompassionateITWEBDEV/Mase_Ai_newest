# Group Video Call Implementation - Multi-Camera Support

## Problem
The group video call was only showing avatars/placeholders for participants instead of actual camera feeds. Only the host's camera was working.

## Root Cause
The original implementation used the `PeerJSVideoCall` component which is designed for 1-on-1 calls. PeerJS by default creates peer-to-peer connections between two participants only. For true multi-party group video calls, each participant needs to establish WebRTC connections with every other participant (mesh network topology).

## Solution Implemented

### 1. New GroupVideoCall Component
Created `components/telehealth/GroupVideoCall.tsx` that implements a **mesh network** architecture:

- **Mesh Topology**: Each participant connects directly to every other participant
- **Multiple Peer Connections**: Manages a Map of peer connections, one for each remote participant
- **Stream Management**: Each participant's video stream is stored and rendered separately
- **Dynamic Grid Layout**: Automatically adjusts grid (2x2, 3x3) based on number of participants

### 2. Updated API Endpoint
Enhanced `app/api/communications/calls/participants/route.ts`:

- **GET**: Retrieves all participants in a group call with their peer IDs
- **POST**: Stores each participant's PeerJS peer ID in the database
- **Group Call Support**: Handles multiple calls with the same `peer_session_id` for group scenarios

### 3. Updated Communications Page
Modified `app/communications/page.tsx`:

- **Conditional Rendering**: Uses `GroupVideoCall` for group calls, `PeerJSVideoCall` for direct calls
- **Separate Ringing Overlays**: Different UI for direct vs group call ringing states
- **Type Safety**: Fixed TypeScript errors with proper type assertions

## How It Works

### Group Call Flow:

1. **Call Initiation**: 
   - Host starts a group call with multiple participants
   - A unique `peer_session_id` is generated for the group

2. **Peer Connection Setup**:
   - Each participant creates a PeerJS peer with unique ID
   - Peer ID is stored in database via `/api/communications/calls/participants`

3. **Participant Discovery**:
   - Component polls every 2 seconds for new participants
   - When a new participant's peer ID is discovered, establishes WebRTC connection

4. **Video Stream Exchange**:
   - Each participant calls every other participant with their video stream
   - Incoming calls are answered with local video stream
   - Remote streams are stored in `participantStreams` Map

5. **Rendering**:
   - Grid layout displays all participants
   - Each participant has their own video element
   - Video elements are dynamically updated when streams arrive

## Technical Details

### Mesh Network Considerations:
- **Bandwidth**: Each participant uploads their stream to N-1 other participants
- **Scalability**: Works well for 2-6 participants, may struggle beyond that
- **Alternative**: For larger groups (>6), consider SFU (Selective Forwarding Unit) like mediasoup or Jitsi

### Database Schema:
```sql
call_sessions table includes:
- caller_peer_id: PeerJS ID of the caller
- callee_peer_id: PeerJS ID of the callee
- peer_session_id: Shared ID for group calls
```

### Key Features:
✅ Multiple participants with camera feeds
✅ Real-time video streaming
✅ Dynamic grid layout (2-6 participants)
✅ Connection status indicators
✅ Mic/camera toggle controls
✅ Automatic reconnection handling
✅ STUN/TURN server support for NAT traversal

## Testing the Implementation

1. Open the application in multiple browser windows/devices
2. Log in as different users in each window
3. Start a group call from one window
4. Accept the call in other windows
5. All participants should see each other's video feeds

## Future Improvements

1. **SFU Server**: Implement a Selective Forwarding Unit for better scalability (10+ participants)
2. **Screen Sharing**: Add screen sharing support for group calls
3. **Recording**: Implement server-side recording of group calls
4. **Layout Options**: Add gallery view, speaker view, etc.
5. **Network Quality**: Show connection quality indicators per participant
6. **Reconnection**: Better handling of network interruptions

## Files Modified

1. ✅ `components/telehealth/GroupVideoCall.tsx` (NEW)
2. ✅ `app/api/communications/calls/participants/route.ts` (UPDATED)
3. ✅ `app/communications/page.tsx` (UPDATED)

## Dependencies

- PeerJS 1.5.4 (loaded from CDN)
- WebRTC API (built into modern browsers)
- STUN servers (Google's public STUN servers)
- TURN servers (OpenRelay's free TURN servers)

