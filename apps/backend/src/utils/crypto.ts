import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTicketCode = (eventSlug: string): string => {
  const prefix = eventSlug.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CP-${prefix || 'TKT'}-${random}`;
};

export const generateQrPayload = (ticketCode: string, eventId: string, userId: string): string => {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${ticketCode}:${eventId}:${userId}:${timestamp}`)
    .digest('hex')
    .slice(0, 16);

  return JSON.stringify({
    tc: ticketCode,
    eid: eventId,
    uid: userId,
    ts: timestamp,
    sig: signature
  });
};

export const verifyQrPayloadSignature = (payloadStr: string): { valid: boolean; ticketCode?: string; eventId?: string } => {
  try {
    const data = JSON.parse(payloadStr);
    if (!data.tc || !data.eid || !data.uid || !data.ts || !data.sig) {
      return { valid: false };
    }
    const expectedSig = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${data.tc}:${data.eid}:${data.uid}:${data.ts}`)
      .digest('hex')
      .slice(0, 16);

    if (crypto.timingSafeEqual(Buffer.from(data.sig), Buffer.from(expectedSig))) {
      return { valid: true, ticketCode: data.tc, eventId: data.eid };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
};
