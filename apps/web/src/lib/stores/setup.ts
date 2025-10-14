import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

export interface TMDBKeyData {
  apiKey: string;
}

export interface CollectionConfig {
  name: string;
  description?: string;
  libraryPath: string;
  libraryType: "movie" | "tv" | "music" | "comic";
  isLibrary: boolean;
}

export interface SetupData {
  tmdbKey: TMDBKeyData;
  collections: CollectionConfig[];
}

export interface SetupState {
  // Current step
  currentStep: number;
  totalSteps: number;

  // Form data
  tmdbKey: TMDBKeyData;
  collections: CollectionConfig[];

  // UI state
  isLoading: boolean;
  errors: Record<string, string[]>;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateTMDBKey: (data: Partial<TMDBKeyData>) => void;
  addCollection: (collection: CollectionConfig) => void;
  updateCollection: (
    index: number,
    collection: Partial<CollectionConfig>
  ) => void;
  removeCollection: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setErrors: (errors: Record<string, string[]>) => void;
  clearErrors: () => void;
  reset: () => void;
}

// ────────────────────────────────────────────────────────────────
// INITIAL STATE
// ────────────────────────────────────────────────────────────────

const initialState = {
  currentStep: 1,
  totalSteps: 5,
  tmdbKey: {
    apiKey: "",
  },
  collections: [
    {
      name: "Movies",
      description: "My movie collection",
      libraryPath: "",
      libraryType: "movie" as const,
      isLibrary: true,
    },
    {
      name: "TV Shows",
      description: "My TV show collection",
      libraryPath: "",
      libraryType: "tv" as const,
      isLibrary: true,
    },
  ],
  isLoading: false,
  errors: {},
};

// ────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────

export const useSetupStore = create<SetupState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step: number) => {
        const { totalSteps } = get();
        if (step >= 1 && step <= totalSteps) {
          set({ currentStep: step });
        }
      },

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      updateTMDBKey: (data: Partial<TMDBKeyData>) => {
        set((state) => ({
          tmdbKey: { ...state.tmdbKey, ...data },
        }));
      },

      addCollection: (collection: CollectionConfig) => {
        set((state) => ({
          collections: [...state.collections, collection],
        }));
      },

      updateCollection: (
        index: number,
        collection: Partial<CollectionConfig>
      ) => {
        set((state) => ({
          collections: state.collections.map((col, i) =>
            i === index ? { ...col, ...collection } : col
          ),
        }));
      },

      removeCollection: (index: number) => {
        set((state) => ({
          collections: state.collections.filter((_, i) => i !== index),
        }));
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setErrors: (errors: Record<string, string[]>) => {
        set({ errors });
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "setup-store",
    }
  )
);

// ────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ────────────────────────────────────────────────────────────────

export const validateTMDBKey = (
  data: TMDBKeyData
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  if (!data.apiKey || data.apiKey.trim().length === 0) {
    errors.apiKey = ["TMDB API key is required"];
  }

  return errors;
};

export const validateCollection = (
  data: CollectionConfig
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = ["Collection name is required"];
  }

  if (!data.libraryPath || data.libraryPath.trim().length === 0) {
    errors.libraryPath = ["Library path is required"];
  }

  if (!["movie", "tv", "music", "comic"].includes(data.libraryType)) {
    errors.libraryType = ["Invalid library type"];
  }

  return errors;
};

export const validateSetupData = (
  data: SetupData
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  const tmdbErrors = validateTMDBKey(data.tmdbKey);
  if (Object.keys(tmdbErrors).length > 0) {
    errors.tmdbKey = tmdbErrors.apiKey || [];
  }

  if (data.collections.length === 0) {
    errors.collections = ["At least one collection is required"];
  }

  data.collections.forEach((collection, index) => {
    const collectionErrors = validateCollection(collection);
    Object.keys(collectionErrors).forEach((field) => {
      errors[`collections.${index}.${field}`] = collectionErrors[field];
    });
  });

  return errors;
};
