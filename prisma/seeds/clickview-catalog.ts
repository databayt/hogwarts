/**
 * ClickView Catalog Seed
 *
 * Imports 62 US/ClickView subjects from master-inventory.json into the global catalog:
 *   62 CatalogSubjects → 201 CatalogChapters → 986 CatalogLessons
 *
 * Uses upsert with slug for idempotency. Updates denormalized counts.
 * Subject imageKey uses illustration cover images from complete-subjects.json.
 * Lesson imageKey uses high-res ?width=2048 URLs.
 *
 * Usage: pnpm db:seed:single clickview-catalog
 */

import fs from "fs"
import path from "path"
import type { PrismaClient, SchoolLevel } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// Types for master-inventory.json
// ============================================================================

interface ClickViewTopic {
  name: string
  slug: string
  imgSrc: string
  stats: string // "20 videos  • 9 resources"
}

interface ClickViewGroup {
  parent: string
  topics: ClickViewTopic[]
}

interface ClickViewEntry {
  subjectName: string
  level: "elementary" | "middle" | "high"
  url: string
  groups: ClickViewGroup[]
}

// ============================================================================
// Helpers
// ============================================================================

function levelToSchoolLevel(level: string): SchoolLevel {
  switch (level) {
    case "elementary":
      return "ELEMENTARY"
    case "middle":
      return "MIDDLE"
    case "high":
      return "HIGH"
    default:
      return "ELEMENTARY"
  }
}

function levelToGrades(level: string): number[] {
  switch (level) {
    case "elementary":
      return [1, 2, 3, 4, 5, 6]
    case "middle":
      return [7, 8, 9]
    case "high":
      return [10, 11, 12]
    default:
      return [1, 2, 3, 4, 5, 6]
  }
}

function toSubjectSlug(level: string, name: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
  return `${level}-${nameSlug}`
}

function toChapterSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

function parseStats(stats: string): {
  videoCount: number
  resourceCount: number
} {
  const videoMatch = stats.match(/(\d+)\s*videos?/i)
  const resourceMatch = stats.match(/(\d+)\s*resources?/i)
  return {
    videoCount: videoMatch ? parseInt(videoMatch[1], 10) : 0,
    resourceCount: resourceMatch ? parseInt(resourceMatch[1], 10) : 0,
  }
}

function extractClickViewId(url: string | undefined): string | null {
  if (!url) return null
  // Extract ID from URL like /us/elementary/topics/GxAzY0z/arts
  const match = url.match(/\/topics\/([^/]+)\//)
  return match ? match[1] : null
}

function extractCoverId(imgSrc: string): string | null {
  // Extract cover ID from URL like https://img.clickviewapp.com/v2/covers/0wrjm3?size=medium
  const match = imgSrc.match(/\/covers\/([^?/]+)/)
  return match ? match[1] : null
}

/** Convert "rgb(R, G, B)" → "#rrggbb" */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/)
  if (!match) return null
  const [, r, g, b] = match.map(Number)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Descriptions keyed by subject name (shared across elementary/middle/high)
const SUBJECT_DESCRIPTIONS: Record<string, string> = {
  Arts: "Explore visual arts, music, drama, and creative expression through hands-on projects and guided instruction.",
  "Celebrations, Commemorations and Festivals":
    "Discover cultural celebrations, historical commemorations, and festivals from around the world.",
  "Civics and Government":
    "Understand how governments work, the rights and responsibilities of citizens, and the foundations of democracy.",
  "Computer Science and Technology":
    "Learn programming fundamentals, digital literacy, and how technology shapes the modern world.",
  "Earth and Space Science":
    "Investigate Earth's systems, weather, geology, and the wonders of our solar system and beyond.",
  Economics:
    "Study how economies function, from supply and demand to global trade and personal finance.",
  "English Language Arts":
    "Develop reading comprehension, writing skills, grammar, and literary analysis across diverse texts.",
  Geography:
    "Explore the physical and human geography of our world, from landforms and climates to cultures and populations.",
  Health:
    "Build knowledge of nutrition, mental health, personal wellness, and healthy decision-making.",
  History:
    "Journey through key historical events, civilizations, and the people who shaped our world.",
  Languages:
    "Develop skills in world languages through vocabulary, grammar, conversation, and cultural context.",
  "Life Science":
    "Discover the living world — cells, organisms, ecosystems, and the processes that sustain life.",
  "Life Skills":
    "Develop practical skills for everyday life, including communication, problem-solving, and personal management.",
  Math: "Build strong mathematical foundations through problem-solving, critical thinking, and real-world applications.",
  "Physical Education":
    "Stay active and learn about fitness, teamwork, sportsmanship, and lifelong health habits.",
  "Physical Science":
    "Investigate matter, energy, forces, and motion through observation and experimentation.",
  Religion:
    "Explore world religions, spiritual traditions, and their influence on history and culture.",
  Science:
    "Engage with scientific inquiry across disciplines through observation, experimentation, and analysis.",
  "Social Studies":
    "Examine societies, cultures, and civic life to understand the world and your place in it.",
  "Teacher Professional Development":
    "Resources and strategies to enhance teaching practice, classroom management, and student engagement.",
  "World Languages":
    "Develop proficiency in world languages through immersive lessons in vocabulary, grammar, and culture.",
  "Business and Economics":
    "Learn the fundamentals of business operations, entrepreneurship, and economic principles.",
  "Career and Technical Education":
    "Prepare for careers with practical skills in technology, trades, and professional development.",
  "Careers and Technical Education":
    "Prepare for careers with practical skills in technology, trades, and professional development.",
  Chemistry:
    "Study the composition, structure, and reactions of matter at the atomic and molecular level.",
  "Chemical Science":
    "Explore the properties and transformations of matter through chemical reactions and laboratory techniques.",
  "Science and Engineering Practices":
    "Apply the scientific method and engineering design process to solve real-world problems.",
  "U.S. History":
    "Trace the story of the United States from its founding through the modern era.",
  "World History":
    "Survey the major civilizations, events, and movements that have shaped human history across the globe.",
  "Religion and Ethics":
    "Examine religious traditions and ethical frameworks that guide moral reasoning and decision-making.",
  Psychology:
    "Study human behavior, cognition, and emotion to understand how the mind works.",
  Sociology:
    "Analyze social structures, institutions, and interactions that shape communities and societies.",
  "Music Composition":
    "Learn the art and craft of creating music, from melody and harmony to arrangement and production.",
  Physics:
    "Explore the fundamental laws governing motion, energy, electricity, and the structure of the universe.",
  Biology:
    "Study living organisms, from cellular processes and genetics to ecology and evolution.",
  "Life Sciences":
    "Discover the living world — cells, organisms, ecosystems, and the processes that sustain life.",
  "Religion and Philosophy":
    "Explore religious traditions and philosophical thought that shape human understanding and values.",
}

