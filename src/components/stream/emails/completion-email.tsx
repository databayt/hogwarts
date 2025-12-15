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

interface CompletionEmailProps {
  studentName: string
  courseTitle: string
  certificateUrl: string
  schoolName: string
  completionDate: string
}

export const CompletionEmail = ({
  studentName,
  courseTitle,
  certificateUrl,
  schoolName,
  completionDate,
}: CompletionEmailProps) => (
  <Html>
    <Head />
    <Preview>Congratulations! You've completed {courseTitle}</Preview>
    <Tailwind>
      <Body className="bg-gray-50 font-sans">
        <Container className="mx-auto mt-8 max-w-xl rounded-lg bg-white px-4 py-8 shadow-sm">
          <Heading className="mb-4 text-2xl font-bold text-gray-900">
            Congratulations! 🎓
          </Heading>

          <Text className="mb-4 text-gray-700">Hi {studentName},</Text>

          <Text className="mb-4 text-gray-700">
            You did it! You've successfully completed{" "}
            <strong>{courseTitle}</strong> on {completionDate}.
          </Text>

          <Text className="mb-6 text-gray-700">
            This is a major achievement, and we're proud of your dedication and
            hard work. Your certificate of completion is ready!
          </Text>

          <Section className="my-6 text-center">
            <Button
              className="inline-block rounded-md bg-green-600 px-6 py-3 font-semibold text-white no-underline hover:bg-green-700"
              href={certificateUrl}
            >
              Download Certificate →
            </Button>
          </Section>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="mb-2 text-sm text-gray-600">
            <strong>What's next?</strong>
          </Text>
          <ul className="mb-4 pl-5 text-sm text-gray-600">
            <li>Share your certificate on social media</li>
            <li>Explore more courses to continue learning</li>
            <li>Apply your new skills in real projects</li>
            <li>Join our community of learners</li>
          </ul>

          <Text className="mb-4 font-semibold text-gray-700">
            Keep learning and growing! 🚀
          </Text>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-center text-xs text-gray-500">
            {schoolName} | Learning Management System
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
