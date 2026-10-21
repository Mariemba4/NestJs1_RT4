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
  pagination: {
    pageMustBeInt: 'La page doit être un nombre entier.',
    pageMin: 'La page doit être supérieure ou égale à 1.',
    limitMustBeInt: 'La limite doit être un nombre entier.',
    limitMin: 'La limite doit être supérieure ou égale à 1.',
    limitMax: 'La limite ne peut pas dépasser 100.',
  },
  search: {
  mustBeString: 'Le critère de recherche doit être une chaîne de caractères.',
  },
} as const;