// Learning objectives per subject slug (3-5 bullet points)
const SLUG_OBJECTIVES: Record<string, string[]> = {
  // ── Elementary ──
  "elementary-arts": [
    "Explore drawing, painting, and sculpture techniques",
    "Identify elements of art such as line, shape, and color",
    "Express ideas and emotions through creative projects",
    "Appreciate art from different cultures and time periods",
  ],
  "elementary-celebrations-commemorations-and-festivals": [
    "Identify major cultural celebrations around the world",
    "Understand the historical origins of key holidays",
    "Compare traditions and customs across cultures",
    "Explain why communities celebrate together",
  ],
  "elementary-civics-and-government": [
    "Understand the roles of community leaders and government",
    "Explain basic rights and responsibilities of citizens",
    "Identify symbols and landmarks of the United States",
    "Describe how rules and laws help communities",
  ],
  "elementary-computer-science-and-technology": [
    "Understand basic computer operations and digital tools",
    "Follow step-by-step instructions to solve problems (algorithmic thinking)",
    "Practice internet safety and responsible digital citizenship",
    "Create simple programs using block-based coding",
  ],
  "elementary-earth-and-space-science": [
    "Describe Earth's major landforms and bodies of water",
    "Explain basic weather patterns and the water cycle",
    "Identify planets in our solar system",
    "Understand how natural resources are used and conserved",
  ],
  "elementary-economics": [
    "Distinguish between needs and wants",
    "Understand the concept of goods, services, and trade",
    "Explain how supply and demand affect prices",
    "Recognize the role of money in everyday transactions",
  ],
  "elementary-english-language-arts": [
    "Read and comprehend grade-level texts fluently",
    "Write organized paragraphs with clear main ideas",
    "Build vocabulary through context clues and word study",
    "Develop listening and speaking skills for effective communication",
  ],
  "elementary-geography": [
    "Read and interpret basic maps and globes",
    "Identify continents, oceans, and major landforms",
    "Understand the relationship between people and their environment",
    "Compare communities in different geographic regions",
  ],
  "elementary-health": [
    "Identify healthy food choices and nutrition basics",
    "Understand the importance of hygiene and personal care",
    "Recognize emotions and develop coping strategies",
    "Practice safety habits at home and school",
  ],
  "elementary-history": [
    "Sequence key events on a timeline",
    "Identify important historical figures and their contributions",
    "Compare life in the past with life today",
    "Understand how communities change over time",
  ],
  "elementary-life-science": [
    "Classify living and nonliving things",
    "Describe plant and animal life cycles",
    "Explain basic food chains and ecosystems",
    "Understand how organisms adapt to their environments",
  ],
  "elementary-life-skills": [
    "Practice effective communication and active listening",
    "Develop organizational and time-management habits",
    "Set personal goals and track progress",
    "Demonstrate cooperation and teamwork",
  ],
  "elementary-math": [
    "Count, compare, and order whole numbers",
    "Add and subtract with fluency",
    "Recognize basic shapes and patterns",
    "Solve simple word problems using visual models",
  ],
  "elementary-physical-education": [
    "Develop fundamental movement skills (running, jumping, throwing)",
    "Understand the importance of regular physical activity",
    "Practice teamwork and sportsmanship",
    "Follow rules and safety guidelines during games",
  ],
  "elementary-physical-science": [
    "Investigate properties of matter (solid, liquid, gas)",
    "Explore how forces like pushes and pulls affect motion",
    "Understand basic concepts of energy and heat",
    "Conduct simple experiments and record observations",
  ],
  "elementary-religion": [
    "Explore stories and teachings from world religions",
    "Identify common values shared across traditions",
    "Understand the role of religion in community life",
    "Respect diverse beliefs and practices",
  ],
  "elementary-teacher-professional-development": [
    "Apply evidence-based strategies for elementary instruction",
    "Design engaging, age-appropriate learning activities",
    "Use formative assessment to guide teaching decisions",
    "Foster inclusive and supportive classroom environments",
  ],
  "elementary-world-languages": [
    "Learn basic greetings and everyday phrases in a new language",
    "Build foundational vocabulary for common topics",
    "Understand simple spoken and written sentences",
    "Appreciate cultural practices of language communities",
  ],

  // ── Middle ──
  "middle-arts": [
    "Apply principles of design in visual and performing arts",
    "Analyze artistic works from various periods and cultures",
    "Develop technical skills in chosen art forms",
    "Create original works that communicate personal ideas",
  ],
  "middle-careers-and-technical-education": [
    "Explore a range of career pathways and industries",
    "Develop practical skills for workplace readiness",
    "Understand the connection between education and career goals",
    "Apply technology tools used in professional settings",
  ],
  "middle-chemical-science": [
    "Describe the structure of atoms and molecules",
    "Classify elements using the periodic table",
    "Explain chemical reactions and conservation of mass",
    "Investigate the properties of acids, bases, and solutions",
  ],
  "middle-civics-and-government": [
    "Analyze the structure and functions of U.S. government",
    "Compare different systems of government worldwide",
    "Evaluate the rights and responsibilities of citizens",
    "Understand how laws are created, enforced, and interpreted",
  ],
  "middle-computer-science-and-technology": [
    "Write programs using text-based coding languages",
    "Understand data structures and basic algorithms",
    "Evaluate digital information for reliability and bias",
    "Design solutions to real-world problems using technology",
  ],
  "middle-earth-and-space-science": [
    "Explain plate tectonics and Earth's geological processes",
    "Analyze weather systems and climate patterns",
    "Describe the life cycle of stars and the structure of the universe",
    "Investigate the impact of human activity on Earth systems",
  ],
  "middle-economics": [
    "Analyze how markets allocate resources through supply and demand",
    "Understand the role of government in the economy",
    "Evaluate trade-offs in personal and national economic decisions",
    "Explain how globalization affects trade and economies",
  ],
  "middle-english-language-arts": [
    "Analyze literary elements in fiction and nonfiction texts",
    "Write argumentative, informative, and narrative essays",
    "Conduct research and cite sources properly",
    "Strengthen vocabulary and grammar for effective expression",
  ],
  "middle-geography": [
    "Interpret thematic maps, charts, and geographic data",
    "Analyze how physical geography influences human settlement",
    "Examine the effects of migration and urbanization",
    "Evaluate human impact on the environment",
  ],
  "middle-health": [
    "Understand body systems and how they interact",
    "Analyze the effects of nutrition and exercise on health",
    "Develop strategies for managing stress and mental health",
    "Evaluate risks associated with substance use and peer pressure",
  ],
  "middle-life-science": [
    "Explain cell structure and function in plants and animals",
    "Describe genetics, heredity, and natural selection",
    "Analyze ecosystems and the flow of energy through food webs",
    "Investigate the impact of environmental changes on biodiversity",
  ],
  "middle-life-skills": [
    "Apply conflict resolution and problem-solving strategies",
    "Practice financial literacy basics (budgeting, saving)",
    "Develop study skills and self-directed learning habits",
    "Demonstrate responsible decision-making in daily life",
  ],
  "middle-math": [
    "Work with ratios, proportions, and percentages",
    "Solve equations and inequalities with one variable",
    "Analyze geometric figures and apply area and volume formulas",
    "Interpret and create statistical representations of data",
  ],
  "middle-physical-education": [
    "Improve fitness through structured training and conditioning",
    "Apply strategies and tactics in team and individual sports",
    "Assess personal fitness levels and set improvement goals",
    "Understand the relationship between physical activity and lifelong health",
  ],
  "middle-physical-science": [
    "Investigate the relationship between force, mass, and acceleration",
    "Understand energy transformations and the law of conservation of energy",
    "Explore properties of waves including sound and light",
    "Conduct experiments with controlled variables and analyze results",
  ],
  "middle-religion-and-ethics": [
    "Compare the core beliefs and practices of major world religions",
    "Analyze ethical dilemmas using different moral frameworks",
    "Understand the historical impact of religion on societies",
    "Develop critical thinking about values and ethical reasoning",
  ],
  "middle-science-and-engineering-practices": [
    "Design and conduct scientific investigations",
    "Apply the engineering design process to solve problems",
    "Analyze and interpret data using mathematical reasoning",
    "Construct evidence-based explanations and arguments",
  ],
  "middle-teacher-professional-development": [
    "Implement differentiated instruction for diverse learners",
    "Use data-driven approaches to improve student outcomes",
    "Integrate technology effectively into middle school curricula",
    "Build collaborative learning communities among staff",
  ],
  "middle-us-history": [
    "Analyze key events from colonization through Reconstruction",
    "Evaluate the causes and effects of the American Revolution",
    "Understand the development of the U.S. Constitution and Bill of Rights",
    "Examine the social and economic factors leading to the Civil War",
  ],
  "middle-world-history": [
    "Trace the rise and fall of ancient civilizations",
    "Analyze the spread of major religions and cultural exchange",
    "Evaluate the impact of exploration, colonization, and trade routes",
    "Understand the causes and consequences of major global conflicts",
  ],
  "middle-world-languages": [
    "Hold simple conversations on everyday topics",
    "Read and understand short authentic texts",
    "Write paragraphs using correct grammar and vocabulary",
    "Explore cultural perspectives of target language communities",
  ],

  // ── High ──
  "high-arts": [
    "Create advanced works in visual, performing, or digital arts",
    "Analyze art through historical, cultural, and aesthetic lenses",
    "Develop a personal artistic voice and portfolio",
    "Critique artworks using discipline-specific terminology",
  ],
  "high-business-and-economics": [
    "Analyze microeconomic and macroeconomic principles",
    "Evaluate business strategies including marketing and finance",
    "Understand entrepreneurship and the startup ecosystem",
    "Apply economic models to real-world policy decisions",
  ],
  "high-career-and-technical-education": [
    "Develop industry-specific technical skills and certifications",
    "Apply project management principles to real-world tasks",
    "Understand workplace ethics, safety, and professional standards",
    "Build a career plan with post-secondary education pathways",
  ],
  "high-chemistry": [
    "Understand atomic structure, bonding, and molecular geometry",
    "Balance chemical equations and perform stoichiometric calculations",
    "Analyze thermodynamics and reaction kinetics",
    "Apply concepts of acids, bases, and equilibrium to laboratory experiments",
  ],
  "high-civics-and-government": [
    "Evaluate the principles and structure of constitutional democracy",
    "Analyze the role of political parties, elections, and media",
    "Compare U.S. government with other political systems",
    "Assess current policy issues through civic engagement",
  ],
  "high-computer-science-and-technology": [
    "Design and implement programs using object-oriented principles",
    "Analyze algorithm efficiency and computational complexity",
    "Understand networking, cybersecurity, and data privacy",
    "Build applications that solve complex real-world problems",
  ],
  "high-earth-and-space-science": [
    "Analyze Earth's geological record and deep-time processes",
    "Evaluate climate change data and atmospheric science",
    "Explain the origin and evolution of the universe",
    "Investigate natural hazards and resource sustainability",
  ],
  "high-english-language-arts": [
    "Critically analyze complex literary and informational texts",
    "Write sophisticated arguments with evidence and reasoning",
    "Conduct independent research using multiple sources",
    "Develop a personal voice through creative and analytical writing",
  ],
  "high-geography": [
    "Use GIS tools and spatial analysis to interpret geographic data",
    "Analyze geopolitical issues and international relations",
    "Evaluate the effects of globalization on cultures and economies",
    "Assess environmental challenges and sustainability strategies",
  ],
  "high-health": [
    "Evaluate the impact of lifestyle choices on long-term health",
    "Analyze public health issues and disease prevention strategies",
    "Understand mental health topics including anxiety and depression",
    "Develop advocacy skills for personal and community wellness",
  ],
  "high-life-sciences": [
    "Explain cellular processes including photosynthesis and respiration",
    "Analyze genetics, gene expression, and biotechnology applications",
    "Evaluate ecological interactions and conservation biology",
    "Understand evolutionary theory and evidence for common descent",
  ],
  "high-life-skills": [
    "Apply financial planning skills (investing, credit, taxes)",
    "Develop leadership, negotiation, and public speaking abilities",
    "Navigate post-secondary options and career planning",
    "Practice informed decision-making for health and relationships",
  ],
  "high-math": [
    "Analyze functions and their transformations",
    "Apply algebraic reasoning to complex equations",
    "Use statistical methods to interpret data sets",
    "Solve problems involving trigonometry and calculus concepts",
  ],
  "high-physical-education": [
    "Design personal fitness programs based on health-related goals",
    "Demonstrate advanced skills in selected sports and activities",
    "Evaluate the role of physical activity in disease prevention",
    "Analyze biomechanics and movement principles",
  ],
  "high-physics": [
    "Apply Newton's laws to analyze motion in one and two dimensions",
    "Understand electricity, magnetism, and electromagnetic waves",
    "Analyze energy conservation in mechanical and thermal systems",
    "Solve problems using mathematical models and experimental data",
  ],
  "high-psychology": [
    "Explain major psychological theories and research methods",
    "Analyze the biological bases of behavior and cognition",
    "Evaluate developmental, social, and abnormal psychology topics",
    "Apply psychological principles to everyday decision-making",
  ],
  "high-religion-and-philosophy": [
    "Compare theological and philosophical traditions across cultures",
    "Analyze ethical frameworks and their application to modern issues",
    "Evaluate the relationship between religion, science, and society",
    "Develop informed personal perspectives on existential questions",
  ],
  "high-science-and-engineering-practices": [
    "Design controlled experiments and analyze complex data sets",
    "Apply the engineering design process to prototype solutions",
    "Communicate scientific findings through formal reports and presentations",
    "Evaluate the societal and ethical implications of scientific advances",
  ],
  "high-sociology": [
    "Analyze social institutions, norms, and stratification",
    "Evaluate theories of socialization and group dynamics",
    "Investigate issues of race, gender, class, and inequality",
    "Apply sociological research methods to current social issues",
  ],
  "high-teacher-professional-development": [
    "Design rigorous, standards-aligned curricula for secondary students",
    "Implement assessment strategies that drive instructional improvement",
    "Integrate advanced technology and digital resources",
    "Mentor and support diverse student populations effectively",
  ],
  "high-us-history": [
    "Analyze the causes and effects of major events from Reconstruction to present",
    "Evaluate the impact of social movements on American society",
    "Assess the role of the United States in global affairs",
    "Interpret primary sources and historical arguments critically",
  ],
  "high-world-history": [
    "Analyze the causes and consequences of world wars and revolutions",
    "Evaluate the impact of imperialism and decolonization",
    "Trace the development of global economic and political systems",
    "Assess the role of technology and innovation in shaping modern history",
  ],
  "high-world-languages": [
    "Engage in sustained conversations on abstract and complex topics",
    "Read and analyze authentic literary and journalistic texts",
    "Write essays and creative pieces with advanced grammar",
    "Demonstrate cultural competency in real-world interactions",
  ],
}

