import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background/80 py-10 px-4 border-t border-border">
      <div className="container mx-auto">
        {/* Upper Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* StreamFlow Column */}
          <div>
            <h3 className="text-primary font-poppins font-bold text-xl mb-4">Stream<span className="text-accent">Flow</span></h3>
            <p className="text-muted-foreground mb-4">Your premium streaming platform for the best films and series. Experience entertainment like never before.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>
          
          {/* Navigation Column */}
          <div>
            <h4 className="font-poppins font-semibold text-foreground text-lg mb-4">{t('navigation')}</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">{t('home')}</Link></li>
              <li><Link href="/films" className="text-muted-foreground hover:text-foreground transition-colors">{t('films')}</Link></li>
              <li><Link href="/series" className="text-muted-foreground hover:text-foreground transition-colors">{t('series')}</Link></li>
              <li><Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">{t('search')}</Link></li>
              <li><Link href="/my-list" className="text-muted-foreground hover:text-foreground transition-colors">{t('myList')}</Link></li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <h4 className="font-poppins font-semibold text-foreground text-lg mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">{t('cookies')}</Link></li>
              <li><a href="#legal" className="text-muted-foreground hover:text-foreground transition-colors">{t('legalNotices')}</a></li>
              <li><a href="#accessibility" className="text-muted-foreground hover:text-foreground transition-colors">{t('accessibility')}</a></li>
            </ul>
          </div>
          
          {/* Support Column */}
          <div>
            <h4 className="font-poppins font-semibold text-foreground text-lg mb-4">{t('support')}</h4>
            <ul className="space-y-2">
              <li><a href="#account" className="text-muted-foreground hover:text-foreground transition-colors">{t('account')}</a></li>
              <li><a href="#help" className="text-muted-foreground hover:text-foreground transition-colors">{t('helpCenter')}</a></li>
              <li><a href="#devices" className="text-muted-foreground hover:text-foreground transition-colors">{t('devices')}</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">{t('contactUs')}</a></li>
              <li><a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">{t('faq')}</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-border pt-6 pb-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <LanguageSelector />
          </div>
          
          {/* Copyright */}
          <div className="text-muted-foreground text-sm">
            &copy; {currentYear} StreamFlow. {t('copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
}
