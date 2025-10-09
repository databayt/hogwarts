import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="border-t border-border pt-16 pb-6 bg-muted full-bleed">
      <div className='container'>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Map Section */}
          <div className="lg:flex-[2] lg:min-w-0">
            <div className="relative w-[75%] aspect-[3/2] mb-4 overflow-hidden">
              <Image 
                src="/site/map.jpeg" 
                alt="Hogwarts Castle Map" 
                fill
                className="object-contain "
                sizes="(max-width: 768px) 70vw, (max-width: 1200px) 40vw, 33vw"
              />
            </div>
            
            {/* Address & Hours */}
            <div className="pb-4 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  123 Magical Learning Lane, <br /> Education City, EC 12345
                </p>
              </div>
              {/* <div>
                <p className="text-sm text-muted-foreground">
                  Mon-Fri: 8AM-5PM
                </p>
              </div> */}
            </div>
            
            <Button variant="ghost" asChild className='flex items-center justify-start hover:bg-transparent hover:underline p-0'>
              <Link href="/#" className="flex items-end">
                <Image src="/site/z.png" alt="Witch" width={40} height={40} className="dark:invert"/>
                Get Directions
              </Link>
            </Button>
          </div>

          {/* Navigation Columns */}
          <div className="lg:flex-[3] grid grid-cols-2 md:flex md:justify-between gap-4 md:gap-0">
            {/* Academics */}
            <div>
              <h3 className="muted tracking-wider uppercase mb-3">
                Academics
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/houses" className="muted hover:text-primary transition-colors">
                    Houses
                  </Link>
                </li>
                <li>
                  <Link href="/curriculum" className="muted hover:text-primary transition-colors">
                    Curriculum
                  </Link>
                </li>
                <li>
                  <Link href="/faculty" className="muted hover:text-primary transition-colors">
                    Faculty
                  </Link>
                </li>
                <li>
                  <Link href="/library" className="muted hover:text-primary transition-colors">
                    Library
                  </Link>
                </li>
                <li>
                  <Link href="/subjects" className="muted hover:text-primary transition-colors">
                    Subjects
                  </Link>
                </li>
                <li>
                  <Link href="/exams" className="muted hover:text-primary transition-colors">
                    Exams
                  </Link>
                </li>
              </ul>
            </div>

            {/* Campus */}
            <div>
              <h3 className="muted tracking-wider uppercase mb-3">
                Campus
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/admission" className="muted hover:text-primary transition-colors">
                    Admissions
                  </Link>
                </li>
                <li>
                  <Link href="/dormitories" className="muted hover:text-primary transition-colors">
                    Dormitories
                  </Link>
                </li>
                <li>
                  <Link href="/great-hall" className="muted hover:text-primary transition-colors">
                    Great Hall
                  </Link>
                </li>
                <li>
                  <Link href="/quidditch" className="muted hover:text-primary transition-colors">
                    Quidditch
                  </Link>
                </li>
                <li>
                  <Link href="/grounds" className="muted hover:text-primary transition-colors">
                    Grounds
                  </Link>
                </li>
              </ul>
            </div>

            {/* Activities */}
            <div>
              <h3 className="muted tracking-wider uppercase mb-3">
                Activities
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/clubs" className="muted hover:text-primary transition-colors">
                    Clubs
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="muted hover:text-primary transition-colors">
                    Events
                  </Link>
                </li>
                <li>
                  <Link href="/sports" className="muted hover:text-primary transition-colors">
                    Sports
                  </Link>
                </li>
                <li>
                  <Link href="/competitions" className="muted hover:text-primary transition-colors">
                    Competitions
                  </Link>
                </li>
                <li>
                  <Link href="/tournaments" className="muted hover:text-primary transition-colors">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link href="/ceremonies" className="muted hover:text-primary transition-colors">
                    Ceremonies
                  </Link>
                </li>
                <li>
                  <Link href="/traditions" className="muted hover:text-primary transition-colors">
                    Traditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-3">
                Support
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/alumni" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">
                    Alumni
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Hogwarts Logo" width={32} height={32} className="dark:invert" />
                <span className="text-lg font-bold text-foreground">Hogwarts</span>
              </div>
              <Link href="/terms" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="text-base font-light text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            </div>
            
            {/* Social Icons - Commented out as in original */}
            {/* <div className="flex items-center gap-4 pl-8">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 712.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 712 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
