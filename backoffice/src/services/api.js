/**
 * unified API fetch handler.
 * Because we configured Next.js rewrites, requests starting with "/api" are proxied
 * to the backend server (e.g., http://localhost:8000/api).
 * The browser automatically includes the HTTP-only "token" cookie in all of these calls.
 */
const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const authService = {
  login: (email, password) =>
    apiRequest("auth/backoffice/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, firstName, lastName, role) =>
    apiRequest("auth/backoffice/register", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    }),

  logout: () =>
    apiRequest("auth/backoffice/logout", {
      method: "POST",
    }),

  getProfile: () =>
    apiRequest("auth/backoffice/profile", {
      method: "GET",
    }),
};

export const productService = {
  getProducts: () =>
    apiRequest("products", {
      method: "GET",
    }),
  getProductById: (id) =>
    apiRequest(`products/${id}`, {
      method: "GET",
    }),
  createProduct: (productData) =>
    apiRequest("products", {
      method: "POST",
      body: JSON.stringify(productData),
    }),
  updateProduct: (id, productData) =>
    apiRequest(`products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id) =>
    apiRequest(`products/${id}`, {
      method: "DELETE",
    }),
};

export const uploadService = {
  uploadImages: (formData, folder = "products") =>
    apiRequest(`upload?folder=${folder}`, {
      method: "POST",
      body: formData,
    }),
  deleteImage: (url) =>
    apiRequest("upload", {
      method: "DELETE",
      body: JSON.stringify({ url }),
    }),
};

export const categoryService = {
  getCategories: () =>
    apiRequest("categories", { method: "GET" }),
  createCategory: (data) =>
    apiRequest("categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    apiRequest(`categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    apiRequest(`categories/${id}`, { method: "DELETE" }),
};

export const employeeService = {
  getEmployees: () =>
    apiRequest("employees", { method: "GET" }),
  createEmployee: (data) =>
    apiRequest("employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEmployee: (id, data) =>
    apiRequest(`employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id) =>
    apiRequest(`employees/${id}`, { method: "DELETE" }),
};

export const userService = {
  getUsers: () =>
    apiRequest("users", {
      method: "GET",
    }),

  getUserById: (id) =>
    apiRequest(`users/${id}`, {
      method: "GET"
    }),
};

export const orderService = {
  getAdminOrders: () =>
    apiRequest("orders/admin", {
      method: "GET",
    }),
  getAdminOrderById: (id) =>
    apiRequest(`orders/admin/${id}`, {
      method: "GET",
    }),
  updateAdminOrder: (id, orderData) =>
    apiRequest(`orders/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    }),
};

export const accessoryService = {
  getAccessories: () =>
    apiRequest("accessories", { method: "GET" }),
  getAccessoryById: (id) =>
    apiRequest(`accessories/${id}`, { method: "GET" }),
  createAccessory: (data) =>
    apiRequest("accessories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAccessory: (id, data) =>
    apiRequest(`accessories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAccessory: (id) =>
    apiRequest(`accessories/${id}`, { method: "DELETE" }),
};

export const shopService = {
  getShops: (status) =>
    apiRequest(
      status ? `admin/shops?status=${encodeURIComponent(status)}` : "admin/shops",
      { method: "GET" },
    ),
  approveShop: (id) =>
    apiRequest(`admin/shops/${id}/approve`, { method: "PUT" }),
  rejectShop: (id, reason) =>
    apiRequest(`admin/shops/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  suspendShop: (id, reason) =>
    apiRequest(`admin/shops/${id}/suspend`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  reactivateShop: (id) =>
    apiRequest(`admin/shops/${id}/reactivate`, { method: "PUT" }),
};

export const moderationService = {
  getProducts: ({ search = "", moderationStatus = "", shopId = "", page = 1, pageSize = 20 } = {}) =>
    apiRequest(
      `admin/products${buildQuery({
        search,
        moderationStatus,
        shopId,
        page,
        pageSize,
      })}`,
      { method: "GET" },
    ),
  getProductById: (id) =>
    apiRequest(`admin/products/${id}`, { method: "GET" }),
  moderateProduct: (id, action, reason) =>
    apiRequest(`admin/products/${id}/moderate`, {
      method: "PUT",
      body: JSON.stringify({ action, reason }),
    }),
};

export const payoutService = {
  getPayouts: ({ status = "", search = "" } = {}) =>
    apiRequest(`admin/payouts${buildQuery({ status, search })}`, {
      method: "GET",
    }),
  approvePayout: (id) =>
    apiRequest(`admin/payouts/${id}/approve`, { method: "PUT" }),
  rejectPayout: (id, reason) =>
    apiRequest(`admin/payouts/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  transferPayout: (id, { proofUrl = "", transferReference = "" } = {}) =>
    apiRequest(`admin/payouts/${id}/transfer`, {
      method: "PUT",
      body: JSON.stringify({ proofUrl, transferReference }),
    }),
};

export const settingsService = {
  getSettings: () => apiRequest("admin/settings", { method: "GET" }),
  updateSettings: ({ commissionRate, shippingFee, freeShippingThreshold, version }) => {
    const payload = {
      commissionRate,
      shippingFee,
      freeShippingThreshold,
    };

    if (version !== undefined && version !== null) {
      payload.version = version;
    }

    return apiRequest("admin/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

export const analyticsService = {
  getAnalytics: ({ from = "", to = "", shopId = "" } = {}) =>
    apiRequest(`admin/analytics${buildQuery({ from, to, shopId })}`, {
      method: "GET",
    }),
};

export const auditService = {
  getAuditLogs: ({ page = 1, pageSize = 30, action = "", targetType = "" } = {}) =>
    apiRequest(
      `admin/audit-logs${buildQuery({ page, pageSize, action, targetType })}`,
      { method: "GET" },
    ),
};