# East Village Venues Setup Guide

## ✅ Venues Created

All 5 East Village bar venues have been successfully created in the database:

1. **Ninety Seven** - https://ninetyseven.jukeb.ink
2. **Sophie's Bar** - https://sophies.jukeb.ink
3. **Josie's Bar** - https://josiesbar.jukeb.ink
4. **Bua Bar** - https://bua.jukeb.ink
5. **The Saint** - https://thesaintnyc.jukeb.ink

## 🔐 Admin Credentials

Each venue has its own admin dashboard and password:

| Venue | Admin URL | Password |
|-------|-----------|----------|
| Ninety Seven | https://ninetyseven.jukeb.ink/admin | `ninetyseven2026!` |
| Sophie's Bar | https://sophies.jukeb.ink/admin | `sophies2026!` |
| Josie's Bar | https://josiesbar.jukeb.ink/admin | `josiesbar2026!` |
| Bua Bar | https://bua.jukeb.ink/admin | `bua2026!` |
| The Saint | https://thesaintnyc.jukeb.ink/admin | `thesaintnyc2026!` |

## 🎵 Spotify Configuration Required

Before these venues can play music, you need to add their redirect URIs to your Spotify Developer App:

### Step 1: Go to Spotify Developer Dashboard
1. Visit https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click on your "Rand Jukebox" app (or whatever you named it)
4. Click "Edit Settings"

### Step 2: Add Redirect URIs
Scroll to "Redirect URIs" and add the following **5 new URIs**:

```
https://ninetyseven.jukeb.ink/api/spotify/callback
https://sophies.jukeb.ink/api/spotify/callback
https://josiesbar.jukeb.ink/api/spotify/callback
https://bua.jukeb.ink/api/spotify/callback
https://thesaintnyc.jukeb.ink/api/spotify/callback
```

**Important:** 
- Click "Add" after each URI
- Click "Save" at the bottom when all 5 are added
- No trailing slashes
- Must be exact match (https, no www, correct subdomain)

### Step 3: Verify Existing URIs
Make sure you also have these existing URIs (don't remove them):

```
https://jukeb.ink/api/spotify/callback
https://rand.jukeb.ink/api/spotify/callback
https://cafemogador.jukeb.ink/api/spotify/callback
http://localhost:3000/api/spotify/callback
http://127.0.0.1:3000/api/spotify/callback
```

## 📧 Pitch Emails

Personalized pitch emails for each venue are in `east-village-pitch-emails.md`.

### Contact Information to Find

You'll need to research and find contact emails for:

1. **Ninety Seven** (97 Avenue A)
   - Website: [Research needed]
   - Instagram: @ninetysevennyc (likely)
   - Email: [Research needed]

2. **Sophie's Bar** (507 E 5th St)
   - Website: sophiesbar.com (likely)
   - Instagram: @sophiesbarnyc (likely)
   - Email: [Research needed]

3. **Josie's Bar** (108 Avenue A)
   - Website: [Research needed]
   - Instagram: [Research needed]
   - Email: [Research needed]

4. **Bua Bar** (122 St Marks Pl)
   - Website: buabarnyc.com (likely)
   - Instagram: @buabarnyc (likely)
   - Email: [Research needed]

5. **The Saint** (105 Avenue A)
   - Website: thesaintnyc.com (likely)
   - Instagram: @thesaintnyc (likely)
   - Email: [Research needed]

### How to Find Contact Info

1. **Google Search**: "[Bar Name] New York contact"
2. **Instagram**: Check bio for email or DM option
3. **Facebook**: Business page often has email
4. **Yelp**: Sometimes lists business email
5. **Call Directly**: Ask for manager/owner's email

## 🧪 Testing Before Sending Emails

Before reaching out to bars, test each venue:

### 1. Test Venue Access
```bash
# Test each venue URL
curl https://ninetyseven.jukeb.ink/api/queue
curl https://sophies.jukeb.ink/api/queue
curl https://josiesbar.jukeb.ink/api/queue
curl https://bua.jukeb.ink/api/queue
curl https://thesaintnyc.jukeb.ink/api/queue
```

All should return empty queues (not 404 errors).

### 2. Test Admin Login
Visit each admin URL and login with the password to verify:
- Login works
- Dashboard loads
- Can access settings

### 3. Test Spotify Connection
For ONE venue (as a demo):
1. Login to admin dashboard
2. Click "Connect Spotify"
3. Authorize with Spotify
4. Verify connection successful
5. Select a playback device
6. Add a test song
7. Verify playback works

## 📋 Pre-Send Checklist

Before sending emails to bars:

- [ ] All Spotify redirect URIs added to Spotify Developer Dashboard
- [ ] Tested at least one venue end-to-end (Spotify connection + playback)
- [ ] All venue URLs load without errors
- [ ] Admin logins work for all venues
- [ ] Found contact emails for all 5 bars
- [ ] Reviewed and personalized each pitch email
- [ ] Prepared to respond quickly to interested bars
- [ ] Have availability for in-person demos if requested

## 🎯 Outreach Strategy

### Week 1: Initial Outreach
- Send personalized emails to all 5 bars
- Follow up on Instagram/social media
- Consider visiting in person during slow hours

### Week 2: Follow-ups
- Send brief follow-up emails to non-responders
- Offer in-person demos
- Be flexible on pricing/terms

### Week 3: Demos & Onboarding
- Schedule demos with interested bars
- Show them the admin dashboard
- Help them connect Spotify
- Train staff on basic usage

### Week 4: Launch & Iterate
- Soft launch with staff testing
- Full launch to customers
- Gather feedback
- Make improvements

## 💰 Pricing Options (When Asked)

Consider offering:

1. **Free Trial**: 30 days, full features
2. **Monthly**: $99/month per venue
3. **Quarterly**: $250/quarter (save $47)
4. **Annual**: $900/year (save $288)
5. **Beta Discount**: 50% off for first 3 months as early adopters

**Value Proposition**:
- Increases customer engagement
- Keeps people at the bar longer
- Creates social media moments
- No hardware needed (unlike traditional jukeboxes)
- Full admin control
- Real-time updates

## 📊 Success Metrics to Track

Once bars adopt:
- Songs requested per night
- Unique users per night
- Average votes per song
- Peak usage times
- Most popular genres/artists
- Customer feedback

## 🆘 Support Plan

Be ready to provide:
- Quick response to technical issues
- Help with Spotify setup
- Training for new staff
- Feature requests consideration
- Regular check-ins

## 🚀 Next Steps

1. ✅ Venues created in database
2. ⏳ Add Spotify redirect URIs (YOU DO THIS NOW)
3. ⏳ Test one venue end-to-end
4. ⏳ Research contact emails
5. ⏳ Send pitch emails
6. ⏳ Schedule demos
7. ⏳ Onboard first bar

Good luck! 🎵

