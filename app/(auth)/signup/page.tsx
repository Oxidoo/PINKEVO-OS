import { ComingSoon } from "@/components/shared/coming-soon";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <ComingSoon
        title="Inscription"
        description="L'accès se fait par invitation. Le flow signup complet (email + Google OAuth + acceptation invitation) arrive en Phase 1."
        phase="Phase 1"
      />
    </div>
  );
}
