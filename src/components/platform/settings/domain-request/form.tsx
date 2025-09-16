"use client";

import { useState, useTransition } from "react";
import { Globe, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createDomainRequest, cancelDomainRequest } from "./actions";
import { formatDistanceToNow } from "date-fns";

interface DomainRequestFormProps {
  currentDomain?: string;
  existingRequests?: Array<{
    id: string;
    domain: string;
    status: string;
    notes?: string | null;
    createdAt: Date;
    verifiedAt?: Date | null;
  }>;
}

export function DomainRequestForm({ currentDomain, existingRequests = [] }: DomainRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const pendingRequest = existingRequests.find(req => req.status === 'pending');
  const approvedRequest = existingRequests.find(req => req.status === 'approved');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      setError("");
      setSuccess("");
      
      const result = await createDomainRequest(formData);
      
      if (result.success) {
        setSuccess("Domain request submitted successfully! We'll review it within 24-48 hours.");
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error || "Failed to submit domain request");
      }
    });
  };

  const handleCancel = (requestId: string) => {
    startTransition(async () => {
      setError("");
      setSuccess("");
      
      const result = await cancelDomainRequest(requestId);
      
      if (result.success) {
        setSuccess("Domain request cancelled successfully.");
      } else {
        setError(result.error || "Failed to cancel request");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Current Domain</CardTitle>
          <CardDescription>
            Your school's current subdomain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {currentDomain}.databayt.org
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain Request Form */}
      {!pendingRequest && !approvedRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Request Custom Domain</CardTitle>
            <CardDescription>
              Request a custom subdomain for your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Desired Domain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="domain"
                    name="domain"
                    type="text"
                    placeholder="myschool"
                    pattern="^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
                    required
                    disabled={isPending}
                    className="font-mono"
                  />
                  <span className="text-sm text-muted-foreground">.databayt.org</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens only. 3-63 characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional information about your domain request..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Domain requests are reviewed within 24-48 hours. Once approved, your new domain will be active immediately.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Requests */}
      {existingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Requests</CardTitle>
            <CardDescription>
              Your domain request history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{request.domain}.databayt.org</code>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{request.notes}</p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(request.id)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}