"use client"
import React, { useState } from 'react';
import { Github, Loader2, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'

const handleGithubAuth = async () => {
  setIsLoading(true);
  try {
    await authClient.signIn.social({ 
      provider: 'github',
      callbackURL: 'http://localhost:3000' // redirect after auth
    });
  } catch (error) {
    console.error('Auth error:', error);
  } finally {
    setIsLoading(false);
  }
};

//TODO : if already logged in, go to dashboard

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md relative z-10 shadow-xl border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === 'signin' 
              ? 'Sign in to your account to continue' 
              : 'Get started with your free account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={handleGithubAuth}
            disabled={isLoading}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </>
            )}
          </Button>

          {/* Features list */}
          <div className="pt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
              <span>Secure authentication powered by Better Auth</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
              <span>One-click sign in with your GitHub account</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
              <span>No password needed - simple and secure</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-center text-sm text-slate-600">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          <p className="text-xs text-center text-slate-500 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>

      {/* Trust indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Secure</span>
        </div>
        <div className="w-px h-4 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
        <div className="w-px h-4 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>GDPR Compliant</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;