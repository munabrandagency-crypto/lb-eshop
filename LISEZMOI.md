# Webapp boutique sur-mesure

Une page web autonome : catalogue (Google Sheets), favoris, panier, commande sur WhatsApp,
enregistrement de chaque commande dans la feuille privée "Commandes".
Installable sur l'écran d'accueil du téléphone ("Ajouter à l'écran d'accueil").

## Contenu du dossier

| Fichier | Rôle | À modifier ? |
|---|---|---|
| `config.js` | Nom de la boutique, textes, n° WhatsApp, IDs des feuilles | **Oui, c'est le seul** |
| `index.html` | Structure de la page | Non |
| `app.js` | Moteur (catalogue, panier, favoris, commande) | Non |
| `styles.css` | Design | Non |
| `manifest.webmanifest`, `icon*.png`, `icon.svg` | Icône et installation sur téléphone | Nom de l'app dans le manifest si besoin |

## Mettre en ligne (Netlify, gratuit, ~5 minutes)

1. Créer un compte gratuit sur https://app.netlify.com (connexion avec Google possible).
2. Aller sur https://app.netlify.com/drop
3. Glisser le **dossier entier** (pas le .zip) dans la zone.
4. Le site est en ligne : une adresse du type `quelque-chose.netlify.app` s'affiche.
5. Site configuration > Change site name : choisir par ex. `lb-eshop` → `lb-eshop.netlify.app`.

Pour une mise à jour (nouveau `config.js`, nouveau design) : onglet **Deploys** > glisser le dossier à nouveau.
Les produits, prix et photos, eux, se changent dans la feuille Produits, sans republier.

Nom de domaine personnalisé (ex. `lbeshop.cm`) : Domain management > Add a domain.

## Intégrer dans Nicepage

- Lien simple : un bouton "Boutique" qui pointe vers l'adresse Netlify.
- Ou intégré dans une page : élément HTML avec
  `<iframe src="https://lb-eshop.netlify.app" style="width:100%;height:90vh;border:0;border-radius:16px"></iframe>`
  (le lien direct reste préférable sur mobile : barre flottante et WhatsApp fonctionnent mieux en pleine page).

## Dupliquer pour une autre boutique

Copier le dossier, changer `config.js` (nom, feuilles, WhatsApp) et `manifest.webmanifest` (nom),
remplacer `icon.svg` / `icon-192.png` / `icon-512.png`, puis glisser sur Netlify Drop.
