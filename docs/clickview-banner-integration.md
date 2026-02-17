# ClickView Banner Integration

## Status: Infrastructure Complete, Banners Pending

The code infrastructure for ClickView banner integration is complete and functional. The system has a robust three-tier fallback that ensures subject pages always display correctly, whether or not ClickView banners are available.

---

## What Was Implemented

### 1. Banner Resolution System (`image-map.ts`)

Three new functions added to `/src/components/school-dashboard/listings/subjects/image-map.ts`:

```typescript
// Try to get level-specific banner for a subject
getSubjectBanner(subjectName, level, imageKey): string | null

// Get the best hero image (banner or illustration)
getSubjectHeroImage(subjectName, level, imageKey): string

// Original function (unchanged)
getSubjectImage(subjectName): string
```

**Fallback Chain:**

1. **Level-specific banner** (e.g., `/subjects/banners/elementary/الرياضيات-Dda6pW3.png`)
2. **General subject illustration** (e.g., `/subjects/mathematics.png`)
3. **Default image** (`/subjects/default.png`)

### 2. Enhanced Hero Component (`hero.tsx`)

Updated `/src/components/school-dashboard/listings/subjects/hero.tsx`:

**New Props:**

- `level?: "elementary" | "middle" | "high" | null` - For level-specific banner lookup
- `imageKey?: string | null` - Subject's imageKey from database

**Features:**

- Automatic image fallback on load error
- Dark gradient overlay for better text contrast
- Responsive image sizing with `object-cover`
- Maintains 222px height (ClickView standard)

### 3. Subject Detail Integration (`detail.tsx`)

Updated `/src/components/school-dashboard/listings/subjects/detail.tsx`:

```typescript
// Infer level from subject data
const heroLevel = (["elementary", "middle", "high"].includes(inferredLevel)
  ? inferredLevel
  : null) as "elementary" | "middle" | "high" | null

// Pass to hero
<SubjectHero
  subjectName={data.subjectName}
  topicsCount={totalTopics}
  lang={lang}
  level={heroLevel}
  imageKey={data.imageKey}
/>
```

### 4. Banner Extraction Script

Created `/scripts/extract-clickview-banners.ts` with:

- Arabic to English subject mapping (28 subjects)
- Banner ID extraction from ClickView URLs
- Automated download with rate limiting
- Metadata generation

---

## Current Behavior

**Without Banners (Current State):**

- Subject hero uses existing high-quality square illustrations
- All subjects display correctly with proper fallbacks
- No broken images or visual issues

**With Banners (Future State):**

- Level-specific banners displayed when available
- Seamless fallback to illustrations for unmapped subjects
- Enhanced visual experience matching ClickView's design

---

## Why Banners Didn't Download

ClickView's CDN returns 404 errors for direct image requests:

```
https://img.clickviewapp.com/v2/covers/GxAzY0z?width=2048
→ 404 Not Found
```

**Possible reasons:**

- Authentication required
- Different CDN URL pattern
- Geographic restrictions
- Anti-scraping protections

---

## Manual Banner Addition (Optional)

If you want to add ClickView's original banners manually:

### Option 1: Browser Screenshots

1. **Visit ClickView subject pages** and take full-page screenshots
2. **Crop banner area** (1200×222 pixels or similar aspect ratio)
3. **Save to structure:**
   ```
   /public/subjects/banners/
   ├── elementary/
   │   ├── الرياضيات-Dda6pW3.png
   │   ├── العلوم-ZAl67rb.png
   │   └── ...
   ├── middle/
   │   ├── الرياضيات-v4qnrzg.png
   │   └── ...
   └── high/
       ├── الفيزياء-q91lXp.png
       └── ...
   ```

**Naming Convention:**

```
{arabic-slug}-{banner-id}.png
```

Examples:

- `الرياضيات-Dda6pW3.png` (Math Elementary)
- `الفيزياء-q91lXp.png` (Physics High School)

### Option 2: Browser DevTools

