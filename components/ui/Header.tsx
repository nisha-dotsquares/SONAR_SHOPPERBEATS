

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addBreadcrumb } from "@/lib/redux/slices/breadcrumbSlice";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import HeaderIcon from "./HeaderIcon";
import CartPopup from "./CartPopup";
import { useRouter } from "next/navigation";
import { useGetAddressesQuery } from "@/lib/redux/apis/addressApi";
import GooglePlacesInput from "./AddressAutocomplete";
import { toast } from "react-toastify";

import { useSearchProductsQuery } from "../../lib/redux/apis/productsApi";
import useDebounce from "@/lib/hooks/useDebounce";
import Button from "./Button";
import { Address } from "@/types/address";
import { useGetUserDetailsQuery } from "@/lib/redux/apis/authApi";
import { RootState } from "@/lib/redux/store";
import { useRef } from "react";


export interface MegaMenuCategory {
  name: string;
  id: string;
  slug?: string;
  subcategories: {
    name: string;
    id: string;
    slug?: string;
    links: {
      name: string;
      href: string;
      children?: { name: string; href: string }[];
    }[];
    viewAll?: string;
  }[];
}

interface HeaderProps {
  megaMenuData: MegaMenuCategory[];
}

export default function Header({ megaMenuData }: HeaderProps) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [showCartCard, setShowCartCard] = useState(false);
  const [showPincodeInput, setShowPincodeInput] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { postcode, suburb, updatePostcode } = useGlobalPostcode();
  const { data: addresses } = useGetAddressesQuery(undefined, { skip: !isAuthenticated })

  const locationRequestedRef = useRef(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if location should be auto-detected
    const checkLocationAndPostcode = async () => {
      if (locationRequestedRef.current) return;
      locationRequestedRef.current = true;

      // Check if there's a stored postcode
      const storedPostcode = localStorage.getItem('globalPostcode');

      // If no stored postcode and geolocation is available, try to get current location
      if (!storedPostcode && locationRequestedRef.current) {
        getCurrentLocation();
      }
    }


    checkLocationAndPostcode();
  }, []);

  const defaultAddress = addresses?.find((address) => address.is_default);

  const [activeCategory, setActiveCategory] = useState<string | null>(
    megaMenuData.length > 0 ? (megaMenuData[0].slug ?? megaMenuData[0].id) : null
  );
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openSubCategories, setOpenSubCategories] = useState<
    Record<string, boolean>
  >({});
  const [openSubSubCategories, setOpenSubSubCategories] = useState<
    Record<string, boolean>
  >({});

  // const { isError } = useGetUserDetailsQuery(undefined, {
  //   skip: !isAuthenticated,
  // });


  const toggleSubCategory = (subCatId: string) => {
    setOpenSubCategories((prev) => ({
      ...prev,
      [subCatId]: !prev[subCatId],
    }));
  };

  const toggleSubSubCategory = (linkName: string) => {
    setOpenSubSubCategories((prev) => ({
      ...prev,
      [linkName]: !prev[linkName],
    }));
  };

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchProductsQuery(debouncedSearchQuery, {
      skip: !debouncedSearchQuery,
    });

  // Calculate deduped results with useMemo
  const mapProductToSearchResult = (product: any, query: string) => {
    const titleMatch = product.title?.toLowerCase().includes(query);
    const brandMatch = product.brand_name?.toLowerCase().includes(query);
    const categoryMatch = product.category_name?.toLowerCase().includes(query);

    if (brandMatch && !titleMatch && !categoryMatch) {
      return { displayLabel: product.brand_name, linkHref: `/brand/${product.brand_name}`, id: product.id };
    }
    if (categoryMatch && !titleMatch && !brandMatch) {
      return { displayLabel: product.category_name || "", linkHref: `/category/${product.category_slug ?? product.category_id}`, id: product.id };
    }
    return { displayLabel: product.title, linkHref: `/product/${product.unique_code || product.id}`, id: product.id };
  };

  // Calculate deduped results with useMemo
  const dedupedResults = React.useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    const results = searchResults?.data?.map((p) => mapProductToSearchResult(p, query)) || [];

    return results.filter((item, index, self) =>
      index === self.findIndex((t) => t.displayLabel === item.displayLabel)
    );
  }, [searchResults, debouncedSearchQuery]);

  const handleSearch = () => {
    if (selectedResultIndex !== -1 && dedupedResults && dedupedResults[selectedResultIndex]) {
      const selectedItem = dedupedResults[selectedResultIndex];
      router.push(selectedItem.linkHref);
      setShowSearchResults(false);
      // setSearchQuery("");
      setSelectedResultIndex(-1);
    } else {
      if (searchQuery.trim() == "") return;
      router.push(`/search?q=${searchQuery.trim()}`);
      // setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const toggleMegaMenu = () => {
    setIsMegaMenuOpen(!isMegaMenuOpen);
    setIsMobileNavOpen((prev) => !prev);
  };

  const closeMegaMenu = () => {
    setIsMegaMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menu = document.querySelector(".mobile-mega-menu");
      const megaMenu = document.getElementById("megaMenu");
      const toggleBtn = document.getElementById("toggleMenuBtn");
      const pincodeDropdown = document.querySelector(".pincode-dropdown");
      const deliveryBlock = document.querySelector(".delivery-block");

      const isInside = (el: Element | null) => el?.contains(target);

      if (isMobileNavOpen && menu && !isInside(menu) && !isInside(toggleBtn)) {
        setIsMobileNavOpen(false);
      }
      if (isMegaMenuOpen && megaMenu && !isInside(megaMenu) && !isInside(toggleBtn)) {
        setIsMegaMenuOpen(false);
      }
      if (showPincodeInput && pincodeDropdown && !isInside(pincodeDropdown) && !isInside(deliveryBlock)) {
        setShowPincodeInput(false);
      }
      if (showSearchResults && searchRef.current && !isInside(searchRef.current)) {
        setShowSearchResults(false);
      }
    };

    if (isMobileNavOpen || isMegaMenuOpen || showPincodeInput || showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileNavOpen, isMegaMenuOpen, showPincodeInput, showSearchResults]);

  const toggleMenu = () => {
    setIsNavOpen((prev) => !prev);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    // Ask for permission first
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => { // NOSONAR - allowed
        if (result.state === 'denied') {
          // toast.error("Location access is blocked. Please enable it in your browser settings.");
          return;
        }
        requestLocation();
      }).catch(() => {
        // Fallback if permissions API is not supported
        requestLocation();
      });
    } else {
      requestLocation();
    }
  };

  const requestLocation = () => {
    // const loadingToast = toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition( // NOSONAR - allowed
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use server-side API route to avoid referer restrictions
          const response = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}`
          );
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;

            let city = "";
            let pincode = "";

            addressComponents.forEach((component: google.maps.GeocoderAddressComponent) => {
              if (component.types.includes("locality")) {
                city = component.long_name;
              }
              if (component.types.includes("postal_code")) {
                pincode = component.long_name;
              }
            });

            if (city && pincode) {
              updatePostcode(pincode, city);
              // toast.success(`Location set to ${pincode}`, { id: loadingToast });
            } else if (pincode) {
              updatePostcode(pincode, "Melbourne");
            } else {
              toast.error("Could not determine postal code from your location");
            }
          } else {
            toast.error("Could not get address from your location");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Failed to get address from location");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        // toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };
  return (
    <div className="header-fixed">
      <div className="container">
        {/* header */}
        <div className="top-head">
          <div className="logo">
            <Link href="/">
              <Image
                src="/images/logo.svg"
                alt="ShopperBeats Logo"
                width={390}
                height={170}
                priority
              // style={{ height: "auto", maxWidth: "100%" }}
              />
            </Link>
          </div>

          <div className="search-block" ref={searchRef}>
            <label htmlFor="headerSearch" className="visually-hidden">Search products</label>
            <input
              id="headerSearch"
              type="text"
              placeholder="Explore amazing products you'll love"
              value={searchQuery}
              onChange={(e) => {
                setShowSearchResults(true);
                setSearchQuery(e.target.value);
                setSelectedResultIndex(-1);
              }}
              onFocus={() => {
                if (searchQuery.trim() !== '') {
                  setShowSearchResults(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) =>
                    dedupedResults && prev < dedupedResults.length - 1 ? prev + 1 : 0
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) =>
                    dedupedResults && prev > 0 ? prev - 1 : (dedupedResults?.length || 1) - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                } else if (e.key === "Escape") {
                  setShowSearchResults(false);
                }
              }}
            />
            <button type="button" onClick={handleSearch} aria-label="Search"></button>
            {searchQuery && showSearchResults && (
              <div className="search-results">
                {isSearchLoading && <p>Loading...</p>}
                {dedupedResults?.map((item, index) => (
                  <Link
                    prefetch={false}
                    key={`${item.id ?? ""}-${item.displayLabel ?? ""}`}
                    href={item.linkHref}
                    onClick={() => setShowSearchResults(false)}
                  >
                    <div className={`search-result-item ${index === selectedResultIndex ? "selected" : ""}`}>
                      <p>{item.displayLabel}</p>
                    </div>
                  </Link>
                ))
                }
              </div>
            )}
          </div>

          <div className="login-block">
            <div className="delivery-block" style={{ position: "relative" }}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowPincodeInput(!showPincodeInput);
                  }
                }}
                onClick={() => {
                  // if (!isAuthenticated) {
                  setShowPincodeInput(!showPincodeInput);
                  // } else {
                  //   router.push("/user/addresses");
                  // }
                }}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Image
                  src="/images/deliver-location.svg"
                  alt="Deliver"
                  width={15}
                  height={15}
                />
                <div className="deliver-location">
                  <span>Deliver to</span>
                  {/* <p>{defaultAddress ? defaultAddress.title : postcode ? postcode : "3000"}</p> */}
                  <p>{mounted ? (postcode ? `${postcode} ${suburb}` : "3000 Melbourne") : "3000 Melbourne"}</p>
                </div>

              </div>

              {/* {showPincodeInput && !isAuthenticated && ( */}
              {showPincodeInput && (
                <div className="pincode-dropdown">
                  <label htmlFor="headerPincode" className="visually-hidden">Enter Pincode</label>
                  <GooglePlacesInput
                    id="headerPincode"
                    mode="pincode"
                    placeholder="Enter Pincode"
                    value={postcode}
                    onPlaceSelect={(data) => {
                      if (!data.pincode) {
                        toast.error("Please select a valid location with pincode");
                        return;
                      }
                      updatePostcode(data.pincode, data.city || "Melbourne");
                      setShowPincodeInput(false);
                      toast.success(`Location set to ${data.pincode} ${data.city || "Melbourne"}`);
                    }}
                    onClear={() => {
                      updatePostcode("", "");
                    }}
                  />
                </div>
              )}
            </div>

            <HeaderIcon
              href="/user/wishlist"
              iconSrc="/images/wishlist.svg"
              alt="wishlist"
              className="wishlist"
            />
            {/* <HeaderIcon
              href="/cart"
              iconSrc="/images/cart.svg"
              alt="cart"
              className="cart"
            /> */}

            <CartPopup isVisible={showCartCard} />

            <HeaderIcon
              // href="/"
              href="/user/personal-information"
              iconSrc="/images/user.svg"
              alt="account"
              className="account"
            />
          </div>
        </div>
        {/* mega menu */}
        <div className="bottom-head bg-white">
          <Button
            id="toggleMenuBtn"
            className="megamenuBtn"
            onClick={toggleMegaMenu}
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <Image
              src="/images/megamenu-toggle.svg"
              alt="Toggle Menu"
              width={20}
              height={20}
            />{" "}
            Shop By Category{" "}
            <i className="fa fa-angle-down" aria-hidden="true"></i>
            <div
              id="megaMenu"
              className={`mega-menu-wrapper ${isMegaMenuOpen ? "active" : ""}`}
            >
              <div className="mega-menu">
                {/* Left Sidebar Categories */}
                <div className="category-list">
                  <ul>
                    {megaMenuData.map((cat) => (
                      <li
                        key={cat.id}
                        className={activeCategory === (cat.slug ?? cat.id) ? "active" : ""}
                        onMouseEnter={() => setActiveCategory(cat.slug ?? cat.id)}
                      >
                        <Link
                          href={`/category/${cat.slug ?? cat.id}`}
                          prefetch={false}
                          className="category-link"
                          onClick={closeMegaMenu}
                        >
                          {cat.name}{" "}
                          <i
                            className="fa fa-angle-right"
                            aria-hidden="true"
                          ></i>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Side Content */}
                {megaMenuData.map(
                  (cat) =>
                    activeCategory === (cat.slug ?? cat.id) && (
                      <div
                        key={cat.id}
                        className={`mega-content ${activeCategory === (cat.slug ?? cat.id) ? "active" : ""
                          }`}
                        id={cat.id}
                      ><div className="mega-cat">
                          {cat.subcategories.map((subCat) => (
                            <div key={subCat.name} className="mega-column">
                              <Link
                                prefetch={false}
                                href={`/category/${subCat.slug ?? subCat.id}`}
                                onClick={closeMegaMenu}
                              >
                                <h5>{subCat.name}</h5>
                              </Link>
                              <ul>
                                {subCat.links.map((link) => (
                                  <li key={link.name}>
                                    <Link
                                      prefetch={false}
                                      href={link.href}
                                      onClick={closeMegaMenu}
                                    >
                                      {link.name}
                                    </Link>
                                  </li>
                                ))}
                                {subCat.viewAll && (
                                  <li>
                                    <Link
                                      href={`/category/${subCat.slug ?? subCat.id}`}
                                      className="view-link"
                                      prefetch={false}
                                      onClick={() => {
                                        dispatch(
                                          addBreadcrumb({
                                            name: cat.name,
                                            path: `/category/${cat.slug ?? cat.id}`,
                                          })
                                        );
                                        closeMegaMenu();
                                      }}
                                    >
                                      View All
                                    </Link>
                                  </li>
                                )}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          </Button>

          {/* Mega Menu */}
          <div
            className={`${isMobileNavOpen ? "active" : ""} mobile-mega-menu`}
          >
            <div className="new-mega-menu-content">
              {megaMenuData.map((cat) => (
                <div key={cat.id} className="new-mega-column">
                  <Link
                    href={`/category/${cat.slug ?? cat.id}`}
                    prefetch={false}
                    onClick={() => {
                      requestAnimationFrame(() => setIsMobileNavOpen(false));
                    }}
                  >
                    <h5> {cat.name} </h5>
                  </Link>
                  {cat.subcategories.map((subCat) => {
                    const isOpen = openSubCategories[subCat.id];
                    const hasLinks = subCat.links && subCat.links.length > 0;
                    return (
                      <div key={subCat.id} className="new-sub-category">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Link
                            prefetch={false}
                            href={`/category/${subCat.slug ?? subCat.id}`}
                            onClick={() => {
                              setIsMobileNavOpen(false);
                            }}
                          >
                            <h6>{subCat.name}</h6>
                          </Link>
                          {hasLinks && (
                            <span
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleSubCategory(subCat.id);
                                }
                              }}
                              onClick={() => toggleSubCategory(subCat.id)}
                              style={{ cursor: "pointer", padding: "5px" }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                  transform: isOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s",
                                }}
                              >
                                <path
                                  d="M6 9L12 15L18 9"
                                  stroke="black"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                        {hasLinks && isOpen && (
                          <ul className="sub-links-list">
                            {subCat.links.map((link) => {
                              const hasChildren =
                                link.children && link.children.length > 0;
                              const isSubOpen = openSubSubCategories[link.name];

                              return (
                                <li key={link.name}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Link href={link.href} prefetch={false}>{link.name}</Link>

                                    {hasChildren && (
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleSubSubCategory(link.name);
                                          }
                                        }}
                                        onClick={() =>
                                          toggleSubSubCategory(link.name)
                                        }
                                        style={{
                                          cursor: "pointer",
                                          padding: "5px",
                                        }}
                                      >
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          style={{
                                            transform: isSubOpen
                                              ? "rotate(180deg)"
                                              : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                          }}
                                        >
                                          <path
                                            d="M6 9L12 15L18 9"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                  </div>

                                  {/* Render sub-sub-links if open */}
                                  {hasChildren && isSubOpen && (
                                    <ul
                                      className="sub-sub-links"
                                      style={{ paddingLeft: "15px" }}
                                    >
                                      {link.children?.map((child) => (
                                        <li key={child.name}>
                                          <Link href={child.href} prefetch={false}>
                                            {child.name}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <nav className={`navbar `} id="menu">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleMenu();
                }
              }}
              className={`toggle-btn ${isNavOpen ? "active" : ""}`}
              onClick={toggleMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
            <ul
              role="button"
              tabIndex={0}
              className={`${isNavOpen ? "show" : ""} menu`}
              onClick={() => setIsNavOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setIsNavOpen(false);
                }
              }}
            >
              {/* Other top-level menu items */}
              <li>
                <Link className="link" href="/product-listing/whats-on-sale">
                  What's On Sale
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/today-s-deal">
                  Today's Deals
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/clearance">
                  Clearance
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/best-sellers">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/new-releases">
                  New Releases
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/hot-deals">
                  Hot Deals
                </Link>
              </li>
              <li>
                <Link className="link" href="/product-listing/popular">
                  Popular
                </Link>
              </li>
              <li>
                <Link className="link" href="/faq">
                  Help & Support
                </Link>
              </li>
              <li>
                <Link className="link" href="/brand">
                  Shop By Brands
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
