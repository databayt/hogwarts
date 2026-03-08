# Quick Manual Banner Extraction Guide

## 🚀 Fast Extraction Method (~ 30 minutes for all 25)

### Setup (One Time)

1. Open this file and the extraction spreadsheet side-by-side
2. Have `scripts/clickview-data/all-banner-ids.json` ready to edit
3. Optional: Use a JSON editor for easier editing

### Extraction JavaScript (Copy This Once)

```javascript
// Paste this in browser console for EVERY page
const header = document.querySelector("header.banner")
const bg = window.getComputedStyle(header).backgroundImage
const match = bg.match(/banners\/([A-Za-z0-9]+)/)
const id = match ? match[1] : "NOT FOUND"
console.log("%c" + id, "font-size:24px; color:green; font-weight:bold")
copy(id) // Copies to clipboard!
```

**Tip:** The `copy(id)` command automatically copies the banner ID to your clipboard!

---

## 📋 Extraction List (25 Subjects)

### Elementary (1 subject - 2 min)

#### 1. Social Studies

- **URL:** https://www.clickview.net/us/elementary/topics/Kj8Vjbb/social-studies
- **JSON path:** `elementary.social-studies`
- Banner ID: `___________`

---

### Middle (4 subjects - 8 min)

#### 2. Arts

- **URL:** https://www.clickview.net/us/middle/topics/v4qyEzp/arts
- **JSON path:** `middle.arts`
- Banner ID: `___________`

#### 3. English Language Arts

- **URL:** https://www.clickview.net/us/middle/topics/v4qnrbz/english-language-arts
- **JSON path:** `middle.english-language-arts`
- Banner ID: `___________`

#### 4. Science

- **URL:** https://www.clickview.net/us/middle/topics/Kj8k1bg/science
- **JSON path:** `middle.science`
- Banner ID: `___________`

#### 5. Social Studies

- **URL:** https://www.clickview.net/us/middle/topics/v4qyrOx/social-studies
- **JSON path:** `middle.social-studies`
- Banner ID: `___________`

---

### High (20 subjects - 40 min)

#### 6. Arts

- **URL:** https://www.clickview.net/us/high/topics/q91lOg/arts
- **JSON path:** `high.arts`
- Banner ID: `___________`

#### 7. Business and Economics

- **URL:** https://www.clickview.net/us/high/topics/w2jGZbz/business-and-economics
- **JSON path:** `high.business-and-economics`
- Banner ID: `___________`

#### 8. Career and Technical Education

- **URL:** https://www.clickview.net/us/high/topics/w2jGRa6/career-and-technical-education
- **JSON path:** `high.career-and-technical-education`
- Banner ID: `___________`

#### 9. Celebrations, Commemorations & Festivals

- **URL:** https://www.clickview.net/us/high/topics/LlErqa4/celebrations-commemorations-festivals
- **JSON path:** `high.celebrations-commemorations-and-festivals`
- Banner ID: `___________`

#### 10. Chemistry

- **URL:** https://www.clickview.net/us/high/topics/q91lXe/chemistry
- **JSON path:** `high.chemistry`
- Banner ID: `___________`

#### 11. Civics and Government

- **URL:** https://www.clickview.net/us/high/topics/LlErbag/civics-and-government
- **JSON path:** `high.civics-and-government`
- Banner ID: `___________`

#### 12. Computer Science and Technology

- **URL:** https://www.clickview.net/us/high/topics/q91lbb/computer-science-and-technology
- **JSON path:** `high.computer-science-and-technology`
- Banner ID: `___________`

#### 13. Earth and Space Science

- **URL:** https://www.clickview.net/us/high/topics/q91lYr/earth-and-space-science
- **JSON path:** `high.earth-and-space-science`
- Banner ID: `___________`

#### 14. English Language Arts

- **URL:** https://www.clickview.net/us/high/topics/q91lPJ/english-language-arts
- **JSON path:** `high.english-language-arts`
- Banner ID: `___________`

#### 15. Geography

- **URL:** https://www.clickview.net/us/high/topics/q91laq/geography
- **JSON path:** `high.geography`
- Banner ID: `___________`

#### 16. Health

- **URL:** https://www.clickview.net/us/high/topics/w2jGZb3/health
- **JSON path:** `high.health`
- Banner ID: `___________`

#### 17. History

- **URL:** https://www.clickview.net/us/high/topics/q91lQe/history
- **JSON path:** `high.history`
- Banner ID: `___________`

#### 18. Languages

- **URL:** https://www.clickview.net/us/high/topics/w2jGQJ7/languages
- **JSON path:** `high.languages`
- Banner ID: `___________`

#### 19. Life Science

- **URL:** https://www.clickview.net/us/high/topics/q91lWP/life-science
- **JSON path:** `high.life-science`
- Banner ID: `___________`

#### 20. Math

- **URL:** https://www.clickview.net/us/high/topics/q91lR9/math
- **JSON path:** `high.math`
- Banner ID: `___________`

#### 21. Physical Education

