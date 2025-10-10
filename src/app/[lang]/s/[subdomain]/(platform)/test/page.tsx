import { getSchoolBySubdomain } from "@/lib/subdomain-actions";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function Test({ params }: Props) {
  const { subdomain } = await params;
  
  try {
    const result = await getSchoolBySubdomain(subdomain);
    
    return (
      <div className="p-8">
        <h3 className="mb-4">Subdomain Test Page</h3>
        <div className="space-y-4">
          <div>
            <strong>Subdomain:</strong> {subdomain}
          </div>
          <div>
            <strong>Result:</strong> {JSON.stringify(result, null, 2)}
          </div>
          {result.success && result.data && (
            <div>
              <strong>School Name:</strong> {result.data.name}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h3 className="mb-4">Error</h3>
        <pre className="text-red-600">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }
}
