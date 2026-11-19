import { prisma } from "../../lib/db";
import {
  getPlatformSettings,
  invalidatePlatformSettingsCache,
} from "./platform-settings.service";
import { writeAuditLog } from "./audit.service";

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// GET /api/admin/settings
export const getAdminSettings = async (c) => {
  try {
    const setting = await getPlatformSettings();
    return c.json({ success: true, settings: setting });
  } catch (error) {
    console.error("Get platform settings error:", error);
    return c.json({ error: "ไม่สามารถดึงการตั้งค่าแพลตฟอร์มได้" }, 500);
  }
};

// PUT /api/admin/settings
export const updateAdminSettings = async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const current = await getPlatformSettings();

    const commissionRate =
      body.commissionRate === undefined
        ? Number(current.commissionRate)
        : parseNumber(body.commissionRate);
    const shippingFee =
      body.shippingFee === undefined
        ? Number(current.shippingFee)
        : parseNumber(body.shippingFee);
    const freeShippingThreshold =
      body.freeShippingThreshold === undefined
        ? Number(current.freeShippingThreshold)
        : parseNumber(body.freeShippingThreshold);
    const expectedVersion =
      body.version === undefined ? null : Number(body.version);

    if (commissionRate === null || commissionRate < 0 || commissionRate > 1) {
      return c.json({ error: "GP ต้องอยู่ระหว่าง 0% ถึง 100%" }, 400);
    }
    if (shippingFee === null || shippingFee < 0) {
      return c.json({ error: "ค่าส่งต้องเป็นจำนวนเงินที่ไม่ติดลบ" }, 400);
    }
    if (freeShippingThreshold === null || freeShippingThreshold < 0) {
      return c.json({ error: "ยอดขั้นต่ำฟรีส่งต้องไม่ติดลบ" }, 400);
    }
    if (expectedVersion !== null && expectedVersion !== current.version) {
      return c.json(
        { error: "การตั้งค่าถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่" },
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const expected = expectedVersion ?? current.version;
      const result = await tx.platformSetting.updateMany({
        where: { id: current.id, version: expected },
        data: {
          commissionRate,
          shippingFee,
          freeShippingThreshold,
          version: { increment: 1 },
          updatedById: c.get("currentUser")?.id || null,
        },
      });
      if (result.count !== 1) {
        const conflict = new Error("SETTINGS_VERSION_CONFLICT");
        conflict.code = "SETTINGS_VERSION_CONFLICT";
        throw conflict;
      }

      const next = await tx.platformSetting.findUnique({
        where: { id: current.id },
      });

      await writeAuditLog(tx, c, {
        action: "SETTINGS_UPDATE",
        targetType: "SETTINGS",
        targetId: current.id,
        before: {
          commissionRate: Number(current.commissionRate),
          shippingFee: Number(current.shippingFee),
          freeShippingThreshold: Number(current.freeShippingThreshold),
        },
        after: { commissionRate, shippingFee, freeShippingThreshold },
      });

      return next;
    });

    invalidatePlatformSettingsCache();
    return c.json({
      success: true,
      message: "บันทึกการตั้งค่าแพลตฟอร์มแล้ว",
      settings: {
        ...updated,
        commissionRate: Number(updated.commissionRate),
        shippingFee: Number(updated.shippingFee),
        freeShippingThreshold: Number(updated.freeShippingThreshold),
      },
    });
  } catch (error) {
    if (error?.code === "SETTINGS_VERSION_CONFLICT") {
      return c.json(
        { error: "การตั้งค่าถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่" },
        409,
      );
    }
    console.error("Update platform settings error:", error);
    return c.json({ error: "ไม่สามารถบันทึกการตั้งค่าแพลตฟอร์มได้" }, 500);
  }
};

// GET /api/settings/public
export const getPublicSettings = async (c) => {
  try {
    const setting = await getPlatformSettings();
    return c.json({
      success: true,
      settings: {
        shippingFee: Number(setting.shippingFee),
        freeShippingThreshold: Number(setting.freeShippingThreshold),
      },
    });
  } catch (error) {
    console.error("Get public settings error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลค่าส่งได้" }, 500);
  }
};
