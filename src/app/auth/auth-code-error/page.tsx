import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-3xl font-bold">Sign-in failed</h1>
      <p className="max-w-md text-muted-foreground">
        We could not complete your sign-in. The link may have expired or already
        been used. Please try again.
      </p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </main>
  );
}
