// ZAW'IA — le jeu · LA RIHLA : les règles du mode quête (pur : ni DOM, ni horloge).
//
// v5.2 — étape A de la Rihla (docs/superpowers/specs/2026-09-19-jeu-rihla-open-world-fes.md).
// Ce module vaut pour TOUTES les régions (fes.js aujourd'hui, Meknès demain) :
// il reçoit la région en paramètre et ne connaît aucune ville.
//
//   le Nfs (le souffle) : marcher en coûte un peu, travailler beaucoup ; manger
//     le rend. Plein chaque matin (heure de Casablanca), plus un peu avec l'Atay
//     du jour. Marcher ne descend jamais sous le PLANCHER : on ne tombe pas à
//     force de flâner, on tombe à force de travailler le ventre vide ;
//   la mouzouna : gagnée en jouant (quartiers reconnus, étoiles, métiers,
//     quêtes), dépensée pour manger ou passer une porte. Toujours un autre chemin
//     qu'un paiement (fes.js, PORTES) ;
//
// Ce que ce module ne fait JAMAIS (la charte) : toucher au M39ol, à la Sna3a, à
// la Dhakira ; vendre un indice, une carte, un rang. Un test le garde.
// L'état vit dans recit.rihla ; son SEUL normaliseur est Rc.normaliserRihla.
(function (root, factory) {
  "use strict";
  var Rc = (typeof module === "object" && module.exports) ? require("./recit.js") : (root.ZWJ && root.ZWJ.recit);
  var api = factory(Rc);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.rihla = api;
})(typeof window !== "undefined" ? window : globalThis, function (Rc) {
  "use strict";
  if (!Rc || typeof Rc.normaliserRihla !== "function") throw new Error("rihla.js : charger recit.js avant.");

  var NFS_BASE = 100;      // le souffle d'un matin
  var PLANCHER = 10;       // marcher ne descend jamais en dessous
  var PAS_MARCHE = 30;     // tuiles parcourues pour un point de Nfs
  var DEPART = 10;         // les mouzounat du mou'allim, à la première arrivée
  var GAIN_ETOILE = 5;     // une étoile de zellige retrouvée
  var FUSEAU = "Africa/Casablanca";

  // ---- L'heure de la maison ----------------------------------------------------------------
  function jourCasa(maintenant) {
    var d = maintenant instanceof Date ? maintenant : new Date(maintenant === undefined ? Date.now() : maintenant);
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  function heureCasa(maintenant) {
    var d = maintenant instanceof Date ? maintenant : new Date(maintenant === undefined ? Date.now() : maintenant);
    try { return Number(new Intl.DateTimeFormat("en-GB", { timeZone: FUSEAU, hour: "2-digit", hourCycle: "h23" }).format(d)) % 24; }
    catch (e) { return d.getUTCHours(); }
  }

  // ---- L'état -----------------------------------------------------------------------------
  function etat(recit) { return Rc.normaliserRihla(recit && recit.rihla); }
  function copie(e) { return Rc.normaliserRihla(JSON.parse(JSON.stringify(e || {}))); }

  // Le souffle maximum du jour : l'Atay du matin donne +1 par tranche de 10 de sa note.
  function nfsMax(noteAtay) { var n = Math.max(0, Math.min(100, Math.floor(Number(noteAtay) || 0))); return NFS_BASE + Math.floor(n / 10); }
  function nfs(e, max) { var m = max || NFS_BASE; return e && e.n !== undefined ? Math.min(e.n, m) : m; }
  function mz(e) { return (e && e.mz) || 0; }

  // Un nouveau jour : le souffle revient plein.
  function rafraichir(e, jour, max) {
    var x = copie(e);
    if (x.nj !== jour) { x.n = max || NFS_BASE; x.nj = jour; }
    else if (x.n === undefined) x.n = max || NFS_BASE;
    return x;
  }
  // La première arrivée : les dix mouzounat du mou'allim, une seule fois.
  function arriver(e) {
    var x = copie(e);
    if (x.a) return { e: x, premiere: false };
    x.a = true; x.mz = mz(x) + DEPART;
    return { e: x, premiere: true };
  }
  // Un point de marche (PAS_MARCHE tuiles) : le souffle baisse, jamais sous le plancher.
  function marcher(e, max) {
    var x = copie(e), n = nfs(x, max);
    x.n = n > PLANCHER ? n - 1 : n;
    return x;
  }

  // ---- Découvrir, ramasser ----------------------------------------------------------------
  function decouvrir(e, region, cleQuartier) {
    var x = copie(e), q = region.quartier(cleQuartier);
    if (!q) return { e: x, nouveau: false, prime: 0 };
    x.q = x.q || [];
    if (x.q.indexOf(q.cle) >= 0) return { e: x, nouveau: false, prime: 0 };
    var prime = q.prime || region.PRIME || 0;
    x.q.push(q.cle); x.mz = mz(x) + prime;
    return { e: x, nouveau: true, prime: prime, quartier: q, tous: x.q.length === region.QUARTIERS.length };
  }
  function ramasser(e, region, index) {
    var x = copie(e);
    if (!(index >= 0 && index < region.ETOILES.length)) return { e: x, gain: 0 };
    x.e = x.e || [];
    if (x.e.indexOf(index) >= 0) return { e: x, gain: 0 };
    x.e.push(index); x.mz = mz(x) + GAIN_ETOILE;
    return { e: x, gain: GAIN_ETOILE, trouvees: x.e.length, total: region.ETOILES.length };
  }
  function etoileA(e, region, tx, ty) {
    for (var i = 0; i < region.ETOILES.length; i++) {
      var s = region.ETOILES[i];
      if (s[0] === tx && s[1] === ty && !(e && e.e && e.e.indexOf(i) >= 0)) return i;
    }
    return -1;
  }

  // ---- Manger --------------------------------------------------------------------------
  function disponible(plat, heure) { return !plat.heures || (heure >= plat.heures[0] && heure < plat.heures[1]); }
  function manger(e, region, clePlat, heure, max) {
    var x = copie(e), p = region.plat(clePlat), m = max || NFS_BASE;
    if (!p || p.prix === null || p.prix === undefined) return { ok: false, e: x, texte: "Ce plat ne s'achète pas." };
    if (!disponible(p, heure)) return { ok: false, e: x, texte: "Pas à cette heure-ci : de " + p.heures[0] + " h à " + p.heures[1] + " h, heure de Casablanca." };
    if (nfs(x, m) >= m) return { ok: false, e: x, texte: "Ton souffle est plein. Garde tes mouzounat pour plus tard." };
    if (mz(x) < p.prix) return { ok: false, e: x, texte: "Il te manque des mouzounat : le plat en coûte " + p.prix + "." };
    x.mz = mz(x) - p.prix;
    x.n = Math.min(m, nfs(x, m) + p.nfs);
    x.p = x.p || [];
    var premier = x.p.indexOf(p.cle) < 0;
    if (premier) x.p.push(p.cle);
    return { ok: true, e: x, premier: premier, texte: "Bssaha ! +" + p.nfs + " Nfs." };
  }

  // ---- Travailler : un métier, une fois par jour ------------------------------------------
  function travailler(e, region, cleMetier, jour, max) {
    var x = copie(e), w = region.metier(cleMetier);
    if (!w) return { ok: false, e: x, texte: "Il n'y a pas de travail ici." };
    if (x.m && x.m[w.cle] === jour) return { ok: false, e: x, texte: "C'est fait pour aujourd'hui. Reviens demain." };
    if (nfs(x, max) < w.nfs) return { ok: false, e: x, texte: "Tu n'as plus assez de souffle. Mange d'abord." };
    x.n = nfs(x, max) - w.nfs; x.mz = mz(x) + w.mz;
    x.m = x.m || {}; x.m[w.cle] = jour;
    return { ok: true, e: x, texte: w.texte };
  }
  function travailleAujourdhui(e, cleMetier, jour) { return !!(e && e.m && e.m[cleMetier] === jour); }

  // ---- Les portes ----------------------------------------------------------------------
  function porteOuverte(e, region, clePorte, jour) {
    var p = region.PORTES[clePorte];
    if (!p) return false;
    if (p.type === "libre" || p.type === "retour") return true;
    if (p.type === "fermee") return false;
    var o = e && e.o && e.o[clePorte];
    return o === true || o === jour;
  }
  function payerPorte(e, region, clePorte, jour) {
    var x = copie(e), p = region.PORTES[clePorte];
    if (!p || p.type !== "payer") return { ok: false, e: x, texte: "Cette porte ne se paie pas." };
    if (porteOuverte(x, region, clePorte, jour)) return { ok: true, e: x, texte: "C'est déjà ouvert." };
    if (mz(x) < p.prix) return { ok: false, e: x, texte: "Il te manque des mouzounat : c'est " + p.prix + "." };
    x.mz = mz(x) - p.prix;
    x.o = x.o || {}; x.o[clePorte] = p.duree === "jour" ? jour : true;
    return { ok: true, e: x, texte: p.duree === "jour" ? "Payé : la porte est ouverte pour aujourd'hui." : "Payé : la porte est ouverte pour toujours." };
  }

  // ---- L'énigme d'une porte ---------------------------------------------------------------
  function normaliserReponse(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ًͯ-ْ]/g, "").toLowerCase()
      .replace(/[إأآ]/g, "ا").replace(/[^a-zء-ي ]+/g, " ").replace(/\s+/g, " ").trim()
      .replace(/^(la |le |porte |la porte )+/, "");
  }
  function repondreEnigme(e, region, clePorte, reponse) {
    var x = copie(e), p = region.PORTES[clePorte];
    if (!p || !p.enigme || !region.ENIGME) return { ok: false, e: x, texte: "Il n'y a pas d'énigme ici." };
    var r = normaliserReponse(reponse);
    var bonnes = region.ENIGME.reponses.map(normaliserReponse);
    if (!r || bonnes.indexOf(r) < 0) return { ok: false, e: x, texte: "Ce n'est pas ça. " + region.ENIGME.indice };
    x.o = x.o || {}; x.o[clePorte] = true;
    return { ok: true, e: x, texte: "C'est ça. Tu connais la ville : monte quand tu veux." };
  }

  // ---- v5.3 — Le souffle du combat, et l'ombre dissipée ---------------------------------------
  // Un tour de combat coûte du souffle ; à zéro, on est à bout — on rentre.
  function souffler(e, cout, max) {
    var x = copie(e), n = nfs(x, max);
    x.n = Math.max(0, n - Math.max(0, Math.floor(Number(cout) || 0)));
    return { e: x, epuise: x.n === 0 };
  }
  // À bout de souffle, on rentre se reposer à la zawia : le souffle revient jusqu'au plancher.
  function reposer(e) {
    var x = copie(e);
    if ((x.n || 0) < PLANCHER) x.n = PLANCHER;
    return x;
  }
  // Une ombre dissipée rend les mouzounat qu'elle avait avalées — une fois.
  function vaincre(e, region, cleOmbre, gain) {
    var x = copie(e);
    if (!region.ombre || !region.ombre(cleOmbre)) return { e: x, nouveau: false, gain: 0 };
    x.ob = x.ob || [];
    if (x.ob.indexOf(cleOmbre) >= 0) return { e: x, nouveau: false, gain: 0 };
    x.ob.push(cleOmbre); x.mz = mz(x) + (gain || 0);
    return { e: x, nouveau: true, gain: gain || 0, restantes: region.OMBRES.length - x.ob.length };
  }

  // ---- v5.4 — L'ijaza d'une ville : Ghobra la grande dissipée, une fois ----------------------
  var PRIME_IJAZA = 30;
  function accorderIjaza(e, region) {
    var x = copie(e);
    x.ij = x.ij || [];
    if (x.ij.indexOf(region.CLE) >= 0) return { e: x, nouveau: false, gain: 0 };
    x.ij.push(region.CLE); x.mz = mz(x) + PRIME_IJAZA;
    return { e: x, nouveau: true, gain: PRIME_IJAZA };
  }
  function aIjaza(e, cleVille) { return !!(e && e.ij && e.ij.indexOf(cleVille) >= 0); }
  // Prêt pour la grande : toutes les ombres de la région dissipées, et une technique de chaque voie.
  function pretPourLaGrande(e, region, voiesConnues) {
    var ob = (e && e.ob) || [];
    var ombres = region.OMBRES.every(function (o) { return ob.indexOf(o.cle) >= 0; });
    var voies = ["prompt", "image", "savoir"].every(function (v) { return (voiesConnues || []).indexOf(v) >= 0; });
    return { ombres: ombres, voies: voies, pret: ombres && voies };
  }
  // v5.5 — le prochain pas dans la région, en une phrase : ce que le Wird dit sous « Jouer ».
  //   { cle, texte } — cle : rafiq · couleurs · ombres · voies · grande · etoiles · fini.
  function prochainBut(e, region, voiesConnues) {
    var x = e || {};
    if (!x.rf) return { cle: "rafiq", texte: "Bab ar-Rihla t'attend au fond de la Khizana : passe la porte du temps, et choisis ton Rafiq." };
    var ij = aIjaza(x, region.CLE);
    var connus = (x.q || []).length;
    if (!ij && connus < 3) return { cle: "couleurs", texte: region.NOM + " est grise : parle aux gardes des quartiers, ils leur rendent leurs couleurs." };
    var p = pretPourLaGrande(x, region, voiesConnues);
    if (!p.ombres) {
      var reste = region.OMBRES.length - region.OMBRES.filter(function (o) { return (x.ob || []).indexOf(o.cle) >= 0; }).length;
      return { cle: "ombres", texte: reste > 1 ? "Encore " + reste + " ombres de Nsyan dans la médina." : "Encore une ombre de Nsyan dans la médina." };
    }
    if (!p.voies) return { cle: "voies", texte: "Il manque une voie à ton Rafiq : les maîtres de la médina l'enseignent, et la bibliothèque de la zawia." };
    if (!ij) return { cle: "grande", texte: "Ghobra la grande t'attend sous les cuves de Dar Dbagh." };
    var et = (x.e || []).length, tot = (region.ETOILES || []).length;
    if (et < tot) return { cle: "etoiles", texte: "Tu portes l'ijaza. Reste les étoiles de zellige : " + et + " sur " + tot + " — et un ami à défier." };
    return { cle: "fini", texte: "Tu portes l'ijaza, et toutes les étoiles. La route de Meknès s'ouvrira avec la prochaine saison." };
  }

  // ---- Ce que les gens changent (fes.js, `parler`) -----------------------------------------
  //   { quete, etape } n'avance jamais à rebours ; { mz } ajoute ; { nfs: "plein" } ;
  //   { plat } : goûté ; { ouvre } : une porte ouverte pour toujours.
  function appliquer(e, effets, max) {
    var x = copie(e);
    (effets || []).forEach(function (f) {
      if (!f || typeof f !== "object") return;
      if (f.quete) { x.qu = x.qu || {}; if ((x.qu[f.quete] || 0) < f.etape) x.qu[f.quete] = f.etape; }
      if (Number(f.mz) > 0) x.mz = mz(x) + Math.floor(Number(f.mz));
      if (f.nfs === "plein") x.n = max || NFS_BASE;
      if (f.plat) { x.p = x.p || []; if (x.p.indexOf(f.plat) < 0) x.p.push(f.plat); }
      if (f.ouvre) { x.o = x.o || {}; x.o[f.ouvre] = true; }
    });
    return Rc.normaliserRihla(x);
  }
  // Acheter pour une quête (le sachet d'olives de Lalla Ghita) : payer, et avancer d'une étape.
  function acheterPourQuete(e, prix, quete, de, vers) {
    var x = copie(e);
    if (!x.qu || x.qu[quete] !== de) return { ok: false, e: x, texte: "" };
    if (mz(x) < prix) return { ok: false, e: x, texte: "Il te manque des mouzounat : c'est " + prix + "." };
    x.mz = mz(x) - prix; x.qu[quete] = vers;
    return { ok: true, e: x, texte: "Un sachet d'olives noires, bien serré." };
  }

  return {
    NFS_BASE: NFS_BASE, PLANCHER: PLANCHER, PAS_MARCHE: PAS_MARCHE, DEPART: DEPART, GAIN_ETOILE: GAIN_ETOILE, FUSEAU: FUSEAU,
    jourCasa: jourCasa, heureCasa: heureCasa, etat: etat, nfsMax: nfsMax, nfs: nfs, mz: mz,
    rafraichir: rafraichir, arriver: arriver, marcher: marcher,
    decouvrir: decouvrir, ramasser: ramasser, etoileA: etoileA,
    disponible: disponible, manger: manger, travailler: travailler, travailleAujourdhui: travailleAujourdhui,
    porteOuverte: porteOuverte, payerPorte: payerPorte, normaliserReponse: normaliserReponse, repondreEnigme: repondreEnigme,
    appliquer: appliquer, acheterPourQuete: acheterPourQuete, souffler: souffler, vaincre: vaincre, reposer: reposer,
    PRIME_IJAZA: PRIME_IJAZA, accorderIjaza: accorderIjaza, aIjaza: aIjaza, pretPourLaGrande: pretPourLaGrande, prochainBut: prochainBut
  };
});
