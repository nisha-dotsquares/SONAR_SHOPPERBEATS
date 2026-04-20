import { API_ENDPOINTS } from "@/lib/constants/api";

export async function getFooterMenuData() {
  const results = await Promise.allSettled([
    fetch(`${API_ENDPOINTS.MENU.BASE_URL}/company`, { next: { revalidate: 3600 } }),
    fetch(`${API_ENDPOINTS.MENU.BASE_URL}/my-accounts`, { next: { revalidate: 3600 } }),
    fetch(`${API_ENDPOINTS.MENU.BASE_URL}/help-and-supports`, { next: { revalidate: 3600 } }),
    fetch(`${API_ENDPOINTS.MENU.BASE_URL}/legal`, { next: { revalidate: 3600 } }),
  ]);

  const [company, myAccount, helpSupport, legal] = await Promise.all(
    results.map(async (r) => {
      if (r.status === "rejected" || !r.value.ok) return null;
      return r.value.json();
    })
  );

  return { company, myAccount, helpSupport, legal };
}
