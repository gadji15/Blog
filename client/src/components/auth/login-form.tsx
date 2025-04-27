import React, { useState } from "react";
import { useNavigate, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { z } from "zod";

// Schéma de validation pour le formulaire de connexion
const loginSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    form?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur pour ce champ lorsque l'utilisateur commence à taper
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser l'erreur générale du formulaire
    setErrors((prev) => ({ ...prev, form: undefined }));
    
    // Valider le formulaire
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await login(formData.username, formData.password);
      // Rediriger vers la page d'accueil après une connexion réussie
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
      setErrors((prev) => ({ 
        ...prev, 
        form: "Nom d'utilisateur ou mot de passe incorrect" 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {t('login')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('username')}
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('password')}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : t('login')}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        <div className="text-center text-sm">
          <span>{t('dontHaveAccount')} </span>
          <Button 
            variant="link" 
            className="p-0 h-auto" 
            onClick={() => setLocation('/register')}
          >
            {t('createAccount')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}