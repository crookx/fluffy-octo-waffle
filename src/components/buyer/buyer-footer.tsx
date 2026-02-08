'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandPlot, Mail, Phone, Facebook, Twitter, Linkedin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PlatformSettings } from '@/lib/types';

/**
 * BuyerFooter - Modern, efficient buyer-focused footer
 * Features:
 * - Dynamic settings from admin panel
 * - Real newsletter subscription with backend validation
 * - Trust stats section for social proof
 * - Fixed navigation to correct pages with scroll-to-top
 * - Improved mobile UX
 * - Better accessibility
 */

interface NavLink {
  href: string;
  label: string;
  isProtected?: boolean; // true if requires authentication
  description?: string;
}

export function BuyerFooter() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const { data } = await response.json();
          setSettings(data as PlatformSettings);
        }
      } catch (error) {
        console.warn('Failed to load footer settings:', error);
        // Continue with graceful degradation
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle navigation with scroll to top
  const handleNavigation = (href: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(href);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email address',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubscriptionState('success');
        setEmail('');
        toast({
          title: 'Subscribed!',
          description: 'Check your email for confirmation.',
        });
        setTimeout(() => setSubscriptionState('idle'), 4000);
      } else {
        throw new Error(result.message || 'Subscription failed');
      }
    } catch (error: any) {
      setSubscriptionState('error');
      toast({
        variant: 'destructive',
        title: 'Subscription failed',
        description: error.message || 'Please try again',
      });
      setTimeout(() => setSubscriptionState('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default values for graceful degradation
  const platformName = settings?.platformName || 'Kenya Land Trust';
  const contactEmail = settings?.contactEmail || 'contact@kenyalandtrust.com';
  const supportPhone = settings?.supportPhone || '+254 (0) 700 000 000';
  const trustStats = settings?.trustStats || { totalListings: 10000, totalBuyers: 5000, fraudCasesResolved: 0 };

  // Social links - only render if URL exists
  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: settings?.socialFacebook },
    { icon: Twitter, label: 'Twitter', href: settings?.socialTwitter },
    { icon: Linkedin, label: 'LinkedIn', href: settings?.socialLinkedin },
  ].filter(link => link.href);

  // Browse section navigation links with routing info
  const browseLinks: NavLink[] = [
    {
      href: '/explore',
      label: 'All Listings',
      isProtected: false,
      description: 'Browse all verified land listings across Kenya',
    },
    {
      href: '/trust',
      label: 'Trust Badges',
      isProtected: false,
      description: 'Learn how we verify properties and trust badges',
    },
    {
      href: '/favorites',
      label: 'Saved Properties',
      isProtected: false, // Shows empty state when not logged in
      description: 'Your saved favorite listings',
    },
    {
      href: '/',
      label: 'Featured Listings',
      isProtected: false,
      description: 'Discover top featured properties on our homepage',
    },
  ];

  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        
        {/* Trust Section - Social Proof */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{trustStats.totalListings.toLocaleString()}+</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Verified Listings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{trustStats.totalBuyers.toLocaleString()}+</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Happy Buyers</p>
          </div>
          <div className="col-span-2 md:col-span-1 text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">100%</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Fraud-Free</p>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5 mb-8">
          
          {/* Brand & Newsletter Section */}
          <div className="md:col-span-2">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
            >
              <LandPlot className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">{platformName}</span>
            </button>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your trusted marketplace for verified land transactions in Kenya. We connect buyers and sellers with transparency and confidence.
            </p>
            
            {/* Newsletter Signup - Prominent */}
            <div className="space-y-3 p-4 bg-accent/30 rounded-lg border border-accent/50">
              <div>
                <p className="text-sm font-semibold text-foreground">Get Alerts for New Listings</p>
                <p className="text-xs text-muted-foreground mt-1">Receive verified property updates straight to your inbox</p>
              </div>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                    aria-label="Email address for newsletter"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="h-9 px-4"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : subscriptionState === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      'Join'
                    )}
                  </Button>
                </div>
                
                {subscriptionState === 'success' && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmation email sent
                  </p>
                )}
                {subscriptionState === 'error' && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please try again
                  </p>
                )}
              </form>

              <p className="text-xs text-muted-foreground">
                We respect your privacy. <button 
                  onClick={() => handleNavigation('/privacy')}
                  className="text-primary hover:underline"
                >
                  Unsubscribe anytime
                </button>
              </p>
            </div>
          </div>

          {/* Browse Section - Efficient Navigation */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wide">Browse</h3>
            <ul className="space-y-2.5 text-sm">
              {browseLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left w-full hover:underline"
                    title={link.description}
                    aria-label={`${link.label} - ${link.description}`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn Section */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wide">Learn</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNavigation('/trust')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  How We Verify
                </button>
              </li>
              <li>
                <a 
                  href="/" 
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline"
                >
                  Property Guides
                </a>
              </li>
              <li>
                <a href="/" className="text-muted-foreground hover:text-primary transition-colors hover:underline">
                  FAQ
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/contact')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  Ask Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wide">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNavigation('/report')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  Report Listing
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/contact')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/terms')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/privacy')}
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col gap-6 md:gap-4 md:flex-row md:items-center md:justify-between">
          
          {/* Copyright */}
          <p className="text-xs text-muted-foreground order-3 md:order-1">
            © {new Date().getFullYear()} {platformName}. All rights reserved.
          </p>

          {/* Contact Info - Mobile Friendly */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground order-1 md:order-2">
            <a 
              href={`mailto:${contactEmail}`} 
              className="flex items-center gap-2 hover:text-primary transition-colors"
              aria-label={`Email: ${contactEmail}`}
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{contactEmail}</span>
            </a>
            <a 
              href={`tel:${supportPhone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
              aria-label={`Phone: ${supportPhone}`}
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{supportPhone}</span>
            </a>
          </div>

          {/* Social Links - Only if URLs exist */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4 order-2 md:order-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors p-1 hover:bg-accent rounded"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}



