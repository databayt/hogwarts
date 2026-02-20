# ClickView US Curriculum Clone

Reference document for maintaining parity with ClickView's US curriculum catalog.

## Reference URLs

| Level      | Discover Page                           | Count  |
| ---------- | --------------------------------------- | ------ |
| Elementary | https://www.clickview.net/us/elementary | 18     |
| Middle     | https://www.clickview.net/us/middle     | 21     |
| High       | https://www.clickview.net/us/high       | 23     |
| **Total**  |                                         | **62** |

## Data Pipeline

```
ClickView Discover Pages
  → Browser MCP scrape (complete-subjects.json)
  → Cover image download (public/clickview/illustrations/)
  → master-inventory.json (groups + topics with ?width=2048)
  → clickview-catalog seed (CatalogSubject/Chapter/Lesson)
  → clickview-images seed (Sharp → WebP → S3/CloudFront)
  → SubjectPicker component (thumbnailKey → CDN URL)
```

## Image Pipeline

| Image Type          | Source                                           | Local Path                                          | S3 Key Pattern                                          |
| ------------------- | ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| Illustration (tile) | `img.clickviewapp.com/v2/covers/{id}?width=2048` | `public/clickview/illustrations/{level}-{slug}.jpg` | `catalog/subjects/{level}-{slug}/thumbnail-{size}.webp` |
| Banner (hero)       | Subject detail page hero                         | `public/clickview/banners/{level}-{slug}.jpg`       | `catalog/subjects/{level}-{slug}/thumbnail-{size}.webp` |
| Topic cover         | `img.clickviewapp.com/v2/covers/{id}?width=2048` | Remote URL stored in `imageKey`                     | N/A (served directly from ClickView CDN)                |

WebP variants: `sm` (200px), `md` (600px), `lg` (1200px), `original` (full res)

## Subject Inventory

### Elementary (18)

| Subject                                    | Slug                                      | Cover ID | Color              |
| ------------------------------------------ | ----------------------------------------- | -------- | ------------------ |
| Arts                                       | arts                                      | k3qmrz   | rgb(255, 156, 149) |
| Celebrations, Commemorations and Festivals | celebrations-commemorations-and-festivals | OzrbLo   | rgb(255, 100, 100) |
| Civics and Government                      | civics-and-government                     | 5b2D8o   | rgb(255, 122, 66)  |
| Computer Science and Technology            | computer-science-and-technology           | 3b4wMw   | rgb(122, 118, 232) |
| Earth and Space Science                    | earth-and-space-science                   | JjoLz1   | rgb(76, 104, 219)  |
| Economics                                  | economics                                 | dlMeAE   | rgb(0, 82, 255)    |
| English Language Arts                      | english-language-arts                     | GxZkJ1   | rgb(255, 150, 182) |
| Geography                                  | geography                                 | k35GGd   | rgb(64, 188, 195)  |
| Health                                     | health                                    | p3DWGv   | rgb(40, 183, 107)  |
| History                                    | history                                   | 6w4KZg   | rgb(254, 180, 0)   |
| Life Science                               | life-science                              | kZjoya   | rgb(76, 104, 219)  |
| Life Skills                                | life-skills                               | nKZbLY   | rgb(93, 199, 134)  |
| Math                                       | math                                      | 3k4Kww   | rgb(56, 162, 232)  |
| Physical Education                         | physical-education                        | g46bgG   | rgb(64, 194, 187)  |
| Physical Science                           | physical-science                          | wLD3o4   | rgb(76, 104, 219)  |
| Religion                                   | religion                                  | JpZyz7   | rgb(182, 121, 199) |
| Teacher Professional Development           | teacher-professional-development          | bbAMgy   | rgb(207, 167, 247) |
| World Languages                            | world-languages                           | 7Pdo3e   | rgb(225, 99, 172)  |

### Middle (21)

| Subject                           | Slug                              | Cover ID | Color              |
| --------------------------------- | --------------------------------- | -------- | ------------------ |
| Arts                              | arts                              | 3k8qaE   | rgb(243, 122, 185) |
| Careers and Technical Education   | careers-and-technical-education   | vYJ2yG   | rgb(140, 91, 201)  |
| Chemical Science                  | chemical-science                  | MYZkxO   | rgb(245, 135, 236) |
| Civics and Government             | civics-and-government             | xAe24w   | rgb(81, 173, 163)  |
| Computer Science and Technology   | computer-science-and-technology   | JpK0qk   | rgb(140, 91, 201)  |
| Earth and Space Science           | earth-and-space-science           | 1d3aNn   | rgb(137, 113, 219) |
| Economics                         | economics                         | Y6N0LP   | rgb(19, 45, 163)   |
| English Language Arts             | english-language-arts             | 3k4Ej2   | rgb(179, 52, 77)   |
| Geography                         | geography                         | wL3Oop   | rgb(45, 134, 114)  |
| Health                            | health                            | LqAqmL   | rgb(96, 183, 137)  |
| Life Science                      | life-science                      | NqER0w   | rgb(74, 176, 214)  |
| Life Skills                       | life-skills                       | bmzjNb   | rgb(96, 183, 137)  |
| Math                              | math                              | 4GdA2L   | rgb(78, 154, 206)  |
| Physical Education                | physical-education                | m0oyek   | rgb(222, 94, 97)   |
| Physical Science                  | physical-science                  | dlm51Y   | rgb(96, 93, 180)   |
| Religion and Ethics               | religion-and-ethics               | k3LmJ9   | rgb(241, 172, 179) |
| Science and Engineering Practices | science-and-engineering-practices | 1M3Doj   | rgb(137, 113, 219) |
| Teacher Professional Development  | teacher-professional-development  | qdbDr5   | rgb(125, 206, 201) |
| U.S. History                      | u-s-history                       | wL74qD   | rgb(227, 113, 76)  |
| World History                     | world-history                     | g7qZlD   | rgb(227, 113, 76)  |
| World Languages                   | world-languages                   | m0opo7   | rgb(241, 91, 129)  |

