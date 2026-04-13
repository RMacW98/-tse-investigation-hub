const SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || "";
const EMAIL = process.env.ZENDESK_EMAIL || "";
const TOKEN = process.env.ZENDESK_API_TOKEN || "";

function authHeader() {
  const creds = Buffer.from(`${EMAIL}/token:${TOKEN}`).toString("base64");
  return {
    Authorization: `Basic ${creds}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

const BASE_URL = `https://${SUBDOMAIN}.zendesk.com/api/v2`;

async function makeRequest(endpoint) {
  const url = `${BASE_URL}/${endpoint}`;
  try {
    const res = await fetch(url, { headers: authHeader(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getTicket(ticketId) {
  return makeRequest(`tickets/${ticketId}.json`);
}

export async function listTickets(status = "open", perPage = 25) {
  const params = new URLSearchParams({
    status,
    per_page: String(perPage),
    sort_by: "updated_at",
    sort_order: "desc",
  });
  const result = await makeRequest(`tickets.json?${params}`);
  return result?.tickets || [];
}

export async function searchTickets(query, perPage = 25) {
  const params = new URLSearchParams({
    query: `type:ticket ${query}`,
    per_page: String(perPage),
  });
  const result = await makeRequest(`search.json?${params}`);
  return result?.results || [];
}

export async function getTicketComments(ticketId) {
  const result = await makeRequest(`tickets/${ticketId}/comments.json`);
  return result?.comments || [];
}
