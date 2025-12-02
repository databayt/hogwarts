'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ThumbsUp, Building2 } from "lucide-react";
// import { Ngo } from '@/components/atom/icon'; // Commented out - icon component doesn't exist
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// import { fetchUserForReview } from './edit/review/action'; // Commented out - action file doesn't exist
import PDFViewer from './pdf-viewer';

// Temporary replacement for Ngo icon
const Ngo = Building2;

// Temporary placeholder for fetchUserForReview (action file doesn't exist)
const fetchUserForReview = async () => {
  return { error: null, data: null };
};

// Helper function to format dates with Arabic month names
const formatDateWithArabicMonth = (date: Date): string => {
  const arabicMonths: Record<string, string> = {
    "1": "يناير", "2": "فبراير", "3": "مارس", "4": "أبريل",
    "5": "مايو", "6": "يونيو", "7": "يوليو", "8": "أغسطس",
    "9": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر"
  };
  
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${arabicMonths[month.toString()]} ${year}`;
};

interface UserSkillsData {
  skills?: string[] | null;
  interests?: string[] | null;
  cv?: string | null;
  portfolio?: string | null;
  additionalFile?: string | null;
  image?: string | null;
  // Membership info
  partyMember?: boolean;
  partyName?: string;
  partyStartDate?: string | Date;
  partyEndDate?: string | Date;
  unionMember?: boolean;
  unionName?: string;
  unionStartDate?: string | Date;
  unionEndDate?: string | Date;
  ngoMember?: boolean;
  ngoName?: string;
  ngoActivity?: string;
  clubMember?: boolean;
  clubName?: string;
  clubType?: string;
  contribute?: string;
}

// Custom SVG icons as React components
const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5 text-primary">
    <path fill="currentColor" d="M12 22q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22m-4-3v-2h8v2zm.25-3q-1.725-1.025-2.738-2.75T4.5 9.5q0-3.125 2.188-5.312T12 2t5.313 2.188T19.5 9.5q0 2.025-1.012 3.75T15.75 16z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="h-5 w-5 text-primary">
    <defs>
      <mask id="ipSCheckOne0">
        <g fill="none" strokeLinejoin="round" strokeWidth="4">
          <path fill="#fff" stroke="#fff" d="M24 44a19.94 19.94 0 0 0 14.142-5.858A19.94 19.94 0 0 0 44 24a19.94 19.94 0 0 0-5.858-14.142A19.94 19.94 0 0 0 24 4A19.94 19.94 0 0 0 9.858 9.858A19.94 19.94 0 0 0 4 24a19.94 19.94 0 0 0 5.858 14.142A19.94 19.94 0 0 0 24 44Z"/>
          <path stroke="#000" strokeLinecap="round" d="m16 24l6 6l12-12"/>
        </g>
      </mask>
    </defs>
    <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSCheckOne0)"/>
  </svg>
);

const HandHelpingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="h-5 w-5 text-primary">
    <defs>
      <mask id="ipSCheckOne1">
        <g fill="none" strokeLinejoin="round" strokeWidth="4">
          <path fill="#fff" stroke="#fff" d="M24 44a19.94 19.94 0 0 0 14.142-5.858A19.94 19.94 0 0 0 44 24a19.94 19.94 0 0 0-5.858-14.142A19.94 19.94 0 0 0 24 4A19.94 19.94 0 0 0 9.858 9.858A19.94 19.94 0 0 0 4 24a19.94 19.94 0 0 0 5.858 14.142A19.94 19.94 0 0 0 24 44Z"/>
          <path stroke="#000" strokeLinecap="round" d="m16 24l6 6l12-12"/>
        </g>
      </mask>
    </defs>
    <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSCheckOne1)"/>
  </svg>
);

const MembershipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5 text-primary">
    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5 text-primary">
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm.88 15.76v.36c0 .48-.39.88-.88.88c-.48 0-.88-.39-.88v-.42c-.63-.15-1.93-.61-2.69-2.1c-.23-.44-.01-.99.45-1.18l.07-.03c.41-.17.87 0 1.08.39c.32.61.95 1.37 2.12 1.37c.93 0 1.98-.48 1.98-1.61c0-.96-.7-1.46-2.28-2.03c-1.1-.39-3.35-1.03-3.35-3.31c0-.1.01-2.4 2.62-2.96v-.36c0-.49.4-.88.88-.88s.88.39.88.88v.37c1.07.19 1.75.76 2.16 1.3c.34.44.16 1.08-.36 1.3c-.36.15-.78.03-1.02-.28c-.28-.38-.78-.77-1.6-.77c-.7 0-1.81.37-1.81 1.39c0 .95.86 1.31 2.64 1.9c2.4.83 3.01 2.05 3.01 3.45c0 2.63-2.5 3.13-3.02 3.22z"/>
  </svg>
);

// Content for appendix items with title info
const createAppendixContent = (
  userData: UserSkillsData | null
) => {
  return {
    resume: {
      title: "السيرة",
    },
    docs: {
      title: "بورتفوليو",
    },
    certificates: {
      title: "شهادات",
    },
    projects: {
      title: "مشاريع",
    }
  };
};

export default function Contribute() {
  const [userData, setUserData] = useState<UserSkillsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAppendix, setActiveAppendix] = useState<string | null>(null);
  const [appendixContent, setAppendixContent] = useState(createAppendixContent(null));
  
  // Add state to track PDF loading errors
  const [pdfErrors, setPdfErrors] = useState<Record<string, boolean>>({});
  
  // Add state to track PDF loading state
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({
    resume: true,
    docs: true,
    certificates: true,
    projects: true
  });

  // Helper function to get the appropriate PDF URL based on availability
  const getDocumentUrl = (originalUrl: string | null | undefined): string | null => {
    if (originalUrl) {
      return originalUrl;
    }
    return null;
  };

  // Function to handle opening a document
  const openDocument = (type: string) => {
    setActiveAppendix(type);
  };

  // Function to close the PDF viewer
  const closeViewer = () => {
    setActiveAppendix(null);
  };

  // Get current document URL based on active appendix
  const getCurrentDocumentUrl = (): string | null | undefined => {
    if (!userData || !activeAppendix) return null;
    
    switch (activeAppendix) {
      case 'resume':
        return userData.cv;
      case 'docs':
        return userData.portfolio;
      case 'certificates':
        return userData.additionalFile;
      default:
        return null;
    }
  };

  // Get current document title based on active appendix
  const getCurrentDocumentTitle = (): string => {
    if (!activeAppendix) return 'المستند';
    
    return appendixContent[activeAppendix as keyof typeof appendixContent]?.title || 'المستند';
  };

  // Get current document filename for download
  const getCurrentDocumentFilename = (): string => {
    switch (activeAppendix) {
      case 'resume':
        return 'resume.pdf';
      case 'docs':
        return 'portfolio.pdf';
      case 'certificates':
        return 'certificates.pdf';
      default:
        return 'document.pdf';
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user information
        const { error, data } = await fetchUserForReview();
        
        if (error) {
          setError(error);
        } else if (data) {
          setUserData(data);
          // Update appendix content with the user data
          setAppendixContent(createAppendixContent(data));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  return (
    <div className="space-y-6 py-4 pb-10">
      {/* Introduction */}
      <Card className="">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <LightbulbIcon />
            <CardTitle className="text-lg font-semibold">دعوة</CardTitle>
          </div>
          <CardDescription className="text-foreground leading-normal">
            {userData?.contribute
              ? <span>{userData.contribute}</span>
              : <span>لم تتم إضافة وصف للمساهمة بعد.</span>
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Skills Section */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon />
            <CardTitle className="text-md">المهارات والاهتمامات</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div>
              {/* Display skills and interests inline */}
              {((userData?.skills && userData.skills.length > 0) || (userData?.interests && userData.interests.length > 0)) ? (
                <div className="flex flex-wrap gap-2">
                  {/* Skills */}
                  {userData?.skills?.map((skill, index) => (
                    <Badge key={`skill-${index}`} variant="outline" className="bg-primary/5">
                      {skill}
                    </Badge>
                  ))}
                  
                  {/* Interests */}
                  {userData?.interests?.map((interest, index) => (
                    <Badge key={`interest-${index}`} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-2">لا توجد مهارات أو اهتمامات متاحة</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Membership Section */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ngo />
            <CardTitle className="text-md">العضوية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="space-y-2">
              {/* Political Party */}
              {userData?.partyMember && (
                <div className="">
                  <p className="text-md">
                    عضو في {userData.partyName ? `حزب ${userData.partyName}` : 'حزب سياسي'}
                    {(userData?.partyStartDate || userData?.partyEndDate) && ' في الفترة من '}
                    {userData.partyStartDate ? formatDateWithArabicMonth(new Date(userData.partyStartDate)) : ''}
                    {userData.partyEndDate ? ` إلى ${formatDateWithArabicMonth(new Date(userData.partyEndDate))}` : userData.partyStartDate ? ' حتى الآن' : ''}
                  </p>
                </div>
              )}
              
              {/* Union */}
              {userData?.unionMember && (
                <div className="">
                  <p className="text-md">
                    عضو في {userData.unionName ? `نقابة ${userData.unionName}` : 'نقابة'}
                    {(userData?.unionStartDate || userData?.unionEndDate) && ' في الفترة من '}
                    {userData.unionStartDate ? formatDateWithArabicMonth(new Date(userData.unionStartDate)) : ''}
                    {userData.unionEndDate ? ` إلى ${formatDateWithArabicMonth(new Date(userData.unionEndDate))}` : userData.unionStartDate ? ' حتى الآن' : ''}
                  </p>
                </div>
              )}
              
              {/* NGO */}
              {userData?.ngoMember && (
                <div className="">
                  <p className="text-md flex items-center gap-2">
                   
                    عضو في {userData.ngoName ? `منظمة ${userData.ngoName}` : 'منظمة غير حكومية'}
                    {userData?.ngoActivity ? ` (${userData.ngoActivity})` : ''}
                  </p>
                </div>
              )}
              
              {/* Club */}
              {userData?.clubMember && (
                <div className="">
                  <p className="text-md">
                    عضو في {userData.clubName ? ` ${userData.clubName}` : 'نادي'}
                    {userData?.clubType ? ` (${userData.clubType})` : ''}
                  </p>
                </div>
              )}
              
              {/* No memberships message */}
              {!userData?.partyMember && !userData?.unionMember && !userData?.ngoMember && !userData?.clubMember && (
                <p className="text-muted-foreground text-center py-2">لا توجد عضويات متاحة</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Services */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-[22px] w-[22px] text-primary"><path fill="currentColor" d="M11.1 19h1.75v-1.25q1.25-.225 2.15-.975t.9-2.225q0-1.05-.6-1.925T12.9 11.1q-1.5-.5-2.075-.875T10.25 9.2t.463-1.025T12.05 7.8q.8 0 1.25.387t.65.963l1.6-.65q-.275-.875-1.012-1.525T12.9 6.25V5h-1.75v1.25q-1.25.275-1.95 1.1T8.5 9.2q0 1.175.688 1.9t2.162 1.25q1.575.575 2.188 1.025t.612 1.175q0 .825-.587 1.213t-1.413.387t-1.463-.512T9.75 14.1l-1.65.65q.35 1.2 1.088 1.938T11.1 17.7zm.9 3q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"/></svg>
            <CardTitle className="text-md">خدمات مدفوعة</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-start gap-2">
            
           
              <p className="text-sm text-muted-foreground leading-normal">أتمتة الاعمال · تطوير الويب · الانظمة المدمجة</p>
            
          </div>
          
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" className="h-[22px] w-[22px] text-primary">
              <g fill="none">
                <path d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M8 1C4.136 1 1 4.136 1 8s3.136 7 7 7s7-3.136 7-7s-3.136-7-7-7m1 11H7V7.5h2zm0-6H7V4h2z"/>
              </g>
            </svg>
            <CardTitle className="text-md">مرفقات</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            يمكن الاطلاع على المستندات والمرفقات التالية للحصول على مزيد من المعلومات.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <button 
              onClick={() => openDocument('resume')}
              className="border border-neutral-300 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-muted/5 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-foreground text-sm font-medium">السيرة</p>
            </button>
            
            <button 
              onClick={() => openDocument('docs')}
              className="border border-neutral-300 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-muted/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6  mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-foreground text-sm font-medium">بورتفوليو</p>
            </button>
            
            <button
              onClick={() => openDocument('certificates')} 
              className="border border-neutral-300 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-muted/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6  mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <p className="text-foreground text-sm font-medium">شهادات</p>
            </button>
            
            <button
              onClick={() => openDocument('projects')} 
              className="border border-neutral-300 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-muted/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6  mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <p className="text-foreground text-sm font-medium">مشاريع</p>
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* PDF Viewer */}
      <PDFViewer
        isOpen={!!activeAppendix}
        onClose={closeViewer}
        url={getDocumentUrl(getCurrentDocumentUrl())}
        title={getCurrentDocumentTitle()}
        fileName={getCurrentDocumentFilename()}
      />
    </div>
  );
}
