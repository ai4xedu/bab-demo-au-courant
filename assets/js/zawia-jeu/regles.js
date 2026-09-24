// ZAW'IA — le jeu · LES RÈGLES (pures : ni DOM, ni réseau, ni canvas).
//
// Tout ce que la charte (/valeurs) dit des rangs, ce que le jeu décide de
// l'Arb3ine, et les TROIS AXES de notation — M39ol (communauté), Sna3a
// (technique), Dhakira (culture marocaine) — vivent ici, et nulle part ailleurs : rendu.js ne connaît pas les
// rangs, jeu.js ne calcule pas de jours. Testable sous Node tel quel.
//
// Script classique (pas de `type="module"`) : la page doit s'ouvrir aussi en
// file://. Sous Node, `module.exports` porte la même API.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.regles = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var JOUR_MS = 24 * 60 * 60 * 1000;

  // ---- Les rangs, tels que la charte les nomme (zawia-valeurs.html) ----------
  // Le Morchid n'a pas de seuil : il est élu, pas gagné.
  var RANGS = [
    { cle: "talib",    nom: "Talib",    ar: "طالب",           sous: "Celui qui cherche",     m39ol: 0 },
    { cle: "mt3ellem", nom: "Mt3ellem", ar: "متعلّم", sous: "L'apprenti",            m39ol: 100 },
    { cle: "m3ellem",  nom: "M3ellem",  ar: "معلّم",       sous: "Le maître-artisan", m39ol: 400 },
    { cle: "fqih",     nom: "Fqih",     ar: "فقيه",           sous: "La référence", m39ol: 1200 },
    { cle: "morchid",  nom: "Morchid",  ar: "مرشد",           sous: "Le guide de la Zawia",  m39ol: null }
  ];

  function rang(cle) {
    for (var i = 0; i < RANGS.length; i++) if (RANGS[i].cle === cle) return RANGS[i];
    return RANGS[0];
  }

  // Le rang que DONNE un solde de M39ol. Le Morchid n'a pas de seuil : il est
  // élu, jamais atteint — on ne peut donc pas le déduire, seulement le poser.
  function rangPour(m39ol) {
    var n = Number(m39ol);
    if (isNaN(n) || n < 0) n = 0;
    var r = RANGS[0];
    for (var i = 0; i < RANGS.length; i++) if (RANGS[i].m39ol !== null && n >= RANGS[i].m39ol) r = RANGS[i];
    return r;
  }

  // ---- L'axe COMMUNAUTAIRE : le M39ol ------------------------------------------------
  // Il ne se calcule pas dans le navigateur : il se REÇOIT (le témoin, la
  // salle, le bureau) et il compte aussi les présences aux sessions de la
  // maison. Le jeu ne fait que le lire et le montrer — un joueur ne peut pas
  // s'en donner. Tant que le registre n'existe pas, il vaut zéro et le dit.
  function communaute(j) {
    j = j || {};
    var points = Number(j.m39ol);
    if (isNaN(points) || points < 0) points = 0;
    points = Math.floor(points);
    var presences = Number(j.presences);
    if (isNaN(presences) || presences < 0) presences = 0;
    presences = Math.floor(presences);
    // Le rang écrit sur la ligne prime (le bureau peut l'avoir posé, cas du
    // Morchid) ; sinon on le déduit du solde.
    var pose = null;
    for (var i = 0; i < RANGS.length; i++) if (RANGS[i].cle === j.rang) pose = RANGS[i];
    var r = pose && pose.cle !== "talib" ? pose : rangPour(points);
    var suivant = null;
    for (var k = 0; k < RANGS.length; k++) {
      if (RANGS[k].m39ol !== null && RANGS[k].m39ol > points) { suivant = { rang: RANGS[k], manque: RANGS[k].m39ol - points }; break; }
    }
    return { points: points, presences: presences, rang: r, suivant: suivant };
  }

  // ---- L'Arb3ine : 40 jours pour les 4 premiers défis --------------------------
  // « 40 jours même si c'est 42 » : six semaines de meetups tiennent dans
  // l'Arb3ine parce que c'est le NOMBRE qui compte, pas le calendrier.
  var ARB3INE_JOURS = 40;

  var DEFIS = [
    { cle: "meetups", titre: "Assister à tous les meetups",  detail: "Six semaines, toutes les halqas — sans en manquer une." },
    { cle: "cours",   titre: "Finir le cours d'initiation IA",    detail: "Celui que la maison offre à chaque Talib. En entier." },
    { cle: "reseau",  titre: "Réseauter avec 10 membres",   detail: "Dix conversations vraies, pas dix cartes de visite." },
    { cle: "savoir",  titre: "Partager un savoir utile",          detail: "Une chose que tu sais et qu'un autre ne savait pas — dite à la halqa ou posée sur ta ferracha." }
  ];
  var ETATS_DEFI = ["a_faire", "en_cours", "valide"];

  function defisParDefaut() {
    var d = {};
    DEFIS.forEach(function (x) { d[x.cle] = "a_faire"; });
    return d;
  }

  // Une valeur inconnue retombe à « à faire » : on ne crédite jamais un défi
  // sur une faute de frappe.
  function normaliserDefis(d) {
    var propre = defisParDefaut();
    if (d && typeof d === "object") {
      DEFIS.forEach(function (x) {
        if (ETATS_DEFI.indexOf(d[x.cle]) !== -1) propre[x.cle] = d[x.cle];
      });
    }
    return propre;
  }

  // arb3ine(debut, maintenant) → où en est le Talib.
  //   joursRestants : entier, plafonné à 0. Au premier instant : 40.
  //   jour          : le jour en cours, de 1 à 40 (40 reste affiché après).
  //   ecoule        : vrai dès que les 40 jours sont passés.
  function arb3ine(debut, maintenant) {
    var t0 = debut instanceof Date ? debut.getTime() : new Date(debut).getTime();
    var now = maintenant == null ? Date.now() : (maintenant instanceof Date ? maintenant.getTime() : new Date(maintenant).getTime());
    if (isNaN(t0)) t0 = now;
    var fin = t0 + ARB3INE_JOURS * JOUR_MS;
    var restants = Math.ceil((fin - now) / JOUR_MS);
    if (restants < 0) restants = 0;
    if (restants > ARB3INE_JOURS) restants = ARB3INE_JOURS;
    var jour = ARB3INE_JOURS - restants + 1;
    if (jour > ARB3INE_JOURS) jour = ARB3INE_JOURS;
    if (jour < 1) jour = 1;
    var ecoule = restants === 0;
    return {
      debut: new Date(t0).toISOString(),
      fin: new Date(fin).toISOString(),
      joursRestants: restants,
      jour: jour,
      total: ARB3INE_JOURS,
      ecoule: ecoule,
      libelle: ecoule ? "Arb3ine écoulée" : "J-" + restants
    };
  }

  // ---- L'axe TECHNIQUE : la Sna3a ---------------------------------------------------
  // Ce que le joueur sait FAIRE avec l'IA, mesuré par les Ta7addi : ceux de la
  // maison (corrigés par le jeu, tahaddi.js) et ceux d'entreprise (attestés sur
  // le livrable). À ne confondre ni avec le M39ol — le rang, qui vient des
  // autres — ni avec les Imtiyazat, les options que l'achat donne. Elle est
  // publique : « les points diront à tous qui a la main ». Elle ne donne JAMAIS
  // un rang ni un point de M39ol. Trois voies.
  var VOIES = [
    { cle: "prompt", nom: "Dire juste",     ar: "قول صحيح",  detail: "Formuler la demande pour que le modèle réponde à la bonne question." },
    { cle: "image",  nom: "Voir juste",     ar: "شوف صحيح",  detail: "Générer une image, puis la confronter au réel : ce qu'elle invente, ce qu'elle garde." },
    { cle: "savoir", nom: "Vérifier juste", ar: "تحقّق صحيح", detail: "Savoir ce qu'un modèle sait, ce qu'il devine — et où aller voir." }
  ];
  // Quatre niveaux d'artisan. Ce ne sont PAS les rangs de la charte : un Talib
  // peut être Mtqen, un Fqih peut être Mbtadi. Les seuils sont des données —
  // à retoucher quand l'établi compte plus de neuf Ta7addi.
  var SNA3A_NIVEAUX = [
    { cle: "mbtadi", nom: "Mbtadi", ar: "مبتدي", sous: "Il commence",     seuil: 0 },
    { cle: "sani3",  nom: "Sani3",  ar: "صانع",  sous: "Il fabrique",     seuil: 30 },
    { cle: "hadeq",  nom: "7adeq",  ar: "حاذق",  sous: "Il a la main",    seuil: 70 },
    // v3.6 : seize Ta7addi (dix de la maison + six du Wird) à 15 points au plus —
    // Mtqen se gagne à onze sans faute, pas à huit. Un niveau que tout le monde
    // plafonne ne dit plus rien.
    { cle: "mtqen",  nom: "Mtqen",  ar: "متقن",  sous: "Le geste juste",  seuil: 160 }
  ];

  // ---- L'axe CULTURE : la Dhakira ----------------------------------------------------
  // La mémoire — le contraire exact de Nsyan. Ce que le joueur sait de
  // l'histoire du pays, gagné page perdue après page perdue. Un seul compteur :
  // on ne découpe pas la mémoire d'un pays en spécialités. Ne donne, elle non
  // plus, ni rang ni M39ol.
  var DHAKIRA_NIVEAUX = [
    { cle: "ghrib",  nom: "Ghrib",     ar: "غريب",       sous: "Il arrive",        seuil: 0 },
    { cle: "wled",   nom: "Wled lblad", ar: "ولد البلاد", sous: "Il est d'ici",     seuil: 30 },
    { cle: "3arif",  nom: "3arif",     ar: "عارف",       sous: "Il connaît",       seuil: 70 },
    { cle: "rawi",   nom: "Rawi",      ar: "راوي",       sous: "Il peut raconter", seuil: 110 }
  ];

  function paliers(niveaux, total) {
    var n = Number(total);
    if (isNaN(n) || n < 0) n = 0;
    n = Math.floor(n);
    var niveau = niveaux[0], prochain = null;
    for (var i = 0; i < niveaux.length; i++) {
      if (n >= niveaux[i].seuil) niveau = niveaux[i];
      else { prochain = { niveau: niveaux[i], manque: niveaux[i].seuil - n }; break; }
    }
    return { total: n, niveau: niveau, prochain: prochain };
  }

  // dhakira(points) → { total, niveau, prochain }
  function dhakira(points) { return paliers(DHAKIRA_NIVEAUX, points); }

  function voie(cle) {
    for (var i = 0; i < VOIES.length; i++) if (VOIES[i].cle === cle) return VOIES[i];
    return null;
  }

  function sna3aParDefaut() {
    var s = {};
    VOIES.forEach(function (v) { s[v.cle] = 0; });
    return s;
  }

  // Un compteur abîmé retombe voie par voie à zéro — jamais en dessous, jamais
  // sur une erreur.
  function normaliserSna3a(s) {
    var propre = sna3aParDefaut();
    if (s && typeof s === "object") {
      VOIES.forEach(function (v) {
        var n = typeof s[v.cle] === "number" ? s[v.cle] : parseInt(s[v.cle], 10);
        if (!isNaN(n) && n > 0) propre[v.cle] = Math.floor(n);
      });
    }
    return propre;
  }

  // Ajouter des points sur une voie : renvoie un NOUVEL objet ; une voie
  // inconnue ou des points négatifs ne changent rien.
  function ajouterSna3a(s, cleVoie, points) {
    var propre = normaliserSna3a(s);
    var n = Number(points) || 0;
    if (voie(cleVoie) && n > 0) propre[cleVoie] += Math.floor(n);
    return propre;
  }

  // sna3a(compteur, attestee?) → { parVoie, total, niveau, prochain: { niveau, manque } | null }
  // v6.1 — `attestee` : la Sna3a des livrables attestés par le bureau (les
  // Masarat, colonne sna3a_attestee, épinglée par la garde). Elle s'ajoute voie
  // par voie : le HUD, le carnet et le Kounnach comptent le même nombre que la base.
  function sna3a(s, attestee) {
    var parVoie = normaliserSna3a(s), plus = normaliserSna3a(attestee);
    VOIES.forEach(function (v) { parVoie[v.cle] += plus[v.cle]; });
    var total = 0;
    VOIES.forEach(function (v) { total += parVoie[v.cle]; });
    var p = paliers(SNA3A_NIVEAUX, total);
    return { parVoie: parVoie, total: p.total, niveau: p.niveau, prochain: p.prochain };
  }

  // ---- LE CARNET : les trois axes, côte à côte ----------------------------------------
  // C'est la note du joueur, et elle tient en trois lignes qui ne se
  // convertissent pas l'une dans l'autre : ce qu'il a DONNÉ à la maison, ce
  // qu'il sait FAIRE, ce qu'il sait de SON PAYS.
  function carnet(j) {
    j = j || {};
    return {
      m39ol: communaute(j),
      sna3a: sna3a(j.sna3a, j.sna3aAttestee),
      dhakira: dhakira(j.dhakira)
    };
  }

  // ---- Le personnage --------------------------------------------------------
  // Six teintes de peau, huit djellabas, six couvre-chefs. Les VALEURS
  // enregistrées sont des index et des clés — jamais des couleurs : on peut
  // retoucher la palette sans toucher aux joueurs.
  var PEAUX = ["#f7dcc4", "#e9bd97", "#c9905f", "#a3683e", "#7b4b2b", "#4d2f1f"];

  var DJELLABAS = [
    { cle: "fes",        nom: "Blanc de Fès", hex: "#efe6d3" },
    { cle: "indigo",     nom: "Indigo",            hex: "#3b4d9c" },
    { cle: "emeraude",   nom: "Émeraude",     hex: "#1f8a5e" },
    { cle: "terracotta", nom: "Terracotta",        hex: "#cf6b45" },
    { cle: "safran",     nom: "Safran",            hex: "#d9a441" },
    { cle: "grenat",     nom: "Grenat",            hex: "#8a2b3c" },
    { cle: "majorelle",  nom: "Majorelle",         hex: "#6a7dff" },
    { cle: "nuit",       nom: "Nuit",              hex: "#2a3440" }
  ];

  var TETES = [
    { cle: "cheveux",   nom: "Cheveux",          detail: "Tête nue, cheveux courts." },
    { cle: "capuche",   nom: "Qob",              detail: "La capuche de la djellaba, relevée." },
    { cle: "tarbouche", nom: "Tarbouche",        detail: "Le fez rouge, gland noir." },
    { cle: "taqiya",    nom: "Taqiya",           detail: "La calotte blanche." },
    { cle: "hijab",     nom: "Hijab",            detail: "Le foulard, ton sur ton." },
    { cle: "turban",    nom: "Rezza",            detail: "Le turban de coton." }
  ];

  // Les cinq axes du visage et des cheveux vivent dans `traits.js` — leur
  // catalogue y est, et leur validation aussi. On les lit à l'exécution
  // plutôt qu'à l'import : regles.js reste chargeable seul (les tests des
  // rangs et de l'Arb3ine n'ont rien à voir avec une moustache), et un avatar
  // garde alors ses traits tels quels au lieu de les perdre.
  function traits() {
    var r = typeof window !== "undefined" ? window : globalThis;
    return (r.ZWJ && r.ZWJ.traits) || null;
  }

  function avatarParDefaut() {
    var a = { peau: 2, djellaba: 0, tete: "cheveux" };
    var T = traits();
    if (T) { var d = T.parDefaut(); for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) a[k] = d[k]; }
    return a;
  }

  function indexValide(v, max, defaut) {
    var n = typeof v === "number" ? v : parseInt(v, 10);
    if (isNaN(n) || n < 0 || n >= max) return defaut;
    return n;
  }

  // Un avatar inconnu ou abîmé retombe champ par champ sur le défaut — jamais
  // sur une erreur : un personnage doit toujours pouvoir se dessiner.
  function normaliserAvatar(a) {
    var d = avatarParDefaut();
    a = a && typeof a === "object" ? a : {};
    var tete = d.tete;
    for (var i = 0; i < TETES.length; i++) if (TETES[i].cle === a.tete) tete = a.tete;
    var out = {
      peau: indexValide(a.peau, PEAUX.length, d.peau),
      djellaba: indexValide(a.djellaba, DJELLABAS.length, d.djellaba),
      tete: tete
    };
    // ⚠️ Cette fonction REND UN OBJET NEUF : tout champ oublié ici disparaît du
    // personnage enregistré. Les cinq axes de traits.js passent donc par leur
    // propre normalisation, et jamais par un copier-coller à la main.
    var T = traits();
    if (T) { var t = T.normaliser(a); for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) out[k] = t[k]; }
    return out;
  }

  // ---- Le pseudo ------------------------------------------------------------
  // Lettres de n'importe quel alphabet (l'arabe compris), chiffres, espaces,
  // apostrophe, tiret, point, souligné. 3 à 20 caractères après nettoyage.
  var RE_PSEUDO = /^[\p{L}\p{N}][\p{L}\p{N} '\-_.]*$/u;

  function validerPseudo(brut) {
    var v = String(brut == null ? "" : brut).replace(/\s+/g, " ").trim();
    if (v.length < 3) return { ok: false, valeur: v, erreur: "Trois caractères au moins." };
    if (v.length > 20) return { ok: false, valeur: v, erreur: "Vingt caractères au plus." };
    if (!RE_PSEUDO.test(v)) return { ok: false, valeur: v, erreur: "Lettres, chiffres, espaces, apostrophe, tiret ou point — rien d'autre." };
    return { ok: true, valeur: v, erreur: null };
  }

  // ---- Un joueur neuf ------------------------------------------------------------
  // L'Arb3ine part de la CRÉATION DU PERSONNAGE, pas du compte : on ne compte
  // pas les jours d'un Talib qui n'est jamais entré dans la cour.
  function nouveauJoueur(o) {
    o = o || {};
    var quand = o.maintenant ? new Date(o.maintenant) : new Date();
    return {
      id: o.id || null,
      pseudo: o.pseudo,
      avatar: normaliserAvatar(o.avatar),
      rang: "talib",
      arb3ineDebut: quand.toISOString(),
      defis: defisParDefaut(),
      position: null,
      // v1.3 — les trois axes de notation.
      m39ol: 0,            // communauté — écrit par le bureau/le témoin, jamais ici
      presences: 0,        // sessions de la maison — idem
      sna3a: sna3aParDefaut(),  // technique — les Ta7addi
      tahaddi: {},
      dhakira: 0,          // culture marocaine — les pages perdues
      pages: {},
      recit: {}
    };
  }

  // ---- Couleur : une nuance plus sombre ou plus claire d'un hex --------------
  // Sert au rendu (ombre de la djellaba) et à l'atelier (pastilles). Pure.
  function nuance(hex, facteur) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return hex;
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { v = Math.round(facteur >= 1 ? v + (255 - v) * (facteur - 1) : v * facteur); return Math.max(0, Math.min(255, v)); }
    var out = (c(r) << 16) | (c(g) << 8) | c(b);
    return "#" + ("000000" + out.toString(16)).slice(-6);
  }

  return {
    RANGS: RANGS, rang: rang, rangPour: rangPour, communaute: communaute,
    ARB3INE_JOURS: ARB3INE_JOURS, arb3ine: arb3ine,
    DEFIS: DEFIS, ETATS_DEFI: ETATS_DEFI, defisParDefaut: defisParDefaut, normaliserDefis: normaliserDefis,
    VOIES: VOIES, voie: voie, SNA3A_NIVEAUX: SNA3A_NIVEAUX, DHAKIRA_NIVEAUX: DHAKIRA_NIVEAUX,
    sna3aParDefaut: sna3aParDefaut, normaliserSna3a: normaliserSna3a, ajouterSna3a: ajouterSna3a, sna3a: sna3a,
    dhakira: dhakira, carnet: carnet,
    PEAUX: PEAUX, DJELLABAS: DJELLABAS, TETES: TETES,
    avatarParDefaut: avatarParDefaut, normaliserAvatar: normaliserAvatar,
    validerPseudo: validerPseudo, nouveauJoueur: nouveauJoueur,
    nuance: nuance
  };
});
