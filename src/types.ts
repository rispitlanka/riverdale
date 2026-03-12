export interface ICategory {
  _id: string;
  name: string;
}

export interface IMetal {
  _id: string;
  name: string;
  description?: string;
  purity: string;
  weight: number;
  weightUnit: string;
  pricePerGram: number;
  images?: string[];
  category?: { _id: string; name: string } | string | null;
  stockStatus: "in-stock" | "out-of-stock";
  sku?: string;
}

export interface ITimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface ISellRequest {
  referenceNumber: string;
  customerName: string;
  email?: string;
  phone?: string;
  metalType?: string;
  categoryName?: string;
  approximateWeight?: number;
  purity?: string;
  preferredPrice?: number;
  quotedPrice?: number;
  adminNotes?: string;
  metalPhotos: string[];
  status:
    | "submitted"
    | "under_review"
    | "quoted"
    | "confirmed"
    | "in_process"
    | "completed"
    | "cancelled";
  submittedAt: string;
  reviewedAt?: string;
  completedAt?: string;
}

export interface CartItem extends IMetal {
  quantity: number;
}


