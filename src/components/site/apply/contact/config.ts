// Contact Step Configuration

export const CONTACT_STEP_CONFIG = {
  id: 'contact',
  label: 'Contact Information',
  labelAr: 'معلومات الاتصال',
  description: 'Enter contact and address details',
  descriptionAr: 'أدخل تفاصيل الاتصال والعنوان'
};

export const COUNTRY_OPTIONS = [
  { value: 'SD', label: 'Sudan', labelAr: 'السودان' },
  { value: 'EG', label: 'Egypt', labelAr: 'مصر' },
  { value: 'SA', label: 'Saudi Arabia', labelAr: 'السعودية' },
  { value: 'AE', label: 'UAE', labelAr: 'الإمارات' },
  { value: 'JO', label: 'Jordan', labelAr: 'الأردن' },
  { value: 'OTHER', label: 'Other', labelAr: 'أخرى' }
] as const;
