/** Le fournisseur IA n'a pas répondu dans le délai imparti. */
export class AiTimeoutError extends Error {
  constructor(providerName: string, timeoutMs: number) {
    super(`Le fournisseur IA "${providerName}" n'a pas répondu sous ${timeoutMs}ms.`);
    this.name = "AiTimeoutError";
  }
}

/** Erreur réseau, HTTP, ou erreur renvoyée par le fournisseur lui-même. */
export class AiProviderError extends Error {
  constructor(providerName: string, cause: string) {
    super(`Erreur du fournisseur IA "${providerName}" : ${cause}`);
    this.name = "AiProviderError";
  }
}

/** La réponse du fournisseur ne respecte pas le format structuré attendu (section 30). */
export class AiFormatValidationError extends Error {
  constructor(details: string) {
    super(`Réponse IA invalide (format) : ${details}`);
    this.name = "AiFormatValidationError";
  }
}

/** La réponse contient une formulation de certitude injustifiée (section 29). */
export class AiSafetyValidationError extends Error {
  constructor(details: string) {
    super(`Réponse IA rejetée (sécurité) : ${details}`);
    this.name = "AiSafetyValidationError";
  }
}

/** Aucun fournisseur IA n'est configuré ou activé (variables d'environnement absentes). */
export class AiNotConfiguredError extends Error {
  constructor(details: string) {
    super(`Fournisseur IA non configuré : ${details}`);
    this.name = "AiNotConfiguredError";
  }
}