// Prerequisites per subject slug
const SLUG_PREREQUISITES: Record<string, string> = {
  // ── Elementary ──
  "elementary-arts":
    "No prerequisites. Designed for early learners exploring creativity.",
  "elementary-celebrations-commemorations-and-festivals":
    "No prerequisites. Designed for early learners.",
  "elementary-civics-and-government":
    "No prerequisites. Suitable for all elementary students.",
  "elementary-computer-science-and-technology":
    "No prerequisites. Basic mouse and keyboard skills are helpful.",
  "elementary-earth-and-space-science":
    "No prerequisites. Designed for curious young learners.",
  "elementary-economics": "No prerequisites. Designed for early learners.",
  "elementary-english-language-arts":
    "No prerequisites. Students should be at grade-level reading readiness.",
  "elementary-geography":
    "No prerequisites. Designed for all elementary students.",
  "elementary-health": "No prerequisites. Designed for early learners.",
  "elementary-history":
    "No prerequisites. Designed for all elementary students.",
  "elementary-life-science":
    "No prerequisites. Designed for curious young learners.",
  "elementary-life-skills":
    "No prerequisites. Designed for all elementary students.",
  "elementary-math":
    "No prerequisites. Designed for early learners building number sense.",
  "elementary-physical-education":
    "No prerequisites. Students should be able to participate in physical activities.",
  "elementary-physical-science":
    "No prerequisites. Designed for curious young learners.",
  "elementary-religion":
    "No prerequisites. Designed for all elementary students.",
  "elementary-teacher-professional-development":
    "Teaching certification or current enrollment in an education program.",
  "elementary-world-languages":
    "No prerequisites. No prior language experience needed.",

  // ── Middle ──
  "middle-arts":
    "Completion of elementary arts or equivalent creative experience.",
  "middle-careers-and-technical-education":
    "No prerequisites. Open to all middle school students.",
  "middle-chemical-science":
    "Basic understanding of matter and measurement from elementary science.",
  "middle-civics-and-government":
    "Basic understanding of community roles from elementary social studies.",
  "middle-computer-science-and-technology":
    "Familiarity with basic computer operations and typing.",
  "middle-earth-and-space-science":
    "Elementary-level understanding of Earth's features and weather.",
  "middle-economics":
    "Basic understanding of needs, wants, and community from elementary studies.",
  "middle-english-language-arts":
    "Grade-level reading fluency and basic paragraph writing skills.",
  "middle-geography":
    "Ability to read basic maps and identify continents and oceans.",
  "middle-health":
    "Elementary-level understanding of personal health and hygiene.",
  "middle-life-science":
    "Elementary-level understanding of living things and ecosystems.",
  "middle-life-skills": "No prerequisites. Open to all middle school students.",
  "middle-math": "Fluency with whole number operations and basic fractions.",
  "middle-physical-education":
    "No prerequisites. Willingness to participate in physical activities.",
  "middle-physical-science":
    "Elementary-level understanding of matter, energy, and forces.",
  "middle-religion-and-ethics":
    "Elementary-level awareness of world religions and cultural diversity.",
  "middle-science-and-engineering-practices":
    "Basic science skills including observation and measurement.",
  "middle-teacher-professional-development":
    "Teaching certification or current enrollment in an education program.",
  "middle-us-history":
    "Elementary-level understanding of key American historical events.",
  "middle-world-history":
    "Elementary-level understanding of major world civilizations.",
  "middle-world-languages":
    "Basic vocabulary and phrases from elementary language study, or beginner level.",

  // ── High ──
  "high-arts":
    "Completion of middle school arts coursework or equivalent portfolio experience.",
  "high-business-and-economics":
    "Completion of middle school economics or basic math proficiency.",
  "high-career-and-technical-education":
    "No specific prerequisites. Interest in a career pathway is recommended.",
  "high-chemistry": "Completion of algebra and introductory physical science.",
  "high-civics-and-government": "Middle school civics or U.S. history.",
  "high-computer-science-and-technology":
    "Proficiency in at least one text-based programming language.",
  "high-earth-and-space-science":
    "Completion of middle school earth science and basic algebra.",
  "high-english-language-arts":
    "Grade-level reading comprehension and essay writing ability.",
  "high-geography": "Middle school geography and basic data literacy.",
  "high-health": "Middle school health education.",
  "high-life-sciences":
    "Completion of middle school life science and basic chemistry concepts.",
  "high-life-skills": "No prerequisites. Open to all high school students.",
  "high-math": "Completion of middle school algebra and geometry.",
  "high-physical-education":
    "No prerequisites. Basic fitness level recommended.",
  "high-physics": "Completion of algebra II and basic trigonometry.",
  "high-psychology":
    "No specific prerequisites. Strong reading and analytical skills recommended.",
  "high-religion-and-philosophy":
    "Middle school religion/ethics or equivalent humanities coursework.",
  "high-science-and-engineering-practices":
    "Completion of at least one high school science course.",
  "high-sociology":
    "No specific prerequisites. Strong reading and critical thinking skills recommended.",
  "high-teacher-professional-development":
    "Teaching certification or current enrollment in an education program.",
  "high-us-history": "Middle school U.S. history and basic research skills.",
  "high-world-history":
    "Middle school world history and basic research skills.",
  "high-world-languages":
    "Intermediate proficiency from middle school language study or equivalent.",
}

