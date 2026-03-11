'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrackSearchPage() {
  const router = useRouter();
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim()) {
      router.push(`/track/${reference.trim()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Track Your Request</h1>
        <p className="text-muted-foreground text-lg">
          Enter your reference number to check the status of your sell request
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Enter Reference Number</CardTitle>
          <CardDescription className="text-muted-foreground">
            You received this reference number when you submitted your request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reference" className="text-foreground">Reference Number</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., REQ-20260103-AB12CD"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold shadow-none">
              Track Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 bg-card border border-border p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-2 text-foreground">Need Help?</h3>
        <p className="text-muted-foreground">
          If you&apos;ve lost your reference number, please contact our support team with
          your registered email address.
        </p>
      </div>
    </div>
  );
}

