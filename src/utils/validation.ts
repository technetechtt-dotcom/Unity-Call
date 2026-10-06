export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic international phone validation (allows +, spaces, dashes, digits)
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

export const validateOTP = (otp: string): boolean => {
  const re = /^\d{6}$/;
  return re.test(otp);
};