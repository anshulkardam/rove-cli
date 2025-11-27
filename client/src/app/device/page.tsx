"use client";

import { authClient } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useState, useEffect } from "react";


import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

const Device = () => {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("user_code");
    if (code) {
      // Format code for input
      let formatted = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (formatted.length > 4) {
        formatted = formatted.slice(0, 4) + "-" + formatted.slice(4, 8);
      }
      setUserCode(formatted);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();
      const res = await authClient.device({
        query: { user_code: formattedCode },
      });
      if (res.data) {
        router.push(`approve?user_code=${formattedCode}`);
      } else {
        setError("Invalid or expired code");
      }
    } catch (error) {
      setError("Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 4) {
      value = value.slice(0, 4) + "-" + value.slice(4, 8);
    }
    setUserCode(value);
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>
      <Card className="w-full max-w-md relative z-10 shadow-xl border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Enter Device Code
          </CardTitle>
          <CardDescription className="text-base">
            Paste or enter your device code to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <input
              type="text"
              value={userCode}
              onChange={handleCode}
              maxLength={9}
              placeholder="XXXX-XXXX"
              className="w-full h-12 px-4 py-2 border rounded-lg text-lg tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
              required
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6">
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-all duration-200"
              disabled={isLoading || !userCode || userCode.replace(/-/g, "").length !== 8}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Continue</>
              )}
            </Button>
            <div className="text-xs text-center text-slate-500 leading-relaxed">
              Device authentication powered by Better Auth
            </div>
          </CardFooter>
        </form>
      </Card>
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

export default Device;
