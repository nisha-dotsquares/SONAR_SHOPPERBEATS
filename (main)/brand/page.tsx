import React from "react";
import Image from "next/image";
import Link from "next/link";
import "../../../styles/Brand.css";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";


// Types
interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  image_url: string | null;
  is_active: boolean;
  total_products: number;
  active_products: number;
  inactive_products: number;
  slug: string;
}

interface BrandsResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: Brand[];
}

interface BrandsByLetter {
  [key: string]: Brand[];
}

// Alphabet letters
const alphabet = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

async function fetchBrands() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL_PRODUCTS;


    const response = await fetch(
      `${apiUrl}/api/v1/brand/list-brands?page=1&limit=1000`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      console.warn('Failed to fetch brands, status:', response.status);
      return [];
    }
    const data: BrandsResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

async function fetchFeaturedBrands() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL_PRODUCTS;

    const response = await fetch(
      `${apiUrl}/api/v1/featured-brand`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      console.warn('Failed to fetch featured brands, status:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    return [];
  }
}


export default async function BrandsSection() {
  const [allBrands, featuredBrands] = await Promise.all([
    fetchBrands(),
    fetchFeaturedBrands()
  ]);
  // Group brands by first letter
  const brandsByLetter = allBrands.reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstLetter) ? firstLetter : "#";

    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(brand);
    return acc;
  }, {} as BrandsByLetter);
  return (
    <div>
      {/* ======== Brands Grid Section ======== */}
      <div className="pt-40 pb-40">
        <div className="container">
          <h4 className="mb-24">Featured Brands</h4>
          <div className="grid-6">
            {featuredBrands
              .map((featuredBrand: { brand_id: string }) => {
                const brand = allBrands.find((b: Brand) => b.id === featuredBrand.brand_id);
                return brand;
              })
              .filter((brand: Brand | undefined) => brand && brand.logo_url)
              .map((brand: Brand) => (
                <div key={brand.id} className="bg-card">
                  <Link href={`/brand/${brand.slug}`}>
                    <Image
                      src={brand.logo_url!}
                      alt={brand.name}
                      width={200}
                      height={80}
                      className="object-contain"
                    />
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ======== Alphabetic Brands List Section ======== */}
      <div className="container">
        <div className="all-brands mb-70">
          {/* Alphabet Navigation */}
          <ul className="alphabetic-list mb-40 dflex">
            {alphabet.map((letter) => (
              <li key={letter}>
                <a
                  href={`#brands-${letter}`}
                  data-discover={letter !== "#" ? "true" : undefined}
                >
                  {letter}
                </a>
              </li>
            ))}
          </ul>

          {/* Brands under each letter */}
          {alphabet.map((letter) => {
            const brands = brandsByLetter[letter] || [];
            if (!brands.length) return null;

            return (
              <div key={letter} className="brands-list" id={`brands-${letter}`}>
                <h5>{letter}</h5>
                <ul>
                  {brands.map((brand) => (
                    <Link href={`/brand/${brand.slug}`} key={brand.id}>
                      <li >
                        {brand.name} ({brand.active_products})
                      </li>
                    </Link>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
