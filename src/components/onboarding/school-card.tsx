"use client";

import React from 'react';
import { GraduationCap, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SchoolCardProps {
  id: string;
  name: string;
  startDate: string;
  status?: 'draft' | 'pending' | 'active';
  subdomain?: string;
  onClick?: (id: string) => void;
}

const SchoolCard: React.FC<SchoolCardProps> = ({
  id,
  name,
  startDate,
  status = 'draft',
  subdomain,
  onClick
}) => {
  const handleClick = () => {
    onClick?.(id);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      default:
        return <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Draft</Badge>;
    }
  };

  return (
    <Card 
      className="border hover:border-foreground/50 py-2 sm:py-3 bg-card hover:bg-accent transition-all cursor-pointer shadow-none hover:shadow-none rounded-lg min-h-[50px] sm:min-h-[60px]"
      onClick={handleClick}
    >
      <CardContent className="flex items-center px-2 sm:px-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="text-xs sm:text-sm font-medium truncate">
                {name}
              </h5>
              {getStatusBadge()}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                Started {startDate}
              </p>
              {subdomain && (
                <p className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">•</span> {subdomain}.hogwarts.app
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolCard;
