import Icon from "./Icon";
import { emailUrl, leadWhatsAppUrl, phoneUrl } from "../contracts";
import type { Lead } from "../types";
import styles from "../admin.module.css";

export default function ContactActions({ lead, whatsappMode }: { lead: Lead; whatsappMode?: "pending" | "confirmed" }) {
  const whatsapp = whatsappMode ? null : leadWhatsAppUrl(lead);
  const phone = phoneUrl(lead.phone);
  const email = emailUrl(lead.email);
  return <div className={styles.contactActions}>
    {whatsapp && <a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="message" size={16}/>WhatsApp</a>}
    {phone && <a className={styles.secondaryButton} href={phone}><Icon name="phone" size={16}/>Llamar</a>}
    {email && <a className={styles.secondaryButton} href={email}><Icon name="mail" size={16}/>Correo</a>}
  </div>;
}
