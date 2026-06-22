import { Phone, MessageCircle } from 'lucide-react';

interface Props {
  phone?: string | null;
  size?: number;
}

/** Strip everything but digits for tel:/wa.me links. */
function clean(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function CallWhatsappButtons({ phone, size = 16 }: Props) {
  if (!phone) return null;
  const digits = clean(phone);
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${phone}`}
        aria-label={`Call ${phone}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-primary"
      >
        <Phone size={size} />
      </a>
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${phone}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-success"
      >
        <MessageCircle size={size} />
      </a>
    </div>
  );
}
