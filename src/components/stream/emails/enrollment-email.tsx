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
} from "@react-email/components";

interface EnrollmentEmailProps {
  studentName: string;
  courseTitle: string;
  courseUrl: string;
  schoolName: string;
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
        <Container className="mx-auto py-8 px-4 bg-white rounded-lg shadow-sm max-w-xl mt-8">
          <Heading className="text-2xl font-bold text-gray-900 mb-4">
            Enrollment Confirmed! 🎉
          </Heading>

          <Text className="text-gray-700 mb-4">Hi {studentName},</Text>

          <Text className="text-gray-700 mb-4">
            Great news! You have successfully enrolled in <strong>{courseTitle}</strong>.
          </Text>

          <Text className="text-gray-700 mb-6">
            You now have full access to all course materials, videos, and resources.
            Start learning at your own pace!
          </Text>

          <Section className="my-6 text-center">
            <Button
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-semibold no-underline hover:bg-blue-700"
              href={courseUrl}
            >
              Start Learning →
            </Button>
          </Section>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-gray-600 text-sm mb-2">
            <strong>What's next?</strong>
          </Text>
          <ul className="text-gray-600 text-sm mb-4 pl-5">
            <li>Access your course dashboard</li>
            <li>Watch video lessons</li>
            <li>Download course materials</li>
            <li>Track your progress</li>
          </ul>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-gray-500 text-xs text-center">
            {schoolName} | Learning Management System
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
