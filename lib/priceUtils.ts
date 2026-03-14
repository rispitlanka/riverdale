export function calculateJewelleryPrice(
  metalBasePrice: number,
  makePrice: number,
  weight: number,
  stonePrice: number,
  taxIncluded: boolean,
  taxPercent: number | null | undefined
): number {
  const safeMetalBasePrice =
    typeof metalBasePrice === "number" && !Number.isNaN(metalBasePrice)
      ? metalBasePrice
      : 0;

  const safeMakePrice =
    typeof makePrice === "number" && !Number.isNaN(makePrice) ? makePrice : 0;

  const safeWeight =
    typeof weight === "number" && !Number.isNaN(weight) ? weight : 0;

  const safeStonePrice =
    typeof stonePrice === "number" && !Number.isNaN(stonePrice)
      ? stonePrice
      : 0;

  const safeTaxPercent =
    typeof taxPercent === "number" && !Number.isNaN(taxPercent)
      ? taxPercent
      : 0;

  let finalPrice =
    (safeMetalBasePrice + safeMakePrice) * safeWeight + safeStonePrice;

  if (taxIncluded && safeTaxPercent > 0) {
    finalPrice = finalPrice * (1 + safeTaxPercent / 100);
  }

  return finalPrice;
}

export function calculateProductPrice(
  metalBasePrice: number,
  makePrice: number,
  weight: number
): number {
  const safeMetalBasePrice =
    typeof metalBasePrice === "number" && !Number.isNaN(metalBasePrice)
      ? metalBasePrice
      : 0;

  const safeMakePrice =
    typeof makePrice === "number" && !Number.isNaN(makePrice) ? makePrice : 0;

  const safeWeight =
    typeof weight === "number" && !Number.isNaN(weight) ? weight : 0;

  const finalPrice = safeMetalBasePrice * safeWeight + safeMakePrice;

  return finalPrice;
}

/** Product price: metalPrice × weight, optionally + tax (no make price) */
export function calculateProductPriceWithTax(
  metalBasePrice: number,
  weight: number,
  taxIncluded: boolean,
  taxPercent: number | null | undefined
): number {
  const safeMetalBasePrice =
    typeof metalBasePrice === "number" && !Number.isNaN(metalBasePrice)
      ? metalBasePrice
      : 0;
  const safeWeight =
    typeof weight === "number" && !Number.isNaN(weight) ? weight : 0;
  const safeTaxPercent =
    typeof taxPercent === "number" && !Number.isNaN(taxPercent)
      ? taxPercent
      : 0;

  let finalPrice = safeMetalBasePrice * safeWeight;
  if (taxIncluded && safeTaxPercent > 0) {
    finalPrice = finalPrice * (1 + safeTaxPercent / 100);
  }
  return finalPrice;
}

