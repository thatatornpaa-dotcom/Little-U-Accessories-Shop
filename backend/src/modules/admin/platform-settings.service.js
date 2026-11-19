import { prisma } from "../../lib/db";

export const DEFAULT_PLATFORM_SETTINGS = {
  commissionRate: 0.05,
  shippingFee: 50,
  freeShippingThreshold: 300,
};

let cachedSettings = null;

export const getPlatformSettings = async (tx = prisma) => {
  if (cachedSettings && tx === prisma) return cachedSettings;

  let setting = await tx.platformSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!setting) {
    setting = await tx.platformSetting.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform", ...DEFAULT_PLATFORM_SETTINGS },
    });
  }

  const normalized = {
    ...setting,
    commissionRate: Number(setting.commissionRate),
    shippingFee: Number(setting.shippingFee),
    freeShippingThreshold: Number(setting.freeShippingThreshold),
  };

  if (tx === prisma) cachedSettings = normalized;
  return normalized;
};

export const invalidatePlatformSettingsCache = () => {
  cachedSettings = null;
};

export const calculateShopPricing = (subtotal, setting) => {
  const normalizedSubtotal = Math.max(0, Number(subtotal) || 0);
  const shippingFee =
    normalizedSubtotal >= Number(setting.freeShippingThreshold)
      ? 0
      : Number(setting.shippingFee);
  const commissionRate = Number(setting.commissionRate);
  const commissionAmount = Math.round(
    normalizedSubtotal * commissionRate * 100,
  ) / 100;
  const netAmount =
    Math.round((normalizedSubtotal - commissionAmount) * 100) / 100;

  return {
    subtotal: normalizedSubtotal,
    shippingFee,
    commissionRate,
    commissionAmount,
    netAmount,
  };
};
