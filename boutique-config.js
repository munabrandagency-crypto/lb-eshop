
Boutique config · JS
/* ==========================================================================
   CONFIGURATION DE LA BOUTIQUE
   ==========================================================================
   C'est le SEUL fichier que vous devrez modifier pour faire vivre le site :
   nouveau numéro WhatsApp, changement de feuille Google Sheets, etc.
   Ne touchez à rien d'autre que les valeurs entre guillemets ci-dessous.
   ========================================================================== */
 
window.BOUTIQUE_CONFIG = {
 
  /* --- Catalogue (Google Sheet "Produits") ---------------------------------
     L'ID se trouve dans l'URL de votre feuille Google Sheets :
     https://docs.google.com/spreadsheets/d/CET_ID_ICI/edit
  --------------------------------------------------------------------------- */
  sheetIdProduits: "1ttmyEa1-Jp-Z1mPY85dEWftVv6y8cOGoBu7rYB9afd8",
  sheetNameProduits: "Produits",
 
  /* --- Commandes (Google Apps Script relié à la feuille "Commandes") ------
     URL obtenue après déploiement du script en "Application Web".
     Doit se terminer par /exec
  --------------------------------------------------------------------------- */
  ordersWebhookUrl: "https://script.google.com/macros/s/AKfycbywdFWyHIvJwGQK5EyaQloxlctJg19cYzfA813GkKWLSAUy9ekRdN6YXkNaFtbokcbovw/exec",
 
  /* Doit être IDENTIQUE à la valeur SECRET_PARTAGE dans le fichier Code.gs */
  ordersSecret: "nakama1210",
 
  /* --- WhatsApp -------------------------------------------------------------
     Format international, sans "+", sans espaces.
     Exemple Cameroun : 237650068716
  --------------------------------------------------------------------------- */
  whatsappNumber: "237650068716",
 
  /* --- Meta Pixel -------------------------------------------------------------
     Laissez la chaîne vide "" pour désactiver le suivi publicitaire.
  --------------------------------------------------------------------------- */
  metaPixelId: "",
 
  /* --- Textes ---------------------------------------------------------------- */
  currencyLabel: "FCFA",
  whatsappIntro: "Bonjour, je souhaite passer une commande:",
  depositNote: "Un acompte de 50% est demandé pour lancer la confection.",
  measurementsNote: "Je vous envoie juste après mes mensurations et une photo entière pour la coupe.",
};
 
