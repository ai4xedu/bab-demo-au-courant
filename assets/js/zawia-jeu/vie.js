// Bab — le moteur · LA VIE DE LA MAISON (25/09/2026, premier client : Nareva, « Au Courant »).
//
// Trois fonctions que le département RH d'un client demande, et qui se marient au
// jeu sans en changer les règles (Youssef, 24/09/2026 : « le top 3 ») :
//
//   1. LE FIL DE LA MAISON — ce que la maison annonce : une mise en service, un
//      contrat, une nomination, « bienvenue à… ». La RH l'écrit dans la page de
//      paramétrage ; le jeu le montre au Dar et le signale en entrant. Une nouvelle
//      datée de demain attend son jour ; une nouvelle ciblée ne parle qu'à son site.
//   2. BAB DISCOVERY — le visiteur (le Dayf du moteur) devient un ÉTUDIANT de grande
//      école qui découvre la maison trois jours, sans compte. Au bout, trois portes :
//      je postule · recontactez-moi · je découvrais. La candidature ne part qu'avec
//      son accord explicite ; ce qu'il a fait pendant sa visite n'y est joint que s'il
//      le coche. La console RH lit l'entonnoir et les candidatures.
//   3. LA MÉMOIRE DES ANCIENS — un expert écrit une page de ce qu'il sait et
//      qu'aucune procédure ne dit. La RH la relit dans sa console et la publie ; elle
//      entre aux archives, et la question qui l'accompagne la « rallume » : c'est
//      l'histoire même du jeu (ce que savent ceux qui partent s'éteint avec eux).
//
// ⚠️ Aucun point, aucun classement. Le Fil ne se note pas ; une mémoire lue rallume une
//    lumière comme toute page de culture ; une candidature n'est jamais un score.
// ⚠️ Rien ne part tout seul : en démo tout vit dans le navigateur ; chez un client, ces
//    trois listes auront leurs tables dans SA base (jamais celle d'Ai4x ni de Zawia).
// ⚠️ Aucun champ typé adresse web ou courriel dans un formulaire qui s'envoie : il bloque
//    sans un mot (la leçon payée sur zawia.tech). Texte + contrôle ici, et `novalidate`.
//
// PUR (testé sous Node) : tout ce qui est au-dessus de « Au navigateur ». Le DOM
// (`demarrer`) ne tourne que dans la page du jeu d'une maison qui déclare `vie`.
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.vie = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  // ---- petits outils ------------------------------------------------------------------
  var RE_JOUR = /^\d{4}-\d{2}-\d{2}$/;
  function texte(v) { return v == null ? "" : String(v); }
  function net(v, max) { var t = texte(v).replace(/\s+/g, " ").trim(); return max ? t.slice(0, max) : t; }
  function paragraphe(v, max) {
    var t = texte(v).replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    return max ? t.slice(0, max) : t;
  }
  function estObjet(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function jourValide(j) {
    if (!RE_JOUR.test(texte(j))) return false;
    var d = new Date(texte(j) + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texte(j);
  }
  function jourDe(date) {
    var d = date instanceof Date ? date : new Date(date || Date.now());
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  function ecart(a, b) {   // b − a, en jours
    return Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);
  }
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function dateLisible(jour, aujourdhui) {
    if (!jourValide(jour)) return "";
    if (jourValide(aujourdhui)) {
      var e = ecart(jour, aujourdhui);
      if (e === 0) return "aujourd'hui";
      if (e === 1) return "hier";
      if (e === -1) return "demain";
    }
    var n = +jour.slice(8, 10);
    return "le " + (n === 1 ? "1er" : String(n)) + " " + MOIS[+jour.slice(5, 7) - 1] + (jourValide(aujourdhui) && jour.slice(0, 4) !== aujourdhui.slice(0, 4) ? " " + jour.slice(0, 4) : "");
  }
  function slug(t) {
    return texte(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
  }
  var RE_LIEN = /(https?:\/\/|www\.)\S+/i;

  // Les plafonds : les mêmes à l'écran, dans la console et dans la page de paramétrage.
  var LIMITES = {
    fil: { titre: 90, texte: 600 },
    memoire: { titre: 90, auteur: 60, metier: 60, site: 60, annees: 40, recit: [80, 1500], lecon: [20, 300], question: 220, option: 120, explication: 400, enAttente: 3 },
    candidature: { prenom: 40, nom: 60, email: 120, telephone: 20, filiere: 80, message: 400, anneeMin: 2024, anneeMax: 2032 },
    etonnement: { bien: [20, 800], surpris: [20, 800], idee: [0, 600], site: 60, jour: 30 },
    mot: [10, 280]
  };

  // ======================================================================================
  // 1. LE FIL DE LA MAISON
  // ======================================================================================
  // Une nouvelle : { cle, titre, texte, date (AAAA-MM-JJ), site ("" = toute la maison), epingle }.
  function normaliserNouvelle(n, i) {
    var o = estObjet(n) ? n : {};
    var ep = o.epingle;
    return {
      cle: net(o.cle, 60) || "fil-" + ((Number(i) || 0) + 1),
      titre: net(o.titre, LIMITES.fil.titre),
      texte: paragraphe(o.texte, LIMITES.fil.texte),
      date: jourValide(o.date) ? o.date : "",
      site: /^(maison|toute la maison|tous)$/i.test(net(o.site, 60)) ? "" : net(o.site, 60),   // « Toute la maison » : pas de site
      epingle: ep === true || ep === "oui" || ep === "1" || ep === 1
    };
  }
  // Ce que le jeu montre : les nouvelles datées d'aujourd'hui ou d'avant (une nouvelle
  // de demain attend son jour), celles de toute la maison et celles du site du joueur
  // (sans site connu, il les voit toutes). Les épinglées d'abord, puis la plus récente.
  function fil(liste, opts) {
    var o = opts || {}, auj = jourValide(o.aujourdhui) ? o.aujourdhui : jourDe(new Date());
    var site = net(o.site, 60).toLowerCase();
    return (Array.isArray(liste) ? liste : []).map(normaliserNouvelle).map(function (n, i) { n._i = i; return n; })
      .filter(function (n) { return n.titre && (!n.date || n.date <= auj) && (!site || !n.site || n.site.toLowerCase() === site); })
      .sort(function (a, b) {
        if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a._i - b._i;
      })
      .map(function (n) { delete n._i; return n; });
  }
  // Ce que la RH a programmé (daté après aujourd'hui).
  function programmees(liste, aujourdhui) {
    var auj = jourValide(aujourdhui) ? aujourdhui : jourDe(new Date());
    return (Array.isArray(liste) ? liste : []).map(normaliserNouvelle).filter(function (n) { return n.titre && n.date && n.date > auj; });
  }
  function nonLues(visibles, lues) {
    var l = Array.isArray(lues) ? lues : [];
    return (visibles || []).filter(function (n) { return l.indexOf(n.cle) < 0; });
  }

  // ======================================================================================
  // 3. LA MÉMOIRE DES ANCIENS (le 2 est plus bas : il touche le visiteur)
  // ======================================================================================
  function normaliserMemoire(m, i) {
    var o = estObjet(m) ? m : {}, L = LIMITES.memoire;
    var opts = Array.isArray(o.options) ? o.options.slice(0, 4).map(function (x) { return net(x, L.option); }) : [];
    while (opts.length && opts.length < 4) opts.push("");
    var b = o.bonne === "" || o.bonne == null ? null : Number(o.bonne);
    return {
      cle: net(o.cle, 60) || "memoire-" + ((Number(i) || 0) + 1),
      titre: net(o.titre, L.titre),
      auteur: net(o.auteur, L.auteur),
      metier: net(o.metier, L.metier),
      site: net(o.site, L.site),
      annees: net(o.annees, L.annees),
      recit: paragraphe(o.recit, L.recit[1]),
      lecon: paragraphe(o.lecon, L.lecon[1]),
      question: net(o.question, L.question),
      options: opts,
      bonne: Number.isInteger(b) && b >= 0 && b < 4 ? b : null,
      explication: paragraphe(o.explication, L.explication)
    };
  }
  function aUneQuestion(m) {
    var x = normaliserMemoire(m);
    return !!x.question && x.options.length === 4 && x.options.every(Boolean) && x.bonne !== null;
  }
  // Ce qu'il faut pour qu'une page de mémoire parte vers la RH. Un lien n'y entre pas :
  // une mémoire se lit ici, elle ne renvoie pas ailleurs.
  function validerMemoire(m) {
    var x = normaliserMemoire(m), L = LIMITES.memoire, erreurs = [];
    var err = function (champ, message) { erreurs.push({ champ: champ, message: message }); };
    if (x.titre.length < 5) err("titre", "Donne un titre à ta page : cinq caractères au moins.");
    if (!x.auteur) err("auteur", "Signe ta page : ton prénom, au moins.");
    if (x.recit.length < L.recit[0]) err("recit", "Raconte un peu plus : " + L.recit[0] + " caractères au moins. Une situation vraie, ce que tu as fait.");
    if (x.lecon.length < L.lecon[0]) err("lecon", "Dis en une ou deux phrases ce qu'aucune procédure ne dit.");
    [["titre", x.titre], ["recit", x.recit], ["lecon", x.lecon]].forEach(function (c) { if (RE_LIEN.test(c[1])) err(c[0], "Pas de lien ici : une mémoire se lit dans la maison."); });
    var commence = x.question || x.options.some(Boolean) || x.bonne !== null;
    if (commence && !aUneQuestion(x)) err("question", "La question est facultative ; si tu en poses une, il faut quatre réponses et la bonne cochée.");
    return erreurs;
  }
  function repondreMemoire(m, choix) {
    var x = normaliserMemoire(m);
    if (!aUneQuestion(x)) return { juste: true, explication: x.lecon };
    return { juste: Number(choix) === x.bonne, explication: x.explication || x.lecon };
  }

  // Les propositions (la file que la RH relit) : une mémoire, plus qui, quand, où elle en est.
  var ETATS_PROPOSITION = ["attente", "publiee", "refusee"];
  function normaliserProposition(p, i) {
    var o = estObjet(p) ? p : {};
    var x = normaliserMemoire(o, i);
    x.id = net(o.id, 60) || "prop-" + ((Number(i) || 0) + 1);
    x.cle = net(o.cle, 60) || x.id;
    x.le = texte(o.le) && !isNaN(new Date(o.le).getTime()) ? new Date(o.le).toISOString() : "";
    x.par = net(o.par, 40);
    x.etat = ETATS_PROPOSITION.indexOf(o.etat) >= 0 ? o.etat : "attente";
    x.mot = net(o.mot, LIMITES.mot[1]);
    x.decide_le = texte(o.decide_le) && !isNaN(new Date(o.decide_le).getTime()) ? new Date(o.decide_le).toISOString() : "";
    return x;
  }
  function propositions(liste) { return (Array.isArray(liste) ? liste : []).filter(estObjet).map(normaliserProposition); }
  // Proposer : trois en attente au plus par auteur — on ne remplit pas la file d'un coup.
  function proposer(liste, m, meta) {
    var l = propositions(liste), erreurs = validerMemoire(m), mt = meta || {};
    var par = net(mt.par, 40);
    if (par && l.filter(function (p) { return p.par === par && p.etat === "attente"; }).length >= LIMITES.memoire.enAttente) {
      erreurs.push({ champ: null, message: "Tu as déjà " + LIMITES.memoire.enAttente + " pages que la RH n'a pas encore relues. Attends sa réponse avant d'en écrire une autre." });
    }
    if (erreurs.length) return { ok: false, erreurs: erreurs, liste: l };
    var id = net(mt.id, 60) || "prop-" + (l.length + 1) + "-" + slug(normaliserMemoire(m).titre);
    var neuve = normaliserProposition(Object.assign({}, m, { id: id, cle: id, le: mt.le || new Date().toISOString(), par: par, etat: "attente" }), l.length);
    return { ok: true, erreurs: [], liste: l.concat([neuve]), proposition: neuve };
  }
  function trouverProposition(l, id) { for (var i = 0; i < l.length; i++) if (l[i].id === id) return i; return -1; }
  // Publier : la page entre dans les mémoires de la maison (la section « memoires » du
  // contenu édité), et la proposition garde la trace de la décision.
  function publier(liste, memoires, id, quand) {
    var l = propositions(liste), i = trouverProposition(l, id);
    if (i < 0) return { ok: false, erreur: "Cette page n'est plus dans la file." };
    if (l[i].etat !== "attente") return { ok: false, erreur: "Cette page a déjà sa réponse." };
    var m = (Array.isArray(memoires) ? memoires : []).filter(estObjet).map(normaliserMemoire);
    var page = normaliserMemoire(l[i]);
    var prises = {}; m.forEach(function (x) { prises[x.cle] = true; });
    var c = slug(page.titre) || page.cle, base = c, n = 2;
    while (prises[c]) c = base + "-" + n++;
    page.cle = c;
    l[i].etat = "publiee"; l[i].decide_le = new Date(quand || Date.now()).toISOString(); l[i].mot = "";
    return { ok: true, liste: l, memoires: m.concat([page]), page: page };
  }
  // Pas cette fois : toujours avec un mot, que l'auteur lit dans le jeu.
  function refuser(liste, id, mot, quand) {
    var l = propositions(liste), i = trouverProposition(l, id), t = net(mot, LIMITES.mot[1]);
    if (i < 0) return { ok: false, erreur: "Cette page n'est plus dans la file." };
    if (l[i].etat !== "attente") return { ok: false, erreur: "Cette page a déjà sa réponse." };
    if (t.length < LIMITES.mot[0]) return { ok: false, erreur: "Écris un mot à l'auteur (" + LIMITES.mot[0] + " caractères au moins) : ce qui manque, ou pourquoi pas cette fois." };
    l[i].etat = "refusee"; l[i].mot = t; l[i].decide_le = new Date(quand || Date.now()).toISOString();
    return { ok: true, liste: l };
  }
  // Revenir sur une décision (la page publiée sort des mémoires).
  function rouvrir(liste, memoires, id) {
    var l = propositions(liste), i = trouverProposition(l, id);
    if (i < 0) return { ok: false, erreur: "Cette page n'est plus dans la file." };
    var titre = l[i].titre;
    var m = (Array.isArray(memoires) ? memoires : []).filter(estObjet).map(normaliserMemoire);
    if (l[i].etat === "publiee") { var j = -1; for (var k = m.length - 1; k >= 0; k--) if (m[k].titre === titre && m[k].auteur === l[i].auteur) { j = k; break; } if (j >= 0) m.splice(j, 1); }
    l[i].etat = "attente"; l[i].mot = ""; l[i].decide_le = "";
    return { ok: true, liste: l, memoires: m };
  }

  // ======================================================================================
  // 2. BAB DISCOVERY — le visiteur candidat
  // ======================================================================================
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RE_TEL = /^\+?[0-9 .-]{8,20}$/;
  // Les portes du troisième jour, par leur geste : ce qui ouvre le formulaire.
  var GESTES = ["candidater", "recontact"];
  function normaliserCandidature(c, i) {
    var o = estObjet(c) ? c : {}, L = LIMITES.candidature;
    var an = parseInt(o.sortie, 10);
    return {
      id: net(o.id, 60) || "cand-" + ((Number(i) || 0) + 1),
      mode: o.mode === "recontact" ? "recontact" : "candidater",
      le: texte(o.le) && !isNaN(new Date(o.le).getTime()) ? new Date(o.le).toISOString() : "",
      prenom: net(o.prenom, L.prenom), nom: net(o.nom, L.nom),
      email: net(o.email, L.email).toLowerCase(),
      telephone: net(o.telephone, L.telephone),
      ecole: net(o.ecole, 80), filiere: net(o.filiere, L.filiere),
      sortie: an >= L.anneeMin && an <= L.anneeMax ? an : null,
      cherche: net(o.cherche, 40), domaine: net(o.domaine, 40),
      message: paragraphe(o.message, L.message),
      visite: estObjet(o.visite) ? o.visite : null,
      consentement: o.consentement === true,
      statut: net(o.statut, 20) || "nouvelle",
      demo: o.demo === true
    };
  }
  // Ce qu'un candidat doit dire. « Recontactez-moi » demande moins : un nom, une adresse, une école.
  function validerCandidature(c, cfg) {
    var x = normaliserCandidature(c), L = LIMITES.candidature, d = cfg || {}, erreurs = [];
    var err = function (champ, message) { erreurs.push({ champ: champ, message: message }); };
    if (!x.prenom) err("prenom", "Ton prénom.");
    if (!x.nom) err("nom", "Ton nom.");
    if (!RE_EMAIL.test(x.email)) err("email", "Une adresse e-mail où l'équipe peut te répondre, par exemple prenom.nom@gmail.com.");
    if (x.telephone && !RE_TEL.test(x.telephone)) err("telephone", "Un numéro de téléphone, chiffres seulement (le + est permis).");
    if (!x.ecole) err("ecole", "Ton école.");
    if (x.mode === "candidater") {
      if (!x.filiere) err("filiere", "Ta filière, ou ta spécialité.");
      if (!x.sortie) err("sortie", "L'année où tu sors de l'école (entre " + L.anneeMin + " et " + L.anneeMax + ").");
      var types = Array.isArray(d.cherche) ? d.cherche.map(function (t) { return t.cle; }) : null;
      if (!x.cherche || (types && types.indexOf(x.cherche) < 0)) err("cherche", "Ce que tu cherches.");
    }
    if (RE_LIEN.test(x.message)) err("message", "Pas de lien dans le message : il sera lu ici.");
    if (!x.consentement) err("consentement", "Coche la case : sans ton accord, rien ne part.");
    return erreurs;
  }
  // Ce que le visiteur a fait pendant sa visite — joint SEULEMENT s'il le coche, et il le
  // lit avant d'envoyer. Des faits, jamais une note.
  // `faits` : ce que le jeu sait de la visite — { debut, aujourdhui, murs, sites, defis, lectures }.
  function resumeVisite(faits) {
    var f = estObjet(faits) ? faits : {}, jour = 1;
    var n = function (v) { return Math.max(0, Math.floor(Number(v) || 0)); };
    if (jourValide(f.debut) && jourValide(f.aujourdhui)) jour = Math.max(1, ecart(f.debut, f.aujourdhui) + 1);
    return { jours: Math.min(jour, 3), murs: n(f.murs), sites: n(f.sites), defis: n(f.defis), lectures: n(f.lectures) };
  }
  function phraseVisite(v) {
    if (!estObjet(v)) return "";
    var pl = function (n, un, plusieurs) { return n + " " + (n > 1 ? plusieurs : un); };
    return [
      pl(v.jours || 1, "jour de visite", "jours de visite"),
      pl(v.murs || 0, "valeur lue", "valeurs lues"),
      pl(v.sites || 0, "site retrouvé aux archives", "sites retrouvés aux archives"),
      pl(v.defis || 0, "défi de métier réussi", "défis de métier réussis"),
      pl(v.lectures || 0, "page de culture lue", "pages de culture lues")
    ].join(" · ");
  }
  function candidater(liste, c, cfg, meta) {
    var l = (Array.isArray(liste) ? liste : []).filter(estObjet).map(normaliserCandidature);
    var erreurs = validerCandidature(c, cfg);
    if (erreurs.length) return { ok: false, erreurs: erreurs, liste: l };
    var mt = meta || {};
    var x = normaliserCandidature(Object.assign({}, c, { id: mt.id || "cand-" + (l.length + 1) + "-" + Date.now().toString(36), le: mt.le || new Date().toISOString(), statut: "nouvelle", demo: false }));
    // La même adresse ne dépose qu'une fois par mode : la nouvelle remplace l'ancienne.
    var garde = l.filter(function (y) { return !(y.email === x.email && y.mode === x.mode); });
    return { ok: true, erreurs: [], liste: garde.concat([x]), candidature: x, remplace: garde.length !== l.length };
  }
  // Le suivi que la RH pose sur une candidature — jamais une note.
  var STATUTS = [
    { cle: "nouvelle", nom: "Nouvelle" },
    { cle: "contactee", nom: "Contactée" },
    { cle: "entretien", nom: "Entretien prévu" },
    { cle: "vivier", nom: "Gardée au vivier" },
    { cle: "pas-cette-fois", nom: "Pas cette fois" }
  ];

  // Le carnet de visite anonyme (un jour, un geste, un nombre : jamais une personne).
  var EVENEMENTS = ["entree", "jour2", "jour3", "porte_candidater", "porte_recontact", "porte_passer", "candidature", "recontact"];
  function noter(carnet, evenement, jour) {
    var c = estObjet(carnet) ? JSON.parse(JSON.stringify(carnet)) : {};
    if (EVENEMENTS.indexOf(evenement) < 0) return c;
    var j = jourValide(jour) ? jour : jourDe(new Date());
    c[j] = estObjet(c[j]) ? c[j] : {};
    c[j][evenement] = (Number(c[j][evenement]) || 0) + 1;
    return c;
  }
  function entonnoir(carnet, depart) {
    var t = {}, c = estObjet(carnet) ? carnet : {};
    EVENEMENTS.forEach(function (e) { t[e] = 0; });
    Object.keys(c).forEach(function (j) {
      if (!jourValide(j) || (depart && j < depart) || !estObjet(c[j])) return;
      EVENEMENTS.forEach(function (e) { t[e] += Math.max(0, Math.floor(Number(c[j][e]) || 0)); });
    });
    return t;
  }
  function additionner(a, b) {
    var t = {};
    EVENEMENTS.forEach(function (e) { t[e] = (Number(a && a[e]) || 0) + (Number(b && b[e]) || 0); });
    return t;
  }

  // ======================================================================================
  // 4. LE RAPPORT D'ÉTONNEMENT (Youssef, 25/09/2026 : l'idée nº 4 de la liste, 17/20)
  // ======================================================================================
  // Au bout d'un mois, le nouveau voit encore ce que les anciens ne voient plus. Il écrit
  // ce qui lui a plu, ce qui l'a étonné, et une idée s'il en a une. La RH lit chaque
  // rapport, le marque lu, et peut y donner suite d'un mot que l'auteur lit dans le jeu.
  // ⚠️ ANONYME VEUT DIRE ANONYME : ni pseudo, ni identifiant, ni jour exact (le MOIS
  //    seulement). L'auteur garde un REÇU chez lui (son navigateur) pour relire la
  //    réponse ; la RH, elle, ne peut pas remonter jusqu'à lui.
  // ⚠️ Aucun point, aucune note : un rapport n'est jamais un score, ni lu à l'évaluation.
  var ETATS_ETONNEMENT = ["recu", "lu", "suite"];
  function quandISO(v) { return texte(v) && !isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : ""; }
  function normaliserEtonnement(e, i) {
    var o = estObjet(e) ? e : {}, L = LIMITES.etonnement;
    var anonyme = o.anonyme === true;
    var le = quandISO(o.le) || (/^\d{4}-\d{2}$/.test(texte(o.le)) ? texte(o.le) : "");
    return {
      id: net(o.id, 60) || "eto-" + ((Number(i) || 0) + 1),
      anonyme: anonyme,
      par: anonyme ? "" : net(o.par, 40),
      le: anonyme ? le.slice(0, 7) : le,          // anonyme : AAAA-MM, jamais l'heure
      site: net(o.site, L.site),
      bien: paragraphe(o.bien, L.bien[1]),
      surpris: paragraphe(o.surpris, L.surpris[1]),
      idee: paragraphe(o.idee, L.idee[1]),
      etat: ETATS_ETONNEMENT.indexOf(o.etat) >= 0 ? o.etat : "recu",
      mot: paragraphe(o.mot, LIMITES.mot[1]),
      decide_le: quandISO(o.decide_le),
      demo: o.demo === true
    };
  }
  function etonnements(liste) { return (Array.isArray(liste) ? liste : []).filter(estObjet).map(normaliserEtonnement); }
  function validerEtonnement(e) {
    var o = estObjet(e) ? e : {}, L = LIMITES.etonnement, erreurs = [];
    var err = function (champ, message) { erreurs.push({ champ: champ, message: message }); };
    var bien = paragraphe(o.bien), surpris = paragraphe(o.surpris), idee = paragraphe(o.idee);
    if (bien.length < L.bien[0]) err("bien", "Quelques mots de plus : ce qui t'a plu (" + L.bien[0] + " caractères au moins).");
    if (surpris.length < L.surpris[0]) err("surpris", "Quelques mots de plus : ce qui t'a étonné (" + L.surpris[0] + " caractères au moins).");
    [["bien", bien], ["surpris", surpris], ["idee", idee]].forEach(function (c) { if (RE_LIEN.test(c[1])) err(c[0], "Pas de lien ici : écris-le avec tes mots."); });
    return erreurs;
  }
  // Écrire son rapport. `remplace` : l'id de son rapport précédent (lu dans son reçu) —
  // tant que la RH ne l'a pas lu, le nouveau le remplace ; lu, il n'est plus réécrit.
  function etonner(liste, e, meta) {
    var l = etonnements(liste), mt = meta || {}, erreurs = validerEtonnement(e);
    var ancien = mt.remplace ? l.filter(function (x) { return x.id === mt.remplace; })[0] : null;
    if (ancien && ancien.etat !== "recu") erreurs.push({ champ: null, message: "La RH a déjà lu ton rapport : il ne se réécrit plus. Tu peux lui écrire autrement." });
    if (erreurs.length) return { ok: false, erreurs: erreurs, liste: l };
    var o = estObjet(e) ? e : {};
    // ⚠️ un identifiant tiré de l'heure (Date.now) trahirait la minute d'envoi d'un rapport
    //    anonyme : l'anonyme reçoit un tirage au hasard, qui ne dit rien de lui.
    var id = net(mt.id, 60) || (o.anonyme === true
      ? "eto-" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
      : "eto-" + (l.length + 1) + "-" + Date.now().toString(36));
    var x = normaliserEtonnement({ id: id, anonyme: o.anonyme === true, par: mt.par, le: mt.le || new Date().toISOString(),
      site: o.site, bien: o.bien, surpris: o.surpris, idee: o.idee, etat: "recu" }, l.length);
    var garde = ancien ? l.filter(function (y) { return y.id !== ancien.id; }) : l;
    return { ok: true, erreurs: [], liste: garde.concat([x]), rapport: x, remplace: !!ancien };
  }
  // Ce que la RH en fait : « lu », ou « suite » avec un mot (obligatoire) que l'auteur lit.
  function repondreEtonnement(liste, id, etat, mot, quand) {
    var l = etonnements(liste), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k;
    if (i < 0) return { ok: false, erreur: "Ce rapport n'est plus dans la file." };
    if (ETATS_ETONNEMENT.indexOf(etat) < 0) return { ok: false, erreur: "Réponse inconnue." };
    var m = paragraphe(mot, LIMITES.mot[1]);
    if (etat === "suite" && m.length < LIMITES.mot[0]) return { ok: false, erreur: "Écris ce que la maison en fait (" + LIMITES.mot[0] + " caractères au moins) : l'auteur le lira dans le jeu." };
    // le mot n'existe qu'avec une suite : revenir à « lu » retire la réponse
    l[i] = normaliserEtonnement(Object.assign({}, l[i], { etat: etat, mot: etat === "suite" ? m : "", decide_le: etat === "recu" ? "" : (quand || new Date().toISOString()) }), i);
    return { ok: true, liste: l, rapport: l[i] };
  }
  // Ce que la console et le tableau de bord en lisent : des nombres, jamais une personne.
  function bilanEtonnements(liste) {
    var l = etonnements(liste), t = { total: l.length, recu: 0, lu: 0, suite: 0, anonymes: 0, idees: 0, parSite: {} };
    l.forEach(function (x) {
      t[x.etat] += 1;
      if (x.anonyme) t.anonymes += 1;
      if (x.idee) t.idees += 1;
      var s = x.site || "Sans site";
      t.parSite[s] = (t.parSite[s] || 0) + 1;
    });
    return t;
  }
  function csvEtonnements(liste) {
    var col = ["le", "site", "auteur", "bien", "surpris", "idee", "etat", "mot"];
    var cellule = function (v) { return '"' + texte(v).replace(/"/g, '""') + '"'; };
    var lignes = etonnements(liste).map(function (x) {
      return [x.le, x.site, x.anonyme ? "Anonyme" : x.par, x.bien, x.surpris, x.idee, x.etat, x.mot].map(cellule).join(";");
    });
    return "﻿" + col.join(";") + "\n" + lignes.join("\n");
  }

  // ======================================================================================
  // Le rangement (le navigateur en démo) : toujours derrière un try/catch.
  // ======================================================================================
  function cles(maison) {
    var m = slug(maison) || "maison";
    return {
      contenu: "bab.maison." + m + ".contenu",
      propositions: "bab.maison." + m + ".propositions",
      candidatures: "bab.maison." + m + ".candidatures",
      visites: "bab.maison." + m + ".visites",
      etonnements: "bab.maison." + m + ".etonnements",
      // le reçu de l'auteur (chez lui) : l'id de son rapport, jamais relié à lui dans la file
      etonnementRecu: function (joueur) { return "bab.etonnement.recu." + m + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); },
      etonnementSignale: function (joueur) { return "bab.etonnement.signale." + m + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); },
      filLus: function (joueur) { return "bab.fil.lus." + m + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); },
      filVu: function (joueur) { return "bab.fil.vu." + m + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); },
      memoiresRallumees: function (joueur) { return "bab.memoire.rallumees." + m + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); }
    };
  }
  function lire(stockage, cle, defaut) {
    try {
      var s = stockage || root.localStorage;
      var brut = s ? s.getItem(cle) : null;
      if (brut == null) return defaut;
      var v = JSON.parse(brut);
      return v == null ? defaut : v;
    } catch (e) { return defaut; }
  }
  function ecrire(stockage, cle, valeur) {
    try { var s = stockage || root.localStorage; if (!s) return false; s.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
  }
  // La section d'un contenu édité, écrite sans toucher aux autres sections.
  function ecrireSection(stockage, maison, section, liste) {
    var k = cles(maison).contenu;
    var o = lire(stockage, k, {});
    if (!estObjet(o)) o = {};
    o[section] = liste;
    o.enregistre_le = new Date().toISOString();
    return ecrire(stockage, k, o);
  }

  // ======================================================================================
  // Discovery : ce qu'une maison change au visiteur du moteur (dayf.js), en place.
  // ======================================================================================
  // `d` vient de ZWJ_MAISON.vie.discovery.visiteur : textes des trois jours et des
  // portes. Chaque champ absent laisse celui du moteur. Rend la liste appliquée.
  function appliquerVisiteur(Dy, d) {
    var faits = [];
    if (!Dy || !estObjet(d)) return faits;
    var remplir = function (pages, pseudo) { return (pages || []).map(function (p) { return String(p).replace(/\{pseudo\}/g, pseudo); }); };
    if (estObjet(d.apparition) && Dy.APPARITION) { Object.assign(Dy.APPARITION, d.apparition); faits.push("apparition"); }
    if (estObjet(d.accueil)) {
      Dy.accueil = function (pseudo) { var p = String(pseudo || "").trim() || (d.pseudo || "toi"); return { nom: d.accueil.nom, pages: remplir(d.accueil.pages, p) }; };
      faits.push("accueil");
    }
    if (estObjet(d.retours)) {
      Dy.retour = function (j) { var r = d.retours[Math.floor(Number(j)) || 0]; return r ? { nom: r.nom, pages: r.pages.slice() } : null; };
      faits.push("retours");
    }
    if (estObjet(d.question)) {
      Dy.question = function (pseudo) { var p = String(pseudo || "").trim() || (d.pseudo || "toi"); return { nom: d.question.nom, pages: remplir(d.question.pages, p) }; };
      faits.push("question");
    }
    if (Array.isArray(d.portes) && Array.isArray(Dy.PORTES)) {
      Array.prototype.splice.apply(Dy.PORTES, [0, Dy.PORTES.length].concat(d.portes.map(function (p) { return Object.assign({}, p, { pages: (p.pages || []).slice() }); })));
      faits.push("portes");
    }
    if (estObjet(d.refus) && Dy.REFUS) { Object.keys(d.refus).forEach(function (k) { Dy.REFUS[k] = d.refus[k]; }); faits.push("refus"); }
    if (estObjet(d.salles) && Dy.SALLES) { Object.keys(d.salles).forEach(function (k) { Dy.SALLES[k] = d.salles[k]; }); faits.push("salles"); }
    if (estObjet(d.sandouq) && Dy.SANDOUQ_DONNE) { Object.assign(Dy.SANDOUQ_DONNE, d.sandouq); faits.push("sandouq"); }
    if (typeof d.carte === "function") { Dy.carte = d.carte; faits.push("carte"); }
    if (typeof d.collection === "function") { Dy.collection = d.collection; faits.push("collection"); }
    if (d.murEfface === null) { Dy.KHATT_EFFACE = -1; faits.push("mur"); }
    if (d.nom) {
      var nom = d.nom, J = Dy.JOURS || 3;
      Dy.ligne = function (etat, auj) { var j = Dy.jour(etat, auj); return j > J ? nom + " · la porte reste ouverte" : nom + " · jour " + j + " sur " + J; };
      if (typeof d.carnet === "function") Dy.carnet = d.carnet;
      faits.push("nom");
    }
    return faits;
  }

  // ======================================================================================
  // Au navigateur — la page du jeu d'une maison qui déclare `vie`.
  // ======================================================================================
  var ici = { cfg: null, doc: null, minuteur: null, annonce: null, ouvert: null, retour: null, reponses: {}, libreDepuis: 0 };

  function esc(s) { return texte(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function br(s) { return esc(s).replace(/\n/g, "<br>"); }
  function cfgVie() { return (root.ZWJ_MAISON && root.ZWJ_MAISON.vie) || null; }
  function maisonCle() { return (root.ZWJ_MAISON && root.ZWJ_MAISON.cle) || "maison"; }
  function contenuMaison() { return root.ZWJ_MAISON_CONTENU || {}; }
  function app() { return root.ZWJ_APP || null; }
  function aujourdhui() {
    try { if (root.ZWJ && root.ZWJ.kelma && root.ZWJ.kelma.jourCasa) return root.ZWJ.kelma.jourCasa(); } catch (e) { /* l'heure du navigateur, alors */ }
    return jourDe(new Date());
  }
  function joueur() { var a = app(); return a ? a.joueur : null; }
  function visiteur() { var a = app(); return !!(a && a.dayf); }
  function atelier() { var a = app(); return !!(a && a.compte && a.compte.mode === "local"); }
  function siteDuJoueur() { var j = joueur(); return j && j.site ? j.site : ""; }

  // ---- ce qui s'affiche : les panneaux ont la forme de ceux du moteur (zj-riwaq) ----
  function panneau(doc, id, kicker, titre, lead) {
    var el = doc.createElement("div");
    el.id = id; el.className = "zj-riwaq bab-panneau"; el.hidden = true;
    el.innerHTML = '<div class="zj-riwaq__cadre zj-riwaq__cadre--large" role="dialog" aria-modal="true" aria-labelledby="' + id + '-nom">' +
      '<div class="zj-riwaq__tete"><div><p class="zj-kicker">' + esc(kicker) + '</p><h2 id="' + id + '-nom">' + esc(titre) + '</h2></div>' +
      '<button type="button" class="zj-bouton zj-bouton--discret" data-bab-fermer>Fermer</button></div>' +
      (lead ? '<p class="zj-riwaq__lead">' + esc(lead) + '</p>' : "") +
      '<div id="' + id + '-corps"></div></div>';
    doc.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-bab-fermer]")) fermer(); });
    return el;
  }
  function ouvrir(id) {
    var doc = ici.doc, el = doc.getElementById(id), a = app();
    if (!el) return;
    fermer();
    try { if (a && a.menuOuvert && a.basculerMenu) a.basculerMenu(false); } catch (e) { /* le menu se ferme seul */ }
    try { if (a && a.fermer) a.fermer(); } catch (e) { /* aucun dialogue */ }
    ici.retour = doc.activeElement;
    el.hidden = false;
    ici.ouvert = id;
    doc.body.setAttribute("data-question", "1");
    var f = el.querySelector("[data-bab-fermer]");
    if (f) f.focus();
  }
  function fermer() {
    var doc = ici.doc;
    if (!doc || !ici.ouvert) return;
    var el = doc.getElementById(ici.ouvert);
    if (el) el.hidden = true;
    ici.ouvert = null;
    doc.body.setAttribute("data-question", "0");
    rafraichir();
  }
  function commande(doc, cle, libelle, avant) {
    var menu = doc.getElementById("zj-menu");
    if (!menu || doc.getElementById("zj-menu-" + cle)) return null;
    var b = doc.createElement("button");
    b.id = "zj-menu-" + cle; b.type = "button"; b.className = "zj-bouton zj-bouton--discret"; b.textContent = libelle;
    var ref = avant ? doc.getElementById("zj-menu-" + avant) : null;
    if (ref && ref.parentNode) ref.parentNode.insertBefore(b, ref); else menu.appendChild(b);
    return b;
  }
  function carteDar(cle, porte, icone, nom, pourquoi, mots) {
    var Dr = root.ZWJ && root.ZWJ.dar;
    if (!Dr || !Array.isArray(Dr.ENTREES)) return;
    for (var i = 0; i < Dr.ENTREES.length; i++) if (Dr.ENTREES[i].cle === cle) return;
    Dr.ENTREES.unshift({ cle: cle, porte: porte, icone: icone, nom: nom, ar: "", pourquoi: pourquoi, mots: mots || [] });
  }

  // ---- 1. Le Fil ----
  function nouvellesDuFil() { return fil(contenuMaison().fil, { aujourdhui: aujourdhui(), site: siteDuJoueur() }); }
  function lusDuFil() { var l = lire(null, cles(maisonCle()).filLus(joueur()), []); return Array.isArray(l) ? l : []; }
  function marquerLusDuFil(liste) {
    var l = lusDuFil();
    liste.forEach(function (n) { if (l.indexOf(n.cle) < 0) l.push(n.cle); });
    ecrire(null, cles(maisonCle()).filLus(joueur()), l);
  }
  function ouvrirFil() {
    var doc = ici.doc, c = cfgVie() || {}, corps = doc.getElementById("bab-fil-corps");
    if (!corps) return;
    var liste = nouvellesDuFil(), lues = lusDuFil(), auj = aujourdhui();
    corps.innerHTML = liste.length ? '<ul class="bab-fil">' + liste.map(function (n) {
      var neuve = lues.indexOf(n.cle) < 0;
      return '<li class="bab-fil__nouvelle' + (n.epingle ? " bab-fil__nouvelle--epingle" : "") + '">' +
        '<p class="bab-fil__meta">' + (n.epingle ? '<span class="bab-fil__puce bab-fil__puce--epingle">À la une</span>' : "") +
        (neuve ? '<span class="bab-fil__puce">Nouveau</span>' : "") +
        '<span>' + esc(dateLisible(n.date, auj) || "") + (n.site ? " · " + esc(n.site) : " · toute la maison") + '</span></p>' +
        '<h3>' + esc(n.titre) + '</h3>' + (n.texte ? '<p>' + br(n.texte) + '</p>' : "") + '</li>';
    }).join("") + '</ul>' : '<p class="zj-riwaq__vide">' + esc(c.fil && c.fil.vide || "Rien au Fil pour l'instant.") + '</p>';
    ouvrir("bab-fil");
    marquerLusDuFil(liste);
  }
  // En entrant dans la cour : une nouvelle qu'on n'a pas vue se signale, une fois.
  // Une cour LIBRE : ni dialogue, ni panneau, ni menu. Une nouvelle n'interrompt
  // jamais Ba Lahcen : elle attend que la cour soit libre depuis quelques secondes.
  function courLibre() {
    var a = app(), doc = ici.doc;
    return !!(a && a.ecran === "cour" && a.joueur && !a.dialogue && !a.menuOuvert && !ici.ouvert &&
      !(doc && doc.body && doc.body.getAttribute("data-question") === "1"));
  }
  function signalerFil() {
    var doc = ici.doc, j = joueur(), a = app();
    var b0 = doc && doc.getElementById("bab-fil-annonce");
    if (!courLibre()) { ici.libreDepuis = Date.now(); if (b0 && a && a.dialogue) b0.hidden = true; return; }
    if (!ici.libreDepuis) { ici.libreDepuis = Date.now(); return; }
    if (Date.now() - ici.libreDepuis < 4000) return;
    if (!doc || !j) return;
    var neuves = nonLues(nouvellesDuFil(), lusDuFil());
    var vu = lire(null, cles(maisonCle()).filVu(j), []);
    var aSignaler = neuves.filter(function (n) { return (Array.isArray(vu) ? vu : []).indexOf(n.cle) < 0; });
    if (!aSignaler.length) return;
    ecrire(null, cles(maisonCle()).filVu(j), (Array.isArray(vu) ? vu : []).concat(aSignaler.map(function (n) { return n.cle; })));
    var b = doc.getElementById("bab-fil-annonce");
    if (!b) {
      b = doc.createElement("button");
      b.id = "bab-fil-annonce"; b.type = "button"; b.className = "bab-annonce";
      b.addEventListener("click", function () { b.hidden = true; ouvrirFil(); });
      doc.body.appendChild(b);
    }
    var premiere = aSignaler[0];
    b.innerHTML = '<span class="bab-annonce__kicker">Le Fil de la maison' + (aSignaler.length > 1 ? " · " + aSignaler.length + " nouvelles" : "") + '</span><strong>' + esc(premiere.titre) + '</strong><span class="bab-annonce__lire">Lire</span>';
    b.hidden = false;
    clearTimeout(ici.annonce);
    ici.annonce = setTimeout(function () { b.hidden = true; }, 12000);
  }

  // ---- 3. La mémoire des anciens ----
  function memoiresPubliees() { return (Array.isArray(contenuMaison().memoires) ? contenuMaison().memoires : []).map(normaliserMemoire).filter(function (m) { return m.titre && m.recit; }); }
  function rallumees() { var l = lire(null, cles(maisonCle()).memoiresRallumees(joueur()), []); return Array.isArray(l) ? l : []; }
  function rallumer(cle) {
    var l = rallumees(); if (l.indexOf(cle) >= 0) return false;
    l.push(cle); ecrire(null, cles(maisonCle()).memoiresRallumees(joueur()), l);
    // la même mémoire, lue aux archives ou ici, rallume UNE lumière de la maison
    try { var M = root.ZWJ && root.ZWJ.maison; if (M && M.marquerLu) M.marquerLu(joueur(), "memoires:" + cle); } catch (e) { /* la lumière attendra */ }
    return true;
  }
  function mesPropositions() {
    var j = joueur(); if (!j) return [];
    return propositions(lire(null, cles(maisonCle()).propositions, [])).filter(function (p) { return p.par === j.pseudo; });
  }
  function ouvrirMemoire(vue) {
    var doc = ici.doc, corps = doc.getElementById("bab-memoire-corps"), c = (cfgVie() || {}).memoire || {};
    if (!corps) return;
    var liste = memoiresPubliees(), faites = rallumees(), html = "";
    if (vue !== "ecrire") {
      html += '<p class="bab-memoire__compte">' + faites.filter(function (k) { return liste.some(function (m) { return m.cle === k; }); }).length + " sur " + liste.length + " rallumées par toi</p>";
      html += liste.length ? '<ul class="bab-memoires">' + liste.map(function (m) {
        var fait = faites.indexOf(m.cle) >= 0, r = ici.reponses[m.cle];
        var q = aUneQuestion(m) ? '<div class="bab-memoire__q"><p><strong>' + esc(m.question) + '</strong></p><div class="bab-memoire__choix">' +
          m.options.map(function (o, i) {
            var cls = r && r.choix === i ? (r.juste ? " bab-choix--juste" : " bab-choix--faux") : "";
            return '<button type="button" class="zj-bouton zj-bouton--discret bab-choix' + cls + '" data-bab-repondre="' + esc(m.cle) + '" data-choix="' + i + '"' + (fait ? " disabled" : "") + '>' + esc(o) + '</button>';
          }).join("") + '</div>' + (r ? '<p class="bab-memoire__verdict">' + (r.juste ? "Juste. " + br(r.explication) : "Pas celle-là. Relis ce qu'aucune procédure ne dit, et réessaie.") + '</p>' : "") + '</div>'
          : '<button type="button" class="zj-bouton zj-bouton--discret" data-bab-rallumer="' + esc(m.cle) + '"' + (fait ? " disabled" : "") + '>' + (fait ? "Rallumée" : "Je l'ai lue") + '</button>';
        return '<li class="bab-memoire' + (fait ? " bab-memoire--rallumee" : "") + '">' +
          '<p class="bab-memoire__qui">' + esc([m.auteur, m.metier, m.site, m.annees].filter(Boolean).join(" · ")) + (fait ? ' <span class="bab-fil__puce">Rallumée</span>' : "") + '</p>' +
          '<h3>' + esc(m.titre) + '</h3><p>' + br(m.recit) + '</p>' +
          '<p class="bab-memoire__lecon"><span>' + esc(c.lecon || "Ce qu'aucune procédure ne dit") + '</span>' + br(m.lecon) + '</p>' + q + '</li>';
      }).join("") + '</ul>' : '<p class="zj-riwaq__vide">Aucune page n\'est encore publiée.</p>';
      if (!visiteur()) {
        var mes = mesPropositions();
        html += '<div class="bab-memoire__transmettre"><h3 class="zj-riwaq__titre">' + esc(c.transmettreTitre || "Transmettre une page") + '</h3><p class="zj-riwaq__detail">' + esc(c.transmettreSous || "Tu sais quelque chose qu'aucune procédure ne dit ? Écris-le : la RH relit, puis la page entre aux archives.") + '</p>' +
          (mes.length ? '<ul class="bab-memoire__mes">' + mes.map(function (p) {
            var et = p.etat === "publiee" ? "Publiée" : p.etat === "refusee" ? "Pas cette fois" : "Chez la RH";
            return '<li><strong>' + esc(p.titre) + '</strong> — ' + et + (p.etat === "refusee" && p.mot ? ' : « ' + esc(p.mot) + ' »' : "") + '</li>';
          }).join("") + '</ul>' : "") +
          '<button type="button" class="zj-bouton" data-bab-ecrire>Écrire une page</button></div>';
      }
    } else {
      html += formulaireMemoire();
    }
    corps.innerHTML = html;
    if (ici.ouvert !== "bab-memoire") ouvrir("bab-memoire");
    var premier = vue === "ecrire" ? corps.querySelector("input,textarea") : null;
    if (premier) premier.focus();
  }
  // Ce que le jeu sait de la visite, lu dans ses propres modules (jamais deviné).
  function faitsVisite() {
    var j = joueur() || {}, a = app(), Z = root.ZWJ || {}, f = { aujourdhui: aujourdhui() };
    try { f.debut = a && a.dayfEtat && a.dayfEtat.debut; } catch (e) { /* jour 1 */ }
    try { if (Z.wird && Z.wird.lireEtat) f.murs = Z.wird.lireEtat(j.recit).khatt.length; } catch (e) { /* 0 */ }
    try { if (Z.pages && Z.pages.etat) f.sites = Z.pages.etat(j.pages).resolues; } catch (e) { /* 0 */ }
    try { if (Z.tahaddi && Z.tahaddi.etat) f.defis = Z.tahaddi.etat(j.tahaddi).reussis; } catch (e) { /* 0 */ }
    try { if (Z.maison && Z.maison.lus) f.lectures = Z.maison.lus(j).length; } catch (e) { /* 0 */ }
    return f;
  }
  function champ(nom, libelle, type, aide, max, requis, valeur) {
    var id = "bab-f-" + nom, attrs = ' id="' + id + '" name="' + nom + '"' + (max ? ' maxlength="' + max + '"' : "") + ' aria-label="' + esc(libelle) + '"' + (requis ? " required" : "");
    var ctrl = type === "long" ? '<textarea' + attrs + ' rows="4">' + esc(valeur || "") + '</textarea>' : '<input type="text"' + attrs + ' value="' + esc(valeur || "") + '">';
    return '<p class="bab-champ"><label for="' + id + '">' + esc(libelle) + (requis ? "" : ' <span class="bab-facultatif">(facultatif)</span>') + '</label>' + ctrl +
      (aide ? '<span class="bab-aide">' + esc(aide) + '</span>' : "") + '<span class="bab-erreur" data-erreur="' + nom + '" hidden></span></p>';
  }
  function formulaireMemoire() {
    var L = LIMITES.memoire, j = joueur() || {};
    return '<form class="bab-form" id="bab-form-memoire" novalidate>' +
      champ("titre", "Le titre de ta page", "texte", "Par exemple : « Le bruit qui annonce une panne de palier ».", L.titre, true) +
      '<div class="bab-ligne">' + champ("auteur", "Ton prénom", "texte", "", L.auteur, true, j.pseudo) + champ("metier", "Ton métier", "texte", "", L.metier, false) + champ("site", "Ton site", "texte", "", L.site, false) + '</div>' +
      champ("annees", "Depuis quand tu es dans la maison", "texte", "Par exemple : « 18 ans de maison ».", L.annees, false) +
      champ("recit", "Ce qui s'est passé", "long", "Une situation vraie, ce que tu as vu, ce que tu as fait. " + L.recit[0] + " caractères au moins.", L.recit[1], true) +
      champ("lecon", "Ce qu'aucune procédure ne dit", "long", "En une ou deux phrases : ce que tu voudrais qu'un nouveau sache.", L.lecon[1], true) +
      '<fieldset class="bab-q"><legend>Une question pour la rallumer <span class="bab-facultatif">(facultatif)</span></legend>' +
      champ("question", "La question", "texte", "Celui qui répond juste « rallume » ta page.", L.question, false) +
      [0, 1, 2, 3].map(function (i) { return '<p class="bab-option"><input type="radio" name="bonne" value="' + i + '" id="bab-f-bonne-' + i + '" aria-label="La bonne réponse est la ' + "ABCD"[i] + '"><input type="text" name="option' + i + '" maxlength="' + L.option + '" aria-label="Réponse ' + "ABCD"[i] + '" placeholder="Réponse ' + "ABCD"[i] + '"></p>'; }).join("") +
      '<span class="bab-aide">Coche la bonne réponse.</span><span class="bab-erreur" data-erreur="question" hidden></span></fieldset>' +
      '<p class="bab-form__note">Ta page part à la RH. Elle la relit, puis la publie aux archives ou te répond d\'un mot. Rien n\'est publié sans elle.</p>' +
      '<p class="bab-erreur bab-erreur--globale" data-erreur="_" hidden></p>' +
      '<div class="bab-form__actions"><button type="submit" class="zj-bouton">Envoyer à la RH</button><button type="button" class="zj-bouton zj-bouton--discret" data-bab-retour-memoire>Retour aux pages</button></div></form>';
  }
  function lireFormulaire(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) o[el.name] = el.value; return; }
      if (el.type === "checkbox") { o[el.name] = el.checked; return; }
      o[el.name] = el.value;
    });
    return o;
  }
  function montrerErreurs(form, erreurs) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-erreur]"), function (s) { s.hidden = true; s.textContent = ""; });
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (s) { s.removeAttribute("aria-invalid"); });
    var premier = null;
    erreurs.forEach(function (e) {
      var s = form.querySelector('[data-erreur="' + (e.champ || "_") + '"]') || form.querySelector('[data-erreur="_"]');
      if (s) { s.textContent = s.textContent ? s.textContent + " " + e.message : e.message; s.hidden = false; }
      var c = e.champ ? form.querySelector('[name="' + e.champ + '"]') : null;
      if (c) { c.setAttribute("aria-invalid", "true"); if (!premier) premier = c; }
    });
    if (premier) premier.focus();
  }
  function envoyerMemoire(form) {
    var o = lireFormulaire(form), j = joueur() || {};
    var m = { titre: o.titre, auteur: o.auteur, metier: o.metier, site: o.site, annees: o.annees, recit: o.recit, lecon: o.lecon,
      question: o.question, options: [o.option0, o.option1, o.option2, o.option3].map(function (x) { return x || ""; }), bonne: o.bonne == null ? null : o.bonne };
    if (!m.question && !m.options.some(Boolean)) { m.options = []; m.bonne = null; }
    var k = cles(maisonCle()).propositions;
    var r = proposer(lire(null, k, []), m, { par: j.pseudo });
    if (!r.ok) { montrerErreurs(form, r.erreurs); return; }
    ecrire(null, k, r.liste);
    var corps = ici.doc.getElementById("bab-memoire-corps");
    corps.innerHTML = '<div class="bab-merci"><h3>Ta page est partie à la RH.</h3><p>« ' + esc(r.proposition.titre) + ' » attend sa relecture. Tu la verras ici avec sa réponse : publiée aux archives, ou un mot qui dit ce qui manque.</p>' +
      '<button type="button" class="zj-bouton" data-bab-retour-memoire>Retour aux pages</button></div>';
    var b = corps.querySelector("button"); if (b) b.focus();
  }

  // ---- 2. Discovery : le formulaire du troisième jour ----
  function ouvrirCandidature(mode) {
    var doc = ici.doc, corps = doc.getElementById("bab-candidature-corps"), d = ((cfgVie() || {}).discovery) || {};
    if (!corps) return;
    var m = mode === "recontact" ? "recontact" : "candidater", L = LIMITES.candidature;
    var visite = resumeVisite(faitsVisite());
    var titre = doc.getElementById("bab-candidature-nom");
    if (titre) titre.textContent = m === "recontact" ? (d.titreRecontact || "Être recontacté") : (d.titreCandidater || "Postuler");
    var options = function (liste, invite) { return '<option value="">' + esc(invite) + '</option>' + (liste || []).map(function (x) { var v = typeof x === "string" ? x : x.cle, n = typeof x === "string" ? x : x.nom; return '<option value="' + esc(v) + '">' + esc(n) + '</option>'; }).join(""); };
    var choix = function (nom, libelle, liste, invite, requis) {
      return '<p class="bab-champ"><label for="bab-f-' + nom + '">' + esc(libelle) + (requis ? "" : ' <span class="bab-facultatif">(facultatif)</span>') + '</label><select id="bab-f-' + nom + '" name="' + nom + '" aria-label="' + esc(libelle) + '"' + (requis ? " required" : "") + '>' + options(liste, invite) + '</select><span class="bab-erreur" data-erreur="' + nom + '" hidden></span></p>';
    };
    corps.innerHTML = '<p class="zj-riwaq__lead">' + esc(m === "recontact" ? (d.leadRecontact || "") : (d.leadCandidater || "")) + '</p>' +
      '<form class="bab-form" id="bab-form-candidature" data-mode="' + m + '" novalidate>' +
      '<div class="bab-ligne">' + champ("prenom", "Prénom", "texte", "", L.prenom, true, "") + champ("nom", "Nom", "texte", "", L.nom, true) + '</div>' +
      '<div class="bab-ligne">' + '<p class="bab-champ"><label for="bab-f-email">Adresse e-mail</label><input type="text" inputmode="email" autocomplete="email" id="bab-f-email" name="email" maxlength="' + L.email + '" aria-label="Adresse e-mail" required><span class="bab-erreur" data-erreur="email" hidden></span></p>' +
      '<p class="bab-champ"><label for="bab-f-telephone">Téléphone <span class="bab-facultatif">(facultatif)</span></label><input type="text" inputmode="tel" autocomplete="tel" id="bab-f-telephone" name="telephone" maxlength="' + L.telephone + '" aria-label="Téléphone"><span class="bab-erreur" data-erreur="telephone" hidden></span></p></div>' +
      '<div class="bab-ligne">' + choix("ecole", "Ton école", d.ecoles, "Choisis ton école", true) + (m === "candidater" ? champ("filiere", "Ta filière", "texte", "Par exemple : génie électrique, énergies renouvelables.", L.filiere, true) : "") + '</div>' +
      (m === "candidater" ? '<div class="bab-ligne">' + champ("sortie", "Année de sortie", "texte", "Par exemple : 2027.", 4, true) + choix("cherche", "Ce que tu cherches", d.cherche, "Choisis", true) + choix("domaine", "Le métier qui t'attire", d.domaines, "Choisis", false) + '</div>' : "") +
      champ("message", m === "candidater" ? "Ce qui t'a donné envie" : "Un mot pour l'équipe", "long", "Trois lignes suffisent. Elles sont lues par des gens.", L.message, false) +
      '<p class="bab-case"><input type="checkbox" id="bab-f-visite" name="joindre" checked><label for="bab-f-visite">Joindre ma visite : <span class="bab-visite">' + esc(phraseVisite(visite)) + '</span></label></p>' +
      '<p class="bab-case"><input type="checkbox" id="bab-f-consentement" name="consentement" aria-label="Mon accord" required><label for="bab-f-consentement">' + esc(d.consentement || "J'accepte que la maison garde ces informations pour me recontacter. Je peux demander à tout moment qu'elles soient effacées.") + '</label></p>' +
      '<span class="bab-erreur" data-erreur="consentement" hidden></span>' +
      '<p class="bab-erreur bab-erreur--globale" data-erreur="_" hidden></p>' +
      '<div class="bab-form__actions"><button type="submit" class="zj-bouton">' + (m === "recontact" ? "Envoyer" : "Envoyer ma candidature") + '</button><button type="button" class="zj-bouton zj-bouton--discret" data-bab-fermer>Plus tard</button></div>' +
      (atelier() ? '<p class="bab-form__note">Démo : la candidature reste dans ce navigateur ; la console RH la lit aussitôt.</p>' : "") +
      '</form>';
    corps.__visite = visite;
    ouvrir("bab-candidature");
  }
  function envoyerCandidature(form) {
    var o = lireFormulaire(form), d = ((cfgVie() || {}).discovery) || {}, mode = form.getAttribute("data-mode");
    var c = { mode: mode, prenom: o.prenom, nom: o.nom, email: o.email, telephone: o.telephone, ecole: o.ecole, filiere: o.filiere, sortie: o.sortie,
      cherche: o.cherche, domaine: o.domaine, message: o.message, consentement: o.consentement === true,
      visite: o.joindre ? ici.doc.getElementById("bab-candidature-corps").__visite : null };
    var k = cles(maisonCle()).candidatures;
    var r = candidater(lire(null, k, []), c, d);
    if (!r.ok) { montrerErreurs(form, r.erreurs); return; }
    ecrire(null, k, r.liste);
    noterVisite(mode === "recontact" ? "recontact" : "candidature");
    var corps = ici.doc.getElementById("bab-candidature-corps");
    corps.innerHTML = '<div class="bab-merci"><h3>' + esc(mode === "recontact" ? (d.merciRecontact || "C'est noté.") : (d.merciCandidater || "Ta candidature est partie.")) + '</h3>' +
      '<p>' + esc(mode === "recontact" ? (d.merciRecontactTexte || "") : (d.merciCandidaterTexte || "")) + '</p>' +
      '<button type="button" class="zj-bouton" data-bab-fermer>Revenir dans la maison</button></div>';
    var b = corps.querySelector("button"); if (b) b.focus();
  }
  // Le carnet de visite anonyme : jeu.js le nourrit (noterDayf) ; les portes ici.
  function noterVisite(evenement) {
    var map = { porte_batir: "porte_candidater", porte_apprendre: "porte_recontact" };
    var e = map[evenement] || evenement;
    if (EVENEMENTS.indexOf(e) < 0) return false;
    var k = cles(maisonCle()).visites;
    return ecrire(null, k, noter(lire(null, k, {}), e, aujourdhui()));
  }
  // Une porte du troisième jour a un geste : c'est ce module qui y répond.
  function geste(g) {
    if (g === "candidater" || g === "recontact") { ouvrirCandidature(g); return true; }
    return false;
  }
  // Démo : le visiteur passe au jour suivant sans attendre minuit.
  function demoJourSuivant() {
    try {
      var e = JSON.parse(root.localStorage.getItem("zwj.dayf") || "null") || {};
      var base = jourValide(e.debut) ? e.debut : aujourdhui();
      var d = new Date(base + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1);
      e.debut = d.toISOString().slice(0, 10);
      root.localStorage.setItem("zwj.dayf", JSON.stringify(e));
      root.location.reload();
    } catch (err) { /* navigation privée : la démo attendra demain */ }
  }

  // ---- 4. Le rapport d'étonnement ----
  function cfgEtonnement() { return (cfgVie() || {}).etonnement || null; }
  function monRecu() { var j = joueur(); if (!j) return null; var r = lire(null, cles(maisonCle()).etonnementRecu(j), null); return estObjet(r) && r.id ? r : null; }
  function monRapport() {
    var r = monRecu(); if (!r) return null;
    return etonnements(lire(null, cles(maisonCle()).etonnements, [])).filter(function (x) { return x.id === r.id; })[0] || null;
  }
  // Le jour des quarante, tel que le JEU le regarde. ⚠️ Le jeu tient son joueur en camelCase
  // (arb3ineDebut) ; seule la ligne de la base écrit arb3ine_debut — lire celle-là seule donnait
  // toujours le jour 1, et le signal du 30ᵉ jour ne partait jamais.
  function jourDesQuarante() {
    try {
      var a = app(), j = joueur(), R = root.ZWJ && root.ZWJ.regles;
      if (!R || !j) return 1;
      var debut = (a && a.arb3ineDebut) || j.arb3ineDebut || j.arb3ine_debut;
      return debut ? R.arb3ine(debut).jour : 1;
    } catch (e) { return 1; }
  }
  function ouvrirEtonnement(vue) {
    var doc = ici.doc, corps = doc && doc.getElementById("bab-etonnement-corps"), c = cfgEtonnement() || {};
    if (!corps) return;
    var r = monRapport(), L = LIMITES.etonnement, html = "";
    if (r && vue !== "ecrire") {
      var etat = r.etat === "suite" ? (c.etatSuite || "La maison y a donné suite") : r.etat === "lu" ? (c.etatLu || "Lu par la RH") : (c.etatRecu || "Chez la RH, pas encore lu");
      html += '<div class="bab-etonnement__mien"><p class="bab-fil__meta"><span class="bab-fil__puce' + (r.etat === "suite" ? " bab-fil__puce--epingle" : "") + '">' + esc(etat) + '</span><span>' +
        esc(r.anonyme ? (c.anonymeCourt || "Envoyé sans ton nom") : "Signé " + r.par) + (r.site ? " · " + esc(r.site) : "") + '</span></p>' +
        (r.etat === "suite" && r.mot ? '<p class="bab-memoire__lecon"><span>' + esc(c.motTitre || "Ce que la maison en fait") + '</span>' + br(r.mot) + '</p>' : "") +
        '<h3>' + esc(c.q1 || "Ce qui m'a plu") + '</h3><p>' + br(r.bien) + '</p>' +
        '<h3>' + esc(c.q2 || "Ce qui m'a étonné") + '</h3><p>' + br(r.surpris) + '</p>' +
        (r.idee ? '<h3>' + esc(c.q3 || "Ce que je ferais autrement") + '</h3><p>' + br(r.idee) + '</p>' : "") +
        (r.etat === "recu" ? '<div class="bab-form__actions"><button type="button" class="zj-bouton zj-bouton--discret" data-bab-reecrire>' + esc(c.reecrire || "Le réécrire avant qu'il soit lu") + '</button></div>' : "") + '</div>';
    } else {
      var v = vue === "ecrire" && r ? r : {}, jour = jourDesQuarante();
      html += (jour < L.jour ? '<p class="bab-form__note">' + esc(c.avant || ("On l'attend vers ton " + L.jour + "ᵉ jour. Rien ne t'empêche de l'écrire avant.")) + '</p>' : "") +
        '<form class="bab-form" id="bab-form-etonnement" novalidate>' +
        champ("bien", c.q1 || "Ce qui m'a plu", "long", c.a1 || "Un accueil, un geste, une manière de faire : ce qui t'a fait te dire « ici, c'est bien ».", L.bien[1], true, v.bien) +
        champ("surpris", c.q2 || "Ce qui m'a étonné", "long", c.a2 || "Ce que tu ne comprends pas encore, ce qui t'a surpris, ce qui t'a manqué. Les anciens ne le voient plus : toi, si.", L.surpris[1], true, v.surpris) +
        champ("idee", c.q3 || "Ce que je ferais autrement", "long", c.a3 || "Une idée, même petite. Tu peux laisser vide.", L.idee[1], false, v.idee) +
        champ("site", c.site || "Ton site", "texte", c.aSite || "Pour que la RH sache où regarder. Tu peux laisser vide.", L.site, false, v.site || siteDuJoueur()) +
        '<p class="bab-case"><input type="checkbox" id="bab-f-anonyme" name="anonyme"' + (v.anonyme ? " checked" : "") + '><label for="bab-f-anonyme">' +
        esc(c.anonyme || "Envoyer sans mon nom : la RH lira mon rapport sans savoir qui l'a écrit. Je garde un reçu pour lire sa réponse.") + '</label></p>' +
        '<p class="bab-form__note">' + esc(c.note || "Personne ne te note sur ce que tu écris ici, et ton rapport n'entre jamais dans une évaluation.") + '</p>' +
        '<p class="bab-erreur bab-erreur--globale" data-erreur="_" hidden></p>' +
        '<div class="bab-form__actions"><button type="submit" class="zj-bouton">' + esc(c.envoyer || "Envoyer à la RH") + '</button><button type="button" class="zj-bouton zj-bouton--discret" data-bab-fermer>Plus tard</button></div>' +
        (atelier() ? '<p class="bab-form__note">Démo : le rapport reste dans ce navigateur ; la console RH le lit aussitôt.</p>' : "") + '</form>';
    }
    corps.innerHTML = html;
    if (ici.ouvert !== "bab-etonnement") ouvrir("bab-etonnement");
    if (vue === "ecrire") { var premier = corps.querySelector("textarea"); if (premier) premier.focus(); }
  }
  function envoyerEtonnement(form) {
    var o = lireFormulaire(form), j = joueur() || {}, c = cfgEtonnement() || {};
    var k = cles(maisonCle()).etonnements, recu = monRecu(), anonyme = o.anonyme === true;
    var r = etonner(lire(null, k, []), { bien: o.bien, surpris: o.surpris, idee: o.idee, site: o.site, anonyme: anonyme },
      { par: anonyme ? "" : j.pseudo, remplace: recu && recu.id });
    if (!r.ok) { montrerErreurs(form, r.erreurs); return; }
    ecrire(null, k, r.liste);
    ecrire(null, cles(maisonCle()).etonnementRecu(j), { id: r.rapport.id });
    var corps = ici.doc.getElementById("bab-etonnement-corps");
    corps.innerHTML = '<div class="bab-merci"><h3>' + esc(c.merci || "Ton rapport est parti à la RH.") + '</h3><p>' +
      esc(anonyme ? (c.merciAnonyme || "Sans ton nom : la RH le lira sans savoir qui l'a écrit. Reviens ici pour lire sa réponse.") : (c.merciSigne || "La RH le lira. Reviens ici pour lire ce qu'elle en fait.")) + '</p>' +
      '<button type="button" class="zj-bouton" data-bab-fermer>Revenir dans la maison</button></div>';
    var b = corps.querySelector("button"); if (b) b.focus();
  }
  // Au 30ᵉ jour, une seule fois, quand la cour est libre : « tes yeux sont encore neufs ».
  function signalerEtonnement() {
    var c = cfgEtonnement(), doc = ici.doc, j = joueur();
    if (!c || !doc || !j || visiteur() || !courLibre()) return;
    if (!ici.libreDepuis || Date.now() - ici.libreDepuis < 6000) return;
    var fa = doc.getElementById("bab-fil-annonce"); if (fa && !fa.hidden) return;
    if (monRecu() || jourDesQuarante() < LIMITES.etonnement.jour) return;
    var k = cles(maisonCle()).etonnementSignale(j);
    if (lire(null, k, false)) return;
    ecrire(null, k, true);
    var b = doc.getElementById("bab-etonnement-annonce");
    if (!b) {
      b = doc.createElement("button");
      b.id = "bab-etonnement-annonce"; b.type = "button"; b.className = "bab-annonce";
      b.addEventListener("click", function () { b.hidden = true; ouvrirEtonnement(); });
      doc.body.appendChild(b);
    }
    b.innerHTML = '<span class="bab-annonce__kicker">' + esc(c.signalKicker || "Ton " + LIMITES.etonnement.jour + "ᵉ jour") + '</span><strong>' + esc(c.signal || "Tes yeux sont encore neufs : écris ton rapport d'étonnement.") + '</strong><span class="bab-annonce__lire">' + esc(c.signalLire || "Écrire") + '</span>';
    b.hidden = false;
    setTimeout(function () { b.hidden = true; }, 12000);
  }

  // Ce qui dépend de l'état du jeu : qui voit quelles commandes, la pastille de démo.
  function rafraichir() {
    var doc = ici.doc, c = cfgVie(); if (!doc || !c) return;
    var inv = visiteur(), a = app(), enCour = !!(a && a.ecran === "cour" && a.joueur);
    // la liste blanche de la maison a le dernier mot : ce qu'elle ne nomme pas reste caché
    var M = root.ZWJ && root.ZWJ.maison, permis = function (k) { return !M || !M.menuPermis || M.menuPermis(M.config(), k); };
    var bf = doc.getElementById("zj-menu-fil"); if (bf) bf.hidden = !(c.fil && permis("fil"));
    var bm = doc.getElementById("zj-menu-memoire"); if (bm) bm.hidden = !(c.memoire && permis("memoire"));
    var bc = doc.getElementById("zj-menu-candidater"); if (bc) bc.hidden = !(c.discovery && inv && permis("candidater"));
    var be = doc.getElementById("zj-menu-etonnement"); if (be) be.hidden = !(c.etonnement && !inv && permis("etonnement"));
    var demo = doc.getElementById("bab-demo-jour");
    if (demo) {
      var j = 1;
      try { var Dy = root.ZWJ.dayf; j = Dy.jour(a.dayfEtat, aujourdhui()); } catch (e) { /* jour 1 */ }
      demo.hidden = !(c.discovery && inv && enCour && atelier() && j < 3 && !a.dialogue && !a.menuOuvert && !ici.ouvert);
      demo.textContent = "Démo · passer au jour " + (j + 1);
    }
    var pf = doc.getElementById("bab-fil-pastille");
    if (pf && c.fil) { var n = joueur() ? nonLues(nouvellesDuFil(), lusDuFil()).length : 0; pf.textContent = String(n); pf.hidden = !n; }
  }

  function demarrer(doc) {
    doc = doc || (typeof document !== "undefined" ? document : null);
    var c = cfgVie();
    if (!doc || !c || !doc.getElementById("zj-menu")) return false;
    ici.doc = doc; ici.cfg = c;
    if (c.fil) {
      var bf = commande(doc, "fil", (c.fil.nom || "Le Fil de la maison"), "wird");
      if (bf) { bf.innerHTML = esc(c.fil.nom || "Le Fil de la maison") + ' <span class="bab-pastille" id="bab-fil-pastille" hidden></span>'; bf.addEventListener("click", ouvrirFil); }
      carteDar("fil", c.fil.porte || "apprendre", c.fil.icone || "lawh", c.fil.nom || "Le Fil de la maison", c.fil.pourquoi || "Ce que la maison annonce.", ["fil", "nouvelles", "actualites", "annonces", "infos"]);
      panneau(doc, "bab-fil", c.fil.kicker || "Ce que la maison annonce", c.fil.nom || "Le Fil de la maison", c.fil.lead || "");
    }
    if (c.memoire) {
      var bm = commande(doc, "memoire", c.memoire.nom || "La mémoire des anciens", "carnet");
      if (bm) bm.addEventListener("click", function () { ouvrirMemoire(); });
      carteDar("memoire", c.memoire.porte || "apprendre", c.memoire.icone || "sablier", c.memoire.nom || "La mémoire des anciens", c.memoire.pourquoi || "Ce que savent les anciens.", ["memoire", "anciens", "transmettre", "savoir", "experts"]);
      panneau(doc, "bab-memoire", c.memoire.kicker || "Ce qu'aucune procédure ne dit", c.memoire.nom || "La mémoire des anciens", c.memoire.lead || "");
      doc.getElementById("bab-memoire").addEventListener("click", function (e) {
        var t = e.target.closest ? e.target.closest("[data-bab-repondre], [data-bab-rallumer], [data-bab-ecrire], [data-bab-retour-memoire]") : null;
        if (!t) return;
        if (t.hasAttribute("data-bab-ecrire")) { ouvrirMemoire("ecrire"); return; }
        if (t.hasAttribute("data-bab-retour-memoire")) { ouvrirMemoire(); return; }
        if (t.hasAttribute("data-bab-rallumer")) { rallumer(t.getAttribute("data-bab-rallumer")); ouvrirMemoire(); return; }
        var cle = t.getAttribute("data-bab-repondre"), m = memoiresPubliees().filter(function (x) { return x.cle === cle; })[0];
        if (!m) return;
        var ch = Number(t.getAttribute("data-choix")), r = repondreMemoire(m, ch);
        ici.reponses[cle] = { choix: ch, juste: r.juste, explication: r.explication };
        if (r.juste) rallumer(cle);
        ouvrirMemoire();
      });
    }
    if (c.etonnement) {
      var ce = c.etonnement;
      var be = commande(doc, "etonnement", ce.nom || "Mon rapport d'étonnement", "carnet");
      if (be) be.addEventListener("click", function () { ouvrirEtonnement(); });
      carteDar("etonnement", ce.porte || "partager", ce.icone || "loupe", ce.nom || "Mon rapport d'étonnement", ce.pourquoi || "Ce qui t'étonne ici, dit à la RH.", ["etonnement", "rapport", "surpris", "avis", "idee", "retour"]);
      panneau(doc, "bab-etonnement", ce.kicker || "Tes yeux sont encore neufs", ce.nom || "Mon rapport d'étonnement", ce.lead || "");
      doc.getElementById("bab-etonnement").addEventListener("click", function (e) {
        var t = e.target.closest ? e.target.closest("[data-bab-reecrire]") : null;
        if (t) ouvrirEtonnement("ecrire");
      });
    }
    if (c.discovery) {
      // L'écran d'accueil : l'entrée du visiteur devient celle des étudiants.
      var pt = c.discovery.porte || {}, bloc = doc.querySelector(".zj-dyaf");
      if (bloc) {
        var mot = bloc.querySelector(".zj-dyaf__mot"), leg = bloc.querySelector(".zj-dyaf__legende"), ent = doc.getElementById("zj-dyaf-entrer");
        if (mot && pt.mot) mot.textContent = pt.mot;
        if (leg && pt.legende) leg.textContent = pt.legende;
        if (ent && pt.bouton) ent.textContent = pt.bouton;
        bloc.classList.add("bab-discovery");
      }
      var tq = doc.getElementById("zj-dyaf-portes-nom");
      if (tq && c.discovery.question) tq.textContent = c.discovery.question;
      var bc = commande(doc, "candidater", c.discovery.menu || "Postuler, ou être recontacté", "dyaf");
      if (bc) bc.addEventListener("click", function () { ouvrirCandidature("candidater"); });
      carteDar("candidater", c.discovery.porteDar || "apprendre", c.discovery.icone || "cle", c.discovery.menu || "Postuler, ou être recontacté", c.discovery.pourquoi || "Un stage, un premier emploi : dis-le à ceux qui recrutent.", ["postuler", "candidature", "stage", "pfe", "emploi", "recrutement"]);
      panneau(doc, "bab-candidature", c.discovery.kicker || "Discovery", c.discovery.titreCandidater || "Postuler", "");
      var demo = doc.createElement("button");
      demo.id = "bab-demo-jour"; demo.type = "button"; demo.className = "bab-demo-jour"; demo.hidden = true;
      demo.addEventListener("click", demoJourSuivant);
      doc.body.appendChild(demo);
    }
    doc.addEventListener("submit", function (e) {
      var f = e.target;
      if (!f || !f.id) return;
      if (f.id === "bab-form-memoire") { e.preventDefault(); envoyerMemoire(f); }
      else if (f.id === "bab-form-candidature") { e.preventDefault(); envoyerCandidature(f); }
      else if (f.id === "bab-form-etonnement") { e.preventDefault(); envoyerEtonnement(f); }
    });
    doc.addEventListener("input", function (e) {
      var t = e.target; if (!t || !t.name || !t.form || !/^bab-form-/.test(t.form.id || "")) return;
      t.removeAttribute("aria-invalid");
      var s = t.form.querySelector('[data-erreur="' + t.name + '"]'); if (s) s.hidden = true;
    });
    // Échap ferme nos panneaux avant que le jeu ne l'entende.
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && ici.ouvert) { e.preventDefault(); e.stopImmediatePropagation(); var r = ici.retour; fermer(); if (r && r.focus) try { r.focus(); } catch (x) { /* rien */ } }
    }, true);
    ici.minuteur = setInterval(function () { rafraichir(); signalerFil(); signalerEtonnement(); }, 900);
    return true;
  }

  // ---- Au chargement : le visiteur de la maison, puis le DOM ----
  if (root.ZWJ_MAISON && root.ZWJ_MAISON.vie) {
    var d = root.ZWJ_MAISON.vie.discovery;
    if (d && d.visiteur && root.ZWJ && root.ZWJ.dayf) appliquerVisiteur(root.ZWJ.dayf, d.visiteur);
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { demarrer(document); });
      else demarrer(document);
    }
  }

  return {
    LIMITES: LIMITES, EVENEMENTS: EVENEMENTS, STATUTS: STATUTS, GESTES: GESTES,
    // le Fil
    normaliserNouvelle: normaliserNouvelle, fil: fil, programmees: programmees, nonLues: nonLues, dateLisible: dateLisible,
    // la mémoire
    normaliserMemoire: normaliserMemoire, validerMemoire: validerMemoire, aUneQuestion: aUneQuestion, repondreMemoire: repondreMemoire,
    normaliserProposition: normaliserProposition, propositions: propositions, proposer: proposer, publier: publier, refuser: refuser, rouvrir: rouvrir,
    // Discovery
    normaliserCandidature: normaliserCandidature, validerCandidature: validerCandidature, candidater: candidater,
    resumeVisite: resumeVisite, phraseVisite: phraseVisite, noter: noter, entonnoir: entonnoir, additionner: additionner,
    appliquerVisiteur: appliquerVisiteur,
    // le rapport d'étonnement
    ETATS_ETONNEMENT: ETATS_ETONNEMENT, normaliserEtonnement: normaliserEtonnement, etonnements: etonnements, validerEtonnement: validerEtonnement,
    etonner: etonner, repondreEtonnement: repondreEtonnement, bilanEtonnements: bilanEtonnements, csvEtonnements: csvEtonnements,
    // le rangement
    cles: cles, lire: lire, ecrire: ecrire, ecrireSection: ecrireSection, jourValide: jourValide, jourDe: jourDe,
    // au navigateur
    demarrer: demarrer, noterVisite: noterVisite, geste: geste, ouvrirFil: ouvrirFil, ouvrirMemoire: ouvrirMemoire, ouvrirCandidature: ouvrirCandidature, ouvrirEtonnement: ouvrirEtonnement, jourDesQuarante: jourDesQuarante, fermer: fermer,
    get ouvert() { return ici.ouvert; }
  };
});
