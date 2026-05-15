import { Button, Heading, Text } from "@react-email/components";
import { btn, EmailLayout, para } from "./base";

export interface ProposalEmailProps {
  contactName: string;
  proposalTitle: string;
  viewUrl: string;
}

export function ProposalEmail({ contactName, proposalTitle, viewUrl }: ProposalEmailProps) {
  return (
    <EmailLayout preview={`Votre proposition : ${proposalTitle}`}>
      <Heading style={{ fontSize: 20, margin: "0 0 12px" }}>Bonjour {contactName},</Heading>
      <Text style={para}>
        Votre proposition <strong>{proposalTitle}</strong> est prête. Vous pouvez la consulter et la
        signer en ligne.
      </Text>
      <Button href={viewUrl} style={btn}>
        Voir la proposition
      </Button>
    </EmailLayout>
  );
}

export default ProposalEmail;
