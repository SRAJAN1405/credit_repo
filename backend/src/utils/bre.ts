export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

// Valid PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  // Rule 1: Age between 23 and 50
  const age = calculateAge(new Date(input.dateOfBirth));
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 years. Your age: ${age} years.`);
  }

  // Rule 2: Monthly salary >= ₹25,000
  if (input.monthlySalary < 25000) {
    errors.push(
      `Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString('en-IN')}.`
    );
  }

  // Rule 3: Valid PAN format
  const panUpper = input.pan.toUpperCase().trim();
  if (!PAN_REGEX.test(panUpper)) {
    errors.push(
      `Invalid PAN format. PAN must be in format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F). Provided: ${input.pan}`
    );
  }

  // Rule 4: Not unemployed
  if (input.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan.');
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

// Calculate loan financials using Simple Interest
export function calculateLoanFinancials(
  principal: number,
  tenureDays: number,
  ratePercent: number = 12
): { simpleInterest: number; totalRepayment: number } {
  // SI = (P × R × T) / (365 × 100)
  const simpleInterest = (principal * ratePercent * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;
  return {
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}
