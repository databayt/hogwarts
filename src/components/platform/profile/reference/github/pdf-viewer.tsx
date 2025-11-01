'use client';

import React, { useState } from 'react';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null | undefined;
  title: string;
  fileName?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  isOpen,
  onClose,
  url,
  title,
  fileName = 'document.pdf'
}) => {
  const [pdfScale, setPdfScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to handle zoom controls
  const zoomIn = () => {
    setPdfScale(prev => Math.min(prev + 0.1, 2)); // Maximum zoom: 2x
  };

  const zoomOut = () => {
    setPdfScale(prev => Math.max(prev - 0.1, 0.5)); // Minimum zoom: 0.5x
  };

  // Function to download file
  const downloadFile = async (url: string, filename: string) => {
    if (!url) return;
    
    try {
      // Show some loading indication
      setIsLoading(true);
      
      // Fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename; // This is critical for downloading instead of opening
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      setIsLoading(false);
      
      // Alert the user about the error
      alert("حدث خطأ أثناء تنزيل الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  // Function to create a Google Docs viewer URL
  const getGoogleDocsViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  // Reset loading state when component mounts or URL changes
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      document.body.style.overflow = 'hidden';
      // Set loading to false after a short delay
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, url]);
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-white z-[100]"
        onClick={onClose}
      />
      
      <div
        className="fixed inset-0 top-0 bg-white z-[101] overflow-hidden flex flex-col m-0 p-0 shadow-xl"
        key="pdf-viewer-container"
        style={{ marginTop: 0 }}
      >
        <div className="p-4 pt-2 border-b border-muted/20 flex justify-between items-center bg-neutral-200"
          style={{ marginTop: 0 }}
        >
          <h3 className="text-xl font-semibold">{title}</h3>
          
          <div className="flex items-center gap-4">
            {/* Simple download button - icon only */}
            {url && (
              <button 
                onClick={() => url && downloadFile(url, fileName)}
                className="p-1 rounded-full hover:bg-muted/10 text-foreground"
                title="تحميل المستند"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <button 
                onClick={zoomOut}
                className="p-1 rounded-full hover:bg-muted/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              
              <span className="text-sm">{Math.round(pdfScale * 100)}%</span>
              
              <button 
                onClick={zoomIn}
                className="p-1 rounded-full hover:bg-muted/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-white">
          <div className="w-full h-full bg-white overflow-hidden">
            <div style={{ transform: `scale(${pdfScale})`, transformOrigin: 'center', width: '100%', height: '100%' }}>
              {url ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-sm text-muted-foreground">جاري تحميل المستند...</p>
                    </div>
                  )}
                  
                  <div className="w-full h-full">
                    <div className="w-full h-full relative overflow-hidden bg-white" style={{ backgroundColor: 'white' }}>
                      {/* Overlay to block PDF header interactions */}
                      <div className="absolute top-0 left-0 right-0 h-[36px] bg-transparent z-10" />
                      
                      <object 
                        data={url ? `${url}#toolbar=0&navpanes=0&scrollbar=0` : ''}
                        type="application/pdf"
                        className="w-full h-full"
                        style={{
                          /* Hide PDF viewer's native header */
                          marginTop: '-36px',
                          height: 'calc(100% + 36px)',
                          border: 'none',
                          overflow: 'hidden',
                          backgroundColor: 'white'
                        }}
                      >
                        <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-orange-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          
                          <h3 className="text-xl font-medium mb-3">تعذر عرض المستند مباشرة</h3>
                          <p className="text-muted-foreground mb-4">متصفحك لا يدعم عرض ملفات PDF داخل الصفحة</p>
                          
                          <div className="w-full mb-6 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <a 
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                فتح المستند في نافذة جديدة
                              </a>
                            </div>
                          </div>
                        </div>
                      </object>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">لا يوجد مستند متاح</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PDFViewer;
