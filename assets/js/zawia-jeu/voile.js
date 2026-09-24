// ZAW'IA — le jeu · LE VOILÉ (الملثّم) : comment Al-Moulaththam APPARAÎT (v7.4, 21/09/2026) — pur.
//
// oumm.js dit QUI il est : sept tableaux, et pas un nom. Ce module dit COMMENT
// on le croise. Trois niveaux, et la qubba les promettait déjà (Om.QUBBA.pied) :
//
//   1. LA RUMEUR — ce que les gens de la cour disent de lui, certains jours.
//      Une légende se bâtit par ce qu'on en raconte avant d'apparaître.
//   2. LE SIGNAL — une silhouette à contre-jour sur la galerie du minaret,
//      après l'heure de la halqa, quelques dizaines de secondes. Les fenêtres
//      se tirent du hachage du JOUR : tous ceux qui sont dans la cour à cette
//      minute-là voient la même chose, sans aucun serveur. Inatteignable par
//      construction (le minaret est un mur), jamais annoncé (un mystère inscrit
//      au calendrier n'est plus un mystère).
//   3. LA RENCONTRE — une fois, sur la Rahba, devant SON tapis, pour qui a
//      tenu son Wird, rendu quelque chose à la maison et étalé. Trois pages,
//      et un mot : celui du défi du Voilé, la preuve nº 1 (oumm.js), qui vient
//      du serveur (zawia-voile.sql). Puis « Étale. Ne raconte pas. »
//
// ⚠️⚠️ JAMAIS DÉMASQUÉ (décision D1, 21/09/2026). Ni à la 100ᵉ carte, ni jamais.
//    Le litham EST le personnage. Les seules « révélations » sont des RUMEURS,
//    rares, qui désignent Si Mehdi — le Gardien de Rabat, un personnage de la
//    série. Une rumeur qui viserait une personne réelle serait une faute.
//
// ⚠️ NUMÉRO 1, MAIS JAMAIS AU LAWH. Aucun compte, aucun M39ol, aucun rang. Il
//    est hors échelle : personne ne devient lui, chacun peut devenir un des
//    Moulaththamoun (le pluriel est l'original : c'est le nom des Almoravides).
//
// ⚠️ IL ARRIVE APRÈS LE TRAVAIL, jamais à sa place. Jamais pendant une défaite,
//    jamais quand on est bloqué, jamais pour un invité qui n'a rien étalé.
//    « Il ne te sauve pas, il t'outille » (le film). Il ne parle jamais de lui.
//
// ⚠️ SON SIGNE EST L'OR d'une lanterne : le gris est à Nsyan, le flou à Oumm IA.
// ⚠️ AUCUN POINT ici, AUCUN NOM réel, AUCUN LIEN. Jamais le hasard du navigateur :
//    tout vient de hache(), comme dans pnj.js — deux joueurs voient la même cour.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.voile = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var FUSEAU = "Africa/Casablanca";

  // ---- Le hasard REPRODUCTIBLE — le même que pnj.js, rendu.js et intro.js -----------------
  function hache(x, y, s) {
    var n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s || 0, 2246822519)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function graine(cle) {
    var g = 7, s = String(cle || "");
    for (var i = 0; i < s.length; i++) g = (Math.imul(g, 31) + s.charCodeAt(i)) | 0;
    return g;
  }

  // ---- L'horloge de la maison ------------------------------------------------------------
  // Le jour et la seconde de Casablanca : c'est elle qui décide, pas celle du
  // joueur — un joueur à Paris et un joueur à Fès voient la même fenêtre.
  function horloge(maintenant) {
    var d = maintenant instanceof Date ? maintenant : new Date(maintenant === undefined || maintenant === null ? Date.now() : maintenant);
    var jour = null, sec = null;
    try {
      var parts = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      if (o.year && o.month && o.day && o.hour !== undefined) {
        jour = o.year + "-" + o.month + "-" + o.day;
        sec = (Number(o.hour) % 24) * 3600 + Number(o.minute || 0) * 60 + Number(o.second || 0);
      }
    } catch (e) { /* repli ci-dessous */ }
    if (jour === null) {
      var r = new Date(d.getTime() + 3600 * 1000);   // Casablanca vit à UTC+1 hors Ramadan
      jour = r.toISOString().slice(0, 10);
      sec = r.getUTCHours() * 3600 + r.getUTCMinutes() * 60 + r.getUTCSeconds();
    }
    return { jour: jour, seconde: sec };
  }

  // ---- 2. LE SIGNAL : la silhouette sur le minaret -----------------------------------------
  // Après la halqa (elle finit à 21 h), et jusqu'à minuit : trois créneaux
  // d'une heure, une fenêtre de quarante secondes dans chacun, à une place
  // tirée du jour. Trois créneaux disjoints : jamais deux fenêtres qui se
  // chevauchent, jamais plus de trois par soir.
  var HEURE_DEBUT = 21;          // heure de Casablanca — « Sauf une nuit. Sur un toit. »
  var CRENEAUX = 3;              // un par heure, de 21 h à minuit
  var CRENEAU_S = 3600;
  var DUREE_S = 40;              // le temps de lever les yeux, pas celui de s'y habituer
  var AVANT_S = 2.4;             // les premières secondes : la chaleur de la lanterne (la classe zj-voile)
  // ⚠️ Le soir de l'ouverture publique (décision du 15/09/2026 : mercredi
  //    23/09 à 20 h), une fenêtre GARANTIE à 20 h 40, deux minutes : tous ceux
  //    qui sont dans la cour le voient en même temps. Inerte ensuite.
  var OUVERTURE = { jour: "2026-09-23", debut: 20 * 3600 + 40 * 60, duree: 120 };

  // La galerie du minaret (bloc M en 2..6 × 2..9 de la carte de monde.js), en
  // TUILES : là où ses pieds se posent. Le bloc est un mur : on n'y monte pas.
  var PERCHOIR = { x: 4.5, y: 4.05 };

  function fenetres(jour) {
    var g = graine(jour), out = [];
    for (var k = 0; k < CRENEAUX; k++) {
      var base = HEURE_DEBUT * 3600 + k * CRENEAU_S;
      var debut = base + Math.floor(hache(k + 1, 0, g) * (CRENEAU_S - DUREE_S));
      out.push({ id: jour + "#" + k, debut: debut, fin: debut + DUREE_S });
    }
    if (jour === OUVERTURE.jour) out.push({ id: jour + "#ouverture", debut: OUVERTURE.debut, fin: OUVERTURE.debut + OUVERTURE.duree });
    return out;
  }
  // Ce qu'on voit MAINTENANT : { visible, id, depuis, reste } — depuis/reste en secondes.
  function signal(maintenant) {
    var h = horloge(maintenant), liste = fenetres(h.jour);
    for (var i = 0; i < liste.length; i++) {
      var f = liste[i];
      if (h.seconde >= f.debut && h.seconde < f.fin) return { visible: true, id: f.id, depuis: h.seconde - f.debut, reste: f.fin - h.seconde, chaleur: h.seconde - f.debut < AVANT_S };
    }
    return { visible: false, id: null, depuis: 0, reste: 0, chaleur: false };
  }

  // ---- 1. LA RUMEUR : ce que la cour dit de lui --------------------------------------------
  // Une rumeur n'est pas un discours : elle ne se dit pas tous les jours, et
  // pas par tout le monde. Chaque figurant a sa ligne, certains jours (tirés
  // du jour et de son nom : la même cour pour tous, ce jour-là).
  var PART_RUMEUR = 0.4;          // les jours où un figurant en parle
  var PART_RARE = 0.03;           // ⚠️ les jours où quelqu'un ose un NOM — et c'est celui d'un personnage
  var RUMEURS = {
    zhor: "J'ai vu passer des milliers de Tolba, et un seul dont je n'ai jamais vu le visage. Il ne s'asseyait pas, il ne racontait pas. Il posait quelque chose sur la margelle, et le lendemain quelqu'un savait s'en servir.",
    omar: "Yassine dit qu'il l'a vu sur le minaret, après la halqa, avec une lanterne. Yassine dit beaucoup de choses. Mais cette nuit-là, je n'ai pas dormi.",
    bawwab: "Et ne cherche pas le Voilé. Étale. Ceux qu'il a croisés ne l'ont jamais cherché — ils travaillaient."
  };
  // ⚠️ D1 : jamais démasqué. Ce qu'on murmure, très rarement, désigne SI MEHDI —
  //    le Gardien de Rabat, celui dont le portrait garde la confiance : un
  //    personnage de la série, pas une personne. Une rumeur reste une rumeur.
  var RUMEURS_RARES = {
    yassine: "Je vais te dire un truc, et tu ne le répètes pas : je crois que c'est Si Mehdi. Le gardien, celui de Rabat. Même silence. Même façon de regarder les mains des gens plutôt que leur visage.",
    nour: "Lalla Zhor dit que sous le litham, c'est Si Mehdi. Elle dit aussi que si c'était vrai, il ne faudrait surtout pas le dire. Alors je ne te l'ai pas dit."
  };
  function rumeur(cle, jour) {
    var g = graine(jour);
    if (RUMEURS[cle] && hache(graine(cle), 1, g) < PART_RUMEUR) return RUMEURS[cle];
    if (RUMEURS_RARES[cle] && hache(graine(cle), 2, g) < PART_RARE) return RUMEURS_RARES[cle];
    return null;
  }

  // ---- 3. LA RENCONTRE : les trois choses que la qubba nomme --------------------------------
  // « Ceux qui tiennent leur Wird, qui rendent ce qu'on leur prête et qui
  // étalent ce qu'ils ont fait finissent par le croiser » (Om.QUBBA.pied).
  //   · wirdTenus  : les jours de Wird tenus (Wd.etat().tenus)
  //   · rendu      : une wasfa proposée au Kounnach, ou un Talib parrainé
  //   · etale      : un produit sur son tapis de la Rahba
  //   · defi       : un défi ouvert en base — sans lui il n'a rien à remettre
  //   · dayf       : un invité n'a ni compte ni tapis : jamais
  //   · atelier    : en mode atelier tout doit rester démontrable — les trois
  //                  conditions sont tenues pour vraies (le Souk y est fermé)
  var WIRD_TENUS = 7;
  var CONDITIONS = [
    { cle: "wird", nom: "Le Wird tenu sept jours" },
    { cle: "rendu", nom: "Quelque chose rendu à la maison — une wasfa au Kounnach, ou un Talib parrainé" },
    { cle: "etale", nom: "Un tapis étalé sur la Rahba" }
  ];
  function pret(ctx) {
    var c = ctx || {};
    if (c.dayf) return { ok: false, manque: CONDITIONS.map(function (x) { return x.cle; }), defi: !!c.defi, dayf: true };
    var tenu = { wird: !!c.atelier || (Number(c.wirdTenus) || 0) >= WIRD_TENUS, rendu: !!c.atelier || !!c.rendu, etale: !!c.atelier || !!c.etale };
    var manque = CONDITIONS.filter(function (x) { return !tenu[x.cle]; }).map(function (x) { return x.cle; });
    return { ok: manque.length === 0 && !!c.defi, manque: manque, defi: !!c.defi, tenu: tenu, dayf: false };
  }

  // Ce qu'on voit d'abord — sans nom : on ne sait pas encore qui se tient là.
  var APERCU = { nom: "", pages: ["…", "Quelqu'un se tient devant ton tapis. Il ne bouge pas. Il regarde ce que tu as étalé."] };

  // Ce qu'il dit. ⚠️ Jamais de lui : ni « je suis », ni un nom, ni un conseil.
  // Le nom de la boîte est celui que la maison lui donne, pas le sien.
  var NOM = "Le Voilé";
  function rencontre(produit) {
    var p = String(produit || "").trim() || "ce que tu as posé";
    return { nom: NOM, pages: [
      "Tu as étalé « " + p + " ». Je l'ai vu. Pas ta fiche : ton travail.",
      "Je ne te dirai pas si c'est bien. Ce que tu comptes faire ne m'intéresse pas — tout le monde compte faire. Ce que tu as fait, si.",
      "Je ne te donne ni argent, ni conseil. Je te laisse un mot. Il n'appartient qu'à toi : mets-le dans ton premier commit, et tes trois jours commencent.",
      "Étale. Ne raconte pas."
    ] };
  }
  // Le don : le mot du défi, venu du serveur. Puis il n'y a plus personne.
  function don(mot) {
    return { nom: "Le mot du Voilé", pages: [
      "« " + String(mot || "").trim() + " »",
      "Il est à toi seul. Il va dans un fichier à la racine de ton dépôt, et ce fichier est ton premier commit : c'est lui qui date ton travail.",
      "Le défi, ses quatre preuves et ce mot t'attendent dans la qubba, au cinquième rayon de la Khizana.",
      "Quand tu relèves la tête, il n'y a plus personne devant ton tapis. La lanterne est restée."
    ] };
  }
  // La maison n'a pas répondu : rien n'est remis, rien n'est marqué — il repassera.
  var MUET = { nom: "", pages: ["Le mot n'a pas été remis : la maison n'a pas répondu. Reviens à ton tapis, il repassera."] };

  // ---- Le défi, dans la qubba ------------------------------------------------------------
  // Ce que la base tient (zawia-voile.sql). ⚠️ Les mêmes quatre états dans le
  // SQL : un test compare.
  var ETATS = ["en_cours", "rendu", "passe", "recale"];
  var ETAT_TEXTE = {
    en_cours: "En cours — le dépôt n'est pas encore rendu.",
    rendu: "Rendu — relu par des gens qui ont livré, pas par une machine.",
    passe: "Passé. La porte est ouverte.",
    recale: "À revoir."
  };
  var DEPOT_MAX = 300;
  // Une adresse de dépôt : https seul, publique, courte. Comme partout ailleurs.
  function depotValide(url) {
    var u = String(url || "").trim();
    if (!u) return { ok: false, erreur: "L'adresse du dépôt manque." };
    if (!/^https:\/\/[^\s"'<>]+$/i.test(u) || u.length > DEPOT_MAX) return { ok: false, erreur: "Une adresse https, publique, et rien d'autre." };
    return { ok: true, url: u };
  }
  // Ce que le panneau dit de l'état d'une prise rendue par la base.
  function normaliserPrise(x) {
    var p = x && typeof x === "object" ? x : null;
    if (!p || !p.mot) return null;
    return {
      id: p.id ? String(p.id) : null,
      mot: String(p.mot).slice(0, 40),
      donneLe: p.donne_le ? String(p.donne_le) : (p.donneLe ? String(p.donneLe) : null),
      depot: p.depot ? String(p.depot).slice(0, DEPOT_MAX) : null,
      renduLe: p.rendu_le ? String(p.rendu_le) : (p.renduLe ? String(p.renduLe) : null),
      etat: ETATS.indexOf(p.etat) !== -1 ? p.etat : "en_cours",
      note: p.note ? String(p.note).slice(0, 400) : null,
      saison: p.saison ? String(p.saison).slice(0, 40) : null
    };
  }
  var QUBBA_DEFI = {
    recu: "On ne prend pas ce défi : on le reçoit. Il descend, un soir, sur la Rahba, devant le tapis de ceux qui ont fait trois choses.",
    aucun: "Aucun défi n'est ouvert en ce moment. Le jour où le bureau en pose un, il descendra pour ceux qui sont prêts.",
    pasEncore: "Tu ne l'as pas encore reçu.",
    tenu: "Tenu.",
    manque: "Pas encore.",
    ton: "Ton mot :",
    recuLe: "reçu le {1}",          // des gabarits : la date passe par le trou, et par la traduction
    rendre: "Rendre mon dépôt",
    depot: "L'adresse publique du dépôt (https://…)",
    renduLe: "Rendu le {1}",
    lire: "Ouvrir le dépôt",
    ouvert: "Le défi ouvert :"
  };
  function gabarit(s, v) { return String(s || "").split("{1}").join(String(v == null ? "" : v)); }

  // ---- L'état, dans le récit du joueur ---------------------------------------------------
  // { vu: "AAAA-MM-JJ" | null, signes: n } — le jour où il est descendu, et le
  // nombre de fois où on l'a aperçu sur le minaret. Aucun point, aucun compteur
  // qui vaille quelque chose : c'est un souvenir, pas un score.
  var SIGNES_MAX = 999;
  function normaliserEtat(x) {
    var e = x && typeof x === "object" ? x : {};
    var vu = typeof e.vu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.vu) ? e.vu : null;
    var n = Math.max(0, Math.min(SIGNES_MAX, Math.floor(Number(e.signes) || 0)));
    return { vu: vu, signes: n };
  }
  function marquerVu(etat, jour) { var e = normaliserEtat(etat); return { vu: /^\d{4}-\d{2}-\d{2}$/.test(String(jour)) ? String(jour) : e.vu, signes: e.signes }; }
  function marquerSigne(etat) { var e = normaliserEtat(etat); return { vu: e.vu, signes: Math.min(SIGNES_MAX, e.signes + 1) }; }
  function vu(etat) { return !!normaliserEtat(etat).vu; }

  // La page du carnet — seulement si l'on a quelque chose à dire.
  function carnet(etat, jourVu) {
    var e = normaliserEtat(etat);
    if (!e.vu && e.signes === 0) return null;
    var lignes = ["Le Voilé"];
    if (e.signes > 0) lignes.push(e.signes === 1 ? "Aperçu une seule fois, la nuit, sur la galerie du minaret." : "Aperçu " + e.signes + " fois, la nuit, sur la galerie du minaret.");
    if (e.vu) lignes.push("Il est descendu le " + (jourVu || e.vu) + ". Le mot est dans la qubba.");
    else lignes.push("Il ne descend pas pour qui n'a pas étalé.");
    return lignes.join("\n");
  }

  return {
    HEURE_DEBUT: HEURE_DEBUT, CRENEAUX: CRENEAUX, DUREE_S: DUREE_S, AVANT_S: AVANT_S, OUVERTURE: OUVERTURE, PERCHOIR: PERCHOIR,
    PART_RUMEUR: PART_RUMEUR, PART_RARE: PART_RARE, RUMEURS: RUMEURS, RUMEURS_RARES: RUMEURS_RARES,
    WIRD_TENUS: WIRD_TENUS, CONDITIONS: CONDITIONS, APERCU: APERCU, NOM: NOM, MUET: MUET,
    ETATS: ETATS, ETAT_TEXTE: ETAT_TEXTE, DEPOT_MAX: DEPOT_MAX, QUBBA_DEFI: QUBBA_DEFI, SIGNES_MAX: SIGNES_MAX,
    hache: hache, graine: graine, horloge: horloge, fenetres: fenetres, signal: signal,
    rumeur: rumeur, pret: pret, rencontre: rencontre, don: don, depotValide: depotValide, normaliserPrise: normaliserPrise, gabarit: gabarit,
    normaliserEtat: normaliserEtat, marquerVu: marquerVu, marquerSigne: marquerSigne, vu: vu, carnet: carnet
  };
});
