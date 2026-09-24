// ZAW'IA — le jeu · LKHESSA TA3MER : la fontaine se remplit (pur : ni DOM, ni horloge).
//
// v4.7 — un objectif COLLECTIF par semaine. Chaque geste de chacun verse une
// goutte dans la fontaine du Sahn : un mot cherché au lawh, un atay servi, un
// Wird tenu, une page retrouvée, un Ta7addi réussi, une question au rihal, un
// salut, un produit posé au Souk, un trou de golf du prompt (v4.8). Pleine avant dimanche soir, la semaine
// d'après les lanternes de la cour restent allumées — pour tout le monde.
// La Twiza, mot pour mot : le travail de chacun pour la maison de tous.
//
// Cinq règles, tenues par les tests :
//  1. la BASE compte (zawia-khessa.sql) : une goutte par joueur, par geste et
//     par jour — la clé primaire le garantit, pas l'écran. Ce module ne fait
//     que lire et dire ;
//  2. les gestes et l'objectif sont écrits DEUX fois, ici et dans le SQL, et
//     un test compare les deux fichiers ;
//  3. l'objectif se fige au premier geste de la semaine, d'après le nombre de
//     joueurs actifs : il ne bouge pas sous les pieds de ceux qui versent ;
//  4. AUCUN POINT : la fontaine est à tous, elle ne donne rien à personne ;
//  5. la semaine est celle de Casablanca : du lundi 0 h au dimanche 24 h.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.khessa = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Les gestes qui versent une goutte — les mêmes que dans zawia-khessa.sql.
  // `maison` : un geste que seuls les gens de la maison peuvent faire (l'établi,
  // le rihal) ; on ne le montre pas à un Talib libre.
  var GESTES = [
    { cle: "kelma", texte: "Chercher la kelma du jour, au lawh de la Madrasa" },
    { cle: "atay", texte: "Servir un atay sous les orangers du riad" },
    { cle: "wird", texte: "Tenir le Wird du jour" },
    { cle: "page", texte: "Retrouver une page au sandouq de la Khizana" },
    { cle: "tahaddi", texte: "Réussir un Ta7addi à l'établi", maison: true },
    { cle: "imtihan", texte: "Répondre à une question au rihal", maison: true },
    { cle: "salut", texte: "Saluer quelqu'un dans la cour" },
    { cle: "souk", texte: "Poser un produit sur ta ferracha, au Souk" },
    { cle: "qlil", texte: "Jouer un trou de Qlil w mfid, à l'établi du prompt" },   // v4.8
    { cle: "ombre", texte: "Dissiper une ombre de Nsyan, dans Fès" }   // v5.6 — la quête remplit la fontaine de tous
  ];
  var CLES = GESTES.map(function (g) { return g.cle; });
  var OBJECTIF_MIN = 40;        // jamais moins, même à trois joueurs
  var PAR_ACTIF = 5;            // gouttes par joueur actif sur les 7 derniers jours
  var OBJECTIF_ATELIER = 12;    // en atelier, la fontaine n'est qu'à soi
  var LAMPES = 12;              // les douze lampes de la margelle
  var FUSEAU = "Africa/Casablanca";

  function jourUTC(iso) { var p = String(iso).split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function jourCasa(maintenant) {
    var d = maintenant == null ? new Date() : new Date(maintenant);
    try {
      var o = {};
      new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
      if (o.year && o.month && o.day) return o.year + "-" + o.month + "-" + o.day;
    } catch (e) { /* repli : UTC+1 */ }
    return new Date(d.getTime() + 3600 * 1000).toISOString().slice(0, 10);
  }
  // Le lundi de la semaine d'un jour (AAAA-MM-JJ).
  function semaineDe(jour) {
    var ms = jourUTC(jour), dow = new Date(ms).getUTCDay();   // 0 = dimanche
    return iso(ms - ((dow + 6) % 7) * 86400000);
  }
  // Les jours qu'il reste, aujourd'hui compris (lundi : 7, dimanche : 1).
  function joursRestants(jour) {
    var ecoules = Math.round((jourUTC(jour) - jourUTC(semaineDe(jour))) / 86400000);
    return 7 - ecoules;
  }
  function objectifPour(actifs) { return Math.max(OBJECTIF_MIN, PAR_ACTIF * Math.max(0, Math.floor(Number(actifs) || 0))); }

  // Ce que la base rend (zawia_khessa_etat), rendu sûr pour l'écran.
  function normaliser(r) {
    if (!r || r.ok === false) return { ok: false, erreur: (r && r.erreur) || "La fontaine ne répond pas." };
    var objectif = Math.max(1, Math.floor(Number(r.objectif) || OBJECTIF_MIN));
    var niveau = Math.max(0, Math.floor(Number(r.niveau) || 0));
    var miens = Array.isArray(r.miens) ? r.miens.filter(function (c) { return CLES.indexOf(c) >= 0; }) : [];
    var jour = typeof r.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.jour) ? r.jour : jourCasa();
    return {
      ok: true, jour: jour, semaine: typeof r.semaine === "string" ? r.semaine : semaineDe(jour),
      niveau: niveau, objectif: objectif, pleine: niveau >= objectif || !!r.pleine_le,
      passeePleine: !!(r.passee_pleine || r.passeePleine), miens: miens,
      verseurs: Math.max(0, Math.floor(Number(r.verseurs) || 0)), atelier: !!r.atelier,
      restants: joursRestants(jour)
    };
  }
  // Combien des douze lampes de la margelle sont allumées.
  function lampes(etat) {
    if (!etat || !etat.ok) return 0;
    return Math.min(LAMPES, Math.floor(LAMPES * Math.min(1, etat.niveau / etat.objectif)));
  }
  function gestesPour(maison) { return GESTES.filter(function (g) { return maison || !g.maison; }); }
  function estGeste(cle) { return CLES.indexOf(cle) >= 0; }

  // ---- L'atelier : la fontaine dans le navigateur -----------------------------------
  // Une fontaine à soi seul, pour voir la salle et le rendu : { g: [{ j, c }], p: { "<lundi>": true } }.
  function normaliserLocal(x) {
    var e = { g: [], p: {} };
    if (!x || typeof x !== "object") return e;
    if (Array.isArray(x.g)) e.g = x.g.filter(function (d) { return d && /^\d{4}-\d{2}-\d{2}$/.test(d.j) && estGeste(d.c); });
    if (x.p && typeof x.p === "object") Object.keys(x.p).forEach(function (k) { if (x.p[k] === true && /^\d{4}-\d{2}-\d{2}$/.test(k)) e.p[k] = true; });
    return e;
  }
  function etatLocal(x, jour) {
    var e = normaliserLocal(x), sem = semaineDe(jour), avant = iso(jourUTC(sem) - 7 * 86400000);
    var niveau = e.g.filter(function (d) { return semaineDe(d.j) === sem; }).length;
    return normaliser({
      ok: true, atelier: true, jour: jour, semaine: sem, niveau: niveau, objectif: OBJECTIF_ATELIER,
      pleine_le: e.p[sem] ? jour : null, passee_pleine: !!e.p[avant],
      miens: e.g.filter(function (d) { return d.j === jour; }).map(function (d) { return d.c; }),
      verseurs: niveau ? 1 : 0
    });
  }
  function verserLocal(x, geste, jour) {
    var e = normaliserLocal(x);
    if (!estGeste(geste)) return e;
    var deja = e.g.some(function (d) { return d.j === jour && d.c === geste; });
    if (!deja) e.g.push({ j: jour, c: geste });
    // on ne garde que deux semaines : celle-ci et la précédente
    var limite = iso(jourUTC(semaineDe(jour)) - 7 * 86400000);
    e.g = e.g.filter(function (d) { return d.j >= limite; });
    var sem = semaineDe(jour);
    if (e.g.filter(function (d) { return semaineDe(d.j) === sem; }).length >= OBJECTIF_ATELIER) e.p[sem] = true;
    Object.keys(e.p).forEach(function (k) { if (k < limite) delete e.p[k]; });
    return e;
  }

  return {
    GESTES: GESTES, CLES: CLES, OBJECTIF_MIN: OBJECTIF_MIN, PAR_ACTIF: PAR_ACTIF, OBJECTIF_ATELIER: OBJECTIF_ATELIER,
    LAMPES: LAMPES, FUSEAU: FUSEAU,
    jourCasa: jourCasa, semaineDe: semaineDe, joursRestants: joursRestants, objectifPour: objectifPour,
    normaliser: normaliser, lampes: lampes, gestesPour: gestesPour, estGeste: estGeste,
    normaliserLocal: normaliserLocal, etatLocal: etatLocal, verserLocal: verserLocal
  };
});