// Target audience per subject slug
const SLUG_TARGET_AUDIENCE: Record<string, string> = {
  // ── Elementary ──
  "elementary-arts":
    "Elementary students (grades K-5) who enjoy drawing, painting, music, and creative expression.",
  "elementary-celebrations-commemorations-and-festivals":
    "Elementary students (grades K-5) learning about cultures, traditions, and community celebrations.",
  "elementary-civics-and-government":
    "Elementary students (grades K-5) discovering how communities and governments work.",
  "elementary-computer-science-and-technology":
    "Elementary students (grades K-5) taking their first steps into coding and digital literacy.",
  "elementary-earth-and-space-science":
    "Elementary students (grades K-5) curious about weather, rocks, planets, and Earth's systems.",
  "elementary-economics":
    "Elementary students (grades K-5) learning about money, trade, and how economies work.",
  "elementary-english-language-arts":
    "Elementary students (grades K-5) developing reading, writing, and communication skills.",
  "elementary-geography":
    "Elementary students (grades K-5) exploring maps, continents, and the world's diverse regions.",
  "elementary-health":
    "Elementary students (grades K-5) building habits for healthy eating, hygiene, and emotional wellness.",
  "elementary-history":
    "Elementary students (grades K-5) learning about historical events, people, and how societies change.",
  "elementary-life-science":
    "Elementary students (grades K-5) fascinated by plants, animals, and the natural world.",
  "elementary-life-skills":
    "Elementary students (grades K-5) developing communication, organization, and teamwork skills.",
  "elementary-math":
    "Elementary students (grades K-5) building foundational number sense and problem-solving skills.",
  "elementary-physical-education":
    "Elementary students (grades K-5) developing movement skills, fitness, and sportsmanship.",
  "elementary-physical-science":
    "Elementary students (grades K-5) exploring matter, energy, and how things move.",
  "elementary-religion":
    "Elementary students (grades K-5) learning about world religions, values, and cultural traditions.",
  "elementary-teacher-professional-development":
    "Elementary educators seeking to enhance their instructional practices and classroom strategies.",
  "elementary-world-languages":
    "Elementary students (grades K-5) beginning their journey into learning a new language.",

  // ── Middle ──
  "middle-arts":
    "Middle school students (grades 6-8) deepening their skills in visual, performing, or digital arts.",
  "middle-careers-and-technical-education":
    "Middle school students (grades 6-8) exploring career interests and building practical skills.",
  "middle-chemical-science":
    "Middle school students (grades 6-8) investigating the building blocks of matter and chemical reactions.",
  "middle-civics-and-government":
    "Middle school students (grades 6-8) studying government, citizenship, and civic participation.",
  "middle-computer-science-and-technology":
    "Middle school students (grades 6-8) advancing their coding skills and understanding of technology.",
  "middle-earth-and-space-science":
    "Middle school students (grades 6-8) studying geology, weather systems, and the cosmos.",
  "middle-economics":
    "Middle school students (grades 6-8) analyzing markets, trade, and economic decision-making.",
  "middle-english-language-arts":
    "Middle school students (grades 6-8) strengthening their reading, writing, and research abilities.",
  "middle-geography":
    "Middle school students (grades 6-8) analyzing maps, migration, urbanization, and human impact on Earth.",
  "middle-health":
    "Middle school students (grades 6-8) learning about body systems, nutrition, mental health, and risk prevention.",
  "middle-life-science":
    "Middle school students (grades 6-8) exploring cells, genetics, ecosystems, and biodiversity.",
  "middle-life-skills":
    "Middle school students (grades 6-8) building financial literacy, study skills, and responsible decision-making.",
  "middle-math":
    "Middle school students (grades 6-8) mastering ratios, equations, geometry, and data analysis.",
  "middle-physical-education":
    "Middle school students (grades 6-8) improving fitness, sports skills, and understanding of lifelong health.",
  "middle-physical-science":
    "Middle school students (grades 6-8) investigating forces, energy, waves, and experimental design.",
  "middle-religion-and-ethics":
    "Middle school students (grades 6-8) comparing world religions and exploring ethical reasoning.",
  "middle-science-and-engineering-practices":
    "Middle school students (grades 6-8) learning to design experiments and apply engineering thinking.",
  "middle-teacher-professional-development":
    "Middle school educators seeking to improve differentiated instruction and student engagement.",
  "middle-us-history":
    "Middle school students (grades 6-8) studying American history from colonization through Reconstruction.",
  "middle-world-history":
    "Middle school students (grades 6-8) tracing global civilizations, exploration, and cultural exchange.",
  "middle-world-languages":
    "Middle school students (grades 6-8) building conversational and reading skills in a second language.",

  // ── High ──
  "high-arts":
    "High school students (grades 9-12) pursuing advanced study in visual, performing, or digital arts.",
  "high-business-and-economics":
    "High school students (grades 9-12) interested in business, finance, entrepreneurship, and economic policy.",
  "high-career-and-technical-education":
    "High school students (grades 9-12) preparing for careers through industry-aligned technical training.",
  "high-chemistry":
    "High school students (grades 9-12) studying matter at the atomic level and preparing for advanced science coursework.",
  "high-civics-and-government":
    "High school students (grades 9-12) analyzing political systems, policy, and civic engagement.",
  "high-computer-science-and-technology":
    "High school students (grades 9-12) building software, studying algorithms, and exploring cybersecurity.",
  "high-earth-and-space-science":
    "High school students (grades 9-12) studying climate science, geology, and the origins of the universe.",
  "high-english-language-arts":
    "High school students (grades 9-12) developing critical analysis, research, and advanced writing skills.",
  "high-geography":
    "High school students (grades 9-12) using spatial analysis to study geopolitics, globalization, and sustainability.",
  "high-health":
    "High school students (grades 9-12) evaluating lifestyle choices, public health, and mental wellness strategies.",
  "high-life-sciences":
    "High school students (grades 9-12) studying biology, genetics, ecology, and biotechnology.",
  "high-life-skills":
    "High school students (grades 9-12) preparing for adulthood with financial planning, leadership, and career skills.",
  "high-math":
    "High school students (grades 9-12) preparing for advanced coursework and standardized exams.",
  "high-physical-education":
    "High school students (grades 9-12) designing fitness programs and understanding sports science.",
  "high-physics":
    "High school students (grades 9-12) applying mathematical models to understand forces, energy, and waves.",
  "high-psychology":
    "High school students (grades 9-12) exploring human behavior, cognition, and psychological research methods.",
  "high-religion-and-philosophy":
    "High school students (grades 9-12) engaging with theological traditions and philosophical inquiry.",
  "high-science-and-engineering-practices":
    "High school students (grades 9-12) conducting research and prototyping engineering solutions.",
  "high-sociology":
    "High school students (grades 9-12) analyzing social structures, inequality, and cultural dynamics.",
  "high-teacher-professional-development":
    "High school educators seeking to enhance curriculum design and advanced instructional strategies.",
  "high-us-history":
    "High school students (grades 9-12) analyzing American history from Reconstruction to the present.",
  "high-world-history":
    "High school students (grades 9-12) studying global conflicts, revolutions, and the modern world order.",
  "high-world-languages":
    "High school students (grades 9-12) achieving advanced proficiency and cultural competency in a second language.",
}

