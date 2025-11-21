# 🚀 PeerJS Video Call - Quick Start

## ✅ READY TO USE - NO SETUP NEEDED!

The video call system is **100% FREE** and works immediately!

---

## 🎯 How to Test (2 Browsers)

### Step 1: Open Nurse Interface
1. Open **Browser A** (Chrome/Edge)
2. Go to: `http://localhost:3000/track/{staffId}`
3. Start a visit with a patient
4. Click **"Request Doctor Consultation"** button
5. Fill out the form:
   - Urgency level
   - Reason for consultation
   - Patient symptoms
6. Click **"Request Consultation"**
7. Wait for doctor to accept...

### Step 2: Open Doctor Portal
1. Open **Browser B** (Chrome/Edge) - **DIFFERENT BROWSER/WINDOW**
2. Go to: `http://localhost:3000/doctor-portal`
3. Login with doctor credentials
4. See the pending consultation request
5. Click **"Accept & Start Video Call"**
6. 🎥 **VIDEO CALL STARTS!**

### Step 3: Video Call Active
- ✅ Both nurse and doctor see each other
- ✅ Both can hear each other
- ✅ Camera and mic controls work
- ✅ Call duration shows
- ✅ End call button works

---

## 🎥 During the Call

### Controls Available:
- 📹 **Camera Toggle** - Turn video on/off
- 🎤 **Microphone Toggle** - Mute/unmute audio
- ☎️ **End Call** - Complete consultation

### What You'll See:
- **Main Screen**: Other participant's video (full screen)
- **Small Window**: Your own video (top-right corner)
- **Status Badge**: Connection status (Connected/Connecting)
- **Timer**: Call duration
- **Your Name**: Displayed at top

---

## ⚠️ Important Notes

### Browser Permissions:
When you first start a call, the browser will ask:
- ✅ **Allow camera access**
- ✅ **Allow microphone access**

**You MUST click "Allow" for video calls to work!**

### Best Browsers:
- ✅ **Chrome** (Recommended)
- ✅ **Edge** (Recommended)
- ✅ **Firefox** (Works well)
- ⚠️ **Safari** (May have issues)

### Testing Tips:
1. **Use 2 different browsers** (Chrome + Edge)
   - OR use Chrome normal + Chrome incognito
2. **Allow permissions** when prompted
3. **Check your camera/mic** are working
4. **Good internet connection** recommended

---

## 🔧 Troubleshooting

### Problem: "Could not access camera/microphone"
**Solution**: 
1. Check browser permissions (click lock icon in address bar)
2. Allow camera and microphone
3. Refresh the page

### Problem: "Peer unavailable"
**Solution**:
1. Make sure doctor accepted the consultation first
2. Wait a few seconds for connection
3. Refresh nurse page if needed

### Problem: Can't see video
**Solution**:
1. Check camera is not being used by another app
2. Try a different browser
3. Check browser console for errors (F12)

### Problem: No audio
**Solution**:
1. Check microphone permissions
2. Check system volume
3. Try unmute/mute button

---

## 💡 Quick Test Checklist

Before testing, make sure:
- [ ] You have 2 browsers open (or 2 devices)
- [ ] Camera and microphone are working
- [ ] You're logged in as doctor in one browser
- [ ] You have an active visit in the nurse browser
- [ ] You allowed browser permissions

---

## 🎉 That's It!

**NO API KEYS**  
**NO INSTALLATION**  
**NO CONFIGURATION**  

Just open 2 browsers and test! 🚀

---

## 📊 What Happens Behind the Scenes

```
1. Nurse requests consultation
   → Saved to database
   
2. Doctor sees request in portal
   → Polls database for new requests
   
3. Doctor clicks "Accept"
   → Creates PeerJS connection with ID: "doctor-{consultationId}"
   → Opens video interface
   
4. Nurse detects acceptance (polling)
   → Creates PeerJS connection with ID: "nurse-{consultationId}"
   → Calls doctor's peer ID
   
5. PeerJS connects them
   → Direct peer-to-peer video stream
   → Both see and hear each other!
```

---

## 🌟 Key Features

✅ **Free Forever** - No costs  
✅ **No Setup** - Works immediately  
✅ **Real-Time** - Low latency  
✅ **Secure** - WebRTC encryption  
✅ **Simple** - Easy to use  
✅ **Reliable** - Automatic reconnection  

---

**Ready to test? Just follow Step 1 and Step 2 above!** 🎥

