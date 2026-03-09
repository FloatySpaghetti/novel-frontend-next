'use client'
import Link from 'next/link';
import { Mail } from 'lucide-react';
import BookIcon from '@/components/logo/BookIcon'; // Updated import path

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#003667] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Brand Section */}
          <div className="mb-8 md:mb-0">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8" />
              <span className="ml-2 text-xl font-serif font-bold">Novel Tavern</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Your premier platform for audiobooks and novels.
            </p>
            
            {/* Discord Button */}
            <div className="mt-4">
              <p className="text-gray-300 text-sm mb-2">Join us on:</p>
              <a 
                href="https://discord.gg/BWVJhksCmh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#5865F2] hover:bg-[#4752c4] transition-colors"
                aria-label="Join us on Discord"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>

            {/* New Donation Section */}
            <div className="mt-6">
              <p className="text-gray-300 text-sm mb-2">Help us keep the WebApp alive!</p>
              <a 
                href="https://buymeacoffee.com/noveltavern" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Donate
              </a>
            </div>
          </div>

          {/* Contact Button */}
          <div className="text-center md:text-right">
            <Link 
              href="/contact" 
              className="inline-flex items-center px-6 py-3 border-2 border-white rounded-full text-white hover:bg-white hover:text-primary-900 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Novel Tavern. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition">
              Made with ❤️ for book lovers
            </a>
          </div>
        </div>

        {/* SEO Keywords */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            read novel free, listen audionovel, wuxia novel, translated novel, online novels, light novels, 
            web novels, chinese novels, korean novels, japanese novels, free audiobooks online, read light novels online, 
            read web novels free, best free novels online, popular web novels, latest translated novels, 
            read manga online free, manhwa online, free light novel reading, best wuxia novels, 
            cultivation novels, xianxia novels, martial arts novels, romance novels online free, 
            fantasy novels free reading, sci-fi novels online, horror novels free, mystery novels online
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
