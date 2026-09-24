// ZAW'IA — le jeu · AL-MECHOUAR (المشور) : la place où l'on est vu (pur : ni DOM, ni horloge, ni hasard).
//
// v7.7 (21/09/2026) — « une arène pour les zawistas, là où l'on voit les
// Moujahidine ; un combat basé sur la maîtrise de l'IA, la culture du Maroc et
// les valeurs de la zawia ; ça doit être le rêve de tout enfant de devenir
// moujahid » (Youssef). Conception :
// docs/superpowers/specs/2026-09-21-jeu-mechouar-moujahidine-arene.md
//
// LE MECHOUAR est le grand terre-plein devant un palais marocain : la place où
// la garde se montre, où la ville regarde. Ici, c'est la salle qui combat le
// PREMIER adversaire de la charte — « l'invisibilité du talent marocain » —,
// celui qu'aucune pièce du jeu n'attaquait encore. On ne guérit l'invisibilité
// qu'en étant vu.
//
// ⚠️⚠️ LA LOI DU CERCLE, et elle vient de la charte, pas de nous : « nos
// adversaires ne sont pas des personnes ». Celui d'en face est un COMPAGNON
// D'ÉPREUVE ; l'adversaire est derrière les deux — Nsyan qui efface ce qui a été,
// Oumm IA qui interdit ce qui pourrait être, et le silence. D'où : aucune
// moquerie possible par construction (pas d'emote, pas de tchat), aucun bilan
// de défaites public, et un écran de défaite qui dit ce qu'on SAIT maintenant.
// Les deux lignes rouges « humilier un Talib » et « rabaisser l'ambition d'un
// autre » sont des contraintes de conception, pas des recommandations.
//
// TROIS ARMES, une par axe, et JAMAIS ADDITIONNÉES (la charte : les axes ne se
// convertissent pas — un test refuse tout total combiné, comme au Lawh). Une
// joute se gagne 2 MANCHES SUR 3.
//
// ⚠️ AUCUN POINT. Gagner ne fabrique ni M39ol, ni Sna3a, ni Dhakira, ni rang :
// un test refuse tout `+=` dans ce fichier. Le gain est le TITRE (et il se
// perd), la bannière, le mur — et l'occasion d'en gagner dehors. La Sna3a d'un
// trou de golf se prend au premier succès seulement, comme à l'établi, et c'est
// le golf qui la donne, jamais l'arène.
//
// ⚠️ Ce module ne DÉCIDE rien de ce qui compte : la vérité de l'Isnad, le
// chronomètre, les votes et les titres vivent en base (zawia-mechouar.sql).
// La clé du jeu est publique — la leçon de l'Imtihan, du Riwaq et du golf.
// Ici : la carte, les armes, l'échelle, les portes, les cas du Mizan, le tirage
// déterministe de ce qui est PUBLIC, le règlement d'une joute, et TOUS les
// textes du panneau (pour que la version arabe les couvre — un test le dit).
(function (root, factory) {
  "use strict";
  var api = factory(root.ZWJ && root.ZWJ.monde);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.mechouar = api;
})(typeof window !== "undefined" ? window : globalThis, function (M) {
  "use strict";
  if (!M || typeof M.monter !== "function") throw new Error("mechouar.js : charger monde.js avant.");

  // ---- Les trois armes ---------------------------------------------------------------------
  // `axe` : l'axe du jeu qu'elle mesure. `contre` : l'adversaire de la charte
  // auquel elle répond. `tempo` : le mizan de la nouba qui l'accompagne (les
  // clés de musique.js, du plus lent au plus vif — un test compare).
  var ARMES = [
    { cle: "qalam", nom: "Al-Qalam", ar: "القلم", sous: "la plume", axe: "sna3a", contre: "oumm", tempo: "basit",
      dit: "Même cible pour les deux. On écrit un prompt, le serveur appelle le modèle et juge par du code. Le plus court qui passe gagne ; à égalité, le plus rapide.",
      repond: "Oumm IA dit : « tu n'y arriveras jamais. » On répond en le faisant sortir juste, en moins de mots que l'autre." },
    { cle: "isnad", nom: "Al-Isnad", ar: "الإسناد", sous: "la chaîne", axe: "dhakira", contre: "nsyan", tempo: "btayhi",
      dit: "Cinq affirmations sur le Maroc. Solide, ou forgée. Appeler ne suffit pas : il faut l'étayer — la ville, le siècle, ou le mot qui est faux.",
      repond: "Nsyan dit : « personne ne s'en souvient. » On répond en citant la chaîne." },
    { cle: "mizan", nom: "Al-Mizan", ar: "الميزان", sous: "la balance", axe: "valeurs", contre: "silence", tempo: "quddam",
      dit: "Un cas de la maison. Deux réponses défendables. On choisit, et on dit pourquoi en cent quarante signes. La halqa tranche à l'aveugle : les raisons mêlées, sans les noms.",
      repond: "Le blabla dit : « c'est juste un jeu. » On répond que la maison se tient à ce qu'elle dit." }
  ];
  var MANCHES = ARMES.length;           // trois
  var POUR_GAGNER = 2;                  // 2 sur 3 — on compte des MANCHES, jamais des points
  var RAISON_MAX = 140;                 // le Mizan : une raison, pas un plaidoyer
  var CONSIGNE_MAX = 200;               // le Sadd (tranche D) : la borne est posée ici pour que le SQL la lise
  var ISNAD_FAITS = 5;                  // cinq affirmations par manche
  var ISNAD_MS = 7000;                  // sept secondes chacune — le serveur chronomètre
  var VICTOIRES_FARES = 10;             // le cavalier

  function arme(cle) { for (var i = 0; i < ARMES.length; i++) if (ARMES[i].cle === cle) return ARMES[i]; return null; }

  // ---- L'échelle ---------------------------------------------------------------------------
  // ⚠️⚠️ AUCUN de ces titres n'est un RANG. Les cinq degrés de la charte (Talib →
  // Morchid, au M39ol seul) restent la seule échelle verticale. Ceux-ci sont
  // horizontaux, comme les tariqat — et ils SE PERDENT, ce qu'un rang ne fait
  // jamais. On se lit « rang · tariqa · titre » : Mt3ellem · Bannay · Batal de
  // Tanger. Un test vérifie qu'aucune clé n'est une clé de RANGS, de
  // SNA3A_NIVEAUX, de DHAKIRA_NIVEAUX, de VOIES ni d'une tariqa.
  var TITRES = [
    { cle: "mtmarren", nom: "Mtmarren", ar: "متمرّن", sous: "Il s'entraîne",
      comment: "Tout joueur entré. La nzaha seulement : aucune trace, aucune défaite publique." },
    { cle: "moujahid", nom: "Moujahid", ar: "مجاهد", sous: "Il est entré dans le cercle",
      comment: "Les trois portes, une par axe. On ne peut pas être moujahid sur un seul axe." },
    { cle: "fares", nom: "Fares", ar: "فارس", sous: "Le cavalier",
      comment: "Dix joutes gagnées. Il peut défier un porteur de bannière." },
    { cle: "batal", nom: "Batal", ar: "بطل", sous: "Il porte une bannière",
      comment: "Il a pris l'une des neuf bannières. Il la garde jusqu'à ce qu'on la lui prenne." },
    { cle: "hamil", nom: "Hamil ar-Râya", ar: "حامل الراية", sous: "Il porte celle de la zawia",
      comment: "Un seul par Mawsem. Couronné en public — un titre ne s'annonce pas soi-même, il se reçoit." }
  ];
  function titre(cle) { for (var i = 0; i < TITRES.length; i++) if (TITRES[i].cle === cle) return TITRES[i]; return TITRES[0]; }

  // Le titre que DONNE un bilan. Le Batal et le Hamil ne se déduisent pas : ils
  // se POSENT (une bannière prise, un Mawsem) — comme le Morchid est élu.
  function titrePour(bilan) {
    var b = bilan || {};
    if (b.banniere) return titre("batal");
    if (Number(b.victoires) >= VICTOIRES_FARES) return titre("fares");
    if (b.moujahid) return titre("moujahid");
    return titre("mtmarren");
  }

  // ---- Les neuf bannières ------------------------------------------------------------------
  // Les neuf villes des neuf Mourchidine (recit.js) — un test compare les clés.
  // Neuf titres tenables font neuf rêves ; une couronne unique en fait un seul.
  var BANNIERES = [
    { cle: "fes", ville: "Fès", ar: "فاس" }, { cle: "marrakech", ville: "Marrakech", ar: "مراكش" },
    { cle: "meknes", ville: "Meknès", ar: "مكناس" }, { cle: "rabat", ville: "Rabat", ar: "الرباط" },
    { cle: "casablanca", ville: "Casablanca", ar: "الدار البيضاء" }, { cle: "tanger", ville: "Tanger", ar: "طنجة" },
    { cle: "agadir", ville: "Agadir", ar: "أݣادير" }, { cle: "dakhla", ville: "Dakhla", ar: "الداخلة" },
    { cle: "oujda", ville: "Oujda", ar: "وجدة" }
  ];
  function banniere(cle) { for (var i = 0; i < BANNIERES.length; i++) if (BANNIERES[i].cle === cle) return BANNIERES[i]; return null; }

  // ---- Les trois portes du Moujahid --------------------------------------------------------
  // Une par axe. C'est le cœur du concept : la COMPLÉTUDE est le prix d'entrée,
  // et c'est ce qui donne son sens au mot. Chaque porte est un geste que le
  // joueur a déjà fait une fois ailleurs — jamais une épreuve neuve.
  function portes(j) {
    var p = j || {}, r = p.recit || {}, me = r.mechouar || {};
    var sna3a = 0, k;
    if (p.sna3a && typeof p.sna3a === "object") { for (k in p.sna3a) if (Object.prototype.hasOwnProperty.call(p.sna3a, k)) sna3a += Number(p.sna3a[k]) || 0; }
    else sna3a = Number(p.sna3a) || 0;
    var liste = [
      { cle: "sna3a", axe: "Sna3a", nom: "Ce que tes mains savent faire",
        ouverte: sna3a > 0 || Number(p.tahaddi) > 0,
        comment: "Un Ta7addi réussi à l'établi, ou un trou du golf du prompt.", ou: "Y" },
      { cle: "dhakira", axe: "Dhakira", nom: "Ce que tu sais de ton pays",
        ouverte: Number(p.pages) > 0,
        comment: "Une page perdue retrouvée au sandouq.", ou: "S" },
      { cle: "valeurs", axe: "Les valeurs", nom: "Ce à quoi tu te tiens",
        ouverte: !!me.admis,
        comment: "Les sept khatt du Sahn lus, et le Mizan d'admission passé ici.", ou: "V" }
    ];
    var n = 0;
    liste.forEach(function (x) { if (x.ouverte) n += 1; });
    return { portes: liste, ouvertes: n, total: liste.length, pret: n === liste.length };
  }

  // ---- Les cas du Mizan --------------------------------------------------------------------
  // Bâtis sur les SEPT LIGNES ROUGES et les SEPT VALEURS de la charte. Deux
  // réponses DÉFENDABLES : ce qui se juge n'est pas le choix, c'est la raison.
  // ⚠️⚠️ AUCUN cas de politique partisane ni de religion (septième ligne rouge) :
  // un test refuse une liste de mots. Les cas parlent de métier, d'argent, du
  // crédit du travail et du respect — ce dont la maison est faite.
  var CAS = [
    { cle: "mot", regle: "Le M39ol se prouve, il ne se déclare pas",
      texte: "Tu n'as pas pu venir à la halqa du mercredi. Un membre t'envoie le mot de la séance sur WhatsApp, gentiment, pour que tu aies ton point.",
      options: ["Je ne le saisis pas, et je lui dis pourquoi", "Je ne le saisis pas, et je n'en parle à personne"],
      note: "Les deux refusent le point. La première protège la règle pour les autres aussi ; la seconde protège une relation. Dire pourquoi coûte plus cher — et c'est ce qui fait tenir une maison." },
    { cle: "sortie", regle: "Faire passer une sortie de modèle pour une réalisation",
      texte: "Ton binôme livre au client un document sorti du modèle, presque tel quel. Il est bon. Il ne le dit pas.",
      options: ["J'en parle à lui d'abord", "Je le dis au client en même temps qu'à lui"],
      note: "Utiliser l'IA est le métier ; la faire passer pour du travail est le mensonge. Lui parler d'abord lui laisse la porte ; le dire au client tout de suite protège le client. Les deux se défendent — dis lequel tu défends." },
    { cle: "talib", regle: "Humilier un Talib",
      texte: "Un Talib pose un projet naïf dans la halqa. Trois personnes se taisent. Une se moque, et c'est drôle.",
      options: ["Je réponds à celui qui se moque", "Je réponds au Talib, et je ne relève pas"],
      note: "Celui qui prend un débutant de haut n'a rien compris à cette maison, quel que soit son rang. Relever protège la règle ; répondre au Talib protège le Talib. Le silence, lui, n'est pas une option." },
    { cle: "ambition", regle: "Rabaisser l'ambition d'un autre",
      texte: "Quelqu'un annonce qu'il va bâtir un outil pour tout le pays. C'est beaucoup trop grand pour lui, et tu le sais.",
      options: ["Je lui dis la première marche", "Je lui dis ce qui va casser"],
      note: "Le hchouma-shaming est l'ennemi intime de la zawia. Dire la première marche garde l'élan ; dire ce qui va casser lui fait gagner un mois. Ce qui est interdit, c'est de lui dire que c'est trop grand pour lui." },
    { cle: "amana", regle: "L'amana : ce qui est confié dans la maison",
      texte: "Un membre t'a montré, dans la maison, une idée qui règle un problème que ton client a aussi.",
      options: ["Je lui demande avant d'en faire quoi que ce soit", "Je présente le membre au client"],
      note: "Une idée confiée dans la maison ne sort pas de la maison. Demander est le minimum ; le présenter lui rend la valeur de son idée. Les deux tiennent l'amana." },
    { cle: "credit", regle: "S'attribuer le travail d'un autre",
      texte: "Vous avez bâti à deux. Au Mawsem, la ferracha est posée sous un seul nom — le sien. Il ne l'a pas fait exprès.",
      options: ["Je le dis avant la démo", "Je le lui dis après, en privé"],
      note: "La ferracha se pose au nom de qui a bâti. Le dire avant remet le crédit là où il va ; le dire après évite de casser sa démo. Ce qui n'est pas défendable, c'est de ne rien dire." },
    { cle: "prospect", regle: "Utiliser la communauté comme fichier de prospects",
      texte: "Un membre te demande la liste des gens de la maison : il a une offre qui, franchement, leur servirait.",
      options: ["Je refuse, et je lui dis d'étaler au Souk", "Je refuse, et je porte son offre au bureau"],
      note: "La communauté n'est pas un fichier. Le renvoyer au Souk lui donne le bon geste : étale, ne démarche pas. Le porter au bureau donne une chance à l'offre, sans toucher à la liste." },
    { cle: "slides", regle: "Ferracha — étale, ne raconte pas",
      texte: "Ta démo ne tourne plus, une heure avant ta ferracha au Mawsem. Tu as des captures d'écran qui, elles, sont magnifiques.",
      options: ["J'étale ce qui tourne encore, même petit", "Je montre la partie qui casse, et je dis pourquoi"],
      note: "Zéro slide : la règle la plus impopulaire et la plus utile. Étaler petit tient la règle ; montrer la casse enseigne quelque chose à toute la salle. Les captures, non." }
  ];
  function cas(cle) { for (var i = 0; i < CAS.length; i++) if (CAS[i].cle === cle) return CAS[i]; return null; }

  // Le Mizan d'ADMISSION : la troisième porte. Le même cas pour tout le monde —
  // ce n'est pas une épreuve, c'est une lecture. On ne le perd pas.
  var CAS_ADMISSION = "mot";

  // ---- Le hachage : jamais le hasard du navigateur -----------------------------------------
  // La même graine donne la même joute aux deux duellistes, et à qui rejoue le
  // lien. ⚠️ Le SQL porte le MÊME hachage (zawia-mechouar.sql) — un test compare
  // les deux fichiers, comme SEUIL_POINTS au Souk.
  function hache(s) {
    var h = 2166136261, t = String(s);
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }
  function graineValide(g) { return typeof g === "string" && /^[a-z0-9]{4,12}$/.test(g); }

  // Ce qui est PUBLIC se tire ici : le trou du golf, et le cas du Mizan. Les
  // affirmations de l'Isnad se tirent EN BASE — elle seule sait lesquelles sont
  // forgées, et un tirage côté navigateur dirait déjà la moitié de la réponse.
  function tirage(graine, trous) {
    var g = String(graine || ""), liste = (trous || []).slice();
    var t = liste.length ? liste[hache(g + ":qalam") % liste.length] : null;
    var c = CAS[hache(g + ":mizan") % CAS.length];
    return { qalam: t, mizan: c.cle, isnad: ISNAD_FAITS };
  }

  // ---- Le règlement d'une joute ------------------------------------------------------------
  // ⚠️ On compte des MANCHES. Additionner un score de Qalam et un score
  // d'Isnad serait exactement la faute que le Lawh interdit.
  //
  // Une manche : { arme, a: <score|null>, b: <score|null> } où le score est
  // « mieux vaut plus » pour l'Isnad (faits étayés) et le Mizan (voix), et
  // « mieux vaut moins » pour le Qalam (la longueur du prompt qui passe ;
  // null = n'est jamais passé, donc perdue).
  function gagnantDe(m) {
    if (!m) return null;
    var a = m.a, b = m.b, moins = m.arme === "qalam";
    var na = a === null || a === undefined, nb = b === null || b === undefined;
    if (na && nb) return null;
    if (na) return "b";
    if (nb) return "a";
    if (Number(a) === Number(b)) return null;
    if (moins) return Number(a) < Number(b) ? "a" : "b";
    return Number(a) > Number(b) ? "a" : "b";
  }
  function regler(joute) {
    var j = joute || {}, ms = (j.manches || []).slice(0, MANCHES);
    var a = 0, b = 0, detail = ms.map(function (m) {
      var g = gagnantDe(m);
      if (g === "a") a += 1; else if (g === "b") b += 1;
      return { arme: m.arme, gagnant: g, a: m.a, b: m.b };
    });
    var fini = ms.length >= MANCHES || a >= POUR_GAGNER || b >= POUR_GAGNER;
    var vainqueur = a >= POUR_GAGNER ? "a" : b >= POUR_GAGNER ? "b" : null;
    // Trois manches, aucune n'emporte deux : la joute est nulle. On ne
    // départage pas sur un total — les axes ne se convertissent pas.
    return { manches: detail, a: a, b: b, fini: fini, vainqueur: vainqueur, nulle: fini && !vainqueur };
  }

  // ---- La place ----------------------------------------------------------------------------
  var LARGEUR = 30, HAUTEUR = 22;
  // La halqa : le cercle de terre battue au centre, bordé de zellige, et ses
  // huit lanternes. On entre dans le cercle par sa tuile « h » — le cercle de
  // la Qa3a, la même que la halqa de la maison.
  var HALQA = { x: 14, y: 11 };                        // la tuile du cercle : on s'y tient pour ouvrir le panneau
  var ZELLIGE = { x0: 10, y0: 7, x1: 19, y1: 15 };     // le tour du cercle
  var LANTERNES = [[10, 7], [19, 7], [10, 15], [19, 15], [14, 6], [14, 16], [9, 11], [20, 11]];
  var ORANGERS = [[4, 5], [25, 5], [4, 17], [25, 17]];
  // Le mur des Moujahidine, adossé au mur nord : neuf cadres (« V », le khatt —
  // une inscription sur un mur, exactement ce que c'est), un par bannière.
  var MUR = { x0: 8, y0: 2, x1: 21, y1: 3 };
  // ⚠️ TOUS sur la FACE SUD du mur (y = 3), adossés à une case libre : un cadre
  // posé sur la rangée du DESSUS (y = 2) est cerné de maçonnerie — on ne peut
  // pas se tenir devant, donc on ne peut pas le lire. Trouvé par le test qui
  // marche la place depuis l'apparition, pas à l'œil.
  var CADRES = [
    { cle: "fes", x: 9, y: 3 }, { cle: "marrakech", x: 10, y: 3 }, { cle: "meknes", x: 11, y: 3 },
    { cle: "rabat", x: 13, y: 3 }, { cle: "casablanca", x: 14, y: 3 }, { cle: "tanger", x: 15, y: 3 },
    { cle: "agadir", x: 17, y: 3 }, { cle: "dakhla", x: 18, y: 3 }, { cle: "oujda", x: 19, y: 3 }
  ];
  var BAB = [[14, 20], [15, 20]];                      // le Bab : on rentre dans la cour en lui parlant
  var ESTRADE = { x: 24, y: 10 };                      // l'estrade de l'Amin (décor ; l'Amin est un PNJ)

  function construire() {
    var g = [], x, y;
    for (y = 0; y < HAUTEUR; y++) {
      var l = [];
      for (x = 0; x < LARGEUR; x++) {
        var bord = x === 0 || y === 0 || x === LARGEUR - 1 || y === HAUTEUR - 1;
        var mur = x === 1 || x === LARGEUR - 2 || y === 1 || y === HAUTEUR - 2;
        l.push(bord ? "w" : mur ? "#" : ",");
      }
      g.push(l);
    }
    for (y = ZELLIGE.y0; y <= ZELLIGE.y1; y++) for (x = ZELLIGE.x0; x <= ZELLIGE.x1; x++) g[y][x] = ".";
    for (y = MUR.y0; y <= MUR.y1; y++) for (x = MUR.x0; x <= MUR.x1; x++) g[y][x] = "#";
    CADRES.forEach(function (c) { g[c.y][c.x] = "V"; });
    ORANGERS.forEach(function (p) { g[p[1]][p[0]] = "T"; });
    LANTERNES.forEach(function (p) { g[p[1]][p[0]] = "L"; });
    g[HALQA.y][HALQA.x] = "h";
    BAB.forEach(function (p) { g[p[1]][p[0]] = "G"; });
    return g.map(function (l) { return l.join(""); });
  }
  var CARTE = construire();
  var APPARITION = { x: 15, y: 19, dir: "haut" };       // on sort du Bab, face à la place

  var DIALOGUES = {
    "G": { nom: "Le Bab", pages: ["Le Bab de la zawia. Derrière, la cour — et dedans, on apprend. Ici, on montre."] },
    "h": { nom: "La halqa", pages: ["Le cercle de terre battue. C'est ici qu'on se tient pour entrer en joute."] },
    "V": { nom: "Un cadre vide", pages: ["Un cadre vide, sur le mur des Moujahidine. Personne ne porte encore cette bannière."] },
    "L": { nom: "Une lanterne", pages: ["Une lanterne du Mechouar. Le soir, la halqa s'éclaire comme une fête de mariage."] },
    "T": { nom: "Un oranger", pages: ["Un oranger du Mechouar. Son ombre est la place la plus disputée de la zawia."] }
  };

  var monde = M.monter({ carte: CARTE, legende: M.LEGENDE, apparition: APPARITION, dialogues: DIALOGUES });

  function cadreA(x, y) { for (var i = 0; i < CADRES.length; i++) if (CADRES[i].x === x && CADRES[i].y === y) return CADRES[i]; return null; }
  function estHalqa(x, y) { return x === HALQA.x && y === HALQA.y; }

  // ---- Les gens du Mechouar ----------------------------------------------------------------
  // Même forme que les gens de la cour (pnj.js). L'amin (l'arbitre : il annule
  // une joute, il accorde une kunya — mais il ne VOTE jamais, la règle du fil
  // d'affaire) et le dellal (le crieur : il dit qui porte quoi).
  var PNJ = [
    { cle: "amin-mechouar", nom: "Ba Hmed", figure: "cheikh", x: 24, y: 11, dir: "gauche",
      avatar: { peau: 2, djellaba: 6, couvre: 1, cheveux: 7, coiffure: 0, barbe: 4, moustache: 1, bijou: 0 },
      ronde: [], parle: true },
    { cle: "dellal-mechouar", nom: "Si Lahcen", figure: "homme", x: 12, y: 17, dir: "haut",
      avatar: { peau: 1, djellaba: 2, couvre: 0, cheveux: 1, coiffure: 0, barbe: 2, moustache: 2, bijou: 0 },
      ronde: [[12, 17], [17, 17], [17, 18], [12, 18]], parle: true },
    { cle: "mtmarren", nom: "Nour", figure: "femme", x: 8, y: 12, dir: "droite",
      avatar: { peau: 1, djellaba: 4, couvre: 0, cheveux: 0, coiffure: 3, barbe: 0, moustache: 0, bijou: 1 },
      ronde: [[8, 12], [8, 14]], parle: true }
  ];

  function parler(cle, ctx) {
    var c = ctx || {}, nom = c.pseudo || "toi", t = c.titre ? titre(c.titre) : null;
    if (cle === "amin-mechouar") {
      return { nom: "Ba Hmed", pages: c.moujahid
        ? ["Tu es dans le cercle, " + nom + ". Je tiens le registre : ce qui se gagne ici s'écrit, et ce qui s'écrit se perd aussi.",
           "Je n'arbitre pas les raisons — c'est la halqa qui les pèse, et elle les pèse sans voir les noms. Moi, je compte."]
        : ["L'amin du Mechouar. Je tiens le registre des joutes.",
           "Trois portes avant d'entrer dans le cercle, " + nom + " : ce que tes mains savent faire, ce que tu sais de ton pays, et ce à quoi tu te tiens. Une par axe — on n'entre pas ici avec un seul."] };
    }
    if (cle === "dellal-mechouar") {
      return { nom: "Si Lahcen", pages: c.porteurs
        ? ["Écoutez, écoutez ! " + c.porteurs + " sur le mur, et les autres cadres qui attendent !"]
        : ["Écoutez, écoutez ! Neuf bannières au mur, et pas une seule prise !",
           "La première que quelqu'un décroche, je crie son nom jusqu'au Bab."] };
    }
    return { nom: "Nour", pages: t && t.cle !== "mtmarren"
      ? ["Moi je regarde encore. Un jour j'entrerai, " + nom + "."]
      : ["Je m'entraîne à la nzaha. On y perd sans que personne ne le note — c'est pour ça que j'ose."] };
  }

  // Le dellal hèle la première fois — une fois (recit.mechouar.vu).
  function accueil(pseudo) {
    return { nom: "Si Lahcen", pages: [
      "Le Mechouar, " + (pseudo || "toi") + " ! La place où l'on est vu.",
      "Ici on ne se bat pas contre quelqu'un — regarde bien, il n'y a pas d'arme sur cette place. On se mesure à trois choses : ce que tes mains savent faire, ce que tu sais de ton pays, et ce à quoi tu te tiens.",
      "Trois manches, deux suffisent. Et ce qu'on gagne ici, personne ne peut te l'acheter."
    ] };
  }

  // ---- Ce que le panneau dit ---------------------------------------------------------------
  var TEXTES = {
    titre: "Al-Mechouar",
    sous: "La place où l'on est vu",
    loi: "Ici, on n'affronte jamais une personne. Celui d'en face est un compagnon d'épreuve — l'adversaire est derrière vous deux.",
    armes: "Les trois armes",
    jamais: "Aucun point. Ni M39ol, ni Sna3a, ni Dhakira, ni rang. Ce qu'on gagne, c'est un titre — et il se perd.",
    manches: "Trois manches, deux suffisent",
    pasDeTotal: "Les trois manches ne s'additionnent pas : chacune se gagne à part.",
    nzaha: "Nzaha — s'entraîner",
    nzahaTrace: "La nzaha ne laisse aucune trace. C'est fait pour.",
    nzahaDit: "Les trois armes, sans adversaire et sans trace. On y perd gratuitement.",
    joute: "Entrer en joute",
    jouteDit: "Tu joues tes trois manches ; ton compagnon joue les mêmes plus tard. Personne n'a besoin d'être là en même temps que toi.",
    mesJoutes: "Mes joutes",
    aucuneJoute: "Aucune joute encore. La nzaha ne compte pas — c'est fait pour.",
    mur: "Le mur des Moujahidine",
    murVide: "Neuf cadres, et pas une bannière prise. Le premier nom écrit là y restera longtemps.",
    portesTitre: "Les trois portes",
    portesDit: "Une par axe. On ne peut pas être moujahid sur un seul.",
    pret: "Les trois portes sont ouvertes. L'amin t'attend dans le cercle.",
    pasPret: "Il te manque une porte au moins. Chacune est un geste que tu as déjà fait une fois.",
    admission: "Le Mizan d'admission",
    admissionDit: "Lis, et dis à quoi tu te tiens. Ce n'est pas une épreuve : on ne le perd pas.",
    admis: "Passé. La troisième porte est ouverte.",
    raison: "Pourquoi ? (cent quarante signes)",
    raisonCourte: "Une raison, même courte. C'est elle qu'on pèse, pas ton choix.",
    voter: "Peser les raisons",
    voterDit: "Deux raisons, mêlées, sans les noms. Tu pèses la raison — jamais la personne.",
    voteFait: "Ta voix est prise. Elle ne se change pas.",
    pasTaVoix: "Tu es dans cette joute : on ne pèse pas sa propre raison.",
    attendVoix: "La halqa pèse encore. Reviens : une raison ne se juge pas en dix secondes.",
    gagne: "La joute est à toi",
    perdu: "La joute t'échappe",
    nulle: "Personne n'emporte deux manches. La joute est nulle — et on ne départage pas sur un total.",
    apprisTitre: "Ce que tu sais maintenant",
    fermer: "Fermer",
    tempoDit: "La musique dit le temps qui reste : large, puis pressé, puis le quddām — la dernière.",
    horsCercle: "Tiens-toi dans le cercle de terre battue pour entrer en joute.",
    atelier: "En atelier, la place tourne à vide : les joutes vivent en base."
  };

  // Ce qu'on dit à qui n'est pas encore entré dans le cercle : jamais un refus
  // sec — ce qui manque, et où le prendre (la règle des refus qui orientent).
  function refus(j) {
    var p = portes(j), manque = p.portes.filter(function (x) { return !x.ouverte; });
    return {
      nom: "Le cercle",
      pages: ["Pas encore, pas comme ça. " + TEXTES.pasPret,
        manque.map(function (x) { return x.nom + " — " + x.comment; }).join(" ")]
    };
  }

  // Ce que la défaite dit : ce qu'on SAIT maintenant, jamais ce qu'on a perdu
  // (« rabaisser l'ambition d'un autre » est une ligne rouge, et une défaite
  // sèche est une manière de le faire). ⚠️ Pour le Qalam, la LONGUEUR du prompt
  // qui est passé — jamais son texte : la règle du golf, l'amana.
  function apprendre(joute) {
    var r = regler(joute), lignes = [];
    r.manches.forEach(function (m) {
      var a = arme(m.arme);
      if (!a) return;
      if (m.arme === "qalam") lignes.push(a.nom + " — le prompt qui est passé faisait " + (m.b === null || m.b === undefined ? "— " : m.b + " signes") + ".");
      else if (m.arme === "isnad") lignes.push(a.nom + " — " + (m.b || 0) + " affirmations étayées sur " + ISNAD_FAITS + ".");
      else lignes.push(a.nom + " — la halqa a pesé les deux raisons.");
    });
    return { titre: TEXTES.apprisTitre, lignes: lignes };
  }

  // ---- La validation avant envoi -----------------------------------------------------------
  // ⚠️ La base revalide tout : ceci n'est que la politesse de l'écran.
  function validerRaison(t) {
    var s = String(t == null ? "" : t).trim();
    if (!s) return { ok: false, mot: TEXTES.raisonCourte };
    if (s.length > RAISON_MAX) return { ok: false, mot: "Cent quarante signes au plus." };
    return { ok: true, raison: s };
  }

  return {
    ARMES: ARMES, MANCHES: MANCHES, POUR_GAGNER: POUR_GAGNER, RAISON_MAX: RAISON_MAX, CONSIGNE_MAX: CONSIGNE_MAX,
    ISNAD_FAITS: ISNAD_FAITS, ISNAD_MS: ISNAD_MS, VICTOIRES_FARES: VICTOIRES_FARES,
    TITRES: TITRES, BANNIERES: BANNIERES, CAS: CAS, CAS_ADMISSION: CAS_ADMISSION, TEXTES: TEXTES,
    arme: arme, titre: titre, titrePour: titrePour, banniere: banniere, cas: cas, portes: portes,
    hache: hache, graineValide: graineValide, tirage: tirage,
    gagnantDe: gagnantDe, regler: regler, apprendre: apprendre, refus: refus, validerRaison: validerRaison,
    LARGEUR: LARGEUR, HAUTEUR: HAUTEUR, CARTE: CARTE, APPARITION: APPARITION, DIALOGUES: DIALOGUES,
    HALQA: HALQA, ZELLIGE: ZELLIGE, LANTERNES: LANTERNES, ORANGERS: ORANGERS, MUR: MUR, CADRES: CADRES,
    BAB: BAB, ESTRADE: ESTRADE, PNJ: PNJ, monde: monde,
    cadreA: cadreA, estHalqa: estHalqa, parler: parler, accueil: accueil
  };
});
