import { API_ENDPOINTS } from "@/lib/constants/api";
import { CategoryItem } from "@/types/megamenu";

const baseUrl = API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL;

//  Recursive alphabetical sorter
function sortCategories(categories: CategoryItem[]): CategoryItem[] {
  return categories
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    )
    .map((cat) => ({
      ...cat,
      subcategories: cat.subcategories
        ? sortCategories(cat.subcategories)
        : [],
    }));
}

export async function getCategoryData(
  parentSlug?: string
): Promise<CategoryItem[]> {
  const res = await fetch(`${baseUrl}${API_ENDPOINTS.CATEGORIES.LIST}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("Failed to fetch category data");
    return [];
  }

  const data: CategoryItem[] = await res.json();

  // Sort full tree first
  const sortedData = sortCategories(data);

  if (!parentSlug) {
    return sortedData;
  }

  //  Find category by slug
  const findCategory = (
    categories: CategoryItem[],
    slug: string
  ): CategoryItem | null => {
    for (const cat of categories) {
      if (cat.slug === slug) return cat;
      if (cat.subcategories?.length) {
        const found = findCategory(cat.subcategories, slug);
        if (found) return found;
      }
    }
    return null;
  };

  const category = findCategory(sortedData, parentSlug);

  // Return already sorted subcategories
  return category?.subcategories || [];
}
