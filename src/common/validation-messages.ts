export const VALIDATION_MESSAGES = {
  name: {
    mustBeString: 'Le nom doit être une chaîne de caractères.',
    required: 'Le nom est obligatoire.',
    minLength: 'Le nom doit contenir au moins 3 caractères.',
    maxLength: 'Le nom doit contenir au maximum 10 caractères.',
  },
  description: {
    mustBeString: 'La description doit être une chaîne de caractères.',
    required: 'La description est obligatoire.',
    minLength: 'La description doit contenir au moins 10 caractères.',
  },
  status: {
    mustBeValid: 'Le statut doit être TODO, IN_PROGRESS ou DONE.',
  },
} as const;