### High (23)

| Subject                           | Slug                              | Cover ID | Color              |
| --------------------------------- | --------------------------------- | -------- | ------------------ |
| Arts                              | arts                              | 8LvEMe   | rgb(243, 122, 185) |
| Business and Economics            | business-and-economics            | p082dA   | rgb(19, 45, 163)   |
| Career and Technical Education    | career-and-technical-education    | dlNrG3   | rgb(140, 91, 201)  |
| Chemistry                         | chemistry                         | 2je3Jo   | rgb(245, 135, 236) |
| Civics and Government             | civics-and-government             | 3b4NpA   | rgb(81, 173, 163)  |
| Computer Science and Technology   | computer-science-and-technology   | OzLewo   | rgb(140, 91, 201)  |
| Earth and Space Science           | earth-and-space-science           | 1d3Jvq   | rgb(96, 93, 180)   |
| English Language Arts             | english-language-arts             | 0OJvLj   | rgb(179, 52, 77)   |
| Geography                         | geography                         | nKR9oL   | rgb(45, 134, 114)  |
| Health                            | health                            | r4n3jL   | rgb(96, 183, 137)  |
| Life Sciences                     | life-sciences                     | ZApjR1   | rgb(74, 176, 214)  |
| Life Skills                       | life-skills                       | q6mDw6   | rgb(96, 183, 137)  |
| Math                              | math                              | PkPpln   | rgb(78, 154, 206)  |
| Physical Education                | physical-education                | laDMvd   | rgb(222, 94, 97)   |
| Physics                           | physics                           | v4JDk6   | rgb(96, 93, 180)   |
| Psychology                        | psychology                        | AOK3jj   | rgb(202, 134, 214) |
| Religion and Philosophy           | religion-and-philosophy           | 7mqk4q   | rgb(241, 172, 179) |
| Science and Engineering Practices | science-and-engineering-practices | Rbv4m6   | rgb(137, 113, 219) |
| Sociology                         | sociology                         | dqKkWZ   | rgb(251, 135, 79)  |
| Teacher Professional Development  | teacher-professional-development  | 5Rndrb   | rgb(125, 206, 201) |
| U.S. History                      | u-s-history                       | 7P6eGD   | rgb(227, 113, 76)  |
| World History                     | world-history                     | aPzD70   | rgb(227, 113, 76)  |
| World Languages                   | world-languages                   | bb1jDL   | rgb(241, 91, 129)  |

## Key Files

| File                                            | Purpose                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| `scripts/clickview-data/complete-subjects.json` | Scraped subject data (names, cover IDs, colors, URLs) |
| `scripts/clickview-data/master-inventory.json`  | 62 subjects with groups/topics (high-res URLs)        |
| `scripts/clickview-data/all-banners.json`       | Banner URLs and colors for all 62 subjects            |
| `public/clickview/illustrations/`               | 62 downloaded cover images (discover page tiles)      |
| `public/clickview/banners/`                     | Banner images (detail page heroes)                    |
| `prisma/seeds/clickview-catalog.ts`             | Seed: inventory → CatalogSubject/Chapter/Lesson       |
| `prisma/seeds/clickview-images.ts`              | Seed: local images → S3 WebP variants                 |
| `src/lib/catalog-image.ts`                      | Sharp → WebP → S3 processing pipeline                 |
| `src/lib/catalog-image-url.ts`                  | Client-safe CDN URL resolution                        |

## Seeds

```bash
pnpm db:seed:single clickview-catalog   # Upsert 62 subjects, 201 chapters, 986 lessons
pnpm db:seed:single clickview-images    # Process illustrations → S3/CloudFront WebP
```

## Verification

```sql
-- Subject count
SELECT COUNT(*) FROM catalog_subjects WHERE system = 'clickview';  -- Expected: 62

-- Subjects with thumbnails (after image seed)
SELECT COUNT(*) FROM catalog_subjects WHERE system = 'clickview' AND "thumbnailKey" IS NOT NULL;

-- Subjects with illustration imageKey
SELECT COUNT(*) FROM catalog_subjects WHERE system = 'clickview' AND "imageKey" LIKE '/clickview/illustrations/%';
```

## Last Updated

- Scraped: 2026-02-18
- Subjects: 62 (18 elementary + 21 middle + 23 high)
- Illustrations: 62/62 downloaded
- Topic URLs: All upgraded to ?width=2048
