import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';
import { CalendarClock, CreditCard, User, Settings, Shield } from 'lucide-react';
import { Redirect } from 'wouter';

export default function ProfilePage() {
  const { user, isAuthenticated, isVip, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, language, changeLanguage } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [preferredQuality, setPreferredQuality] = useState(user?.preferredQuality || 'auto');
  const [progress, setProgress] = useState<any[]>([]);
  
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
      setPreferredQuality(user.preferredQuality || 'auto');
      
      // Charger les données de l'abonnement
      fetchSubscription();
      fetchPayments();
      fetchProgress();
    }
  }, [user]);
  
  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };
  
  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };
  
  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const savePersonalInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personalInfo),
        credentials: 'include'
      });
      
      if (response.ok) {
        refreshUser();
        toast({
          title: t('settings'),
          description: 'Informations personnelles mises à jour avec succès',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les informations',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveQualityPreference = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quality: preferredQuality }),
        credentials: 'include'
      });
      
      if (response.ok) {
        refreshUser();
        toast({
          title: t('settings'),
          description: 'Préférence de qualité mise à jour',
        });
      } else {
        throw new Error('Failed to update quality preference');
      }
    } catch (error) {
      console.error('Error updating quality preference:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la préférence de qualité',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLanguageChange = async (newLang: 'en' | 'fr') => {
    await changeLanguage(newLang);
    toast({
      title: t('settings'),
      description: t('language') === 'English' ? 'Language updated to English' : 'Langue mise à jour en Français',
    });
  };
  
  const cancelSubscription = async () => {
    if (!subscription?.id) return;
    
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscriptionId: subscription.id }),
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchSubscription();
        refreshUser();
        toast({
          title: 'Abonnement',
          description: 'Votre abonnement a été annulé avec succès',
        });
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'abonnement',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">{t('profile')}</h1>
      
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personnel</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Abonnement</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Informations personnelles */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={personalInfo.firstName}
                    onChange={handlePersonalInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={personalInfo.lastName}
                    onChange={handlePersonalInfoChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={handlePersonalInfoChange}
                />
              </div>
              
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <Shield className={isVip ? "text-green-500" : "text-muted-foreground"} />
                  <div>
                    <p className="font-medium">
                      Status: {isVip ? 'VIP' : 'Standard'}
                    </p>
                    {isVip && user?.vipExpiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Expire le: {formatDate(user.vipExpiresAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={savePersonalInfo} disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Abonnement et paiements */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement et paiements</CardTitle>
              <CardDescription>Gérez votre abonnement et consultez vos paiements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Abonnement actuel */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Abonnement actuel</h3>
                
                {subscription?.isActive ? (
                  <div className="bg-accent/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{subscription.plan?.name || 'Plan VIP'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Actif jusqu'au: {formatDate(subscription.endDate)}
                        </p>
                        <p className="text-sm mt-2">
                          Renouvellement automatique: {subscription.autoRenew ? 'Activé' : 'Désactivé'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelSubscription}
                        disabled={isLoading}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-accent/50 rounded-lg p-4 text-center">
                    <p>Vous n'avez pas d'abonnement actif</p>
                    <Button
                      className="mt-2"
                      onClick={() => window.location.href = '/plans'}
                    >
                      Voir les plans d'abonnement
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Historique des paiements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Historique des paiements</h3>
                
                {payments.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {(payment.amount / 100).toFixed(2)} {payment.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.timestamp)}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun paiement dans l'historique
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activité récente */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Surveillez votre activité récente sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              {progress.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Vidéos en cours</h3>
                  <div className="border rounded-lg divide-y">
                    {progress.map((item) => (
                      <div key={item.id} className="p-3">
                        <div className="flex justify-between">
                          <div className="font-medium">{item.content?.title || 'Contenu'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 bg-muted rounded overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>{Math.round(item.progress)}% terminé</span>
                            {item.content?.type === 'series' && item.currentSeason && item.currentEpisode && (
                              <span>S{item.currentSeason} E{item.currentEpisode}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore regardé de contenu
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/'}
                  >
                    Découvrir du contenu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Paramètres */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Gérez vos préférences d'utilisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Qualité vidéo */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Qualité vidéo préférée</h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez la qualité vidéo par défaut pour toutes vos lectures
                  </p>
                </div>
                
                <RadioGroup 
                  value={preferredQuality} 
                  onValueChange={setPreferredQuality}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                >
                  {['auto', '1080p', '720p', '480p', '360p'].map((quality) => (
                    <div key={quality} className="flex items-center space-x-2">
                      <RadioGroupItem value={quality} id={`quality-${quality}`} />
                      <Label htmlFor={`quality-${quality}`}>{quality}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <Button 
                  variant="outline" 
                  onClick={saveQualityPreference}
                  disabled={isLoading}
                >
                  Enregistrer la préférence
                </Button>
              </div>
              
              {/* Langue */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Langue</h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez la langue de l'interface
                  </p>
                </div>
                
                <RadioGroup 
                  value={language} 
                  onValueChange={(value: 'en' | 'fr') => handleLanguageChange(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fr" id="language-fr" />
                    <Label htmlFor="language-fr">Français</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="language-en" />
                    <Label htmlFor="language-en">English</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}