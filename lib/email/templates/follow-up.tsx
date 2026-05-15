import { Heading, Text } from "@react-email/components";
import { EmailLayout, para } from "./base";

export interface FollowUpEmailProps {
  contactName: string;
  message: string;
}

export function FollowUpEmail({ contactName, message }: FollowUpEmailProps) {
  return (
    <EmailLayout preview="On reprend contact">
      <Heading style={{ fontSize: 20, margin: "0 0 12px" }}>Bonjour {contactName},</Heading>
      <Text style={para}>{message}</Text>
      <Text style={para}>Au plaisir d&apos;échanger,</Text>
      <Text style={{ ...para, fontWeight: 600 }}>L&apos;équipe PINKEVO</Text>
    </EmailLayout>
  );
}

export default FollowUpEmail;
