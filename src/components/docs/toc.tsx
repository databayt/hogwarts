"use client";

import { useEffect, useState, createContext, useContext, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

// Context for active sections
const ActiveSectionContext = createContext<string>("");

/**
 * Hook to get active section
 */
export function useActiveSection(): string {
  return useContext(ActiveSectionContext);
}

/**
 * Documentation Table of Contents component
 */
export function DocsTableOfContents() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{id: string, text: string, level: number}>>([]);
  const { open: sidebarOpen } = useSidebar();
  const navRef = useRef<HTMLDivElement>(null);
  
  // Extract headings from the page
  useEffect(() => {
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingsArray: Array<{id: string, text: string, level: number}> = [];
      
      headingElements.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || '';
        let id = heading.id;
        
        // Generate ID if not present
        if (!id) {
          id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          heading.id = id;
        }
        
        // Only include h2 and h3 for cleaner ToC
        if (level === 2 || level === 3) {
          headingsArray.push({ id, text, level });
        }
      });
      
      setHeadings(headingsArray);
    };

    // Run after a short delay to ensure MDX content is rendered
    const timer = setTimeout(extractHeadings, 100);
    return () => clearTimeout(timer);
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for better UX
      let currentActiveSection = "";
      
      // Find active section
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            currentActiveSection = heading.id;
          }
        }
      });
      
      setActiveSection(currentActiveSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check position on initial load
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings]);

  // Auto-scroll ToC to keep active section visible
  useEffect(() => {
    if (activeSection && navRef.current) {
      const activeButton = navRef.current.querySelector(`button[data-heading-id="${activeSection}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeSection]);

  const scrollToSection = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    }
  };

  // Hide on mobile and when sidebar is open on medium screens
  if (headings.length === 0) return null;

  return (
    <div 
      className={`hidden xl:block fixed top-20 right-1 w-44 z-20 ${
        sidebarOpen ? 'hidden' : 'lg:block'
      }`}
    >
      <ActiveSectionContext.Provider value={activeSection}>
        <div className="relative pl-1">
          {/* Thinner vertical line aligned with left border */}
          <div className="absolute left-[4px] top-8 bottom-0 w-[0.5px] bg-border/70"></div>
          
          <div className="flex gap-2 items-center pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text size-4">
              <path d="M17 6.1H3"></path>
              <path d="M21 12.1H3"></path>
              <path d="M15.1 18H3"></path>
            </svg>
            <p className="text-sm pl-0 m-0">On This Page</p>
          </div>
          
          <nav ref={navRef} className="mt-2 max-h-[calc(100vh-180px)] overflow-hidden pr-2">
            {headings.map((heading) => (
              <div 
                key={heading.id}
                className="relative" 
                onMouseEnter={() => setHoveredItem(heading.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button 
                  data-heading-id={heading.id}
                  onClick={() => scrollToSection(heading.id)}
                  className={`w-full text-sm text-left border-l-2 transition-all duration-300 ${
                    heading.level === 3 ? 'pl-6 py-1' : 'px-4 py-1.5'
                  } ${
                    activeSection === heading.id
                      ? "text-primary border-primary" 
                      : hoveredItem === heading.id
                        ? "border-primary/40 text-foreground/90"
                        : "border-transparent text-foreground/70 hover:text-foreground/90 hover:border-border"
                  }`}
                >
                  {heading.text}
                </button>
              </div>
            ))}
          </nav>
        </div>
      </ActiveSectionContext.Provider>
    </div>
  );
}
