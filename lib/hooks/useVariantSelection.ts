import { useState, useEffect, useMemo, useCallback } from "react";
import { Variant } from "@/types/product";

type SelectedAttributes = Record<string, string>;

const getAllAttributeNames = (variants: Variant[]) => {
  const set = new Set<string>();
  variants.forEach(v =>
    v.attributes.forEach(a => set.add(a.name.toLowerCase()))
  );
  return Array.from(set);
};

export function useVariantSelection(variants: Variant[] = []) {
  const attributeNames = useMemo(
    () => getAllAttributeNames(variants),
    [variants]
  );

  //  initial selection = first valid values
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>(() => {
    const attrs: SelectedAttributes = {};
    attributeNames.forEach(name => {
      const firstValue = variants
        .map(v => v.attributes.find(a => a.name.toLowerCase() === name)?.value)
        .filter(Boolean)[0];
      if (firstValue) attrs[name] = firstValue;
    });
    return attrs;
  });

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // find matching variant
  useEffect(() => {
    if (!variants.length) return;

    const allSelected = Object.values(selectedAttributes).every(Boolean);
    if (!allSelected) {
      setSelectedVariant(null);
      return;
    }

    const match = variants.find(variant =>
      variant.attributes.every(
        attr => selectedAttributes[attr.name.toLowerCase()] === attr.value
      )
    );

    setSelectedVariant(match || null);
  }, [selectedAttributes, variants]);

  //  dynamic filtering (ignore self rule)
  const filteredAttributes = useMemo(() => {
    const options: Record<string, Array<{ value: string; stock: number | undefined }>> = {}; // Changed type

    attributeNames.forEach(attrName => {
      // Initialize with an empty array
      options[attrName] = []; 

      const processedValues = new Set<string>(); // Keep track of processed values to avoid duplicates

      variants.forEach(variant => {
        const matchesOtherAttributes = Object.entries(selectedAttributes).every(
          ([key, value]) => {
            if (!value) return true;
            if (key === attrName) return true; 
            return variant.attributes.some(
              a => a.name.toLowerCase() === key && a.value === value
            );
          }
        );

        if (matchesOtherAttributes) {
          const attr = variant.attributes.find(a => a.name.toLowerCase() === attrName);
          if (attr && !processedValues.has(attr.value)) { // Add only if not already processed
            options[attrName].push({ value: attr.value, stock: variant.stock }); // Store value and stock
            processedValues.add(attr.value);
          }
        }
      });
    });

    return options;
  }, [variants, selectedAttributes, attributeNames]);

  //  attribute change handler
  const handleAttributeChange = useCallback(
    (attrName: string, attrValue: string) => {
      const next = { ...selectedAttributes, [attrName]: attrValue };

      attributeNames.forEach(name => {
        if (name === attrName) return;

        const validValues = variants
          .filter(v =>
            Object.entries(next).every(([k, v2]) =>
              !v2 || v.attributes.some(a => a.name.toLowerCase() === k && a.value === v2)
            )
          )
          .map(v => v.attributes.find(a => a.name.toLowerCase() === name)?.value)
          .filter(Boolean) as string[];

        if (!validValues.includes(next[name])) {
          next[name] = "";
        }
      });

      setSelectedAttributes(next);
    },
    [selectedAttributes, variants, attributeNames]
  );

  const resetAttributes = useCallback(() => {
    const reset: SelectedAttributes = {};
    attributeNames.forEach(name => (reset[name] = ""));
    setSelectedAttributes(reset);
  }, [attributeNames]);

  return {
    attributeNames,
    selectedAttributes,
    selectedVariant,
    filteredAttributes,
    handleAttributeChange,
    resetAttributes,
    setSelectedVariant,
    setSelectedAttributes
  };
}
