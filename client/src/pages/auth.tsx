import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">StreamFlow</h1>
      {mode === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}