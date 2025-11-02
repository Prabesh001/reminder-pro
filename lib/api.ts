const API_BASE = "/api";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Redirect to login if unauthorized
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (email: string, password: string) => {
    const response = await fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetchWithAuth("/auth/logout", {
      method: "POST",
    });
    return response.json();
  },
};

export const remindersApi = {
  getAll: async () => {
    const response = await fetchWithAuth("/reminders");
    const data = await response.json();
    return data.reminders || [];
  },

  create: async (
    title: string | undefined,
    category: string,
    upgradeType: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => {
    const response = await fetchWithAuth("/reminders", {
      method: "POST",
      body: JSON.stringify({
        title,
        category,
        upgradeType,
        hours,
        minutes,
        seconds,
      }),
    });
    const data = await response.json();
    return data.reminder;
  },

  update: async (id: string, action: string, data?: any) => {
    try {
      const response = await fetchWithAuth(`/reminders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Update failed");
      }

      const data2 = await response.json();
      return data2.reminder;
    } catch (error: any) {
      console.error("Update error:", error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await fetchWithAuth(`/reminders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Delete error:", error);
      throw error;
    }
  },

  sync: async () => {
    const response = await fetchWithAuth("/reminders/sync", {
      method: "POST",
    });
    return response.json();
  },

  updateOrder: async (orderUpdates: { id: string; order: number }[]) => {
    try {
      const response = await fetchWithAuth("/reminders/order", {
        method: "PATCH",
        body: JSON.stringify({ orderUpdates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Update order failed");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update order error:", error);
      throw error;
    }
  },
};
