import { API_ENDPOINTS } from "@/lib/constants/api";
import { MegaMenuCategory } from "@/types/megamenu";
import { Category } from "@/types/product";

const baseUrl = API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL;

const MAIN_CATEGORY_ORDER = [
  "Home & Garden",
  "Furniture",
  "Health & Beauty",
  "Toys & Games",
  "Baby & Kids",
  "Sports & Outdoor",
  "Appliances",
  "Electronics",
  "Rugs",
  "Tools & Equipment",
  "Hobbies & Entertainment",
  "Fashion",
  "Food & Beverages",
  "Vehicles & Parts",
  "Business & Industrial",
  "Books & Media",
];

/**
 * Recursive transformer (unlimited depth)
 */
function transformCategory(category: Category, level = 1): MegaMenuCategory {
  const slug = category.slug ?? "";
  const children: Category[] = category.subcategories ?? [];

  return {
    name: category.name,
    id: category.id,
    slug,
    product_count: category.product_count,
    href: `/category/${slug}`,
    ...(level > 1 && { viewAll: `/category/${slug}` }),
    subcategories: children
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((sub) => transformCategory(sub, level + 1)),
    links: children
      .filter((child) => !child.subcategories?.length)
      .map((child) => ({
        name: child.name,
        href: `/category/${child.slug ?? ""}`,
        product_count: child.product_count,
      })),
  };
}


export async function getMegaMenuData() {
  const res = await fetch(`${baseUrl}${API_ENDPOINTS.CATEGORIES.LIST}`, {
    next: { revalidate: 3600 }, // categories rarely change — cache 1 hour
  });

  if (!res.ok) return [];

  const data: Category[] = await res.json();

  const orderedMainCategories = [
    ...MAIN_CATEGORY_ORDER
      .map((name) => data.find((cat) => cat.name?.toLowerCase().includes(name.toLowerCase())))
      .filter((cat): cat is Category => !!cat),
    ...data.filter((cat) => !MAIN_CATEGORY_ORDER.includes(cat.name)),
  ];

  return orderedMainCategories.map((category) => transformCategory(category));
}
