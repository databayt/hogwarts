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

interface CompletionEmailProps {
  studentName: string;
  courseTitle: string;
  certificateUrl: string;
  schoolName: string;
  completionDate: string;
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
    <Preview>
      Congratulations! You've completed {courseTitle}
    </Preview>
    <Tailwind>
      <Body className="bg-gray-50 font-sans">
        <Container className="mx-auto py-8 px-4 bg-white rounded-lg shadow-sm max-w-xl mt-8">
          <Heading className="text-2xl font-bold text-gray-900 mb-4">
            Congratulations! 🎓
          </Heading>

          <Text className="text-gray-700 mb-4">Hi {studentName},</Text>

          <Text className="text-gray-700 mb-4">
            You did it! You've successfully completed{" "}
            <strong>{courseTitle}</strong> on {completionDate}.
          </Text>

          <Text className="text-gray-700 mb-6">
            This is a major achievement, and we're proud of your dedication and
            hard work. Your certificate of completion is ready!
          </Text>

          <Section className="my-6 text-center">
            <Button
              className="inline-block rounded-md bg-green-600 px-6 py-3 text-white font-semibold no-underline hover:bg-green-700"
              href={certificateUrl}
            >
              Download Certificate →
            </Button>
          </Section>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-gray-600 text-sm mb-2">
            <strong>What's next?</strong>
          </Text>
          <ul className="text-gray-600 text-sm mb-4 pl-5">
            <li>Share your certificate on social media</li>
            <li>Explore more courses to continue learning</li>
            <li>Apply your new skills in real projects</li>
            <li>Join our community of learners</li>
          </ul>

          <Text className="text-gray-700 mb-4 font-semibold">
            Keep learning and growing! 🚀
          </Text>

          <Hr className="my-6 border-t border-gray-200" />

          <Text className="text-gray-500 text-xs text-center">
            {schoolName} | Learning Management System
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
