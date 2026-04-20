import { Category } from "@/types/product";


export function findCategoryPath(
  categories: Category[],
  targetId: string,
  path: { name: string; path: string }[] = []
): { name: string; path: string }[] | null {
  for (const category of categories) {
    const currentPath = [
      ...path,
      { name: category.name, path: `/category/${category.slug ?? category.id}` },
    ];

    // Match by slug (URL param) OR by id (legacy)
    if (category.slug === targetId || category.id === targetId) {
      return currentPath;
    }

    // Recursively search deeper levels (UNLIMITED)
    if (category.subcategories && category.subcategories.length > 0) {
      const found = findCategoryPath(
        category.subcategories,
        targetId,
        currentPath
      );
      if (found) return found;
    }
  }

  return null;
}
