# Récupération accès admin LogerBien

## Admin avec email existant

1. Ouvrir `/mot-de-passe-oublie`.
2. Entrer l'email du compte admin.
3. Cliquer sur `Recevoir le lien`.
4. Ouvrir le lien envoyé par Supabase.
5. Définir un nouveau mot de passe sur `/auth/reset-password`.
6. Se reconnecter depuis `/connexion`.

## Aucun admin existant

Ne jamais exposer de création admin publiquement dans l'application.

Procédure sécurisée :

1. Ouvrir le Supabase Dashboard du projet.
2. Créer ou retrouver l'utilisateur dans `Authentication`.
3. Dans la table `profiles`, attribuer le rôle `admin` uniquement à l'utilisateur autorisé.
4. Vérifier que `/admin` reste inaccessible aux comptes non admin.

Cette procédure doit rester réservée au propriétaire du projet ou à une personne autorisée.
