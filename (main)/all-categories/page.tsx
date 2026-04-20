import Image from "next/image";
import Link from "next/link";
import '../../../styles/Category.css'
import { getCategoryData } from "@/lib/utils/getCategoryData";

interface PageProps {
  searchParams: { parent?: string };
}

export default async function AllCategories({ searchParams }: PageProps) {
  const parentId = searchParams.parent;
  const categories = await getCategoryData(parentId);

  return (
    <section className="container mb-40">
      <h2 className="all-categories__heading pt-40">All Categories</h2>

      <div className="all-categories__grid">
        {categories.map((item) => {
          const hasSubcategories = item.subcategories && item.subcategories.length > 0;
          const href = hasSubcategories 
            ? `/all-categories?parent=${item.slug}` 
            : `/category/${item.slug}`;

          return (
            <Link 
              key={item.id} 
              href={href}
              className="all-categories__item"
            >
              <div className="all-categories__card">
                <div className="all-categories__image-wrapper">
                  <Image
                    src={item.icon_url||"/images/image-coming-soon.jpg"}
                    alt={item.name}
                    fill
                    className="all-categories__image"
                  />
                </div>
              </div>
              <p className="all-categories__title">{item.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
