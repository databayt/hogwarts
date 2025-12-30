/**
 * Download ClickView Educational Images
 *
 * Downloads 68 topic images from ClickView for course seeding.
 * Images are saved to /public/courses/ with clean filenames.
 *
 * Usage: pnpm tsx scripts/download-clickview-images.ts
 */

import * as fs from "fs"
import * as https from "https"
import * as path from "path"

const OUTPUT_DIR = path.join(process.cwd(), "public", "courses")

// All ClickView topic images with their source URLs
const CLICKVIEW_IMAGES = [
  // Mathematics
  {
    name: "algebra",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_algebra.d3e5c38b.png",
  },
  {
    name: "geometry",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_geometry.560cd3a5.png",
  },
  {
    name: "2d-shapes",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_2d_shapes.e3e5cd81.png",
  },
  {
    name: "symmetry",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_symmetry.87cb6d32.png",
  },
  {
    name: "math-foundations",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_math_foundations.28386383.png",
  },
  {
    name: "data-and-information",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_data_and_information.227d160d.png",
  },

  // Sciences
  {
    name: "volcanoes",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_volcanoes.cbf872cb.png",
  },
  {
    name: "the-solar-system",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_the_solar_system.0f705ac3.png",
  },
  {
    name: "atoms-and-bonding",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_atoms_and_bonding.9a311c49.png",
  },
  {
    name: "forces-and-motion",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_forces_and_motion.5fdbdcfa.png",
  },
  {
    name: "cellular-structure-and-function",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_cellullar_structure_and_function.15370641.png",
  },
  {
    name: "living-and-non-living-things",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_living_and_non-living_things.8634708b.png",
  },
  {
    name: "adaptations",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_adaptations.13b0ce48.png",
  },
  {
    name: "weather-and-seasons",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_weather_and_seasons.278bc8b4.png",
  },
  {
    name: "climate-and-weather",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_climate_and_weather.be23cc76.png",
  },
  {
    name: "natural-resources",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_natural_resources.4efd70df.png",
  },
  {
    name: "bees",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_bees.a31bef06.png",
  },
  {
    name: "recycling",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_recycling.1ecf7c7c.png",
  },

  // Languages & Literature
  {
    name: "grammar",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_grammar.68940f4f.png",
  },
  {
    name: "literature",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_literature.90d127ff.png",
  },
  {
    name: "characterization",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_characterization.068209cd.png",
  },
  {
    name: "alliteration-and-onomatopoeia",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_alliteration_and_onomatopoeia.eef3d65c.png",
  },
  {
    name: "world-languages",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_world_languages.6e5d6bae.png",
  },
  {
    name: "book-week",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_book_week.2e94c205.png",
  },
  {
    name: "parts-of-the-body-and-five-senses",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_parts_of_the_body_%26_five_senses.dbb21994.png",
  },
  {
    name: "seasons",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_seasons.1d23e2f3.png",
  },

  // Social Studies & History
  {
    name: "us-history",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_us_history.b7ca8891.png",
  },
  {
    name: "world-history",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_world_history.b442120e.png",
  },
  {
    name: "civil-rights-movement",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_civil_rights_movement.e8ef23ed.png",
  },
  {
    name: "the-united-states-as-a-nation",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_the_united_states_as_a_nation.634167a5.png",
  },
  {
    name: "map-skills",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_map_skills.2bba01d3.png",
  },
  {
    name: "culture-and-society",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_culture_and_society.3128f32b.png",
  },
  {
    name: "identity-and-community",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_identity_and_community.f4311a22.png",
  },
  {
    name: "rights-and-advocacy",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_rights_and_advocacy.20a4a4a2.png",
  },
  {
    name: "changemakers",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_changemakers.cc2c51c1.png",
  },
  {
    name: "veterans-day",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_veterans_day.6a2ee48d.png",
  },

  // Health & Wellness
  {
    name: "physical-education",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_physical_education.558b7472.png",
  },
  {
    name: "mental-and-emotional-wellbeing",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_mental_and_emotional_wellbeing.9664b50f.png",
  },
  {
    name: "healthy-lifestyle",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_healthy_lifestyle.90cb643c.png",
  },
  {
    name: "resilience",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_resilience.26e8d0e4.png",
  },
  {
    name: "friendship",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_friendship.1b96315a.png",
  },
  {
    name: "bullying",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_bullying.3df43c8e.png",
  },
  {
    name: "decision-making",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_decision_making.f9a2a18f.png",
  },
  {
    name: "national-fitness-day",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_national_fitness_day.445a7807.png",
  },

  // Arts & Media
  {
    name: "visual-arts",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_visual_arts.4dda868e.png",
  },
  {
    name: "music",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_music.1088f124.png",
  },
  {
    name: "drama-and-theater",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_drama_and_theater.faaa1bee.png",
  },
  {
    name: "video-production",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_video_production.ee157fd5.png",
  },
  {
    name: "media-literacy",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_media_literacy.9b7cda54.png",
  },
  {
    name: "thanksgiving",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_thanksgiving.4495077c.png",
  },

  // Technology & Computing
  {
    name: "coding-and-computer-programming",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_coding_and_computer_programming.d90290f2.png",
  },
  {
    name: "programming-and-coding",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_programming_and_coding.abf6b870.png",
  },
  {
    name: "digital-citizenship",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_digital_citizenship.f7996f13.png",
  },
  {
    name: "study-skills",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_study_skills.74a64deb.png",
  },
  {
    name: "career-and-technical-education",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_career_and_technical_education.396f76d7.png",
  },
  {
    name: "business",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_business.4a60ad3b.png",
  },

  // Religion & Philosophy
  {
    name: "world-religions",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_world_religions.3e308429.png",
  },
  {
    name: "psychology",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_psychology.a2b9d4cf.png",
  },
  {
    name: "teacher-professional-development",
    url: "https://www.clickvieweducation.com/_next/static/media/clickview_teacher_professional_development.00ba747f.png",
  },
]

function downloadImage(
  url: string,
  filepath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(filepath)

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve({ success: true })
          })
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(filepath)
            downloadImage(redirectUrl, filepath).then(resolve)
          } else {
            resolve({ success: false, error: "Redirect without location" })
          }
        } else {
          resolve({
            success: false,
            error: `HTTP ${response.statusCode}`,
          })
        }
      })
      .on("error", (err) => {
        fs.unlinkSync(filepath)
        resolve({ success: false, error: err.message })
      })
  })
}

async function main() {
  console.log("🎨 ClickView Image Downloader")
  console.log("============================\n")

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const image of CLICKVIEW_IMAGES) {
    const filename = `${image.name}.png`
    const filepath = path.join(OUTPUT_DIR, filename)

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped (exists): ${filename}`)
      skipped++
      continue
    }

    const result = await downloadImage(image.url, filepath)

    if (result.success) {
      console.log(`✅ Downloaded: ${filename}`)
      downloaded++
    } else {
      console.log(`❌ Failed: ${filename} - ${result.error}`)
      failed++
    }

    // Small delay to be respectful to the server
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log("\n============================")
  console.log(`📊 Summary:`)
  console.log(`   Downloaded: ${downloaded}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${CLICKVIEW_IMAGES.length}`)
  console.log(`\n📁 Output: ${OUTPUT_DIR}`)
}

main().catch(console.error)
