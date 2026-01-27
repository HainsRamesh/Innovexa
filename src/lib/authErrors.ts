// Map Supabase auth errors to user-friendly messages
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Sign in errors
  "Invalid login credentials": "The email or password you entered is incorrect. Please try again.",
  "Email not confirmed": "Please verify your email address before signing in.",
  "Invalid email or password": "The email or password you entered is incorrect.",
  
  // Sign up errors
  "User already registered": "An account with this email already exists. Please sign in instead.",
  "Password should be at least 6 characters": "Password must be at least 8 characters long.",
  "Signup requires a valid password": "Please enter a valid password.",
  "Email rate limit exceeded": "Too many attempts. Please wait a few minutes and try again.",
  
  // OTP errors
  "Token has expired or is invalid": "This verification code has expired. Please request a new one.",
  "Invalid OTP": "The code you entered is incorrect. Please try again.",
  "Email link is invalid or has expired": "This verification link has expired. Please request a new one.",
  
  // Password reset errors
  "New password should be different from the old password": "Please choose a different password from your current one.",
  
  // Rate limiting
  "For security purposes, you can only request this once every 60 seconds": "Please wait a moment before requesting another code.",
  
  // Network errors
  "Failed to fetch": "Unable to connect. Please check your internet connection.",
  "NetworkError": "Network error. Please check your connection and try again.",
};

export function getAuthErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  const message = error.message || error.error_description || String(error);
  
  // Check for exact matches first
  if (AUTH_ERROR_MESSAGES[message]) {
    return AUTH_ERROR_MESSAGES[message];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return a sanitized version of the original message
  if (message.includes("already registered") || message.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  
  if (message.includes("password") && message.includes("8")) {
    return "Password must be at least 8 characters long.";
  }
  
  if (message.includes("rate") || message.includes("limit") || message.includes("60 seconds")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  
  if (message.includes("expired")) {
    return "Your session or code has expired. Please try again.";
  }
  
  if (message.includes("invalid") && message.includes("email")) {
    return "Please enter a valid email address.";
  }
  
  // Generic fallback
  return "Something went wrong. Please try again.";
}

// Validation helpers
export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  return null;
}

export function validateName(name: string): string | null {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 100) return "Name is too long";
  return null;
}

// Password strength indicator
export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): { strength: PasswordStrength; score: number } {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { strength: "weak", score: 25 };
  if (score <= 3) return { strength: "fair", score: 50 };
  if (score <= 4) return { strength: "good", score: 75 };
  return { strength: "strong", score: 100 };
}
