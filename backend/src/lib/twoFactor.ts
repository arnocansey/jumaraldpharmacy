import { prisma } from "./prisma";
import crypto from "crypto";

export interface TwoFactorSecret {
  secret: string;
  otpauthUrl: string;
}

export function generateTwoFactorSecret(email: string): TwoFactorSecret {
  const secret = crypto.randomBytes(20).toString("hex");
  const otpauthUrl = `otpauth://totp/Jumarald%20Pharmacy:${email}?secret=${secret}&issuer=Jumarald%20Pharmacy&algorithm=SHA1&digits=6&period=30`;
  return { secret, otpauthUrl };
}

export function generateTotpCode(secret: string): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const code = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  for (let i = -window; i <= window; i++) {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30) + i;

    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep));

    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const computed = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
    const expected = String(computed % 1000000).padStart(6, "0");

    if (code === expected) return true;
  }
  return false;
}

export async function enableTwoFactor(userId: string): Promise<TwoFactorSecret> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  } as any);

  return { secret, otpauthUrl };
}

export async function verifyAndEnableTwoFactor(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
  if (!user?.twoFactorSecret) throw new Error("2FA not initiated");

  const valid = verifyTotpCode(user.twoFactorSecret, code);
  if (!valid) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  } as any);

  return true;
}

export async function verifyTwoFactorLogin(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
  if (!user?.twoFactorEnabled || !user?.twoFactorSecret) return true;

  return verifyTotpCode(user.twoFactorSecret, code);
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: null, twoFactorEnabled: false } as any,
  });
}

export async function getTwoFactorStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true } as any,
  }) as any;
  return { enabled: !!user?.twoFactorEnabled };
}
