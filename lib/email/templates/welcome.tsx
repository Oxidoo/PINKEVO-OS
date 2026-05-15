import { Heading, Text } from "@react-email/components";
import { EmailLayout, para } from "./base";

export interface WelcomeEmailProps {
  clientName: string;
}

export function WelcomeEmail({ clientName }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Bienvenue chez PINKEVO">
      <Heading style={{ fontSize: 22, margin: "0 0 12px" }}>Bienvenue {clientName} 👋</Heading>
      <Text style={para}>
        Ravi de démarrer cette collaboration. Votre équipe PINKEVO vous contactera très vite pour le
        cadrage du projet.
      </Text>
      <Text style={para}>
        En attendant, n&apos;hésitez pas à répondre directement à cet email pour toute question.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
