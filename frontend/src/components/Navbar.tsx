import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onStartAuditing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartAuditing }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Future Scope', href: '#future-scope' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#EEEBDA]/90 backdrop-blur-md border-b border-vanilla-border/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center">
          <BrandLogo size="md" />
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-wider text-indigo-brand/80 hover:text-indigo-brand transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-brand/70 px-2.5 py-1 rounded-full bg-vanilla-card border border-vanilla-border">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>Local Engine Active</span>
          </div>

          <button
            onClick={onStartAuditing}
            className="px-5 py-2.5 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all shadow-subtle flex items-center gap-2 group"
          >
            <span>Start Auditing</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-indigo-brand hover:bg-vanilla-card"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#EEEBDA] border-b border-vanilla-border space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-indigo-brand px-3 py-2 rounded-lg hover:bg-vanilla-card"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartAuditing();
              }}
              className="w-full py-3 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold text-center flex items-center justify-center gap-2"
            >
              <span>Launch Audit Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
