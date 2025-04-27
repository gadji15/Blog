import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Simplified implementation, in a real app would use i18next or similar library

// Define all translations
const translations = {
  en: {
    // Header
    home: 'Home',
    films: 'Films',
    series: 'Series',
    new: 'New & Popular',
    myList: 'My List',
    search: 'Search',
    profile: 'Profile',
    account: 'Account',
    settings: 'Settings',
    helpCenter: 'Help Center',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    english: 'English',
    french: 'Français',
    
    // Home page
    trending: 'Trending Now',
    continueWatching: 'Continue Watching',
    popularSeries: 'Popular Series',
    latestMovies: 'Latest Movies',
    recommended: 'Recommended For You',
    featuredPreview: 'Featured Preview',
    loadMore: 'Load More',
    
    // Content
    match: 'Match',
    play: 'Play Now',
    moreInfo: 'More Info',
    addToList: 'Add to My List',
    removeFromList: 'Remove from My List',
    exclusive: 'EXCLUSIVE',
    seasons: 'Seasons',
    episodes: 'Episodes',
    
    // Video Player
    fullscreen: 'Fullscreen',
    subtitles: 'Subtitles',
    
    // Authentication
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    
    // Admin
    adminPanel: 'Admin Panel',
    manageContent: 'Manage Content',
    manageUsers: 'Manage Users',
    addContent: 'Add Content',
    editContent: 'Edit Content',
    deleteContent: 'Delete Content',
    
    // Footer
    navigation: 'Navigation',
    legal: 'Legal',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    legalNotices: 'Legal Notices',
    accessibility: 'Accessibility',
    support: 'Support',
    devices: 'Supported Devices',
    contactUs: 'Contact Us',
    faq: 'FAQ',
    copyright: '© 2023 StreamFlow. All rights reserved.',
  },
  fr: {
    // Header
    home: 'Accueil',
    films: 'Films',
    series: 'Séries',
    new: 'Nouveautés & Populaires',
    myList: 'Ma Liste',
    search: 'Rechercher',
    profile: 'Profil',
    account: 'Compte',
    settings: 'Paramètres',
    helpCenter: 'Centre d\'aide',
    signOut: 'Déconnexion',
    signIn: 'Connexion',
    english: 'English',
    french: 'Français',
    
    // Home page
    trending: 'Tendances',
    continueWatching: 'Continuer à regarder',
    popularSeries: 'Séries populaires',
    latestMovies: 'Films récents',
    recommended: 'Recommandé pour vous',
    featuredPreview: 'Aperçu à la une',
    loadMore: 'Charger plus',
    
    // Content
    match: 'Correspondance',
    play: 'Regarder',
    moreInfo: 'Plus d\'infos',
    addToList: 'Ajouter à ma liste',
    removeFromList: 'Retirer de ma liste',
    new: 'NOUVEAU',
    exclusive: 'EXCLUSIF',
    seasons: 'Saisons',
    episodes: 'Épisodes',
    
    // Video Player
    fullscreen: 'Plein écran',
    subtitles: 'Sous-titres',
    settings: 'Paramètres',
    
    // Authentication
    login: 'Connexion',
    register: 'Inscription',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    email: 'Email',
    firstName: 'Prénom',
    lastName: 'Nom',
    forgotPassword: 'Mot de passe oublié ?',
    createAccount: 'Créer un compte',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    dontHaveAccount: 'Vous n\'avez pas de compte ?',
    
    // Admin
    adminPanel: 'Panneau d\'administration',
    manageContent: 'Gérer le contenu',
    manageUsers: 'Gérer les utilisateurs',
    addContent: 'Ajouter du contenu',
    editContent: 'Modifier le contenu',
    deleteContent: 'Supprimer le contenu',
    
    // Footer
    navigation: 'Navigation',
    legal: 'Mentions légales',
    terms: 'Conditions d\'utilisation',
    privacy: 'Politique de confidentialité',
    cookies: 'Politique de cookies',
    legalNotices: 'Mentions légales',
    accessibility: 'Accessibilité',
    support: 'Support',
    devices: 'Appareils compatibles',
    contactUs: 'Nous contacter',
    faq: 'FAQ',
    copyright: '© 2023 StreamFlow. Tous droits réservés.',
  }
};

type Languages = 'en' | 'fr';

export function useTranslation() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Languages>('en');
  
  // Set language based on user preference if available
  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language as Languages);
    }
  }, [user]);
  
  // Change language and update user preference if logged in
  const changeLanguage = async (newLang: Languages) => {
    setLanguage(newLang);
    
    if (user) {
      try {
        await fetch('/api/user/language', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLang }),
          credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };
  
  // Get translation for a key
  const t = (key: keyof typeof translations.en) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  return { t, language, changeLanguage };
}