- **URL:** https://www.clickview.net/us/high/topics/q91lZ1/physical-education
- **JSON path:** `high.physical-education`
- Banner ID: `___________`

#### 22. Physics

- **URL:** https://www.clickview.net/us/high/topics/q91lXp/physics
- **JSON path:** `high.physics`
- Banner ID: `___________`

#### 23. Religion

- **URL:** https://www.clickview.net/us/high/topics/LlErbam/religion
- **JSON path:** `high.religion`
- Banner ID: `___________`

#### 24. Science and Engineering Practices

- **URL:** https://www.clickview.net/us/high/topics/LlErqa7/science-and-engineering-practices
- **JSON path:** `high.science-and-engineering-practices`
- Banner ID: `___________`

#### 25. Teacher Professional Development

- **URL:** https://www.clickview.net/us/high/topics/w2jGRbW/teacher-professional-development
- **JSON path:** `high.teacher-professional-development`
- Banner ID: `___________`

---

## 🔄 Workflow (Per Subject - ~90 seconds)

1. **Click URL** (or Cmd+Click for new tab)
2. **Wait for page load** (~10 seconds)
3. **Open DevTools** (F12 or Cmd+Option+I)
4. **Go to Console tab**
5. **Paste extraction script** and press Enter
6. **Banner ID is automatically copied to clipboard**
7. **Paste into the `___________` blank above**
8. **Move to next subject**

---

## 📝 After Extraction - Update JSON

### Current JSON Structure:

```json
{
  "elementary": {
    "math": "JpowLk",
    "science": "ekgboo",
    "arts": "9DNoG6",
    "english-language-arts": "1d3gbd"
  },
  "middle": {
    "math": "eKgrzn"
  },
  "high": {}
}
```

### Add Extracted IDs:

Edit `scripts/clickview-data/all-banner-ids.json`:

```json
{
  "elementary": {
    "math": "JpowLk",
    "science": "ekgboo",
    "arts": "9DNoG6",
    "english-language-arts": "1d3gbd",
    "social-studies": "PASTE_ID_HERE"
  },
  "middle": {
    "math": "eKgrzn",
    "arts": "PASTE_ID_HERE",
    "english-language-arts": "PASTE_ID_HERE",
    "science": "PASTE_ID_HERE",
    "social-studies": "PASTE_ID_HERE"
  },
  "high": {
    "arts": "PASTE_ID_HERE",
    "business-and-economics": "PASTE_ID_HERE",
    "career-and-technical-education": "PASTE_ID_HERE",
    "celebrations-commemorations-and-festivals": "PASTE_ID_HERE",
    "chemistry": "PASTE_ID_HERE",
    "civics-and-government": "PASTE_ID_HERE",
    "computer-science-and-technology": "PASTE_ID_HERE",
    "earth-and-space-science": "PASTE_ID_HERE",
    "english-language-arts": "PASTE_ID_HERE",
    "geography": "PASTE_ID_HERE",
    "health": "PASTE_ID_HERE",
    "history": "PASTE_ID_HERE",
    "languages": "PASTE_ID_HERE",
    "life-science": "PASTE_ID_HERE",
    "math": "PASTE_ID_HERE",
    "physical-education": "PASTE_ID_HERE",
    "physics": "PASTE_ID_HERE",
    "religion": "PASTE_ID_HERE",
    "science-and-engineering-practices": "PASTE_ID_HERE",
    "teacher-professional-development": "PASTE_ID_HERE"
  }
}
```

---

## ⬇️ Download All Banners

After updating the JSON file, run:

```bash
npx tsx scripts/download-all-banners.ts
```

This will download all 25 remaining banners automatically!

---

## ✅ Verification

After downloading, verify:

```bash
# Count downloaded banners (should be 30)
ls -1 public/clickview/banners/*.jpg | wc -l

# Check sizes (all should be >30 KB)
ls -lh public/clickview/banners/

# Total size
du -sh public/clickview/banners
```

---

## 💡 Pro Tips

1. **Use Multiple Tabs:** Open 5 URLs at once, let them load while you extract from the first
2. **Keyboard Shortcuts:**
   - Cmd+T: New tab
   - Cmd+W: Close tab
   - Cmd+Option+I: Open DevTools
   - Cmd+V: Paste script
   - Enter: Run script
   - Cmd+Tab: Switch apps
3. **Audio Cue:** Play music - when page loads and music gets choppy, it's ready
4. **Break It Up:** Do Elementary (2 min), take break, Middle (8 min), break, High batch 1 (20 min), break, High batch 2 (20 min)

---

## 🎯 Expected Timeline

- **Elementary:** 2 minutes (1 subject)
- **Middle:** 8 minutes (4 subjects)
- **High:** 40 minutes (20 subjects)
- **JSON Update:** 5 minutes
- **Download:** 30 seconds
- **Total:** ~55 minutes

But realistically with multi-tabbing: **~30 minutes**

---

**Ready to start? Begin with Elementary #1!** 🚀
