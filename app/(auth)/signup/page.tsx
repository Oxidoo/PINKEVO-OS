import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Demander un accès</CardTitle>
        <CardDescription>
          L&apos;accès à PINKEVO OS se fait sur invitation. Si vous avez reçu une invitation par
          email, créez votre compte avec la même adresse — votre rôle sera attribué automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm />
        <p className="text-center text-xs text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
