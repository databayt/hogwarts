import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

interface EnrollmentEmailProps {
  studentName: string
  courseTitle: string
  courseUrl: string
  schoolName: string
}

export const EnrollmentEmail = ({
  studentName,
  courseTitle,
  courseUrl,
  schoolName,
}: EnrollmentEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {courseTitle}! Your enrollment is confirmed.</Preview>
    <Tailwind>
      <Body className="bg-gray-50 font-sans">
        <Container className="mx-auto mt-8 max-w-xl rounded-lg bg-white px-4 py-8 shadow-sm">
          <Heading className="mb-4 text-2xl font-bold text-gray-900">
            Enrollment Confirmed! 🎉
          </Heading>

          <Text className="mb-4 text-gray-700">Hi {studentName},</Text>

          <Text className="mb-4 text-gray-700">
            Great news! You have successfully enrolled in{" "}
            <strong>{courseTitle}</strong>.
          </Text>

          <Text className="mb-6 text-gray-700">
            You now have full access to all course materials, videos, and
            resources. Start learning at your own pace!
          </Text>

          <Section className="my-6 text-center">
            <Button
              className="inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white no-underline hover:bg-blue-700"
              href={courseUrl}
            >
              Start Learning →
            </Button>
          </Section>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="mb-2 text-sm text-gray-600">
            <strong>What's next?</strong>
          </Text>
          <ul className="mb-4 pl-5 text-sm text-gray-600">
            <li>Access your course dashboard</li>
            <li>Watch video lessons</li>
            <li>Download course materials</li>
            <li>Track your progress</li>
          </ul>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-center text-xs text-gray-500">
            {schoolName} | Learning Management System
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
