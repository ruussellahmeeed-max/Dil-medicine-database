
export type Category = string;

export interface MedicineDetails {
  indications?: string;
  adultDose?: string;
  childDose?: string;
  renalDose?: string;
  administration?: string;
  contraindications?: string;
  sideEffects?: string;
  precautions?: string;
  pregnancy?: string;
  therapeuticClass?: string;
  modeOfAction?: string;
  interaction?: string;
  packSize?: string;
}

export interface Medicine {
  id: string;
  codeName: string;
  fullName: string;
  category: Category;
  description?: string;
  addedAt: number;
  dosage?: string;
  type?: string;
  genericName?: string;
  manufacturer?: string;
  unitPrice?: string;
  availableForms?: string[];
  details?: MedicineDetails;
}

export interface SearchState {
  query: string;
  activeCategory: Category;
}
