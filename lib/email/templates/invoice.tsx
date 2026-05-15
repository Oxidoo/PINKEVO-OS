import { Button, Heading, Text } from "@react-email/components";
import { btn, EmailLayout, para } from "./base";

export interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  payUrl: string;
}

export function InvoiceEmail({ clientName, invoiceNumber, amount, payUrl }: InvoiceEmailProps) {
  return (
    <EmailLayout preview={`Facture ${invoiceNumber}`}>
      <Heading style={{ fontSize: 20, margin: "0 0 12px" }}>Bonjour {clientName},</Heading>
      <Text style={para}>
        Votre facture <strong>{invoiceNumber}</strong> d&apos;un montant de{" "}
        <strong>{amount}</strong> est disponible.
      </Text>
      <Button href={payUrl} style={btn}>
        Régler la facture
      </Button>
    </EmailLayout>
  );
}

export default InvoiceEmail;
