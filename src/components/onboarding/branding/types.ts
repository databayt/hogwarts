export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type Shadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface BrandingData {
  logo?: string;
  primaryColor: string;
  secondaryColor?: string;
  borderRadius: BorderRadius;
  shadow: Shadow;
  customFontUrl?: string;
  customCssUrl?: string;
}

export interface BrandingFormData {
  logo?: string;
  primaryColor: string;
  secondaryColor?: string;
  borderRadius: BorderRadius;
  shadow: Shadow;
  customFontUrl?: string;
  customCssUrl?: string;
}

export interface ColorOption {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface StyleOption {
  id: BorderRadius | Shadow;
  label: string;
  description?: string;
}
