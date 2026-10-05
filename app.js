/* ==========================================================================
   MOTEUR DE LA WEBAPP — NE PAS MODIFIER
   Tout se règle dans config.js et dans la feuille Google Sheets "Produits".
   ========================================================================== */

(function () {
  "use strict";

  var C = window.BOUTIQUE_CONFIG || {};
  var KEYS = { cart: "boutique_panier_v2", fav: "boutique_favoris_v1", consent: "boutique_consentement_mesure", lead: "boutique_demande_id", source: "boutique_source" };

  /* Source de la visite : lien partagé avec ?src=instagram, ?src=qr...
     Première source retenue 60 jours, envoyée dans la colonne "source" des demandes. */
  (function captureSource() {
    try {
      var m = location.search.match(/[?&](?:src|utm_source|ref)=([^&]+)/);
      var src = m ? decodeURIComponent(m[1]).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) : "";
      var saved = JSON.parse(localStorage.getItem(KEYS.source) || "null");
      var fresh = saved && Date.now() - saved.t < 60 * 864e5;
      if (src && !fresh) localStorage.setItem(KEYS.source, JSON.stringify({ s: src, t: Date.now() }));
    } catch (e) { /* stockage indisponible */ }
  })();
  function currentSource() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEYS.source) || "null");
      return saved && Date.now() - saved.t < 60 * 864e5 ? saved.s : "direct";
    } catch (e) { return "direct"; }
  }
  var ASK = "Prix sur demande";

  var state = {
    products: [],
    loaded: false,
    failed: false,
    category: "Tout",
    view: "accueil",
    cart: load(KEYS.cart, []),
    fav: load(KEYS.fav, []),
    lastWaUrl: "",
  };

  /* ------------------------------------------------------------------ *
   *  OUTILS
   * ------------------------------------------------------------------ */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
  }

  function rawGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function rawSet(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* rien */ } }

  function hasPrice(v) {
    if (v === "" || v == null) return false;
    var n = Number(v);
    return isFinite(n) && n > 0;
  }

  function money(v) { return (Number(v) || 0).toLocaleString("fr-FR") + " " + (C.currencyLabel || "FCFA"); }
  function priceText(v) { return hasPrice(v) ? money(v) : ASK; }
  function priceHtml(v, cls) {
    return '<p class="' + cls + (hasPrice(v) ? "" : " price--ask") + '">' + priceText(v) + "</p>";
  }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.5 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5Zm0 17.1c-1.4 0-2.8-.4-4-1.1l-.3-.2-2.9.8.8-2.8-.2-.3a7.7 7.7 0 1 1 6.6 3.6Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3Z"/></svg>',
  };

  /* ------------------------------------------------------------------ *
   *  IDENTITÉ (textes de config)
   * ------------------------------------------------------------------ */

  function applyIdentity() {
    var name = C.shopName || "Boutique";
    document.title = name + " | Vêtements confectionnés sur commande";
    $$("[data-shop-name]").forEach(function (el) { el.textContent = name; });
    var foot = $("[data-shop-name-foot]");
    if (foot) foot.textContent = name;
    var tag = $("[data-shop-tagline]");
    if (tag) tag.textContent = C.tagline || "";
    var ht = $("[data-hero-title]");
    if (ht) ht.textContent = C.heroTitle || "Des pièces coupées à vos mesures";
    var hx = $("[data-hero-text]");
    if (hx) hx.textContent = C.heroText || "";
  }

  /* ------------------------------------------------------------------ *
   *  CATALOGUE (GOOGLE SHEETS)
   * ------------------------------------------------------------------ */

  function header(label) {
    return String(label || "").trim().toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");
  }

  function parseGviz(text) {
    var json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
    if (json.status === "error") throw new Error("Feuille illisible");
    var cols = json.table.cols.map(function (c) { return header(c.label); });
    return (json.table.rows || []).map(function (row) {
      var p = {};
      (row.c || []).forEach(function (cell, i) {
        if (cols[i]) p[cols[i]] = cell && cell.v != null ? cell.v : "";
      });
      return p;
    });
  }

  function fetchProducts() {
    var url = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(C.sheetIdProduits) +
      "/gviz/tq?tqx=out:json&headers=1&sheet=" + encodeURIComponent(C.sheetNameProduits || "Produits");
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(parseGviz)
      .then(function (rows) {
        return rows.map(function (p) {
          var main = String(p.image_url || "").trim();
          return {
            id: String(p.id == null ? "" : p.id).trim(),
            nom: capFirst(String(p.nom == null ? "" : p.nom).trim()),
            prix: hasPrice(p.prix) ? Number(p.prix) : 0,
            image: buildGallery(main, p.images)[0] || "",
            categorie: String(p.categorie == null ? "" : p.categorie).trim(),
            description: String(p.description || "").trim(),
            gallery: buildGallery(main, p.images),
            disponible: String(p.disponible || "").trim().toLowerCase(),
          };
        }).filter(function (p) { return p.id && p.nom && p.disponible === "oui"; });
      });
  }

  /* Photo principale + photos supplémentaires (colonne "images",
     liens séparés par des virgules, espaces ou retours à la ligne) */
  function buildGallery(main, extra) {
    var list = [main].concat(String(extra || "").split(/[\s,;]+/));
    var seen = {};
    return list.filter(function (u) {
      u = String(u || "").trim();
      if (!/^https?:\/\//.test(u) || seen[u]) return false;
      seen[u] = 1;
      return true;
    });
  }

  function capFirst(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

  function findProduct(id) {
    for (var i = 0; i < state.products.length; i++) if (state.products[i].id === id) return state.products[i];
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  CARTES ET GRILLES
   * ------------------------------------------------------------------ */

  function isFav(id) { return state.fav.indexOf(id) !== -1; }

  function cardHtml(p) {
    var media = p.image
      ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
      : "";
    var n = p.gallery.length;
    if (n > 1) {
      var dots = "";
      for (var d = 0; d < Math.min(n, 5); d++) dots += "<i" + (d === 0 ? ' class="is-on"' : "") + "></i>";
      media += '<span class="card__views" aria-hidden="true">' + dots + "</span>";
    }
    return (
      '<article class="card">' +
        '<button type="button" class="card__media' + (p.image ? "" : " card__media--empty") +
          '" data-open="' + esc(p.id) + '" aria-label="Voir ' + esc(p.nom) + (n > 1 ? " (" + n + " photos)" : "") + '">' + media + "</button>" +
        '<button type="button" class="heart" data-fav="' + esc(p.id) + '" aria-pressed="' + isFav(p.id) +
          '" aria-label="Ajouter ' + esc(p.nom) + ' aux favoris">' + ICON.heart + "</button>" +
        '<div class="card__info">' +
          "<div>" +
            '<h3 class="card__name">' + esc(p.nom) + "</h3>" +
            priceHtml(p.prix, "card__price") +
          "</div>" +
          '<button type="button" class="add" data-add="' + esc(p.id) + '" aria-label="Ajouter ' + esc(p.nom) +
            ' au panier">' + ICON.plus + "</button>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="skeleton"></div>';
    return s;
  }

  function categories() {
    var seen = {}, out = [];
    state.products.forEach(function (p) {
      if (p.categorie && !seen[p.categorie]) { seen[p.categorie] = 1; out.push(p.categorie); }
    });
    return out;
  }

  function renderPills() {
    var nav = $(".pills");
    var cats = categories();
    if (cats.length < 2) { nav.innerHTML = ""; return; }
    nav.innerHTML = ["Tout"].concat(cats).map(function (c) {
      return '<button type="button" class="pill" data-cat="' + esc(c) + '" aria-pressed="' + (c === state.category) + '">' +
        esc(c) + "</button>";
    }).join("");
  }

  function renderCatalogue() {
    var grid = $('[data-grid="catalogue"]');
    if (state.failed) {
      grid.innerHTML = '<div class="empty"><p>La collection ne s\'est pas chargée. Vérifiez votre connexion puis réessayez.</p>' +
        '<button type="button" class="btn btn--line" data-retry>Réessayer</button></div>';
      return;
    }
    if (!state.loaded) { grid.innerHTML = skeletons(6); return; }
    var list = state.products.filter(function (p) {
      return state.category === "Tout" || p.categorie === state.category;
    });
    grid.innerHTML = list.length
      ? list.map(cardHtml).join("")
      : '<div class="empty"><p>Aucun modèle dans cette catégorie pour le moment.</p></div>';
  }

  function renderFavoris() {
    var grid = $('[data-grid="favoris"]');
    if (!state.loaded) { grid.innerHTML = state.failed ? "" : skeletons(2); return; }
    var list = state.products.filter(function (p) { return isFav(p.id); });
    grid.innerHTML = list.length
      ? list.map(cardHtml).join("")
      : '<div class="empty"><p>Touchez le cœur d\'un modèle pour le retrouver ici.</p>' +
        '<a class="btn btn--line" href="#" data-nav="accueil">Voir la collection</a></div>';
  }

  /* ------------------------------------------------------------------ *
   *  FAVORIS
   * ------------------------------------------------------------------ */

  function toggleFav(id) {
    var p = findProduct(id);
    if (isFav(id)) {
      state.fav = state.fav.filter(function (f) { return f !== id; });
    } else {
      state.fav.push(id);
      if (p) toast(p.nom + " ajouté aux favoris");
    }
    save(KEYS.fav, state.fav);
    $$('[data-fav="' + cssEsc(id) + '"]').forEach(function (b) { b.setAttribute("aria-pressed", String(isFav(id))); });
    updateBadges();
    if (state.view === "favoris") renderFavoris();
  }

  function cssEsc(v) { return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/"/g, '\\"'); }

  /* ------------------------------------------------------------------ *
   *  PANIER
   * ------------------------------------------------------------------ */

  function cartCount() { return state.cart.reduce(function (t, i) { return t + i.quantite; }, 0); }
  function cartTotal() { return state.cart.reduce(function (t, i) { return t + i.quantite * (Number(i.prix) || 0); }, 0); }
  function cartHasAsk() { return state.cart.some(function (i) { return !hasPrice(i.prix); }); }

  function totalText() {
    var t = cartTotal();
    if (!cartHasAsk()) return money(t);
    return t === 0 ? "Sur devis" : money(t) + " + sur devis";
  }

  function setCart(cart) {
    state.cart = cart;
    save(KEYS.cart, cart);
    updateBadges();
    if (state.view === "panier") renderCart();
  }

  function addToCart(id, btn) {
    var p = findProduct(id);
    if (!p) return;
    var cart = state.cart.slice();
    var line = cart.filter(function (i) { return i.id === id; })[0];
    if (line) line.quantite += 1;
    else cart.push({ id: p.id, nom: p.nom, prix: p.prix, image: p.image, quantite: 1 });
    setCart(cart);
    bump("panier");
    toast(p.nom + " ajouté au panier");
    if (btn && btn.classList.contains("add")) {
      btn.classList.add("is-done");
      btn.innerHTML = ICON.check;
      setTimeout(function () { btn.classList.remove("is-done"); btn.innerHTML = ICON.plus; }, 1200);
    }
    track("AddToCart", { content_ids: [p.id], content_name: p.nom, value: p.prix, currency: "XAF" });
  }

  function changeQty(id, delta) {
    var cart = state.cart.map(function (i) {
      return i.id === id ? { id: i.id, nom: i.nom, prix: i.prix, image: i.image, quantite: i.quantite + delta } : i;
    }).filter(function (i) { return i.quantite > 0; });
    setCart(cart);
  }

  function lineHtml(i) {
    return (
      '<li class="line">' +
        (i.image ? '<img class="line__img" src="' + esc(i.image) + '" alt="" referrerpolicy="no-referrer">' : '<span class="line__img"></span>') +
        "<div>" +
          '<p class="line__name">' + esc(i.nom) + "</p>" +
          '<p class="line__price">' + priceText(i.prix) + "</p>" +
          '<div class="stepper">' +
            '<button type="button" data-qty="-1" data-id="' + esc(i.id) + '" aria-label="Retirer un exemplaire de ' + esc(i.nom) + '">−</button>' +
            "<output>" + i.quantite + "</output>" +
            '<button type="button" data-qty="1" data-id="' + esc(i.id) + '" aria-label="Ajouter un exemplaire de ' + esc(i.nom) + '">+</button>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="line__remove" data-remove="' + esc(i.id) + '" aria-label="Retirer ' + esc(i.nom) + ' du panier">' + ICON.close + "</button>" +
      "</li>"
    );
  }

  function renderCart() {
    var box = $(".cart");

    if (state.lastWaUrl) {
      box.className = "cart";
      box.innerHTML =
        '<div class="done">' +
          "<h2>Votre commande est prête</h2>" +
          "<p>WhatsApp s'est ouvert avec votre sélection. Envoyez le message : la boutique vous répond pour vous guider, des mensurations à l'acompte.</p>" +
          '<a class="btn btn--wine btn--block" href="' + esc(state.lastWaUrl) + '" target="_blank" rel="noopener">' + ICON.wa + "Rouvrir WhatsApp</a>" +
          '<a class="btn btn--line btn--block" href="#" data-nav="accueil" data-reset-done>Retour à la collection</a>' +
        "</div>";
      return;
    }

    if (!state.cart.length) {
      box.className = "cart";
      box.innerHTML = '<div class="empty"><p>Votre panier est vide. Ajoutez un modèle avec le bouton + de sa carte.</p>' +
        '<a class="btn btn--line" href="#" data-nav="accueil">Voir la collection</a></div>';
      return;
    }

    var prev = readForm();
    box.className = "cart cart--filled";
    box.innerHTML =
      "<div>" +
        '<ul class="lines">' + state.cart.map(lineHtml).join("") + "</ul>" +
        '<div class="summary"><span>Total</span><span>' + totalText() + "</span></div>" +
        (cartHasAsk() ? '<p class="summary__note">Le prix des modèles « sur demande » vous sera confirmé sur WhatsApp.</p>' : "") +
      "</div>" +
      '<form class="checkout" novalidate>' +
        "<h2>Vos coordonnées</h2>" +
        '<p class="checkout__intro">La boutique vous recontacte sur WhatsApp pour les mensurations et l\'acompte.</p>' +
        '<div class="field"><label for="f-nom">Nom et prénom</label>' +
          '<input id="f-nom" name="nom" autocomplete="name" required></div>' +
        '<div class="field"><label for="f-tel">Téléphone WhatsApp</label>' +
          '<input id="f-tel" name="telephone" type="tel" inputmode="tel" autocomplete="tel" placeholder="6XX XX XX XX" required></div>' +
        '<div class="field"><label for="f-mail">Email (facultatif)</label>' +
          '<input id="f-mail" name="email" type="email" autocomplete="email"></div>' +
        '<label class="check"><input type="checkbox" name="consentement" required>' +
          "<span>J'accepte que la boutique enregistre ces informations et me recontacte sur WhatsApp au sujet de ma sélection.</span></label>" +
        '<label class="check"><input type="checkbox" name="marketing">' +
          "<span>J'accepte de recevoir les nouveautés et offres de la boutique (facultatif).</span></label>" +
        '<p class="form-error" role="alert" hidden></p>' +
        '<button type="submit" class="btn btn--wine btn--block">' + ICON.wa + "Commander sur WhatsApp</button>" +
      "</form>";

    restoreForm(prev);
    scheduleLead();
  }

  /* Les champs déjà remplis survivent à un changement de quantité */
  function readForm() {
    var f = $(".checkout");
    if (!f) return null;
    var e = f.elements;
    return {
      nom: e.namedItem("nom").value, telephone: e.namedItem("telephone").value, email: e.namedItem("email").value,
      consentement: e.namedItem("consentement").checked, marketing: e.namedItem("marketing").checked,
    };
  }

  function restoreForm(v) {
    if (!v) return;
    var e = $(".checkout").elements;
    e.namedItem("nom").value = v.nom;
    e.namedItem("telephone").value = v.telephone;
    e.namedItem("email").value = v.email;
    e.namedItem("consentement").checked = v.consentement;
    e.namedItem("marketing").checked = v.marketing;
  }

  /* ------------------------------------------------------------------ *
   *  COMMANDE
   * ------------------------------------------------------------------ */

  function validPhone(v) {
    var d = String(v).replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15;
  }

  function lineText(i) { return i.nom + " — " + i.quantite + " x " + priceText(i.prix); }

  /* Message écrit comme une cliente : présentation, sélection, question ouverte.
     Les étapes (mensurations, acompte) sont expliquées par la boutique dans sa réponse. */
  function waMessage(form) {
    var hello = (C.whatsappHello || "Bonjour, je m'appelle {nom}.").replace("{nom}", form.nom);
    var question = cartHasAsk()
      ? (C.whatsappQuestionAsk || "Pouvez-vous m'indiquer le prix des modèles sur demande et m'expliquer comment procéder pour la commande ?")
      : (C.whatsappQuestion || "Comment procède-t-on pour la commande ?");
    return [hello, C.whatsappIntro || "Ces modèles m'intéressent :", ""]
      .concat(state.cart.map(function (i) { return "• " + lineText(i); }))
      .concat(["", "Total : " + totalText(), "", question])
      .join("\n");
  }

  /* Identifiant de la demande : la même ligne de la feuille Commandes est mise à jour
     quand la cliente passe de "prospect" à "commande envoyée" */
  function leadId() {
    var id = rawGet(KEYS.lead);
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      rawSet(KEYS.lead, id);
    }
    return id;
  }

  /* Enregistrement du prospect : uniquement quand nom + téléphone sont valides
     ET que la case d'accord est cochée. Rien n'est envoyé avant cet accord. */
  var lastLeadSig = "";
  var leadTimer;
  function scheduleLead() {
    clearTimeout(leadTimer);
    leadTimer = setTimeout(function () {
      var form = readForm();
      if (!form) return;
      /* accord retiré après enregistrement : on demande la suppression du prospect */
      if (!form.consentement && lastLeadSig) {
        lastLeadSig = "";
        sendOrder({ nom: "", telephone: "", email: "", marketing: false }, "retrait");
        return;
      }
      if (!form.consentement || !form.nom.trim() || !validPhone(form.telephone) || !state.cart.length) return;
      var clean = {
        nom: form.nom.trim(), telephone: form.telephone.trim(), email: form.email.trim(),
        marketing: form.marketing,
      };
      var sig = JSON.stringify([clean, state.cart]);
      if (sig === lastLeadSig) return;
      lastLeadSig = sig;
      sendOrder(clean, "prospect");
    }, 1200);
  }

  function sendOrder(form, statut) {
    var url = C.ordersWebhookUrl;
    if (!url || url.indexOf("COLLEZ_ICI") === 0) return;
    var body = JSON.stringify({
      secret: C.ordersSecret,
      id: leadId(),
      statut: statut || "commande",
      nom: form.nom,
      telephone: form.telephone,
      email: form.email || "",
      detailCommande: state.cart.map(lineText).join(" | "),
      total: cartHasAsk() ? totalText() : cartTotal(),
      consentementMarketing: form.marketing ? "oui" : "non",
      source: currentSource(),
    });
    /* sendBeacon survit au passage vers WhatsApp sur mobile ; fetch en secours */
    var sent = false;
    try {
      sent = !!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=utf-8" })));
    } catch (e) { sent = false; }
    if (!sent) {
      fetch(url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body })
        .catch(function () { /* jamais bloquant : la commande part par WhatsApp */ });
    }
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var f = ev.target;
    var e = f.elements;
    var err = $(".form-error", f);
    var form = {
      nom: e.namedItem("nom").value.trim(),
      telephone: e.namedItem("telephone").value.trim(),
      email: e.namedItem("email").value.trim(),
      consentement: e.namedItem("consentement").checked,
      marketing: e.namedItem("marketing").checked,
    };

    $$("input", f).forEach(function (i) { i.removeAttribute("aria-invalid"); });

    function fail(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
    }

    if (!form.nom) return fail("Indiquez votre nom pour continuer.", e.namedItem("nom"));
    if (!validPhone(form.telephone)) return fail("Indiquez un numéro de téléphone valide, par exemple 6XX XX XX XX.", e.namedItem("telephone"));
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return fail("Cette adresse email n'est pas valide. Corrigez-la ou laissez le champ vide.", e.namedItem("email"));
    if (!form.consentement) return fail("Cochez la première case pour que la boutique puisse traiter votre commande.", e.namedItem("consentement"));
    if (!state.cart.length) return fail("Votre panier est vide.");

    var total = cartTotal();
    track("InitiateCheckout", { value: total, currency: "XAF", num_items: cartCount() });
    clearTimeout(leadTimer);
    sendOrder(form, "commande");
    rawSet(KEYS.lead, "");          /* prochaine sélection = nouvelle ligne */
    lastLeadSig = "";

    var waUrl = "https://wa.me/" + C.whatsappNumber + "?text=" + encodeURIComponent(waMessage(form));
    track("Lead", { value: total, currency: "XAF" });

    state.lastWaUrl = waUrl;
    setCart([]);
    renderCart();
    window.scrollTo(0, 0);

    var tab = window.open(waUrl, "_blank");
    if (!tab) window.location.href = waUrl;
  }

  /* ------------------------------------------------------------------ *
   *  FICHE PRODUIT
   * ------------------------------------------------------------------ */

  var lastFocus = null;

  function openSheet(name) {
    lastFocus = document.activeElement;
    var s = $('[data-sheet="' + name + '"]');
    s.hidden = false;
    document.body.classList.add("is-locked");
    var close = $(".sheet__close", s);
    if (close) close.focus();
  }

  function closeSheets() {
    closeZoom();
    $$(".sheet").forEach(function (s) { s.hidden = true; });
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function galleryHtml(p, zoom) {
    var g = p.gallery;
    if (!g.length) return "";
    var slides = g.map(function (u, i) {
      return '<button type="button" class="gallery__slide"' + (zoom ? "" : ' data-zoom="' + esc(p.id) + '" data-index="' + i + '"') +
        ' aria-label="' + (zoom ? "Photo " : "Agrandir la photo ") + (i + 1) + " sur " + g.length + '">' +
        '<img src="' + esc(u) + '" alt="' + esc(p.nom) + (g.length > 1 ? ", vue " + (i + 1) : "") + '"' +
        (i > 0 ? ' loading="lazy"' : "") + ' referrerpolicy="no-referrer"></button>';
    }).join("");
    var extra = "";
    if (g.length > 1) {
      var dots = g.map(function (u, i) { return "<i" + (i === 0 ? ' class="is-on"' : "") + "></i>"; }).join("");
      extra =
        '<button type="button" class="gallery__nav gallery__nav--prev" data-gal="-1" aria-label="Photo précédente">' + ICON.chevron + "</button>" +
        '<button type="button" class="gallery__nav gallery__nav--next" data-gal="1" aria-label="Photo suivante">' + ICON.chevron + "</button>" +
        '<span class="gallery__dots" aria-hidden="true">' + dots + "</span>";
    }
    return '<div class="gallery' + (zoom ? " gallery--zoom" : "") + '"><div class="gallery__track">' + slides + "</div>" + extra + "</div>";
  }

  function galleryStep(btn, dir) {
    var track = btn.closest(".gallery").querySelector(".gallery__track");
    track.scrollBy({ left: dir * track.clientWidth, behavior: "smooth" });
  }

  function syncDots(track) {
    var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    var dots = track.parentNode.querySelectorAll(".gallery__dots i");
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle("is-on", k === i);
    var prev = track.parentNode.querySelector(".gallery__nav--prev");
    var next = track.parentNode.querySelector(".gallery__nav--next");
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= dots.length - 1;
  }

  function openZoom(id, index) {
    var p = findProduct(id);
    if (!p) return;
    closeZoom();
    var z = document.createElement("div");
    z.className = "zoom";
    z.setAttribute("role", "dialog");
    z.setAttribute("aria-modal", "true");
    z.setAttribute("aria-label", p.nom + ", photos en plein écran");
    z.innerHTML = galleryHtml(p, true) +
      '<button type="button" class="zoom__close" data-close-zoom aria-label="Fermer le plein écran">' + ICON.close + "</button>";
    document.body.appendChild(z);
    var track = z.querySelector(".gallery__track");
    track.scrollLeft = index * track.clientWidth;
    syncDots(track);
    z.querySelector(".zoom__close").focus();
  }

  function closeZoom() {
    var z = $(".zoom");
    if (z) z.remove();
  }

  function openProduct(id) {
    var p = findProduct(id);
    if (!p) return;
    $('[data-sheet="produit"] .sheet__body').innerHTML =
      '<div class="detail">' +
        '<div class="detail__media">' + galleryHtml(p, false) + "</div>" +
        '<div class="detail__body">' +
          (p.categorie ? '<p class="detail__cat">' + esc(p.categorie) + "</p>" : "") +
          '<h2 class="detail__name" id="sheet-title">' + esc(p.nom) + "</h2>" +
          priceHtml(p.prix, "detail__price") +
          '<p class="detail__text">' + (p.description ? esc(p.description) + " " : "") +
            "Confectionné à vos mesures après validation sur WhatsApp. Un acompte lance la confection.</p>" +
          '<div class="detail__actions">' +
            '<button type="button" class="btn btn--wine" data-add="' + esc(p.id) + '">Ajouter au panier</button>' +
            '<button type="button" class="heart" data-fav="' + esc(p.id) + '" aria-pressed="' + isFav(p.id) +
              '" aria-label="Ajouter ' + esc(p.nom) + ' aux favoris">' + ICON.heart + "</button>" +
          "</div>" +
        "</div>" +
      "</div>";
    openSheet("produit");
    var t = $('[data-sheet="produit"] .gallery__track');
    if (t) syncDots(t);
  }

  /* ------------------------------------------------------------------ *
   *  NAVIGATION (ACCUEIL / FAVORIS / PANIER)
   * ------------------------------------------------------------------ */

  function viewFromHash() {
    var h = (location.hash || "").replace("#", "");
    return h === "favoris" || h === "panier" ? h : "accueil";
  }

  function renderView() {
    if (state.view === "favoris") renderFavoris();
    if (state.view === "panier") renderCart();
    if (state.view === "accueil") renderCatalogue();
  }

  function show(view) {
    state.view = view;
    $$(".view").forEach(function (v) {
      var on = v.getAttribute("data-view") === view;
      v.hidden = !on;
      v.classList.toggle("is-active", on);
    });
    $(".dock").setAttribute("data-active", view);
    $$(".dock__item").forEach(function (a) {
      var on = a.getAttribute("data-nav") === view;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    renderView();
    window.scrollTo(0, 0);
  }

  function go(view) {
    var hash = view === "accueil" ? "" : "#" + view;
    if (location.hash !== hash) history.pushState(null, "", hash || location.pathname + location.search);
    show(view);
  }

  /* ------------------------------------------------------------------ *
   *  BADGES ET TOAST
   * ------------------------------------------------------------------ */

  function updateBadges() {
    var c = cartCount();
    var b = $('[data-badge="panier"]');
    b.textContent = c > 99 ? "99+" : String(c);
    b.hidden = c === 0;
    var f = state.fav.length;
    var fb = $('[data-badge="favoris"]');
    fb.textContent = String(f);
    fb.hidden = f === 0;
  }

  function bump(name) {
    var b = $('[data-badge="' + name + '"]');
    b.classList.remove("is-bump");
    void b.offsetWidth;
    b.classList.add("is-bump");
  }

  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }

  /* ------------------------------------------------------------------ *
   *  PIXEL META + CONSENTEMENT (révocable)
   * ------------------------------------------------------------------ */

  function loadPixel() {
    if (!C.metaPixelId || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", C.metaPixelId);
    window.fbq("track", "PageView");
  }

  function track(name, params) {
    if (rawGet(KEYS.consent) !== "oui" || !window.fbq) return;
    window.fbq("track", name, params || {});
  }

  function showConsent() {
    if ($(".consent")) return;
    var el = document.createElement("div");
    el.className = "consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Mesure d'audience");
    el.innerHTML =
      "<p>Nous mesurons l'audience pour mieux vous présenter nos collections. Vous pouvez accepter ou refuser, et changer d'avis à tout moment en bas de page.</p>" +
      '<div class="consent__actions">' +
        '<button type="button" class="btn btn--line" data-consent="non">Refuser</button>' +
        '<button type="button" class="btn btn--wine" data-consent="oui">Accepter</button>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-consent]");
      if (!b) return;
      var choice = b.getAttribute("data-consent");
      var had = !!window.fbq;
      rawSet(KEYS.consent, choice);
      el.remove();
      if (choice === "oui") loadPixel();
      else if (had) location.reload();
    });
  }

  function initConsent() {
    if (!C.metaPixelId) return;
    var manage = $("[data-bq-consent-manage]");
    if (manage) manage.hidden = false;
    var v = rawGet(KEYS.consent);
    if (v === "oui") loadPixel();
    else if (!v) showConsent();
  }

  /* ------------------------------------------------------------------ *
   *  ÉVÉNEMENTS
   * ------------------------------------------------------------------ */

  function bind() {
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      var el;

      if ((el = t.closest("[data-nav]"))) {
        ev.preventDefault();
        if (el.hasAttribute("data-reset-done")) state.lastWaUrl = "";
        closeSheets();
        go(el.getAttribute("data-nav"));
        return;
      }
      if ((el = t.closest("[data-fav]"))) { toggleFav(el.getAttribute("data-fav")); return; }
      if ((el = t.closest("[data-add]"))) { addToCart(el.getAttribute("data-add"), el); return; }
      if ((el = t.closest("[data-gal]"))) { galleryStep(el, Number(el.getAttribute("data-gal"))); return; }
      if (t.closest("[data-close-zoom]")) { closeZoom(); return; }
      if ((el = t.closest("[data-zoom]"))) { openZoom(el.getAttribute("data-zoom"), Number(el.getAttribute("data-index"))); return; }
      if ((el = t.closest("[data-open]"))) { openProduct(el.getAttribute("data-open")); return; }
      if ((el = t.closest("[data-cat]"))) {
        state.category = el.getAttribute("data-cat");
        renderPills();
        renderCatalogue();
        return;
      }
      if ((el = t.closest("[data-qty]"))) { changeQty(el.getAttribute("data-id"), Number(el.getAttribute("data-qty"))); return; }
      if ((el = t.closest("[data-remove]"))) { changeQty(el.getAttribute("data-remove"), -Infinity); return; }
      if (t.closest("[data-close-sheet]")) { closeSheets(); return; }
      if (t.closest("[data-open-privacy]")) { openSheet("privacy"); return; }
      if (t.closest("[data-bq-consent-manage]")) { showConsent(); return; }
      if (t.closest("[data-retry]")) { start(); return; }
    });

    /* prospect : suivi des saisies dans le formulaire du panier */
    ["input", "change"].forEach(function (type) {
      document.addEventListener(type, function (ev) {
        if (ev.target.closest && ev.target.closest(".checkout")) scheduleLead();
      });
    });

    document.addEventListener("submit", function (ev) {
      if (ev.target.classList.contains("checkout")) onSubmit(ev);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { if ($(".zoom")) closeZoom(); else closeSheets(); }
      if ((ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        var tr = $(".zoom .gallery__track") || (!$('[data-sheet="produit"]').hidden && $('[data-sheet="produit"] .gallery__track'));
        if (tr) tr.scrollBy({ left: (ev.key === "ArrowLeft" ? -1 : 1) * tr.clientWidth, behavior: "smooth" });
      }
    });

    /* points de la galerie synchronisés avec le défilement */
    var scrollTimer;
    document.addEventListener("scroll", function (ev) {
      var tr = ev.target;
      if (!tr.classList || !tr.classList.contains("gallery__track")) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { syncDots(tr); }, 60);
    }, true);

    window.addEventListener("popstate", function () { closeSheets(); show(viewFromHash()); });
    window.addEventListener("hashchange", function () { if (viewFromHash() !== state.view) show(viewFromHash()); });

    /* panier modifié dans un autre onglet */
    window.addEventListener("storage", function (ev) {
      if (ev.key === KEYS.cart) { state.cart = load(KEYS.cart, []); updateBadges(); if (state.view === "panier") renderCart(); }
      if (ev.key === KEYS.fav) { state.fav = load(KEYS.fav, []); updateBadges(); }
    });
  }

  /* ------------------------------------------------------------------ *
   *  DÉMARRAGE
   * ------------------------------------------------------------------ */

  function sanitizeStored() {
    if (!Array.isArray(state.cart)) state.cart = [];
    state.cart = state.cart.filter(function (i) { return i && i.id != null && i.quantite > 0; }).map(function (i) {
      return { id: String(i.id), nom: String(i.nom || ""), prix: hasPrice(i.prix) ? Number(i.prix) : 0, image: String(i.image || ""), quantite: Math.max(1, parseInt(i.quantite, 10) || 1) };
    });
    if (!Array.isArray(state.fav)) state.fav = [];
    state.fav = state.fav.map(String);
  }

  function start() {
    state.failed = false;
    state.loaded = false;
    renderCatalogue();
    fetchProducts().then(function (products) {
      state.products = products;
      state.loaded = true;
      /* prix et photos du panier mis à jour depuis la feuille */
      state.cart = state.cart.map(function (i) {
        var p = findProduct(i.id);
        return p ? { id: i.id, nom: p.nom, prix: p.prix, image: p.image, quantite: i.quantite } : i;
      });
      save(KEYS.cart, state.cart);
      renderPills();
      updateBadges();
      renderView();
    }).catch(function () {
      state.failed = true;
      renderCatalogue();
    });
  }

  function init() {
    sanitizeStored();
    applyIdentity();
    bind();
    updateBadges();
    show(viewFromHash());
    start();
    initConsent();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
