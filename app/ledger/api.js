async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "حدث خطأ أثناء الاتصال بالخادم.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const api = {
  loadLedger: () => request("/api/ledger"),
  saveLedger: (state, etag) => request("/api/ledger", {
    method: "PUT",
    body: JSON.stringify({ state, etag }),
  }),
};
