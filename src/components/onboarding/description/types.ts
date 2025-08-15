export interface SchoolLevel {
  id: 'primary' | 'secondary' | 'both';
  title: string;
  description: string;
  icon?: string;
}

export interface SchoolType {
  id: 'private' | 'public' | 'international' | 'technical' | 'special';
  title: string;
  description: string;
  icon?: string;
}

export interface DescriptionData {
  schoolLevel: SchoolLevel['id'];
  schoolType: SchoolType['id'];
}

export interface DescriptionFormData {
  schoolLevel: SchoolLevel['id'];
  schoolType: SchoolType['id'];
}
