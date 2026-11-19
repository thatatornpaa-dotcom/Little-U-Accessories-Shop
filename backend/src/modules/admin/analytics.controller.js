import { prisma } from "../../lib/db";

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const parseRange = (query) => {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 29);

  const from = query.from ? new Date(`${query.from}T00:00:00`) : startOfDay(defaultFrom);
  const toInput = query.to ? new Date(`${query.to}T00:00:00`) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(toInput.getTime())) {
    throw new Error("ช่วงเวลาไม่ถูกต้อง");
  }

  const toExclusive = new Date(toInput);
  toExclusive.setDate(toExclusive.getDate() + 1);
  toExclusive.setHours(0, 0, 0, 0);

  if (from >= toExclusive) {
    throw new Error("วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด");
  }

  return { from, toExclusive };
};

const formatDateKey = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&shopId=
export const getAdminAnalytics = async (c) => {
  try {
    const { from, toExclusive } = parseRange({
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
    const shopId = String(c.req.query("shopId") || "").trim();

    const paidDateFilter = {
      OR: [
        {
          payment: { is: { paidAt: { gte: from, lt: toExclusive } } },
        },
        {
          payment: { is: { paidAt: null } },
          createdAt: { gte: from, lt: toExclusive },
        },
      ],
    };

    const [subOrders, platformItems, paidOrders] = await Promise.all([
      prisma.subOrder.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
        AND: [
          { order: { payment: { is: { status: "SUCCESS" } } } },
          {
            OR: [
              {
                order: {
                  payment: { is: { paidAt: { gte: from, lt: toExclusive } } },
                },
              },
              {
                order: {
                  payment: { is: { paidAt: null } },
                  createdAt: { gte: from, lt: toExclusive },
                },
              },
            ],
          },
        ],
      },
        select: {
          id: true,
          orderId: true,
          shopId: true,
          status: true,
          subtotal: true,
          shippingFee: true,
          commissionAmount: true,
          netAmount: true,
          createdAt: true,
          order: {
            select: {
              createdAt: true,
              payment: { select: { paidAt: true } },
            },
          },
          shop: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      // สินค้า platform ที่ไม่มี shopId (ไม่ถูก split เป็น SubOrder)
      prisma.orderItem.findMany({
        where: {
          subOrderId: null,
          product: { shopId: null },
          order: {
            payment: { is: { status: "SUCCESS" } },
            ...paidDateFilter,
          },
        },
        select: {
          orderId: true,
          price: true,
          quantity: true,
          order: {
            select: {
              createdAt: true,
              payment: { select: { paidAt: true } },
            },
          },
          accessories: {
            select: { price: true, quantity: true },
          },
        },
      }),
      // ใช้ Order.shippingFee ที่ snapshot ไว้ เพื่อไม่ตกค่าส่งของ platform group
      prisma.order.findMany({
        where: {
          payment: { is: { status: "SUCCESS" } },
          ...paidDateFilter,
          ...(shopId ? { subOrders: { some: { shopId } } } : {}),
        },
        select: {
          id: true,
          shippingFee: true,
          subOrders: {
            where: shopId ? { shopId } : undefined,
            select: { shippingFee: true },
          },
        },
      }),
    ]);

    const shopMap = new Map();
    const dayMap = new Map();
    const orderIds = new Set();
    let sellerGmv = 0;
    let platformGmv = 0;
    let commission = 0;
    let cancelledGmv = 0;

    const shipping = paidOrders.reduce((sum, order) => {
      const subOrderShipping = order.subOrders.reduce(
        (subtotal, subOrder) => subtotal + Number(subOrder.shippingFee),
        0,
      );
      return (
        sum +
        (shopId
          ? subOrderShipping
          : Math.max(Number(order.shippingFee), subOrderShipping))
      );
    }, 0);

    for (const subOrder of subOrders) {
      const subtotal = Number(subOrder.subtotal);
      const commissionAmount = Number(subOrder.commissionAmount);
      const paidAt =
        subOrder.order.payment?.paidAt || subOrder.order.createdAt;

      if (!orderIds.has(subOrder.orderId)) orderIds.add(subOrder.orderId);

      sellerGmv += subtotal;
      commission += commissionAmount;
      if (["CANCELLED", "REFUNDED"].includes(subOrder.status)) {
        cancelledGmv += subtotal;
      }

      const shopEntry = shopMap.get(subOrder.shopId) || {
        shopId: subOrder.shopId,
        shopName: subOrder.shop?.name || "ร้านค้า",
        shopSlug: subOrder.shop?.slug || null,
        gmv: 0,
        commission: 0,
        orders: new Set(),
      };
      shopEntry.gmv += subtotal;
      shopEntry.commission += commissionAmount;
      shopEntry.orders.add(subOrder.orderId);
      shopMap.set(subOrder.shopId, shopEntry);

      const dayKey = formatDateKey(paidAt);
      const dayEntry = dayMap.get(dayKey) || {
        date: dayKey,
        gmv: 0,
        commission: 0,
        orders: new Set(),
      };
      dayEntry.gmv += subtotal;
      dayEntry.commission += commissionAmount;
      dayEntry.orders.add(subOrder.orderId);
      dayMap.set(dayKey, dayEntry);
    }

    for (const item of shopId ? [] : platformItems) {
      const itemTotal =
        Number(item.price) * item.quantity +
        item.accessories.reduce(
          (sum, accessory) =>
            sum + Number(accessory.price) * accessory.quantity,
          0,
        );
      const paidAt = item.order.payment?.paidAt || item.order.createdAt;

      platformGmv += itemTotal;
      orderIds.add(item.orderId);

      const dayKey = formatDateKey(paidAt);
      const dayEntry = dayMap.get(dayKey) || {
        date: dayKey,
        gmv: 0,
        commission: 0,
        orders: new Set(),
      };
      dayEntry.gmv += itemTotal;
      dayEntry.orders.add(item.orderId);
      dayMap.set(dayKey, dayEntry);
    }

    const gmv = sellerGmv + platformGmv;

    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      activeShops,
      pendingShops,
      hiddenProducts,
      pendingPayouts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.user.count(),
      prisma.shop.count({ where: { status: "APPROVED" } }),
      prisma.shop.count({ where: { status: "PENDING" } }),
      prisma.product.count({
        where: { isDeleted: false, moderationStatus: { not: "VISIBLE" } },
      }),
      prisma.payoutRequest.count({ where: { status: "PENDING" } }),
    ]);

    const round = (value) => Math.round(value * 100) / 100;

    return c.json({
      success: true,
      range: { from, to: toExclusive },
      summary: {
        gmv: round(gmv),
        sellerGmv: round(sellerGmv),
        platformGmv: round(platformGmv),
        commission: round(commission),
        netSeller: round(sellerGmv - commission),
        shipping: round(shipping),
        cancelledGmv: round(cancelledGmv),
        takeRate: gmv > 0 ? commission / gmv : 0,
        paidOrders: orderIds.size,
        totalOrders,
        totalProducts,
        totalCustomers,
        activeShops,
        pendingShops,
        hiddenProducts,
        pendingPayouts,
      },
      byShop: [...shopMap.values()]
        .map((entry) => ({
          ...entry,
          orders: entry.orders.size,
          gmv: round(entry.gmv),
          commission: round(entry.commission),
          netSeller: round(entry.gmv - entry.commission),
        }))
        .sort((a, b) => b.gmv - a.gmv),
      byDay: [...dayMap.values()]
        .map((entry) => ({
          ...entry,
          orders: entry.orders.size,
          gmv: round(entry.gmv),
          commission: round(entry.commission),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    if (error?.message === "ช่วงเวลาไม่ถูกต้อง" || error?.message === "วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด") {
      return c.json({ error: error.message }, 400);
    }
    console.error("Admin analytics error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูล Analytics ได้" }, 500);
  }
};
