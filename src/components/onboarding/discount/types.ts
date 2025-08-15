export type DiscountType = 'percentage' | 'fixed' | 'early_bird' | 'sibling' | 'scholarship';
export type DiscountStatus = 'active' | 'scheduled' | 'expired' | 'draft';
export type ApplicableFee = 'tuition' | 'registration' | 'all';

export interface DiscountData {
  type: DiscountType;
  name: string;
  description?: string;
  value: number;
  isPercentage: boolean;
  startDate?: Date;
  endDate?: Date;
  maxUses?: number;
  minPurchaseAmount?: number;
  applicableFees: ApplicableFee[];
  stackable: boolean;
  termsAndConditions?: string;
}

export interface DiscountFormData {
  type: DiscountType;
  name: string;
  description?: string;
  value: number;
  isPercentage: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  minPurchaseAmount?: number;
  applicableFees: ApplicableFee[];
  stackable: boolean;
  termsAndConditions?: string;
}

export interface DiscountOption {
  id: DiscountType;
  label: string;
  description: string;
  maxValue: number;
  defaultValue: number;
  isPercentage: boolean;
  requiresDates: boolean;
  requiresTerms: boolean;
}

export interface ApplicableFeeOption {
  id: ApplicableFee;
  label: string;
  description: string;
}

export interface DiscountValidation {
  minValue: number;
  maxValue: number;
  maxDiscountCount: number;
  maxStackedDiscounts: number;
  minPurchaseAmount: number;
  maxValidityDays: number;
}