1. **Open ClickView subject page** (e.g., https://www.clickview.net/us/elementary/topics/Dda6pW3/math)
2. **Open DevTools** (F12) → Network tab
3. **Find banner image request** (filter by `img.clickviewapp.com`)
4. **Copy working URL** and download
5. **Save with correct naming** to `/public/subjects/banners/{level}/`

### Option 3: Browser Automation (Playwright)

Use the browser MCP to:

1. Navigate to each ClickView subject page
2. Capture full-page screenshot
3. Extract and save banner region
4. Automate for all 30 subject-level combinations

---

## Banner ID Reference

### Elementary (5 subjects)

| Subject               | Arabic           | Banner ID | URL                                                                                  |
| --------------------- | ---------------- | --------- | ------------------------------------------------------------------------------------ |
| Math                  | الرياضيات        | `Dda6pW3` | [Link](https://www.clickview.net/us/elementary/topics/Dda6pW3/math)                  |
| Science               | العلوم           | `ZAl67rb` | [Link](https://www.clickview.net/us/elementary/topics/ZAl67rb/science)               |
| Arts                  | الفنون           | `GxAzY0z` | [Link](https://www.clickview.net/us/elementary/topics/GxAzY0z/arts)                  |
| English Language Arts | اللغة الإنجليزية | `NqgPKaG` | [Link](https://www.clickview.net/us/elementary/topics/NqgPKaG/english-language-arts) |
| Social Studies        | علم الاجتماع     | `Kj8Vjbb` | [Link](https://www.clickview.net/us/elementary/topics/Kj8Vjbb/social-studies)        |

### Middle School (5 subjects)

| Subject               | Arabic           | Banner ID | URL                                                                              |
| --------------------- | ---------------- | --------- | -------------------------------------------------------------------------------- |
| Math                  | الرياضيات        | `v4qnrzg` | [Link](https://www.clickview.net/us/middle/topics/v4qnrzg/math)                  |
| Science               | العلوم           | `Kj8k1bg` | [Link](https://www.clickview.net/us/middle/topics/Kj8k1bg/science)               |
| Arts                  | الفنون           | `v4qyEzp` | [Link](https://www.clickview.net/us/middle/topics/v4qyEzp/arts)                  |
| English Language Arts | اللغة الإنجليزية | `v4qnrbz` | [Link](https://www.clickview.net/us/middle/topics/v4qnrbz/english-language-arts) |
| Social Studies        | علم الاجتماع     | `v4qyrOx` | [Link](https://www.clickview.net/us/middle/topics/v4qyrOx/social-studies)        |

### High School (20 subjects)

| Subject                 | Arabic             | Banner ID | URL                                                                                            |
| ----------------------- | ------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| Math                    | الرياضيات          | `q91lR9`  | [Link](https://www.clickview.net/us/high/topics/q91lR9/math)                                   |
| Physics                 | الفيزياء           | `q91lXp`  | [Link](https://www.clickview.net/us/high/topics/q91lXp/physics)                                |
| Chemistry               | الكيمياء           | `q91lXe`  | [Link](https://www.clickview.net/us/high/topics/q91lXe/chemistry)                              |
| Life Science            | الأحياء            | `q91lWP`  | [Link](https://www.clickview.net/us/high/topics/q91lWP/life-science)                           |
| Earth and Space Science | علوم الأرض والفضاء | `q91lYr`  | [Link](https://www.clickview.net/us/high/topics/q91lYr/earth-and-space-science)                |
| History                 | التاريخ            | `q91lQe`  | [Link](https://www.clickview.net/us/high/topics/q91lQe/history)                                |
| Geography               | الجغرافيا          | `q91laq`  | [Link](https://www.clickview.net/us/high/topics/q91laq/geography)                              |
| Civics and Government   | التربية المدنية    | `LlErbag` | [Link](https://www.clickview.net/us/high/topics/LlErbag/civics-and-government)                 |
| Business and Economics  | الاقتصاد           | `w2jGZbz` | [Link](https://www.clickview.net/us/high/topics/w2jGZbz/business-and-economics)                |
| Computer Science        | التقنية            | `q91lbb`  | [Link](https://www.clickview.net/us/high/topics/q91lbb/computer-science-and-technology)        |
| Arts                    | الفنون             | `q91lOg`  | [Link](https://www.clickview.net/us/high/topics/q91lOg/arts)                                   |
| Physical Education      | التربية البدنية    | `q91lZ1`  | [Link](https://www.clickview.net/us/high/topics/q91lZ1/physical-education)                     |
| Health                  | الصحة              | `w2jGZb3` | [Link](https://www.clickview.net/us/high/topics/w2jGZb3/health)                                |
| Languages               | اللغات             | `w2jGQJ7` | [Link](https://www.clickview.net/us/high/topics/w2jGQJ7/languages)                             |
| English Language Arts   | اللغة الإنجليزية   | `q91lPJ`  | [Link](https://www.clickview.net/us/high/topics/q91lPJ/english-language-arts)                  |
| Religion                | الفلسفة والأديان   | `LlErbam` | [Link](https://www.clickview.net/us/high/topics/LlErbam/religion)                              |
| Career Education        | التوجيه المهني     | `w2jGRa6` | [Link](https://www.clickview.net/us/high/topics/w2jGRa6/career-and-technical-education)        |
| Science and Engineering | الهندسة والعلوم    | `LlErqa7` | [Link](https://www.clickview.net/us/high/topics/LlErqa7/science-and-engineering-practices)     |
| Celebrations            | الاحتفالات         | `LlErqa4` | [Link](https://www.clickview.net/us/high/topics/LlErqa4/celebrations-commemorations-festivals) |
| Teacher Development     | التطوير المهني     | `w2jGRbW` | [Link](https://www.clickview.net/us/high/topics/w2jGRbW/teacher-professional-development)      |

---

## Testing

### Test Current Behavior (No Banners)

```bash
pnpm dev
```

Visit: `http://demo.localhost:3000/en/s/demo/subjects/{id}`

**Expected:**

- Subject hero displays with square illustration
- No broken images
- Proper fallback handling
- Smooth transitions

### Test With Banners (After Manual Addition)

1. **Add a single banner** to test:

   ```bash
   # Example: Add Math elementary banner
   # Save banner image to:
   /public/subjects/banners/elementary/الرياضيات-Dda6pW3.png
   ```

2. **Visit Math subject page** (elementary level)

3. **Expected:**
   - Wide horizontal banner displays
   - Dark gradient overlay visible
   - Text remains readable
   - Stats display correctly

4. **Test fallback:**
   - Rename banner file temporarily
   - Reload page
   - Should fallback to square illustration seamlessly

---

## Implementation Summary

| Component                  | Status      | Notes                       |
| -------------------------- | ----------- | --------------------------- |
| Banner resolution logic    | ✅ Complete | Three-tier fallback system  |
| Hero component enhancement | ✅ Complete | Level-aware, error handling |
| Subject detail integration | ✅ Complete | Passes level and imageKey   |
| Banner extraction script   | ✅ Complete | CDN blocked, manual needed  |
| TypeScript compilation     | ✅ Passing  | No errors                   |
| Fallback behavior          | ✅ Working  | Uses existing illustrations |
| Banner files               | ⏸️ Pending  | Requires manual addition    |

---

## Next Steps (Optional)

If you want to complete the banner integration:

1. **Quick Test (1 subject):**
   - Manually save one banner to test the system
   - Visit `/public/subjects/banners/elementary/`
   - Save a ClickView Math banner as `الرياضيات-Dda6pW3.png`
   - Test on `demo.localhost:3000`

2. **Full Integration (30 banners):**
   - Use browser automation to capture all banners
   - Script with Playwright or manual screenshots
   - Batch process and crop to 1200×222 aspect ratio
   - Save with correct naming convention

3. **Alternative Approach:**
   - Keep existing square illustrations (already high quality)
   - They work perfectly for the current design
   - ClickView-style banners are optional enhancement

---

## File Changes

| File                                                             | Type     | Lines Changed |
| ---------------------------------------------------------------- | -------- | ------------- |
| `src/components/school-dashboard/listings/subjects/image-map.ts` | Modified | +50 lines     |
| `src/components/school-dashboard/listings/subjects/hero.tsx`     | Modified | +20 lines     |
| `src/components/school-dashboard/listings/subjects/detail.tsx`   | Modified | +8 lines      |
| `scripts/extract-clickview-banners.ts`                           | Created  | +260 lines    |
| `scripts/clickview-data/subject-banner-urls.json`                | Created  | +30 entries   |

---

## Conclusion

The infrastructure is **production-ready** with intelligent fallbacks. The system works perfectly with existing illustrations and will automatically use ClickView banners when available. No code changes needed to add banners later - just drop the image files in the correct directories.
