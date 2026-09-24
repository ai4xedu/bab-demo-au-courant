// ZAW'IA — le jeu · LA SAFQA (الصفقة) : une affaire entre deux membres, et la smsra de la zawia.
//
// v5.7 — « les joueurs se rencontrent au Souk et font des affaires ; la zawia
// prend 5 % » (Youssef, 19/09/2026). Ce module est PUR : il dit ce qu'est une
// affaire, ce que chacun peut en faire, et ce qui revient à la maison. La
// BASE tient le registre (scripts/sql/zawia-safqa.sql) : elle seule écrit une
// affaire, et elle rejoue exactement les mêmes transitions — un test compare
// les constantes des deux fichiers.
//
// CE QU'EST UNE AFFAIRE. Devant l'étal d'un autre, l'acheteur PROPOSE un prix
// pour un produit (en dirhams, avec un mot). Le vendeur ACCEPTE ou REFUSE.
// Une fois acceptée, chacun dit sa part : l'acheteur « j'ai réglé », le
// vendeur « j'ai livré ». Quand les deux l'ont dit, l'affaire est CONCLUE — et
// la smsra est due. Le paiement lui-même se fait entre eux, comme ils veulent :
// le jeu ne tient pas d'argent, il tient la PAROLE des deux (l'amin du Souk).
//
// LA SMSRA (السمسرة — la part du courtier). SMSRA_PCT pour cent du prix, pris
// sur chaque affaire conclue, versés à la maison par le vendeur ; le bureau
// note la smsra reçue depuis la console. Le taux est FIGÉ dans l'affaire au
// moment où elle est proposée : changer la règle demain ne change pas les
// affaires d'hier. Le calcul se fait en centimes entiers — ni flottant qui
// dérive, ni arrondi qui diffère de celui de la base.
//
// ⚠️ La charte vaut : une affaire ne donne JAMAIS un point (M39ol, Sna3a,
//    Dhakira). Elle verse une goutte à la fontaine (geste « souk »), c'est tout.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.safqa = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ⚠️ Les MÊMES chiffres que zawia-safqa.sql (un test compare).
  var SMSRA_PCT = 5;            // la part de la zawia, en pour cent
  var PRIX_MIN = 1;             // dirhams
  var PRIX_MAX = 1000000;       // dirhams — au-delà, ce n'est plus une affaire de Souk
  var MOT_MAX = 200;            // le mot qui accompagne une proposition ou une réponse
  var OUVERTES_MAX = 10;        // affaires en cours (proposées ou acceptées) par acheteur
  var PAR_JOUR_MAX = 30;        // propositions par acheteur et par jour — un frein, pas une règle du jeu
  var DEVISE = "MAD";

  var ETATS = ["proposee", "acceptee", "conclue", "refusee", "annulee"];
  var TERMINAUX = ["conclue", "refusee", "annulee"];

  // ---- Les dirhams ------------------------------------------------------------------------------
  // « 1 200,50 » ou « 1200.5 » → 1200.5 ; deux décimales au plus ; entre les bornes.
  function validerPrix(v) {
    var s = String(v == null ? "" : v).trim().replace(/\s| /g, "").replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return { ok: false, texte: "Un prix s'écrit en dirhams, avec deux décimales au plus." };
    var prix = Math.round(parseFloat(s) * 100) / 100;
    if (prix < PRIX_MIN) return { ok: false, texte: "Un prix vaut au moins " + PRIX_MIN + " dirham." };
    if (prix > PRIX_MAX) return { ok: false, texte: "Un prix ne dépasse pas " + dirhams(PRIX_MAX) + " ici." };
    return { ok: true, prix: prix };
  }
  // Le partage d'un prix, en centimes entiers : la smsra arrondie au centime le
  // plus proche (comme round(x, 2) de Postgres pour un montant positif), le
  // vendeur garde le reste — les deux font toujours le prix.
  function partage(prix, pct) {
    var p = pct === undefined || pct === null ? SMSRA_PCT : Number(pct);
    var centimes = Math.round(Number(prix) * 100);
    if (!isFinite(centimes) || centimes < 0) centimes = 0;
    var smsra = Math.round(centimes * p / 100);
    return { prix: centimes / 100, smsra: smsra / 100, net: (centimes - smsra) / 100, pct: p };
  }
  // « 1 250 MAD », « 62,50 MAD » — les chiffres 0-9, l'espace des milliers, la virgule française.
  function dirhams(n) {
    var v = Math.round(Number(n) * 100) / 100;
    if (!isFinite(v)) v = 0;
    var entier = Math.floor(v), dec = Math.round((v - entier) * 100);
    var e = String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (dec ? e + "," + (dec < 10 ? "0" : "") + dec : e) + " " + DEVISE;
  }
  function nettoyerMot(m) { return String(m == null ? "" : m).replace(/[\x00-\x1f\x7f]/g, "").replace(/\s+/g, " ").trim().slice(0, MOT_MAX); }

  // ---- Une affaire ----------------------------------------------------------------------------------
  // Telle qu'on la tient (la base la rend dans cette forme, le mode atelier aussi) :
  // { id, vendeur, acheteur, vendeurPseudo, acheteurPseudo, produit, produitNom,
  //   prix, pct, smsra, net, etat, mot, reponse, reglee, livree, creee, maj, conclue, smsraRecue }
  function normaliser(a) {
    a = a && typeof a === "object" ? a : {};
    var pct = isFinite(Number(a.pct)) ? Number(a.pct) : SMSRA_PCT;
    var part = partage(a.prix, pct);
    var etat = ETATS.indexOf(a.etat) >= 0 ? a.etat : "proposee";
    return {
      id: a.id == null ? null : String(a.id),
      vendeur: String(a.vendeur || ""), acheteur: String(a.acheteur || ""),
      vendeurPseudo: nettoyerMot(a.vendeurPseudo).slice(0, 40) || "Un Talib", acheteurPseudo: nettoyerMot(a.acheteurPseudo).slice(0, 40) || "Un Talib",
      produit: a.produit == null ? null : String(a.produit), produitNom: nettoyerMot(a.produitNom).slice(0, 48) || "Un produit",
      prix: part.prix, pct: pct, smsra: part.smsra, net: part.net,
      etat: etat, mot: nettoyerMot(a.mot), reponse: nettoyerMot(a.reponse),
      reglee: a.reglee || null, livree: a.livree || null,
      creee: a.creee || null, maj: a.maj || null, conclue: a.conclue || null, smsraRecue: a.smsraRecue || null
    };
  }
  function role(a, moi) {
    if (!a || !moi) return null;
    if (a.vendeur === moi) return "vendeur";
    if (a.acheteur === moi) return "acheteur";
    return null;
  }
  function terminee(a) { return TERMINAUX.indexOf(a && a.etat) >= 0; }

  // Ce que chacun peut faire, selon l'état — la MÊME table que zawia_safqa_agir.
  //   vendeur  : accepter · refuser (proposée) ; livrer (acceptée, pas encore livrée) ; annuler (acceptée, rien de dit)
  //   acheteur : annuler (proposée ; acceptée, rien de dit) ; regler (acceptée, pas encore réglée)
  var LIBELLES = { accepter: "Accepter", refuser: "Refuser", regler: "J'ai réglé", livrer: "J'ai livré", annuler: "Annuler" };
  function actions(a, moi) {
    var r = role(a, moi);
    if (!r || !a || terminee(a)) return [];
    var out = [];
    if (a.etat === "proposee") {
      if (r === "vendeur") out.push("accepter", "refuser");
      else out.push("annuler");
    } else if (a.etat === "acceptee") {
      if (r === "acheteur" && !a.reglee) out.push("regler");
      if (r === "vendeur" && !a.livree) out.push("livrer");
      if (!a.reglee && !a.livree) out.push("annuler");
    }
    return out.map(function (c) { return { cle: c, libelle: LIBELLES[c] }; });
  }
  // Applique une action. Rend { ok, affaire } ou { ok: false, texte }. `maintenant` : ISO.
  function transition(a, action, moi, maintenant) {
    var permis = actions(a, moi).some(function (x) { return x.cle === action; });
    if (!permis) return { ok: false, texte: "Cette affaire ne se prête pas à ça, ou ce n'est pas à toi de le dire." };
    var b = normaliser(a), t = maintenant || null;
    if (action === "accepter") b.etat = "acceptee";
    else if (action === "refuser") b.etat = "refusee";
    else if (action === "annuler") b.etat = "annulee";
    else if (action === "regler") b.reglee = t;
    else if (action === "livrer") b.livree = t;
    if (b.reglee && b.livree) { b.etat = "conclue"; b.conclue = t; }
    b.maj = t;
    return { ok: true, affaire: b };
  }

  // ---- Ce qu'on en dit ---------------------------------------------------------------------------------
  function libelleEtat(a) {
    if (!a) return "";
    if (a.etat === "proposee") return "Proposée — attend la réponse du vendeur";
    if (a.etat === "acceptee") {
      if (a.reglee) return "Acceptée — réglée, reste à livrer";
      if (a.livree) return "Acceptée — livrée, reste à régler";
      return "Acceptée — à régler et à livrer";
    }
    if (a.etat === "conclue") return a.smsraRecue ? "Conclue — smsra reçue par la maison" : "Conclue";
    if (a.etat === "refusee") return "Refusée";
    return "Annulée";
  }
  // Une affaire attend-elle un geste de MOI ?
  function attendMoi(a, moi) {
    var r = role(a, moi);
    if (!r || terminee(a)) return false;
    if (a.etat === "proposee") return r === "vendeur";
    if (r === "acheteur") return !a.reglee;
    return !a.livree;
  }
  function aTraiter(liste, moi) { return (liste || []).filter(function (a) { return attendMoi(a, moi); }).length; }
  // Ce qu'un vendeur doit encore à la maison : la smsra des affaires conclues, pas encore notée reçue.
  function smsraDue(liste, moi) {
    var c = 0;
    (liste || []).forEach(function (a) { if (a.vendeur === moi && a.etat === "conclue" && !a.smsraRecue) c += Math.round(a.smsra * 100); });
    return c / 100;
  }
  // Le mot du dellal sur le partage : la phrase que l'écran montre sous le prix qu'on tape.
  function textePartage(prix) {
    var p = partage(prix);
    return "Sur " + dirhams(p.prix) + " : " + dirhams(p.smsra) + " pour la zawia (la smsra, " + SMSRA_PCT + " %), " + dirhams(p.net) + " pour le vendeur.";
  }
  function texteProposee(vendeurPseudo) {
    return "Proposé. " + (nettoyerMot(vendeurPseudo) || "Le vendeur") + " verra ton prix à son prochain passage au Souk, et te répondra ici.";
  }

  // Ce qu'on envoie à la base — revérifié par elle.
  function validerProposition(champs) {
    champs = champs || {};
    var v = validerPrix(champs.prix);
    if (!v.ok) return v;
    var vendeur = String(champs.vendeur || "");
    if (!vendeur) return { ok: false, texte: "Ce tapis n'est pas tenu dans le jeu : son marchand n'a pas encore ouvert son étal ici." };
    var produitNom = nettoyerMot(champs.produitNom).slice(0, 48);
    if (!produitNom) return { ok: false, texte: "Une affaire porte sur un produit du tapis." };
    return { ok: true, valeur: { vendeur: vendeur, produit: champs.produit == null ? null : String(champs.produit), produitNom: produitNom, prix: v.prix, mot: nettoyerMot(champs.mot) } };
  }

  return {
    SMSRA_PCT: SMSRA_PCT, PRIX_MIN: PRIX_MIN, PRIX_MAX: PRIX_MAX, MOT_MAX: MOT_MAX, OUVERTES_MAX: OUVERTES_MAX, PAR_JOUR_MAX: PAR_JOUR_MAX, DEVISE: DEVISE,
    ETATS: ETATS, TERMINAUX: TERMINAUX, LIBELLES: LIBELLES,
    validerPrix: validerPrix, partage: partage, dirhams: dirhams, nettoyerMot: nettoyerMot,
    normaliser: normaliser, role: role, terminee: terminee, actions: actions, transition: transition,
    libelleEtat: libelleEtat, attendMoi: attendMoi, aTraiter: aTraiter, smsraDue: smsraDue,
    textePartage: textePartage, texteProposee: texteProposee, validerProposition: validerProposition
  };
});
