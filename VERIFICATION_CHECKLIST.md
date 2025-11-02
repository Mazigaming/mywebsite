# ✅ Virtual Casino - Complete Verification Checklist

## 🔍 OFFLINE MODE & BALANCE PERSISTENCE

### Blackjack Game
- [ ] Load blackjack.html (in offline mode)
- [ ] Check balance displays correctly from offlineUser
- [ ] Play a hand (hit/stand)
- [ ] Verify balance changes after hand result
- [ ] Go back to index.html
- [ ] Check balance in sidebar matches game balance
- [ ] Refresh page (F5)
- [ ] Verify balance persisted correctly

### Slots Game
- [ ] Load slots.html (in offline mode)
- [ ] Check balance displays correctly
- [ ] Spin reels and win
- [ ] Verify reel win-highlight animation glows
- [ ] Check balance updates immediately
- [ ] Return to index.html
- [ ] Verify balance matches slots balance
- [ ] Refresh page and check persistence

### Plinko Game
- [ ] Load plinko.html (in offline mode)
- [ ] Check balance loads from offlineUser
- [ ] Drop ball multiple times
- [ ] Watch ball animation (enhanced golden sphere)
- [ ] Check bucket highlights with win animation
- [ ] Verify balance updates correctly
- [ ] Return to index and verify sync
- [ ] Refresh and verify persistence

### Coin Flip Game
- [ ] Load coinflip.html
- [ ] Check balance loads correctly
- [ ] Flip coin multiple times
- [ ] Watch 3D multi-axis flip animation
- [ ] Verify wins/losses update
- [ ] Check balance syncs to offlineUser
- [ ] Return to index and verify
- [ ] Refresh page and check persistence

---

## 🎨 ANIMATION VERIFICATION

### Blackjack Dealer Card Fix
- [ ] Deal hand
- [ ] Verify ONLY 2 dealer cards visible (not 3)
- [ ] Verify dealer's first card is always visible
- [ ] Hit player hand and verify no extra cards appear
- [ ] Stand and verify dealer reveals correctly
- [ ] Check card flip animation is smooth (3D effect)

### Slots Spin Animation
- [ ] Spin reels
- [ ] Verify spin is 1.2 seconds long
- [ ] Check brightness effect during spin
- [ ] On win: verify reels glow green (win-highlight)
- [ ] Check scale-up animation on winning reels
- [ ] Verify glow appears only on winning reels
- [ ] After animation: verify glow disappears

### Plinko Ball Animation
- [ ] Drop ball
- [ ] Watch ball (should look like golden sphere)
- [ ] Verify smooth fall animation
- [ ] Check bucket animates on landing (pulses, glows)
- [ ] Verify bucket is highlighted in green
- [ ] Check result text appears with animation

### Coinflip Animation
- [ ] Flip coin
- [ ] Watch 3D rotation (rotateY + rotateX)
- [ ] Verify multiple rotation peaks (4x)
- [ ] Check brightness pulsing during flip
- [ ] Verify result slides in smoothly
- [ ] Check coin stabilizes to final emoji

### Index Game Cards
- [ ] Load index.html
- [ ] Verify game cards enter with staggered animation
- [ ] Check entrance: scale 0.95 → 1.0, slide from bottom
- [ ] Hover card: verify scale to 1.08, glow effect
- [ ] Check triple glow (cyan + purple)
- [ ] Verify smooth hover transition

### Modal Animations
- [ ] Click on any game
- [ ] Watch difficulty modal fade in and scale (0.8 → 1.0)
- [ ] Verify backdrop blur animation
- [ ] Click profile button
- [ ] Watch profile modal entrance
- [ ] Verify smooth button hover glow

---

## 👤 PROFILE CUSTOMIZATION

### Offline Profile Changes
- [ ] Click profile button (⚙️)
- [ ] Change username to something new
- [ ] Click avatar (emoji)
- [ ] Save profile
- [ ] Go back to index
- [ ] Verify username updated in sidebar
- [ ] Refresh page
- [ ] Verify username still shows saved value

### Custom Profile Picture Upload
- [ ] Open profile modal
- [ ] Click file input for profile picture
- [ ] Upload JPG or PNG image (recommend ~200x200px)
- [ ] Click save
- [ ] Go back to index
- [ ] Verify image displays in user avatar area (circular)
- [ ] Verify image is zoomed/cropped correctly
- [ ] Refresh page
- [ ] Verify image persists

