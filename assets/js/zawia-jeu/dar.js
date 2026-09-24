// ZAW'IA — le jeu · LE DAR (الدار) : le menu devient une maison (pur).
//
// v8.4 — 24/09/2026, Youssef : « l'UX et le tooling du menu doit être revu
// entièrement, avec un excellent univers graphique wow — c'est une corvée de se
// retrouver ». Le menu était une colonne de 47 boutons de texte : aucune icône,
// aucune recherche, aucun état. Il devient :
//   · la BARRE — cinq gestes de chaque jour, en icônes peintes, avec leur touche ;
//   · le DAR — une maison illustrée : ta carte, une recherche, ce qui t'attend
//     aujourd'hui, et quatre portes (Apprendre · Jouer · Partager · Moi) ;
//   · ALLER — la maison d'un geste : y être tout de suite, ou par le fil d'or ;
//   · LES GENS — qui est là.
//
// ⚠️⚠️ LE DAR NE DÉCIDE D'AUCUNE VISIBILITÉ. L'ancien menu (#zj-menu) reste dans
// la page, jamais montré : c'est le REGISTRE DES COMMANDES. Chaque carte porte la
// clé de son bouton `#zj-menu-<clé>` ; le Dar la montre si ce bouton est visible,
// et l'actionne quand on la touche. Ainsi la liste blanche de l'invité, les
// paliers, la lignée, le Morchid et le Majliss valent pour le Dar sans qu'on en
// réécrive une ligne. Un test exige que CHAQUE commande ait sa carte, et chaque
// carte sa commande : rien ne disparaît.
//
// Pur : aucun accès au DOM, au réseau, à l'horloge ni au hasard — testable sous Node.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.dar = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- La planche des icônes peintes (assets/img/zawia/jeu/icones.webp) --------------
  // 36 objets du pays, peints dans la facture du Rafiq (GPT Image 2.5, 24/09/2026),
  // détourés, recomposés en 6 × 6 cases de 192 px par scripts/jeu/icones.py — dans
  // CET ordre, ligne par ligne. Changer l'ordre ici sans refaire la planche décale tout.
  var ICONES = {
    colonnes: 6, taille: 192,
    noms: [
      "wird", "ferracha", "kalam", "gens", "aller", "dar",
      "livres", "kounnach", "chemin", "sceau", "rihal", "plume",
      "porte-fes", "bannieres", "theiere", "fontaine", "astrolabe", "arcade",
      "echoppe", "lawh", "miroir", "arganier", "lanterne", "mains",
      "cartes", "carnet", "tuiles", "lebsa", "tableau", "porte-cedre",
      "plaque", "cle", "sablier", "balance", "loupe", "diplome"
    ]
  };
  function cellule(nom) {
    var i = ICONES.noms.indexOf(nom);
    return i < 0 ? null : { c: i % ICONES.colonnes, r: Math.floor(i / ICONES.colonnes) };
  }

  // ---- Les quatre portes : les trois verbes de la maison, et Moi ------------------------
  var PORTES = [
    { cle: "apprendre", nom: "Apprendre", ar: "نتعلّم", icone: "livres" },
    { cle: "jouer", nom: "Jouer", ar: "نلعب", icone: "porte-fes" },
    { cle: "partager", nom: "Partager", ar: "نشارك", icone: "mains" },
    { cle: "moi", nom: "Moi", ar: "أنا", icone: "miroir" }
  ];

  // ---- Les cartes : une par commande du menu (clé = #zj-menu-<clé>) ----------------------
  // `pourquoi` : ce qu'on y trouve, en une ligne (80 caractères au plus) — jamais un
  // point promis. `mots` : ce qu'on tape pour la trouver (français, darija, arabe).
  function carte(cle, porte, icone, nom, ar, pourquoi, mots) {
    return { cle: cle, porte: porte, icone: icone, nom: nom, ar: ar, pourquoi: pourquoi, mots: mots || [] };
  }
  var ENTREES = [
    // Apprendre — dans la zawia
    carte("wird", "apprendre", "wird", "Le Wird du jour", "الورد", "Un défi par jour, vingt minutes au plus.", ["defi", "jour", "aujourd'hui", "lyoum", "ورد"]),
    carte("bibliotheque", "apprendre", "livres", "La bibliothèque", "الخزانة", "Les rayons de la Khizana, les ressources, al-Moujam.", ["khizana", "livres", "ressources", "moujam", "lexique", "formation", "cours"]),
    carte("kounnach", "apprendre", "kounnach", "Le Kounnach", "الكنّاش", "Les wasfat que ta Sna3a ouvre, niveau par niveau.", ["wasfa", "wasfat", "recette", "tutoriel ecrit", "sna3a"]),
    carte("wasfa", "apprendre", "kounnach", "Écrire une wasfa", "وصفة", "Ta recette pour le Kounnach. Publiée, elle compte.", ["wasfa", "ecrire", "proposer", "recette"]),
    carte("masarat", "apprendre", "chemin", "Les Masarat", "المسارات", "Des parcours à livrable, attestés par le bureau.", ["parcours", "masar", "etape", "livrable", "chemin"]),
    carte("maharat", "apprendre", "sceau", "Mes maharat", "المهارات", "Ce que tu sais faire, prouvé devant témoin. L'Ijaza.", ["competences", "ijaza", "diplome", "certificat", "skills"]),
    carte("imtihan", "apprendre", "rihal", "L'épreuve", "الامتحان", "Une question d'IA, vingt secondes, au rihal.", ["imtihan", "quiz", "question", "rihal", "examen"]),
    carte("tableau", "apprendre", "tableau", "Le tableau", "اللوحة", "Les défis de ton Arb3ine, et où tu en es.", ["defis", "arb3ine", "lawh", "tableau"]),
    carte("oumm", "apprendre", "lanterne", "Les cinq épreuves", "أمّ الإيا", "Répondre à Oumm IA, une épreuve après l'autre.", ["oumm", "peur", "epreuves", "voile"]),
    carte("tableaux", "apprendre", "lanterne", "La qubba", "القبّة", "Les sept tableaux du Voilé.", ["qubba", "tableaux", "moulaththam", "voile", "legende"]),
    carte("tutoriel", "apprendre", "chemin", "Le tutoriel", "المعلّم", "Le mou'allim te reprend par l'épaule.", ["tutoriel", "aide", "mou'allim", "guide", "debut"]),
    carte("prologue", "apprendre", "sablier", "Le prologue", "التمهيد", "Relire comment tout a commencé.", ["prologue", "histoire", "nsyan", "debut", "recit"]),
    // Jouer — à Fès et dans la cour
    carte("rihla", "jouer", "porte-fes", "La Rihla", "الرحلة", "Sortir dans Fès : les ombres, les maîtres, l'ijaza.", ["fes", "voyage", "rihla", "ombres", "rafiq", "aventure"]),
    carte("kelma", "jouer", "tuiles", "Lkelma d'lyoum", "كلمة اليوم", "Le mot du jour, six essais, le même pour tous.", ["mot", "jour", "kelma", "wordle", "lettres"]),
    carte("atay", "jouer", "theiere", "Atay", "أتاي", "Trois verres, versés de haut. La rghwa dit ta main.", ["the", "atay", "verre", "rghwa", "orangers"]),
    carte("qlil", "jouer", "plume", "Qlil w mfid", "قليل ومفيد", "Le golf du prompt : le plus court qui marche gagne.", ["golf", "prompt", "claude", "court", "ia"]),
    carte("khessa", "jouer", "fontaine", "La fontaine du Sahn", "الخصّة", "Une goutte par geste, et la fontaine est à tous.", ["fontaine", "khessa", "goutte", "semaine"]),
    carte("cartes", "jouer", "cartes", "Mes cartes", "البطاقات", "Ta collection de la Dhakira, carte par carte.", ["cartes", "collection", "dhakira", "pages"]),
    carte("kharita", "jouer", "aller", "La Kharita", "الخريطة", "La carte du Maroc : les villes reviennent avec leurs pages.", ["carte", "maroc", "villes", "kharita", "monde"]),
    carte("carte", "jouer", "cartes", "Ma carte du Rafiq", "بطاقة الرفيق", "La carte de ton compagnon, à partager.", ["rafiq", "compagnon", "carte", "partager"]),
    carte("duel", "jouer", "bannieres", "Défier un ami", "تحدّي صديق", "Un duel du Rafiq, par un simple lien.", ["duel", "defier", "ami", "lien"]),
    carte("nsyan", "jouer", "gens", "Chkoun Nsyan ?", "شكون نسيان؟", "Le jeu de la halqa, entre amis, sans compte.", ["nsyan", "amis", "halqa", "undercover", "jeu"]),
    carte("wach", "jouer", "loupe", "Wach hadi IA ?", "واش هادي؟", "Trouver l'IA en dix duels.", ["wach", "ia", "detecteur", "vrai", "faux"]),
    // Partager — à la halqa
    carte("souk", "partager", "echoppe", "Le Souk", "السوق", "La Rahba : les ferrachas de tous, et les affaires.", ["souk", "rahba", "ferracha", "tapis", "produits", "marche", "vendre"]),
    carte("safqa", "partager", "balance", "Mes affaires", "صفقاتي", "Tes affaires au Souk, et le fil de chacune.", ["affaires", "safqa", "vente", "achat", "smsra"]),
    carte("riwaq", "partager", "arcade", "Le Riwaq", "الرواق", "Les rendez-vous de la maison : la halqa, les ateliers.", ["riwaq", "rendez-vous", "halqa", "seance", "meet", "annonces"]),
    carte("mechouar", "partager", "bannieres", "Al-Mechouar", "المشور", "L'arène : la plume, la chaîne, la balance.", ["arene", "mechouar", "joute", "moujahid", "combat"]),
    // v8.7 — le Derb t-Tadamoun : l'économie sociale et solidaire, dans une ruelle de la Rahba
    carte("derb", "partager", "arganier", "Le Derb t-Tadamoun", "درب التضامن", "Les projets solidaires : y aider, les parrainer, poser le sien.", ["derb", "tadamoun", "ess", "rse", "solidaire", "social", "association", "cooperative", "benevole", "twiza", "تضامن"]),
    // v8.5 — le Kalam de la pièce (public, rien n'est gardé) et les Rasa'il (privées, gardées en base)
    carte("dire", "partager", "kalam", "Le Kalam de la pièce", "الكلام", "Ce qui se dit là où tu es, depuis ton arrivée.", ["dire", "parler", "bulle", "kalam", "chat", "discuter", "كلام"]),
    carte("rasail", "partager", "plume", "Mes messages", "رسائلي", "Tes conversations privées avec les membres.", ["messages", "message", "rasail", "prive", "ecrire", "dm", "inbox", "boite", "رسائل"]),
    carte("lawh", "partager", "lawh", "Le Lawh", "اللوح", "Le classement public, sur trois axes jamais additionnés.", ["classement", "lawh", "rang", "tableau d'honneur"]),
    carte("ijaza", "partager", "diplome", "Ma carte de l'Ijaza", "الإجازة", "Ton diplôme, à partager.", ["ijaza", "diplome", "certificat", "partager", "linkedin"]),
    carte("lebsa", "partager", "lebsa", "Ma lebsa", "اللبسة", "Les habits de la halqa, portés en direct à la caméra.", ["lebsa", "habits", "meet", "camera", "jellaba"]),
    carte("parrainer", "partager", "mains", "Parrainer", "التزكية", "Faire entrer quelqu'un que tu connais.", ["parrainer", "inviter", "parrainage", "ami"]),
    carte("rkhama", "partager", "plaque", "La Rkhama", "الرخامة", "La dalle de ceux qui tiennent l'échelle.", ["rkhama", "partenaires", "merci"]),
    carte("majliss", "partager", "porte-cedre", "Le Majliss", "المجلس", "La chambre du conseil.", ["majliss", "conseil"]),
    // Moi
    carte("ferracha", "moi", "ferracha", "Ma ferracha", "فرّاشتي", "Ton tapis au Souk : tes produits, et le chemin de ton étal.", ["ferracha", "tapis", "mes produits", "etal", "souk"]),
    carte("carnet", "moi", "carnet", "Mon carnet", "الكرّاسة", "Tes trois axes, tes pages, tes jeux.", ["carnet", "stats", "progression", "m39ol", "sna3a", "dhakira"]),
    // v8.6 — la Bitaqa : ce que tu cherches, ce que tu offres, pour que la maison te trouve
    carte("bitaqa", "moi", "sceau", "Ma carte de membre", "بطاقتي", "Ce que tu cherches, ce que tu offres : que la maison te trouve.", ["carte", "profil", "networking", "cherche", "offre", "annuaire", "linkedin", "bitaqa", "بطاقة"]),
    carte("tariqa", "moi", "astrolabe", "Ma tariqa", "الطريقة", "Ton rôle dans la maison, et ton terrain.", ["tariqa", "role", "maydan", "terrain", "classe"]),
    carte("perso", "moi", "miroir", "Mon personnage", "شخصيتي", "L'Atelier : ton visage, ton habit, ta coiffure.", ["personnage", "avatar", "atelier", "visage", "habit"]),
    carte("dyaf", "moi", "dar", "Ach jabek ?", "آش جابك؟", "Les trois portes de l'invité.", ["dayf", "invite", "portes"]),
    carte("rejouer", "moi", "sablier", "Rejouer le début", "من البداية", "Le compte d'essai repart du jour 1.", ["rejouer", "essai", "debut"]),
    carte("langue", "moi", { lettre: "ع" }, "La langue", "العربية", "Jouer en arabe, ou revenir au français.", ["langue", "arabe", "francais", "عربية"]),
    carte("sortir", "moi", "cle", "Sortir de la maison", "الخروج", "Quitter la maison. Ta place t'attend.", ["sortir", "deconnexion", "quitter"])
  ];
  function entree(cle) {
    for (var i = 0; i < ENTREES.length; i++) if (ENTREES[i].cle === cle) return ENTREES[i];
    return null;
  }

  // ---- Aller : la maison, d'un geste ---------------------------------------------------------
  // `tuile` : le type de case que le fil d'or vise (monde.js, LEGENDE). « Y aller »
  // pose le joueur sur la case libre la plus proche de cette tuile ; hors de la
  // zawia (la Rahba, le Mechouar), on passe par leur porte. Jamais dans Fès : là,
  // la marche et le souffle sont le jeu.
  function lieu(cle, nom, ar, icone, monde, tuile, detail) {
    return { cle: cle, nom: nom, ar: ar, icone: icone, monde: monde, tuile: tuile, detail: detail };
  }
  var LIEUX = [
    lieu("sahn", "Le Sahn", "الصحن", "fontaine", "zawia", "f", "la cour, la fontaine, les khatt"),
    lieu("khizana", "La Khizana", "الخزانة", "livres", "zawia", "S", "la bibliothèque, le sandouq, la qubba"),
    lieu("madrasa", "La Madrasa", "المدرسة", "tableau", "zawia", "E", "l'établi, le lawh, Lkelma"),
    lieu("qaa", "La Qa3a", "القاعة", "arcade", "zawia", "h", "la halqa, le rihal, le Riwaq"),
    lieu("rahba", "La Rahba", "الرحبة", "echoppe", "rahba", "G", "le Souk, dehors des murs"),
    lieu("derb", "Derb t-Tadamoun", "درب التضامن", "arganier", "rahba", "u", "la ruelle solidaire : associations, coopératives, RSE, idées"),   // v8.7 — on arrive au puits (l'arganier cacherait le joueur sous sa ramure)
    lieu("mechouar", "Al-Mechouar", "المشور", "bannieres", "mechouar", "C", "l'arène, où l'on est vu"),
    lieu("rihla", "Bab ar-Rihla", "باب الرحلة", "porte-fes", "zawia", "R", "la porte de Fès — là, on marche")
  ];
  function trouverLieu(cle) {
    for (var i = 0; i < LIEUX.length; i++) if (LIEUX[i].cle === cle) return LIEUX[i];
    return null;
  }

  // ---- La recherche ----------------------------------------------------------------------------
  // Sans accents ni casse ; l'arabe sans ses voyelles brèves. Le nom exact passe
  // devant, puis ce qui commence par le mot, puis ce qui le contient.
  var RE_HARAKAT = new RegExp("[\\u064b-\\u065f\\u0670]", "g");
  function normaliser(t) {
    return String(t == null ? "" : t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(RE_HARAKAT, "").replace(/[إأآ]/g, "ا").replace(/\s+/g, " ").trim();
  }
  function chercher(entrees, terme) {
    var liste = Array.isArray(entrees) ? entrees : [];
    var q = normaliser(terme);
    if (!q) return liste.slice();
    var notes = [];
    liste.forEach(function (e, i) {
      var nom = normaliser(e.nom), ar = normaliser(e.ar), cle = normaliser(e.cle);
      var reste = normaliser([e.pourquoi].concat(e.mots || []).join(" "));
      var note = 0;
      if (nom === q || cle === q || ar === q) note = 4;
      else if (nom.indexOf(q) === 0 || cle.indexOf(q) === 0) note = 3;
      else if (nom.indexOf(q) >= 0 || ar.indexOf(q) >= 0) note = 2;
      else if (reste.indexOf(q) >= 0) note = 1;
      if (note) notes.push({ e: e, n: note, i: i });
    });
    notes.sort(function (a, b) { return (b.n - a.n) || (a.i - b.i); });
    return notes.map(function (x) { return x.e; });
  }

  // ---- Les pastilles de la Barre ----------------------------------------------------------------
  // Aujourd'hui : le Wird s'il n'est pas tenu, plus les jeux du jour pas encore joués.
  // Jamais un point — ce qui reste à faire, et rien d'autre.
  function pastilleAujourdhui(wird, jeux) {
    var n = wird && wird.tenu === false ? 1 : 0;
    (Array.isArray(jeux) ? jeux : []).forEach(function (j) { if (j && j.fait === false) n++; });
    return n;
  }

  return {
    ICONES: ICONES, PORTES: PORTES, ENTREES: ENTREES, LIEUX: LIEUX,
    cellule: cellule, entree: entree, lieu: trouverLieu,
    normaliser: normaliser, chercher: chercher, pastilleAujourdhui: pastilleAujourdhui
  };
});
