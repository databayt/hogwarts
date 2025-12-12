// Academic Step Configuration

export const ACADEMIC_STEP_CONFIG = {
  id: 'academic',
  label: 'Academic Information',
  labelAr: 'المعلومات الأكاديمية',
  description: 'Enter previous education and applying class',
  descriptionAr: 'أدخل معلومات التعليم السابق والصف المتقدم إليه'
};

export const STREAM_OPTIONS = [
  { value: 'science', label: 'Science', labelAr: 'علمي' },
  { value: 'arts', label: 'Arts', labelAr: 'أدبي' },
  { value: 'commerce', label: 'Commerce', labelAr: 'تجاري' },
  { value: 'general', label: 'General', labelAr: 'عام' }
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'arabic', label: 'Arabic', labelAr: 'العربية' },
  { value: 'english', label: 'English', labelAr: 'الإنجليزية' },
  { value: 'french', label: 'French', labelAr: 'الفرنسية' },
  { value: 'quran', label: 'Quran', labelAr: 'القرآن الكريم' }
] as const;
