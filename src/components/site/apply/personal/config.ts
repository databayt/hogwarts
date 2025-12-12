// Personal Step Configuration

export const PERSONAL_STEP_CONFIG = {
  id: 'personal',
  label: 'Personal Information',
  labelAr: 'المعلومات الشخصية',
  description: "Enter the student's personal details",
  descriptionAr: 'أدخل المعلومات الشخصية للطالب'
};

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male', labelAr: 'ذكر' },
  { value: 'FEMALE', label: 'Female', labelAr: 'أنثى' },
  { value: 'OTHER', label: 'Other', labelAr: 'أخرى' }
] as const;

export const NATIONALITY_OPTIONS = [
  { value: 'SD', label: 'Sudanese', labelAr: 'سوداني' },
  { value: 'EG', label: 'Egyptian', labelAr: 'مصري' },
  { value: 'SA', label: 'Saudi', labelAr: 'سعودي' },
  { value: 'AE', label: 'Emirati', labelAr: 'إماراتي' },
  { value: 'JO', label: 'Jordanian', labelAr: 'أردني' },
  { value: 'OTHER', label: 'Other', labelAr: 'أخرى' }
] as const;

export const RELIGION_OPTIONS = [
  { value: 'islam', label: 'Islam', labelAr: 'الإسلام' },
  { value: 'christianity', label: 'Christianity', labelAr: 'المسيحية' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' }
] as const;

export const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', labelAr: 'عام' },
  { value: 'special_needs', label: 'Special Needs', labelAr: 'ذوي الاحتياجات الخاصة' },
  { value: 'scholarship', label: 'Scholarship', labelAr: 'منحة دراسية' }
] as const;
