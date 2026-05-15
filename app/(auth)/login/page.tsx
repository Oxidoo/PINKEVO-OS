import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signedUp?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Bon retour</CardTitle>
        <CardDescription>Connectez-vous à votre cockpit PINKEVO.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {params.signedUp && (
          <div className="rounded-md bg-success/10 px-3 py-2 text-sm text-success" role="status">
            Compte créé. Vérifiez votre email pour confirmer puis connectez-vous.
          </div>
        )}
        {params.error && (
          <div
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {params.error}
          </div>
        )}
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            Demander un accès
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
