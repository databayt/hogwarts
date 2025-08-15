import React from 'react';
import SelectionCard from './selection-card';

interface Amenity {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AmenitiesCardProps {
  amenities: Amenity[];
  selectedAmenities: string[];
  onToggle: (id: string) => void;
  columns?: number;
  className?: string;
}

const AmenitiesCard: React.FC<AmenitiesCardProps> = ({ amenities, selectedAmenities, onToggle, columns = 4, className }) => (
  <div className={className}>
    <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-2`}>
      {amenities.map((amenity) => (
        <SelectionCard
          key={amenity.id}
          id={amenity.id}
          title={amenity.label}
          icon={amenity.icon}
          isSelected={selectedAmenities.includes(amenity.id)}
          onClick={onToggle}
          compact
        />
      ))}
    </div>
  </div>
);

export default AmenitiesCard; 