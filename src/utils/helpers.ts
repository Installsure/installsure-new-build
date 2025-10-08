export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculatePremium = (
  type: 'auto' | 'home' | 'life' | 'health',
  coverage: number,
  age?: number
): number => {
  let basePremium = 0;
  
  switch (type) {
    case 'auto':
      basePremium = coverage * 0.015;
      break;
    case 'home':
      basePremium = coverage * 0.008;
      break;
    case 'life':
      basePremium = coverage * 0.005;
      if (age) {
        basePremium *= (1 + age * 0.01);
      }
      break;
    case 'health':
      basePremium = coverage * 0.02;
      if (age) {
        basePremium *= (1 + age * 0.015);
      }
      break;
  }
  
  return Math.round(basePremium * 100) / 100;
};
