/* ==========================================================================
   CONFIGURATION DE LA BOUTIQUE
   ==========================================================================
   C'est le SEUL fichier à modifier pour faire vivre le site (ou pour le
   dupliquer pour une autre boutique). Ne changez que les valeurs entre
   guillemets.
   ========================================================================== */

window.BOUTIQUE_CONFIG = {

  /* --- Identité --------------------------------------------------------- */
  shopName: "Elle è Belle",
  tagline: "Vêtements pour femmes, confectionnés sur commande",
  heroTitle: "Des pièces coupées à vos mesures",
  heroText: "Choisissez vos modèles et envoyez votre sélection sur WhatsApp. La boutique vous guide ensuite pour les mensurations, puis lance la confection.",

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

  /* --- Réseaux sociaux : adresse complète de chaque profil ----------------
     Exemple : "https://www.instagram.com/ellebelle237". Laisser "" pour masquer l'icône. */
  reseaux: {
    instagram: "",
    tiktok: "",
    facebook: ""
  },

  /* --- Meta Pixel : laisser "" pour désactiver --------------------------- */
  metaPixelId: "",

  /* --- Textes --------------------------------------------------------------- */
  currencyLabel: "FCFA",
  /* Message WhatsApp envoyé par la cliente. {nom} est remplacé par son nom. */
  whatsappHello: "Bonjour, je m'appelle {nom}.",
  whatsappIntro: "Ces modèles m'intéressent :",
  whatsappQuestion: "Comment procède-t-on pour la commande ?",
  /* Utilisée quand un modèle est "Prix sur demande" */
  whatsappQuestionAsk: "Pouvez-vous m'indiquer le prix des modèles sur demande et m'expliquer comment procéder pour la commande ?",
};
