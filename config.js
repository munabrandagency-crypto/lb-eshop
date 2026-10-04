/* ==========================================================================
   CONFIGURATION DE LA BOUTIQUE
   ==========================================================================
   C'est le SEUL fichier à modifier pour faire vivre le site (ou pour le
   dupliquer pour une autre boutique). Ne changez que les valeurs entre
   guillemets.
   ========================================================================== */

window.BOUTIQUE_CONFIG = {

  /* --- Identité --------------------------------------------------------- */
  shopName: "LB eShop",
  tagline: "Couture sur-mesure pour femmes, au Cameroun",
  heroTitle: "Des pièces coupées à vos mesures",
  heroText: "Choisissez vos modèles, envoyez la commande sur WhatsApp, puis vos mensurations. La confection démarre dès l'acompte reçu.",

  /* --- Catalogue (Google Sheet "Produits") -------------------------------
     L'ID se trouve dans l'URL : https://docs.google.com/spreadsheets/d/CET_ID/edit */
  sheetIdProduits: "1ttmyEa1-Jp-Z1mPY85dEWftVv6y8cOGoBu7rYB9afd8",
  sheetNameProduits: "Produits",

  /* --- Commandes (Apps Script relié à la feuille "Commandes") ------------
     URL du déploiement "Application Web", se termine par /exec */
  ordersWebhookUrl: "https://script.google.com/macros/s/AKfycbywdFWyHIvJwGQK5EyaQloxlctJg19cYzfA813GkKWLSAUy9ekRdN6YXkNaFtbokcbovw/exec",

  /* Doit être IDENTIQUE à SECRET_PARTAGE dans Code-commandes.gs */
  ordersSecret: "nakama1210",

  /* --- WhatsApp : format international, sans "+" ni espaces ------------- */
  whatsappNumber: "237650068716",

  /* --- Meta Pixel : laisser "" pour désactiver --------------------------- */
  metaPixelId: "",

  /* --- Textes --------------------------------------------------------------- */
  currencyLabel: "FCFA",
  whatsappIntro: "Bonjour, je souhaite passer une commande :",
  depositNote: "Un acompte de 50% est demandé pour lancer la confection.",
  measurementsNote: "Je vous envoie juste après mes mensurations et une photo entière pour la coupe.",
};