### Profile Picture Fallback
- [ ] After uploading picture, open profile again
- [ ] Select different emoji avatar
- [ ] Delete the file input (clear upload)
- [ ] Save profile
- [ ] Verify emoji avatar displays again
- [ ] Verify custom image removed

---

## 🌐 OFFLINE MODE TRIGGERS

### Automatic Offline Detection
- [ ] Stop backend server
- [ ] Reload index.html
- [ ] Verify "Disconnected" status appears (red dot)
- [ ] Verify offline account created or loaded
- [ ] Play any game
- [ ] Verify balance saves offline
- [ ] Restart backend server
- [ ] Reload index.html
- [ ] Verify "Connected" status appears (green dot)

---

## 📊 STYLING & THEME VERIFICATION

### Neon Cyberpunk Theme
- [ ] All game buttons have purple/pink neon glow
- [ ] Hover effects show cyan + purple glow
- [ ] Win amounts display in bright green
- [ ] Text has text-shadow for depth
- [ ] Cards/containers have box-shadow glow
- [ ] Animations feel smooth (60fps)
- [ ] No flickering or jumpy animations

### Color Scheme
- [ ] Primary: Cyan (#00ffff)
- [ ] Accent: Purple (#a644ff)
- [ ] Success/Win: Green (#00ff88)
- [ ] Alert: Pink (#ff00ff)
- [ ] Premium: Gold (#ffd700)
- [ ] Text: Light cyan on dark backgrounds

---

## 🐛 BUG FIXES VERIFICATION

### Blackjack Dealer Card Issue (FIXED)
- [ ] ✅ Deal blackjack hand
- [ ] ✅ Verify dealer shows 2 cards (not 3)
- [ ] ✅ Verify hidden card not shown in DOM
- [ ] ✅ Player hits/stands
- [ ] ✅ Dealer reveals and plays correctly
- [ ] ✅ No extra unused cards visible

### Offline Balance Not Saving (FIXED)
- [ ] ✅ Play game offline
- [ ] ✅ Win and lose hands
- [ ] ✅ Refresh page
- [ ] ✅ Balance preserved
- [ ] ✅ Works in all games (Blackjack, Slots, Plinko, Coinflip)

### Profile Customization Not Working Offline (FIXED)
- [ ] ✅ Offline mode
- [ ] ✅ Change username
- [ ] ✅ Upload profile picture
- [ ] ✅ Changes save
- [ ] ✅ Changes persist on refresh
- [ ] ✅ Profile syncs across games

---

## 🎯 PERFORMANCE CHECKS

### Animation Smoothness
- [ ] No frame drops during card animations
- [ ] Reel spins are smooth (60fps)
- [ ] Coin flip is fluid
- [ ] Modal entrances are smooth
- [ ] Hover effects are instant/responsive

### Memory
- [ ] Open games multiple times (no memory leak)
- [ ] Play many rounds (check dev tools memory)
- [ ] Refresh doesn't cause slowdown
- [ ] Animation cleanup prevents issues

### localStorage Usage
- [ ] Check offline user data size (should be < 50KB)
- [ ] Verify no duplicate data being saved
- [ ] Check balances sync properly across games
- [ ] Verify profile picture stored efficiently as base64

---

## 📱 RESPONSIVE DESIGN (if applicable)

- [ ] Desktop (1920px): All animations smooth
- [ ] Tablet (768px): Cards stack, animations work
- [ ] Mobile (480px): Touch-friendly, animations scale
- [ ] Small phone (360px): UI readable, no overflow

---

## ✨ FINAL USER EXPERIENCE

- [ ] Opening casino feels premium and responsive
- [ ] Game launches are smooth
- [ ] Winning feels exciting (animations + glows)
- [ ] Losing isn't disappointing (smooth animations)
- [ ] Profile feels personalized
- [ ] Offline mode works seamlessly
- [ ] No confusing lag or freezes
- [ ] Everything feels fast and responsive

---

## 🚀 READY FOR PRODUCTION

- [ ] All bugs fixed
- [ ] All animations smooth
- [ ] All persistence working
- [ ] All profile features functional
- [ ] No console errors
- [ ] No memory leaks
- [ ] Ready to deploy!