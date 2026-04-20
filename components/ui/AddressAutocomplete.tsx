"use client";

import { useEffect, useRef, useState } from "react";

interface AddressDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

type AutocompleteMode = "address" | "pincode";

interface GooglePlacesInputProps {
  onPlaceSelect: (details: AddressDetails) => void;
  placeholder?: string;
  mode?: AutocompleteMode;
  onClear?: () => void;
  onChange?: (val: string) => void;
  value?: string;
  onValidPlace?: (valid: boolean) => void;
  id?: string;
}

export default function GooglePlacesInput({
  onPlaceSelect,
  placeholder = "Enter address",
  mode = "address",
  onClear,
  value,
  onValidPlace,
  id,
  ...props
}: GooglePlacesInputProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] =
    useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  //  control flags
  const isSelectingRef = useRef(false);
  const isUserTypingRef = useRef(false);

  // sync external value
  useEffect(() => {
    if (value !== undefined && value !== query) {
      isUserTypingRef.current = false;
      setQuery(value);
      setSuggestions([]);
    }
  }, [value]);

  // keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(suggestions[activeIndex]);
        }
        break;

      case "Escape":
        setSuggestions([]);
        setActiveIndex(-1);
        break;
    }
  };

  //  fetch suggestions ONLY when user types
  useEffect(() => {
    if (
      !isUserTypingRef.current ||
      isSelectingRef.current ||
      !window.google?.maps?.places ||
      !query
    ) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    google.maps.places.AutocompleteSuggestion
      .fetchAutocompleteSuggestions(
        mode === "pincode"
          ? {
            input: query,
            includedPrimaryTypes: ["postal_code", "locality", "sublocality"],
            includedRegionCodes: ["AU"],
          }
          : {
            input: query,
            includedRegionCodes: ["AU"],
          }
      )
      .then((res) => {
        const filtered =
          mode === "pincode"
            ? res.suggestions.filter((s) => {
              const types = s.placePrediction?.types || [];
              return types.includes("postal_code") || types.includes("locality") || types.includes("sublocality");
            })
            : res.suggestions;

        setSuggestions(filtered);
      })
      .finally(() => setLoading(false));
  }, [query, mode]);

  //  select place
  const handleSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!suggestion.placePrediction) return;

    isSelectingRef.current = true;
    isUserTypingRef.current = false;

    const fullAddress = suggestion.placePrediction.text.text; // EXACT suggestion

    const place = suggestion.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["addressComponents"],
    });

    const components = place.addressComponents ?? [];
    const get = (type: string) =>
      components.find((c) => c.types.includes(type));

    const cityComp = get("locality");
    const stateComp = get("administrative_area_level_1");
    const pincodeComp = get("postal_code");
    const countryComp = get("country");

    const city = cityComp?.longText || "";
    const state = stateComp?.longText || "";       
    const stateShort = stateComp?.shortText || ""; 
    const pincode = pincodeComp?.longText || "";
    const country = countryComp?.longText || "";

    const stripParts = [
      city,
      state,
      stateShort,
      pincode,
      country,
    ].filter(Boolean);

    let streetAddress = fullAddress;

      stripParts.forEach((part) => {
        if (typeof part !== "string") return;

        const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        streetAddress = streetAddress.replace(
          new RegExp(`,?\\s*${escaped}`, "gi"),
          ""
        );
      });

    streetAddress = streetAddress
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

      const details = {
        address: streetAddress,
        city,
        state,
        pincode,
        country,
      };

      onPlaceSelect(details);
      onValidPlace?.(true);

      setQuery(mode === "pincode" ? (pincode ? `${pincode} ${city}`.trim() : city) : streetAddress);
      setSuggestions([]);
      setActiveIndex(-1);

      setTimeout(() => {
        isSelectingRef.current = false;
      }, 0);
  };


  return (
    <div className="relative">
      <input
        type="text"
        inputMode="text"
        id={id}
        value={query}
        {...props}
        onChange={(e) => {
          isUserTypingRef.current = true;
          onValidPlace?.(false);

          const val = e.target.value;

          setQuery(val);
          setActiveIndex(-1);

          if (props.onChange) {
            props.onChange(val);
          }

          if (!val && onClear) {
            onClear();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      />

      {loading && (
        <div className="absolute bg-white w-full px-4 py-2 text-sm">
          Loading...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="absolute z-10 bg-white w-full border border-gray-300 rounded-md mt-1 shadow-lg">
          {suggestions.map((sug, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(sug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(sug);
                }
              }}
              className={`px-4 py-2 cursor-pointer ${i === activeIndex ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
            >
              {sug.placePrediction?.text.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
