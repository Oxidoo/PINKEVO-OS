import { Button, Heading, Text } from "@react-email/components";
import { btn, EmailLayout, para } from "./base";

export interface InvitationEmailProps {
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export function InvitationEmail({ inviterName, role, acceptUrl }: InvitationEmailProps) {
  return (
    <EmailLayout preview="Vous êtes invité·e à rejoindre PINKEVO OS">
      <Heading style={{ fontSize: 22, margin: "0 0 12px" }}>
        Bienvenue dans l&apos;équipe 🎉
      </Heading>
      <Text style={para}>
        {inviterName} vous invite à rejoindre <strong>PINKEVO OS</strong> avec le rôle{" "}
        <strong>{role}</strong>.
      </Text>
      <Text style={para}>
        Créez votre compte avec cette adresse email — votre rôle sera attribué automatiquement.
      </Text>
      <Button href={acceptUrl} style={btn}>
        Créer mon compte
      </Button>
      <Text style={{ ...para, color: "#94a3b8", fontSize: 12, marginTop: 16 }}>
        Cette invitation expire dans 7 jours.
      </Text>
    </EmailLayout>
  );
}

export default InvitationEmail;
