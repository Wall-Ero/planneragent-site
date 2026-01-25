export function healthRoute() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}