// ZAW'IA — le jeu · LES COMPTES : un adaptateur, deux modes.
//
//   mode "supabase" : Supabase Auth (e-mail + mot de passe) et la table
//                     zawia_joueurs — sur le projet Supabase DU JEU (voir
//                     scripts/sql/zawia-joueurs.sql pour pourquoi pas le CRM).
//   mode "local"    : tout dans le localStorage du navigateur. Un mode
//                     d'ATELIER, pour construire et montrer le jeu avant que
//                     le projet Supabase existe. Ce n'est pas une sécurité :
//                     le mot de passe est haché (SHA-256 salé), mais tout
//                     vit dans le navigateur de la personne.
//
// L'écran ne sait pas quel mode tourne : même interface, tout en promesses.
//
//   creer(config) → {
//     mode, inscrire(email, mdp), connecter(email, mdp), deconnecter(),
//     session(), lireJoueur(), ecrireJoueur(joueur), reclamerChajara(), canal(), saluer(),
//     incarner(masque), lireMajliss(), ecrireMajliss(texte), lireRecompenses(), reclamerRecompense(id),
//     lireKounnach(), lireWasfa(id), proposerWasfa(v), servirWasfa(id, bool)   (v6.0 — le Kounnach),
//     rafraichirFormations(), lireMasarat(), lireEtape(id), livrer(etape, v)   (v6.1 — les Masarat),
//     lireMaharat()   (v7.8 — les Maharat : prouvées, apprises, ponts — la base compte, jamais l'écran),
//     lirePartenaires()  (v8.0 — la Rkhama : ceux que la maison remercie au mur du Sahn),
//     fils(), lireFil(autre, avant), ecrire(autre, texte), nonLus(), bloquer(autre, oui),
//     signalerFil(autre, mot)   (v8.5 — les Rasa'il : lireFil MARQUE LU, nonLus jamais),
//     maCarte(), poserCarte(v), carte(id), annuaire(filtres, page)   (v8.6 — la Bitaqa : admis seulement),
//     khessaEtat(), khessaVerser(geste),   ← v4.7, la fontaine
//     qlilEtat(), qlilJouer(trou, prompt),  ← v4.8, le golf du prompt (fonction Netlify)
//     lireRessources(), lireSeances(), validerPresence(seance, mot),
//     imtihanTirer(), imtihanRepondre(question, choix, abandon),
//     lireTableau(), lireSouk() -> { tapis, moi, devoile }, poserEtal(champs),
//     retirerEtal(id), modifierEtal(id, champs), surChangement(cb)
//   v3.7 — le Souk est LA ferracha du site : lireSouk/poserEtal/retirerEtal
//   passent par la fonction Netlify zawia-souk.js (même origine), jamais par
//   une table du projet du jeu.
//   v4.1 — le parrainage : inscrire(email, mdp, invitation) pose le code dans
//   les métadonnées du compte (le hook Auth et la reconnaissance le lisent) ;
//   v4.5 — le retour : envoyerLienDeRetour(email, retour), reprendre(jetons),
//   changerMotDePasse(mdp) — un compte dont le mot de passe s'oublie n'est plus perdu.
//   lireInvitation(code), parrainer(email), lireFilleuls(),
//   retirerInvitation(code), demanderDossier(email).
//   }
//
// Un joueur, côté JS :
//   { id, pseudo, avatar, rang, arb3ineDebut (ISO), defis, position,
//     sna3a, tahaddi, dhakira, pages, recit }   ← v1.3, les trois axes
// (m39ol et presences sont LUS mais jamais écrits par le jeu : ils viennent du
//  bureau, comme le M39ol vient du témoin.)
// La table parle en snake_case ; l'adaptateur traduit dans les deux sens.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.compte = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MDP_MIN = 8;

  function validerIdentifiants(email, mdp) {
    email = String(email == null ? "" : email).trim().toLowerCase();
    mdp = String(mdp == null ? "" : mdp);
    if (!RE_EMAIL.test(email)) return { ok: false, erreur: "E-mail invalide." };
    if (mdp.length < MDP_MIN) return { ok: false, erreur: "Mot de passe trop court : " + MDP_MIN + " caractères au moins." };
    return { ok: true, email: email, mdp: mdp };
  }

  // ---- Traduction joueur ⇄ ligne ----------------------------------------------
  function depuisLigne(l) {
    if (!l) return null;
    return {
      id: l.id,
      pseudo: l.pseudo,
      avatar: l.avatar || {},
      rang: l.rang || "talib",
      arb3ineDebut: l.arb3ine_debut,
      defis: l.defis || {},
      position: l.position || null,
      // v1.3 — les trois axes. Colonnes ajoutées par zawia-joueurs.sql ; une
      // ligne écrite avant elles les a en null : on retombe sur vide, jamais
      // sur une erreur.
      m39ol: l.m39ol || 0,
      presences: l.presences || 0,
      imtihan: l.imtihan || 0,
      sna3a: l.sna3a || {},
      tahaddi: l.tahaddi || {},
      dhakira: l.dhakira || 0,
      pages: l.pages || {},
      recit: l.recit || {},
      // v2.6 — le Sahn ouvert : les rencontres, comptées par la base (jamais
      // renvoyées par versLigne : la garde les épingle de toute façon).
      rencontres: l.rencontres || 0,
      // v6.1 — la Sna3a ATTESTÉE (les livrables des Masarat) : écrite par le
      // bureau seul, jamais renvoyée par versLigne (la garde l'épingle).
      sna3aAttestee: l.sna3a_attestee || {},
      // v7.0 — la Tariqa et le Maydan (déclaratifs, à soi) ; tariqa_depuis est
      // l'heure du SERVEUR (la garde la pose), lue ici, jamais renvoyée.
      tariqa: l.tariqa || null,
      maydan: l.maydan || null,
      tariqaDepuis: l.tariqa_depuis || null
    };
  }
  function versLigne(j, id) {
    return {
      id: id,
      pseudo: j.pseudo,
      avatar: j.avatar || {},
      rang: j.rang || "talib",
      arb3ine_debut: j.arb3ineDebut,
      defis: j.defis || {},
      position: j.position || null,
      sna3a: j.sna3a || {},
      tahaddi: j.tahaddi || {},
      dhakira: j.dhakira || 0,
      pages: j.pages || {},
      recit: j.recit || {},
      tariqa: j.tariqa || null,
      maydan: j.maydan || null
    };
  }


  // ---- v7.7 — L'ATELIER DU MECHOUAR ------------------------------------------------
  // ⚠️⚠️ Ces affirmations ne sont PAS celles de la base. Les quarante-quatre de
  // l'Isnad portent sur l'histoire du pays et leur vérité vit EN BASE
  // (zawia-mechouar.sql, RLS sans policy) : elle ne descend jamais dans un
  // fichier servi. Celles-ci portent sur les RÈGLES du jeu — publiques par
  // nature — pour que la place soit démontrable hors ligne.
  var DEMO_FAITS = [
    { id: "regle-manches-s", ville: "zawia", texte: "Une joute du Mechouar se gagne deux manches sur trois.", solide: true,
      source: "La règle du cercle." , texte_ar: "المبارزة فالمشور كتّربح بجوج أشواط من ثلاثة.", source_ar: "قاعدة الحلقة."},
    { id: "regle-manches-f", ville: "zawia", texte: "Une joute du Mechouar se gagne en additionnant les scores des trois manches.", solide: false,
      correction: "On compte des MANCHES, jamais un total : les trois axes ne se convertissent pas l'un dans l'autre.", source: "La charte." , texte_ar: "المبارزة فالمشور كتّربح بجمع نقاط الثلاث أشواط.", correction_ar: "كنحسبو الأشواط، ماشي المجموع أبدا: الثلاث محاور ما كيتبدّلوش واحد فالآخر.", source_ar: "الميثاق."},
    { id: "regle-points-s", ville: "zawia", texte: "Gagner une joute ne donne aucun point : ni M39ol, ni Sna3a, ni Dhakira.", solide: true,
      source: "La règle du cercle." , texte_ar: "ربح مبارزة ما كيعطي حتّى نقطة: لا معقول، لا صنعة، لا ذاكرة.", source_ar: "قاعدة الحلقة."},
    { id: "regle-points-f", ville: "zawia", texte: "Gagner une joute donne du M39ol, et le M39ol donne un rang.", solide: false,
      correction: "Le M39ol se reçoit d'un témoin, d'une salle, du bureau — jamais d'un jeu. L'arène donne un titre, et il se perd.", source: "La charte." , texte_ar: "ربح مبارزة كيعطي معقول، والمعقول كيعطي رتبة.", correction_ar: "المعقول كيتّعطى من شاهد، من قاعة، من المكتب — ماشي من لعبة. الساحة كتعطي لقب، واللقب كيتّلف.", source_ar: "الميثاق."},
    { id: "regle-mizan-s", ville: "zawia", texte: "Au Mizan, la halqa pèse les deux raisons sans voir les noms.", solide: true,
      source: "La règle du cercle." , texte_ar: "فالميزان، الحلقة كتوزن الجوج أسباب بلا ما تشوف السميات.", source_ar: "قاعدة الحلقة."},
    { id: "regle-mizan-f", ville: "zawia", texte: "Au Mizan, c'est l'amin qui tranche entre les deux raisons.", solide: false,
      correction: "L'amin compte, il ne vote pas : un arbitre qui peut voter n'est plus une preuve.", source: "La règle du cercle." , texte_ar: "فالميزان، الأمين هو اللي كيحكم بين الجوج أسباب.", correction_ar: "الأمين كيحسب، ما كيصوّتش: حكم كيقدر يصوّت ما بقاش دليل.", source_ar: "قاعدة الحلقة."},
    { id: "regle-rafiq-s", ville: "zawia", texte: "À l'Isnad, le Rafiq se tait : c'est le joueur qu'on écoute.", solide: true,
      source: "La règle du cercle." , texte_ar: "فالإسناد، الرفيق كيسكت: اللاعب هو اللي كيتسمع.", source_ar: "قاعدة الحلقة."},
    { id: "regle-rafiq-f", ville: "zawia", texte: "À l'Isnad, le Rafiq répond à la place du joueur s'il hésite.", solide: false,
      correction: "Au Qalam ton Rafiq parle ; à l'Isnad il se tait.", source: "La règle du cercle." , texte_ar: "فالإسناد، الرفيق كيجاوب بلاصة اللاعب إلا تلكّك.", correction_ar: "فالقلم رفيقك كيهدر؛ فالإسناد كيسكت.", source_ar: "قاعدة الحلقة."}
  ];
  // ---- Mode local ------------------------------------------------------------------
  var CLE = { comptes: "zwj.comptes", joueurs: "zwj.joueurs", session: "zwj.session", masques: "zwj.masques", majliss: "zwj.majliss", invitations: "zwj.invitations", khessa: "zwj.khessa", safqat: "zwj.safqat", kalam: "zwj.kalam", kalamVu: "zwj.kalam.vu", kounnach: "zwj.kounnach", masarat: "zwj.masarat", maharat: "zwj.maharat", voile: "zwj.voile", mechouar: "zwj.mechouar", rasail: "zwj.rasail", cartes: "zwj.cartes", parrainages: "zwj.parrainages" };
  // v6.0 — le Kounnach (kounnach.js), lu à l'appel : sous Node, le test le charge avant.
  // v6.1 — les Masarat (masarat.js), lus à l'appel, comme le Kounnach.
  function masaratModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.masarat ? r.ZWJ.masarat : null; }
  // v7.8 — les Maharat (maharat.js), lus à l'appel, comme les Masarat.
  function maharatModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.maharat ? r.ZWJ.maharat : null; }
  function kounnachModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.kounnach ? r.ZWJ.kounnach : null; }
  // v6.0 — LES WASFAT DE L'ATELIER : trois formules courtes, sans nom ni lien,
  // pour que le Kounnach de l'atelier ait des pages à ouvrir (le vrai vit en base).
  var DEMO_WASFAT = [
    { id: "demo-w1", titre: "Ton premier skill, en vingt minutes", resume: "L'anatomie d'un skill : un fichier, une consigne, un exemple — et il marche.", voie: "prompt", niveau: "mbtadi", auteur: null, ordre: 10,
      corps: "# Ton premier skill, en vingt minutes\n\nUn skill, c'est une consigne écrite une fois et rejouée à chaque demande. Trois pièces, pas une de plus.\n\n## 1. Le fichier\n\n```markdown\n---\nname: relire-mail\ndescription: Relit un e-mail pro et le rend plus court, sans changer le fond.\n---\nTu relis un e-mail. Garde le fond, coupe un tiers, vouvoie. Rends l'e-mail seul.\n```\n\n## 2. Un exemple vaut dix consignes\n\nColle deux e-mails que tu as déjà réécrits : le modèle prend le rythme et la longueur.\n\n## 3. Le test\n\n- un e-mail de dix lignes → six lignes, même sens ;\n- un e-mail déjà court → rendu tel quel.\n\n> Le piège : une consigne qui décrit un ton (« chaleureux, professionnel ») ne vaut rien ; un exemple, tout." },
    { id: "demo-w2", titre: "Une grille de scoring en JSON", resume: "Dix dossiers, une grille, un seul appel — et un tableau à ouvrir, pas une prose à relire.", voie: "prompt", niveau: "sani3", auteur: "Omar", ordre: 20,
      corps: "# Une grille de scoring en JSON\n\n## Ce que ça règle\n\nTrier dix dossiers à la main prend une heure. Avec une grille écrite et un format de sortie fixé, dix minutes — et la grille reste la même pour tous.\n\n## La grille\n\n1. Cinq critères, chacun noté de 0 à 3.\n2. Une phrase par critère qui dit ce que vaut un 3.\n3. Un seuil : en dessous, on ne relit pas.\n\n## Le format de sortie\n\n```json\n{ \"dossier\": \"…\", \"scores\": { \"experience\": 2, \"outils\": 3 }, \"total\": 11, \"raison\": \"une phrase\" }\n```\n\nDemande **une ligne JSON par dossier, sans autre texte** : c'est ce qui fait un fichier au lieu d'une réponse." },
    { id: "demo-w3", titre: "Qualifier une fiche avant d'écrire", resume: "Ce que le modèle sait, ce qu'il devine, et où aller voir — avant d'envoyer un mot à quelqu'un.", voie: "savoir", niveau: "hadeq", auteur: null, ordre: 30,
      corps: "# Qualifier une fiche avant d'écrire\n\nUn modèle *invente* volontiers le poste, la taille, le besoin d'une entreprise. La wasfa : lui donner ce qu'on SAIT, lui demander ce qu'il en déduit, et vérifier avant d'écrire.\n\n## Les trois colonnes\n\n- **Su** — ce qui vient d'une source qu'on a lue ;\n- **Déduit** — ce que le modèle propose, marqué comme tel ;\n- **À vérifier** — la question à poser, la page à ouvrir.\n\n## Le prompt\n\n```text\nVoici ce que je sais (source : …). Ne complète rien sans le dire.\nRends trois colonnes : su / déduit / à vérifier. Puis UN message de quatre lignes, que j'enverrai moi-même.\n```\n\nAucun robot n'envoie à ta place : le modèle prépare, la main envoie." }
  ];
  // v6.1 — LES MASARAT DE L'ATELIER : deux parcours de démonstration, sans nom
  // ni lien (le vrai vit en base). L'atelier est à soi : tout y est ouvert —
  // sauf sous le masque « libre » du Morchid, qui montre la vue fermée.
  var DEMO_ETAPES = {
    "demo-e1": { titre: "Ton premier skill", resume: "Un fichier, une consigne, un exemple : un skill qui marche, en vingt minutes.", voie: "prompt", duree_min: 30, formations: [],
      brief: "## Ce que tu construis\n\nUn skill qui relit un e-mail professionnel et le rend plus court, sans changer le fond.\n\n## Les étapes\n\n1. Écris le fichier `SKILL.md` : un nom, une description qui dit QUAND il se déclenche.\n2. Colle deux exemples réécrits par toi.\n3. Teste-le sur trois e-mails.\n\n> Le piège : décrire un ton au lieu de le montrer.",
      grille: ["La description dit quand le skill se déclenche", "Deux exemples réels sont dans le skill", "Trois essais sont montrés, avant et après"],
      livrable_attendu: "Le lien d'un SKILL.md partagé (Drive, GitHub) et d'une capture des trois essais.", ou_apprendre: "La wasfa « Ton premier skill », au Kounnach" },
    "demo-e2": { titre: "Un skill de facturation", resume: "Des factures justes, du premier coup : numéro, identifiants, TVA, total.", voie: "prompt", duree_min: 60, formations: ["demo"],
      brief: "## Ce que tu construis\n\nUn skill qui prépare une facture à partir de trois lignes de commande — sur des données **fictives**.\n\n- les mentions obligatoires ;\n- le calcul de la TVA ;\n- un fichier prêt à envoyer.",
      grille: ["Les données sont fictives", "Les mentions obligatoires sont là", "La TVA et le total sont justes"],
      livrable_attendu: "Le lien du skill et d'une facture de test.", ou_apprendre: "Le module des skills de ta formation" },
    "demo-e3": { titre: "Un skill de rapprochement bancaire", resume: "Le relevé d'un côté, les factures de l'autre : ce qui est payé, ce qui manque.", voie: "savoir", duree_min: 90, formations: ["demo"],
      brief: "## Ce que tu construis\n\nUn skill qui rapproche un relevé et un registre de factures, et rend les écarts.",
      grille: ["Les données sont fictives", "Chaque écart est expliqué", "Le rapport tient sur une page"],
      livrable_attendu: "Le lien du skill et du rapport d'écarts.", ou_apprendre: "Le module des skills de ta formation" },
    "demo-e4": { titre: "Un skill de post social media", resume: "La voix de ta page, en exemples : un post par canal, prêt à publier.", voie: "prompt", duree_min: 45, formations: [],
      brief: "## Ce que tu construis\n\nUn skill qui écrit un post dans la voix de ta page, pour deux canaux.",
      grille: ["Trois posts passés servent d'exemples", "Deux canaux, deux formats", "Un post publié ou prêt"],
      livrable_attendu: "Le lien du skill et de deux posts produits.", ou_apprendre: "" },
    "demo-e5": { titre: "Une vidéo pédagogique", resume: "Une minute qui explique une idée, faite avec un modèle vidéo.", voie: "image", duree_min: 90, formations: ["demo"],
      brief: "## Ce que tu construis\n\nUne vidéo d'une minute qui explique une idée de ton métier.", grille: ["Une idée, une seule", "Le texte à l'écran est relu", "Moins de 90 secondes"],
      livrable_attendu: "Le lien de la vidéo.", ou_apprendre: "" },
    "demo-e6": { titre: "Une landing page", resume: "Une page qui dit une offre et recueille un contact.", voie: "image", duree_min: 120, formations: ["demo"],
      brief: "## Ce que tu construis\n\nUne page en ligne : une offre, une preuve, un formulaire.", grille: ["La page est en ligne", "L'offre tient en une phrase", "Le formulaire marche"],
      livrable_attendu: "Le lien de la page.", ou_apprendre: "" }
  };
  var DEMO_MASARAT = [
    { id: "demo-m1", titre: "Skills — le tronc commun", resume: "Transformer une méthode en outil : un skill par métier.", genre: "technique", etapes: ["demo-e1", "demo-e2", "demo-e3"] },
    { id: "demo-m2", titre: "Social media & automatisations", resume: "Produire, publier, mesurer — sans y passer ses soirées.", genre: "metier", etapes: ["demo-e4", "demo-e5", "demo-e6"] }
  ];
  // v7.8 — LES MAHARAT DE L'ATELIER : neuf prouvées (les trois sources : une
  // étape attestée, le bureau, la maison à l'entrée), quatre apprises — pour que
  // les trois états se regardent hors ligne. Le lien de preuve est un exemple.
  var DEMO_MAHARAT_PROUVEES = [
    { mahara: "socle-llm", source: "fondateur", le: "2026-09-01T10:00:00Z", preuve: null, note: "Reconnue à l'entrée.", etape: null },
    { mahara: "socle-prompt", source: "etape", le: "2026-09-05T10:00:00Z", preuve: "https://exemple.test/preuve", note: null, etape: "Ton premier skill" },
    { mahara: "socle-iterer", source: "bureau", le: "2026-09-06T10:00:00Z", preuve: null, note: null, etape: null },
    { mahara: "socle-format", source: "etape", le: "2026-09-08T10:00:00Z", preuve: null, note: null, etape: "Ton premier skill" },
    { mahara: "socle-garde-fous", source: "bureau", le: "2026-09-10T10:00:00Z", preuve: null, note: "Le contrôle a été relu en halqa.", etape: null },
    { mahara: "amana-tri", source: "bureau", le: "2026-09-11T10:00:00Z", preuve: null, note: null, etape: null },
    { mahara: "amana-pseudonymiser", source: "etape", le: "2026-09-12T10:00:00Z", preuve: null, note: null, etape: "Un skill de facturation" },
    { mahara: "finance-factures-scan", source: "etape", le: "2026-09-14T10:00:00Z", preuve: null, note: null, etape: "Un skill de facturation" },
    { mahara: "finance-relances", source: "fondateur", le: "2026-09-15T10:00:00Z", preuve: null, note: null, etape: null }
  ];
  var DEMO_MAHARAT_APPRISES = ["socle-modele", "socle-evaluer", "finance-releve", "finance-rapprochement"];
  // v8.1 — OÙ L'ON APPREND, en atelier. Une formation porte son titre et la
  // VITRINE où l'on apprend — l'identifiant d'une ligne du catalogue, celles que
  // `lireRessources` rend plus bas. Deux cas, parce que les deux se regardent :
  // une formation reliée (le titre devient un bouton vers la Qissaria) et une
  // qui ne l'est pas (le titre reste du texte — un pré-requis offert n'est pas
  // une offre). ⚠️ Des titres INVENTÉS : aucune formation réelle ici.
  var DEMO_MAHARAT_PONTS = [
    { mahara: "socle-modele", formations: [{ titre: "L'atelier des makers — six semaines", vitrine: "demo-2" }], etapes: [] },
    { mahara: "socle-evaluer", formations: [{ titre: "Le cours d'initiation IA offert par la maison", vitrine: null }], etapes: [] },
    { mahara: "finance-releve", formations: [
      { titre: "L'accompagnement d'un maker", vitrine: "demo-3" },
      { titre: "L'atelier des makers — six semaines", vitrine: "demo-2" }
    ], etapes: [] }
  ];
  // v8.0 — LES PARTENAIRES DE L'ATELIER (la Rkhama). En mode local il n'y a pas
  // de base : la dalle serait nue, et la salle ne se regarderait qu'en ligne.
  // ⚠️ Deux maisons INVENTÉES, et rien d'autre : un vrai partenaire est un nom
  // réel, il ne vit qu'en base et n'entre dans aucun fichier servi. Le logo est
  // un chemin du seau (la forme que `souk.cheminSur` accepte) ; en atelier
  // `urlImage` rend une image de la maison, ce qui suffit à voir la mise en page.
  var DEMO_PARTENAIRES = [
    { id: "demo-p1", nom: "Dar Sanaa", mot: "Elle a tenu l'échelle le premier jour, quand il n'y avait rien à montrer.",
      logo: "11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.webp",
      lien: "https://exemple.test/dar-sanaa", depuis: "2026-03-01", ordre: 1 },
    { id: "demo-p2", nom: "Foundouk Atlas", mot: "Elle forme les nôtres, et ne demande jamais qui regarde.",
      logo: null, lien: null, depuis: "2026-06-15", ordre: 2 }
  ];
  // v5.7 — la Safqa (safqa.js), lue à l'appel : sous Node, le test la charge avant.
  function safqaModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.safqa ? r.ZWJ.safqa : null; }
  // v5.7 — LES MARCHANDS DE L'ATELIER. En mode local il n'y a ni site ni dossier :
  // la Rahba serait une place vide. Trois tapis de démonstration l'habitent —
  // les gens de la cour (pnj.js), des produits inventés, aucun lien — pour que
  // tout reste démontrable (la règle de la maison). Leur compte de jeu est un
  // faux (« demo-… ») : on peut leur proposer une affaire, et ils répondent
  // tout seuls (voir robots). Rien de ceci n'existe en mode Supabase.
  var DEMO_TAPIS = [
    { nom: "Yassine", rang: "", slug: null, joueur: "demo-yassine", projets: [
      { id: "demo-kharbocha", nom: "Kharbocha", resout: "trouver un artisan de confiance près de chez soi",
        accroche: "L'artisan qu'on recommande, pas celui qu'on subit",
        pourQui: "Qui refait sa cuisine et ne connaît personne dans le métier",
        description: "Une liste tenue par ceux qui ont payé la facture, pas par la publicité.",
        corps: "## Ce que ça fait\n\nTu dis **ce que tu veux refaire** et ton quartier. Kharbocha te rend trois artisans que des voisins ont vraiment fait travailler, avec ce qu'ils ont payé.\n\n- une fiche par artisan, tenue par ses clients\n- le prix moyen du chantier, pas un devis\n- les photos du dernier chantier\n\n> Un avis sans facture ne compte pas.\n\n```\nkharbocha \"refaire une salle de bain\" --quartier agdal\n```",
        livre: "Un accès pour un an, et la fiche de trois artisans de ton quartier.",
        delai: "Sous deux jours",
        faq: [{ q: "Comment tu sais que l'avis est vrai ?", r: "Il faut une facture pour en laisser un. Sans facture, l'avis ne se publie pas." },
              { q: "Et si l'artisan travaille mal ?", r: "L'avis reste. On ne retire jamais un avis contre de l'argent." }],
        galerie: ["11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222221.webp",
                  "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.webp"] },
      { id: "demo-dalil", nom: "Dalil", resout: "un guide de la médina qui répond en darija" },
      // v8.7 — le Derb t-Tadamoun : trois projets solidaires de démonstration (tadamoun.js)
      { id: "demo-argane", nom: "Tifawin", resout: "vendre l'huile d'une coopérative sans intermédiaire", derb: "tadamoun",
        forme: "cooperative", stade: "lance", impact: "Quatorze femmes d'une coopérative d'argan, qui touchent enfin le prix de leur travail.",
        besoins: ["visibilite", "partenaire-rse", "ia"],
        accroche: "L'huile de la coopérative, vendue par la coopérative" }
    ] },
    { nom: "Nour", rang: "", slug: null, joueur: "demo-nour", projets: [
      { nom: "Warqa", resout: "relire un contrat avant de le signer" },
      { id: "demo-qraya", nom: "Qraya", resout: "l'aide aux devoirs des lycéens des douars", derb: "tadamoun",
        forme: "association", stade: "prototype", impact: "Quarante lycéens de trois douars, suivis chaque samedi, gratuitement.",
        besoins: ["benevoles", "local", "ia"],
        description: "Le samedi matin, dans la salle de la commune. Des étudiants du coin corrigent, expliquent, et apprennent aux lycéens à se servir d'une IA pour réviser — sans lui faire faire les devoirs." }
    ] },
    { nom: "Omar", rang: "", slug: null, joueur: "demo-omar", projets: [
      { nom: "Sanad", resout: "les sources d'un fait, en trois clics" },
      { nom: "Lawh", resout: "un tableau de bord pour une coopérative" },
      { nom: "Bab", resout: "une seule porte d'entrée pour ses clients" },
      { id: "demo-tawjih", nom: "Tawjih", resout: "orienter les jeunes du quartier après le bac", derb: "tadamoun",
        forme: "idee", stade: "idee", impact: "Les bacheliers du quartier, qui choisissent une filière sans connaître personne qui l'a faite.",
        besoins: ["mentor", "financement"] }
    ] }
  ];
  function demoTapis() { return JSON.parse(JSON.stringify(DEMO_TAPIS)); }
  function demoPseudo(id) { for (var i = 0; i < DEMO_TAPIS.length; i++) if (DEMO_TAPIS[i].joueur === id) return DEMO_TAPIS[i].nom; return null; }
  // Yassine accepte au bout de quelques secondes, puis livre dès que c'est réglé ;
  // Nour refuse ; Omar ne répond pas. Rien de tout cela n'est un hasard.
  function robots(liste, Sf, maintenant) {
    var iso = new Date(maintenant).toISOString(), delai = 8000;
    return liste.map(function (a) {
      var age = maintenant - (Date.parse(a.creee) || maintenant);
      if (a.vendeur === "demo-yassine") {
        if (a.etat === "proposee" && age > delai) a = Sf.transition(a, "accepter", "demo-yassine", iso).affaire;
        if (a.etat === "acceptee" && a.reglee && !a.livree && maintenant - (Date.parse(a.reglee) || maintenant) > delai) a = Sf.transition(a, "livrer", "demo-yassine", iso).affaire;
      } else if (a.vendeur === "demo-nour" && a.etat === "proposee" && age > delai) {
        a = Sf.transition(a, "refuser", "demo-nour", iso).affaire;
        a.reponse = "Pas cette fois — merci d'avoir demandé.";
      }
      return a;
    });
  }
  // v7.1 — le fil d'une affaire (kalam.js), même lecture tardive.
  function kalamModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.kalam ? r.ZWJ.kalam : null; }
  // En atelier, les marchands de la place répondent aussi DANS LE FIL — sinon
  // la salle est muette et rien ne se vérifie hors ligne.
  var DEMO_REPONSES = {
    "demo-yassine": ["Wa 3alaykom salam. Je te livre demain matin, inch'Allah.", "C'est parti — dis-moi si tu veux autre chose.", "Merci à toi. Reviens quand tu veux."],
    "demo-nour": ["Salam. Je regarde et je te dis.", "Désolée, je suis prise cette semaine."],
    "demo-omar": []
  };

  // v8.5 — les Rasa'il (rasail.js), même lecture tardive.
  function rasailModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.rasail ? r.ZWJ.rasail : null; }
  // En atelier il n'y a personne d'autre : Yassine, un marchand de la place, t'a
  // écrit et te répond (un peu plus tard, comme quelqu'un d'occupé) ; Nour ne
  // répond pas — c'est elle qui montre la règle des deux messages sans réponse.
  var DEMO_RASAIL = {
    "demo-yassine": { pseudo: "Yassine", avatar: { peau: 3, djellaba: 2, tete: "cheveux" },
      premier: "Salam ! Je t'ai vu passer au Sahn. Tu travailles sur quoi en ce moment ?",
      reponses: ["Top. On en parle mercredi à la halqa ?", "Mon tapis est au Souk, passe le voir quand tu veux.", "Bon courage — à mercredi !"] },
    "demo-nour": { pseudo: "Nour", avatar: { peau: 1, djellaba: 4, tete: "hijab" }, premier: null, reponses: [] }
  };
  var DEMO_RASAIL_DELAI_MS = 4000;

  // v8.6 — la Bitaqa (bitaqa.js), même lecture tardive.
  function bitaqaModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.bitaqa ? r.ZWJ.bitaqa : null; }
  function tadamounModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.tadamoun ? r.ZWJ.tadamoun : null; }
  // En atelier, l'annuaire a trois voisins : Yassine et Nour ont ouvert leur carte, Omar
  // non — c'est lui qui montre ce qu'une carte fermée laisse voir (la moitié que le jeu sait).
  var DEMO_CARTES = {
    "demo-yassine": { joueur: { pseudo: "Yassine", avatar: { peau: 3, djellaba: 2, tete: "cheveux" }, rang: "mt3ellem", tariqa: "bannay", maydan: "tech",
        depuis: "2026-09-12T19:00:00Z", maharat: ["socle-contexte", "socle-llm", "socle-prompt", "tech-mcp-brancher", "tech-skill", "ventes-devis"] },
      visible: true, carte: { ville: "Fès", metier: "Je bâtis des outils IA pour les artisans de la médina",
        cherche: ["associe", "testeurs"], chercheMot: "Un associé qui vend : moi, je code.", offre: ["technique", "relecture"], offreMot: "Je relis vos skills et vos prompts.",
        langues: ["darija", "francais", "anglais"], liens: [{ type: "github", url: "https://github.com/exemple" }], maj: "2026-09-23T20:00:00Z" } },
    "demo-nour": { joueur: { pseudo: "Nour", avatar: { peau: 1, djellaba: 4, tete: "hijab" }, rang: "talib", tariqa: "warraq", maydan: "education",
        depuis: "2026-09-20T19:00:00Z", maharat: ["education-programme", "socle-llm"] },
      visible: true, carte: { ville: "Rabat", metier: "Professeure : j'écris mes cours avec l'IA",
        cherche: ["mentor", "apprendre"], chercheMot: "Quelqu'un pour m'apprendre Claude Code.", offre: ["relecture"], offreMot: "Relecture de textes, en arabe et en français.",
        langues: ["arabe", "francais"], liens: [], maj: "2026-09-22T18:00:00Z" } },
    "demo-omar": { joueur: { pseudo: "Omar", avatar: { peau: 2, djellaba: 1, tete: "taqiya" }, rang: "talib", tariqa: null, maydan: null,
        depuis: "2026-09-23T19:00:00Z", maharat: [] }, visible: false, carte: null }
  };

  // v4.7 — la fontaine (khessa.js), lue au moment de l'appel : chargée avant jeu.js.
  function khessaModule() { var r = typeof window !== "undefined" ? window : globalThis; return r.ZWJ && r.ZWJ.khessa ? r.ZWJ.khessa : null; }
  var RE_CODE = /^[0-9a-f]{32}$/;

  // Un stockage en mémoire, pour Node et pour les navigateurs qui refusent
  // le localStorage (navigation privée stricte) : le jeu tourne quand même,
  // le temps de l'onglet.
  function memoire() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }

  function stockageParDefaut() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("zwj.test", "1"); localStorage.removeItem("zwj.test");
        return localStorage;
      }
    } catch (e) { /* refusé : on retombe en mémoire */ }
    return memoire();
  }

  function cryptoParDefaut() {
    if (typeof globalThis !== "undefined" && globalThis.crypto) return globalThis.crypto;
    return null;
  }

  function uuid(c) {
    if (c && c.randomUUID) return c.randomUUID();
    var s = "";
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s.slice(0, 8) + "-" + s.slice(8, 12) + "-4" + s.slice(13, 16) + "-a" + s.slice(17, 20) + "-" + s.slice(20, 32);
  }

  function hacher(c, texte) {
    if (c && c.subtle && typeof TextEncoder !== "undefined") {
      return c.subtle.digest("SHA-256", new TextEncoder().encode(texte)).then(function (buf) {
        var b = new Uint8Array(buf), h = "";
        for (var i = 0; i < b.length; i++) h += ("0" + b[i].toString(16)).slice(-2);
        return h;
      });
    }
    // Sans WebCrypto (très vieux navigateur) : un hachage faible, mais le
    // mode local n'est pas une sécurité de toute façon — voir l'en-tête.
    var x = 0;
    for (var i = 0; i < texte.length; i++) x = (x * 31 + texte.charCodeAt(i)) >>> 0;
    return Promise.resolve("faible-" + x.toString(16));
  }

  // Bab — une MAISON cliente apporte ses propres données de démonstration
  // (window.ZWJ_MAISON_CONTENU.atelier) : ses collègues (messages, réponses,
  // cartes de l'annuaire), ses ressources, ses rendez-vous. Elles sont lues au
  // moment où l'atelier répond, jamais au chargement : l'ordre des scripts de la
  // page n'y fait rien. Sans maison, l'atelier de Zawia reste celui de Zawia.
  var CLE_PRESENCES_MAISON = "bab.presences";
  // Le quiz du jour d'une maison, en atelier : la banque, l'état par joueur.
  var QUIZ_PAR_JOUR = 5, QUIZ_SECONDES = 20;
  var THEMES_QUIZ = { securite: "Sécurité", culture: "La maison", sites: "Les sites", metier: "Le métier" };
  var VOIE_QUIZ = { securite: "prompt", metier: "image", sites: "savoir", culture: "savoir" };
  function quizDeLaMaison() {
    var r = typeof window !== "undefined" ? window : globalThis;
    var q = r && r.ZWJ_MAISON_CONTENU && r.ZWJ_MAISON_CONTENU.quiz;
    return Array.isArray(q) && q.length ? q.filter(function (x) { return x && x.cle && x.question && Array.isArray(x.options) && x.options.length >= 2 && x.options[x.bonne] != null; }) : null;
  }
  function jourLocal() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function maisonAtelier() {
    var r = typeof window !== "undefined" ? window : globalThis;
    return (r && r.ZWJ_MAISON_CONTENU && r.ZWJ_MAISON_CONTENU.atelier) || null;
  }
  var voisinsDeLaMaison = false;
  function poserVoisinsDeLaMaison() {
    if (voisinsDeLaMaison) return;
    voisinsDeLaMaison = true;
    var m = maisonAtelier();
    if (!m) return;
    // Les identifiants des voisins (« demo-yassine »…) restent : la logique de
    // l'atelier les nomme. On change qui ils sont et ce qu'ils disent.
    [["rasail", DEMO_RASAIL], ["reponses", DEMO_REPONSES], ["cartes", DEMO_CARTES]].forEach(function (x) {
      var src = m[x[0]], cible = x[1];
      if (src && typeof src === "object") Object.keys(src).forEach(function (k) { cible[k] = src[k]; });
    });
  }
  // Un rendez-vous de démonstration peut être posé RELATIVEMENT à l'heure où
  // l'on joue (debutMin, dureeMin) : il est alors ouvert pendant la démo.
  function seanceDeLaMaison(x, maintenant) {
    var d = x.debut ? new Date(x.debut).getTime() : maintenant + (Number(x.debutMin) || 0) * 60000;
    var f = x.fin ? new Date(x.fin).getTime() : d + (Number(x.dureeMin) || 60) * 60000;
    var l = x.limite ? new Date(x.limite).getTime() : f + 15 * 60000;
    return { id: x.id, titre: x.titre, detail: x.detail || "", lien: x.lien || null,
      debut: new Date(d).toISOString(), fin: new Date(f).toISOString(), limite: new Date(l).toISOString(), mot_pose: !!x.mot };
  }
  function normaliserMot(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  // Bab — les COLLÈGUES EN DIRECT, simulés pour une démo (décision du
  // 24/09/2026) : un canal qui se comporte comme un canal Realtime (présence,
  // pas, bulles), où trois collègues de fiction marchent dans la cour, rendent
  // le salut et répondent quand on leur parle. Seulement si la maison le demande
  // (ZWJ_MAISON_CONTENU.atelier.enDirect) ; le vrai direct viendra avec la base.
  function canalSimule(gens, repliques) {
    var h = { sync: [], join: [], pas: [], bulle: [], toc: [] }, minuteurs = [], ferme = false, t0 = Date.now();
    var TUILE_PX = 16;
    function place(t) { return { x: t[0] * TUILE_PX + TUILE_PX / 2, y: t[1] * TUILE_PX + TUILE_PX / 2 }; }
    // chaque route (des coins, en cases) se déplie en pas d'une case, en boucle
    function deplier(route) {
      var pas = [];
      for (var i = 0; i < route.length; i++) {
        var a0 = route[i], a1 = route[(i + 1) % route.length], x = a0[0], y = a0[1];
        var dx = Math.sign(a1[0] - a0[0]), dy = Math.sign(a1[1] - a0[1]);
        while (x !== a1[0] || y !== a1[1]) { pas.push([x, y, dx > 0 ? "droite" : dx < 0 ? "gauche" : dy > 0 ? "bas" : "haut"]); if (x !== a1[0]) x += dx; else y += dy; }
      }
      return pas.length ? pas : [[route[0][0], route[0][1], "bas"]];
    }
    var vivants = gens.map(function (g, i) {
      return { g: g, cle: g.id + "." + (t0 - (i + 1) * 90000).toString(36), pas: deplier(g.route || [[20, 14]]), i: (i * 7) % 11 };
    });
    function meta(v) { var q = v.pas[v.i % v.pas.length], pl = place(q); return { id: v.g.id, pseudo: v.g.pseudo, avatar: v.g.avatar || {}, x: pl.x, y: pl.y, dir: q[2] }; }
    function emettre(type, charge) { h[type].forEach(function (cb) { try { cb(charge); } catch (e) { /* un écouteur ne casse pas les autres */ } }); }
    function avancer() {
      if (ferme) return;
      vivants.forEach(function (v) {
        v.i = (v.i + 1) % v.pas.length;
        var q = v.pas[v.i], pl = place(q);
        emettre("pas", { payload: { cle: v.cle, x: pl.x, y: pl.y, dir: q[2], bouge: true } });
      });
    }
    var canal = {
      on: function (type, filtre, cb) {
        var ev = filtre && filtre.event;
        if (type === "presence" && (ev === "sync" || ev === "join")) h[ev].push(cb);
        else if (type === "broadcast" && h[ev]) h[ev].push(cb);
        return canal;
      },
      subscribe: function (cb) {
        minuteurs.push(setTimeout(function () {
          if (ferme) return;
          if (typeof cb === "function") cb("SUBSCRIBED");
          emettre("sync", {});
          avancer();
          minuteurs.push(setInterval(avancer, 950));
        }, 300));
        return canal;
      },
      presenceState: function () { var e = {}; vivants.forEach(function (v) { e[v.cle] = [meta(v)]; }); return e; },
      track: function () { return Promise.resolve("ok"); },
      untrack: function () { return Promise.resolve("ok"); },
      send: function (m) {
        // un mot dit dans la cour : un collègue y répond, comme quelqu'un d'occupé
        if (!ferme && m && m.event === "bulle" && vivants.length && repliques && repliques.length) {
          var v = vivants[Math.floor(Date.now() / 1000) % vivants.length], texte = repliques[Math.floor(Date.now() / 700) % repliques.length];
          minuteurs.push(setTimeout(function () { if (!ferme) emettre("bulle", { payload: { cle: v.cle, texte: texte } }); }, 2200));
        }
        return Promise.resolve("ok");
      },
      unsubscribe: function () { ferme = true; minuteurs.forEach(function (t) { clearTimeout(t); clearInterval(t); }); return Promise.resolve("ok"); },
      simule: true
    };
    return canal;
  }

  function adaptateurLocal(stockage, c) {
    poserVoisinsDeLaMaison();   // Bab — les collègues d'une maison cliente
    function etatQuiz(id) {
      var tout = lire("bab.quiz", {}), e = tout[id] || {};
      return { jour: e.jour || "", servies: Number(e.servies) || 0, vues: Array.isArray(e.vues) ? e.vues : [], encours: e.encours || null };
    }
    function ecrireQuiz(id, e) { var tout = lire("bab.quiz", {}); tout[id] = e; ecrire("bab.quiz", tout); }
    function lire(k, defaut) {
      try { var v = stockage.getItem(k); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; }
    }
    function ecrire(k, v) { stockage.setItem(k, JSON.stringify(v)); }

    var ecouteurs = [];
    function prevenir() {
      var s = sessionSync();
      ecouteurs.forEach(function (cb) { try { cb(s); } catch (e) { /* un écouteur ne casse pas les autres */ } });
    }
    function sessionSync() {
      var s = lire(CLE.session, null);
      return s && s.id ? { id: s.id, email: s.email } : null;
    }

    // v8.5 — la boîte des Rasa'il, en atelier : { seq, fils: { autre → fil }, bloques }.
    // Un fil : { pseudo, avatar, messages: [{ id, de, texte, le }], lu, ouvertPar,
    // ouvertLe, signale, attente }. `lu` est un identifiant de message, comme en base.
    function boiteLocale(moi) {
      var tout = lire(CLE.rasail, {}), b = tout[moi];
      if (!b || typeof b !== "object" || !b.fils) {
        b = { seq: 1, fils: {}, bloques: {} };
        var y = DEMO_RASAIL["demo-yassine"], il = new Date(Date.now() - 5 * 60000).toISOString();
        b.fils["demo-yassine"] = { pseudo: y.pseudo, avatar: y.avatar, messages: [{ id: 1, de: "demo-yassine", texte: y.premier, le: il }],
          lu: 0, ouvertPar: "demo-yassine", ouvertLe: il, signale: false, attente: null };
      }
      b.bloques = b.bloques || {};
      // ce que Yassine a promis de répondre arrive à son heure
      Object.keys(b.fils).forEach(function (k) {
        var f = b.fils[k];
        if (f.attente && Date.now() >= f.attente.des) {
          b.seq += 1;
          f.messages.push({ id: b.seq, de: k, texte: f.attente.texte, le: new Date(f.attente.des).toISOString() });
          f.attente = null;
        }
      });
      return b;
    }
    function ecrireBoite(moi, b) { var tout = lire(CLE.rasail, {}); tout[moi] = b; ecrire(CLE.rasail, tout); }
    // v8.6 — ma carte, en atelier : la moitié que le jeu sait vient de mon personnage.
    function maCarteLocale(moi) {
      var j = lire(CLE.joueurs, {})[moi];
      if (!j) return { ok: false, erreur: "Crée ton personnage d'abord." };
      var c = lire(CLE.cartes, {})[moi] || null;
      return { ok: true,
        joueur: { id: moi, pseudo: j.pseudo, avatar: j.avatar, rang: j.rang, tariqa: j.tariqa || null, maydan: j.maydan || null,
          depuis: j.arb3ineDebut || null, maharat: DEMO_MAHARAT_PROUVEES.map(function (m) { return m.mahara; }) },
        visible: !!(c && c.visible), carte: c ? c.carte : null };
    }
    function nouveauxDuJour(b, moi) {
      var hier = Date.now() - 86400000;
      return Object.keys(b.fils).filter(function (k) { var f = b.fils[k]; return f.ouvertPar === moi && Date.parse(f.ouvertLe) > hier; }).length;
    }
    function filResume(b, k, moi) {
      var f = b.fils[k], d = f.messages[f.messages.length - 1], bloque = !!b.bloques[k];
      return { autre: k, pseudo: f.pseudo, avatar: f.avatar, dernier: d ? d.texte : "", dernierMoi: !!d && d.de === moi,
        dernierLe: d ? d.le : f.ouvertLe, bloque: bloque, signale: !!f.signale,
        nonLus: bloque ? 0 : f.messages.filter(function (m) { return m.de !== moi && m.id > (f.lu || 0); }).length };
    }
    function filComplet(b, k, moi, marquer) {
      var f = b.fils[k], demo = DEMO_RASAIL[k] || {};
      var messages = f ? f.messages.slice(-100) : [];
      if (f && marquer && messages.length) f.lu = Math.max(f.lu || 0, messages[messages.length - 1].id);
      return { ok: true, autre: { id: k, pseudo: f ? f.pseudo : (demo.pseudo || "Un Talib"), avatar: f ? f.avatar : (demo.avatar || null) },
        messages: messages.map(function (m) { return { id: m.id, moi: m.de === moi, texte: m.texte, le: m.le }; }),
        plus: !!f && f.messages.length > 100, neuf: !f, bloque: !!b.bloques[k], signale: !!(f && f.signale), nouveaux: nouveauxDuJour(b, moi) };
    }

    return {
      mode: "local",

      inscrire: function (email, mdp) {
        var v = validerIdentifiants(email, mdp);
        if (!v.ok) return Promise.resolve(v);
        var comptes = lire(CLE.comptes, {});
        if (comptes[v.email]) return Promise.resolve({ ok: false, erreur: "Un compte existe déjà avec cet e-mail. Entre plutôt." });
        var sel = uuid(c);
        return hacher(c, sel + ":" + v.mdp).then(function (h) {
          var id = uuid(c);
          comptes[v.email] = { id: id, sel: sel, hash: h, creeLe: new Date().toISOString() };
          ecrire(CLE.comptes, comptes);
          ecrire(CLE.session, { id: id, email: v.email });
          prevenir();
          return { ok: true, session: { id: id, email: v.email } };
        });
      },

      connecter: function (email, mdp) {
        var v = validerIdentifiants(email, mdp);
        // Même message quel que soit le champ fautif : on ne dit pas à un
        // inconnu si l'e-mail existe.
        var refus = { ok: false, erreur: "E-mail ou mot de passe incorrect." };
        if (!v.ok) return Promise.resolve(refus);
        var compte = lire(CLE.comptes, {})[v.email];
        if (!compte) return Promise.resolve(refus);
        return hacher(c, compte.sel + ":" + v.mdp).then(function (h) {
          if (h !== compte.hash) return refus;
          ecrire(CLE.session, { id: compte.id, email: v.email });
          prevenir();
          return { ok: true, session: { id: compte.id, email: v.email } };
        });
      },

      // v4.5 — le retour. En atelier aucun e-mail ne part : il n'y a ni
      // relais ni boîte. Mais le mot de passe se change VRAIMENT, sur la
      // session ouverte — tout doit rester démontrable hors ligne.
      envoyerLienDeRetour: function () {
        return Promise.resolve({ ok: false, raison: "atelier", erreur: "En mode atelier, aucun e-mail ne part." });
      },
      reprendre: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, il n'y a pas de lien de retour." });
      },
      changerMotDePasse: function (mdp) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        if (String(mdp || "").length < MDP_MIN) {
          return Promise.resolve({ ok: false, erreur: "Mot de passe trop court : " + MDP_MIN + " caractères au moins." });
        }
        var comptes = lire(CLE.comptes, {}), compte = comptes[s.email];
        if (!compte) return Promise.resolve({ ok: false, erreur: "Ce compte n'existe plus." });
        var sel = uuid(c);
        return hacher(c, sel + ":" + String(mdp)).then(function (h) {
          compte.sel = sel; compte.hash = h;
          ecrire(CLE.comptes, comptes);
          return { ok: true };
        });
      },

      deconnecter: function () {
        stockage.removeItem(CLE.session);
        prevenir();
        return Promise.resolve({ ok: true });
      },

      session: function () { return Promise.resolve(sessionSync()); },

      // La Chajara : en mode atelier, il n'y a pas de registre — et l'atelier
      // est à soi : on y joue en gens de la maison pour tout démontrer.
      // ⚠️ JAMAIS un nom de promo simulé ici : le voile s'applique aux
      // fichiers servis, et les libellés de Chajara ne vivent qu'en base.
      reclamerChajara: function () {
        // v3.3/v3.3 — l'atelier est à soi : on y est le Morchid et le Majliss
        // aussi, pour tout démontrer. Le masque porté se retient par compte.
        // v8.2 — et le compte d'ESSAI du Morchid (`essai`) : en atelier tout
        // doit rester démontrable, masque et « Rejouer le début » compris.
        var s = sessionSync();
        var masque = s ? lire(CLE.masques, {})[s.id] || null : null;
        var maison = masque && masque.lignee ? masque.lignee === "maison" : true;
        return Promise.resolve({ ok: true, maison: maison, chajara: null, atelier: true, morchid: true, essai: true, majliss: true, masque: masque, admis: true, voie: null });
      },

      // v4.1 — le parrainage, en atelier : on entre sans invitation (l'atelier
      // est à soi), mais le panneau du parrain se démontre avec des invitations
      // gardées dans ce navigateur. Aucun e-mail ne part.
      lireInvitation: function () { return Promise.resolve({ valide: false, raison: "atelier" }); },
      parrainer: function (email) {
        var e = String(email == null ? "" : email).trim().toLowerCase();
        if (!RE_EMAIL.test(e)) return Promise.resolve({ ok: false, raison: "email", erreur: "Cette adresse ne ressemble pas à un e-mail." });
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, raison: "session", erreur: "Entre d'abord." });
        if (lire(CLE.comptes, {})[e]) return Promise.resolve({ ok: false, raison: "deja-compte", erreur: "Cette adresse a déjà un compte dans le jeu." });
        var liste = lire(CLE.invitations, []);
        var maintenant = Date.now();
        var vivante = function (i) { return i.parrain === s.id && i.etat === "attente" && new Date(i.expire_le).getTime() > maintenant; };
        var deja = liste.filter(function (i) { return vivante(i) && i.email === e; })[0];
        var origine = typeof location !== "undefined" && location.origin && location.origin !== "null" ? location.origin + location.pathname : "";
        if (deja) return Promise.resolve({ ok: true, deja: true, email: e, lien: origine + "?invitation=" + deja.code, envoye: false });
        if (liste.filter(vivante).length >= 3) return Promise.resolve({ ok: false, raison: "quota", erreur: "Trois invitations attendent déjà leur réponse. Une place se libère quand l'une est acceptée, retirée ou expire." });
        var code = uuid(c).replace(/-/g, "").toLowerCase();
        liste.unshift({ code: code, email: e, parrain: s.id, etat: "attente", cree_le: new Date().toISOString(), expire_le: new Date(maintenant + 30 * 86400000).toISOString() });
        ecrire(CLE.invitations, liste.slice(0, 30));
        return Promise.resolve({ ok: true, deja: false, email: e, lien: origine + "?invitation=" + code, envoye: false });
      },
      lireFilleuls: function () {
        var s = sessionSync();
        var maintenant = Date.now();
        var liste = lire(CLE.invitations, []).filter(function (i) { return s && i.parrain === s.id; }).map(function (i) {
          var etat = i.etat === "attente" && new Date(i.expire_le).getTime() <= maintenant ? "expiree" : i.etat;
          return { code: i.code, email: i.email, etat: etat, filleul: null, cree_le: i.cree_le, expire_le: i.expire_le };
        });
        return Promise.resolve({ ok: !!s, max: 3, en_attente: liste.filter(function (i) { return i.etat === "attente"; }).length, invitations: liste });
      },
      retirerInvitation: function (code) {
        var s = sessionSync();
        var liste = lire(CLE.invitations, []);
        var trouve = false;
        liste.forEach(function (i) { if (s && i.parrain === s.id && i.code === code && i.etat === "attente") { i.etat = "retiree"; trouve = true; } });
        ecrire(CLE.invitations, liste);
        return Promise.resolve(trouve ? { ok: true } : { ok: false, erreur: "Cette invitation n'attend plus rien." });
      },
      demanderDossier: function () {
        return Promise.resolve({ ok: true, message: "En mode atelier, aucun dossier n'est lu et aucun e-mail ne part." });
      },

      // Le masque du Morchid, en atelier : retenu par compte, et le rang de
      // la ligne suit — comme zawia_incarner le fait en base.
      incarner: function (masque) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var masques = lire(CLE.masques, {});
        var joueurs = lire(CLE.joueurs, {});
        var ligne = joueurs[s.id];
        var origine = masques[s.id] && masques[s.id].origine ? masques[s.id].origine : (ligne && ligne.rang) || "talib";
        var propre = masque && (masque.rang || masque.lignee || masque.arb3ine) ? { rang: masque.rang || null, lignee: masque.lignee || null, arb3ine: masque.arb3ine || null } : null;
        if (propre) { masques[s.id] = { rang: propre.rang, lignee: propre.lignee, arb3ine: propre.arb3ine, origine: origine }; }
        else delete masques[s.id];
        ecrire(CLE.masques, masques);
        var rang = (propre && propre.rang) || origine;
        if (ligne) { ligne.rang = rang; joueurs[s.id] = ligne; ecrire(CLE.joueurs, joueurs); }
        var maison = propre && propre.lignee ? propre.lignee === "maison" : true;
        return Promise.resolve({ ok: true, masque: propre, rang: rang, maison: maison });
      },

      // La chambre du Majliss, en atelier : un tableau à soi seul, un journal
      // dans le navigateur — pour voir la salle, pas pour compter la maison.
      lireMajliss: function () {
        var journal = lire(CLE.majliss, []);
        var s = sessionSync();
        var joueurs = lire(CLE.joueurs, {});
        var moi = s ? joueurs[s.id] : null;
        return Promise.resolve({ ok: true,
          chiffres: { comptes: Object.keys(lire(CLE.comptes, {})).length, personnages: Object.keys(joueurs).length, maison: 0, entres_7j: 0,
            m39ol: 0, presences: 0, rencontres: 0, pages: 0, tahaddi: 0, etals: 0, seances_a_venir: 0 },
          membres: [{ pseudo: moi ? moi.pseudo : null, rang: moi ? moi.rang : null, entre: !!moi, derniere_entree: null }],
          derniers: moi ? [{ pseudo: moi.pseudo, rang: moi.rang, quand: moi.updated_at }] : [],
          journal: journal.map(function (l) { return Object.assign({}, l, { moi: true }); }) });
      },
      // v3.4 — les récompenses de la Dhakira : la maison n'offre rien en atelier.
      lireRecompenses: function () { return Promise.resolve([]); },
      reclamerRecompense: function () { return Promise.resolve({ ok: false, erreur: "En mode atelier, la maison n'offre rien : les cartes, si." }); },
      // v6.0 — le Kounnach, en atelier : trois wasfat de démonstration, le
      // niveau compté sur la Sna3a du joueur local, les propositions gardées
      // dans le navigateur (jamais publiées : il n'y a pas de bureau ici).
      lireKounnach: function () {
        var Kn = kounnachModule(), s = sessionSync();
        if (!Kn || !s) return Promise.resolve([]);
        var moi = lire(CLE.joueurs, {})[s.id] || {}, total = 0, sn = moi.sna3a || {};
        Object.keys(sn).forEach(function (k) { var n = parseInt(sn[k], 10); if (!isNaN(n) && n > 0) total += n; });
        var tout = lire(CLE.kounnach, {}), mien = tout[s.id] || { miennes: [], servi: {} };
        var mdW = maisonAtelier(), sourceW = mdW && Array.isArray(mdW.wasfat) ? mdW.wasfat : DEMO_WASFAT;   // Bab — une maison peut n'en avoir aucune
        var lignes = sourceW.map(function (w) {
          return { id: w.id, titre: w.titre, resume: w.resume, voie: w.voie, niveau: w.niveau, auteur: w.auteur, mienne: false, etat: "publiee",
                   servi: (mien.servi && mien.servi[w.id] ? 1 : 0) + (w.id === "demo-w2" ? 3 : 0), accessible: Kn.manque(w, total) === 0, ordre: w.ordre, langue: "fr" };
        });
        (mien.miennes || []).forEach(function (w) {
          lignes.push({ id: w.id, titre: w.titre, resume: w.resume, voie: w.voie, niveau: "sani3", auteur: moi.pseudo || null, mienne: true, etat: "proposee",
                        note_bureau: null, servi: 0, accessible: true, ordre: 0, langue: "fr" });
        });
        return Promise.resolve(lignes);
      },
      lireWasfa: function (id) {
        var Kn = kounnachModule(), s = sessionSync();
        if (!Kn || !s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var tout = lire(CLE.kounnach, {}), mien = tout[s.id] || { miennes: [], servi: {} };
        var w = null, mienne = false;
        var mdW2 = maisonAtelier(); (mdW2 && Array.isArray(mdW2.wasfat) ? mdW2.wasfat : DEMO_WASFAT).forEach(function (d) { if (d.id === id) w = d; });
        (mien.miennes || []).forEach(function (d) { if (d.id === id) { w = d; mienne = true; } });
        if (!w) return Promise.resolve({ ok: false, erreur: "Cette wasfa n'existe pas." });
        var moi = lire(CLE.joueurs, {})[s.id] || {}, total = 0, sn = moi.sna3a || {};
        Object.keys(sn).forEach(function (k) { var n = parseInt(sn[k], 10); if (!isNaN(n) && n > 0) total += n; });
        if (!mienne && Kn.manque(w, total) > 0) return Promise.resolve({ ok: false, erreur: "Ta Sna3a n'y est pas encore. L'établi t'attend.", niveau: w.niveau });
        return Promise.resolve({ ok: true, id: w.id, titre: w.titre, corps: w.corps, lien: null, langue: "fr", etat: mienne ? "proposee" : "publiee",
                                 servi: (mien.servi && mien.servi[w.id] ? 1 : 0) + (w.id === "demo-w2" ? 3 : 0), moi_servi: !!(mien.servi && mien.servi[w.id]), mienne: mienne });
      },
      proposerWasfa: function (v) {
        var Kn = kounnachModule(), s = sessionSync();
        if (!Kn || !s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var ok = Kn.validerProposition(v);
        if (!ok.ok) return Promise.resolve(ok);
        var tout = lire(CLE.kounnach, {}), mien = tout[s.id] || { miennes: [], servi: {} };
        mien.miennes = mien.miennes || [];
        var id = v && v.id ? String(v.id) : null, trouvee = null;
        mien.miennes.forEach(function (d) { if (d.id === id) trouvee = d; });
        if (id && !trouvee) return Promise.resolve({ ok: false, erreur: "Cette wasfa n'est pas à toi — ou elle est déjà publiée." });
        if (!trouvee && mien.miennes.length >= Kn.LIMITES.enAttente) return Promise.resolve({ ok: false, erreur: "Cinq wasfat attendent déjà la relecture du bureau. Patience — ou corrige-les." });
        if (!trouvee) { trouvee = { id: "mienne-" + (mien.miennes.length + 1) }; mien.miennes.push(trouvee); }
        Object.assign(trouvee, ok.valeurs);
        tout[s.id] = mien;
        ecrire(CLE.kounnach, tout);
        return Promise.resolve({ ok: true, id: trouvee.id });
      },
      servirWasfa: function (id, servi) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var tout = lire(CLE.kounnach, {}), mien = tout[s.id] || { miennes: [], servi: {} };
        mien.servi = mien.servi || {};
        if (servi === false) delete mien.servi[id]; else mien.servi[id] = true;
        tout[s.id] = mien;
        ecrire(CLE.kounnach, tout);
        return Promise.resolve({ ok: true, servi: (mien.servi[id] ? 1 : 0) + (id === "demo-w2" ? 3 : 0), moi_servi: !!mien.servi[id] });
      },
      // v6.1 — les Masarat, en atelier : les parcours de démonstration, les
      // livrables gardés dans ce navigateur. Il n'y a pas de bureau ici : un
      // livrable reste « remis » (l'attestation se voit en ligne).
      rafraichirFormations: function () { return Promise.resolve({ ok: true, n: 0, atelier: true }); },
      lireMasarat: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var m = lire(CLE.masques, {})[s.id], libre = !!(m && m.lignee === "libre");
        var mien = lire(CLE.masarat, {})[s.id] || {};
        return Promise.resolve({ ok: true, maison: !libre, formations_lues_le: null, masarat: DEMO_MASARAT.map(function (ms) {
          return { id: ms.id, titre: ms.titre, resume: ms.resume, genre: ms.genre, ijaza: false, etapes: ms.etapes.map(function (id, i) {
            var e = DEMO_ETAPES[id], ouverte = i === 0;
            return { id: id, position: i + 1, titre: e.titre, resume: e.resume, voie: e.voie, duree_min: e.duree_min, ouverte: ouverte,
                     accessible: ouverte || !libre, formations: libre ? null : (e.formations.length ? ["Une formation de démonstration"] : []),
                     plus_loin: null, livrable: mien[id] ? { etat: mien[id].etat, note_bureau: null } : null };
          }) };
        }) });
      },
      lireEtape: function (id) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var e = DEMO_ETAPES[id];
        if (!e) return Promise.resolve({ ok: false, erreur: "Cette étape n'existe pas." });
        var m = lire(CLE.masques, {})[s.id], libre = !!(m && m.lignee === "libre");
        var ouverte = DEMO_MASARAT.some(function (ms) { return ms.etapes[0] === id; });
        if (libre && !ouverte) return Promise.resolve({ ok: false, erreur: "Cette étape s'ouvre avec une formation de la maison.", fermee: true });
        var liv = (lire(CLE.masarat, {})[s.id] || {})[id] || null;
        return Promise.resolve({ ok: true, id: id, titre: e.titre, resume: e.resume, voie: e.voie, duree_min: e.duree_min, brief: e.brief, grille: e.grille,
                                 livrable_attendu: e.livrable_attendu, ou_apprendre: libre ? null : (e.ou_apprendre || null), wasfa: null, livrable: liv, masarat: [] });
      },
      // v7.8 — les maharat, en atelier : ce que la base rendrait, joué d'avance.
      // Rien ne s'écrit ici — on ne se déclare pas une mahara (maharat.js, règle 1).
      lireMaharat: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var m = lire(CLE.masques, {})[s.id], libre = !!(m && m.lignee === "libre");
        // ⚠️ un libre ne reçoit JAMAIS un titre de formation (le voile) : un nombre, comme en base
        var ponts = DEMO_MAHARAT_PONTS.map(function (p) {
          return { mahara: p.mahara, etapes: p.etapes.slice(), formations: libre ? p.formations.length : p.formations.slice() };
        });
        return Promise.resolve({ ok: true, maison: !libre, prouvees: DEMO_MAHARAT_PROUVEES.slice(), apprises: DEMO_MAHARAT_APPRISES.slice(), ponts: ponts });
      },
      // v8.0 — la Rkhama : ce que la dalle porte. En atelier, deux maisons inventées.
      lirePartenaires: function () {
        var s = sessionSync();
        var m = s ? lire(CLE.masques, {})[s.id] : null, libre = !!(m && m.lignee === "libre");
        return Promise.resolve({ ok: true, maison: !!s && !libre, partenaires: DEMO_PARTENAIRES.slice() });
      },
      livrer: function (id, v) {
        var s = sessionSync(), Ms = masaratModule();
        if (!s || !Ms) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var ok = Ms.validerLivrable(v);
        if (!ok.ok) return Promise.resolve(ok);
        var tout = lire(CLE.masarat, {}), mien = tout[s.id] || {};
        if (mien[id] && mien[id].etat === "atteste") return Promise.resolve({ ok: false, erreur: "Cette étape est déjà attestée." });
        mien[id] = Object.assign({ etat: "remis", note_bureau: null, remis_le: new Date().toISOString() }, ok.valeurs);
        tout[s.id] = mien;
        ecrire(CLE.masarat, tout);
        return Promise.resolve({ ok: true, etat: "remis" });
      },
      // v4.7 — la fontaine, en atelier : à soi seul, dans le navigateur. Douze
      // gouttes suffisent à la remplir — pour voir la salle et les lanternes.
      khessaEtat: function () {
        var Kx = khessaModule(), s = sessionSync();
        if (!Kx || !s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        return Promise.resolve(Kx.etatLocal(lire(CLE.khessa, {})[s.id], Kx.jourCasa()));
      },
      khessaVerser: function (geste) {
        var Kx = khessaModule(), s = sessionSync();
        if (!Kx || !s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        if (!Kx.estGeste(geste)) return Promise.resolve({ ok: false, erreur: "Ce geste ne verse rien." });
        var tout = lire(CLE.khessa, {}), jour = Kx.jourCasa();
        tout[s.id] = Kx.verserLocal(tout[s.id], geste, jour);
        ecrire(CLE.khessa, tout);
        return Promise.resolve(Kx.etatLocal(tout[s.id], jour));
      },
      // v4.8 — le golf du prompt : c'est le SERVEUR qui appelle le modèle et
      // juge. En atelier il n'y a ni serveur ni modèle — l'établi le dit.
      qlilEtat: function () {
        return Promise.resolve({ ok: false, atelier: true, erreur: "En atelier, le modèle ne répond pas : le golf du prompt se joue en ligne." });
      },
      qlilJouer: function () {
        return Promise.resolve({ ok: false, atelier: true, erreur: "En atelier, le modèle ne répond pas : le golf du prompt se joue en ligne." });
      },
      ecrireMajliss: function (texte) {
        var t = String(texte || "").trim();
        if (!t) return Promise.resolve({ ok: false, erreur: "Rien à poser." });
        if (t.length > 600) return Promise.resolve({ ok: false, erreur: "Six cents caractères au plus." });
        var s = sessionSync();
        var moi = s ? lire(CLE.joueurs, {})[s.id] : null;
        var journal = lire(CLE.majliss, []);
        journal.unshift({ id: journal.length + 1, pseudo: moi ? moi.pseudo : "—", texte: t, quand: new Date().toISOString() });
        ecrire(CLE.majliss, journal.slice(0, 30));
        return Promise.resolve({ ok: true });
      },

      // Le Riwaq (ressources.js) : en mode atelier il n'y a pas de base, donc
      // rien à annoncer. La salle s'ouvre quand même et dit qu'elle est vide —
      // mieux qu'un bouton qui ne répond pas.
      // v5.7 — trois lignes de catalogue pour que la Qissaria de l'atelier ait des
      // vitrines (aucun nom, aucun lien : le vrai catalogue vit en base).
      lireRessources: function () {
        var md = maisonAtelier();   // Bab — les ressources d'une maison cliente
        if (md && Array.isArray(md.ressources)) return Promise.resolve(md.ressources.map(function (x) { return Object.assign({ visible: true, ouverte: true }, x); }));
        return Promise.resolve([
          { id: "demo-1", genre: "produit", titre: "Le cours d'initiation IA offert par la maison", detail: "Le cours que chaque Talib finit pendant son Arb3ine — en entier.", lien: null, ordre: 10, visible: true },
          { id: "demo-2", genre: "produit", titre: "L'atelier des makers — six semaines", detail: "Construire un outil qui règle un vrai problème, avec l'IA pour compagnon.", lien: null, ordre: 20, visible: true },
          { id: "demo-3", genre: "produit", titre: "L'accompagnement d'un maker", detail: "Une heure et demie pour débloquer un sujet précis, et repartir avec un plan.", lien: null, ordre: 30, visible: true },
          // v7.4 — un défi de démonstration : sans lui, le Voilé ne descend pour personne, et
          // la rencontre ne se regarderait qu'en ligne (en ligne, l'énoncé vient de la base).
          { id: "demo-defi", genre: "defi", titre: "Le défi de l'atelier", detail: "Un problème posé comme un client le pose : mal, vite, et pour hier. En ligne, l'énoncé vient de la base et change à chaque saison.", lien: null, ordre: 40, visible: true, ouverte: true }
        ]);
      },
      // Pas de séances en mode atelier : le point hebdo se tient dans la vraie
      // maison, pas dans un navigateur isolé.
      lireSeances: function () {
        // Bab — une maison cliente peut poser ses rendez-vous de démonstration ;
        // le mot ne sort pas d'ici (mot_pose seulement), comme en ligne.
        var md = maisonAtelier();
        if (!md || !Array.isArray(md.seances)) return Promise.resolve([]);
        var faites = lire(CLE_PRESENCES_MAISON, {}), s0 = sessionSync(), moi = s0 ? s0.id : "";
        var m = Date.now();
        return Promise.resolve(md.seances.map(function (x) {
          var s = seanceDeLaMaison(x, m);
          s.validee = !!(faites[moi] && faites[moi][x.id]);
          return s;
        }));
      },
      // v7.3 — en atelier, l'invité voit les mêmes trois lignes de démonstration
      lireRayonsDayf: function () {
        return Promise.resolve([
          { genre: "ressource", titre: "De quoi commencer", detail: "Ce que la maison ouvre à qui veut apprendre. En atelier, trois lignes de démonstration.", lien: null, ordre: 10 },
          { genre: "ressource", titre: "Un glossaire, pour les mots", detail: "Les mots qu'on croise partout, expliqués une fois pour toutes.", lien: null, ordre: 20 },
          { genre: "produit", titre: "Le parcours complet", detail: "Pour celui qui veut apprendre à construire pour de bon.", lien: null, ordre: 30 }
        ]);
      },
      noterDayf: function () { return Promise.resolve(true); },
      hanoutVisite: function () { return Promise.resolve(true); },   // v7.8 — en atelier, personne ne compte
      // L'épreuve et le tableau demandent la vraie maison : en mode atelier,
      // il n'y a ni banque de questions ni autres joueurs.
      // Bab — chez une maison cliente, le quiz du jour tourne aussi en atelier, sur
      // la banque de la maison (ZWJ_MAISON_CONTENU.quiz) : cinq questions par jour,
      // jamais deux fois la même, vingt secondes. En ligne, c'est la base qui sert,
      // chronomètre et juge ; ici, le navigateur fait les trois, pour la démo.
      imtihanTirer: function () {
        var banque = quizDeLaMaison(), sess = sessionSync();
        if (!banque || !sess) return Promise.resolve({ ok: false, erreur: "En mode atelier, le rihal est vide." });
        var e = etatQuiz(sess.id), jour = jourLocal();
        if (e.jour !== jour) { e.jour = jour; e.servies = 0; }
        if (e.servies >= QUIZ_PAR_JOUR) return Promise.resolve({ ok: false, quota: true });
        var q = banque.filter(function (x) { return e.vues.indexOf(x.cle) < 0; })[0];
        if (!q) return Promise.resolve({ ok: false, epuise: true });
        e.servies += 1; e.vues.push(q.cle); e.encours = { cle: q.cle, le: Date.now() };
        ecrireQuiz(sess.id, e);
        return Promise.resolve({ ok: true, question: q.cle, theme: THEMES_QUIZ[q.theme] || q.theme || "", secondes: QUIZ_SECONDES,
          restantes: QUIZ_PAR_JOUR - e.servies, enonce: q.question,
          options: q.options.map(function (t, i) { return { i: i, t: t }; }) });
      },
      imtihanRepondre: function (question, choix, abandon) {
        var banque = quizDeLaMaison(), sess = sessionSync();
        if (!banque || !sess) return Promise.resolve({ ok: false, erreur: "En mode atelier." });
        var e = etatQuiz(sess.id), q = banque.filter(function (x) { return x.cle === question; })[0];
        if (!q || !e.encours || e.encours.cle !== question) return Promise.resolve({ ok: false, erreur: "Cette question n'est plus ouverte." });
        var retard = Date.now() - e.encours.le > (QUIZ_SECONDES + 2) * 1000;
        e.encours = null; ecrireQuiz(sess.id, e);
        var base = { ok: true, quota: e.servies >= QUIZ_PAR_JOUR, juste_etait: q.options[q.bonne], explication: q.explication || "" };
        if (abandon) return Promise.resolve(Object.assign(base, { abandon: true }));
        if (retard) return Promise.resolve(Object.assign(base, { trop_tard: true }));
        var juste = choix === q.bonne;
        if (juste) {
          var tous = lire(CLE.joueurs, {}), j = tous[sess.id];
          if (j) {
            var voie = VOIE_QUIZ[q.theme] || "savoir";
            j.sna3a = Object.assign({ prompt: 0, image: 0, savoir: 0 }, j.sna3a || {});
            j.sna3a[voie] = (Number(j.sna3a[voie]) || 0) + 1;
            j.imtihan = (Number(j.imtihan) || 0) + 1;
            ecrire(CLE.joueurs, tous);
          }
        }
        return Promise.resolve(Object.assign(base, { juste: juste, points: juste ? 1 : 0 }));
      },
      lireTableau: function () { return Promise.resolve([]); },
      // Le Souk est la ferracha du site : en atelier il n'y a ni site ni
      // dossier. La salle s'ouvre, montre une place vide, et dit pourquoi.
      // v5.7 — trois tapis de démonstration habitent la Rahba (voir DEMO_TAPIS) ; poser reste fermé.
      lireSouk: function () { return Promise.resolve({ tapis: demoTapis(), moi: { membre: false, raison: "atelier" }, devoile: false }); },
      // v5.7 — mes affaires, dans ce navigateur : les marchands de l'atelier répondent tout seuls.
      safqat: function () {
        var s = sessionSync(), Sf = safqaModule();
        if (!s || !Sf) return Promise.resolve({ ok: true, liste: [] });
        var tout = lire(CLE.safqat, {}), liste = robots((tout[s.id] || []).map(Sf.normaliser), Sf, Date.now());
        tout[s.id] = liste; ecrire(CLE.safqat, tout);
        // le fil, en atelier : ce que l'AUTRE a dit depuis mon dernier passage
        var fils = lire(CLE.kalam, {}), vus = lire(CLE.kalamVu, {});
        liste.forEach(function (a) {
          var fil = fils[String(a.id)] || [], vu = vus[String(a.id)] || "";
          a.messages = fil.length;
          a.nonLus = fil.filter(function (m) { return m.auteur !== s.id && String(m.quand) > vu; }).length;
        });
        return Promise.resolve({ ok: true, liste: liste });
      },
      // v7.1 — le fil, en atelier : il vit dans ce navigateur, et le marchand
      // de démonstration répond après coup (Yassine parle, Nour se dérobe,
      // Omar ne dit rien) — la salle doit être démontrable hors ligne.
      kalamLire: function (safqa) {
        var s = sessionSync(), Sf = safqaModule();
        if (!s || !Sf) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var a = (lire(CLE.safqat, {})[s.id] || []).map(Sf.normaliser).filter(function (x) { return x.id === String(safqa); })[0];
        if (!a) return Promise.resolve({ ok: false, erreur: "Cette affaire n'existe pas." });
        var tout = lire(CLE.kalam, {}), fil = tout[String(safqa)] || [];
        var Kl = kalamModule();
        var ferme = a.etat === "refusee" || a.etat === "annulee";
        var fin = Kl ? Kl.finApres(a, new Date()) : null;
        a.messages = fil.length; a.nonLus = 0;
        tout[String(safqa)] = fil; ecrire(CLE.kalam, tout);
        var vus = lire(CLE.kalamVu, {}); vus[String(safqa)] = new Date().toISOString(); ecrire(CLE.kalamVu, vus);
        return Promise.resolve({ ok: true, fil: fil, affaire: a,
          ouvert: !ferme && !(fin && fin.passe),
          raison: ferme ? "Cette affaire est close. Le fil s'est refermé avec elle."
                : (fin && fin.passe ? "L'affaire est conclue depuis plus de 7 jours : le fil s'est refermé." : null) });
      },
      kalamDire: function (safqa, texte) {
        var s = sessionSync(), Sf = safqaModule(), Kl = kalamModule();
        if (!s || !Sf || !Kl) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var a = (lire(CLE.safqat, {})[s.id] || []).map(Sf.normaliser).filter(function (x) { return x.id === String(safqa); })[0];
        if (!a) return Promise.resolve({ ok: false, erreur: "Cette affaire n'existe pas." });
        var porte = Kl.ouvert(a, s.id, new Date());
        if (!porte.ok) return Promise.resolve({ ok: false, erreur: porte.texte });
        var v = Kl.valider(texte);
        if (!v.ok) return Promise.resolve({ ok: false, erreur: v.erreur });
        var tout = lire(CLE.kalam, {}), fil = tout[String(safqa)] || [];
        if (fil.length >= Kl.PAR_AFFAIRE_MAX) return Promise.resolve({ ok: false, erreur: "Ce fil est plein (" + Kl.PAR_AFFAIRE_MAX + " messages). Concluez, ou reprenez une affaire neuve." });
        var moi = lire(CLE.joueurs, {})[s.id], iso = new Date().toISOString();
        var m = { id: "loc-" + Date.now().toString(36) + "-" + fil.length, safqa: String(safqa), auteur: s.id,
          pseudo: moi ? moi.pseudo : "Talib", texte: v.texte, quand: iso };
        fil.push(m);
        // le marchand répond, une fois par message reçu, tant qu'il a des mots
        var siennes = DEMO_REPONSES[a.vendeur] || [];
        var deja = fil.filter(function (x) { return x.auteur === a.vendeur; }).length;
        if (siennes[deja]) {
          fil.push({ id: m.id + "-r", safqa: String(safqa), auteur: a.vendeur, pseudo: a.vendeurPseudo,
            texte: siennes[deja], quand: new Date(Date.now() + 1000).toISOString() });
        }
        tout[String(safqa)] = fil; ecrire(CLE.kalam, tout);
        return Promise.resolve({ ok: true, message: m, fil: fil });
      },
      // v8.5 — LES RASA'IL, en atelier : la boîte vit dans ce navigateur, et les
      // règles sont celles de rasail.js — les mêmes que la base les tient.
      fils: function () {
        var s = sessionSync();
        if (!s || !rasailModule()) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var b = boiteLocale(s.id);
        var fils = Object.keys(b.fils).map(function (k) { return filResume(b, k, s.id); })
          .sort(function (x, y) { return String(y.dernierLe).localeCompare(String(x.dernierLe)); });
        ecrireBoite(s.id, b);
        return Promise.resolve({ ok: true, fils: fils, nouveaux: nouveauxDuJour(b, s.id) });
      },
      lireFil: function (autre) {
        var s = sessionSync();
        if (!s || !rasailModule()) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        autre = String(autre || "");
        if (!autre || autre === s.id) return Promise.resolve({ ok: false, erreur: "On ne s'écrit pas à soi-même." });
        var b = boiteLocale(s.id);
        if (!b.fils[autre] && !DEMO_RASAIL[autre]) return Promise.resolve({ ok: false, erreur: "Personne de ce nom dans la maison." });
        var r = filComplet(b, autre, s.id, true);
        ecrireBoite(s.id, b);
        return Promise.resolve(r);
      },
      ecrire: function (autre, texte) {
        var s = sessionSync(), Rl = rasailModule();
        if (!s || !Rl) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        autre = String(autre || "");
        if (!autre || autre === s.id) return Promise.resolve({ ok: false, erreur: "On ne s'écrit pas à soi-même." });
        var b = boiteLocale(s.id), demo = DEMO_RASAIL[autre];
        if (!b.fils[autre] && !demo) return Promise.resolve({ ok: false, erreur: "Personne de ce nom dans la maison." });
        var v = Rl.valider(texte);
        if (!v.ok) return Promise.resolve({ ok: false, erreur: v.erreur });
        if (b.bloques[autre]) return Promise.resolve({ ok: false, erreur: "Tu as bloqué cette personne. Débloque-la pour lui écrire." });
        var iso = new Date().toISOString(), f = b.fils[autre];
        if (!f) {
          if (nouveauxDuJour(b, s.id) >= Rl.NOUVEAUX_PAR_JOUR) return Promise.resolve({ ok: false, erreur: "Dix nouvelles conversations aujourd'hui : c'est la limite. Reprends demain." });
          f = b.fils[autre] = { pseudo: demo.pseudo, avatar: demo.avatar, messages: [], lu: 0, ouvertPar: s.id, ouvertLe: iso, signale: false, attente: null };
        }
        var vus = f.messages.map(function (m) { return { moi: m.de === s.id }; });
        if (Rl.sansReponse(vus) >= Rl.SANS_REPONSE_MAX) return Promise.resolve({ ok: false, erreur: "Deux messages sans réponse : attends que l'autre te réponde." });
        b.seq += 1;
        f.messages.push({ id: b.seq, de: s.id, texte: v.texte, le: iso });
        if (demo && !f.attente) {
          var deja = f.messages.filter(function (m) { return m.de === autre; }).length;
          var rep = demo.reponses[demo.premier ? deja - 1 : deja];
          if (rep) f.attente = { texte: rep, des: Date.now() + DEMO_RASAIL_DELAI_MS };
        }
        var r = filComplet(b, autre, s.id, true);
        ecrireBoite(s.id, b);
        return Promise.resolve(r);
      },
      nonLus: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve(null);
        var b = boiteLocale(s.id), n = 0;
        Object.keys(b.fils).forEach(function (k) { n += filResume(b, k, s.id).nonLus; });
        ecrireBoite(s.id, b);
        return Promise.resolve(n);
      },
      bloquer: function (autre, oui) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        autre = String(autre || "");
        if (!autre || autre === s.id) return Promise.resolve({ ok: false, erreur: "On ne se bloque pas soi-même." });
        var b = boiteLocale(s.id);
        if (oui) b.bloques[autre] = true; else delete b.bloques[autre];
        ecrireBoite(s.id, b);
        return Promise.resolve({ ok: true, bloque: !!oui });
      },
      signalerFil: function (autre, mot) {
        var s = sessionSync(), Rl = rasailModule();
        if (!s || !Rl) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var v = Rl.validerMot(mot);
        if (!v.ok) return Promise.resolve({ ok: false, erreur: v.erreur });
        var b = boiteLocale(s.id), f = b.fils[String(autre || "")];
        if (!f || !f.messages.some(function (m) { return m.de === String(autre); })) return Promise.resolve({ ok: false, erreur: "Il n'y a rien à signaler : l'autre ne t'a encore rien écrit." });
        f.signale = true;
        ecrireBoite(s.id, b);
        return Promise.resolve({ ok: true });
      },
      // v8.6 — LA BITAQA, en atelier : ma carte vit dans ce navigateur ; l'annuaire, ce sont
      // les trois voisins de démonstration, et la mienne si je l'ouvre. Les règles sont celles
      // de bitaqa.js — la base tient les mêmes.
      maCarte: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        return Promise.resolve(maCarteLocale(s.id));
      },
      poserCarte: function (v) {
        var s = sessionSync(), Bq = bitaqaModule();
        if (!s || !Bq) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        if (!lire(CLE.joueurs, {})[s.id]) return Promise.resolve({ ok: false, erreur: "Crée ton personnage d'abord." });
        var r = Bq.valider(v);
        if (!r.ok) return Promise.resolve({ ok: false, erreur: r.erreur });
        var c = r.carte, tout = lire(CLE.cartes, {});
        tout[s.id] = { visible: c.visible, carte: { ville: c.ville || null, metier: c.metier || null, cherche: c.cherche, chercheMot: c.chercheMot || null,
          offre: c.offre, offreMot: c.offreMot || null, langues: c.langues, liens: c.liens, maj: new Date().toISOString() } };
        ecrire(CLE.cartes, tout);
        return Promise.resolve(maCarteLocale(s.id));
      },
      carte: function (id) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        id = String(id || "");
        if (id === s.id) return Promise.resolve(maCarteLocale(s.id));
        var d = DEMO_CARTES[id];
        if (!d) return Promise.resolve({ ok: false, erreur: "Personne de ce nom dans la maison." });
        return Promise.resolve({ ok: true, joueur: Object.assign({ id: id }, d.joueur), visible: d.visible, carte: d.visible ? d.carte : null });
      },
      annuaire: function (f, page) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        f = f || {};
        var plier = function (t) { try { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) { return String(t || "").toLowerCase(); } };
        var toutes = Object.keys(DEMO_CARTES).filter(function (k) { return DEMO_CARTES[k].visible; })
          .map(function (k) { return { joueur: Object.assign({ id: k }, DEMO_CARTES[k].joueur), carte: DEMO_CARTES[k].carte }; });
        var mienne = maCarteLocale(s.id);
        if (mienne.ok && mienne.visible && mienne.carte) toutes.unshift({ joueur: mienne.joueur, carte: mienne.carte });
        var choisies = toutes.filter(function (x) {
          var c = x.carte || {}, j = x.joueur;
          if (f.tariqa && j.tariqa !== f.tariqa) return false;
          if (f.maydan && j.maydan !== f.maydan) return false;
          if (f.cherche && (c.cherche || []).indexOf(f.cherche) < 0) return false;
          if (f.offre && (c.offre || []).indexOf(f.offre) < 0) return false;
          if (f.ville && plier(c.ville).indexOf(plier(f.ville)) < 0) return false;
          if (f.mahara && (j.maharat || []).indexOf(f.mahara) < 0) return false;
          if (f.texte && plier([j.pseudo, c.metier, c.chercheMot, c.offreMot, c.ville].join(" ")).indexOf(plier(f.texte)) < 0) return false;
          return true;
        });
        var p = Math.max(0, Math.floor(Number(page) || 0)), n = 30;
        return Promise.resolve({ ok: true, total: choisies.length, page: p, cartes: choisies.slice(p * n, (p + 1) * n) });
      },
      // v8.7 — PARRAINER (RSE), en atelier : la proposition vit dans ce navigateur, avec les
      // mêmes règles que la base (zawia-derb.sql) — une ouverte par projet, cinq au plus.
      parrainerDerb: function (v) {
        var s = sessionSync(), Tm = tadamounModule();
        if (!s || !Tm) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        if (!lire(CLE.joueurs, {})[s.id]) return Promise.resolve({ ok: false, erreur: "Crée ton personnage d'abord." });
        v = v || {};
        var nom = Tm.nettoyer(v.projetNom, 48), r = Tm.validerParrainage(v);
        if (!v.projet || !nom) return Promise.resolve({ ok: false, erreur: "Ce projet est introuvable." });
        if (!r.ok) return Promise.resolve({ ok: false, erreur: r.texte });
        var tout = lire(CLE.parrainages, {}), liste = tout[s.id] || [];
        var ouvertes = liste.filter(function (x) { return x.etat === "nouveau" || x.etat === "en-cours"; });
        var deja = ouvertes.filter(function (x) { return x.projet === String(v.projet); })[0];
        if (deja) return Promise.resolve({ ok: true, id: deja.id, deja: true });
        if (ouvertes.length >= Tm.OUVERTS_MAX) return Promise.resolve({ ok: false, erreur: "Cinq propositions attendent déjà le bureau. Attends sa réponse avant d'en faire une autre." });
        var id = "local-" + Date.now().toString(36) + "-" + liste.length;
        liste.unshift({ id: id, projet: String(v.projet), projetNom: nom, entreprise: r.valeur.entreprise, etat: "nouveau", note: "", le: new Date().toISOString(), traite: null });
        tout[s.id] = liste.slice(0, 50); ecrire(CLE.parrainages, tout);
        return Promise.resolve({ ok: true, id: id, deja: false });
      },
      mesParrainages: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        return Promise.resolve({ ok: true, liste: (lire(CLE.parrainages, {})[s.id] || []).slice() });
      },
      proposerSafqa: function (v) {
        var s = sessionSync(), Sf = safqaModule();
        if (!s || !Sf) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        v = v || {};
        var tout = lire(CLE.safqat, {}), liste = (tout[s.id] || []).map(Sf.normaliser);
        if (!demoPseudo(v.vendeur)) return Promise.resolve({ ok: false, erreur: "En mode atelier, on ne fait affaire qu'avec les marchands de la place." });
        if (liste.some(function (a) { return a.etat === "proposee" && a.vendeur === v.vendeur && a.produitNom === v.produitNom; })) {
          return Promise.resolve({ ok: false, erreur: "Tu as déjà proposé un prix pour ce produit. Attends la réponse, ou annule-la d'abord." });
        }
        var moi = lire(CLE.joueurs, {})[s.id], iso = new Date().toISOString();
        var a = Sf.normaliser({ id: "loc-" + Date.now().toString(36) + "-" + liste.length, vendeur: v.vendeur, acheteur: s.id,
          vendeurPseudo: demoPseudo(v.vendeur), acheteurPseudo: moi ? moi.pseudo : "Talib", produit: v.produit, produitNom: v.produitNom,
          prix: v.prix, mot: v.mot, etat: "proposee", creee: iso, maj: iso });
        liste.unshift(a); tout[s.id] = liste; ecrire(CLE.safqat, tout);
        return Promise.resolve({ ok: true, affaire: a });
      },
      agirSafqa: function (id, action, mot) {
        var s = sessionSync(), Sf = safqaModule();
        if (!s || !Sf) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var tout = lire(CLE.safqat, {}), liste = (tout[s.id] || []).map(Sf.normaliser), trouvee = null, iso = new Date().toISOString();
        liste = liste.map(function (a) {
          if (a.id !== String(id)) return a;
          var t = Sf.transition(a, action, s.id, iso);
          if (!t.ok) { trouvee = t; return a; }
          if (mot && (action === "refuser" || action === "annuler")) t.affaire.reponse = Sf.nettoyerMot(mot);
          trouvee = t; return t.affaire;
        });
        if (!trouvee) return Promise.resolve({ ok: false, erreur: "Cette affaire n'existe pas." });
        if (!trouvee.ok) return Promise.resolve({ ok: false, erreur: trouvee.texte });
        tout[s.id] = liste; ecrire(CLE.safqat, tout);
        return Promise.resolve({ ok: true, affaire: trouvee.affaire });
      },
      poserEtal: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, le Souk est fermé.", raison: "atelier" });
      },
      retirerEtal: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, le Souk est fermé.", raison: "atelier" });
      },
      modifierEtal: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, le Souk est fermé.", raison: "atelier" });
      },
      televerser: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, le Souk est fermé.", raison: "atelier" });
      },
      retirerImage: function () { return Promise.resolve({ ok: true }); },
      signalerEtal: function () {
        return Promise.resolve({ ok: false, erreur: "En mode atelier, le Souk est fermé.", raison: "atelier" });
      },
      // En atelier il n'y a pas de seau : une image de la maison tient lieu de
      // vignette, pour que la galerie se REGARDE (sinon on ne la voit qu'en ligne).
      urlImage: function (chemin) {
        if (!chemin) return "";
        var n = String(chemin).length % 2 ? "mourchid-fes" : "mourchid-marrakech";
        return "assets/img/zawia/jeu/" + n + ".jpg";
      },
      validerPresence: function (seance, mot) {
        // Bab — chez une maison cliente, le rendez-vous de démonstration se
        // prouve comme en ligne : le mot dit pendant la réunion, et un point de
        // la communauté, une fois par rendez-vous.
        var md = maisonAtelier(), sess = sessionSync();
        var x = md && Array.isArray(md.seances) ? md.seances.filter(function (y) { return y.id === seance; })[0] : null;
        if (!x || !sess) return Promise.resolve({ ok: false, erreur: "En mode atelier, les présences ne se comptent pas." });
        var faites = lire(CLE_PRESENCES_MAISON, {});
        faites[sess.id] = faites[sess.id] || {};
        if (faites[sess.id][x.id]) return Promise.resolve({ ok: true, deja: true });
        if (normaliserMot(mot) !== normaliserMot(x.mot)) return Promise.resolve({ ok: false, erreur: "Ce n'est pas le mot dit pendant la réunion." });
        faites[sess.id][x.id] = new Date().toISOString();
        ecrire(CLE_PRESENCES_MAISON, faites);
        var tous = lire(CLE.joueurs, {}), j = tous[sess.id];
        if (j) { j.m39ol = (Number(j.m39ol) || 0) + 1; j.presences = (Number(j.presences) || 0) + 1; ecrire(CLE.joueurs, tous); }
        return Promise.resolve({ ok: true, m39ol: 1 });
      },
      // v7.6 — le Sirr, en atelier : les sept traces sont données, pour que le
      // huitième cadre et la khalwa se REGARDENT sans base (sinon ils ne se
      // vérifient qu'en ligne). ?sirr=n dans l'adresse en donne n.
      lireSirr: function () {
        var n = 7;
        try {
          var q = typeof location !== "undefined" && new URLSearchParams(location.search).get("sirr");
          if (q !== null && q !== undefined && q !== "" && isFinite(Number(q))) n = Math.max(0, Math.min(7, Math.floor(Number(q))));
        } catch (e) { /* sept par défaut */ }
        var S = (typeof window !== "undefined" ? window : globalThis).ZWJ;
        var cles = S && S.sirr ? S.sirr.TRACES.map(function (t) { return t.cle; }).slice(0, n) : [];
        var k = null;
        try { k = JSON.parse(localStorage.getItem("zwj.khalwa") || "null"); } catch (e) { k = null; }
        return Promise.resolve({ n: cles.length, traces: cles, khalwa: k });
      },
      demanderKhalwa: function (reponse) {
        if (!String(reponse || "").trim()) return Promise.resolve({ ok: false, erreur: "Dis où tu bloques." });
        try { localStorage.setItem("zwj.khalwa", JSON.stringify({ etat: "demandee", quand: null, note: null })); } catch (e) { /* tant pis */ }
        return Promise.resolve({ ok: true, deja: false, etat: "demandee" });
      },
      // v7.4 — le défi du Voilé, en atelier : le mot est frappé dans le
      // navigateur (en ligne, c'est la base : zawia-voile.sql). Même forme de
      // réponse, pour que le jeu ne fasse pas la différence.
      defiPrendre: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var tout = lire(CLE.voile, {}), p = tout[s.id];
        if (p) return Promise.resolve({ ok: true, deja: true, prise: p });
        p = { id: "atelier-" + s.id, mot: "lanterne-" + String(s.id).replace(/[^a-z0-9]/gi, "").slice(-4).toLowerCase(), saison: "atelier",
              donne_le: new Date().toISOString(), depot: null, rendu_le: null, etat: "en_cours", note: null };
        tout[s.id] = p; ecrire(CLE.voile, tout);
        return Promise.resolve({ ok: true, deja: false, prise: p });
      },
      defiMien: function () {
        var s = sessionSync();
        return Promise.resolve({ ok: true, prise: s ? (lire(CLE.voile, {})[s.id] || null) : null });
      },
      defiRendre: function (depot) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Entre d'abord." });
        var tout = lire(CLE.voile, {}), p = tout[s.id];
        if (!p) return Promise.resolve({ ok: false, erreur: "Tu n'as pas reçu le mot." });
        var u = String(depot || "").trim();
        if (!/^https:\/\/[^\s"'<>]+$/i.test(u) || u.length > 300) return Promise.resolve({ ok: false, erreur: "Une adresse https, publique, et rien d'autre." });
        if (p.etat !== "passe") { p.depot = u; p.rendu_le = new Date().toISOString(); p.etat = "rendu"; tout[s.id] = p; ecrire(CLE.voile, tout); }
        return Promise.resolve({ ok: true, prise: p });
      },
      // v2.6 — le Sahn ouvert : en atelier, la cour est à soi seul. Pas de
      // canal, pas de salut — le jeu reste solo, sans erreur.
      canal: function () { return null; },
      quitterCanal: function () { return Promise.resolve(); },
      // Bab — les collègues en direct d'une maison, simulés (voir canalSimule).
      canal: function () {
        var md = maisonAtelier();
        if (!md || !Array.isArray(md.enDirect) || !md.enDirect.length) return null;
        return canalSimule(md.enDirect, md.repliques || []);
      },
      quitterCanal: function (canal) { return canal && typeof canal.unsubscribe === "function" ? canal.unsubscribe() : Promise.resolve(); },
      saluer: function (autre) {
        // un collègue simulé rend le salut : la rencontre compte, une fois, pour le défi des dix
        var md = maisonAtelier(), sess = sessionSync();
        var simule = md && Array.isArray(md.enDirect) && md.enDirect.some(function (g) { return g.id === autre; });
        if (!simule || !sess) return Promise.resolve({ ok: false, erreur: "En mode atelier, la cour est à toi seul." });
        var tout = lire("bab.rencontres", {}), mes = tout[sess.id] || [];
        var deja = mes.indexOf(autre) >= 0;
        if (!deja) { mes.push(autre); tout[sess.id] = mes; ecrire("bab.rencontres", tout); }
        var tous = lire(CLE.joueurs, {}), j = tous[sess.id];
        if (j) { j.rencontres = Math.max(Number(j.rencontres) || 0, mes.length); ecrire(CLE.joueurs, tous); }
        return Promise.resolve(deja ? { ok: true, deja: true, rencontres: mes.length } : { ok: true, rencontre: true, rencontres: mes.length });
      },

      lireJoueur: function () {
        var s = sessionSync();
        if (!s) return Promise.resolve(null);
        var j = lire(CLE.joueurs, {})[s.id];
        return Promise.resolve(j ? depuisLigne(j) : null);
      },

      ecrireJoueur: function (joueur) {
        var s = sessionSync();
        if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session. Entre d'abord." });
        var joueurs = lire(CLE.joueurs, {});
        var voulu = String(joueur.pseudo || "").toLowerCase();
        for (var id in joueurs) {
          if (id !== s.id && joueurs[id] && String(joueurs[id].pseudo || "").toLowerCase() === voulu) {
            return Promise.resolve({ ok: false, erreur: "Ce pseudo est déjà pris dans la cour. Choisis-en un autre." });
          }
        }
        var ligne = versLigne(joueur, s.id);
        // v7.0 — l'atelier imite la garde : tariqa_depuis est l'heure du serveur, jamais du joueur
        var avant = joueurs[s.id] || {};
        ligne.tariqa_depuis = !ligne.tariqa ? null : (ligne.tariqa === avant.tariqa && avant.tariqa_depuis ? avant.tariqa_depuis : new Date().toISOString());
        ligne.updated_at = new Date().toISOString();
        joueurs[s.id] = ligne;
        ecrire(CLE.joueurs, joueurs);
        return Promise.resolve({ ok: true, joueur: depuisLigne(ligne) });
      },

      surChangement: function (cb) { ecouteurs.push(cb); },

      // ---- v7.7 — LE MECHOUAR (atelier) ----------------------------------------
      // Tout se joue dans le navigateur : la place doit rester démontrable hors
      // ligne. En ligne, c'est la base qui sert, chronomètre, juge et écrit.
      mechouarEtat: function () {
        var s = sessionSync(), j = s ? (lire(CLE.joueurs, {})[s.id] || null) : null, tout = lire(CLE.mechouar, {});
        var m = tout[s ? s.id : "-"] || { titre: "mtmarren", victoires: 0, admis: null, banniere: null, kunya: null };
        var sna3a = 0, k, sj = (j && j.sna3a) || {};
        for (k in sj) if (Object.prototype.hasOwnProperty.call(sj, k)) sna3a += Number(sj[k]) || 0;
        var pages = j && j.pages ? Object.keys(j.pages).length : 0;
        var tah = j && j.tahaddi ? Object.keys(j.tahaddi).length : 0;
        var portes = { sna3a: sna3a > 0 || tah > 0, dhakira: pages > 0, valeurs: !!m.admis };
        if (portes.sna3a && portes.dhakira && portes.valeurs && m.titre === "mtmarren") {
          m.titre = "moujahid"; tout[s.id] = m; ecrire(CLE.mechouar, tout);
        }
        return Promise.resolve({ ok: true, atelier: true, portes: portes, titre: m.titre,
          banniere: m.banniere, victoires: m.victoires, kunya: m.kunya,
          mur: m.titre === "mtmarren" ? [] : [{ pseudo: (j && j.pseudo) || "toi", titre: m.titre, banniere: m.banniere, kunya: m.kunya, victoires: m.victoires }],
          joutes: [], aPeser: [] });
      },
      mechouarAdmettre: function (choix, raison) {
        var s = sessionSync(); if (!s) return Promise.resolve({ ok: false, erreur: "Pas de session." });
        var r = String(raison == null ? "" : raison).trim();
        if (!r) return Promise.resolve({ ok: false, erreur: "Une raison, même courte. C'est elle qu'on pèse." });
        if (r.length > 140) return Promise.resolve({ ok: false, erreur: "Cent quarante signes au plus." });
        if (choix !== 0 && choix !== 1) return Promise.resolve({ ok: false, erreur: "Choisis une des deux réponses." });
        var tout = lire(CLE.mechouar, {}), m = tout[s.id] || { titre: "mtmarren", victoires: 0, admis: null, banniere: null, kunya: null };
        m.admis = m.admis || new Date().toISOString(); tout[s.id] = m; ecrire(CLE.mechouar, tout);
        return Promise.resolve({ ok: true });
      },
      mechouarIsnad: function (joute, langue) {
        // cinq affirmations, mêlées par la minute — l'atelier n'a pas de graine partagée
        var ar = langue === "ar";
        var l = DEMO_FAITS.slice(), out = [], i, n = Math.min(5, l.length);
        for (i = 0; i < n; i++) out.push(l.splice(Math.floor(l.length / 2), 1)[0]);
        return Promise.resolve({ ok: true, faits: out.map(function (f, k) {
          return { fait: f.id, texte: (ar && f.texte_ar) || f.texte, ville: f.ville, rang: k + 1 };
        }) });
      },
      mechouarAppeler: function (joute, fait, appel, langue) {
        var f = null, i, ar = langue === "ar";
        for (i = 0; i < DEMO_FAITS.length; i++) if (DEMO_FAITS[i].id === fait) f = DEMO_FAITS[i];
        if (!f) return Promise.resolve({ ok: false, erreur: "Affirmation inconnue." });
        return Promise.resolve({ ok: true, juste: appel === f.solide, tard: false, solide: f.solide,
          correction: (ar && f.correction_ar) || f.correction || null,
          source: (ar && f.source_ar) || f.source });
      },
      mechouarManche: function () { return Promise.resolve({ ok: true, atelier: true }); },
      mechouarDefier: function () {
        return Promise.resolve({ ok: false, erreur: "En atelier, personne d'autre n'est dans le cercle : la nzaha est ouverte." });
      },
      mechouarPeser: function () { return Promise.resolve({ ok: false, erreur: "Aucune raison à peser en atelier." }); },
      mechouarVoter: function () { return Promise.resolve({ ok: false, erreur: "Aucune raison à peser en atelier." }); },
      mechouarRegler: function () { return Promise.resolve({ ok: false, erreur: "Aucune joute en atelier." }); },
    };
  }

  // ---- Mode Supabase -----------------------------------------------------------------
  // Les messages de Supabase arrivent en anglais ; on parle au joueur en
  // français, et on ne dit jamais à un inconnu si un e-mail existe.
  // La fonction Netlify du Souk, sur la même origine que le jeu (l3b.zawia.tech
  // est un alias du site : Netlify y route ses fonctions). Le jeton de session
  // part en Authorization ; sans session, on lit le Souk public.
  var FONCTION_SOUK = "/.netlify/functions/zawia-souk";
  // v tranche B — le seau des images de la galerie, sur le projet du JEU.
  var SEAU_SOUK = "zawia-souk";
  // v4.1 — le parrainage : la fonction envoie le lien (la base n'envoie pas
  // d'e-mail) et traverse vers le CRM pour le parcours du dossier.
  var FONCTION_PARRAINAGE = "/.netlify/functions/zawia-parrainage";
  // v4.8 — le golf du prompt : la fonction appelle le modèle, juge, consigne.
  var FONCTION_QLIL = "/.netlify/functions/zawia-qlil";
  // v6.1 — les Masarat : la fonction recopie les formations du joueur depuis le CRM.
  var FONCTION_FORMATIONS = "/.netlify/functions/zawia-formations";
  function fonctionSouk(client, methode, corps, chemin) {
    var session = client ? client.auth.getSession().then(function (r) { return r.data && r.data.session; }) : Promise.resolve(null);
    return session.then(function (sess) {
      var init = { method: methode, headers: {}, cache: "no-store" };
      if (sess && sess.access_token) init.headers.Authorization = "Bearer " + sess.access_token;
      if (corps) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(corps); }
      return fetch(chemin || FONCTION_SOUK, init).then(function (res) {
        return res.json().catch(function () { return { ok: false, error: "réponse illisible", raison: "panne" }; });
      });
    }).catch(function () { return { ok: false, error: "Le réseau n'a pas répondu.", raison: "panne" }; });
  }
  // ⚠️⚠️ CE QUI PART VERS LA FONCTION, EN UN SEUL ENDROIT (20/09/2026). Les deux
  // envois recopiaient une liste de champs À LA MAIN — et la tranche A (corps,
  // faq, livre, delai) n'y avait jamais été ajoutée : le formulaire les
  // collectait, souk.js les validait, et ILS TOMBAIENT ICI, avant le réseau.
  // Une fiche complète ne s'enregistrait pas, tests verts. Un test compare
  // désormais cette liste à celle de souk.js.
  function versLigneSouk(champs) {
    champs = champs || {};
    var t = function (v) { return v ? String(v) : ""; };
    return {
      nom: String(champs.nom || ""),
      resout: t(champs.resout),
      lien: t(champs.lien),
      accroche: t(champs.accroche),
      pour_qui: t(champs.pourQui),
      description: t(champs.description),
      corps: t(champs.corps),
      livre: t(champs.livre),
      delai: t(champs.delai),
      faq: Array.isArray(champs.faq) ? champs.faq : [],
      galerie: Array.isArray(champs.galerie) ? champs.galerie : [],
      // v8.7 — le Derb t-Tadamoun (tadamoun.js) : où le projet s'étale, et ce qu'il dit de lui
      derb: champs.derb === "tadamoun" ? "tadamoun" : "souk",
      forme: t(champs.forme),
      stade: t(champs.stade),
      impact: t(champs.impact),
      besoins: Array.isArray(champs.besoins) ? champs.besoins : []
    };
  }

  function traduire(err) {
    var m = String((err && err.message) || "").toLowerCase();
    // v4.1 — le refus du hook Auth et du déclencheur : écrit en français par la
    // base, on le rend tel quel.
    if (m.indexOf("parrainage") !== -1) return String(err.message);
    if (m.indexOf("invalid login") !== -1 || m.indexOf("invalid credentials") !== -1) return "E-mail ou mot de passe incorrect.";
    if (m.indexOf("already registered") !== -1 || m.indexOf("already exists") !== -1) return "Un compte existe déjà avec cet e-mail. Entre plutôt.";
    if (m.indexOf("not confirmed") !== -1) return "Confirme d'abord ton e-mail — regarde ta boîte.";
    if (m.indexOf("rate limit") !== -1 || m.indexOf("too many") !== -1) return "Trop d'essais. Attends une minute.";
    if (m.indexOf("password") !== -1) return "Mot de passe refusé : " + MDP_MIN + " caractères au moins.";
    if (m.indexOf("fetch") !== -1 || m.indexOf("network") !== -1) return "La maison ne répond pas. Réessaie dans un instant.";
    return "Ça n'a pas marché : " + ((err && err.message) || "erreur inconnue") + ".";
  }

  function adaptateurSupabase(client) {
    var TABLE = "zawia_joueurs";

    function sessionDepuis(s) {
      return s && s.user ? { id: s.user.id, email: s.user.email } : null;
    }

    return {
      mode: "supabase",

      inscrire: function (email, mdp, invitation) {
        var v = validerIdentifiants(email, mdp);
        if (!v.ok) return Promise.resolve(v);
        // v4.1 — le code du lien part dans les métadonnées du compte : le hook
        // Auth le lit pour laisser passer l'invité, la reconnaissance pour
        // consommer l'invitation. Sans code, on n'envoie rien.
        var options = RE_CODE.test(String(invitation || "")) ? { data: { invitation: String(invitation) } } : undefined;
        return client.auth.signUp({ email: v.email, password: v.mdp, options: options }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          if (r.data && r.data.session) return { ok: true, session: sessionDepuis(r.data.session) };
          // Pas de session tout de suite. Deux cas possibles, indiscernables
          // par construction (anti-énumération de Supabase) : le projet exige
          // une confirmation d'e-mail, OU cet e-mail est déjà inscrit. On ne
          // promet donc JAMAIS qu'un e-mail est parti — avec la confirmation
          // désactivée (l'état du projet depuis le 15/09/2026), c'était faux.
          return { ok: true, confirmation: true, message: "C'est noté. Entre avec ton e-mail et ton mot de passe — et si une confirmation t'est demandée, elle est dans ta boîte." };
        });
      },

      connecter: function (email, mdp) {
        var v = validerIdentifiants(email, mdp);
        if (!v.ok) return Promise.resolve({ ok: false, erreur: "E-mail ou mot de passe incorrect." });
        return client.auth.signInWithPassword({ email: v.email, password: v.mdp }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return { ok: true, session: sessionDepuis(r.data && r.data.session) };
        });
      },

      // v4.5 — LE RETOUR : le mot de passe oublié.
      //
      // Trois gestes, et une règle qui les tient : on ne dit JAMAIS à un
      // inconnu si une adresse a un compte. Supabase répond déjà 200 dans
      // les deux cas ; l'écran dit la même phrase par-dessus.
      //
      // `retour` est l'adresse où le lien ramène — la maison elle-même. Elle
      // doit figurer dans la liste des redirections autorisées du projet,
      // sans quoi Supabase renvoie sur le Site URL et le joueur atterrit
      // ailleurs. C'est un réglage du projet, pas du code.
      envoyerLienDeRetour: function (email, retour) {
        var v = validerIdentifiants(email, "0".repeat(MDP_MIN));
        if (!v.ok) return Promise.resolve({ ok: false, erreur: v.erreur });
        var options = retour ? { redirectTo: retour } : undefined;
        return client.auth.resetPasswordForEmail(v.email, options).then(function (r) {
          // Une limite de débit se dit (elle vient de la maison, pas du compte) ;
          // tout le reste rend la phrase neutre — un refus nommerait l'adresse.
          if (r.error && /rate limit|too many/i.test(String(r.error.message || ""))) {
            return { ok: false, erreur: traduire(r.error) };
          }
          return { ok: true };
        }).catch(function () { return { ok: false, erreur: "La maison ne répond pas. Réessaie dans un instant." }; });
      },

      // Les jetons du lien, sortis du fragment par le script de tête. On ne
      // les laisse pas à supabase-js : il les lirait dans la barre d'adresse,
      // c'est-à-dire APRÈS la mesure d'audience.
      reprendre: function (t) {
        if (!t || !t.acces || !t.rafraichi) return Promise.resolve({ ok: false, raison: "expire" });
        return client.auth.setSession({ access_token: t.acces, refresh_token: t.rafraichi }).then(function (r) {
          if (r.error) return { ok: false, raison: "expire", erreur: traduire(r.error) };
          return { ok: true, session: sessionDepuis(r.data && r.data.session) };
        }).catch(function () { return { ok: false, raison: "expire" }; });
      },

      changerMotDePasse: function (mdp) {
        if (String(mdp || "").length < MDP_MIN) {
          return Promise.resolve({ ok: false, erreur: "Mot de passe trop court : " + MDP_MIN + " caractères au moins." });
        }
        return client.auth.updateUser({ password: String(mdp) }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return { ok: true };
        }).catch(function () { return { ok: false, erreur: "La maison ne répond pas. Réessaie dans un instant." }; });
      },

      deconnecter: function () {
        return client.auth.signOut().then(function () { return { ok: true }; });
      },

      session: function () {
        return client.auth.getSession().then(function (r) { return sessionDepuis(r.data && r.data.session); });
      },

      // La Chajara : une RPC IDEMPOTENTE, appelée à chaque session vivante.
      // Le serveur rapproche l'e-mail du compte de la liste posée par le
      // bureau, attache la lignée si elle y est, et rend { maison, chajara }.
      // Idempotente parce qu'un lauréat peut s'inscrire AVANT que le bureau
      // pose sa liste : il est reconnu à la connexion suivante, pas perdu.
      // En cas de panne : Talib libre — fail-close, comme le voile.
      reclamerChajara: function () {
        return client.rpc("zawia_reclamer_chajara").then(function (r) {
          if (r.error) return { ok: false, maison: false, chajara: null, erreur: traduire(r.error) };
          return r.data || { ok: false, maison: false, chajara: null };
        }).catch(function () { return { ok: false, maison: false, chajara: null, erreur: "Le réseau n'a pas répondu." }; });
      },

      // ---- v4.1 — LE PARRAINAGE (zawia-parrainage.sql) --------------------------
      // Ce que la Porte peut dire d'un lien : valide ou non, le pseudo du
      // parrain. Appelable sans compte ; jamais l'e-mail invité.
      lireInvitation: function (code) {
        if (!RE_CODE.test(String(code || ""))) return Promise.resolve({ valide: false, raison: "inconnue" });
        return client.rpc("zawia_invitation", { p_code: String(code) }).then(function (r) {
          if (r.error) return { valide: false, raison: "inconnue" };
          return r.data || { valide: false, raison: "inconnue" };
        }).catch(function () { return { valide: false, raison: "inconnue" }; });
      },
      // Inviter passe par la fonction Netlify : c'est la BASE qui juge (au nom
      // du joueur, par son jeton), la fonction qui envoie l'e-mail.
      parrainer: function (email) {
        return fonctionSouk(client, "POST", { action: "inviter", email: String(email || "") }, FONCTION_PARRAINAGE).then(function (d) {
          if (!d || !d.ok) return { ok: false, raison: d && d.raison, erreur: (d && d.error) || "Ça n'a pas marché." };
          return { ok: true, deja: !!d.deja, email: d.email, lien: d.lien, envoye: !!d.envoye };
        });
      },
      lireFilleuls: function () {
        return client.rpc("zawia_mes_filleuls").then(function (r) {
          if (r.error) return { ok: false, invitations: [] };
          return r.data || { ok: false, invitations: [] };
        }).catch(function () { return { ok: false, invitations: [] }; });
      },
      retirerInvitation: function (code) {
        return client.rpc("zawia_retirer_invitation", { p_code: String(code || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // Le parcours du dossier : sans compte, et la réponse est toujours la même.
      demanderDossier: function (email) {
        return fonctionSouk(null, "POST", { action: "entrer", email: String(email || "") }, FONCTION_PARRAINAGE).then(function (d) {
          if (!d || !d.ok) return { ok: false, erreur: (d && d.error) || "La maison ne répond pas. Réessaie dans un instant." };
          return { ok: true, message: d.message };
        });
      },

      // v3.2 — le masque du Morchid : une FONCTION (zawia-morchid.sql) qui
      // refuse tout autre compte, écrit le rang par l'exception de la garde,
      // et rend ce que l'écran doit montrer. Le masque vide retire le masque.
      incarner: function (masque) {
        return client.rpc("zawia_incarner", { p_masque: masque || null }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v3.3 — la chambre du Majliss (zawia-majliss.sql) : deux fonctions,
      // toutes deux fermées à qui n'est pas du conseil.
      lireMajliss: function () {
        return client.rpc("zawia_majliss_tableau").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      // v3.4 — ce que la maison offre à chaque niveau de Dhakira (zawia-recompenses.sql),
      // et la réclamation — que le serveur revérifie au niveau qu'il compte lui-même.
      lireRecompenses: function () {
        return client.rpc("zawia_recompenses_ouvertes").then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },
      reclamerRecompense: function (id) {
        return client.rpc("zawia_reclamer_recompense", { p_recompense: String(id || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // v6.0 — le Kounnach (zawia-kounnach.sql) : la liste sans corps, le corps au
      // niveau (la base compte), la proposition, « ça m'a servi ». Une panne
      // rend une liste vide : la salle dit qu'elle est vide, le jeu continue.
      lireKounnach: function () {
        return client.rpc("zawia_kounnach").then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },
      lireWasfa: function (id) {
        return client.rpc("zawia_wasfa", { p_id: String(id || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      proposerWasfa: function (v) {
        v = v || {};
        return client.rpc("zawia_wasfa_proposer", {
          p_id: v.id ? String(v.id) : null, p_titre: String(v.titre || ""), p_resume: String(v.resume || ""),
          p_voie: String(v.voie || ""), p_corps: String(v.corps || ""), p_lien: v.lien == null ? null : String(v.lien)
        }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // v6.1 — les Masarat (zawia-masarat.sql) : la base tient « ouverte »,
      // « accessible », le brief et l'attestation. Les formations du joueur
      // sont recopiées du CRM par la fonction Netlify (qui borne sa fréquence).
      rafraichirFormations: function () { return fonctionSouk(client, "GET", null, FONCTION_FORMATIONS); },
      lireMasarat: function () {
        return client.rpc("zawia_masarat").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // v7.8 — les maharat (zawia-maharat.sql) : la base rend les prouvées, les
      // apprises et les ponts (formations, étapes) — le navigateur n'en écrit aucune.
      lireMaharat: function () {
        return client.rpc("zawia_mes_maharat").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // v8.0 — la Rkhama : la base rend { ok, maison, partenaires } — nom, mot de
      // la maison, chemin du logo dans le seau, lien https, depuis, ordre. Aucun
      // nom n'est écrit ici : la dalle est gravée par le bureau, pas par l'écran.
      lirePartenaires: function () {
        return client.rpc("zawia_partenaires").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      lireEtape: function (id) {
        return client.rpc("zawia_etape", { p_id: String(id || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      livrer: function (id, v) {
        v = v || {};
        return client.rpc("zawia_livrer", {
          p_etape: String(id || ""), p_lien: String(v.lien || ""), p_regle: String(v.regle || ""), p_ia: String(v.ia || ""), p_main: String(v.main || "")
        }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      servirWasfa: function (id, servi) {
        return client.rpc("zawia_wasfa_servi", { p_id: String(id || ""), p_servi: servi !== false }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // v4.7 — la fontaine (zawia-khessa.sql) : la base compte, une goutte par
      // geste et par jour. Une panne ne casse rien : la fontaine se tait.
      khessaEtat: function () {
        return client.rpc("zawia_khessa_etat").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      qlilEtat: function () { return fonctionSouk(client, "POST", { action: "etat" }, FONCTION_QLIL); },
      qlilJouer: function (trou, prompt) { return fonctionSouk(client, "POST", { action: "jouer", trou: String(trou || ""), prompt: String(prompt || "") }, FONCTION_QLIL); },
      khessaVerser: function (geste) {
        return client.rpc("zawia_khessa_verser", { p_geste: String(geste || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      ecrireMajliss: function (texte) {
        return client.rpc("zawia_majliss_ecrire", { p_texte: String(texte || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // Le Riwaq. Lecture seule, et une panne de réseau ne casse pas le jeu :
      // on rend une salle vide plutôt qu'une erreur au milieu d'une partie.
      lireRessources: function () {
        return client.from("zawia_ressources").select("*").then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },
      // ⚠️ v7.3 — LES RAYONS D'UN INVITÉ. Il n'a pas de session : la policy de
      // `zawia_ressources` est `lire [authenticated]`, donc `lireRessources`
      // lui rend ZÉRO ligne et la porte « je veux apprendre » ouvrait une salle
      // vide. Cette fonction-ci est la seule sortie vers lui, et elle ne rend
      // que ce que le bureau a coché (`aux_dyaf`, false par défaut).
      lireRayonsDayf: function () {
        return client.rpc("zawia_dyaf_rayons").then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },
      // Deux compteurs ANONYMES : ni adresse, ni identifiant, ni pseudo — un
      // nombre par jour et par événement. Sans eux on décidera la suite sur des
      // impressions. Une panne ne doit jamais se voir à l'écran.
      noterDayf: function (evenement) {
        try {
          return client.rpc("zawia_dyaf_note", { p_evenement: String(evenement || "") })
            .then(function () { return true; }).catch(function () { return false; });
        } catch (e) { return Promise.resolve(false); }
      },
      // v7.8 — qui vient du hanout est entré dans la cour : la base note la visite
      // (zawia-hanout.sql). Sans elle, un prestige du hanout n'est pas compté.
      // Comme le compteur des invités : on note, on n'attend pas, une panne ne se voit pas.
      hanoutVisite: function (code) {
        try {
          return client.rpc("zawia_hanout_visite", { p_code: String(code || "") })
            .then(function () { return true; }).catch(function () { return false; });
        } catch (e) { return Promise.resolve(false); }
      },

      // ⚠️ On passe par des FONCTIONS, jamais par la table : `zawia_seances`
      //    n'a aucune policy de lecture, sans quoi le mot de passe se lirait
      //    avec la clé publique — qui est publique. La fonction ne rend que ce
      //    que le joueur a le droit de voir.
      lireSeances: function () {
        return client.rpc("zawia_seances_a_venir", { combien: 8 }).then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },

      // ⚠️ L'épreuve passe par des FONCTIONS, jamais par la table : la bonne
      //    réponse n'a aucune raison de descendre jusqu'ici, et le chronomètre
      //    doit être tenu par le serveur pour valoir quelque chose.
      imtihanTirer: function () {
        return client.rpc("zawia_imtihan_tirer").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Le rihal n'a rien rendu." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },

      imtihanRepondre: function (question, choix, abandon) {
        return client.rpc("zawia_imtihan_repondre", {
          question: question,
          choix: typeof choix === "number" ? choix : -1,
          abandon: !!abandon
        }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },

      // Le tableau : la seule lecture qui traverse les lignes des autres, et
      // elle ne rend que le pseudo, le rang et les trois comptes.
      lireTableau: function () {
        return client.rpc("zawia_tableau", { combien: 50 }).then(function (r) {
          if (r.error) return [];
          return r.data || [];
        }).catch(function () { return []; });
      },

      // ---- LE SOUK : LA ferracha du site, par la fonction Netlify ------------
      // v3.7 — une seule ferracha. On envoie le jeton de session du jeu ; la
      // fonction le fait vérifier par le projet du jeu, rapproche l'e-mail du
      // dossier ZAW'IA, et lit/écrit la table des ferrachas du site. Rien de
      // tout ça ne passe par une table du projet du jeu.
      lireSouk: function () {
        return fonctionSouk(client, "GET").then(function (d) {
          if (!d || !d.ok) return { tapis: [], moi: { membre: false, raison: (d && d.raison) || "panne" }, devoile: false };
          return {
            tapis: Array.isArray(d.tapis) ? d.tapis : [],
            moi: d.moi && typeof d.moi === "object" ? d.moi : { membre: false, raison: "jeton" },
            devoile: !!(d.voile && d.voile.devoile)
          };
        });
      },

      // LA GALERIE (tranche B) : le fichier monte DIRECTEMENT dans le seau du
      // projet du jeu, avec la session du joueur — pas par la fonction Netlify
      // (une image de 2 Mo en base64 dans un lambda, c'est cher et c'est lent).
      // ⚠️ Le chemin commence par SON identifiant : la policy du seau n'en
      // accepte pas d'autre, et zawia-souk.js le revérifie avant d'écrire la
      // ligne. Le poids et le type sont tenus par le seau lui-même.
      televerser: function (fichier) {
        if (!fichier) return Promise.resolve({ ok: false, erreur: "Choisis une image." });
        var ext = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" }[String(fichier.type || "").toLowerCase()];
        if (!ext) return Promise.resolve({ ok: false, erreur: "Une image en webp, jpg ou png." });
        if (fichier.size > 2 * 1024 * 1024) return Promise.resolve({ ok: false, erreur: "Deux mégaoctets au plus — allège l'image." });
        return client.auth.getSession().then(function (r) {
          var sess = r && r.data && r.data.session;
          if (!sess || !sess.user) return { ok: false, erreur: "Entre d'abord." };
          var nom = (root.crypto && root.crypto.randomUUID) ? root.crypto.randomUUID() : null;
          if (!nom) return { ok: false, erreur: "Ce navigateur ne sait pas poser d'image." };
          var chemin = sess.user.id + "/" + nom + "." + ext;
          return client.storage.from(SEAU_SOUK).upload(chemin, fichier, { contentType: fichier.type, upsert: false })
            .then(function (d) {
              if (d && d.error) return { ok: false, erreur: "L'image n'est pas montée. Réessaie." };
              return { ok: true, chemin: chemin };
            });
        }).catch(function () { return { ok: false, erreur: "L'image n'est pas montée. Réessaie." }; });
      },
      // Retirer une image qu'on vient de poser : la policy du seau n'autorise
      // que son propre dossier. Sans ça, une image écartée du formulaire
      // resterait publique pour toujours.
      retirerImage: function (chemin) {
        if (!chemin) return Promise.resolve({ ok: true });
        return client.storage.from(SEAU_SOUK).remove([String(chemin)])
          .then(function () { return { ok: true }; })
          .catch(function () { return { ok: true }; });
      },
      // L'adresse publique d'un chemin — composée ici, jamais écrite dans un
      // module (le voile : aucun domaine en dur ailleurs que dans la config).
      urlImage: function (chemin) {
        if (!chemin) return "";
        try { return client.storage.from(SEAU_SOUK).getPublicUrl(chemin).data.publicUrl || ""; }
        catch (e) { return ""; }
      },

      // Signaler une fiche (tranche B) : la fonction incrémente le compteur et
      // garde le mot ; le bureau décide. Aucun masquage automatique.
      signalerEtal: function (id, mot) {
        return fonctionSouk(client, "POST", { action: "signaler", id: String(id || ""), mot: String(mot || "") }).then(function (d) {
          if (!d || !d.ok) return { ok: false, erreur: (d && d.error) || "Ça n'a pas marché." };
          return { ok: true };
        });
      },

      poserEtal: function (champs) {
        champs = champs || {};
        return fonctionSouk(client, "POST", { action: "ajouter", projet: versLigneSouk(champs) }).then(function (d) {
          if (!d || !d.ok) return { ok: false, erreur: (d && d.error) || "Ça n'a pas marché.", raison: d && d.raison };
          return { ok: true, projet: d.projet };
        });
      },

      // v4.4 — retoucher la fiche : tous les champs du formulaire repartent,
      // vides compris (vider une accroche est un geste).
      modifierEtal: function (id, champs) {
        champs = champs || {};
        return fonctionSouk(client, "POST", { action: "modifier", id: String(id || ""), projet: versLigneSouk(champs) }).then(function (d) {
          if (!d || !d.ok) return { ok: false, erreur: (d && d.error) || "Ça n'a pas marché.", raison: d && d.raison };
          return { ok: true, projet: d.projet };
        });
      },

      retirerEtal: function (id) {
        return fonctionSouk(client, "POST", { action: "supprimer", id: String(id || "") }).then(function (d) {
          if (!d || !d.ok) return { ok: false, erreur: (d && d.error) || "Ça n'a pas marché.", raison: d && d.raison };
          return { ok: true };
        });
      },

      // v7.6 — le Sirr : les sept traces sont comptées PAR LA BASE
      // (zawia-sirr.sql), sur des colonnes que le navigateur ne peut pas
      // s'écrire. Au bout de la piste il y a le temps d'une personne réelle.
      lireSirr: function () {
        return client.rpc("zawia_sirr").then(function (r) {
          if (r.error) return null;
          return r.data || null;
        }).catch(function () { return null; });
      },
      demanderKhalwa: function (reponse) {
        return client.rpc("zawia_khalwa_demander", { p_reponse: String(reponse || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v7.4 — le défi du Voilé : le mot est FRAPPÉ PAR LA BASE (zawia-voile.sql),
      // jamais par l'écran — c'est lui qui date le premier commit. Trois
      // fonctions, toutes fail-close : sans session, sans défi ouvert, rien.
      defiPrendre: function () {
        return client.rpc("zawia_defi_prendre").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      defiMien: function () {
        return client.rpc("zawia_defi_mien").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: true, prise: null };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      defiRendre: function (depot) {
        return client.rpc("zawia_defi_rendre", { p_depot: String(depot || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      validerPresence: function (seance, mot) {
        return client.rpc("zawia_valider_presence", { seance: seance, mot: String(mot || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () {
          return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." };
        });
      },

      // v2.6 — le Sahn ouvert. Un canal Realtime PUBLIC (Presence + Broadcast) :
      // rien n'y transite qui ne soit déjà visible dans la cour — pseudo,
      // avatar, position. La clé de présence est celle de la session (un
      // compte ouvert dans deux onglets fait deux présences).
      canal: function (nom, cle) {
        if (typeof client.channel !== "function") return null;
        try {
          return client.channel(String(nom || "sahn"), { config: { presence: { key: String(cle || "") }, broadcast: { self: false, ack: false } } });
        } catch (e) { return null; }
      },
      quitterCanal: function (canal) {
        if (!canal) return Promise.resolve();
        try { return Promise.resolve(client.removeChannel(canal)).catch(function () { }); }
        catch (e) { return Promise.resolve(); }
      },
      // v5.7 — la Safqa : la base tient le registre (zawia-safqa.sql), et rejoue
      // les mêmes transitions que safqa.js. Rend { ok, liste } / { ok, affaire } / { ok: false, erreur }.
      safqat: function () {
        return client.rpc("zawia_mes_safqat").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return { ok: true, liste: Array.isArray(r.data) ? r.data : [] };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      proposerSafqa: function (v) {
        v = v || {};
        return client.rpc("zawia_safqa_proposer", { p_vendeur: String(v.vendeur || ""), p_produit: v.produit == null ? null : String(v.produit), p_produit_nom: String(v.produitNom || ""), p_prix: Number(v.prix), p_mot: String(v.mot || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      agirSafqa: function (id, action, mot) {
        return client.rpc("zawia_safqa_agir", { p_id: String(id || ""), p_action: String(action || ""), p_mot: String(mot || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v7.1 — LE FIL D'UNE AFFAIRE (kalam.js, zawia-safqa-kalam.sql).
      // ⚠️ LIRE MARQUE LU côté base : n'appeler kalamLire que quand le joueur
      //    OUVRE vraiment le fil — jamais pour rafraîchir un compteur en fond,
      //    sinon le témoin de non-lu s'éteint sans que personne ait lu.
      kalamLire: function (safqa) {
        return client.rpc("zawia_safqa_kalam", { p_safqa: String(safqa || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      kalamDire: function (safqa, texte) {
        return client.rpc("zawia_safqa_dire", { p_safqa: String(safqa || ""), p_texte: String(texte || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v8.5 — LES RASA'IL (rasail.js, zawia-rasail.sql) : écrire à un membre, en privé.
      // La base tient les trois freins (deux sans réponse, dix neuves par jour, le blocage).
      // ⚠️ LIRE MARQUE LU côté base : n'appeler lireFil que quand le joueur OUVRE le fil.
      //    La relecture de fond passe par nonLus(), qui ne marque rien.
      fils: function () {
        return client.rpc("zawia_fils").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      lireFil: function (autre, avant) {
        return client.rpc("zawia_fil", { p_autre: String(autre || ""), p_avant: avant == null ? null : Number(avant) }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      ecrire: function (autre, texte) {
        return client.rpc("zawia_ecrire", { p_autre: String(autre || ""), p_texte: String(texte || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      // null quand la base ne répond pas : la pastille garde alors ce qu'elle disait.
      nonLus: function () {
        return client.rpc("zawia_non_lus").then(function (r) {
          if (r.error) return null;
          var n = Number(r.data);
          return isFinite(n) && n >= 0 ? n : null;
        }).catch(function () { return null; });
      },
      bloquer: function (autre, oui) {
        return client.rpc("zawia_bloquer", { p_autre: String(autre || ""), p_oui: !!oui }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      signalerFil: function (autre, mot) {
        return client.rpc("zawia_signaler_fil", { p_autre: String(autre || ""), p_mot: String(mot || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v8.6 — LA BITAQA (bitaqa.js, zawia-bitaqa.sql) : la carte d'un membre, et l'annuaire.
      // La base tient la porte (joueurs admis seulement, carte fermée par défaut).
      maCarte: function () {
        return client.rpc("zawia_ma_carte").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      poserCarte: function (v) {
        v = v || {};
        return client.rpc("zawia_poser_carte", {
          p_visible: v.visible === true, p_ville: String(v.ville || ""), p_metier: String(v.metier || ""),
          p_cherche: Array.isArray(v.cherche) ? v.cherche : [], p_cherche_mot: String(v.chercheMot || ""),
          p_offre: Array.isArray(v.offre) ? v.offre : [], p_offre_mot: String(v.offreMot || ""),
          p_langues: Array.isArray(v.langues) ? v.langues : [], p_liens: Array.isArray(v.liens) ? v.liens : []
        }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      carte: function (id) {
        return client.rpc("zawia_carte", { p_joueur: String(id || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      annuaire: function (f, page) {
        return client.rpc("zawia_annuaire", { p_filtres: f || {}, p_page: Math.max(0, Math.floor(Number(page) || 0)) }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // v8.7 — PARRAINER (RSE) au Derb t-Tadamoun (zawia-derb.sql) : la proposition part au
      // BUREAU, jamais au porteur ; la base tient les règles (une ouverte par projet, cinq au plus).
      parrainerDerb: function (v) {
        v = v || {};
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v.projet || ""))) return Promise.resolve({ ok: false, erreur: "Ce projet est introuvable." });
        return client.rpc("zawia_derb_parrainer", {
          p_projet: String(v.projet), p_projet_nom: String(v.projetNom || ""), p_porteur: String(v.porteur || ""),
          p_entreprise: String(v.entreprise || ""), p_mot: String(v.mot || "")
        }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },
      mesParrainages: function () {
        return client.rpc("zawia_mes_parrainages").then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      // Le salut passe par une FONCTION : c'est la base qui décide si le salam
      // a été rendu dans la minute, et elle seule crédite les deux compteurs.
      saluer: function (autre) {
        return client.rpc("zawia_saluer", { autre: String(autre || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return r.data || { ok: false, erreur: "Réponse vide." };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu. Réessaie." }; });
      },

      lireJoueur: function () {
        return this.session().then(function (s) {
          if (!s) return null;
          return client.from(TABLE).select("*").eq("id", s.id).maybeSingle().then(function (r) {
            if (r.error) throw new Error(traduire(r.error));
            return depuisLigne(r.data);
          });
        });
      },

      ecrireJoueur: function (joueur) {
        return this.session().then(function (s) {
          if (!s) return { ok: false, erreur: "Pas de session. Entre d'abord." };
          return client.from(TABLE).upsert(versLigne(joueur, s.id), { onConflict: "id" }).select().single().then(function (r) {
            if (r.error) {
              if (String(r.error.code) === "23505") return { ok: false, erreur: "Ce pseudo est déjà pris dans la cour. Choisis-en un autre." };
              return { ok: false, erreur: traduire(r.error) };
            }
            return { ok: true, joueur: depuisLigne(r.data) };
          });
        });
      },

      surChangement: function (cb) {
        client.auth.onAuthStateChange(function (_evt, s) { cb(sessionDepuis(s)); });
      },

      // ---- v7.7 — LE MECHOUAR (zawia-mechouar.sql) -----------------------------
      // ⚠️ Rien n'est décidé ici : la base sert les affirmations SANS leur
      // vérité, elle chronomètre, elle juge, elle recompte l'Isnad sur ce
      // qu'elle a consigné, et c'est elle qui écrit les titres. Le navigateur
      // ne fait que demander et montrer.
      mechouarEtat: function () {
        return Promise.all([
          client.rpc("zawia_mechouar_portes"),
          client.rpc("zawia_mechouar_mur"),
          client.rpc("zawia_mechouar_mes_joutes"),
          client.rpc("zawia_mechouar_a_peser")
        ]).then(function (r) {
          var p = r[0], mur = r[1], j = r[2], ap = r[3];
          if (p.error) return { ok: false, erreur: traduire(p.error) };
          var d = p.data || {};
          return { ok: true, atelier: false,
            portes: { sna3a: !!d.sna3a, dhakira: !!d.dhakira, valeurs: !!d.valeurs },
            titre: d.titre || "mtmarren", banniere: d.banniere || null,
            victoires: Number(d.victoires) || 0, kunya: d.kunya || null,
            mur: (mur && !mur.error && mur.data) || [],
            joutes: (j && !j.error && j.data) || [],
            aPeser: (ap && !ap.error && ap.data) || [] };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarAdmettre: function (choix, raison) {
        return client.rpc("zawia_mechouar_admettre", { p_choix: choix, p_raison: String(raison == null ? "" : raison) })
          .then(function (r) { return r.error ? { ok: false, erreur: traduire(r.error) } : { ok: true }; })
          .catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarIsnad: function (joute, langue) {
        return client.rpc("zawia_mechouar_isnad", { p_joute: joute || null, p_langue: langue || "fr" }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          return { ok: true, faits: (r.data || []).map(function (f) {
            return { fait: f.o_fait, texte: f.o_texte, ville: f.o_ville, rang: f.o_rang };
          }) };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarAppeler: function (joute, fait, appel, langue) {
        return client.rpc("zawia_mechouar_isnad_repondre", { p_joute: joute || null, p_fait: String(fait || ""), p_appel: !!appel, p_langue: langue || "fr" })
          .then(function (r) {
            if (r.error) return { ok: false, erreur: traduire(r.error) };
            var d = r.data || {};
            return { ok: true, juste: !!d.juste, tard: !!d.tard, solide: !!d.solide,
                     correction: d.correction || null, source: d.source || null, ms: Number(d.ms) || 0 };
          }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarManche: function (joute, arme, v) {
        var o = v || {};
        return client.rpc("zawia_mechouar_manche", { p_joute: joute, p_arme: String(arme),
          p_score: (o.score === null || o.score === undefined) ? null : Number(o.score),
          p_choix: (o.choix === null || o.choix === undefined) ? null : Number(o.choix),
          p_raison: o.raison || null })
          .then(function (r) { return r.error ? { ok: false, erreur: traduire(r.error) } : { ok: true, score: (r.data || {}).score }; })
          .catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarDefier: function (pseudo) {
        return client.rpc("zawia_mechouar_defier", { p_pseudo: String(pseudo || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          var d = r.data || {};
          return { ok: true, joute: d.joute, graine: d.graine, trou: d.trou };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarPeser: function (joute) {
        return client.rpc("zawia_mechouar_peser", { p_joute: String(joute || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          var d = r.data || {};
          if (d.mienne) return { ok: false, mienne: true };
          return { ok: true, joute: d.joute, deja: !!d.deja, raisons: d.raisons || [] };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarVoter: function (joute, place) {
        return client.rpc("zawia_mechouar_voter", { p_joute: String(joute || ""), p_place: Number(place) })
          .then(function (r) { return r.error ? { ok: false, erreur: traduire(r.error) } : { ok: true }; })
          .catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
      mechouarRegler: function (joute) {
        return client.rpc("zawia_mechouar_regler", { p_joute: String(joute || "") }).then(function (r) {
          if (r.error) return { ok: false, erreur: traduire(r.error) };
          var d = r.data || {};
          return { ok: true, vainqueur: d.vainqueur || null, nulle: !!d.nulle, manches: d.manches || null };
        }).catch(function () { return { ok: false, erreur: "Le réseau n'a pas répondu." }; });
      },
    };
  }

  // ---- La fabrique -----------------------------------------------------------------------
  // Supabase si l'URL, la clé ET la librairie sont là ; local sinon. Le mode
  // local n'est pas une erreur : c'est l'atelier.
  function creer(config) {
    config = config || {};
    var lib = config.supabase || (typeof window !== "undefined" ? window.supabase : null);
    if (config.supabaseUrl && config.supabaseAnonKey && lib && typeof lib.createClient === "function") {
      try {
        return adaptateurSupabase(lib.createClient(config.supabaseUrl, config.supabaseAnonKey));
      } catch (e) { /* client impossible : atelier */ }
    }
    return adaptateurLocal(config.stockage || stockageParDefaut(), config.crypto || cryptoParDefaut());
  }

  return {
    creer: creer, validerIdentifiants: validerIdentifiants, traduire: traduire,
    depuisLigne: depuisLigne, versLigne: versLigne, memoire: memoire, MDP_MIN: MDP_MIN
  };
});
