import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Search, User, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for background opacity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary font-poppins font-bold text-2xl">Stream<span className="text-accent">Flow</span></span>
            </Link>
          </div>
          
          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`hover:text-primary transition-colors font-medium ${isActive("/") ? "text-primary" : "text-foreground"}`}>
              {t('home')}
            </Link>
            <Link href="/films" className={`hover:text-primary transition-colors font-medium ${isActive("/films") ? "text-primary" : "text-foreground"}`}>
              {t('films')}
            </Link>
            <Link href="/series" className={`hover:text-primary transition-colors font-medium ${isActive("/series") ? "text-primary" : "text-foreground"}`}>
              {t('series')}
            </Link>
            <Link href="/search" className={`hover:text-primary transition-colors font-medium ${isActive("/search") ? "text-primary" : "text-foreground"}`}>
              {t('search')}
            </Link>
            {user && (
              <Link href="/my-list" className={`hover:text-primary transition-colors font-medium ${isActive("/my-list") ? "text-primary" : "text-foreground"}`}>
                {t('myList')}
              </Link>
            )}
          </nav>
          
          {/* Right Navigation Elements */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <Link href="/search">
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Language Selector */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-foreground hover:text-primary transition-colors"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </Button>
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t('profile')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account">{t('account')}</Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">{t('adminPanel')}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/auth">{t('signIn')}</Link>
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className={`hover:text-primary transition-colors font-medium ${isActive("/") ? "text-primary" : "text-foreground"}`}>
                {t('home')}
              </Link>
              <Link href="/films" className={`hover:text-primary transition-colors font-medium ${isActive("/films") ? "text-primary" : "text-foreground"}`}>
                {t('films')}
              </Link>
              <Link href="/series" className={`hover:text-primary transition-colors font-medium ${isActive("/series") ? "text-primary" : "text-foreground"}`}>
                {t('series')}
              </Link>
              <Link href="/search" className={`hover:text-primary transition-colors font-medium ${isActive("/search") ? "text-primary" : "text-foreground"}`}>
                {t('search')}
              </Link>
              {user && (
                <Link href="/my-list" className={`hover:text-primary transition-colors font-medium ${isActive("/my-list") ? "text-primary" : "text-foreground"}`}>
                  {t('myList')}
                </Link>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-foreground">{t('language')}:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-primary"
                  onClick={() => document.documentElement.lang = 'en'}
                >
                  {t('english')}
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-primary"
                  onClick={() => document.documentElement.lang = 'fr'}
                >
                  {t('french')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