// Fallback colors when scraped bgColor is unavailable
const FALLBACK_COLORS: Record<string, string> = {
  Arts: "#f43f5e",
  "Celebrations, Commemorations and Festivals": "#eab308",
  "Civics and Government": "#ec4899",
  "Computer Science and Technology": "#6366f1",
  "Earth and Space Science": "#0ea5e9",
  Economics: "#f97316",
  "English Language Arts": "#3b82f6",
  Geography: "#14b8a6",
  Health: "#10b981",
  History: "#f59e0b",
  Languages: "#8b5cf6",
  "Life Science": "#059669",
  "Life Skills": "#a855f7",
  Math: "#3b82f6",
  "Physical Education": "#22c55e",
  "Physical Science": "#ef4444",
  Religion: "#059669",
  Science: "#10b981",
  "Social Studies": "#8b5cf6",
  "Teacher Professional Development": "#6366f1",
  "World Languages": "#a855f7",
  "Business and Economics": "#f97316",
  "Career and Technical Education": "#0ea5e9",
  Chemistry: "#ef4444",
  "Chemical Science": "#ef4444",
  "Science and Engineering Practices": "#14b8a6",
  "U.S. History": "#e3714c",
  "World History": "#eab308",
  "Religion and Ethics": "#059669",
  Psychology: "#a855f7",
  Sociology: "#ec4899",
  "Music Composition": "#d946ef",
  Physics: "#f59e0b",
  Biology: "#6366f1",
  "Careers and Technical Education": "#0ea5e9",
  "Life Sciences": "#059669",
  "Religion and Philosophy": "#059669",
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedClickViewCatalog(
  prisma: PrismaClient
): Promise<void> {
  const inventoryPath = path.resolve(
    __dirname,
    "../../scripts/clickview-data/master-inventory.json"
  )

  if (!fs.existsSync(inventoryPath)) {
    console.log("  master-inventory.json not found, skipping ClickView seed")
    return
  }

  const raw = fs.readFileSync(inventoryPath, "utf-8")
  const entries: ClickViewEntry[] = JSON.parse(raw)

  // Load scraped subject data for illustration images and accurate colors
  const completeSubjectsPath = path.resolve(
    __dirname,
    "../../scripts/clickview-data/complete-subjects.json"
  )
  let scrapedLookup: Record<string, { coverUrl: string; bgColor: string }> = {}
  if (fs.existsSync(completeSubjectsPath)) {
    const scraped = JSON.parse(fs.readFileSync(completeSubjectsPath, "utf-8"))
    for (const level of ["elementary", "middle", "high"]) {
      for (const sub of scraped[level] ?? []) {
        const key = `${level}-${sub.slug}`
        scrapedLookup[key] = {
          coverUrl: sub.coverUrl,
          bgColor: sub.bgColor,
        }

        // Also index by seed-generated slug (handles "U.S. History" → "us-history" vs "u-s-history")
        const seedKey = toSubjectSlug(level, sub.name)
        if (seedKey !== key) {
          scrapedLookup[seedKey] = {
            coverUrl: sub.coverUrl,
            bgColor: sub.bgColor,
          }
        }
      }
    }
  }

  let subjectCount = 0
  let chapterCount = 0
  let lessonCount = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const slug = toSubjectSlug(entry.level, entry.subjectName)
    const schoolLevel = levelToSchoolLevel(entry.level)
    const grades = levelToGrades(entry.level)
    const clickviewId = extractClickViewId(entry.url)

    // Use illustration image if available locally, else fall back to cover URL or first topic
    const illustrationFile = `clickview/illustrations/${slug}.jpg`
    const illustrationAbsPath = path.join(
      __dirname,
      "../../public",
      illustrationFile
    )
    const illustrationExists = fs.existsSync(illustrationAbsPath)
    const scraped = scrapedLookup[slug]

    // Prefer scraped ClickView RGB color, fall back to hardcoded
    const scrapedHex = scraped?.bgColor ? rgbToHex(scraped.bgColor) : null
    const color = scrapedHex ?? FALLBACK_COLORS[entry.subjectName] ?? "#6366f1"

    const imageKey = illustrationExists
      ? `/${illustrationFile}`
      : (scraped?.coverUrl ?? entry.groups[0]?.topics[0]?.imgSrc ?? null)

    // Create/update CatalogSubject
    // Note: bannerUrl is set to null here; the clickview-images seed uploads
    // banners to S3 and sets bannerUrl to the S3 key.
    const subject = await prisma.catalogSubject.upsert({
      where: { slug },
      update: {
        name: entry.subjectName,
        description: SUBJECT_DESCRIPTIONS[entry.subjectName] ?? null,
        objectives: SLUG_OBJECTIVES[slug] ?? [],
        prerequisites: SLUG_PREREQUISITES[slug] ?? null,
        targetAudience: SLUG_TARGET_AUDIENCE[slug] ?? null,
        levels: [schoolLevel],
        grades,
        clickviewId,
        clickviewUrl: entry.url
          ? `https://www.clickview.net${entry.url}`
          : null,
        color,
        imageKey,
        sortOrder: 100 + i, // Offset from Sudanese subjects
      },
      create: {
        name: entry.subjectName,
        slug,
        description: SUBJECT_DESCRIPTIONS[entry.subjectName] ?? null,
        objectives: SLUG_OBJECTIVES[slug] ?? [],
        prerequisites: SLUG_PREREQUISITES[slug] ?? null,
        targetAudience: SLUG_TARGET_AUDIENCE[slug] ?? null,
        lang: "en",
        department: entry.subjectName,
        levels: [schoolLevel],
        grades,
        country: "US",
        system: "clickview",
        clickviewId,
        clickviewUrl: entry.url
          ? `https://www.clickview.net${entry.url}`
          : null,
        color,
        imageKey,
        sortOrder: 100 + i,
        status: "PUBLISHED",
      },
    })
    subjectCount++

    // Create CatalogChapters (groups)
    for (let g = 0; g < entry.groups.length; g++) {
      const group = entry.groups[g]
      const chapterSlug = toChapterSlug(group.parent)
      const firstTopicImgSrc = group.topics[0]?.imgSrc ?? null

      const chapter = await prisma.catalogChapter.upsert({
        where: {
          subjectId_slug: {
            subjectId: subject.id,
            slug: chapterSlug,
          },
        },
        update: {
          name: group.parent,
          sequenceOrder: g + 1,
          color,
          imageKey: firstTopicImgSrc,
          grades,
        },
        create: {
          subjectId: subject.id,
          name: group.parent,
          slug: chapterSlug,
          lang: "en",
          sequenceOrder: g + 1,
          color,
          imageKey: firstTopicImgSrc,
          grades,
          levels: [schoolLevel],
          status: "PUBLISHED",
        },
      })
      chapterCount++

      // Create CatalogLessons (topics)
      for (let t = 0; t < group.topics.length; t++) {
        const topic = group.topics[t]
        const { videoCount, resourceCount } = parseStats(topic.stats)
        const coverId = extractCoverId(topic.imgSrc)
        // Store high-res cover URL as lesson imageKey
        const lessonImageKey = topic.imgSrc || null

        await prisma.catalogLesson.upsert({
          where: {
            chapterId_slug: {
              chapterId: chapter.id,
              slug: topic.slug,
            },
          },
          update: {
            name: topic.name,
            sequenceOrder: t + 1,
            clickviewCoverId: coverId,
            imageKey: lessonImageKey,
            videoCount,
            resourceCount,
            color,
            grades,
          },
          create: {
            chapterId: chapter.id,
            name: topic.name,
            slug: topic.slug,
            lang: "en",
            sequenceOrder: t + 1,
            clickviewCoverId: coverId,
            imageKey: lessonImageKey,
            videoCount,
            resourceCount,
            color,
            grades,
            levels: [schoolLevel],
            status: "PUBLISHED",
          },
        })
        lessonCount++
      }
    }
  }

  logSuccess("ClickView CatalogSubjects", subjectCount, "US curriculum")
  logSuccess("ClickView CatalogChapters", chapterCount, "US curriculum")
  logSuccess("ClickView CatalogLessons", lessonCount, "US curriculum")

  // Update denormalized counts
  console.log("  Updating denormalized counts...")

  const allSubjects = await prisma.catalogSubject.findMany({
    where: { system: "clickview" },
    select: { id: true },
  })

  for (const s of allSubjects) {
    const chapters = await prisma.catalogChapter.findMany({
      where: { subjectId: s.id },
      select: { id: true },
    })

    const totalLessons = await prisma.catalogLesson.count({
      where: { chapter: { subjectId: s.id } },
    })

    await prisma.catalogSubject.update({
      where: { id: s.id },
      data: {
        totalChapters: chapters.length,
        totalLessons,
        totalContent: totalLessons,
      },
    })

    for (const ch of chapters) {
      const count = await prisma.catalogLesson.count({
        where: { chapterId: ch.id },
      })
      await prisma.catalogChapter.update({
        where: { id: ch.id },
        data: { totalLessons: count, totalContent: count },
      })
    }
  }

  console.log("  Denormalized counts updated.")
}
