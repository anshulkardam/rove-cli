"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";
import React from "react";

const page = () => {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  const router = useRouter();

  if (isPending) {
    return <div>Loading....</div>;
  }

  if (!session?.session && !session?.user) {
    router.push("/sign-in");
  }
  return (
    <div>
      {session?.user.email}

      <div>
        <Button
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onError: (ctx) => console.log(ctx),
                onSuccess: () => router.push("/sign-in"),
              },
            })
          }
        >
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default page;
