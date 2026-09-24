// ZAW'IA — le jeu · LE RÉCIT (pur : ni DOM, ni réseau, ni canvas).
//
// Ce que la maison DIT, tenu à un seul endroit : le prologue de la Rihla
// (Al-Mawsoul et Nsyan), les neuf Mourchidine de la LP, les sept valeurs
// telles que la charte les nomme, et la hiérarchie des cinq motivations du
// jeu. Aucun calcul ici — des textes, que la page, les murs de la cour et les
// tests lisent à la même source.
//
// ⚠️ Le récit vise l'OUBLI, jamais un coupable. Nsyan n'est ni un peuple, ni
//    un pays, ni un système : c'est ce qui efface. Un test le garde — un récit
//    qui désigne un coupable devient amer et sort de la charte (ligne rouge 7).
// ⚠️ Le voile (ZAWIA-VOILE.md) s'applique : la maison ne se nomme pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.recit = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les deux figures ---------------------------------------------------------
  var NSYAN = {
    nom: "Nsyan", ar: "النسيان", sous: "L'oubli",
    detail: "Ce qui efface sans bruit : le nom d'une porte, le sens d'un mot, la main qui a posé la première pierre. Il n'a pas de visage — c'est le point."
  };
  var MAWSOUL = {
    nom: "Al-Mawsoul", ar: "الموصول", sous: "Le Relié",
    detail: "Celui dont la chaîne tient encore. Choisi par les neuf Mourchidine pour aller retrouver les pages perdues — pas le plus savant, pas le plus fort."
  };

  // ---- Les neuf Mourchidine, tels que la LP les nomme ------------------------------
  // « Neuf intelligences nées de neuf villes du Royaume. » L'ordre est celui
  // de la LP ; les pages perdues suivent un autre ordre, celui du voyage.
  var MOURCHIDINE = [
    { cle: "fes",        ville: "Fès",        ar: "فاس",          nom: "Le mou'allim",    role: "la transmission" },
    { cle: "marrakech",  ville: "Marrakech",  ar: "مراكش",        nom: "L'artisane",      role: "la fabrique" },
    { cle: "meknes",     ville: "Meknès",     ar: "مكناس",        nom: "L'architecte",    role: "la galerie" },
    { cle: "agadir",     ville: "Agadir",     ar: "أكادير",       nom: "La rebâtisseuse", role: "recommencer" },
    { cle: "rabat",      ville: "Rabat",      ar: "الرباط",       nom: "Le gardien",      role: "la confiance" },
    { cle: "casablanca", ville: "Casablanca", ar: "الدار البيضاء", nom: "La bâtisseuse",   role: "les ponts" },
    { cle: "dakhla",     ville: "Dakhla",     ar: "الداخلة",      nom: "Le vent",         role: "les mawasim" },
    { cle: "tanger",     ville: "Tanger",     ar: "طنجة",         nom: "Le passeur",      role: "faire sortir" },
    { cle: "oujda",      ville: "Oujda",      ar: "وجدة",         nom: "La voix",         role: "personne n'est trop loin" }
  ];

  function mourchid(cle) {
    for (var i = 0; i < MOURCHIDINE.length; i++) if (MOURCHIDINE[i].cle === cle) return MOURCHIDINE[i];
    return null;
  }

  // ---- v2.4 — les portraits peints (14/09/2026) -------------------------------------
  // Le monde reste en pixel ; ce qui PARLE porte un visage peint dans le style
  // de l'intro et de la série. Un portrait par Mourchid, rangé sous
  // assets/img/zawia/jeu/mourchid-<cle>.jpg. Cette fonction dit QUI a un visage :
  // une clé de ville, ou un nom de boîte qui commence par « Le mou'allim »
  // (le tutoriel parle au nom de Fès). Tout le reste — le Bab, la Khizana, le
  // lawh, un rihal — est un lieu, et un lieu n'a pas de visage : null.
  function portrait(cleOuNom) {
    var s = String(cleOuNom || "");
    if (mourchid(s)) return s;
    if (/^Le mou'allim/i.test(s)) return "fes";
    return null;
  }

  // ---- Les sept valeurs, dans l'ordre de la charte ---------------------------------
  // Écrites sur les murs du Sahn (tuiles « V » de monde.js) : le rappel
  // constant de la charte, à hauteur d'yeux, une valeur par khatt. Chaque
  // valeur porte ce qu'elle fait refuser — sinon c'est une décoration murale.
  var VALEURS = [
    { cle: "ferracha", nom: "Ferracha",                    ar: "فرّاشة",
      phrase: "Étale. Ne raconte pas.",
      refuse: "Les slides sans démo. L'« expert IA » qui n'a jamais livré. Le projet gardé au tiroir en attendant d'être parfait — il ne le sera jamais." },
    { cle: "twiza",    nom: "Twiza",                       ar: "تويزة",
      phrase: "Personne ne construit seul.",
      refuse: "Le membre qui prend et ne rend jamais. Ici on n'est pas abonné, on est engagé." },
    { cle: "silsila",  nom: "Silsila",                     ar: "سلسلة",
      phrase: "Tu apprends, donc tu enseignes.",
      refuse: "Le « je t'expliquerai en privé ». Le savoir gardé au chaud pour rester indispensable." },
    { cle: "m39ol",    nom: "M39ol",                       ar: "معقول",
      phrase: "Le sérieux se compte. Il ne se déclare pas.",
      refuse: "Les promesses de couloir. Les absences sans un mot. L'« inchallah » logistique qui veut dire non." },
    { cle: "nia",      nom: "Nia w Amana",                 ar: "نية وأمانة",
      phrase: "On dit vrai. Surtout quand ça coûte.",
      refuse: "Les métriques gonflées. Le « on est en discussion avec » qui veut dire « j'ai envoyé un mail »." },
    { cle: "hchouma",  nom: "Bla hchouma, bla kbar rass",  ar: "بلا حشومة، بلا كبر راس",
      phrase: "Ambition sans complexe. Réussite sans grosse tête.",
      refuse: "Le « au Maroc on peut pas ». Le M3ellem qui parle de haut à un Talib." },
    { cle: "darija",   nom: "B darija",                    ar: "بالدارجة",
      phrase: "Si tu ne peux pas l'expliquer à ta mère, tu ne l'as pas compris.",
      refuse: "Le jargon qui exclut. L'accent posé. Le charabia." }
  ];

  function valeur(index) {
    var n = VALEURS.length;
    var i = ((Number(index) || 0) % n + n) % n;
    return VALEURS[i];
  }

  // Le khatt au mur : deux pages, la phrase puis le refus.
  function khatt(index) {
    var v = valeur(index);
    return {
      nom: v.nom + " · " + v.ar,
      pages: [
        v.phrase,
        "Donc on refuse : " + v.refuse
      ]
    };
  }

  // ---- La hiérarchie des cinq motivations -----------------------------------------
  // Pourquoi le jeu existe, dans l'ordre — la charte a une hiérarchie pour ses
  // valeurs, le jeu en a une pour ses raisons d'être. La première tranche ; les
  // trois suivantes se renforcent ; la dernière est une CONSÉQUENCE, jamais un
  // but : le jour où l'annonce passe devant la transmission, le jeu se vide.
  var MOTIVATIONS = [
    { rang: 1, cle: "transmission", nom: "Transmettre",
      quoi: "La culture du Maroc, apprise en parcourant ses lieux, et la charte, relue sur les murs. Ce qui ne se joue pas s'oublie.",
      but: true },
    { rang: 2, cle: "reputation", nom: "Briller par le sérieux",
      quoi: "Le travail communautaire fait la réputation : ton nom, et si tu veux, ton entreprise ou ton profil. Le M39ol est public, il se donne, il ne se réclame pas.",
      but: true },
    { rang: 3, cle: "competence", nom: "Montrer ce qu'on sait faire",
      quoi: "La Sna3a dit à tous qui a la main : dire juste, voir juste, vérifier juste. Un compteur public, jamais un rang. Et elle ouvre le Kounnach : ce que la maison sait faire, écrit pour être refait.",
      but: true },
    { rang: 4, cle: "reseau", nom: "Se rencontrer",
      quoi: "Le réseau se fait en jouant : un salam dans le Sahn, une pierre portée, un T3arefna à l'Atay.",
      but: true },
    { rang: 5, cle: "annonce", nom: "Annoncer les formations",
      quoi: "Celles de la maison et de ses partenaires — au Souk, dehors des murs, jamais au-dessus d'une tête ni dans une halqa. Une conséquence de ce qui précède, jamais un but.",
      but: false }
  ];

  // ---- Le prologue : la Rihla ----------------------------------------------------
  // Sept pages, lues une fois à la première entrée dans la cour, relisibles au
  // menu. {pseudo} est remplacé par le nom du personnage. Le monde parallèle
  // est un Maroc qui n'a jamais perdu le fil — pas un Maroc sans quelqu'un.
  var PROLOGUE_PAGES = [
    "Il y a une chose qui efface sans bruit. Elle ne casse rien, ne vole rien. Elle fait juste oublier : le nom d'une porte, le sens d'un mot, la main qui a posé la première pierre.\nDans la maison, on l'appelle Nsyan.",
    "Nsyan a arraché des pages à la Rihla — le récit de voyage qu'Ibn Battuta a dicté à Fès en 1355. Sans ces pages, on ne sait plus d'où l'on vient. Et qui ne sait plus d'où il vient achète n'importe quelle carte.",
    "Les neuf Mourchidine ont ouvert un passage. Il mène dans un Maroc qui n'a jamais perdu le fil : les mêmes villes, les mêmes savoirs, les mêmes mains — mais où la chaîne, la Silsila, ne s'est jamais rompue.",
    "Pour y aller, ils ont choisi quelqu'un. Pas le plus savant, pas le plus fort : celui dont la chaîne tient encore. On l'appelle Al-Mawsoul — le Relié.\nAujourd'hui, {pseudo}, c'est toi.",
    "Tu emportes un seul outil du présent : un compagnon qui répond quand on lui parle juste, qui dessine ce qu'on lui décrit — et qui se trompe avec assurance quand on ne vérifie pas. L'IA. Elle ne remplace pas ta main ; elle l'accélère.",
    "Ta mission : retrouver les pages perdues, une ville après l'autre, et faire le bien plus vite qu'il ne s'est fait. Chaque page revenue réapparaît dans le présent — et Nsyan recule d'un pas.",
    "Une dernière chose, la première règle de la maison : étale, ne raconte pas. Ce que tu apprends ici, tu le poseras sur ton tapis.\nLe sandouq des pages t'attend à la Khizana, à l'ouest. Yallah — la porte est ouverte."
  ];

  function prologue(ctx) {
    var pseudo = ctx && ctx.pseudo ? String(ctx.pseudo) : "Talib";
    return {
      nom: "La Rihla",
      pages: PROLOGUE_PAGES.map(function (p) { return p.replace(/\{pseudo\}/g, pseudo); }),
      prologue: true
    };
  }

  // Quand la dernière page est revenue. Nsyan ne meurt pas : il attend.
  var EPILOGUE = {
    nom: "La Rihla",
    pages: [
      "Neuf pages, neuf villes. La Rihla est entière — pour cette saison.",
      "Nsyan ne meurt pas : il attend qu'on cesse de raconter. Alors raconte. Étale. Transmets. C'est comme ça qu'une page reste."
    ]
  };

  // Le prologue a-t-il été lu ? (joueur.recit.prologue = date ISO)
  function prologueVu(joueur) {
    return !!(joueur && joueur.recit && typeof joueur.recit === "object" && joueur.recit.prologue);
  }

  // v5.2 — l'état du mode Rihla, dans recit.rihla :
  //   a : arrivé une fois (les dix mouzounat de départ ne se donnent qu'une fois)
  //   pos : { x, y, dir } dans la région ; n : le Nfs ; nj : le jour du dernier plein
  //   mz : les mouzounat ; q : quartiers reconnus ; p : plats goûtés ; e : étoiles trouvées
  //   m : { métier: jour } ; qu : { quête: étape } ; o : { porte: true | jour }
  //   rf : le Rafiq ; t : ses techniques ; ax : l'axe Naql ↔ 3aql ; ob : les ombres dissipées (v5.3)
  // Tout le reste tombe. rihla.js le lit par Rc.normaliserRihla — un seul normaliseur.
  var CLE_RIHLA = /^[a-z0-9]{2,16}$/, JOUR_RIHLA = /^\d{4}-\d{2}-\d{2}$/;
  function entierBorne(v, min, max) { var n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min; }
  function normaliserRihla(x) {
    var e = {};
    if (!x || typeof x !== "object") return e;
    if (x.a === true) e.a = true;
    if (x.pos && typeof x.pos === "object" && Number.isFinite(Number(x.pos.x)) && Number.isFinite(Number(x.pos.y))) {
      e.pos = { x: Math.round(Number(x.pos.x)), y: Math.round(Number(x.pos.y)), dir: ["haut", "bas", "gauche", "droite"].indexOf(x.pos.dir) >= 0 ? x.pos.dir : "bas" };
    }
    if (x.n !== undefined) e.n = entierBorne(x.n, 0, 200);
    if (typeof x.nj === "string" && JOUR_RIHLA.test(x.nj)) e.nj = x.nj;
    if (x.mz !== undefined) e.mz = entierBorne(x.mz, 0, 99999);
    ["q", "p"].forEach(function (k) {
      if (Array.isArray(x[k])) { var l = x[k].filter(function (v, i, t) { return typeof v === "string" && CLE_RIHLA.test(v) && t.indexOf(v) === i; }).slice(0, 60); if (l.length) e[k] = l; }
    });
    if (Array.isArray(x.e)) { var et = x.e.filter(function (v, i, t) { return Number.isInteger(v) && v >= 0 && v < 200 && t.indexOf(v) === i; }); if (et.length) e.e = et; }
    if (x.m && typeof x.m === "object") { var m = {}; Object.keys(x.m).forEach(function (k) { if (CLE_RIHLA.test(k) && typeof x.m[k] === "string" && JOUR_RIHLA.test(x.m[k])) m[k] = x.m[k]; }); if (Object.keys(m).length) e.m = m; }
    if (x.qu && typeof x.qu === "object") { var qu = {}; Object.keys(x.qu).forEach(function (k) { if (CLE_RIHLA.test(k)) { var v = entierBorne(x.qu[k], 0, 9); if (v > 0) qu[k] = v; } }); if (Object.keys(qu).length) e.qu = qu; }
    // v5.3 — le Rafiq (rafiq.js) : rf son starter, t ses techniques, ax l'axe Naql ↔ 3aql ; ob les ombres dissipées (combat.js)
    if (typeof x.rf === "string" && CLE_RIHLA.test(x.rf)) e.rf = x.rf;
    if (Array.isArray(x.t)) { var tq = x.t.filter(function (v, i, l) { return typeof v === "string" && CLE_RIHLA.test(v) && l.indexOf(v) === i; }).slice(0, 12); if (tq.length) e.t = tq; }
    if (x.ax !== undefined) { var ax = entierBorne(x.ax, -30, 30); if (ax !== 0) e.ax = ax; }
    // v5.4 — les ijazas reçues (une par ville) et la branche du Rafiq fixée en évoluant
    if (Array.isArray(x.ij)) { var ij = x.ij.filter(function (v, i, l) { return typeof v === "string" && CLE_RIHLA.test(v) && l.indexOf(v) === i; }).slice(0, 12); if (ij.length) e.ij = ij; }
    if (["naql", "3aql", "mawsoul"].indexOf(x.br) >= 0) e.br = x.br;
    // v5.6 — les épreuves déjà vues, de combat en combat (combat.js, retenir) : « voie:index », bornées
    if (Array.isArray(x.ev)) { var ev = x.ev.filter(function (v, i, l) { return typeof v === "string" && /^(prompt|image|savoir):\d{1,3}$/.test(v) && l.indexOf(v) === i; }).slice(-120); if (ev.length) e.ev = ev; }
    if (Array.isArray(x.ob)) { var ob = x.ob.filter(function (v, i, l) { return typeof v === "string" && /^[a-z0-9-]{2,32}$/.test(v) && l.indexOf(v) === i; }).slice(0, 60); if (ob.length) e.ob = ob; }
    if (x.o && typeof x.o === "object") { var o = {}; Object.keys(x.o).forEach(function (k) { if (CLE_RIHLA.test(k) && (x.o[k] === true || (typeof x.o[k] === "string" && JOUR_RIHLA.test(x.o[k])))) o[k] = x.o[k]; }); if (Object.keys(o).length) e.o = o; }
    return e;
  }

  function normaliserRecit(r) {
    var propre = {};
    if (r && typeof r === "object") {
      if (typeof r.prologue === "string" && r.prologue) propre.prologue = r.prologue;
      if (typeof r.epilogue === "string" && r.epilogue) propre.epilogue = r.epilogue;
      // v2.1 — l'état du tutoriel (la première Arb3ine guidée, tutoriel.js) :
      // { etape: n } en cours, { fini: iso } après. Tout le reste tombe.
      if (r.tutoriel && typeof r.tutoriel === "object") {
        if (typeof r.tutoriel.fini === "string" && r.tutoriel.fini) propre.tutoriel = { fini: r.tutoriel.fini };
        else if (Number.isInteger(Number(r.tutoriel.etape)) && Number(r.tutoriel.etape) >= 0) propre.tutoriel = { etape: Number(r.tutoriel.etape) };
      }
      // ⚠️⚠️ v7.3 — Oumm IA : { faites: ["dire", …], vue: bool }. CE NORMALISEUR
      // EST UNE LISTE BLANCHE : une clé qu'on oublie ici disparaît à la
      // première sauvegarde, en silence, et le joueur refait ses épreuves à
      // chaque session. La forme est celle d'`oumm.js` (Om.normaliserEtat) ;
      // elle est recopiée ici plutôt qu'importée — recit.js ne dépend d'aucun
      // autre module, et un test compare les deux.
      if (r.oumm && typeof r.oumm === "object") {
        var faites = Array.isArray(r.oumm.faites)
          ? r.oumm.faites.filter(function (c, i, t) { return typeof c === "string" && c && t.indexOf(c) === i; })
          : [];
        if (faites.length || r.oumm.vue === true) propre.oumm = { faites: faites, vue: !!r.oumm.vue };
      }
      // v7.4 — le Voilé (voile.js) : { vu: "AAAA-MM-JJ" | null, signes: n } — le
      // jour où il est descendu devant ton tapis, et le nombre de fois où on l'a
      // aperçu sur le minaret. La même LISTE BLANCHE : une clé oubliée ici
      // disparaît à la première sauvegarde, et il redescendrait à chaque session.
      // v7.6 — le Sirr (sirr.js) : { vu: n } — combien de régions du huitième
      // cadre le joueur a déjà vues s'allumer. La MÊME liste blanche : sans
      // cette clé, « la toile est entière » se rejouerait à chaque session.
      if (r.sirr && typeof r.sirr === "object") {
        var svu = Math.max(0, Math.min(7, Math.floor(Number(r.sirr.vu) || 0)));
        if (svu > 0) propre.sirr = { vu: svu };
      }
      if (r.voile && typeof r.voile === "object") {
        var vvu = typeof r.voile.vu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.voile.vu) ? r.voile.vu : null;
        var vsignes = Math.max(0, Math.min(999, Math.floor(Number(r.voile.signes) || 0)));
        if (vvu || vsignes > 0) propre.voile = { vu: vvu, signes: vsignes };
      }
      // v7.7 — le Mechouar : { vu: "<iso>" } — le dellal a déjà crié la place.
      // LA MÊME LISTE BLANCHE : sans cette clé, il la crierait à chaque session.
      if (r.mechouar && typeof r.mechouar === "object") {
        if (typeof r.mechouar.vu === "string" && r.mechouar.vu) propre.mechouar = { vu: String(r.mechouar.vu).slice(0, 40) };
      }
      // v3.4 — les cartes dorées (une page trouvée sans indice) : { "<cle>": true }.
      // Une clé sans valeur vraie tombe ; le sandouq ne redore pas une carte.
      if (r.dorees && typeof r.dorees === "object") {
        var d = {};
        Object.keys(r.dorees).forEach(function (k) { if (r.dorees[k] === true) d[k] = true; });
        if (Object.keys(d).length) propre.dorees = d;
      }
      // v3.6 — le Wird (wird.js) : les drapeaux que jeu.js pose — khatt lus,
      // gens de la cour à qui l'on a parlé, salles ouvertes, jours tenus par
      // déclaration, le daftar. Même forme que Wd.lireEtat ; tout le reste tombe.
      if (r.wird && typeof r.wird === "object") {
        var w = {}, x = r.wird;
        if (Array.isArray(x.khatt)) { var kh = x.khatt.filter(function (k) { return Number.isInteger(k) && k >= 0 && k < 40; }); if (kh.length) w.khatt = kh; }
        if (Array.isArray(x.pnj)) { var pj = x.pnj.filter(function (k) { return typeof k === "string" && /^[a-z0-9-]{1,32}$/.test(k); }); if (pj.length) w.pnj = pj; }
        ["moujam", "riwaq", "cartes", "souk", "presente"].forEach(function (k) { if (x[k] === true) w[k] = true; });
        if (x.tenus && typeof x.tenus === "object") {
          var tn = {};
          Object.keys(x.tenus).forEach(function (k) { if (/^([1-9]|[1-3][0-9]|40)$/.test(k) && typeof x.tenus[k] === "string" && x.tenus[k]) tn[k] = x.tenus[k]; });
          if (Object.keys(tn).length) w.tenus = tn;
        }
        if (x.daftar && typeof x.daftar === "object") {
          var df = {};
          Object.keys(x.daftar).forEach(function (k) { if (/^([1-9]|[1-3][0-9]|40)$/.test(k) && typeof x.daftar[k] === "string" && x.daftar[k].trim()) df[k] = x.daftar[k].slice(0, 600); });
          if (Object.keys(df).length) w.daftar = df;
        }
        if (Object.keys(w).length) propre.wird = w;
      }
      // v6.0 — le Kounnach (kounnach.js) : les wasfat lues, pour dire laquelle
      // attend — deux cents au plus, des ids sûrs, jamais autre chose que `true`.
      // v7.0 — la Tariqa : le panneau unique des anciens a été vu (tariqa.js, marquerVu)
      if (r.tariqa && typeof r.tariqa === "object" && typeof r.tariqa.vu === "string" && /^\d{4}-\d{2}-\d{2}/.test(r.tariqa.vu)) propre.tariqa = { vu: r.tariqa.vu.slice(0, 24) };
      if (r.kounnach && typeof r.kounnach === "object" && r.kounnach.lues && typeof r.kounnach.lues === "object") {
        var kl = {};
        Object.keys(r.kounnach.lues).forEach(function (k) {
          if (r.kounnach.lues[k] === true && /^[a-z0-9-]{1,40}$/.test(k) && Object.keys(kl).length < 200) kl[k] = true;
        });
        if (Object.keys(kl).length) propre.kounnach = { lues: kl };
      }
      // v4.7 — Lkelma d'lyoum (kelma.js) et l'atay (atay.js) : chacun garde sa
      // propre forme, et seulement elle. Même forme que Km.normaliserEtat et
      // At.normaliserEtat — un test compare.
      if (r.kelma && typeof r.kelma === "object") {
        var k = r.kelma, kp = {};
        if (k.g && typeof k.g === "object") {
          var g = {};
          Object.keys(k.g).forEach(function (cle) {
            if (/^(fr|ar)-\d{1,5}$/.test(cle) && Array.isArray(k.g[cle])) {
              var es = k.g[cle].filter(function (s) { return typeof s === "string" && s.length > 0 && s.length <= 12; }).slice(0, 6);
              if (es.length) g[cle] = es;
            }
          });
          if (Object.keys(g).length) kp.g = g;
        }
        if (Array.isArray(k.j)) { var jj = k.j.filter(function (n) { return Number.isInteger(n) && n >= 1 && n < 100000; }).slice(-400); if (jj.length) kp.j = jj; }
        if (Array.isArray(k.d) && k.d.length === 6) kp.d = k.d.map(function (v) { return Math.max(0, Math.floor(Number(v) || 0)); });
        if (Number(k.p) > 0) kp.p = Math.floor(Number(k.p));
        if (Object.keys(kp).length) propre.kelma = kp;
      }
      if (r.atay && typeof r.atay === "object") {
        var a = r.atay, ap = {};
        ["s", "v"].forEach(function (c) { if (Number(a[c]) > 0) ap[c] = Math.floor(Number(a[c])); });
        if (Number(a.m) > 0) ap.m = Math.min(100, Math.floor(Number(a.m)));
        if (typeof a.dj === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.dj)) { ap.dj = a.dj; ap.mj = Math.max(0, Math.min(100, Math.floor(Number(a.mj) || 0))); }
        if (Object.keys(ap).length) propre.atay = ap;
      }
      // v5.1 — l'édition des jeux que Ba Driss a déjà annoncée (jeux.js) :
      // { vu: "AAAA-MM-JJ" }. Même forme que Jx.normaliserEtat — un test compare.
      if (r.jeux && typeof r.jeux === "object" && typeof r.jeux.vu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.jeux.vu)) propre.jeux = { vu: r.jeux.vu };
      // v5.7 — la Rahba (rahba.js) : le dellal a hélé une fois — { vu: ISO }.
      if (r.rahba && typeof r.rahba === "object" && typeof r.rahba.vu === "string" && r.rahba.vu) propre.rahba = { vu: r.rahba.vu.slice(0, 40) };
      // v5.2 — la Rihla (rihla.js, fes.js) : le seul normaliseur de son état vit ICI.
      if (r.rihla && typeof r.rihla === "object") { var rh = normaliserRihla(r.rihla); if (Object.keys(rh).length) propre.rihla = rh; }
    }
    return propre;
  }

  return {
    NSYAN: NSYAN, MAWSOUL: MAWSOUL,
    MOURCHIDINE: MOURCHIDINE, mourchid: mourchid, portrait: portrait,
    VALEURS: VALEURS, valeur: valeur, khatt: khatt,
    MOTIVATIONS: MOTIVATIONS,
    PROLOGUE_PAGES: PROLOGUE_PAGES, prologue: prologue, EPILOGUE: EPILOGUE,
    prologueVu: prologueVu, normaliserRecit: normaliserRecit, normaliserRihla: normaliserRihla
  };
});
