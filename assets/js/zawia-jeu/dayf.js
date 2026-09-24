// ZAW'IA — le jeu · LE DAYF (ضيف) : l'invité, et la loi des trois jours (pur).
//
// Une zawia hébergeait d'abord le voyageur : c'est sa première fonction, avant
// l'enseignement. Et la coutume donne la mécanique toute faite — on héberge un
// invité TROIS JOURS sans rien lui demander, et le troisième jour seulement
// l'hôte a le droit de demander ce qui l'amène.
//
// D'où une porte qui n'existait pas : un inconnu entre, sans compte, sans
// dossier, sans e-mail. Il marche dans la vraie cour. Au troisième jour, le
// mou'allim pose la question, et il y a une porte pour chaque réponse.
//
// ⚠️ LA RÈGLE FONDATRICE N'EST PAS TOUCHÉE. « Pas de parrainage, pas de jeu »
//    garde LA COUR : un Dayf n'a pas de compte, pas de ligne en base, pas de
//    rang, et rien de ce qu'il fait n'est écrit ailleurs que dans son propre
//    navigateur. C'est une porte d'entrée, pas la cour — exactement le statut
//    déjà accordé à « Chkoun Nsyan ? » le 19/09/2026.
//
// ⚠️ AUCUN POINT, JAMAIS. La charte : un point se reçoit des autres. Un invité
//    ne reçoit que l'hospitalité, et n'emporte donc rien le jour où il entre
//    pour de bon — il repart à zéro comme tout le monde, et c'est juste. Un
//    test refuse tout `+=` sur un compteur dans ce fichier.
//
// ⚠️ AUCUN LIEN, AUCUN NOM. Ce module nomme des portes ; c'est `jeu.js` qui
//    résout les adresses (comme `adresseJeu()` le fait pour le partage), et
//    c'est la BASE qui dit ce que la maison propose. Le voile tient : rien
//    dans ce fichier ne nomme la maison ni un de ses cours.
//
// ⚠️ CE MODULE NE DÉCIDE RIEN DE CE QUI COMPTE. Il dit ce que l'écran PROPOSE
//    à un invité, et pourquoi une porte est fermée — comme `chajara.js` et
//    `paliers.js`. Les portes qui comptent (l'établi, le rihal, les séances,
//    poser un tapis) sont tenues par la base, qui ne connaît pas ce visiteur.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.dayf = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var JOURS = 3;

  // ---- Ce que chaque jour ouvre -------------------------------------------------------
  // La valeur est le JOUR d'ouverture ; `null` veut dire « jamais pour un
  // invité ». Une salle inconnue reste fermée (fail-close, comme le voile) :
  // on n'ouvre pas une porte qu'on a oublié de déclarer.
  //
  // Jour 1 — la dyafa : on ne demande rien. Le thé, la cour, les sept murs.
  // Jour 2 — on montre : une page du sandouq, les rayons, la place au marché.
  // Jour 3 — on demande : « ach jabek ? »
  var SALLES = {
    sahn: 1,          // la cour, le vestibule, la promenade
    khatt: 1,         // les sept valeurs, récitées par les murs
    atay: 1,          // le thé de l'accueil — offrir le thé, c'est recevoir
    kelma: 1,         // le mot du jour, au lawh
    // ⚠️ `rencontres` reste FERMÉ en v7.2, et c'est une décision en attente
    //    (D9) : faire entrer un navigateur anonyme dans le direct des
    //    membres se décide, ça ne se déduit pas. La cour n'est pas vide
    //    pour autant — six habitants y vivent (pnj.js).
    rencontres: null,
    khizana: 2,       // la bibliothèque
    sandouq: 1,       // UNE page perdue, et sa carte peinte — DÈS LE JOUR 1 :
                      // un invité doit sentir ce qu'il peut faire avant qu'on
                      // lui explique ce qu'il est. C'est la leçon de la v7.2a.
    rayons: 2,        // ce que la maison ouvre — lu en base, jamais ici
    qlil: 2,          // le golf du prompt, trois essais
    rahba: 2,         // le marché : il regarde, et il voit les places vides
    question: 3,      // le mou'allim, et les trois portes

    etabli: null, rihal: null, imtihan: null, seances: null, riwaq: null,
    majliss: null, rihla: null, etal: null, safqa: null, kounnach: null,
    masarat: null, parrainer: null, khessa: null
  };

  // Le nombre d'essais qu'un invité a au golf du prompt. Il appelle un modèle,
  // donc il coûte : trois, pas dix. Le plafond global de la maison tient le
  // reste, et la base compte de toute façon.
  var ESSAIS_QLIL = 3;
  // Une seule page du sandouq : la fondatrice. Une page offerte, pas un tiroir
  // ouvert — ce qu'on donne à un invité doit rester un cadeau.
  var PAGES_OFFERTES = 1;

  // ---- L'état, dans le navigateur de l'invité ------------------------------------------
  // { debut: "AAAA-MM-JJ", accueil: bool, question: bool, porte: <clé|null> }
  // Rien en base. Effacé, il est simplement reçu une seconde fois : un hôte ne
  // compte pas.
  var RE_JOUR = /^\d{4}-\d{2}-\d{2}$/;
  function normaliser(x) {
    var e = x && typeof x === "object" ? x : {};
    return {
      debut: RE_JOUR.test(e.debut) ? e.debut : null,
      accueil: !!e.accueil,
      question: !!e.question,
      porte: PORTES.some(function (p) { return p.cle === e.porte; }) ? e.porte : null
    };
  }

  // Le jour de l'invité, compté sur les DATES (celle de Casablanca, que jeu.js
  // donne), jamais sur des heures : deux invités arrivés le même jour en sont
  // au même jour. Avant le premier pas : 1. Au-delà du troisième : on rend le
  // nombre réel, et `fini()` dit que la maison n'ouvre plus rien de neuf.
  function jour(etat, aujourdhui) {
    var e = normaliser(etat);
    if (!e.debut || !RE_JOUR.test(aujourdhui)) return 1;
    var a = Date.UTC(+e.debut.slice(0, 4), +e.debut.slice(5, 7) - 1, +e.debut.slice(8, 10));
    var b = Date.UTC(+aujourdhui.slice(0, 4), +aujourdhui.slice(5, 7) - 1, +aujourdhui.slice(8, 10));
    var n = Math.floor((b - a) / 86400000) + 1;
    return n < 1 ? 1 : n;
  }
  function fini(etat, aujourdhui) { return jour(etat, aujourdhui) > JOURS; }

  // Ouvrir une salle : le jour déclaré, ou n'importe quand après. Ce qui
  // s'ouvre ne se referme jamais — on ne reprend pas ce qu'on a offert.
  function peut(cle, j) {
    var d = SALLES[cle];
    if (typeof d !== "number") return false;
    return (Math.floor(Number(j)) || 1) >= d;
  }
  // Ce qui s'ouvre CE jour-ci, pour que Ba Driss puisse le dire.
  function ouvertesLe(j) {
    var n = Math.floor(Number(j)) || 1;
    return Object.keys(SALLES).filter(function (c) { return SALLES[c] === n; });
  }

  // ---- L'accueil : Ba Driss, à la porte -------------------------------------------------
  // Le bawwab reçoit — c'est son métier, et il hèle déjà depuis la porte. Il
  // dit la loi des trois jours à voix haute : un invité doit savoir qu'on ne
  // lui demandera rien, sinon il se tient sur ses gardes tout du long.
  // ⚠️ v7.2a — L'ORDRE EST TOUT, et la première version se trompait. Elle
  // accueillait l'invité en lui expliquant son statut : quatre paragraphes de
  // règlement avant le premier pas. On ne retient personne avec un règlement.
  // Désormais : la MAISON PERD SA COULEUR sous ses yeux, on lui dit qu'il est
  // le seul à l'avoir vu, et la règle des trois jours tient en une phrase, à
  // la fin. Ce qui accroche, c'est d'être témoin — pas d'être hébergé.
  var APPARITION = {
    nom: "",   // Nsyan n'a pas de nom qu'on prononce, et pas de visage : c'est le point.
    pages: [
      "…",
      "La cour perd ses couleurs. Le zellige devient gris. Le bruit de la fontaine s'éloigne, comme si quelqu'un avait oublié qu'elle coulait.",
      "Quelque chose vient de traverser la cour. Ça n'a rien cassé, rien pris. Ça a juste fait oublier."
    ]
  };
  function accueil(pseudo) {
    var p = String(pseudo || "").trim() || "Dayf";
    return {
      nom: "Ba Driss, le bawwab",
      pages: [
        "Tu l'as vu.",
        "Ne dis pas non — je te regardais. Tes yeux l'ont suivi jusqu'au mur nord.",
        "Les autres ont cessé de le voir il y a longtemps. Ils marchent dedans sans savoir. Toi, tu es entré il y a trente secondes et tu l'as vu. Ça, " + p + ", c'est rare.",
        "Dans la maison, on l'appelle Nsyan. Il ne casse rien, ne vole rien. Il fait oublier : le nom d'une porte, le sens d'un mot, la main qui a posé la première pierre.",
        "Va voir la Khizana, au couchant de la cour. Il y a un coffre au fond — un sandouq. Il garde des pages qu'on lui a arrachées. Ouvre-le.",
        "Et ne t'inquiète de rien d'autre : chez nous, on ne demande rien à un invité pendant trois jours."
      ]
    };
  }

  // Ce que le bawwab dit les jours suivants, quand quelque chose s'ouvre.
  var RETOURS = {
    2: { nom: "Ba Driss, le bawwab", pages: [
      "Te revoilà. Bien.",
      "Va lire les murs du Sahn, si tu ne l'as pas fait. Sept phrases y sont gravées — ce que la maison tient pour vrai.",
      "Enfin, six. Il y en avait sept. Personne ici ne se souvient de la septième, et personne n'ose le dire à voix haute.",
      "Et passe le Bab, dehors : le marché est là. Regarde les tapis, et regarde les places vides. Chacune porte un numéro."
    ] },
    3: { nom: "Ba Driss, le bawwab", pages: [
      "Troisième jour. Le mou'allim t'attend.",
      "Ne crains rien : chez nous, personne n'a jamais mis un invité dehors. Il veut juste savoir ce qui t'amène."
    ] }
  };
  function retour(j) { return RETOURS[Math.floor(Number(j)) || 0] || null; }

  // ---- La page revenue : le seul moment où un invité reçoit quelque chose -------------
  // ⚠️ On ne lui annonce PAS de points. Il n'en a pas, le HUD n'en montre pas,
  // et lui en promettre ici serait le seul mensonge de tout le parcours. Ce
  // qu'il reçoit est ce qu'il VOIT : la couleur qui revient dans la cour.
  function carte(titre, reponse) {
    return {
      nom: "La couleur revient",
      pages: [
        "« " + String(titre || "") + " » — " + String(reponse || "") + ".",
        "Regarde la cour. Le zellige a repris ses bleus, la fontaine se réentend. Tu viens de faire reculer Nsyan d'un pas, et ça s'est vu.",
        "La carte est à toi. Elle est dans ta collection, au menu — avec les vingt et une autres, que tu ne peux pas encore ouvrir."
      ]
    };
  }

  // ---- Le sandouq : une page, et une seule -----------------------------------------------
  // Ce qu'on donne à un invité doit rester un CADEAU. Une page offerte est un
  // cadeau ; le tiroir ouvert n'en est plus un, et ne fait plus envie.
  var SANDOUQ_DONNE = {
    nom: "Le sandouq",
    pages: [
      "Le coffre ne s'ouvre plus. Pas fermé à clé : il ne s'ouvre plus, voilà tout.",
      "Tu en as eu une. C'est ce qu'on donne à un invité — et c'est déjà beaucoup : la plupart des gens passent devant ce coffre toute leur vie sans savoir ce qu'il contient.",
      "Les vingt et une autres sont là-dedans. Elles s'ouvrent une par jeudi, pour ceux que la maison a reconnus."
    ]
  };

  // Ce que dit la collection à quelqu'un qui n'en a qu'une. On ne cache pas les
  // autres : on les MONTRE fermées. C'est ce qui manque qui donne envie.
  function collection(gagnees, total) {
    var g = Math.max(0, Math.floor(Number(gagnees) || 0));
    var t = Math.max(0, Math.floor(Number(total) || 0));
    var reste = Math.max(0, t - g);
    return g === 0
      ? "Vingt-deux pages ont été arrachées à la Rihla. Tu n'en as retrouvé aucune — le sandouq t'attend, au fond de la Khizana."
      : "Tu en as " + g + " sur " + t + ". Les " + reste + " autres sont chez Nsyan, et elles s'ouvrent une par jeudi — pour ceux que la maison a reconnus.";
  }

  // ---- Le mur effacé -------------------------------------------------------------------
  // Une des sept valeurs a été mangée. Le mur est là, la phrase n'y est plus.
  // Un invité ne peut pas la retrouver : c'est le premier mystère qu'il
  // emporte en sortant, et c'est ce qui le fait revenir.
  var KHATT_EFFACE = 3;   // le 4ᵉ mur du Sahn (0-based)
  var MUR_EFFACE = {
    nom: "Le mur effacé",
    pages: [
      "Le zellige est intact. Le cadre est intact. À l'intérieur, la pierre est lisse — comme si on l'avait polie.",
      "Il y avait une phrase ici. Tu le sais parce que les six autres murs en portent une, et qu'aucun mur de cette cour n'a été posé sans raison.",
      "Personne dans la maison ne sait plus laquelle. Ils ont essayé de la reconstituer ; à chaque fois, ils tombent sur une phrase qui sonne juste et qui n'est pas la bonne.",
      "Celui qui la retrouvera ne sera pas un invité ce jour-là."
    ]
  };

  // ---- Les portes fermées : elles ORIENTENT -------------------------------------------
  // Le but n'est pas d'éconduire : un invité qu'on renvoie ne revient pas. Un
  // refus dit toujours où aller à la place.
  var REFUS = {
    etabli: { nom: "L'établi des Ta7addi", pages: [
      "L'établi est aux gens de la maison. On y travaille, et le travail ne se montre pas à un invité le premier jour.",
      "Toi, tu es reçu : le thé, la cour, les sept murs — et, dès demain, une page du sandouq. Le troisième jour, il y aura une porte pour ce que tu veux faire."
    ] },
    rihal: { nom: "Le rihal", pages: [
      "Le rihal interroge les gens de la maison : ses questions viennent de ce qui s'apprend derrière cette porte-là.",
      "Ce qui t'est ouvert vaut mieux qu'un questionnaire : les murs du Sahn portent les sept valeurs de la maison. Lis-les — c'est là qu'on apprend qui nous sommes."
    ] },
    imtihan: { nom: "L'épreuve", pages: [
      "L'épreuve est pour ceux qui ont une lignée ici. Elle ne dit rien à quelqu'un qui vient d'arriver.",
      "Si tu veux te mesurer, l'établi du prompt t'ouvre trois essais dès demain. Ça, c'est une vraie mesure."
    ] },
    seances: { nom: "Le point hebdo", pages: [
      "La halqa se tient le mercredi à sept heures du soir, et elle est entre gens de la maison.",
      "Mais un invité y a sa place, et même ses habits. Dis-le au mou'allim le troisième jour : c'est lui qui t'y emmène."
    ] },
    riwaq: { nom: "Le Riwaq", pages: [
      "Le Riwaq annonce ce que la maison organise pour les siens.",
      "Ce qui est ouvert à tous se lit aux rayons de la Khizana, dès demain."
    ] },
    etal: { nom: "Poser un tapis", pages: [
      "On n'étale pas quand on est invité. Un tapis se pose quand on est de la maison — c'est ce qui lui donne son prix.",
      "Regarde les places vides de la Rahba : chacune porte un numéro. L'une d'elles peut porter ton nom, et le mou'allim te dira comment."
    ] },
    rihla: { nom: "Bab ar-Rihla", pages: [
      "La porte du temps mène à Fès, et Fès se traverse avec un compagnon qu'on met des semaines à élever.",
      "Ce n'est pas un refus : c'est trop grand pour trois jours. Reste d'abord dans la cour."
    ] },
    majliss: { nom: "La chambre du conseil", pages: [
      "Cette porte n'existe pas pour toi. Ne t'en fais pas : elle n'existe pas non plus pour la plupart des gens d'ici."
    ] },
    // Les salles du DEUXIÈME jour. Un « pas encore » n'est pas un « non » : on
    // dit ce qui s'ouvre demain, et l'invité revient pour ça.
    khizana: { nom: "La Khizana", pages: [
      "La bibliothèque s'ouvre demain. On ne met pas un invité devant des livres le jour où il arrive : d'abord le thé, et la cour.",
      "Aujourd'hui, va lire les murs du Sahn. Sept phrases y sont gravées — elles disent mieux que moi qui nous sommes."
    ] },
    sandouq: { nom: "Le sandouq", pages: [
      "Le coffre est au fond de la Khizana, et la Khizana s'ouvre demain.",
      "Il garde des pages arrachées à un vieux livre de voyage. Tu en retrouveras une — et elle sera à toi, avec sa carte peinte."
    ] },
    qlil: { nom: "L'établi du prompt", pages: [
      "Demain. Trois essais t'attendent : faire dire à la machine exactement ce qu'on lui demande, avec le moins de mots possible.",
      "C'est plus dur que ça n'en a l'air, et c'est la meilleure mesure de ce que tu sais vraiment faire."
    ] },
    rahba: { nom: "Le Bab", pages: [
      "Dehors, c'est le marché — la Rahba. Il s'ouvre à toi demain.",
      "Tu y verras les tapis des membres, ce qu'ils vendent, et les places encore vides. Chacune porte un numéro."
    ] }
  };
  function refus(cle) {
    var r = REFUS[cle];
    return r || { nom: "Cette porte", pages: [
      "Cette porte est fermée aux invités, et elle le restera tant que tu en es un.",
      "Le troisième jour, le mou'allim te dira comment on ouvre celles qu'on veut vraiment ouvrir."
    ] };
  }

  // ---- Le troisième jour : « Ach jabek ? » -----------------------------------------------
  // La question que la coutume autorise à la fin de l'hospitalité. Elle
  // n'expulse personne : les trois réponses sont honorables, et la troisième
  // laisse l'invité chez lui.
  var PORTES = [
    { cle: "batir", nom: "Je construis déjà",
      sous: "j'ai fait des choses qui marchent",
      pages: [
        "Alors ne prends aucun cours, tu perdrais ton temps. Dépose ton dossier.",
        "Ici on n'entre pas en payant : on entre en montrant. Trois lignes sur ce que tu as construit suffisent — c'est lu par des gens, pas par une machine.",
        "Et sur la Rahba, la place que tu as vue hier porte un numéro. Elle portera ton nom, ton numéro et ton adresse, comme celles des autres."
      ] },
    { cle: "apprendre", nom: "Je veux apprendre à construire",
      sous: "je n'ai pas encore les mains",
      pages: [
        "C'est une bonne réponse, et elle est plus rare que tu ne crois : la plupart des gens préfèrent mentir.",
        "Ici on étale ce qu'on a fait, on ne raconte pas ce qu'on va faire. Si tes mains ne savent pas encore, ce n'est pas un défaut — c'est simplement l'ordre des choses. Apprends d'abord.",
        "Les rayons de la Khizana portent ce que la maison ouvre à qui veut apprendre. Va les voir : c'est par là qu'on commence, et le premier rayon ne coûte rien."
      ] },
    { cle: "passer", nom: "Je passais",
      sous: "je regardais, c'est tout",
      pages: [
        "Alors tu as bien fait, et tu n'as rien à justifier. Personne n'a jamais mis un invité dehors d'ici.",
        "Reviens mercredi soir, si tu veux : la halqa se tient à sept heures. Un invité y a sa place, et même ses habits.",
        "La porte reste ouverte. Et le mot du jour, lui, change chaque matin."
      ] }
  ];
  function porte(cle) {
    for (var i = 0; i < PORTES.length; i++) if (PORTES[i].cle === cle) return PORTES[i];
    return null;
  }

  // La demande du mou'allim, le troisième jour. Le pseudo entre dans sa bouche.
  function question(pseudo) {
    var p = String(pseudo || "").trim() || "Dayf";
    return {
      nom: "Le mou'allim",
      pages: [
        "Trois jours, " + p + ". Tu as bu le thé, tu as marché dans la cour, tu as lu les murs.",
        "La coutume m'autorise enfin la question qu'on ne pose pas à un invité avant la fin : ach jabek ? Qu'est-ce qui t'amène ?",
        "Réponds ce qui est vrai. Les trois réponses ouvrent une porte, et aucune ne ferme celle-ci."
      ]
    };
  }

  // ---- Ce que l'invité voit de lui-même -------------------------------------------------
  // Jamais un compteur, jamais un rang : une ligne qui dit où il en est de son
  // hospitalité. C'est tout ce qu'un invité a le droit d'avoir.
  function ligne(etat, aujourdhui) {
    var j = jour(etat, aujourdhui);
    if (j > JOURS) return "Dayf · la porte reste ouverte";
    return "Dayf · jour " + j + " sur " + JOURS;
  }

  // Le carnet d'un invité : une seule page, une seule forme (la version arabe
  // la traduit d'un gabarit).
  function carnet(etat, aujourdhui) {
    var j = jour(etat, aujourdhui);
    return "Tu es Dayf — l'invité de la maison.\n" +
      (j > JOURS
        ? "Tes trois jours sont passés, et la porte est restée ouverte.\n"
        : "Jour " + j + " sur " + JOURS + ". On ne te demande rien.\n") +
      "Aucun point, aucun rang : un invité ne se classe pas.\n" +
      "Rien de ce que tu fais ici n'est écrit ailleurs que dans ton navigateur.";
  }

  // ---- v7.8 — MOUL L7ANOUT : le mot de la porte -----------------------------------------
  // Le hanout (l3b.zawia.tech/hanout, le jeu d'appel de la maison) donne à chaque
  // joueur un code ; pour « fermer boutique et repartir plus fort », il lui faut
  // un mot qui ne se dit qu'ICI. Ba Driss le dit : calculé sur le code et sur le
  // jour (Casablanca), il ne sert qu'à celui qui est venu.
  // ⚠️ LE MÊME CALCUL VIT DANS assets/js/zawia-hanout/cle.js — cette page n'en
  // charge aucun script, et l'autre aucun d'ici. Un test compare les deux listes
  // et les deux résultats : on ne change jamais l'un sans l'autre.
  var MOTS_HANOUT = ["SAROUT", "BARAKA", "ZELLIJ", "NA3NA3", "ATAY", "QANDIL", "KHMISSA", "SEKKAR", "ZA3FRAN", "TARBOUCH", "BELGHA", "MEJMAR", "BERRAD", "SINIYA", "KOUNNACH", "HANOUT",
    "KHOBZ", "ZITOUN", "TMER", "WERD", "FANOUS", "SELLOUM", "QOBBA", "SAQIYA", "MIZAN", "QALAM", "DERB", "RIAD", "NOQRA", "7ENNA", "GHORFA", "BAB"];
  function hacheHanout(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function estCodeHanout(c) { return typeof c === "string" && /^[A-HJ-NP-Z2-9]{6}$/.test(c); }
  function motHanout(code, jourCasa) {
    var c = String(code || "").toUpperCase();
    if (!estCodeHanout(c) || !/^\d{4}-\d{2}-\d{2}$/.test(String(jourCasa || ""))) return "";
    var h = hacheHanout(c + "|" + jourCasa + "|bab");
    return MOTS_HANOUT[h % MOTS_HANOUT.length] + "-" + (10 + (h >>> 8) % 90);
  }
  // Ce que Ba Driss dit à qui vient du hanout — invité ou membre, la même chose.
  function hanoutMot(code, jourCasa) {
    var m = motHanout(code, jourCasa);
    if (!m) return null;
    return {
      nom: "Ba Driss, le bawwab",
      pages: [
        "Ah — moul l7anout ! On m'a dit qu'une boutique du derb cherchait la porte.",
        "Ton mot, pour aujourd'hui : " + m + ".",
        "Il ne vaut que pour ton code, et il change demain. Retourne à ta boutique quand tu voudras — mais regarde un peu la cour d'abord : c'est pour ça qu'on t'a fait venir."
      ]
    };
  }

  return {
    JOURS: JOURS, SALLES: SALLES, PORTES: PORTES,
    ESSAIS_QLIL: ESSAIS_QLIL, PAGES_OFFERTES: PAGES_OFFERTES,
    normaliser: normaliser, jour: jour, fini: fini, peut: peut, ouvertesLe: ouvertesLe,
    accueil: accueil, retour: retour, refus: refus, REFUS: REFUS,
    APPARITION: APPARITION, KHATT_EFFACE: KHATT_EFFACE, MUR_EFFACE: MUR_EFFACE,
    SANDOUQ_DONNE: SANDOUQ_DONNE, collection: collection, carte: carte,
    question: question, porte: porte, ligne: ligne, carnet: carnet,
    MOTS_HANOUT: MOTS_HANOUT, estCodeHanout: estCodeHanout, motHanout: motHanout, hanoutMot: hanoutMot
  };
});
