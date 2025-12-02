/**
 * Events Seed Module
 * Creates school events for Comboni School (Full K-12)
 * Events include academic, sports, cultural, and community activities
 */

import { EventType, EventStatus } from "@prisma/client";
import type { SeedPrisma } from "./types";

export async function seedEvents(prisma: SeedPrisma, schoolId: string): Promise<void> {
  console.log("🎉 Creating school events (Comboni School)...");

  // Helper to create dates relative to today
  const today = new Date();
  const daysFromNow = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const daysAgo = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date;
  };

  const events = [
    // Academic Events
    {
      title: "Mid-Term Examinations",
      description: `Mid-term examination week for all grades. Students are expected to demonstrate the academic excellence that Comboni schools are known for across Sudan.

Examination Schedule:
- Primary: 7:45 AM - 11:00 AM
- Intermediate: 7:45 AM - 12:00 PM
- Secondary: 7:45 AM - 1:00 PM

Please arrive 15 minutes before your scheduled time.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(14),
      startTime: "07:45",
      endTime: "13:00",
      location: "All Classrooms",
      organizer: "Academic Affairs",
      targetAudience: "All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "Science & Technology Fair",
      description: `Annual Science & Technology Fair showcasing student projects and innovations. Comboni students have consistently excelled in scientific competitions across Sudan.

Categories:
- Physics & Engineering
- Chemistry & Biology
- Computer Science & IT
- Environmental Science

Prizes will be awarded for outstanding projects in each category.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(30),
      startTime: "09:00",
      endTime: "15:00",
      location: "Main Hall & Science Labs",
      organizer: "Science Department",
      targetAudience: "Students, Parents, Public",
      maxAttendees: 300,
      isPublic: true,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "Arabic Calligraphy Workshop",
      description: `Learn the art of Arabic calligraphy from master calligrapher. This workshop celebrates our Arabic heritage and the beauty of the Arabic script.

Participants will learn:
- Naskh script basics
- Traditional tools and techniques
- Creating their own calligraphy piece`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(7),
      startTime: "14:00",
      endTime: "16:00",
      location: "Art Room",
      organizer: "Languages Department",
      targetAudience: "Grades 7-12",
      maxAttendees: 30,
      currentAttendees: 18,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // Sports Events
    {
      title: "Annual Sports Day",
      description: `Comboni School Annual Sports Day! All students are encouraged to participate and represent their houses with honor.

Events include:
- Track & Field (100m, 200m, 400m, Relay)
- Football Tournament
- Basketball Competition
- Volleyball Matches
- Traditional Sudanese Games

"إلى الأمام دائماً" - Always Forward!`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(21),
      startTime: "07:00",
      endTime: "17:00",
      location: "School Sports Ground",
      organizer: "Physical Education Department",
      targetAudience: "All Students, Parents, Community",
      maxAttendees: 1000,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "Inter-School Football Championship",
      description: `Comboni School hosts the annual inter-school football championship. Teams from schools across Khartoum will compete for the championship trophy.

Schedule:
- Group Stage: Days 1-2
- Semi-Finals: Day 3
- Finals: Day 4`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(45),
      startTime: "08:00",
      endTime: "18:00",
      location: "Main Football Field",
      organizer: "Sports Committee",
      targetAudience: "Students, Parents, Public",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },

    // Cultural Events
    {
      title: "Sudan Independence Day Celebration",
      description: `Commemorating Sudan's Independence Day with cultural performances, traditional music, and patriotic presentations.

Program:
- National Anthem
- Historical Presentations
- Traditional Sudanese Dances
- Poetry Recitations
- Traditional Music Performances`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(60),
      startTime: "09:00",
      endTime: "13:00",
      location: "Main Assembly Hall",
      organizer: "Cultural Committee",
      targetAudience: "All School Community",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "Multicultural Day",
      description: `Celebrating the diversity of our school community! Students and families from different backgrounds share their cultures, traditions, and cuisines.

In the spirit of Saint Daniel Comboni's vision, we celebrate unity in diversity.

Activities:
- Cultural Exhibitions
- Traditional Food Fair
- Music & Dance Performances
- Art & Craft Displays`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(35),
      startTime: "10:00",
      endTime: "15:00",
      location: "School Courtyard",
      organizer: "Parent-Teacher Association",
      targetAudience: "School Community",
      maxAttendees: 400,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },

    // Parent Events
    {
      title: "Parent-Teacher Conference",
      description: `Quarterly parent-teacher conference. Your involvement in your child's education is central to the Comboni tradition of holistic education.

Schedule:
- KG & Primary: 4:00 PM - 5:30 PM
- Intermediate: 5:30 PM - 6:30 PM
- Secondary: 6:30 PM - 7:30 PM`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(10),
      startTime: "16:00",
      endTime: "19:30",
      location: "Respective Classrooms",
      organizer: "School Administration",
      targetAudience: "Parents, Teachers",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "Grade 12 Parent Orientation",
      description: `Important meeting for parents of Grade 12 students regarding Sudan Certificate examinations and university preparation.

Topics:
- Examination Schedule & Requirements
- University Application Process
- Career Counseling Services
- Support Resources`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(5),
      startTime: "17:00",
      endTime: "19:00",
      location: "Main Hall",
      organizer: "Senior Academic Counselor",
      targetAudience: "Grade 12 Parents",
      maxAttendees: 100,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // Celebrations
    {
      title: "Eid al-Fitr Celebration",
      description: `School celebration to mark Eid al-Fitr. Join us for special prayers, festivities, and community gathering.

"كل عام وأنتم بخير"
Eid Mubarak to all!`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(90),
      startTime: "08:00",
      endTime: "12:00",
      location: "School Grounds",
      organizer: "Religious Studies Department",
      targetAudience: "All School Community",
      maxAttendees: 1000,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "Comboni Founders Day",
      description: `Celebrating the legacy of Comboni Schools in Sudan since 1900. Saint Daniel Comboni's vision continues to inspire excellence in education across Africa.

Program:
- Thanksgiving Service
- Historical Exhibition
- Alumni Testimonials
- Cultural Performances

"Always Forward!"`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(50),
      startTime: "09:00",
      endTime: "14:00",
      location: "Main Assembly Hall",
      organizer: "School Administration",
      targetAudience: "Students, Parents, Alumni, Community",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "End of Year Graduation Ceremony",
      description: `Annual graduation ceremony for Grade 12 students. A celebration of academic achievement and the beginning of new journeys.

Program:
- Academic Procession
- Speeches & Awards
- Diploma Presentation
- Reception`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(120),
      startTime: "17:00",
      endTime: "20:00",
      location: "Main Hall",
      organizer: "School Administration",
      targetAudience: "Grade 12 Students, Parents, Staff",
      maxAttendees: 300,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // Completed Events (Past)
    {
      title: "Welcome Assembly 2025-2026",
      description: `Welcome assembly for the new academic year. All students and staff gathered to kick off another year of excellence at Comboni School.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysAgo(30),
      startTime: "08:00",
      endTime: "09:30",
      location: "Main Assembly Hall",
      organizer: "School Administration",
      targetAudience: "All Students, Staff",
      maxAttendees: 500,
      currentAttendees: 480,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.COMPLETED,
    },
    {
      title: "Teacher Training Workshop",
      description: `Professional development workshop for teaching staff on modern pedagogical approaches and educational technology.`,
      eventType: EventType.WORKSHOP,
      eventDate: daysAgo(15),
      startTime: "09:00",
      endTime: "15:00",
      location: "Training Room",
      organizer: "Academic Affairs",
      targetAudience: "Teaching Staff",
      maxAttendees: 50,
      currentAttendees: 45,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.COMPLETED,
    },

    // Ongoing Event
    {
      title: "Library Book Fair",
      description: `Week-long book fair at the school library! Students can explore and purchase books at discounted prices.

Special collections:
- Arabic Literature
- English Classics
- Science & Technology
- Sudanese Authors`,
      eventType: EventType.CULTURAL,
      eventDate: daysAgo(2),
      startTime: "08:00",
      endTime: "14:00",
      location: "School Library",
      organizer: "Library Committee",
      targetAudience: "All Students",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.ONGOING,
    },

    // Cancelled Event
    {
      title: "Field Trip to National Museum",
      description: `Educational field trip to the Sudan National Museum has been postponed due to unforeseen circumstances. New date will be announced soon.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysAgo(5),
      startTime: "08:00",
      endTime: "14:00",
      location: "Sudan National Museum",
      organizer: "History Department",
      targetAudience: "Grades 7-9",
      maxAttendees: 60,
      currentAttendees: 0,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.POSTPONED,
      notes: "Rescheduled to next month due to transportation issues.",
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: { schoolId, ...event },
    });
  }

  console.log(`   ✅ Created: ${events.length} school events (academic, sports, cultural, celebrations)\n`);
}
