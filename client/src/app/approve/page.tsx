"use client";
import { authClient } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Approve = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");
  const [isProcessing, setIsProcessing] = useState({ approve: false, deny: false });
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsProcessing({ approve: true, deny: false });
    setError(null);
    try {
      toast.loading("Approving device...", { id: "loading" });
      if (typeof userCode === "string") {
        await authClient.device.approve({ userCode });
      } else {
        throw new Error("Invalid device code");
      }
      toast.dismiss("loading");
      toast.success("Device approved successfully");
      router.push("/");
    } catch (err) {
      toast.dismiss("loading");
      setError("Failed to approve device");
      toast.error("Failed to approve device");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  const handleDeny = async () => {
    setIsProcessing({ approve: false, deny: true });
    setError(null);
    try {
      toast.loading("Denying device...", { id: "loading" });
      if (typeof userCode === "string") {
        await authClient.device.deny({ userCode });
      } else {
        throw new Error("Invalid device code");
      }
      toast.dismiss("loading");
      toast.success("Device denied");
      router.push("/");
    } catch (err) {
      toast.dismiss("loading");
      setError("Failed to deny device");
      toast.error("Failed to deny device");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!data?.session && !data?.user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md relative z-10 shadow-xl border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Approve Device
          </CardTitle>
          <CardDescription className="text-base">
            Device code: <span className="font-mono text-blue-700">{userCode}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <Button
            onClick={handleApprove}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-all duration-200"
            disabled={isProcessing.approve}
            size="lg"
          >
            {isProcessing.approve ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>Approve</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeny}
            className="w-full h-11 text-lg font-semibold transition-all duration-200"
            disabled={isProcessing.deny}
            size="lg"
          >
            {isProcessing.deny ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Denying...
              </>
            ) : (
              <>Deny</>
            )}
          </Button>
          <div className="text-xs text-center text-slate-500 leading-relaxed">
            Device authentication powered by Better Auth
          </div>
        </CardFooter>
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

export default Approve;
