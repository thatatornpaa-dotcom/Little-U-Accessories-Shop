import { prisma } from "../../lib/db";

// GET /api/addresses
export const getAddresses = async (c) => {
  try {
    const user = c.get("currentUser");
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    });
    return c.json({ success: true, addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    return c.json({ error: "Failed to retrieve addresses" }, 500);
  }
};

// POST /api/addresses
export const createAddress = async (c) => {
  try {
    const user = c.get("currentUser");
    const {
      label = "ที่บ้าน",
      recipientName,
      phone,
      province,
      amphoe = "",
      tambon = "",
      addressLine,
      postalCode,
      note = "",
      isDefault = false
    } = await c.req.json();

    if (!recipientName || !phone || !province || !addressLine || !postalCode) {
      return c.json({ error: "กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน" }, 400);
    }

    // Check existing addresses
    const existingCount = await prisma.address.count({
      where: { userId: user.id }
    });

    const setAsDefault = isDefault || existingCount === 0;

    if (setAsDefault) {
      // Clear previous default address
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        label,
        recipientName,
        phone,
        province,
        amphoe,
        tambon,
        addressLine,
        postalCode,
        note,
        isDefault: setAsDefault
      }
    });

    return c.json({ success: true, address: newAddress });
  } catch (error) {
    console.error("Create address error:", error);
    return c.json({ error: "Failed to create address" }, 500);
  }
};

// PUT /api/addresses/:id/default
export const setDefaultAddress = async (c) => {
  try {
    const user = c.get("currentUser");
    const id = c.req.param("id");

    const targetAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!targetAddress) {
      return c.json({ error: "ไม่พบข้อมูลที่อยู่" }, 404);
    }

    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false }
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    return c.json({ success: true, address: updated });
  } catch (error) {
    console.error("Set default address error:", error);
    return c.json({ error: "Failed to update default address" }, 500);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (c) => {
  try {
    const user = c.get("currentUser");
    const id = c.req.param("id");

    const targetAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!targetAddress) {
      return c.json({ error: "ไม่พบข้อมูลที่อยู่" }, 404);
    }

    await prisma.address.delete({
      where: { id }
    });

    // If deleted address was default, set latest remaining as default
    if (targetAddress.isDefault) {
      const latest = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });
      if (latest) {
        await prisma.address.update({
          where: { id: latest.id },
          data: { isDefault: true }
        });
      }
    }

    return c.json({ success: true, message: "ลบที่อยู่เรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Delete address error:", error);
    return c.json({ error: "Failed to delete address" }, 500);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (c) => {
  try {
    const user = c.get("currentUser");
    const id = c.req.param("id");
    const {
      label,
      recipientName,
      phone,
      province,
      amphoe,
      tambon,
      addressLine,
      postalCode,
      note,
      isDefault
    } = await c.req.json();

    const targetAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!targetAddress) {
      return c.json({ error: "ไม่พบข้อมูลที่อยู่" }, 404);
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(recipientName !== undefined && { recipientName }),
        ...(phone !== undefined && { phone }),
        ...(province !== undefined && { province }),
        ...(amphoe !== undefined && { amphoe }),
        ...(tambon !== undefined && { tambon }),
        ...(addressLine !== undefined && { addressLine }),
        ...(postalCode !== undefined && { postalCode }),
        ...(note !== undefined && { note }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    return c.json({ success: true, address: updated });
  } catch (error) {
    console.error("Update address error:", error);
    return c.json({ error: "Failed to update address" }, 500);
  }
};
