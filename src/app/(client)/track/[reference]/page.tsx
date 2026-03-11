'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ISellRequest } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Image from 'next/image';

export default function TrackRequestPage() {
  const params = useParams();
  const reference = params.reference as string;
  const [request, setRequest] = useState<ISellRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reference) {
      fetchRequest();
    }
  }, [reference]);

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/requests?reference=${reference}`);

      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else {
        setError('Request not found. Please check your reference number.');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      setError('Failed to fetch request details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error || 'Request not found'}</p>
            <a href="/track/search" className="text-[#FBC02E] hover:text-[#E5AD1F] hover:underline">
              Try again
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'quoted', label: 'Quoted' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_process', label: 'In Process' },
    { key: 'completed', label: 'Completed' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === request.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Request Status</h1>
        <p className="text-muted-foreground text-lg">Reference: {request.referenceNumber}</p>
      </div>

      {/* Status Timeline */}
      <Card className="mb-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Current Status</CardTitle>
          <CardDescription className="text-muted-foreground">Track your request progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index <= currentStepIndex
                      ? 'bg-[#FBC02E] text-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      index < currentStepIndex ? 'bg-[#FBC02E]' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {statusSteps.map((step) => (
              <span key={step.key} className="text-center" style={{ width: '80px' }}>
                {step.label}
              </span>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Badge className="bg-[#FBC02E] text-foreground border-none">
              {getStatusLabel(request.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <span className="ml-2 font-semibold text-foreground">{request.customerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-2 text-foreground">{request.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <span className="ml-2 text-foreground">{request.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metal Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Metal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-semibold text-foreground">{request.metalType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Purity:</span>
              <span className="ml-2 text-foreground">{request.purity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span>
              <span className="ml-2 text-foreground">{request.approximateWeight} grams</span>
            </div>
            {request.preferredPrice && (
              <div>
                <span className="text-muted-foreground">Preferred Price:</span>
                <span className="ml-2 text-foreground">{formatCurrency(request.preferredPrice)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Information */}
        {request.quotedPrice && (
          <Card className="md:col-span-2 bg-card border-border border-[#FBC02E]/30">
            <CardHeader>
              <CardTitle className="text-[#FBC02E]">Quote Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FBC02E]">
                {formatCurrency(request.quotedPrice)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is our offer based on the evaluation of your precious metal.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        {request.adminNotes && (
          <Card className="md:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Notes from Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{request.adminNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {request.metalPhotos.length > 0 && (
          <Card className="md:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Submitted Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {request.metalPhotos.map((photo, index) => (
                  <Image
                    key={index}
                    src={photo}
                    alt={`Metal photo ${index + 1}`}
                    width={150}
                    height={150}
                    className="rounded object-cover"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="md:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">Submitted:</span>
              <span className="ml-2 text-foreground">{formatDate(request.submittedAt)}</span>
            </div>
            {request.reviewedAt && (
              <div>
                <span className="text-muted-foreground">Reviewed:</span>
                <span className="ml-2 text-foreground">{formatDate(request.reviewedAt)}</span>
              </div>
            )}
            {request.completedAt && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 text-foreground">{formatDate(request.completedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

