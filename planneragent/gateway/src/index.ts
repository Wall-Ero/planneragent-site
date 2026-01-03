export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // health
    if (url.pathname === "/health") {
      return new Response("GATEWAY OK");
    }

    // proxy verso CORE
    if (url.pathname === "/plans/allowed") {
      return await env.CORE.fetch("http://core/plans/allowed",{
        headers :{
          "X-Service-Auth": env.SERVICE_TOKEN
          }
       });
    }
    if (url.pathname === "/analyze" && request.method === "POST") {
  return await env.CORE.fetch("http://core/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Service-Auth": env.SERVICE_TOKEN,
    },
    body: await request.text(),
  });
}
    return new Response("Not found", { status: 404 });
  },
};