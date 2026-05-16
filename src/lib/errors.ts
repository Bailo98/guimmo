export function erreurFrancais(msg: string): string {
  if (msg.includes("already registered") || msg.includes("User already registered"))
    return "Ce numéro est déjà utilisé. Connectez-vous.";
  if (msg.includes("Invalid login credentials"))
    return "Numéro ou mot de passe incorrect.";
  if (msg.includes("Password should be") || msg.includes("password should") || msg.includes("at least"))
    return "Le mot de passe doit faire 8 caractères minimum.";
  if (msg.includes("Email not confirmed"))
    return "Compte non confirmé. Contactez le support.";
  if (msg.includes("signup_disabled"))
    return "Inscriptions temporairement fermées.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Trop de tentatives. Attendez quelques minutes.";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("Failed to fetch"))
    return "Problème de connexion. Vérifiez votre réseau.";
  if (msg.includes("email") && msg.includes("invalid"))
    return "Adresse email invalide.";
  return "Une erreur est survenue. Réessayez.";
}
