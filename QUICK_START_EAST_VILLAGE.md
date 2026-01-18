# Quick Start: East Village Bar Outreach

## ✅ What's Done

All 5 venues are **live and ready** in the database:

1. **Ninety Seven** → https://ninetyseven.jukeb.ink
2. **Sophie's Bar** → https://sophies.jukeb.ink  
3. **Josie's Bar** → https://josiesbar.jukeb.ink
4. **Bua Bar** → https://bua.jukeb.ink
5. **The Saint** → https://thesaintnyc.jukeb.ink

## 🎯 What You Need to Do NOW

### 1. Add Spotify Redirect URIs (5 minutes)

Go to https://developer.spotify.com/dashboard → Your App → Edit Settings → Redirect URIs

**Add these 5 URIs:**
```
https://ninetyseven.jukeb.ink/api/spotify/callback
https://sophies.jukeb.ink/api/spotify/callback
https://josiesbar.jukeb.ink/api/spotify/callback
https://bua.jukeb.ink/api/spotify/callback
https://thesaintnyc.jukeb.ink/api/spotify/callback
```

Click "Add" after each, then "Save" at the bottom.

### 2. Test One Venue (10 minutes)

Pick any venue (I suggest Ninety Seven):

1. Visit https://ninetyseven.jukeb.ink/admin
2. Login with password: `ninetyseven2026!`
3. Click "Connect Spotify"
4. Authorize with your Spotify Premium account
5. Select a playback device
6. Go back to https://ninetyseven.jukeb.ink (main page)
7. Add a test song
8. Verify it plays

If this works, all venues will work the same way!

### 3. Find Contact Emails (30 minutes)

Research and find emails for:

- [ ] Ninety Seven (97 Avenue A) - Check Instagram @ninetysevennyc or call
- [ ] Sophie's Bar (507 E 5th St) - sophiesbar.com or Instagram
- [ ] Josie's Bar (108 Avenue A) - Google or call directly
- [ ] Bua Bar (122 St Marks Pl) - buabarnyc.com or Instagram
- [ ] The Saint (105 Avenue A) - thesaintnyc.com or Instagram

**Pro tip**: Call during slow hours (2-5pm) and ask for manager's email.

### 4. Send Emails (15 minutes)

Copy the personalized emails from `east-village-pitch-emails.md` and send them!

Each email:
- Is personalized to the bar's vibe
- Includes their unique demo link
- Asks simply if they're interested
- Keeps it short and friendly

## 📧 Email Template Quick Reference

**Subject variations:**
- Ninety Seven: "Transform Your Music Experience at Ninety Seven"
- Sophie's: "Let Your Crowd Control the Music at Sophie's"
- Josie's: "Add a Digital Jukebox to Josie's"
- Bua: "Interactive Music Queue for Bua's Vibrant Energy"
- The Saint: "Let Your Music Crowd Choose the Soundtrack at The Saint"

**Key points in each email:**
- Their personalized link (e.g., https://ninetyseven.jukeb.ink)
- How it works (request songs, vote, real-time)
- You maintain admin control
- Simple ask: "Would you be interested?"

## 🎯 Expected Timeline

- **Today**: Add Spotify URIs, test one venue, find emails
- **This week**: Send all 5 emails
- **Next week**: Follow up with non-responders, schedule demos
- **Week 3**: First bar goes live!

## 💡 When They Ask Questions

**"How much does it cost?"**
→ "I'm offering a free 30-day trial. After that, $99/month, but I'm flexible for early adopters."

**"Do we need special equipment?"**
→ "Just a computer/phone with Spotify Premium connected to your sound system. No hardware needed."

**"What if people request inappropriate songs?"**
→ "You have full admin control to skip songs, manage explicit content, and moderate the queue in real-time."

**"Can we try it first?"**
→ "Absolutely! Your demo link is live right now. I can also come by and show you in person."

## 📞 Follow-Up Strategy

**Day 5**: Send brief follow-up to non-responders
**Day 10**: Try Instagram DM or call directly
**Day 14**: Consider visiting in person during slow hours

## 🎉 When You Get Interest

1. Schedule a demo (in-person is best)
2. Bring your laptop/phone
3. Show them the admin dashboard
4. Add a few songs together
5. Let them see the real-time voting
6. Help them connect their Spotify
7. Train their staff (5 minutes)
8. Set a launch date

## 🆘 If Something Breaks

All venues are configured identically, so if one works, they all should work. If you hit issues:

1. Check Spotify redirect URIs are saved
2. Verify venue exists: `curl https://[venue].jukeb.ink/api/queue`
3. Test admin login works
4. Check Railway backend logs for errors

## 📊 Files Reference

- `east-village-pitch-emails.md` - Full email text for each bar
- `EAST_VILLAGE_VENUES_SETUP.md` - Detailed setup guide
- `create-east-village-venues.js` - Script that created the venues (already run)

---

**You're ready to go! Start with adding those Spotify URIs, then send those emails.** 🚀🎵

Good luck! These bars are going to love it.

