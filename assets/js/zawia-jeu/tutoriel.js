// ZAW'IA — le jeu · LE TUTORIEL : la première Arb3ine guidée (pur : ni DOM, ni réseau).
//
// Le mou'allim de Fès — « la transmission » (recit.js) — prend le Talib par
// l'épaule à sa première entrée dans la cour : sept pas, un par geste, un
// par axe, puis le tapis — et chaque règle s'apprend par le geste qui la prouve. « Étale, ne
// raconte pas » vaut aussi pour un tutoriel : on FAIT, on ne lit pas.
//
//   1 · le khatt      — marcher, parler (Espace/A), et la première valeur ;
//   2 · le sandouq    — la Dhakira : une vraie page perdue, vraie récompense ;
//   3 · la Sna3a      — l'établi (gens de la maison) OU l'échauffement du
//       mou'allim (Talib libre) : un QCM BLANC, zéro point — l'établi lui est
//       fermé PAR LA BASE, on montre le geste sans toucher aux compteurs ;
//   4 · le tableau    — le M39ol se lit, il ne se déclare pas ;
//   5 · les rayonnages — la bibliothèque, où la Twiza (le chantier
//       communautaire) est affichée — la ligne vit EN BASE, jamais ici ;
//   6 · le carnet     — les trois comptes côte à côte ;
//   7 · la ferracha   — sortir par le Bab et poser son PREMIER produit au
//       Souk (v3.6) : le geste que personne ne trouvait seul. v3.7 : le Souk
//       EST la ferracha du site — la porte est le dossier accepté, plus un
//       seuil de points. Un Talib libre y lit, et le Souk lui dit où déposer
//       sa fiche. En atelier le Souk est fermé : le pas se valide en y
//       entrant (jeu.js), le tutoriel n'enferme pas.
//
// ⚠️ AUCUN lien ici — pas même celui du cercle de la Twiza : les liens vivent
//    dans zawia_ressources (le voile, et un lien change). Un test le garde.
// ⚠️ Le tutoriel ne crédite JAMAIS un compteur : la page du sandouq et le
//    Ta7addi de l'établi récompensent par leurs propres circuits ; le M39ol
//    ne vient pas du navigateur ; l'échauffement ne vaut aucun point.
// ⚠️ Jamais un coupable, jamais le nom de la maison (les règles du récit).
//
// L'état vit dans joueur.recit.tutoriel : { etape: n } en cours, { fini: iso }
// après. L'écran (jeu.js) branche les événements ; ici, que des données et
// deux calculs purs — l'étape suivante, et le chemin du fil d'or.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.tutoriel = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- L'échauffement : un QCM blanc, même forme qu'un Ta7addi (Th.verifier le corrige),
  // mais AUCUN point — il vit ici, jamais dans tahaddi.js, pour ne jamais
  // approcher les compteurs que la base garde.
  var ECHAUFFEMENT = {
    cle: "echauffement-verifier",
    voie: "verifier",
    titre: "L'échauffement du mou'allim",
    enonce: "Ton compagnon te rend une réponse sûre d'elle, une source à l'appui. Que fais-tu avant de la poser sur ton tapis ?",
    options: [
      "Je la publie : une IA qui cite une source ne se trompe pas",
      "J'ouvre la source, je vérifie qu'elle existe et qu'elle dit bien ça",
      "Je demande à une deuxième IA — si elles sont d'accord, c'est prouvé",
      "Je retire la source : sans elle, personne ne pourra me contredire"
    ],
    bonne: 1,
    explication: "Vérifier juste, c'est le geste : une IA sait inventer une source avec aplomb. On ouvre, on lit, on confronte — puis on étale. Deux IA d'accord ne font pas une preuve : elles se trompent volontiers ensemble."
  };

  // ---- Les sept étapes ------------------------------------------------------------
  // `evenement` : le signal (envoyé par jeu.js) qui valide l'étape.
  // `tuile` : le fil d'or au sol mène à cette tuile ; `salle` : ça s'ouvre au menu.
  function etapes(maison, geste) {
    var pas = [];
    pas.push({
      cle: "khatt", evenement: "tuile:V", tuile: "V",
      consigne: "Lis un khatt du Sahn — approche-toi du mur, Espace ou A",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          "Salam. Le prologue t'a dit pourquoi tu es là ; moi, je te montre comment on y vit. Sept pas suffisent — suis le fil d'or au sol.",
          "D'abord, les jambes : flèches ou ZQSD — ou la croix sous ton pouce. Sur les murs du Sahn, sept khatt portent la charte. Va en lire un : approche-toi, et appuie sur Espace (ou A)."
        ]
      }
    });
    pas.push({
      cle: "page", evenement: "page", tuile: "S",
      consigne: "Ouvre le sandouq de la Khizana, et retrouve la page",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          "☑ Sept khatt, sept valeurs — et la première commande tout : étale, ne raconte pas.",
          "Maintenant, la mémoire — la Dhakira, ce que tu sais de ton pays. À l'ouest, dans la Khizana, le sandouq tient les pages que Nsyan a arrachées. Ouvre-le : la première parle d'une fondatrice que les vieilles photos t'ont déjà montrée. Les indices sont là pour servir."
        ]
      }
    });
    if (maison) {
      pas.push({
        cle: "defi", evenement: "defi", tuile: "E",
        consigne: "Passe un Ta7addi à l'établi de la Madrasa",
        debut: {
          nom: "Le mou'allim · Fès",
          pages: [
            "☑ Une page revenue : ta Dhakira monte, et Nsyan recule d'un pas.",
            "Deuxième axe : la Sna3a — ce que tu sais faire. À l'établi de la Madrasa, un Ta7addi t'attend : un défi d'IA, corrigé par le jeu. Trois voies s'y exercent : dire juste, voir juste, vérifier juste."
          ]
        }
      });
    } else {
      pas.push({
        cle: "defi", evenement: "echauffement", echauffement: true,
        consigne: "L'échauffement du mou'allim — réponds au défi",
        debut: {
          nom: "Le mou'allim · Fès",
          pages: [
            "☑ Une page revenue : ta Dhakira monte, et Nsyan recule d'un pas.",
            "Deuxième axe : la Sna3a — ce que tu sais faire. L'établi est aux gens de la maison ; mais je te montre le geste, sans points ni registre. Un échauffement :",
            ECHAUFFEMENT.enonce
          ]
        }
      });
    }
    pas.push({
      cle: "tableau", evenement: "tableau", salle: "tableau",
      consigne: "Ouvre le Menu, puis le tableau",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          maison
            ? "☑ C'est ça, la Sna3a : elle se gagne seul, à l'établi et au rihal — et elle ne fera jamais ton rang."
            : "☑ C'est ça, corriger un défi. Ta Sna3a s'écrira le jour où tu porteras une Chajara ; d'ici là ta place est au Souk — on y étale ce qu'on fait.",
          "Reste le troisième axe, le seul qui fasse un rang : le M39ol. Ouvre le Menu, en haut à droite, et lis le tableau."
        ]
      }
    });
    var m39ol = [
      "Le M39ol, personne ne se l'écrit : il se reçoit. Regarde qui monte au tableau — ceux qui donnent.",
      "Et il se gagne ensemble. La maison a un chantier — la Twiza : aider les lauréats du pays à décrocher leur premier travail, l'IA dans une main, le CV dans l'autre. Son cercle est affiché aux rayonnages de la Khizana. Vas-y voir."
    ];
    if (maison) m39ol.push("Et chaque mercredi 19 h, le point de la maison, au Riwaq : le mot dit en séance, tapé avant 21 h 15, vaut +1. Une preuve, pas une déclaration.");
    pas.push({
      cle: "biblio", evenement: "biblio", tuile: "B",
      consigne: "Va aux rayonnages de la Khizana — la Twiza y est affichée",
      debut: { nom: "Le mou'allim · Fès", pages: m39ol }
    });
    pas.push({
      cle: "carnet", evenement: "carnet", salle: "carnet",
      consigne: "Ouvre le Menu, puis ton carnet",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          "☑ Trois rayons : al-Moujam — les mots de la maison —, de quoi apprendre, et le catalogue. La Twiza est en tête : le cercle est ouvert, la porte le reste.",
          "Sixième pas : ouvre ton carnet, au Menu. Regarde tes trois comptes côte à côte."
        ]
      }
    });
    // v3.6 — la ferracha. Le Bab (tuile G) est intercepté par jeu.js et ouvre
    // le Souk ; l'événement « etal » part quand un produit est POSÉ (ou, pour
    // qui a déjà un tapis, dès l'entrée). Le point exigé par le Souk vient de
    // la page du sandouq, retrouvée au pas 2.
    pas.push({
      cle: "souk", evenement: "etal", tuile: "G",
      consigne: "Sors par le Bab, et pose ton premier produit sur ta ferracha",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          "☑ Trois comptes, trois axes — et aucun ne se change en l'autre. Reste le geste qui compte le plus.",
          "Ta ferracha — ton tapis. Ce que tu construis, tu ne le racontes pas : tu l'étales au Souk, dehors des murs. Sors par le Bab, le fil d'or t'y mène. Sous « Ta ferracha », trois cases : le nom du produit, ce qu'il règle, et son lien en https. Pose-en un — même petit, même en chantier.",
          "Ta ferracha est à toi dès aujourd'hui : ce que tu poses ici, la maison le garde, avec les ferrachas du site. Le jour où ta fiche de membre est acceptée — avec le même e-mail —, ce tapis devient aussi ta ferracha sur le site, sans rien ressaisir."
        ]
      }
    });
    pas.push({
      cle: "fin", evenement: null, fin: true,
      consigne: "",
      debut: {
        nom: "Le mou'allim · Fès",
        pages: [
          "☑ Tu connais le chemin du Souk — ta ferracha s'y tient, et elle est à toi : reviens y poser ce que tes mains font.",
          "Ta Dhakira a bougé aujourd'hui" + (maison ? ", ta Sna3a aussi" : "") + ". Le M39ol, lui, est à zéro — et c'est normal : il se reçoit d'un autre, jamais d'ici. Les trois ne se changent pas l'un en l'autre.",
          "Tu sais marcher, lire, répondre, étaler, et où chaque compte se gagne. L'Arb3ine court : quarante jours pour tes quatre premiers défis. La porte est ouverte — yallah."
          // v7.0 — le premier geste de la tariqa choisie (tariqa.js), quand jeu.js le passe
        ].concat(typeof geste === "string" && geste.trim() ? [geste.trim()] : [])
      }
    });
    return pas;
  }

  // ---- L'état dans joueur.recit.tutoriel -------------------------------------------
  function normaliser(t) {
    if (!t || typeof t !== "object") return null;
    if (typeof t.fini === "string" && t.fini) return { fini: t.fini };
    var n = Number(t.etape);
    if (Number.isInteger(n) && n >= 0) return { etape: n };
    return null;
  }
  function fini(t) { var p = normaliser(t); return !!(p && p.fini); }
  function enCours(t) { var p = normaliser(t); return !!(p && typeof p.etape === "number"); }

  // ---- Le fil d'or : le chemin à pied vers la tuile visée ---------------------------
  // BFS sur les tuiles franchissables (4 directions, ordre fixe : déterministe).
  // La cible (sandouq, établi, rayonnage…) est SOLIDE : on mène à la tuile
  // franchissable la plus proche qui la touche. `M` est ZWJ.monde — passé en
  // paramètre pour que ce module reste pur et se teste sous Node.
  var DIRS4 = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  // `cible` : un TYPE de tuile (un caractère de la carte — le fil mène à la plus
  // proche), ou, depuis le 23/09/2026, une PLACE { x, y } — le fil mène à cette
  // tuile-là : devant TON étal sur la Rahba, où tous les étals se ressemblent.
  function cheminVers(M, tx, ty, cible) {
    if (!M || !M.franchissable(tx, ty)) return null;
    if (cible && typeof cible === "object") return cheminVersPlace(M, tx, ty, cible);
    function touche(x, y) {
      for (var d = 0; d < 4; d++) if (M.tuile(x + DIRS4[d][0], y + DIRS4[d][1]) === cible) return true;
      return false;
    }
    var file = [[tx, ty]], avant = {};
    avant[tx + "," + ty] = null;
    while (file.length) {
      var c = file.shift(), x = c[0], y = c[1];
      if (touche(x, y)) {
        var chemin = [];
        var cle = x + "," + y;
        while (cle) { var p = cle.split(","); chemin.unshift({ x: +p[0], y: +p[1] }); cle = avant[cle]; }
        // la tuile visée elle-même, pour poser la balise dessus
        for (var d = 0; d < 4; d++) {
          if (M.tuile(x + DIRS4[d][0], y + DIRS4[d][1]) === cible) {
            return { chemin: chemin, cible: { x: x + DIRS4[d][0], y: y + DIRS4[d][1] } };
          }
        }
      }
      for (var k = 0; k < 4; k++) {
        var nx = x + DIRS4[k][0], ny = y + DIRS4[k][1], nk = nx + "," + ny;
        if (avant[nk] === undefined && M.franchissable(nx, ny)) { avant[nk] = x + "," + y; file.push([nx, ny]); }
      }
    }
    return null;
  }

  // Jusqu'à la place elle-même si l'on peut s'y tenir, sinon jusqu'à côté d'elle.
  function cheminVersPlace(M, tx, ty, place) {
    var cx = Math.floor(Number(place.x)), cy = Math.floor(Number(place.y));
    if (!isFinite(cx) || !isFinite(cy)) return null;
    var surPlace = M.franchissable(cx, cy);
    function arrive(x, y) {
      if (surPlace) return x === cx && y === cy;
      for (var d = 0; d < 4; d++) if (x + DIRS4[d][0] === cx && y + DIRS4[d][1] === cy) return true;
      return false;
    }
    var file = [[tx, ty]], avant = {};
    avant[tx + "," + ty] = null;
    while (file.length) {
      var c = file.shift(), x = c[0], y = c[1];
      if (arrive(x, y)) {
        var chemin = [], cle = x + "," + y;
        while (cle) { var p = cle.split(","); chemin.unshift({ x: +p[0], y: +p[1] }); cle = avant[cle]; }
        return { chemin: chemin, cible: { x: cx, y: cy } };
      }
      for (var k = 0; k < 4; k++) {
        var nx = x + DIRS4[k][0], ny = y + DIRS4[k][1], nk = nx + "," + ny;
        if (avant[nk] === undefined && M.franchissable(nx, ny)) { avant[nk] = x + "," + y; file.push([nx, ny]); }
      }
    }
    return null;
  }

  return { ECHAUFFEMENT: ECHAUFFEMENT, etapes: etapes, normaliser: normaliser, fini: fini, enCours: enCours, cheminVers: cheminVers };
});
