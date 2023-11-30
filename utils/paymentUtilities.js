export const convertToSmallestUnit = (amount, currency) => {
    const minorUnits = {
      USD: 100, // US Dollar (1 USD = 100 cents)
      EUR: 100,
    };
  
    const minorUnit = minorUnits[currency] || 1; // Default to 1 if the currency is not in the map
  
    // Convert the amount to the smallest unit (e.g., cents)
    const amountInSmallestUnit = Math.ceil(amount * minorUnit); // Rounding to handle potential floating point precision issues
  
    return amountInSmallestUnit;
  };