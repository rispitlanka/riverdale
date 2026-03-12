'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ICategory, ITimeSlot } from '@/types';
import LiveGoldPrice from '@/components/LiveGoldPrice';
import { toast } from 'sonner';
import Image from 'next/image';

export default function SellPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [metals, setMetals] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Appointment state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState<ITimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState({
    // Customer Details
    customerName: '',
    email: '',
    phone: '',
    address: '',
    // Metal Details
    metalType: '',
    category: '',
    approximateWeight: '',
    purity: '',
    description: '',
    preferredPrice: '',
    // Documents
    metalPhotos: [] as string[],
    purchaseInvoice: '',
    idProofType: '', // 'passport', 'nic', or 'license'
    idProofPassport: '',
    idProofFront: '',
    idProofBack: '',
    // Pickup Details
    pickupPreference: 'drop-at-store',
    preferredDate: '',
    preferredTime: '',
    location: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchMetals();
  }, []);

  const fetchMetals = async () => {
    try {
      const res = await fetch('/api/public/metals');
      const data = await res.json();
      if (Array.isArray(data)) setMetals(data);
    } catch (err) {
      console.error('Error fetching metals', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?activeOnly=true');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/appointments/available-slots?date=${date}&duration=${appointmentDuration}`
      );
      const data = await response.json();
      if (data.available) {
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
        toast.error(data.reason || 'No slots available for this date');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      if (field === 'metalPhotos') {
        const uploadPromises = Array.from(files).map(async (file) => {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          const data = await response.json();
          return data.url;
        });
        const urls = await Promise.all(uploadPromises);
        setFormData((prev) => ({
          ...prev,
          metalPhotos: [...prev.metalPhotos, ...urls],
        }));
      } else {
        const formDataUpload = new FormData();
        formDataUpload.append('file', files[0]);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const data = await response.json();
        setFormData((prev) => ({ ...prev, [field]: data.url }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metalPhotos: prev.metalPhotos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.customerName || !formData.email || !formData.phone || !formData.address || 
          !formData.metalType || !formData.approximateWeight || !formData.purity) {
        toast.error('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Validate metal photos
      if (formData.metalPhotos.length === 0) {
        toast.error('Please upload at least one metal photo');
        setSubmitting(false);
        return;
      }

      // Validate ID proof
      if (!formData.idProofType) {
        toast.error('Please select an ID proof type');
        setSubmitting(false);
        return;
      }

      if (formData.idProofType === 'passport' && !formData.idProofPassport) {
        toast.error('Please upload your passport photo page');
        setSubmitting(false);
        return;
      }

      if ((formData.idProofType === 'nic' || formData.idProofType === 'license')) {
        if (!formData.idProofFront || !formData.idProofBack) {
          toast.error(`Please upload both front and back of your ${formData.idProofType === 'nic' ? 'National ID' : 'Driver\'s License'}`);
          setSubmitting(false);
          return;
        }
      }

      // Validate location
      if (!formData.location) {
        toast.error('Please provide a location');
        setSubmitting(false);
        return;
      }

      // Create appointment if date and time are provided
      let appointmentId = null;
      if (appointmentDate && appointmentTime) {
        const appointmentResponse = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            appointmentDate,
            startTime: appointmentTime,
            duration: appointmentDuration,
          }),
        });

        if (appointmentResponse.ok) {
          const appointment = await appointmentResponse.json();
          appointmentId = appointment._id;
        }
      }

      // Prepare ID proof data based on type
      const idProofData: any = {
        type: formData.idProofType,
      };

      if (formData.idProofType === 'passport') {
        idProofData.documents = [formData.idProofPassport];
      } else if (formData.idProofType === 'nic' || formData.idProofType === 'license') {
        idProofData.documents = [formData.idProofFront, formData.idProofBack];
      }

      // Create sell request
      const submitData = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        metalType: formData.metalType,
        category: formData.category || undefined,
        approximateWeight: parseFloat(formData.approximateWeight),
        purity: formData.purity,
        description: formData.description,
        preferredPrice: formData.preferredPrice
          ? parseFloat(formData.preferredPrice)
          : undefined,
        metalPhotos: formData.metalPhotos,
        purchaseInvoice: formData.purchaseInvoice || undefined,
        idProof: idProofData,
        pickupPreference: formData.pickupPreference,
        preferredDate: formData.preferredDate || undefined,
        preferredTime: formData.preferredTime || undefined,
        location: formData.location,
        appointmentId: appointmentId || undefined,
      };

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Request submitted successfully!');
        router.push(`/track/${data.referenceNumber}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Sell Your Metals</h1>
        <p className="text-muted-foreground text-lg">
          Get the best prices for your precious metals. Schedule an appointment for evaluation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Schedule Evaluation Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-foreground">Full Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                    placeholder="Enter your full name"
                />
              </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="Enter your email"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                    rows={3}
                    placeholder="Enter your full address"
                  />
                </div>

                {/* Metal Type */}
                <div className="space-y-2">
                  <Label htmlFor="metalType" className="text-foreground">Metal Type *</Label>
                  <Select
                    value={formData.metalType}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, metalType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {metals.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground">Category (Optional)</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimated Weight */}
                <div className="space-y-2">
                  <Label htmlFor="approximateWeight" className="text-foreground">Estimated Weight (grams) *</Label>
                  <Input
                    id="approximateWeight"
                    type="number"
                    step="0.01"
                    value={formData.approximateWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, approximateWeight: e.target.value })
                    }
                    required
                    placeholder="Enter weight in grams"
                  />
                </div>

                {/* Purity */}
                <div className="space-y-2">
                  <Label htmlFor="purity" className="text-foreground">Purity *</Label>
                  <Input
                    id="purity"
                    value={formData.purity}
                    onChange={(e) =>
                      setFormData({ ...formData, purity: e.target.value })
                    }
                    placeholder="e.g., 24K, 999"
                    required
                  />
                </div>

                {/* Preferred Price */}
                <div className="space-y-2">
                  <Label htmlFor="preferredPrice" className="text-foreground">Preferred Price (Optional)</Label>
                  <Input
                    id="preferredPrice"
                    type="number"
                    step="0.01"
                    value={formData.preferredPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredPrice: e.target.value })
                    }
                    placeholder="Your expected price"
                  />
                </div>

                {/* Metal Photos */}
                <div className="space-y-2">
                  <Label className="text-foreground">Metal Photos (up to 5) *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.metalPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={photo}
                          alt="Metal"
                          width={100}
                          height={100}
                          className="rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'metalPhotos')}
                    disabled={uploading || formData.metalPhotos.length >= 5}
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                </div>

                {/* Purchase Invoice */}
                <div className="space-y-2">
                  <Label className="text-foreground">Purchase Invoice (Optional)</Label>
                  {formData.purchaseInvoice && (
                    <p className="text-sm text-green-600">✓ Uploaded</p>
                  )}
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'purchaseInvoice')}
                    disabled={uploading}
                  />
                </div>

                {/* ID Proof Section */}
                <div className="space-y-4 p-6 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🆔</span>
                    <Label className="text-lg font-semibold text-foreground">ID Proof Verification *</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    For security purposes, please provide a valid government-issued ID
                  </p>
                  
                  {/* ID Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="idProofType" className="text-foreground">Select ID Type *</Label>
                    <Select
                      value={formData.idProofType}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, idProofType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose ID document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">🛂 Passport</SelectItem>
                        <SelectItem value="nic">🪪 National ID Card (NIC)</SelectItem>
                        <SelectItem value="license">🚗 Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Upload Fields */}
                  {formData.idProofType === 'passport' && (
                    <div className="space-y-2 p-4 bg-card/50 rounded-lg border border-border">
                      <Label htmlFor="idProofPassport" className="text-foreground">
                        Upload Passport Photo Page *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Please upload a clear photo of the page containing your photo and details
                      </p>
                      {formData.idProofPassport && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-400">✓</span>
                          <p className="text-sm text-green-400">Passport uploaded successfully</p>
                        </div>
                      )}
                      <Input
                        id="idProofPassport"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'idProofPassport')}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                    </div>
                  )}

                  {(formData.idProofType === 'nic' || formData.idProofType === 'license') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front Side */}
                      <div className="space-y-2 p-4 bg-card/50 rounded-lg border border-border">
                        <Label htmlFor="idProofFront" className="text-foreground">
                          {formData.idProofType === 'nic' ? 'NIC Front Side *' : 'License Front Side *'}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Upload the front side of your {formData.idProofType === 'nic' ? 'National ID' : 'Driver\'s License'}
                        </p>
                        {formData.idProofFront && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">✓</span>
                            <p className="text-sm text-green-400">Front uploaded</p>
                          </div>
                        )}
                        <Input
                          id="idProofFront"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'idProofFront')}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                      </div>

                      {/* Back Side */}
                      <div className="space-y-2 p-4 bg-card/50 rounded-lg border border-border">
                        <Label htmlFor="idProofBack" className="text-foreground">
                          {formData.idProofType === 'nic' ? 'NIC Back Side *' : 'License Back Side *'}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Upload the back side of your {formData.idProofType === 'nic' ? 'National ID' : 'Driver\'s License'}
                        </p>
                        {formData.idProofBack && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">✓</span>
                            <p className="text-sm text-green-400">Back uploaded</p>
                          </div>
                        )}
                        <Input
                          id="idProofBack"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'idProofBack')}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {formData.idProofType && uploading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FBC02E]"></div>
                      <p className="text-sm">Uploading your ID document...</p>
                    </div>
                  )}

                  {!formData.idProofType && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Please select an ID type to continue</p>
                    </div>
                  )}
                </div>

                {/* Pickup Preference */}
                <div className="space-y-2">
                  <Label htmlFor="pickupPreference" className="text-foreground">Pickup Preference *</Label>
                  <Select
                    value={formData.pickupPreference}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, pickupPreference: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drop-at-store">Drop at Store</SelectItem>
                      <SelectItem value="home-pickup">Home Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="City or specific location"
                    required
                  />
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label htmlFor="preferredDate" className="text-foreground">Preferred Date</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    value={formData.preferredDate}
                    onChange={(e) => {
                      setFormData({ ...formData, preferredDate: e.target.value });
                      setAppointmentDate(e.target.value);
                      if (e.target.value) {
                        fetchAvailableSlots(e.target.value);
                      }
                    }}
                    placeholder="Pick a date"
                  />
                </div>

                {/* Preferred Time */}
                {formData.preferredDate && (
              <div className="space-y-2">
                    <Label className="text-foreground">Preferred Time</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FBC02E]"></div>
                        <p className="ml-3 text-sm text-muted-foreground">Loading available slots...</p>
              </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No available slots for this date</p>
                    ) : (
                      <Select
                        value={appointmentTime}
                        onValueChange={(value: string) => {
                          setAppointmentTime(value);
                          setFormData({ ...formData, preferredTime: value });
                        }}
                  >
                    <SelectTrigger>
                          <SelectValue placeholder="--:--" />
                    </SelectTrigger>
                    <SelectContent>
                          {availableSlots
                            .filter((slot: ITimeSlot) => slot.available)
                            .map((slot: ITimeSlot) => (
                              <SelectItem key={slot.start} value={slot.start}>
                                {slot.start}
                              </SelectItem>
                            ))}
                    </SelectContent>
                  </Select>
                    )}
                  </div>
                )}

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Additional Information (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    placeholder="Tell us about your items..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold shadow-none"
                >
                  {submitting ? 'Submitting...' : 'Request Appointment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Metal Prices */}
        <div>
          <LiveGoldPrice />
        </div>
      </div>
    </div>
  );
}
