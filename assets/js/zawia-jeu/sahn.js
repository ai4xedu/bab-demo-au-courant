// ZAW'IA — le jeu · LE SAHN OUVERT : les autres, dans la même cour.
//
// Jusqu'ici chaque navigateur jouait seul : la seule chose partagée était la
// position, sauvée toutes les trente secondes. Deux joueurs connectés en même
// temps ne se voyaient jamais. Ce module tient les RÈGLES de la cour partagée ;
// jeu.js les branche sur un canal Realtime (Presence + Broadcast) et dessine.
//
// Ce qui se décide ici, et que les tests tiennent :
//   · les autres sont des FANTÔMES : dessinés, nommés, jamais solides — dix
//     personnes sur un seuil ne bloquent personne ;
//   · une position reçue est VALIDÉE comme la nôtre (monde.positionValide) :
//     la clé du jeu est publique, quelqu'un peut envoyer n'importe quoi ;
//   · on n'envoie qu'au changement de tuile ou de direction, et jamais plus de
//     1000 / CADENCE_MS fois par seconde : c'est ce qui tient la facture
//     (Realtime se paie au message livré) ;
//   · jamais le hasard du navigateur — la clé de session vient de l'heure ;
//   · le SALUT est une preuve à deux : je salue, l'autre me rend le salam dans
//     la minute, la base compte UNE rencontre par paire. Le serveur seul
//     tranche (zawia-rencontres.sql) ; ici on ne fait que dire quoi afficher ;
//   · une bulle ne porte JAMAIS de lien : le Souk est la place des liens, et
//     un lien au-dessus d'une tête est exactement ce que la 5ᵉ motivation
//     du récit refuse.
//
// ⚠️⚠️ 23/09/2026 — LE SOIR DE L'OUVERTURE, « les uns voyaient les autres, les
// autres pas ». Les journaux Realtime portaient 11 `ClientPresenceRateLimitReached`,
// 7 comptes touchés dont celui du Morchid : Supabase accepte CINQ annonces de
// présence (track/untrack) par client et par 30 s, et FERME le canal à la
// sixième (supabase.com/docs/guides/troubleshooting/realtime-client-presence-rate-limit-reached).
// Le jeu rappelait track() à chaque arrêt du personnage : marcher, s'arrêter,
// repartir six fois en une demi-minute sortait un joueur du direct — il ne
// voyait plus personne, personne ne le voyait, et rien ne le faisait revenir.
// Et un joueur immobile (il lisait, il écoutait la halqa) n'envoyait plus rien :
// chacun l'effaçait au bout de 20 s, à son heure. D'où les règles d'aujourd'hui :
//   · la PRÉSENCE dit QUI est là — la même pour tous, tenue par le serveur —
//     et ne s'annonce qu'en entrant dans le canal, quatre fois par 30 s au plus
//     (`presencePermise`) ; elle ne porte que la place d'entrée ;
//   · la place se dit par des PAS (broadcast) : au changement, et même
//     immobile, un BATTEMENT ; à chaque arrivée, chacun redit la sienne ;
//   · un silencieux s'ASSOUPIT (on l'estompe), il ne disparaît pas : seule la
//     présence fait partir quelqu'un — ou, filets d'une présence qu'un
//     navigateur garde après sa fin, dix secondes sans AUCUN pas depuis
//     l'arrivée (JAMAIS_ENTENDU_MS) ou trois minutes de silence (ABSENT_MS) ;
//   · une personne n'est qu'une fois dans la cour : sa présence la plus
//     récente (`plusRecentes`) ;
//   · la cadence et le battement suivent le nombre de présents : un pas coûte
//     un envoi plus une réception par présent, et au-delà de 500 par seconde
//     (plan Pro) Supabase coupe les connexions de tout le projet ;
//   · un canal fermé se REPREND (`reprise`), de plus en plus patiemment.
//
// Pur : aucun accès au DOM, au réseau ni à l'horloge — tout est passé en
// paramètre, donc testable sous Node.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.sahn = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var CANAL = "sahn";              // le nom du canal Realtime : une seule cour
  var CADENCE_MS = 250;            // au plus 4 pas envoyés par seconde, quand la cour est presque vide
  var CADENCE_MAX_MS = 3000;       // le pas le plus lent, quand elle est pleine
  var BATTEMENT_MS = 8000;         // même immobile, on redit sa place au moins aussi souvent
  var BATTEMENT_MAX_MS = 30000;
  var PRESENCE_MAX = 4;            // annonces de présence par fenêtre — une de marge sous les 5 de Supabase
  var PRESENCE_FENETRE_MS = 30000;
  var REPRISES_MS = [2000, 5000, 10000, 20000, 30000, 60000];
  var FENETRE_SALUT_S = 60;        // ⚠️ le MÊME chiffre que dans zawia-rencontres.sql (un test compare)
  var DEFI_RENCONTRES = 10;        // ⚠️ idem : le défi « réseau » se valide à 10 rencontres
  var PORTEE = 2;                  // en tuiles : à deux tuiles ou moins, on peut saluer
  var SILENCE_MS = 22000;          // sans nouvelle depuis 22 s (cour presque vide), un fantôme s'assoupit
  var ABSENT_MS = 180000;          // trois minutes sans un pas : on ne le dessine plus (il revient à son premier pas)
  var JAMAIS_ENTENDU_MS = 10000;   // une présence qui n'a jamais donné un seul pas en 10 s : un canal mort
  var BULLE_MAX = 80;              // caractères d'une bulle (l'aperçu d'un message du Kalam)
  var BULLE_MS = 7000;             // le temps qu'une bulle courte reste au-dessus d'une tête
  var BULLE_MAX_MS = 15000;        // … et une longue, au plus
  var KALAM_MAX = 280;             // v8.5 — un message du Kalam de la pièce
  var KALAM_INTERVALLE_MS = 1500;  // un message toutes les 1,5 s au plus
  var RECU_FENETRE_MS = 6000;      // à la réception : RECU_MAX messages par personne dans cette fenêtre
  var RECU_MAX = 5;
  var FIL_MAX = 60;                // les lignes du fil, depuis qu'on est entré dans la pièce
  var SOURDS_MAX = 200;
  var PSEUDO_MAX = 24;

  function borne(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function compte(n) { return Math.max(0, Math.floor(Number(n) || 0)); }

  // ---- Combien de messages la cour peut se permettre --------------------------------
  // `n` : le nombre des AUTRES présents. Un pas diffusé coûte 1 envoi + 1 réception
  // par présent : la facture et le plafond de Supabase (500 événements par seconde
  // pour tout le projet, plan Pro) croissent comme le carré des présents. On espace
  // donc les pas et les battements à mesure que la cour se remplit — la glisse
  // (`interpoler`) rend le mouvement fluide quand même.
  function cadencePour(n) { return borne(60 * compte(n), CADENCE_MS, CADENCE_MAX_MS); }
  function battementPour(n) { return borne(500 * compte(n), BATTEMENT_MS, BATTEMENT_MAX_MS); }
  // Deux battements manqués ne font pas un absent : un onglet caché, oui.
  function silencePour(n) { return Math.max(SILENCE_MS, Math.round(battementPour(n) * 2.5) + 2000); }

  // ---- Le tour de la présence --------------------------------------------------------
  // `journal` : les heures des dernières annonces (track), tous canaux confondus.
  // Rend { ok, attente } : si ce n'est pas notre tour, dans combien de ms il revient.
  function purgerPresence(journal, t) {
    return (Array.isArray(journal) ? journal : []).filter(function (x) {
      return typeof x === "number" && x <= t && t - x < PRESENCE_FENETRE_MS;
    });
  }
  function presencePermise(journal, maintenant) {
    var t = Number(maintenant) || 0, j = purgerPresence(journal, t);
    if (j.length < PRESENCE_MAX) return { ok: true, attente: 0 };
    return { ok: false, attente: Math.min.apply(null, j) + PRESENCE_FENETRE_MS - t + 250 };
  }
  function noterPresence(journal, maintenant) {
    var t = Number(maintenant) || 0, j = purgerPresence(journal, t);
    j.push(t);
    return j;
  }
  // Le canal est tombé : dans combien de temps on le reprend (le n-ième essai).
  function reprise(essais) { return REPRISES_MS[Math.min(compte(essais), REPRISES_MS.length - 1)]; }

  // ---- Identité de session ---------------------------------------------------------
  // Un même compte ouvert dans deux onglets fait deux présences : la clé est
  // le compte + l'heure d'entrée. Sans hasard, comme partout dans le jeu.
  function cleDeSession(id, maintenant) {
    return String(id || "") + "." + Math.floor(Number(maintenant) || 0).toString(36);
  }
  function idDeCle(cle) {
    var s = String(cle || ""), i = s.lastIndexOf(".");
    return i > 0 ? s.slice(0, i) : s;
  }
  function heureDeCle(cle) {
    var s = String(cle || ""), i = s.lastIndexOf(".");
    var h = i > 0 ? parseInt(s.slice(i + 1), 36) : NaN;
    return isFinite(h) ? h : -1;
  }
  // Une personne n'est qu'UNE fois dans la cour : de ses clés de présence, on
  // garde la plus récente (la clé porte l'heure d'entrée). Vu en essai contre le
  // vrai Realtime (23/09/2026) : quand le serveur ferme un canal après des mises
  // à jour de présence rapprochées, l'ancienne présence peut rester dans l'état
  // des AUTRES navigateurs — un fantôme de plus à chaque reprise. Deux onglets
  // d'un même compte n'en font qu'un, et c'est tant mieux : c'est une personne.
  // Rend { clé: true } pour celles qu'on garde.
  function plusRecentes(cles) {
    var par = {}, garde = {};
    (Array.isArray(cles) ? cles : []).forEach(function (k) {
      var id = idDeCle(k), h = heureDeCle(k);
      if (!par[id] || h > par[id].h) par[id] = { k: k, h: h };
    });
    for (var id in par) garde[par[id].k] = true;
    return garde;
  }

  // ---- Ce qui arrive du réseau ----------------------------------------------------------
  // Les caractères de contrôle (code < 32, et 127) sautent : rien ne s'écrit
  // dans une bulle ou un pseudo qui ne se lise pas.
  var RE_CONTROLE = new RegExp("[\\x00-\\x1f\\x7f]", "g");
  function texteSur(v, max) {
    return String(v == null ? "" : v).replace(RE_CONTROLE, "").replace(/\s+/g, " ").trim().slice(0, max);
  }
  function direction(M, d) { return M && M.DIRS && M.DIRS[d] ? d : "bas"; }

  // Une présence annoncée → un fantôme, ou null si elle ne dit pas QUI.
  // `M` est ZWJ.monde, `R` ZWJ.regles — passés, jamais requis (Node et navigateur).
  // Une place refusée (un mur, un nombre qui n'en est pas un) n'est jamais
  // dessinée — `place: false` — mais le fantôme existe : son premier pas valide
  // le montre. Avant le 23/09/2026 il était rejeté, et restait invisible.
  function normaliserPresence(cle, p, M, R, maintenant) {
    if (!cle || !p || typeof p !== "object") return null;
    var id = texteSur(p.id, 64);
    if (!id) return null;
    var x = Number(p.x), y = Number(p.y);
    var place = isFinite(x) && isFinite(y) && !!M && M.positionValide({ x: x, y: y });
    var pseudo = texteSur(p.pseudo, PSEUDO_MAX) || "Talib";
    var avatar = R && R.normaliserAvatar ? R.normaliserAvatar(p.avatar) : (p.avatar || {});
    var t = Number(maintenant) || 0;
    var ici = place ? { x: x, y: y } : null;
    return {
      cle: String(cle), id: id, pseudo: pseudo, avatar: avatar, place: place,
      x: place ? x : null, y: place ? y : null, dir: direction(M, p.dir), bouge: false,
      depart: ici, cible: ici ? { x: x, y: y } : null, t0: t, vu: t, aPas: false, dernierPas: 0,
      duree: CADENCE_MS, bulle: null
    };
  }

  // Un pas reçu → validé, ou null. Le fantôme glisse vers cette cible.
  function normaliserPas(p, M) {
    if (!p || typeof p !== "object") return null;
    var x = Number(p.x), y = Number(p.y);
    if (!isFinite(x) || !isFinite(y) || !M || !M.positionValide({ x: x, y: y })) return null;
    return { x: x, y: y, dir: direction(M, p.dir), bouge: !!p.bouge };
  }

  // Applique un pas à un fantôme : la position AFFICHÉE devient le départ, le
  // pas devient la cible, et on glisse entre les deux le temps qui sépare deux
  // pas — borné par `cadence`, celle que la cour se permet (cadencePour) : un
  // long silence ne ralentit pas le pas qui suit. Le premier pas d'un fantôme
  // sans place le fait apparaître où il est, sans glisser depuis nulle part.
  function recevoirPas(autre, pas, maintenant, cadence) {
    if (!autre || !pas) return autre;
    var t = Number(maintenant) || 0;
    if (autre.place && autre.cible) {
      var ici = interpoler(autre, t);
      autre.depart = { x: ici.x, y: ici.y };
    } else {
      autre.depart = { x: pas.x, y: pas.y };
    }
    autre.cible = { x: pas.x, y: pas.y };
    var plafond = Math.max(CADENCE_MS, Number(cadence) || CADENCE_MS);
    autre.duree = autre.aPas ? borne(t - autre.dernierPas, 120, plafond) : CADENCE_MS;
    autre.place = true; autre.aPas = true; autre.dernierPas = t;
    autre.t0 = t; autre.vu = t;
    autre.dir = pas.dir; autre.bouge = pas.bouge;
    return autre;
  }
  // Une présence resynchronisée (quelqu'un est arrivé, ou parti) rafraîchit
  // le pseudo et l'habit. Sa place, elle, n'est que celle de l'ENTRÉE : elle ne
  // ramène jamais en arrière un fantôme dont on a reçu un pas. Elle ne dit pas
  // non plus s'il est éveillé — seul un pas le dit.
  function rafraichir(autre, frais, maintenant) {
    if (!autre || !frais) return autre;
    autre.pseudo = frais.pseudo; autre.avatar = frais.avatar; autre.id = frais.id;
    if (!autre.aPas && frais.place) {
      var t = Number(maintenant) || 0;
      autre.place = true;
      autre.depart = { x: frais.x, y: frais.y }; autre.cible = { x: frais.x, y: frais.y };
      autre.t0 = t; autre.dir = frais.dir; autre.bouge = false;
    }
    return autre;
  }
  function interpoler(autre, maintenant) {
    if (!autre.cible) return { x: autre.x, y: autre.y };
    var k = (Number(maintenant) - autre.t0) / (autre.duree || CADENCE_MS);
    if (!isFinite(k) || k >= 1 || !autre.depart) return { x: autre.cible.x, y: autre.cible.y };
    if (k <= 0) return { x: autre.depart.x, y: autre.depart.y };
    return { x: autre.depart.x + (autre.cible.x - autre.depart.x) * k, y: autre.depart.y + (autre.cible.y - autre.depart.y) * k };
  }

  // Ceux qui sont là — TOUS ceux que la présence tient, pourvu qu'ils aient une
  // place — du plus haut au plus bas (l'ordre de dessin : celui qui est plus bas
  // passe devant). Un silencieux reste, marqué `assoupi` : on l'estompe. Seul un
  // silence de trois minutes (ABSENT_MS) le retire du dessin : un battement part
  // au moins toutes les 30 s, c'est donc un onglet parti depuis longtemps ou une
  // présence que le serveur tarde à solder — le filet, pas la règle.
  // `n` : le nombre de présents, qui règle la patience (silencePour).
  function vivants(autres, maintenant, n) {
    var t = Number(maintenant) || 0, liste = [], silence = silencePour(n);
    for (var k in autres) {
      var a = autres[k];
      if (!a || !a.place || !a.cible) continue;
      // Un vivant répond à chaque arrivée par un pas, en moins d'une seconde, et bat au moins
      // toutes les 30 s : une présence qui n'a JAMAIS parlé en 10 s est celle d'un canal fermé,
      // que le serveur a soldée mais qu'un navigateur garde (vu en essai, 23/09/2026).
      if (t - a.vu > ABSENT_MS || (!a.aPas && t - a.vu > JAMAIS_ENTENDU_MS)) continue;
      a.assoupi = t - a.vu > silence;
      liste.push(a);
    }
    liste.sort(function (a, b) { return interpoler(a, t).y - interpoler(b, t).y; });
    return liste;
  }

  // ---- Ce qu'on envoie -------------------------------------------------------------------
  // On envoie quand CE QU'ON MONTRE a changé (tuile, direction, ou arrêt), et
  // jamais deux fois dans la même cadence ; immobile, on redit sa place à chaque
  // battement. Un arrêt à 100 ms du dernier envoi part au tour suivant : `etat`
  // garde ce qui a été ENVOYÉ, pas ce qui est. `n` : les autres présents.
  function doitEnvoyer(etat, pas, maintenant, n) {
    if (!etat || !pas) return false;
    var t = Number(maintenant) || 0;
    if (etat.dernier && t - etat.dernier < cadencePour(n)) return false;
    if (!etat.dernier || t - etat.dernier >= battementPour(n)) return true;
    return etat.tx !== pas.tx || etat.ty !== pas.ty || etat.dir !== pas.dir || !!etat.bouge !== !!pas.bouge;
  }
  function marquerEnvoye(etat, pas, maintenant) {
    etat.dernier = Number(maintenant) || 0;
    etat.tx = pas.tx; etat.ty = pas.ty; etat.dir = pas.dir; etat.bouge = !!pas.bouge;
    return etat;
  }

  // ---- Le salut -----------------------------------------------------------------------------
  // Qui est à portée de salut : à PORTEE tuiles ou moins, celui qu'on regarde
  // d'abord, puis le plus proche. Un autre onglet du même compte est un
  // fantôme comme un autre — c'est le serveur qui refusera de le compter.
  function devant(moi, autres, T, maintenant) {
    if (!moi || !autres || !autres.length) return null;
    var t = Number(maintenant) || 0, meilleur = null, score = Infinity;
    var d = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] }[moi.dir] || [0, 1];
    for (var i = 0; i < autres.length; i++) {
      var p = interpoler(autres[i], t);
      var dx = (p.x - moi.x) / T, dy = (p.y - moi.y) / T;
      var dist = Math.max(Math.abs(dx), Math.abs(dy));
      if (dist > PORTEE) continue;
      var regarde = dx * d[0] + dy * d[1] > 0.25;           // devant moi, pas dans mon dos
      var s = dist - (regarde ? PORTEE : 0);                 // celui qu'on regarde gagne toujours
      if (s < score) { score = s; meilleur = autres[i]; }
    }
    return meilleur;
  }

  // Ce que le serveur a répondu, dit au joueur. Jamais un e-mail, jamais un nom :
  // le pseudo de l'autre et un compte.
  function texteSalut(r, pseudo) {
    var qui = texteSur(pseudo, PSEUDO_MAX) || "l'autre";
    if (!r || !r.ok) return (r && r.erreur) ? String(r.erreur) : "Le salut n'est pas parti. Réessaie.";
    var n = Math.max(0, Math.floor(Number(r.rencontres) || 0));
    if (r.deja) return "Vous vous êtes déjà rencontrés, " + qui + " et toi. Le salam reste bon à dire.";
    if (r.rencontre) {
      return "Salam rendu. " + qui + " et toi vous êtes rencontrés — " + n + " rencontre" + (n > 1 ? "s" : "") + " sur " + DEFI_RENCONTRES + "." +
        (n >= DEFI_RENCONTRES ? "\nLe défi du réseau est tenu : dix conversations vraies." : "");
    }
    return "Tu as salué " + qui + ". Si le salam t'est rendu dans la minute, la rencontre est comptée — pour vous deux.";
  }

  // Le défi « Réseauter avec 10 membres » (regles.js) se déduit du compte
  // tenu par la base — jamais du navigateur.
  function defiReseau(rencontres) {
    var n = Math.max(0, Math.floor(Number(rencontres) || 0));
    if (n >= DEFI_RENCONTRES) return "valide";
    return n > 0 ? "en_cours" : "a_faire";
  }

  // ---- Les bulles ----------------------------------------------------------------------------
  // v8.5 — la bulle est l'APERÇU d'un message du Kalam (280 caractères) : 80 au-dessus
  // de la tête, coupés d'un « … », et plus longtemps quand il y a plus à lire.
  var LIEN = /https?:\/\/|www\.|\.(com|tech|ma|io|net|org|ai)(\/|\b)/i;
  function message(texte) {
    var t = texteSur(texte, 2000);
    if (!t) return { ok: false, erreur: "Rien à dire ?" };
    if (LIEN.test(t)) return { ok: false, erreur: "Pas de lien dans la cour — ta ferracha est au Souk, dehors des murs." };
    return { ok: true, texte: t.slice(0, KALAM_MAX) };
  }
  function apercuBulle(t) { return t.length > BULLE_MAX ? t.slice(0, BULLE_MAX - 1) + "…" : t; }
  function bulle(texte) {
    var m = message(texte);
    return m.ok ? { ok: true, texte: apercuBulle(m.texte) } : m;
  }
  function dureeBulle(texte) { return borne(3000 + 50 * String(texte == null ? "" : texte).length, BULLE_MS, BULLE_MAX_MS); }
  function poserBulle(autre, texte, maintenant) {
    var m = message(texte);
    if (!autre || !m.ok) return null;
    autre.bulle = { texte: apercuBulle(m.texte), jusqu: (Number(maintenant) || 0) + dureeBulle(m.texte) };
    return autre.bulle;
  }
  function bulleVisible(b, maintenant) {
    return !!(b && b.texte && (Number(maintenant) || 0) < b.jusqu);
  }

  // ---- v8.5 — LE KALAM DE LA PIÈCE : ce qui s'y dit, depuis qu'on est entré --------------------
  // 24/09/2026, Youssef : « je ne parviens pas à avoir une conversation fluide avec les
  // membres ». Une bulle de 80 caractères restait sept secondes, et c'était tout : pas de
  // fil, rien à relire, aucune réponse possible à ce qu'on n'avait pas vu passer. Le
  // Kalam garde les 60 dernières lignes de la pièce DANS CE NAVIGATEUR — rien n'est
  // enregistré nulle part : ce qui se dit dans la cour reste dans la cour, comme à la
  // halqa, et chacun voit ce qui s'est dit depuis qu'il est entré.
  //   · 280 caractères, jamais de lien (la règle de la bulle) ;
  //   · un message toutes les 1,5 s au plus (`peutDire`), et à la RÉCEPTION cinq par
  //     personne en six secondes (`recevoirDit`) : la clé du jeu est publique, un
  //     navigateur trafiqué peut inonder le canal — son inondation n'entre pas dans
  //     notre fil ;
  //   · « @pseudo » met la ligne en lumière chez celui qu'on nomme (`mentionne`) ;
  //   · « Ne plus entendre » quelqu'un vit dans ce navigateur (`sourds`) : tout de
  //     suite, sans rien demander à personne, et ses lignes quittent le fil.
  function peutDire(dernier, maintenant) {
    var t = Number(maintenant) || 0, d = Number(dernier);
    if (!isFinite(d) || d <= 0 || d > t || t - d >= KALAM_INTERVALLE_MS) return { ok: true, attente: 0 };
    return { ok: false, attente: KALAM_INTERVALLE_MS - (t - d) };
  }
  // `journaux` : { cle → [heures] }. Rend true si le message de `cle` entre dans le fil.
  function recevoirDit(journaux, cle, maintenant) {
    if (!journaux || !cle) return false;
    var t = Number(maintenant) || 0;
    var j = (Array.isArray(journaux[cle]) ? journaux[cle] : []).filter(function (x) { return x <= t && t - x < RECU_FENETRE_MS; });
    if (j.length >= RECU_MAX) { journaux[cle] = j; return false; }
    j.push(t);
    journaux[cle] = j;
    return true;
  }
  function plier(s) {
    var t = String(s == null ? "" : s).toLowerCase();
    try { t = t.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) { /* un moteur sans normalize : la casse suffit */ }
    return t;
  }
  // « @Omar » nomme Omar — pas « @Omar2 », pas « omar » sans arobase.
  function mentionne(texte, pseudo) {
    var p = plier(texteSur(pseudo, PSEUDO_MAX)), t = plier(texte);
    if (!p) return false;
    var cible = "@" + p, i = t.indexOf(cible);
    while (i >= 0) {
      var apres = t.charAt(i + cible.length);
      if (!apres || !/[a-z0-9_؀-ۿ]/.test(apres)) return true;
      i = t.indexOf(cible, i + 1);
    }
    return false;
  }
  // Une ligne du fil : { cle, id, pseudo, texte, t, moi, mention } — ou null.
  // `o.monPseudo` : le mien, pour savoir si la ligne me nomme.
  function ligneDuFil(o) {
    o = o && typeof o === "object" ? o : {};
    var m = message(o.texte);
    if (!m.ok) return null;
    return {
      cle: texteSur(o.cle, 96), id: texteSur(o.id, 64), pseudo: texteSur(o.pseudo, PSEUDO_MAX) || "Un Talib",
      texte: m.texte, t: Number(o.t) || 0, moi: !!o.moi, mention: !o.moi && mentionne(m.texte, o.monPseudo)
    };
  }
  function ajouterAuFil(fil, ligne) {
    var f = Array.isArray(fil) ? fil.slice() : [];
    if (ligne) f.push(ligne);
    return f.length > FIL_MAX ? f.slice(f.length - FIL_MAX) : f;
  }
  // Ceux qu'on n'entend plus : des identifiants de COMPTE, pas des clés de session —
  // un nouvel onglet ne rend pas la parole à qui on l'a retirée.
  function normaliserSourds(v) {
    var out = [], vus = {};
    (Array.isArray(v) ? v : []).forEach(function (x) {
      var id = texteSur(x, 64);
      if (id && !vus[id]) { vus[id] = 1; out.push(id); }
    });
    return out.slice(-SOURDS_MAX);
  }
  function estSourd(sourds, id) { return !!id && Array.isArray(sourds) && sourds.indexOf(String(id)) >= 0; }
  function basculerSourd(sourds, id, oui) {
    var s = normaliserSourds(sourds).filter(function (x) { return x !== String(id || ""); });
    if (oui && id) s.push(String(id));
    return normaliserSourds(s);
  }
  function sansLesSourds(fil, sourds) {
    return (Array.isArray(fil) ? fil : []).filter(function (l) { return l && (l.moi || !estSourd(sourds, l.id)); });
  }
  // Les phrases rapides (le téléphone d'abord). Trois partent d'un geste ; la dernière
  // se complète : « Chkoun y3awenni f… ? » attend qu'on dise de quoi on a besoin.
  var PHRASES = [
    { cle: "salam", texte: "Salam" },
    { cle: "mrhba", texte: "Mrhba" },
    { cle: "chokran", texte: "Chokran" },
    { cle: "3awenni", texte: "Chkoun y3awenni f… ?", debut: "Chkoun y3awenni f " }
  ];

  // ---- Le HUD ---------------------------------------------------------------------------------
  // v5.7 — `lieu` : "souk" pour la Rahba (son propre canal), la cour sinon.
  function compterTexte(n, lieu) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    var ou = lieu === "souk" ? "au Souk" : "dans la cour";
    if (n === 0) return "Seul " + ou;
    if (n === 1) return "1 autre " + ou;
    return n + " autres " + ou;
  }
  // Le canal est tombé et se reprend tout seul : on le dit, sans alarmer.
  function texteReprise(lieu) {
    return lieu === "souk" ? "On revient au Souk…" : "On revient dans la cour…";
  }

  return {
    CANAL: CANAL, CADENCE_MS: CADENCE_MS, CADENCE_MAX_MS: CADENCE_MAX_MS, BATTEMENT_MS: BATTEMENT_MS,
    PRESENCE_MAX: PRESENCE_MAX, PRESENCE_FENETRE_MS: PRESENCE_FENETRE_MS,
    FENETRE_SALUT_S: FENETRE_SALUT_S, DEFI_RENCONTRES: DEFI_RENCONTRES,
    PORTEE: PORTEE, SILENCE_MS: SILENCE_MS, ABSENT_MS: ABSENT_MS, JAMAIS_ENTENDU_MS: JAMAIS_ENTENDU_MS, BULLE_MAX: BULLE_MAX, BULLE_MS: BULLE_MS,
    BULLE_MAX_MS: BULLE_MAX_MS, KALAM_MAX: KALAM_MAX, KALAM_INTERVALLE_MS: KALAM_INTERVALLE_MS, FIL_MAX: FIL_MAX,
    RECU_MAX: RECU_MAX, RECU_FENETRE_MS: RECU_FENETRE_MS, PHRASES: PHRASES,
    message: message, dureeBulle: dureeBulle, peutDire: peutDire, recevoirDit: recevoirDit, mentionne: mentionne,
    ligneDuFil: ligneDuFil, ajouterAuFil: ajouterAuFil,
    normaliserSourds: normaliserSourds, estSourd: estSourd, basculerSourd: basculerSourd, sansLesSourds: sansLesSourds,
    cadencePour: cadencePour, battementPour: battementPour, silencePour: silencePour,
    presencePermise: presencePermise, noterPresence: noterPresence, reprise: reprise, texteReprise: texteReprise,
    cleDeSession: cleDeSession, idDeCle: idDeCle, plusRecentes: plusRecentes,
    normaliserPresence: normaliserPresence, normaliserPas: normaliserPas, recevoirPas: recevoirPas,
    rafraichir: rafraichir, interpoler: interpoler, vivants: vivants,
    doitEnvoyer: doitEnvoyer, marquerEnvoye: marquerEnvoye,
    devant: devant, texteSalut: texteSalut, defiReseau: defiReseau,
    bulle: bulle, poserBulle: poserBulle, bulleVisible: bulleVisible, compterTexte: compterTexte
  };
});
