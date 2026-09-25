// ZAW'IA — le jeu · L'APPLICATION : trois écrans, une boucle.
//
//   la Porte   (#ecran-porte)   : entrer ou s'inscrire ;
//   l'Atelier  (#ecran-atelier) : créer — ou retoucher — son personnage ;
//   la Cour    (#ecran-cour)    : se promener dans la Qarawiyine.
//
// Ce fichier ne calcule ni règle ni collision de carte (regles.js, monde.js),
// ne porte aucun texte du récit (recit.js, pages.js) et ne dessine aucun pixel
// (rendu.js) : il branche, écoute et anime.
//
// v1.9 — la Chajara et la bibliothèque : deux mondes (gens de la maison /
// Tolba libres), la lignée reconnue par le serveur à chaque session (jamais
// déclarée, jamais dans le code — le voile), les rayonnages `B` de la Khizana
// qui ouvrent la bibliothèque (al-Moujam, les ressources, le catalogue), et
// le Riwaq recentré sur les rencontres. Le cloisonnement vit en base : ici on
// ne fait qu'expliquer les portes fermées (chajara.js).
// v1.2 — la Rihla : le prologue (Al-Mawsoul et Nsyan), le sandouq des pages
// perdues à la Khizana, les sept khatt de la charte sur les murs du Sahn.
// v1.7 — l'Imtihan au rihal (une question, chronométrée, jamais deux fois la
// même) et le tableau public. La bonne réponse et le chronomètre vivent sur le
// serveur ; quitter la fenêtre brûle la question.
// v1.5 — le Riwaq : la salle des rencontres, ouverte au menu à tout moment et
// par le cercle de la Qa3a (les ressources, d'abord ici, ont déménagé à la
// bibliothèque en v1.9). Tout son contenu vient de la base : le jeu n'écrit
// ni lien ni nom (le voile).
// v1.4 — la musique : al-Āla jouée en code (musique.js), la pièce où l'on
// marche décide du ṭab' et du mizan, et le bouton ♪ coupe tout.
// v1.3 — les trois axes : l'établi des Ta7addi dans la Madrasa (technique), le
// sandouq qui nourrit la Dhakira (culture), le M39ol qui vient des autres
// (communauté), et le carnet qui les montre côte à côte.
(function () {
  "use strict";
  var ZWJ = window.ZWJ || {};
  var Lg = ZWJ.langue;   // v3.1 — la langue : le DOM est traduit, jeu.js ne change pas ses textes
  var R = ZWJ.regles, M = ZWJ.monde, C = ZWJ.compte, Rd = ZWJ.rendu, Rc = ZWJ.recit, P = ZWJ.pages, Th = ZWJ.tahaddi, Mu = ZWJ.musique, Rs = ZWJ.ressources, Im = ZWJ.imtihan, Sk = ZWJ.souk, Cj = ZWJ.chajara, Bb = ZWJ.bibliotheque, In = ZWJ.intro, Tt = ZWJ.tutoriel, Pn = ZWJ.pnj, Sh = ZWJ.sahn, Mo = ZWJ.morchid, Wd = ZWJ.wird, Kh = ZWJ.kharita, Pr = ZWJ.parrainage, Km = ZWJ.kelma, At = ZWJ.atay, Kx = ZWJ.khessa, Ql = ZWJ.qlil, Jx = ZWJ.jeux, Fx = ZWJ.fes, Rh = ZWJ.rihla, Rf = ZWJ.rafiq, Cb = ZWJ.combat, Pa = ZWJ.paliers, Rb = ZWJ.rahba, Sf = ZWJ.safqa, Kn = ZWJ.kounnach, Ms = ZWJ.masarat, Mh = ZWJ.maharat, Ij = ZWJ.ijazaCarte, Tr = ZWJ.traits, Tq = ZWJ.tariqa, Kl = ZWJ.kalam, Dy = ZWJ.dayf, Om = ZWJ.oumm, Vl = ZWJ.voile, Sr = ZWJ.sirr, Mc = ZWJ.mechouar, Dr = ZWJ.dar, Rl = ZWJ.rasail, Bq = ZWJ.bitaqa, Tm = ZWJ.tadamoun;
  var CFG = window.ZWJ_CONFIG || {};
  var T = M.TUILE;
  var Mz = M;   // v5.2 — le monde de la zawia ; M devient Fès le temps de la Rihla

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  var mouvementReduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var compte = null;   // l'adaptateur (compte.js)
  var joueur = null;   // le personnage de la session
  var ecran = null;
  var orchestre = null;   // la musique (musique.js) — jamais avant un geste du joueur
  var riwaq = { lignes: null, seances: [], chargement: null };   // ce que la maison annonce (ressources.js)
  var biblio = { lignes: null, chargement: null };                // les rayons de la Khizana (bibliotheque.js)
  var kounnach = { lignes: null, chargement: null, vue: null, brouillon: null };
  var masarat = { donnees: null, vue: null, brouillon: null, depuisEtabli: false };   // v6.1 — les Masarat (masarat.js) : les parcours, la vue d'une étape, le livrable en cours   // v6.0 — le Kounnach (kounnach.js) : la liste, la vue, le brouillon
  // v8.0 — LA RKHAMA (الرخامة) : la dalle de marbre gravée au mur du Sahn, qui
  // nomme ceux qui soutiennent la maison et les remercie. Ce qu'elle porte vient
  // de la base (`zawia_partenaires`) et de NULLE PART ailleurs — un nom de
  // partenaire est une maison réelle, il n'entre dans aucun fichier servi.
  // ⚠️ `lue` ne vit que le temps de la session (le récit est une liste blanche,
  // et un remerciement n'a pas à être compté) : le losange d'or s'éteint dès
  // qu'on a lu la dalle, et revient à la session suivante.
  var rkhama = { donnees: null, chargement: null, dalles: null, lue: false };
  var maharat = { donnees: null };   // v7.8 — les Maharat (maharat.js) : ce que la base a rendu (prouvées, apprises, ponts) — aucun point
  // La lignée de la session : posée par le SERVEUR à chaque entrée (RPC
  // idempotente), jamais par le navigateur. Par défaut : Talib libre —
  // fail-close, comme le voile. L'atelier, lui, joue en gens de la maison.
  var lignee = { maison: false, chajara: null };
  // v3.2 — le masque du Morchid (morchid.js) ; v3.3 — le Majliss. Tous deux
  // posés par le SERVEUR avec la lignée : l'écran ne fait que les lire.
  var morchid = { actif: false, masque: null, essai: false };
  // v8.2 — `essai` : le compte d'ESSAI du Morchid (zawia_morchid.essai). Le masque,
  // ses raccourcis et « Rejouer le début » ne s'ouvrent qu'à lui ; le compte
  // principal du Morchid garde `actif` (rang, tariqa libre) et rien d'autre.
  var majliss = { membre: false, envoi: false, portes: null };
  // v4.1 — pas de parrainage, pas de jeu. L'admission est rendue par le
  // SERVEUR avec la lignée ; l'écran ne fait que fermer la porte qu'elle dit
  // fermée. Le code d'un lien d'invitation, lui, a été retiré de l'adresse
  // par le script de tête et gardé pour l'onglet.
  var admission = { admis: true, voie: null, parrain: null };
  // v7.2 — le Dayf : l'invité reçu trois jours, sans compte ni adresse. `etat`
  // vit dans le localStorage de son navigateur, et NULLE PART ailleurs.
  var dayf = { actif: false, etat: null, vuLe: 0, minuterie: 0 };
  var hanout = { code: null, invite: false, dit: false, note: false };   // v7.8 — qui vient du hanout (l3b.zawia.tech/hanout)
  // v7.3 — Oumm IA : son emprise se lit dans `joueur.recit.oumm` ; le défi du
  // Voilé vient de la base (aucun énoncé dans un fichier servi).
  var oumm = { defi: null };
  // v7.4 — le Voilé (voile.js) : la fenêtre du signal en cours et l'horloge relue,
  // la rencontre sur la Rahba (sa tuile), la prise du défi lue en base, la
  // chaleur de la lanterne (une minuterie), un filleul connu (null = pas lu).
  var voile = { fenetre: null, lu: 0, signal: null, rencontre: null, apercu: false, prise: null, chaleur: 0, filleul: null };
  // v7.6 — le Sirr (sirr.js) : ce que la BASE a répondu sur les sept traces, et
  // la toile du huitième cadre. ⚠️ `etat` n'est jamais écrit par l'écran : le
  // navigateur ne sait pas ce qu'il a acquis, il l'apprend.
  var sirr = { etat: null, toile: null, appel: false };
  var invitation = { code: null, envoi: false };
  var parrain = { envoi: false, dernier: null };
  var epreuve = { question: null, minuterie: 0, envoi: false };  // l'Imtihan en cours (imtihan.js)
  var souk = { tapis: null, moi: null, devoile: false, envoi: false, fiche: null, edition: null, vue: null,   // LA ferracha, celle du site (souk.js)
               derbFiltre: { besoin: "", forme: "" }, derbNeuf: false, parrainages: null };   // v8.7 — le Derb t-Tadamoun (tadamoun.js)
  // v5.7 — la Rahba : le Souk devenu une place (rahba.js) ; la Qissaria, la vitrine de la
  // maison (le catalogue tenu en base) ; mes affaires (safqa.js, zawia-safqa.sql)
  // v7.7 — le Mechouar : la place de l'arène. `vue` dit ce que le panneau montre.
  var mechouar = { active: false, etat: null, vue: "accueil", joute: null, faits: [], i: 0,
                   score: 0, reste: 0, minuteur: null, cas: null, peser: null };
  // v8.1 — `suivie` : la vitrine qu'on vient d'ouvrir, gardée parce que le catalogue
  // arrive APRÈS le rendu (chargerQissaria est asynchrone) — sans elle, un clic venu
  // des maharat ouvrirait la Qissaria sans mettre en avant la bonne fiche.
  var rahba = { active: false, places: [], mienne: null, debordement: [], marchands: 0, vitrines: [], catalogue: [], rayons: [], suivie: null,
                derb: { places: [], mienne: null, debordement: [], porteurs: 0 }, projets: 0, dansDerb: false };   // v8.7 — le Derb t-Tadamoun
  var safqa = { liste: [], aTraiter: 0, envoi: false, fil: null };
  var CLE_MUET = "zwj.muet";

  function muetEnregistre() {
    try { return localStorage.getItem(CLE_MUET) === "1"; } catch (e) { return false; }
  }
  function enregistrerMuet(v) {
    try { localStorage.setItem(CLE_MUET, v ? "1" : "0"); } catch (e) { /* navigation privée : tant pis */ }
  }
  function majBoutonSon() {
    var b = $("#zj-son");
    if (!b || !orchestre) return;
    var m = orchestre.etat().silencieux;
    b.textContent = m ? "🔇" : "♪";
    b.setAttribute("aria-pressed", m ? "true" : "false");
    // ⚠️ Ne plus annoncer un ṭab' et un mizan : depuis que le fond est un
    //    morceau enregistré, ils ne règlent que les effets — les afficher
    //    comme « ce qui joue » serait faux.
    b.title = m ? "Remettre la musique" : "Couper la musique — " + orchestre.etat().nomLieu;
  }
  // Un navigateur refuse de jouer avant un geste : on ne démarre qu'ici.
  function reveillerMusique() {
    if (!orchestre) return;
    orchestre.reveiller();
    orchestre.demarrer();   // la Porte et l'Atelier ont leur ambiance, eux aussi
    majBoutonSon();
  }
  function sonner(nom) { if (orchestre) orchestre.effet(nom); }

  // ---- Le tutoriel : la première Arb3ine guidée (tutoriel.js) ------------------------
  // Le mou'allim de Fès mène six pas — un par geste, puis un par axe. Les
  // étapes, les dialogues et le chemin du fil d'or vivent dans tutoriel.js
  // (pur, testé) ; ici on branche les événements et on dessine. L'état vit
  // dans joueur.recit.tutoriel — { etape: n } en cours, { fini: iso } après.
  // ⚠️ Rien ici ne crédite un compteur : les circuits existants récompensent.
  var tuto = { actif: false, etapes: null, index: 0, enAttente: null, fil: null, deTuile: "" };
  // v3.6 — le fil d'or du Wird (« M'y mener ») : le même BFS, la même perle,
  // vers la tuile du Wird du jour. Il s'éteint quand on y est, ou quand le
  // Wird est tenu. Jamais en même temps que celui du mou'allim.
  var guide = { tuile: null, fil: null, deTuile: "", jeu: false };   // v5.1 — jeu : le fil mène à un jeu, pas au Wird

  function etapeTuto() { return tuto.etapes ? tuto.etapes[tuto.index] : null; }

  function demarrerTutoriel(reprise) {
    if (!Tt || !joueur) return;
    tuto.etapes = Tt.etapes(lignee.maison, Tq && joueur && joueur.tariqa ? Tq.premierGeste(joueur.tariqa, lignee.maison) : "");   // v7.0 — le premier geste de la tariqa
    var etat = Tt.normaliser(joueur.recit ? joueur.recit.tutoriel : null);
    tuto.index = reprise && etat && typeof etat.etape === "number" ? Math.min(etat.etape, tuto.etapes.length - 1) : 0;
    tuto.actif = true;
    tuto.enAttente = null; tuto.fil = null; tuto.deTuile = "";
    ecrireEtapeTuto();
    majBanniere();
    ouvrirEtapeTuto();
  }

  function relancerTutoriel() {
    if (!joueur) return;
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    delete joueur.recit.tutoriel;
    demarrerTutoriel(false);
  }

  function ecrireEtapeTuto() {
    if (!joueur) return;
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.tutoriel = { etape: tuto.index };
    sauvegarderJoueur();
  }

  function dialogueEtape(e) {
    var d = { nom: e.debut.nom, pages: e.debut.pages };
    if (e.echauffement) d.qcm = { defi: Tt.ECHAUFFEMENT, essais: 0, blanc: true };
    if (e.fin) d.apres = finirTutoriel;   // la fin se scelle quand on referme la boîte
    return d;
  }

  function ouvrirEtapeTuto() {
    var e = etapeTuto();
    if (e) ouvrirDialogue(dialogueEtape(e));
  }

  // Le signal qu'une étape attend : envoyé par les circuits existants (agir,
  // repondre, choisir, les salles). Un signal d'une autre étape ne fait rien —
  // le tutoriel guide, il n'enferme pas.
  function tutorielEvenement(nom) {
    var e = etapeTuto();
    if (!tuto.actif || !e || e.evenement !== nom) return;
    tuto.index += 1;
    tuto.fil = null; tuto.deTuile = "";
    var suivant = etapeTuto();
    if (!suivant) { finirTutoriel(); return; }
    ecrireEtapeTuto();
    majBanniere();
    var d = dialogueEtape(suivant);
    // Une boîte ou une salle est presque toujours ouverte à cet instant : le
    // mou'allim attend qu'on la referme avant de reprendre la parole.
    if (cour.dialogue || panneauOuvert()) tuto.enAttente = d;
    else ouvrirDialogue(d);
  }

  function libererTutoriel() {
    if (!tuto.enAttente || cour.dialogue || panneauOuvert()) return;
    var d = tuto.enAttente;
    tuto.enAttente = null;
    ouvrirDialogue(d);
  }

  function finirTutoriel() {
    if (!tuto.actif) return;
    tuto.actif = false; tuto.enAttente = null; tuto.fil = null;
    if (joueur) {
      joueur.recit = Rc.normaliserRecit(joueur.recit);
      joueur.recit.tutoriel = { fini: new Date().toISOString() };
      sauvegarderJoueur();
    }
    majBanniere();
    // v3.6 — le mou'allim remet le Wird en main, une fois : le chemin des
    // quarante jours s'ouvre quand son tutoriel se referme (ou se laisse).
    if (joueur && Wd && !(joueur.recit.wird && joueur.recit.wird.presente)) {
      var w = Object.assign({}, Wd.lireEtat(joueur.recit), { presente: true });
      joueur.recit.wird = w;
      sauvegarderJoueur();
      rafraichirHud();
      setTimeout(function () { if (!cour.dialogue && !panneauOuvert()) ouvrirWird(); }, 250);
    }
  }

  function majBanniere() {
    var b = $("#zj-tuto");
    if (!b) return;
    var e = etapeTuto();
    if (!tuto.actif || !e || e.fin) { b.hidden = true; return; }
    b.hidden = false;
    var n = tuto.etapes.length - 1;   // la fin n'est pas un pas
    $("#zj-tuto-texte").textContent = "Le mou'allim · " + (tuto.index + 1) + "/" + n + " — " + e.consigne;
  }

  // Le fil d'or : recalculé au changement de tuile (BFS de tutoriel.js),
  // dessiné PAR-DESSUS la scène avec la caméra que rendu.js vient de rendre.
  function dessinerFil(cam) {
    var e = etapeTuto();
    var porteur = null, cible = null;
    if (tuto.actif && e && e.tuile && !rahba.active) { porteur = tuto; cible = e.tuile; }   // v5.7 — sur la Rahba, le losange d'or de ma place guide, pas le fil
    else if (guide.tuile) { porteur = guide; cible = guide.tuile; }   // v3.6 — le fil du Wird
    if (!porteur || !cam || !cour.ctx) return;
    var p = cour.perso;
    var tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T);
    var cle = tx + "," + ty;
    if (cle !== porteur.deTuile) { porteur.deTuile = cle; porteur.fil = Tt.cheminVers(M, tx, ty, cible); }
    if (!porteur.fil) return;
    // le fil du Wird s'éteint une fois arrivé — à une tuile de la cible, on y est
    if (porteur === guide && porteur.fil.chemin.length <= 2) { guide.tuile = null; guide.fil = null; return; }
    var ctx = cour.ctx, z = cam.zoom;
    var battement = mouvementReduit ? 0.55 : 0.35 + 0.3 * Math.sin(cour.t * 4);
    // v3.0 : sur le zellige peint, l'or seul se fond dans l'or des étoiles —
    // chaque perle du fil porte un liseré sombre, puis l'or par-dessus
    for (var i = 1; i < porteur.fil.chemin.length; i++) {
      var c = porteur.fil.chemin[i];
      var sx = (c.x * T + T / 2 - cam.camX + cam.ox) * z, sy = (c.y * T + T / 2 - cam.camY + cam.oy) * z;
      ctx.fillStyle = "rgba(29, 26, 46, " + (battement * 0.9).toFixed(3) + ")";
      ctx.fillRect(Math.round(sx - 1.5 * z), Math.round(sy - 1.5 * z), 3 * z, 3 * z);
      ctx.fillStyle = "rgba(240, 190, 70, " + Math.min(1, battement + 0.3).toFixed(3) + ")";
      ctx.fillRect(Math.round(sx - z), Math.round(sy - z), 2 * z, 2 * z);
    }
    // la balise : un losange d'or qui respire au-dessus de la tuile visée
    var cb = porteur.fil.cible;
    var bx = (cb.x * T + T / 2 - cam.camX + cam.ox) * z;
    var by = (cb.y * T - 4 - cam.camY + cam.oy) * z + (mouvementReduit ? 0 : Math.sin(cour.t * 3) * 2 * z);
    ctx.fillStyle = "#e6b13f";
    ctx.beginPath();
    ctx.moveTo(bx, by - 3 * z); ctx.lineTo(bx + 2 * z, by); ctx.lineTo(bx, by + 3 * z); ctx.lineTo(bx - 2 * z, by);
    ctx.closePath(); ctx.fill();
  }

  // ---- L'intro : le voyage dans le temps ---------------------------------------------
  // Jouée UNE fois, à la première visite, par-dessus la Porte — et rejouable
  // par le lien de la Porte : le voyage vers l'ère où ce pays transmettait le
  // savoir mieux que personne, et la raison d'être — un Maroc d'excellence,
  // horizon 2040.
  //
  // DEUX FORMES, dans cet ordre :
  //  1. LE FILM (assets/video/), une minute, raconté. Il est servi par la
  //     maison et par PERSONNE D'AUTRE : un lecteur embarqué affiche toujours
  //     le nom de la chaîne qui l'héberge et le bouton « regarder sur … », et
  //     le voile (ZAWIA-VOILE.md) tomberait pour chaque joueur. Le prix à
  //     payer est deux fichiers dans le dépôt ; il est moins cher que le voile.
  //  2. LES SIX PHOTOS dessinées en code (intro.js), si le film ne peut pas
  //     jouer : pas de <video>, MP4 refusé, réseau coupé. Le récit passe quand
  //     même — sur ce sujet, l'échec retombe du côté de l'histoire racontée.
  //
  // `zwj.intro` retient qu'on l'a vue ; si le localStorage est muet
  // (navigation privée), on la considère vue après le premier passage de la
  // session — jamais une boucle.
  var intro = { actif: false, film: false, scene: -1, peintre: null, raf: 0, t0: 0, minuterie: 0, vueSession: false, orchestreCoupe: false, muetAvant: false };
  var CLE_INTRO = "zwj.intro";

  // Le film existe en deux tailles. L'attribut `media` d'un <source> vidéo
  // n'est PAS honoré par les navigateurs (contrairement à <picture>) : le
  // choix se fait donc ici. Un petit écran — ou un forfait qui demande grâce —
  // prend la 720 : moitié moins lourde, et l'image est peinte, pas filmée.
  var FILM = { dossier: "assets/video/zawia-intro-", version: "?v=85" };
  // v2.4 — les portraits peints partagent le ?v= du film : /assets/* est servi
  // immutable un an, un visage remplacé sans bump ne descendrait jamais.
  var PORTRAITS = { dossier: "assets/img/zawia/jeu/mourchid-", version: FILM.version };
  // v3.4 — les cartes de la Dhakira : un portrait peint par page perdue,
  // même dossier, même version que les Mourchidine (un test le garde).
  var CARTES = { dossier: "assets/img/zawia/jeu/page-", version: FILM.version };
  // v7.3 — les sept toiles du Voilé. Même dossier, autre préfixe ; la version
  // suit celle du film et des scripts (/assets/* est immutable un an).
  var TOILES = { dossier: "assets/img/zawia/jeu/", version: FILM.version };
  // Bab — une MAISON cliente pose ses propres dossiers (window.ZWJ_MAISON.chemins,
  // voir assets/js/zawia-jeu/maison.js) : son film, ses portraits, ses cartes.
  // Les lignes ci-dessus gardent les chemins de Zawia, que des tests figent ; ce
  // bloc ne les remplace que si une maison est déclarée. Sans maison, rien ne change.
  // Bab — ce qu'une maison fait taire (ZWJ_MAISON.taire) : un module de Zawia qui,
  // chez elle, ne se propose pas (la tariqa, par exemple).
  function maisonTait(m) {
    var c = window.ZWJ_MAISON;
    return !!(c && Array.isArray(c.taire) && c.taire.indexOf(m) >= 0);
  }
  // Bab — une salle qu'une maison rend MUETTE (ZWJ_MAISON.salles.muettes) : sa case
  // ne parle plus que par son dialogue de maison, et l'on n'entre pas.
  function maisonSalleMuette(cle) {
    var t = ZWJ.maison && ZWJ.maison.salleMuette ? ZWJ.maison.salleMuette(cle) : false;
    if (!t) return false;
    basculerMenu(false);
    var d = typeof t === "string" && M.dialogue ? M.dialogue(t, { joueur: joueur }) : null;
    if (d) ouvrirDialogue(d);
    return true;
  }
  (function () {
    var ch = window.ZWJ_MAISON && window.ZWJ_MAISON.chemins;
    if (!ch) return;
    if (ch.film) FILM.dossier = ch.film;
    if (ch.portraits) PORTRAITS.dossier = ch.portraits;
    if (ch.cartes) CARTES.dossier = ch.cartes;
    if (ch.toiles) TOILES.dossier = ch.toiles;
    // la version des médias d'une maison : un film ou un portrait repeint change
    // d'adresse, sinon le navigateur garde l'ancien (le piège du ?v= immuable)
    if (ch.version) { FILM.version = ch.version; PORTRAITS.version = ch.version; CARTES.version = ch.version; TOILES.version = ch.version; }
  })();

  function sourceDuFilm() {
    var eco = false;
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      eco = !!(c && (c.saveData || /(^|\W)2g$/i.test(c.effectiveType || "")));
    } catch (e) { /* le navigateur ne dit rien : on suppose une ligne correcte */ }
    var cote = Math.max(window.innerWidth || 0, window.innerHeight || 0) * (window.devicePixelRatio || 1);
    return FILM.dossier + (!eco && cote >= 1100 ? "1080" : "720") + ".mp4" + FILM.version;
  }

  function montrerLancer(oui) {
    var voile = $("#zj-intro-lancer");
    if (voile) voile.hidden = !oui;
  }

  function majBoutonSonFilm() {
    var film = $("#zj-intro-film"), b = $("#zj-intro-son");
    if (!film || !b) return;
    var coupe = !!film.muted;
    b.textContent = coupe ? "🔇" : "♪";
    b.setAttribute("aria-pressed", coupe ? "true" : "false");
    b.setAttribute("aria-label", coupe ? "Remettre le son du film" : "Couper le son du film");
  }

  // Le film est raconté : l'Āla par-dessus la voix ferait deux récits à la
  // fois. On tait l'orchestre le temps de l'intro, et on rend au joueur
  // EXACTEMENT le réglage qu'il avait.
  // ⚠️ Arrêter ne suffit pas — vérifié à l'écran le 14/09/2026, l'oud jouait
  //    par-dessus la narration : `demarrer()` se rappelle d'ailleurs (le
  //    premier geste, le changement d'écran, le retour d'onglet) et repart.
  //    Le mode muet, lui, tient quel que soit qui relance.
  function taireOrchestrePourFilm() {
    if (!orchestre || intro.orchestreCoupe) return;
    intro.orchestreCoupe = true;
    try {
      intro.muetAvant = !!orchestre.etat().silencieux;   // ce que le joueur avait choisi
      orchestre.muet(true);
      orchestre.arreter();
    } catch (e) { /* pas encore réveillé : rien à taire */ }
  }
  function rendreOrchestre() {
    if (!intro.orchestreCoupe) return;
    intro.orchestreCoupe = false;
    if (!orchestre) return;
    try {
      orchestre.muet(intro.muetAvant);
      orchestre.demarrer();   // le film a déjà ouvert le son : la Porte retrouve son ambiance
      majBoutonSon();
    } catch (e) { /* il repartira au prochain écran */ }
  }

  function introVue() {
    if (intro.vueSession) return true;
    try { return !!localStorage.getItem(CLE_INTRO); } catch (e) { return false; }
  }
  function marquerIntroVue() {
    intro.vueSession = true;
    try { localStorage.setItem(CLE_INTRO, new Date().toISOString()); } catch (e) { /* navigation privée : tant pis */ }
  }

  function ouvrirIntro() {
    if (intro.actif) return;
    var panneau = $("#ecran-intro");
    if (!panneau) return;
    panneau.hidden = false;   // avant toute mesure : caché, rien n'a de taille
    intro.actif = true;
    intro.film = false;
    panneau.classList.remove("zj-intro--film");
    if (ouvrirFilm(panneau)) return;
    if (ouvrirPhotos(panneau)) return;
    // ni film ni dessin : la Porte suffit, et on ne la redemande pas
    intro.actif = false;
    panneau.hidden = true;
    marquerIntroVue();
  }

  // Le film. Rend false quand ce navigateur ne sait pas lire de MP4 —
  // les photos prennent alors le relais, sans que le joueur voie la bascule.
  function ouvrirFilm(panneau) {
    var film = $("#zj-intro-film");
    if (!film || typeof film.canPlayType !== "function" || !film.canPlayType("video/mp4")) return false;

    intro.film = true;
    panneau.classList.add("zj-intro--film");
    film.hidden = false;
    var barre = $("#zj-intro-barre"), son = $("#zj-intro-son");
    if (barre) { barre.hidden = false; barre.firstChild.style.width = "0%"; }
    if (son) son.hidden = false;
    taireOrchestrePourFilm();

    if (!film.getAttribute("src")) film.setAttribute("src", sourceDuFilm());
    try { film.currentTime = 0; } catch (e) { /* métadonnées pas encore là : il part de zéro */ }
    film.muted = false;
    majBoutonSonFilm();

    // Mouvement réduit : on ne lance rien tout seul. L'affiche est posée, le
    // joueur décide — comme les six photos restent immobiles dans ce mode.
    if (mouvementReduit) { montrerLancer(true); return true; }

    // Le son ne part pas sans un geste : un navigateur refuse une lecture
    // sonore que personne n'a demandée. On tente — et si c'est refusé, on
    // pose l'affiche et un bouton, ce qui EST le geste. Jamais de lecture
    // muette : ce film est raconté, l'image seule n'en dirait que la moitié.
    lancerFilm(film);
    return true;
  }

  function lancerFilm(film) {
    var promesse;
    try { promesse = film.play(); }
    catch (e) { montrerLancer(true); return; }
    if (promesse && typeof promesse.then === "function") {
      promesse.then(function () { montrerLancer(false); }, function () { montrerLancer(true); });
    } else {
      montrerLancer(false);   // vieux navigateur : play() ne rend pas de promesse
    }
  }

  // Les six photos dessinées (intro.js). Rend false si le canvas est refusé.
  function ouvrirPhotos(panneau) {
    if (!In) return false;
    if (!intro.peintre) {
      try { intro.peintre = In.creer($("#zj-intro-scene")); }
      catch (e) { return false; }   // sans dessin, pas d'intro
    }
    intro.film = false;
    if (panneau) panneau.classList.remove("zj-intro--film");
    intro.peintre.redimensionner();
    var points = $("#zj-intro-points");
    if (points) points.innerHTML = In.SCENES.map(function () { return "<span></span>"; }).join("");
    allerScene(0);
    cancelAnimationFrame(intro.raf);
    intro.raf = requestAnimationFrame(boucleIntro);
    return true;
  }

  // Le film s'est cassé en route (fichier absent, codec refusé, réseau tombé) :
  // on ne laisse pas un écran noir, on repasse aux photos.
  function basculerVersPhotos() {
    if (!intro.actif || !intro.film) return;
    var panneau = $("#ecran-intro"), film = $("#zj-intro-film");
    if (film) { try { film.pause(); } catch (e) { /* déjà arrêté */ } film.hidden = true; }
    montrerLancer(false);
    var barre = $("#zj-intro-barre"), son = $("#zj-intro-son");
    if (barre) barre.hidden = true;
    if (son) son.hidden = true;
    rendreOrchestre();
    // Bab — les six photos dessinées racontent la Qarawiyine : une maison qui ne
    // les reprend pas (ZWJ_MAISON.sansPhotos) passe droit à la Porte si son film manque.
    if (window.ZWJ_MAISON && window.ZWJ_MAISON.sansPhotos) { fermerIntro(); return; }
    if (!ouvrirPhotos(panneau)) fermerIntro();
  }

  function allerScene(i) {
    intro.scene = i;
    intro.t0 = performance.now();
    var sc = In.SCENES[i];
    var bloc = $("#zj-intro-texte");
    if (bloc) bloc.classList.remove("visible");
    // le texte change pendant que le bloc est fondu, puis revient
    setTimeout(function () {
      if (!intro.actif || intro.scene !== i) return;
      $("#zj-intro-epoque").textContent = sc.epoque;
      $("#zj-intro-titre").textContent = sc.titre;
      $("#zj-intro-corps").textContent = sc.texte;
      if (bloc) bloc.classList.add("visible");
    }, mouvementReduit ? 0 : 260);
    var suite = $("#zj-intro-suite");
    if (suite) suite.textContent = i + 1 >= In.SCENES.length ? "Entrer" : "Suite";
    $$("#zj-intro-points span").forEach(function (p, k) { p.className = k <= i ? "actif" : ""; });
    // l'auto-avance laisse le temps de lire ; en mouvement réduit, on clique.
    clearTimeout(intro.minuterie);
    if (!mouvementReduit) intro.minuterie = setTimeout(avancerIntro, In.duree(sc.texte) * 1000);
  }

  function avancerIntro() {
    if (intro.film) return;   // le film déroule seul : on ne saute pas de chapitre
    clearTimeout(intro.minuterie);
    if (!intro.actif) return;
    if (intro.scene + 1 < In.SCENES.length) allerScene(intro.scene + 1);
    else fermerIntro();
  }

  // Pendant le film, un clic ou la barre d'espace met en pause — le geste
  // naturel devant une vidéo, et de quoi souffler sans tout passer.
  function basculerPauseFilm() {
    var film = $("#zj-intro-film");
    if (!film || film.hidden) return;
    if (film.paused) lancerFilm(film); else film.pause();
  }

  function fermerIntro() {
    clearTimeout(intro.minuterie);
    cancelAnimationFrame(intro.raf);
    if (!intro.actif) return;
    intro.actif = false;
    marquerIntroVue();
    var film = $("#zj-intro-film");
    if (film) { try { film.pause(); } catch (e) { /* déjà arrêté */ } }
    montrerLancer(false);
    rendreOrchestre();
    intro.film = false;
    var panneau = $("#ecran-intro");
    if (panneau) panneau.hidden = true;
    // sinon, à la relecture, le dernier texte referait un fondu de sortie
    var bloc = $("#zj-intro-texte");
    if (bloc) bloc.classList.remove("visible");
    var email = $("#zj-email");
    if (email && ecran === "porte") setTimeout(function () { email.focus(); }, 60);
    // v3.6 — le Morchid rejoue le début : la cour reprend quand l'intro se referme
    if (intro.apres) { var apres = intro.apres; intro.apres = null; apres(); }
  }

  // ---- v3.6 — LE MORCHID REJOUE LE DÉBUT ------------------------------------------------
  // « Je veux que le joueur me@… soit capable de refaire le début du jeu autant
  // de fois qu'il veut » (Youssef, 15/09/2026) : pour tester facilement et
  // souvent. Pour le Morchid SEUL (la base dit qui : zawia_morchid), touche R
  // ou le bouton du menu. Ce qui repart de zéro est ce que le navigateur
  // écrit déjà pour son porteur — pages, Ta7addi, Sna3a, Dhakira, défis, récit
  // (prologue, tutoriel, Wird, daftar), position, début de l'Arb3ine —, le
  // masque est retiré, l'intro rejoue, puis le prologue, puis le mou'allim.
  // Ce que la BASE tient reste : l'Imtihan (une question ne se repose jamais),
  // les rencontres, le M39ol, les présences, les étals du Souk.
  // ⚠️⚠️ v8.2 (23/09/2026) — AU COMPTE D'ESSAI DU MORCHID SEUL (`morchid.essai`,
  // zawia_morchid.essai en base). Le compte PRINCIPAL du Morchid ne rejoue
  // jamais le début : ce geste lui a effacé sa Dhakira et ses pages le 23/09.
  // L'écran cache le bouton et le raccourci ; la garde de zawia_joueurs refuse
  // en plus de réécrire le début de l'Arb3ine à tout compte qui n'est pas
  // d'essai — quoi que l'écran fasse (la sauvegarde entière est refusée, rien
  // n'est perdu).
  function rejouerLeDebut() {
    if (!morchid.essai || !joueur) return;
    // ⚠️⚠️ 23/09/2026 — ce geste a effacé la Dhakira et les pages d'un membre, et
    // il a fallu la base pour comprendre ce qui s'était passé. Deux gardes :
    //  1. la confirmation échoue FERMÉE. Elle échouait ouverte (`catch { ok = true }`)
    //     — une boîte indisponible effaçait tout sans rien demander. Sur un geste
    //     destructeur, ne pas pouvoir demander veut dire ne pas faire.
    //  2. on redit ce qui ne revient pas. Les pages retrouvées ne se restaurent
    //     pas : leurs clés ne sont écrites nulle part ailleurs.
    var ok = false;
    try {
      var q = "Rejouer le début ? Les pages retrouvées et la Dhakira sont EFFACÉES, et rien ne les rend : il faudra les retrouver une à une. Ta7addi, récit, Wird et Arb3ine repartent aussi de zéro. L'Imtihan, les rencontres, le M39ol et le Souk restent : la base les tient.";
      ok = window.confirm(Lg ? Lg.t(q) : q);
    } catch (e) { ok = false; }
    if (!ok) return;
    basculerMenu(false);
    fermerDialogue();
    [fermerWird, fermerCartes, fermerKharita, fermerRiwaq, fermerBibliotheque, fermerSouk, fermerSafqa, fermerQissaria, fermerTableau].forEach(function (f) { try { f(); } catch (e) { /* déjà fermé */ } });
    if (morchid.masque) incarner("0");
    joueur.pages = {};
    joueur.tahaddi = {};
    joueur.sna3a = R.sna3aParDefaut();
    joueur.dhakira = 0;
    joueur.defis = R.defisParDefaut();
    joueur.recit = {};
    joueur.position = null;
    joueur.arb3ineDebut = new Date().toISOString();
    tuto.actif = false; tuto.enAttente = null; tuto.fil = null;
    guide.tuile = null; guide.fil = null;
    sauvegarderJoueur();
    try { localStorage.removeItem(CLE_INTRO); } catch (e) { /* navigation privée */ }
    intro.vueSession = false;
    // l'intro d'abord ; à sa fermeture, la cour se rouvre — et le prologue avec
    intro.apres = function () { entrerCour(joueur); };
    ouvrirIntro();
    if (!intro.actif) { var apres = intro.apres; intro.apres = null; if (apres) apres(); }
  }

  function boucleIntro(now) {
    if (!intro.actif) return;
    // en mouvement réduit, la photo est posée : t reste à zéro
    intro.peintre.rendre(intro.scene, mouvementReduit ? 0 : (now - intro.t0) / 1000);
    intro.raf = requestAnimationFrame(boucleIntro);
  }

  function brancherIntro() {
    var panneau = $("#ecran-intro");
    if (!panneau) return;
    var passer = $("#zj-intro-passer");
    if (passer) passer.addEventListener("click", function (ev) { ev.stopPropagation(); fermerIntro(); });
    var suite = $("#zj-intro-suite");
    if (suite) suite.addEventListener("click", function (ev) { ev.stopPropagation(); avancerIntro(); });
    panneau.addEventListener("click", function () {
      if (intro.film) basculerPauseFilm(); else avancerIntro();
    });

    // Le film : le bouton du voile de lancement, le son, la jauge, la fin.
    var film = $("#zj-intro-film"), voile = $("#zj-intro-lancer");
    if (voile) voile.addEventListener("click", function (ev) {
      ev.stopPropagation();
      montrerLancer(false);
      if (film) { film.muted = false; majBoutonSonFilm(); lancerFilm(film); }
    });
    var son = $("#zj-intro-son");
    if (son) son.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (!film) return;
      film.muted = !film.muted;
      majBoutonSonFilm();
    });
    if (film) {
      film.addEventListener("ended", function () { fermerIntro(); });
      film.addEventListener("error", function () { basculerVersPhotos(); });
      film.addEventListener("timeupdate", function () {
        var barre = $("#zj-intro-barre");
        if (!barre || barre.hidden || !film.duration) return;
        barre.firstChild.style.width = Math.min(100, (film.currentTime / film.duration) * 100).toFixed(2) + "%";
      });
      // Une source qui ne se charge pas ne lève pas toujours `error` sur la
      // balise : celle du <video> lui-même est le filet qui reste.
      film.addEventListener("stalled", function () { if (film.networkState === 3) basculerVersPhotos(); });
    }

    document.addEventListener("keydown", function (ev) {
      if (!intro.actif) return;
      if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
      if (ev.key === "Escape") { ev.preventDefault(); fermerIntro(); return; }
      if (ev.key === " " || ev.code === "Space" || ev.key === "Enter") {
        ev.preventDefault();
        if (intro.film) basculerPauseFilm(); else avancerIntro();
      }
    });
    window.addEventListener("resize", function () { if (intro.actif && !intro.film && intro.peintre) intro.peintre.redimensionner(); });
    // Un onglet caché ne se lit pas : le film se met en pause, l'auto-avance
    // s'arrête et redonne la scène entière au retour — l'intro ne défile
    // jamais dans le dos du joueur.
    document.addEventListener("visibilitychange", function () {
      if (!intro.actif) return;
      if (intro.film) {
        if (!film || film.hidden) return;
        if (document.hidden) { try { film.pause(); } catch (e) { /* déjà arrêté */ } }
        else if (voile && voile.hidden) lancerFilm(film);
        return;
      }
      if (mouvementReduit || intro.scene < 0) return;
      clearTimeout(intro.minuterie);
      if (!document.hidden) intro.minuterie = setTimeout(avancerIntro, In.duree(In.SCENES[intro.scene].texte) * 1000);
    });
    var revoir = $("#zj-intro-revoir");
    if (revoir) revoir.addEventListener("click", function (ev) { ev.preventDefault(); ouvrirIntro(); });
  }

  // ---- Les écrans -------------------------------------------------------------------
  function afficher(nom) {
    ecran = nom;
    ["porte", "atelier", "cour"].forEach(function (e) {
      var el = $("#ecran-" + e);
      if (el) el.hidden = e !== nom;
    });
    document.body.setAttribute("data-ecran", nom);
    if (orchestre && nom !== "cour") { orchestre.allerA(nom === "atelier" ? "atelier" : "porte"); majBoutonSon(); }
    if (nom === "cour") demarrerCour(); else arreterCour();
    if (nom === "atelier") demarrerAtelier(); else arreterAtelier();
  }

  function message(sel, texte, type) {
    var el = $(sel);
    if (!el) return;
    el.textContent = texte || "";
    el.className = "zj-msg" + (type ? " " + type : "");
    el.hidden = !texte;
  }

  // ---- Le départ ---------------------------------------------------------------------
  function demarrer() {
    compte = C.creer(CFG);
    var local = compte.mode === "local";
    var bandeau = $("#zj-mode");
    if (bandeau) bandeau.hidden = !local;
    var tag = $("#zj-hud-mode");
    if (tag) tag.hidden = !local;
    // v2.6 — en atelier, la cour est à soi : ni compteur, ni « dire un mot ».
    var direB = $("#zj-menu-dire"), hs = $("#zj-hud-sahn");
    if (direB) direB.hidden = local;
    if (hs) hs.hidden = true;

    compte.surChangement(function (s) {
      // Déconnecté ailleurs (autre onglet) : on referme la cour proprement.
      if (!s && ecran === "cour") { joueur = null; afficher("porte"); }
    });

    lireInvitation();
    lireHanout();   // v7.8 — le lien du hanout : d'où l'on vient, et l'entrée en invité

    // v4.5 — un lien de retour dans le fragment : il ouvre une session à lui
    // seul, et la Porte demande un nouveau mot de passe AVANT la cour. Sans
    // ça, on entrerait sans jamais poser de mot de passe — et on serait
    // ressorti aussi perdu qu'avant.
    var retour = Pr.recuperationDepuis(window.ZWJ_RETOUR);
    window.ZWJ_RETOUR = null;
    if (retour) return ouvrirRetour(retour);

    compte.session().then(function (s) {
      // Personne : la Porte — et, la toute première fois, l'intro par-dessus.
      if (!s) { afficher("porte"); if (!introVue()) ouvrirIntro(); suivreLeHanout(); return; }
      return reclamerLignee().then(function () {
        if (!admission.admis) { fermerLaPorte(); return; }
        return compte.lireJoueur().then(function (j) {
          if (j) entrerCour(j); else afficher("atelier");
        });
      });
    }).catch(function (e) {
      afficher("porte");
      message("#zj-porte-msg", "La maison ne répond pas : " + (e && e.message ? e.message : "réessaie."), "ko");
    });
  }

  // La lignée se demande au serveur AVANT de lire le personnage, aux DEUX
  // endroits où une session devient vivante : la session restaurée (demarrer)
  // et la connexion fraîche (brancherPorte). La RPC est idempotente côté
  // serveur — un lauréat inscrit avant que le bureau pose sa liste est
  // reconnu à la connexion suivante, jamais perdu. En cas de panne : Talib
  // libre, et la base refuse de toute façon ce que l'écran aurait laissé passer.
  function reclamerLignee() {
    return compte.reclamerChajara().then(function (r) {
      lignee = Cj.normaliser(r);
      morchid = Mo.depuis(r);
      majliss.membre = !!(r && r.majliss);
      admission = Pr.admission(r);
    }).catch(function () { lignee = Cj.normaliser(null); morchid = Mo.depuis(null); majliss.membre = false; admission = Pr.admission(null); });
  }

  // ---- v7.8 — MOUL L7ANOUT : qui vient du hanout -------------------------------------------
  // Le hanout (l3b.zawia.tech/hanout) est le jeu d'appel de la maison : un clicker
  // sans compte, dont la dernière marche — « fermer boutique et repartir plus fort » —
  // demande un mot qui ne se dit qu'ICI. Son lien porte `hanout=CODE` (d'où l'on
  // vient) et `dayf=1` (ouvrir l'entrée en invité). Le code sort de l'adresse et
  // reste pour l'onglet ; Ba Driss dit le mot (dayf.js), la base note la visite.
  function lireHanout() {
    var code = "", invite = false;
    try {
      var q = new URLSearchParams(location.search);
      code = String(q.get("hanout") || "").toUpperCase();
      invite = q.get("dayf") === "1";
      if (q.has("hanout") || q.has("dayf")) {
        q.delete("hanout"); q.delete("dayf");
        var reste = q.toString();
        history.replaceState(null, "", location.pathname + (reste ? "?" + reste : "") + location.hash);
      }
    } catch (e) { /* un vieux navigateur : il entrera par la Porte */ }
    try {
      if (Dy.estCodeHanout(code)) sessionStorage.setItem("zwj.hanout", code);
      else code = sessionStorage.getItem("zwj.hanout") || "";
    } catch (e2) { /* navigation privée stricte : le code ne vit que cette page */ }
    hanout.code = Dy.estCodeHanout(code) ? code : null;
    hanout.invite = invite;
  }
  // Personne n'est connecté et le lien demandait l'entrée en invité : on y va —
  // APRÈS le film la première fois (c'est l'accroche), tout de suite sinon.
  function suivreLeHanout() {
    if (!hanout.invite || joueur || dayf.actif) return;
    hanout.invite = false;
    if (intro.actif) { intro.apres = entrerEnInvite; return; }
    entrerEnInvite();
  }
  function noterVisiteHanout() {
    if (hanout.note || !hanout.code || !compte || typeof compte.hanoutVisite !== "function") return;
    hanout.note = true;
    try { compte.hanoutVisite(hanout.code); } catch (e) { /* un compteur ne casse pas une visite */ }
  }
  // Ba Driss dit le mot, une fois, quand la cour est libre : jamais par-dessus un
  // dialogue, un panneau, le menu, le tutoriel, ni hors de la cour.
  function direMotHanout() {
    if (!hanout.code || hanout.dit || !joueur || ecran !== "cour") return;
    if (cour.dialogue || panneauOuvert() || menuOuvert || tuto.actif || intro.actif || rahba.active || rihla.active) { setTimeout(direMotHanout, 3000); return; }
    var d = Dy.hanoutMot(hanout.code, jourDeLaMaison());
    if (!d) return;
    hanout.dit = true;
    ouvrirDialogue({ nom: d.nom, pages: d.pages.slice() });
    noterVisiteHanout();
  }

  // ---- v4.1 — Le parrainage à la Porte ------------------------------------------------
  // Le lien d'invitation : le script de tête a sorti le code de l'adresse et
  // l'a gardé pour l'onglet. On ouvre l'onglet « S'inscrire » et on dit qui
  // invite — la base le rend, jamais l'e-mail invité.
  function lireInvitation() {
    var code = null;
    try { code = sessionStorage.getItem("zwj.invitation"); } catch (e) { code = null; }
    if (!Pr.estCode(code)) code = window.ZWJ_INVITATION || Pr.codeDepuis(location.search);
    if (!Pr.estCode(code)) return;
    invitation.code = code;
    choisirOnglet("inscrire");
    compte.lireInvitation(code).then(function (r) {
      var t = Pr.lienTexte(r);
      message("#zj-porte-invitation", t.texte, t.ok ? "ok" : (r && r.raison === "atelier" ? "" : "ko"));
      if (!t.ok && r && r.raison !== "atelier") oublierInvitation();
    });
  }
  function oublierInvitation() {
    invitation.code = null;
    try { sessionStorage.removeItem("zwj.invitation"); } catch (e) { window.ZWJ_INVITATION = null; }
  }

  // Un compte sans admission : la porte fermée, la règle dite, et la sortie.
  function fermerLaPorte() {
    joueur = null;
    afficher("porte");
    document.body.classList.add("zj-porte-close");
    $("#zj-porte-fermee-titre").textContent = Pr.FERMEE.titre;
    $("#zj-porte-fermee-texte").textContent = Pr.FERMEE.texte;
    // v7.3 — et la sortie : on reçoit celui qu'on vient de refuser.
    var inv = $("#zj-porte-fermee-invite");
    if (inv) inv.textContent = Pr.FERMEE.invite;
    $("#zj-porte-fermee").hidden = false;
    message("#zj-porte-msg", "");
    message("#zj-porte-invitation", "");
    var b = $("#zj-porte-fermee-sortir");
    if (b) b.focus();
  }
  function rouvrirLaPorte() {
    document.body.classList.remove("zj-porte-close");
    $("#zj-porte-fermee").hidden = true;
  }

  // ---- v7.2 — LE DAYF : l'invité, reçu trois jours ------------------------------------
  // Une zawia hébergeait d'abord le voyageur. La coutume en donne la règle :
  // trois jours sans rien demander, et le troisième jour seulement l'hôte
  // demande ce qui amène son invité.
  //
  // ⚠️ Un Dayf n'a PAS de compte : `compte` n'est jamais appelé pour lui, ni
  //    pour lire, ni pour écrire. Tout vit dans son navigateur. La règle « pas
  //    de parrainage, pas de jeu » garde la cour ; ceci est la porte.
  var CLE_DAYF = "zwj.dayf", CLE_DAYF_JOUEUR = "zwj.dayf.joueur";

  function jourDeLaMaison() {
    try { return Km.jourCasa(); } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function lireDayf() {
    try { return Dy.normaliser(JSON.parse(localStorage.getItem(CLE_DAYF) || "null")); }
    catch (e) { return Dy.normaliser(null); }
  }
  function ecrireDayf(e) {
    dayf.etat = Dy.normaliser(e);
    try { localStorage.setItem(CLE_DAYF, JSON.stringify(dayf.etat)); } catch (e2) { /* navigation privée : il sera reçu une seconde fois */ }
  }
  function jourDayf() { return Dy.jour(dayf.etat, jourDeLaMaison()); }

  // Le personnage de l'invité vit là aussi — sinon il recommencerait l'atelier
  // chaque matin, et on ne fait pas recommencer un invité.
  function lireJoueurDayf() {
    try { return JSON.parse(localStorage.getItem(CLE_DAYF_JOUEUR) || "null"); } catch (e) { return null; }
  }
  function ecrireJoueurDayf() {
    if (!dayf.actif || !joueur) return;
    try { localStorage.setItem(CLE_DAYF_JOUEUR, JSON.stringify(joueur)); } catch (e) { /* tant pis */ }
  }

  // La porte de l'invité, sur la Porte. Rien n'est demandé : ni adresse, ni
  // mot de passe. On va droit à l'atelier — se faire un visage EST l'accueil.
  function entrerEnInvite() {
    dayf.actif = true;
    var e = lireDayf();
    if (!e.debut) e.debut = jourDeLaMaison();
    ecrireDayf(e);
    lignee = Cj.normaliser(null);          // un invité n'a pas de lignée, et le voile tient
    morchid = Mo.depuis(null);
    majliss.membre = false;
    admission = { admis: true, voie: "dayf", parrain: null };
    var j = lireJoueurDayf();
    if (j && j.pseudo) { entrerCour(j); return; }
    joueur = null;
    afficher("atelier");
  }

  // Ce qu'un invité peut atteindre. Hors mode invité, rien ne change.
  function peutDayf(cle) { return !dayf.actif || Dy.peut(cle, jourDayf()); }
  // Le refus qui ORIENTE : on n'éconduit pas un invité, on lui dit où aller.
  function refuserDayf(cle) {
    var r = Dy.refus(cle);
    ouvrirDialogue({ nom: r.nom, pages: r.pages.slice() });
  }
  // Une seule porte à franchir avant d'ouvrir une salle : vrai = c'est fermé,
  // et le refus est déjà dit.
  function dayfFerme(cle) {
    if (peutDayf(cle)) return false;
    refuserDayf(cle);
    return true;
  }

  // Ba Driss reçoit à la première entrée, puis dit ce qui s'ouvre chaque jour.
  // Il attend son tour : jamais par-dessus un dialogue, un panneau ou le menu.
  function accueillirDayf() {
    if (!dayf.actif || cour.dialogue || menuOuvert || panneauOuvert() || intro.actif) return;
    var j = jourDayf();
    if (!dayf.etat.accueil) {
      noterDayf("entree");
      // ⚠️ L'ORDRE : on MONTRE, puis on explique. La cour perd sa couleur,
      // l'invité le voit de ses yeux, et Ba Driss n'arrive qu'après pour lui
      // dire ce qu'il vient de voir. L'inverse ne retient personne.
      nsyanPasse();
      ouvrirDialogue({ nom: Dy.APPARITION.nom, pages: Dy.APPARITION.pages.slice(),
        apres: function () {
          ouvrirDialogue({ nom: Dy.accueil(joueur && joueur.pseudo).nom,
            pages: Dy.accueil(joueur && joueur.pseudo).pages.slice(), apres: nsyanReste });
        } });
      ecrireDayf(Object.assign({}, dayf.etat, { accueil: true }));
      dayf.vuLe = j;
      return;
    }
    if (j === Dy.JOURS && !dayf.etat.question) {
      // Le troisième jour : le mou'allim pose la question, puis les portes.
      var q = Dy.question(joueur && joueur.pseudo);
      ouvrirDialogue({ nom: q.nom, pages: q.pages.slice(), apres: ouvrirPortesDayf });
      ecrireDayf(Object.assign({}, dayf.etat, { question: true }));
      return;
    }
    if (dayf.etat.accueil) nsyanReste();   // il revient : la cour est encore à demi éteinte
    if (dayf.vuLe !== j) {
      var r = Dy.retour(j);
      if (dayf.vuLe && j === 2) noterDayf("jour2");
      if (dayf.vuLe && j === 3) noterDayf("jour3");
      dayf.vuLe = j;
      if (r) ouvrirDialogue({ nom: r.nom, pages: r.pages.slice() });
    }
  }

  // Nsyan traverse : la toile perd sa couleur, puis la retrouve. Aucun sprite —
  // « il n'a pas de visage, c'est le point » (recit.js). Ce qu'on voit de lui,
  // c'est ce qu'il emporte.
  function nsyanPasse(secondes) {
    document.body.classList.add("zj-nsyan");
    document.body.classList.remove("zj-nsyan-reste");
    clearTimeout(dayf.minuterie);
    if (!secondes) return;   // sans durée, il reste : c'est la page qui le fera reculer
    dayf.minuterie = setTimeout(function () { nsyanReste(); }, Math.max(1200, Number(secondes) * 1000));
  }
  // Il s'éloigne sans partir : la cour reste à demi éteinte tant qu'aucune page
  // n'est revenue. C'est ce qui donne son prix au sandouq.
  function nsyanReste() {
    clearTimeout(dayf.minuterie);
    document.body.classList.remove("zj-nsyan");
    if (dayf.actif && joueur && P.etat(joueur.pages).resolues === 0) document.body.classList.add("zj-nsyan-reste");
  }
  // Une page revenue REND la couleur, tout de suite et à l'écran : c'est la
  // seule récompense qu'un invité reçoive, et elle doit se voir.
  function nsyanRecule() {
    clearTimeout(dayf.minuterie);
    document.body.classList.remove("zj-nsyan");
    document.body.classList.remove("zj-nsyan-reste");
  }

  // ---- « Ach jabek ? » : les trois portes ----------------------------------------------
  // ⚠️ Atteignables depuis le menu DÈS LA PREMIÈRE MINUTE : les trois jours
  //    donnent, ils ne retiennent pas. Barrer la porte qu'on cherche à faire
  //    franchir serait l'erreur la plus bête possible.
  function adresseDossier() {
    // Aucun nom en dur : l'adresse se déduit du domaine, comme pour le partage.
    return /(^|\.)zawia\.tech$/i.test(location.hostname) ? "https://zawia.tech/#signer" : "/";
  }
  function ouvrirPortesDayf() {
    var corps = $("#zj-dyaf-portes-corps");
    if (!corps) return;
    corps.innerHTML = Dy.PORTES.map(function (p) {
      return '<button type="button" class="zj-bouton zj-bouton--discret zj-dyaf-porte" data-porte="' + esc(p.cle) + '">' +
        "<b>" + esc(p.nom) + "</b><span>" + esc(p.sous) + "</span></button>";
    }).join("");
    $$("#zj-dyaf-portes-corps .zj-dyaf-porte").forEach(function (b) {
      b.addEventListener("click", function () { choisirPorteDayf(b.getAttribute("data-porte")); });
    });
    $("#zj-dyaf-portes").hidden = false;
  }
  function fermerPortesDayf() { var el = $("#zj-dyaf-portes"); if (el) el.hidden = true; }

  function choisirPorteDayf(cle) {
    var p = Dy.porte(cle);
    if (!p) return;
    ecrireDayf(Object.assign({}, dayf.etat, { porte: cle }));
    noterDayf("porte_" + cle);
    fermerPortesDayf();
    ouvrirDialogue({ nom: p.voix || "Le mou'allim", pages: p.pages.slice(), apres: function () {
      // Bab — une porte de maison porte son geste (vie.js : postuler, être recontacté)
      if (p.geste) { if (ZWJ.vie && ZWJ.vie.geste) ZWJ.vie.geste(p.geste); return; }
      // Chaque porte mène à un geste RÉEL, jamais à un discours.
      if (cle === "batir") window.open(adresseDossier(), "_blank", "noopener");
      else if (cle === "apprendre") ouvrirBibliotheque();
      // « Je passais » ne mène nulle part, et c'est voulu : la porte reste
      // ouverte, le mou'allim a dit le mercredi, et on ne pousse pas un invité.
    } });
  }

  // ---- v7.3 — OUMM IA, et les cinq épreuves qui lui répondent ------------------------
  // Nsyan efface ce qui a été ; elle interdit ce qui pourrait être. On ne la
  // combat pas : on lui répond, cinq fois, par un geste.
  //
  // ⚠️ ELLE PARLE AVEC LA VOIX DU JOUEUR — la boîte porte SON pseudo. C'est
  //    tout le dispositif : on lit son propre nom en train de dire sa propre
  //    défaite. Un test l'exige.
  function etatOumm() { return Om.normaliserEtat(joueur && joueur.recit && joueur.recit.oumm); }
  function poserOumm(e) {
    if (!joueur) return;
    joueur.recit = joueur.recit || {};
    joueur.recit.oumm = Om.normaliserEtat(e);
    sauvegarderJoueur();
  }
  // Son emprise : cinq crans, un de moins par épreuve passée. À zéro, on la voit
  // pour ce qu'elle est — et la vue se dégage.
  function oummBrouille() {
    var reste = Om.EPREUVES.length - Om.comptees(etatOumm());
    if (reste <= 0) { document.body.removeAttribute("data-oumm"); document.body.style.removeProperty("--zj-oumm"); return; }
    document.body.setAttribute("data-oumm", String(reste));
    document.body.style.setProperty("--zj-oumm", String(reste));
  }
  function oummSeTait() { document.body.removeAttribute("data-oumm"); document.body.style.removeProperty("--zj-oumm"); }

  // v7.3 — le compteur anonyme. Une panne ne se voit jamais : on note, on
  // n'attend pas, et on ne dit rien si ça rate.
  function noterDayf(evenement) {
    // Bab — le carnet de visite d'une maison (vie.js) : l'entonnoir de Discovery, anonyme
    if (dayf.actif && ZWJ.vie && ZWJ.vie.noterVisite) { try { ZWJ.vie.noterVisite(evenement); } catch (e) { /* un compteur ne casse pas une visite */ } }
    if (!dayf.actif || !compte || typeof compte.noterDayf !== "function") return;
    try { compte.noterDayf(evenement); } catch (e) { /* un compteur ne casse pas une visite */ }
  }

  // Sa voix : le pseudo du joueur, jamais un nom à elle.
  function voixDeLui() { return (joueur && joueur.pseudo) || "Toi"; }

  function ouvrirOumm() {
    if (maisonSalleMuette("oumm")) return;   // Bab — muette chez une maison
    if (!joueur) return;
    basculerMenu(false);
    var e = etatOumm();
    oummBrouille();
    if (!e.vue) {
      var a = Om.arrivee(e.faites.length);
      poserOumm(Om.marquerVue(e));
      ouvrirDialogue({ nom: voixDeLui(), pages: a.pages.slice(), apres: epreuveSuivante });
      return;
    }
    epreuveSuivante();
  }

  function epreuveSuivante() {
    var p = Om.prochaine(etatOumm());
    if (!p) { finirOumm(); return; }
    // D'abord sa phrase, avec la voix du joueur. Puis l'épreuve qui y répond.
    ouvrirDialogue({ nom: voixDeLui(), pages: [p.oumm], apres: function () { poserEpreuve(p); } });
  }
  function poserEpreuve(p) {
    ouvrirDialogue({
      nom: "Épreuve — " + p.nom,
      pages: [p.enonce],
      qcm: { defi: p, essais: 0, oumm: true }
    });
  }

  function finirOumm() {
    oummSeTait();
    ouvrirDialogue({ nom: Om.DEVOILEMENT.nom, pages: Om.DEVOILEMENT.pages.slice(), apres: ouvrirDefiDuVoile });
  }

  // ---- Les sept tableaux du Voilé -------------------------------------------------------
  // ⚠️ Pas un nom, pas un outil, pas une maison. Sept faits réels, racontés
  //    comme on raconte. Une légende qui nommerait deviendrait une réclame.
  function ouvrirTableaux() {
    if (maisonSalleMuette("tableaux")) return;   // Bab — muette chez une maison
    var panneau = $("#zj-tableaux"), corps = $("#zj-tableaux-corps");
    if (!panneau || !corps) return;
    basculerMenu(false);
    fermerDialogue();
    var lead = $("#zj-tableaux-lead"), pied = $("#zj-tableaux-pied");
    if (lead) lead.textContent = Om.QUBBA.lead;
    if (pied) pied.textContent = Om.QUBBA.pied;
    rendreDefiVoile();   // v7.4 — le défi, dans la qubba : ce qu'il faut pour le recevoir, ou le mot reçu
    chargerPriseVoile().then(rendreDefiVoile);
    corps.innerHTML = Om.TABLEAUX.map(function (t) {
      var f = Om.fichier(t.cle);
      return '<article class="zj-tableau">' +
        (f ? '<img class="zj-tableau__toile" src="' + TOILES.dossier + esc(f) + TOILES.version +
             '" width="768" height="768" loading="lazy" alt="" />' : "") +
        "<h3>" + esc(t.titre) + "</h3>" +
        "<p>" + esc(t.recit) + "</p>" +
        '<p class="zj-tableau__legende">' + esc(t.legende) + "</p></article>";
    }).join("");
    rendreHuitieme();   // v7.6 — le huitième cadre, après les sept toiles
    panneau.hidden = false;
    noterDayf("tableaux");
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-tableaux-fermer");
    if (f) f.focus();
  }
  function fermerTableaux() {
    var el = $("#zj-tableaux");
    if (el) el.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  // ---- Le sixième : le défi du Voilé ------------------------------------------------------
  // ⚠️ L'ÉNONCÉ VIENT DE LA BASE (il change à chaque saison, et il ne doit
  //    nommer personne dans un fichier servi). Sans ligne posée, on annonce la
  //    FORME et on dit qu'aucun défi n'est ouvert — fail-close, comme partout.
  function ouvrirDefiDuVoile() {
    var t = Om.TAHADDI, d = Om.defiCourant(oumm.defi);
    var pages = [
      t.lead + "\n\n" + t.pour,
      "Ce que tu rends :\n\n· " + t.livrable.join("\n· "),
      // ⚠️ La partie qui compte : du code se copie, une manière de travailler
      // ne se copie pas. Quatre preuves, et la dernière est un entretien.
      "Comment on sait que c'est toi :\n\n" + t.preuves.map(function (p) {
        return "· " + p.titre + "\n  " + p.detail;
      }).join("\n\n"),
      t.regles.join("\n\n"),
      d ? "Le défi ouvert : « " + d.titre + " »\n\n" + d.enonce
        : t.sujet + "\n\nAucun défi n'est ouvert en ce moment. Le suivant s'affiche ici le jour où le bureau le pose.",
      t.ouvre + "\n\n" + t.garde
    ];
    ouvrirDialogue({ nom: t.nom, pages: pages });
  }

  // ---- v7.4 — LE VOILÉ : comment Al-Moulaththam apparaît (voile.js) ------------------------
  // Trois niveaux, et la qubba les promettait (Om.QUBBA.pied) :
  //  1. la RUMEUR — les figurants en parlent, certains jours (dans agir(), avec Pn.dialogue) ;
  //  2. le SIGNAL — sa silhouette sur la galerie du minaret, après la halqa, aux
  //     fenêtres que voile.js tire du JOUR : la même minute pour tous, sans serveur ;
  //  3. la RENCONTRE — une fois, sur la Rahba, devant TON tapis, quand les trois
  //     conditions sont tenues et qu'un défi est ouvert. Il laisse le mot du défi,
  //     que la BASE frappe (zawia-voile.sql). Puis « Étale. Ne raconte pas. »
  // ⚠️ Jamais démasqué (D1). Aucun point. Jamais solide, jamais un PNJ à ronde :
  //    la rareté est la mécanique. Son signe est l'or de la lanterne (body.zj-voile).
  function etatVoile() { return Vl.normaliserEtat(joueur && joueur.recit && joueur.recit.voile); }
  function poserVoile(e) {
    if (!joueur) return;
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.voile = Vl.normaliserEtat(e);
    sauvegarderJoueur();
  }
  function chaleurVoile() {
    document.body.classList.add("zj-voile");
    clearTimeout(voile.chaleur);
    voile.chaleur = setTimeout(function () { document.body.classList.remove("zj-voile"); }, Math.round(Vl.AVANT_S * 1000));
  }
  // La silhouette : un aplat de nuit, un liseré d'or du côté de la lanterne.
  // Pas de visage — on n'en a jamais vu. (sx, sy) = ses pieds à l'écran, z le zoom.
  function silhouetteVoile(ctx, sx, sy, z, t, alpha) {
    var a = Math.max(0, Math.min(1, alpha));
    if (a <= 0) return;
    var souffle = mouvementReduit ? 0.8 : 0.7 + 0.3 * Math.sin(t * 2.2);
    var resp = mouvementReduit ? 0 : 0.25 * Math.sin(t * 1.4);
    ctx.save();
    ctx.globalAlpha = a;
    // la lanterne, à sa main : la seule lumière
    var lx = sx - 5.5 * z, ly = sy - 6.5 * z;
    var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 16 * z);
    g.addColorStop(0, "rgba(255, 196, 92, " + (0.5 * souffle).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255, 196, 92, 0)");
    ctx.fillStyle = g; ctx.fillRect(lx - 16 * z, ly - 16 * z, 32 * z, 32 * z);
    // le manteau : des épaules au sol, un peu plus large en bas
    ctx.fillStyle = "#14121c";
    ctx.beginPath();
    ctx.moveTo(sx - 3 * z, sy - (11 + resp) * z); ctx.lineTo(sx + 3 * z, sy - (11 + resp) * z);
    ctx.lineTo(sx + 4.5 * z, sy); ctx.lineTo(sx - 4.5 * z, sy); ctx.closePath(); ctx.fill();
    // la tête voilée : une forme, et le pli du litham
    ctx.beginPath(); ctx.arc(sx, sy - (13.4 + resp) * z, 2.7 * z, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a2536";
    ctx.fillRect(Math.round(sx - 2.6 * z), Math.round(sy - (13.2 + resp) * z), 5.2 * z, 1.2 * z);
    // le liseré d'or, du côté de la lanterne
    ctx.strokeStyle = "rgba(230, 177, 63, " + (0.55 + 0.35 * souffle).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, 0.8 * z);
    ctx.beginPath(); ctx.moveTo(sx - 4.4 * z, sy - 0.5 * z); ctx.lineTo(sx - 3 * z, sy - (11 + resp) * z); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy - (13.4 + resp) * z, 2.7 * z, Math.PI * 0.75, Math.PI * 1.35); ctx.stroke();
    // la lanterne elle-même
    ctx.fillStyle = "#e6b13f";
    ctx.fillRect(Math.round(lx - z), Math.round(ly - 1.5 * z), 2 * z, 3 * z);
    ctx.restore();
  }
  function dessinerVoile(cam, maintenant) {
    if (!Vl || !cam || !cour.ctx || rihla.active) return;
    var ctx = cour.ctx, z = cam.zoom;
    var ex = function (wx) { return (wx - cam.camX + cam.ox) * z; }, ey = function (wy) { return (wy - cam.camY + cam.oy) * z; };
    if (rahba.active) {
      // 3. devant ton tapis, tant qu'il attend — un losange d'or le désigne
      var r = voile.rencontre;
      if (!r) return;
      var px = ex(r.tx * T + T / 2), py = ey((r.ty + 1) * T - 2);
      silhouetteVoile(ctx, px, py, z, cour.t, 1);
      var souffle = mouvementReduit ? 0.8 : 0.6 + 0.3 * Math.sin(cour.t * 2.4);
      losangeOr(ctx, px, py - 19 * z - (mouvementReduit ? 0 : 1.5 * Math.sin(cour.t * 3)) * z, z, souffle);
      // il parle quand on s'approche à deux tuiles — on ne le heurte jamais
      if (!cour.dialogue && !menuOuvert && !panneauOuvert()) {
        var dx = Math.floor(cour.perso.x / T) - r.tx, dy = Math.floor(cour.perso.y / T) - r.ty;
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) ouvrirRencontreVoile();
      }
      return;
    }
    // 2. le signal : la galerie du minaret, aux fenêtres du jour (l'horloge relue chaque seconde)
    if (!voile.lu || maintenant - voile.lu > 1000) { voile.lu = maintenant; voile.signal = Vl.signal(maintenant); }
    var s = voile.signal;
    if (!s || !s.visible) { voile.fenetre = null; return; }
    if (voile.fenetre !== s.id) {
      voile.fenetre = s.id;
      chaleurVoile();
      if (!dayf.actif && joueur) poserVoile(Vl.marquerSigne(etatVoile()));   // un souvenir, pas un score
    }
    var fondu = Math.min(1, s.depuis / 1.2, s.reste / 3);   // il apparaît en une seconde, s'efface en trois
    silhouetteVoile(ctx, ex(Vl.PERCHOIR.x * T), ey(Vl.PERCHOIR.y * T), z, cour.t, fondu);
  }
  // Les trois conditions, lues dans ce que le jeu sait déjà : les jours de Wird
  // tenus, une wasfa à moi au Kounnach ou un filleul, un produit sur mon tapis.
  function contexteVoile() {
    var we = wirdEtat();
    var kn = kounnach.lignes && Kn ? Kn.normaliser(kounnach.lignes) : [];
    var rendu = kn.some(function (w) { return w.mienne; }) || voile.filleul === true;
    var m = rahba.mienne;
    return { wirdTenus: we ? we.tenus : 0, rendu: rendu, etale: !!((m && !m.libre && m.tapis) || miens().length),
             defi: !!Om.defiCourant(oumm.defi), dayf: dayf.actif, atelier: !!(compte && compte.mode === "local") };
  }
  // À l'arrivée sur la Rahba, une fois les tapis et le défi lus : s'il doit
  // venir, il est déjà là — devant ton tapis, et il attend qu'on s'approche.
  function preparerRencontreVoile() {
    voile.rencontre = null;
    if (!Vl || !rahba.active || !joueur || dayf.actif || Vl.vu(etatVoile())) return;
    var lu = Promise.resolve();
    if (!kounnach.lignes && compte && typeof compte.lireKounnach === "function") {
      lu = lu.then(function () { return compte.lireKounnach().then(function (l) { kounnach.lignes = l || []; }).catch(function () {}); });
    }
    if (voile.filleul === null && lignee.maison && compte && typeof compte.lireFilleuls === "function") {
      lu = lu.then(function () { return compte.lireFilleuls().then(function (d) { voile.filleul = !!(d && d.invitations && d.invitations.length); }).catch(function () { voile.filleul = false; }); });
    }
    lu.then(function () {
      if (!rahba.active || voile.rencontre || !rahba.mienne || Vl.vu(etatVoile())) return;
      if (!Vl.pret(contexteVoile()).ok) return;
      voile.rencontre = { tx: rahba.mienne.x + 1, ty: rahba.mienne.y + Rb.ETAL };
      voile.apercu = false;
      setTimeout(apercuVoile, 900);
    });
  }
  // « Quelqu'un se tient devant ton tapis » — dit une fois, et jamais par-dessus une
  // autre boîte (le dellal hèle le premier soir) : on attend son tour, comme Ba Driss.
  function apercuVoile() {
    if (!rahba.active || !voile.rencontre || voile.apercu) return;
    if (cour.dialogue || panneauOuvert() || menuOuvert) { setTimeout(apercuVoile, 2500); return; }
    voile.apercu = true;
    chaleurVoile();
    ouvrirDialogue({ nom: Vl.APERCU.nom, pages: Vl.APERCU.pages.slice() });
  }
  function ouvrirRencontreVoile() {
    var r = voile.rencontre;
    if (!r || cour.dialogue) return;
    voile.apercu = true;   // on l'a trouvé soi-même : l'aperçu n'a plus rien à dire
    var m = rahba.mienne, premier = m && m.tapis && m.tapis.produits && m.tapis.produits[0];
    var produit = premier ? premier.nom : (miens()[0] && miens()[0].nom) || "";
    var d = Vl.rencontre(produit);
    chaleurVoile();
    ouvrirDialogue({ nom: d.nom, pages: d.pages, apres: function () {
      // le mot : c'est la base qui le frappe (zawia-voile.sql) — jamais l'écran
      compte.defiPrendre().then(function (res) {
        var prise = res && res.ok ? Vl.normaliserPrise(res.prise) : null;
        if (!prise) { ouvrirDialogue({ nom: Vl.MUET.nom, pages: Vl.MUET.pages.slice() }); return; }
        voile.prise = prise;
        voile.rencontre = null;   // quand on relève la tête, il n'y a plus personne
        poserVoile(Vl.marquerVu(etatVoile(), jourDeLaMaison()));
        var g = Vl.don(prise.mot);
        ouvrirDialogue({ nom: g.nom, pages: g.pages });
      });
    } });
  }
  // La prise du défi, lue en base quand on ouvre la qubba (jamais au chargement : lazy).
  function chargerPriseVoile() {
    if (!compte || dayf.actif || !joueur || typeof compte.defiMien !== "function") return Promise.resolve();
    return compte.defiMien().then(function (res) {
      if (res && res.ok) voile.prise = Vl.normaliserPrise(res.prise);
    }).catch(function () { /* la qubba garde ce qu'elle savait */ });
  }
  // Le défi du Voilé, dans la qubba : ce qu'il faut pour le recevoir — puis le mot
  // reçu, et le dépôt à rendre. ⚠️ Chaque morceau qui porte sa propre entrée arabe
  // vit dans son propre <p> (la leçon du Wird : langue.js traduit une feuille d'un bloc).
  function rendreDefiVoile() {
    var el = $("#zj-tableaux-defi");
    if (!el || !Vl) return;
    var t = Om.TAHADDI, d = Om.defiCourant(oumm.defi), Q = Vl.QUBBA_DEFI;
    var html = '<h3 class="zj-voile__titre">' + esc(t.nom) + "</h3>";
    if (dayf.actif) { el.innerHTML = html + "<p>" + esc(Q.recu) + "</p>"; return; }
    var prise = voile.prise;
    if (prise) {
      html += '<div class="zj-voile__mot"><p class="zj-voile__k">' + esc(Q.ton) + '</p><p class="zj-voile__v">« ' + esc(prise.mot) + " »</p>" +
        (prise.donneLe ? '<p class="zj-voile__d">' + esc(Vl.gabarit(Q.recuLe, jourDe(prise.donneLe))) + "</p>" : "") + "</div>";
      html += "<p>" + esc(Vl.ETAT_TEXTE[prise.etat] || "") + "</p>";
      if (prise.etat === "recale" && prise.note) html += '<p class="zj-voile__note">« ' + esc(prise.note) + " »</p>";
      if (prise.depot) {
        html += '<p><a class="zj-voile__depot" href="' + esc(prise.depot) + '" target="_blank" rel="noopener noreferrer">' + esc(Q.lire) + "</a></p>" +
          (prise.renduLe ? '<p class="zj-voile__d">' + esc(Vl.gabarit(Q.renduLe, jourDe(prise.renduLe))) + "</p>" : "");
      }
      if (prise.etat !== "passe") {
        html += '<form id="zj-voile-form" class="zj-souk__form" autocomplete="off"><label>' + esc(Q.depot) +
          '<input id="zj-voile-depot" type="text" inputmode="url" maxlength="' + Vl.DEPOT_MAX + '" placeholder="https://…" value="' + esc(prise.depot || "") + '" /></label>' +
          '<div class="zj-souk__actions"><button type="submit" class="zj-bouton">' + esc(Q.rendre) + "</button></div>" +
          '<p id="zj-voile-msg" class="zj-msg" hidden></p></form>';
      }
      html += "<p>" + esc(t.garde) + "</p>";
    } else {
      html += "<p>" + esc(Q.recu) + "</p>";
      var c = Vl.pret(contexteVoile());
      html += '<ul class="zj-voile__conditions">' + Vl.CONDITIONS.map(function (x) {
        var ok = !!(c.tenu && c.tenu[x.cle]);
        return '<li class="' + (ok ? "zj-voile__ok" : "zj-voile__manque") + '"><p>' + esc(x.nom) + '</p><p class="zj-voile__etat">' + esc(ok ? Q.tenu : Q.manque) + "</p></li>";
      }).join("") + "</ul>";
      html += d ? '<p class="zj-voile__k">' + esc(Q.ouvert) + '</p><p class="zj-voile__defi">« ' + esc(d.titre) + " »</p>" : "<p>" + esc(Q.aucun) + "</p>";
    }
    el.innerHTML = html;
    var f = $("#zj-voile-form");
    if (f) f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = Vl.depotValide($("#zj-voile-depot").value);
      if (!v.ok) { message("#zj-voile-msg", v.erreur, "ko"); return; }
      compte.defiRendre(v.url).then(function (res) {
        var p = res && res.ok ? Vl.normaliserPrise(res.prise) : null;
        if (!p) { message("#zj-voile-msg", (res && res.erreur) || "Ça n'a pas marché.", "ko"); return; }
        voile.prise = p;
        rendreDefiVoile();
      });
    });
  }

  // ---- v7.6 — LE SIRR : les sept traces, le huitième cadre, la Khalwa -----------------------
  // ⚠️⚠️ ON NE TROUVE PAS LE VOILÉ, ON DEVIENT QUELQU'UN CHEZ QUI IL DESCEND.
  //    Rien ici n'affiche un compte, une liste ou une barre : le joueur découvre
  //    APRÈS COUP que ce qu'il faisait comptait. Un « 3 / 7 » tuerait tout.
  // ⚠️ La vérité est en base (zawia-sirr.sql) : l'écran ne fait que la montrer.
  function etatSirrRecit() { return Sr.normaliserEtat(joueur && joueur.recit && joueur.recit.sirr); }
  function poserSirrRecit(e) {
    if (!joueur) return;
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.sirr = Sr.normaliserEtat(e);
    sauvegarderJoueur();
  }
  function nSirr() { return sirr.etat ? Sr.normaliser(sirr.etat).n : 0; }
  // Lue à l'entrée dans la cour, et après un geste qui peut avoir fait tomber une
  // trace. Jamais en boucle : c'est une lecture de base, pas un capteur.
  function chargerSirr() {
    if (!Sr || !compte || !joueur || dayf.actif || typeof compte.lireSirr !== "function") return Promise.resolve();
    return compte.lireSirr().then(function (d) {
      if (!d || !joueur) return;
      sirr.etat = Sr.normaliser(d);
      var neuves = Sr.nouvelles(etatSirrRecit(), sirr.etat.n);
      if (neuves.length) annoncerSirr(neuves);
    }).catch(function () { /* la qubba gardera le cadre tel qu'il était */ });
  }
  // Une région vient de s'allumer. On ne dit RIEN — la lanterne passe sur la
  // toile, et c'est au joueur d'aller voir. Sauf la septième : là, on regarde.
  function annoncerSirr(neuves) {
    var n = sirr.etat.n;
    poserSirrRecit(Sr.marquerVu(etatSirrRecit(), n));
    if (n >= Sr.TRACES.length) {
      setTimeout(function () {
        if (cour.dialogue || panneauOuvert() || menuOuvert || ecran !== "cour") { setTimeout(function () { annoncerSirr(neuves); }, 4000); return; }
        chaleurVoile();
        ouvrirDialogue({ nom: Sr.ENTIERE.nom, pages: Sr.ENTIERE.pages.slice(), apres: ouvrirTableaux });
      }, 1200);
      return;
    }
    // sinon : une lueur d'or, deux secondes, et rien de plus. Il verra bien.
    chaleurVoile();
  }
  // La toile, révélée à la lanterne : on peint l'image, puis on l'éteint SAUF
  // aux régions acquises. Les non acquises ne se devinent pas — c'est de la nuit.
  function peindreHuitieme() {
    var cv = $("#zj-sirr-toile");
    if (!cv || !Sr) return;
    var n = nSirr(), ctx = cv.getContext("2d"), L = cv.width, H = cv.height;
    ctx.clearRect(0, 0, L, H);
    if (!sirr.toile) {
      sirr.toile = new Image();
      sirr.toile.onload = peindreHuitieme;
      sirr.toile.src = TOILES.dossier + Sr.TOILE + TOILES.version;
      return;
    }
    if (!sirr.toile.complete || !sirr.toile.naturalWidth) return;
    if (n <= 0) { ctx.fillStyle = "#0b0a10"; ctx.fillRect(0, 0, L, H); return; }
    ctx.drawImage(sirr.toile, 0, 0, L, H);
    // ⚠️ À sept, la toile est ENTIÈRE — et le texte le dit. Sept halos ronds
    //    laissent des coins dans l'ombre : on lève le voile d'un coup, sinon
    //    l'écran contredirait la phrase qu'il affiche. Vu à l'écran le 21/09.
    if (n >= Sr.TRACES.length) return;
    // le voile de nuit, percé aux régions acquises
    var v = document.createElement("canvas");
    v.width = L; v.height = H;
    var vc = v.getContext("2d");
    vc.fillStyle = "#0b0a10";
    vc.fillRect(0, 0, L, H);
    vc.globalCompositeOperation = "destination-out";
    for (var i = 0; i < n && i < Sr.HALOS.length; i++) {
      var h = Sr.HALOS[i], cx = h.x * L, cy = h.y * H, r = h.r * L;
      var g = vc.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      vc.fillStyle = g;
      vc.beginPath(); vc.arc(cx, cy, r, 0, Math.PI * 2); vc.fill();
    }
    ctx.drawImage(v, 0, 0);
  }
  // Le huitième cadre, dans la qubba, après les sept toiles.
  function rendreHuitieme() {
    var el = $("#zj-sirr");
    if (!el || !Sr) return;
    if (dayf.actif) { el.hidden = true; return; }
    el.hidden = false;
    var n = nSirr(), e = sirr.etat || Sr.normaliser(null);
    var pl = Sr.plaque(n);
    el.innerHTML = '<canvas id="zj-sirr-toile" width="768" height="768" class="zj-sirr__toile"></canvas>' +
      '<h3>Le huitième cadre</h3>' +
      "<p>" + esc(Sr.cartouche(n)) + "</p>" +
      (pl ? '<p class="zj-sirr__plaque">' + esc(pl) + "</p>" : "") +
      '<div id="zj-sirr-khalwa"></div>';
    peindreHuitieme();
    rendreKhalwa();
  }
  // La khalwa : demandée une fois, quand la toile est entière.
  function rendreKhalwa() {
    var el = $("#zj-sirr-khalwa");
    if (!el || !Sr) return;
    var e = sirr.etat || Sr.normaliser(null), Q = Sr.QUESTION;
    if (e.khalwa) {
      var dit = e.khalwa.etat === "tenue" ? Q.passee
        : e.khalwa.etat === "fixee" && e.khalwa.quand ? Q.fixee + " " + jourDe(e.khalwa.quand)
        : Q.attente;
      el.innerHTML = '<p class="zj-sirr__khalwa">' + esc(dit) + "</p>" +
        (e.khalwa.note ? '<p class="zj-sirr__note">« ' + esc(e.khalwa.note) + " »</p>" : "");
      return;
    }
    if (!Sr.peutDemander(e)) { el.innerHTML = ""; return; }
    el.innerHTML = '<div class="zj-sirr__khalwa"><p class="zj-kicker">' + esc(Q.titre) + "</p>" +
      "<p>" + esc(Q.lead) + "</p>" +
      '<p class="zj-sirr__question">' + esc(Q.question) + "</p>" +
      '<form id="zj-sirr-form" class="zj-souk__form" autocomplete="off">' +
      "<label>" + esc(Q.aide) +
      '<textarea id="zj-sirr-reponse" rows="3" maxlength="' + Sr.REPONSE_MAX + '"></textarea></label>' +
      '<div class="zj-souk__actions"><button type="submit" class="zj-bouton">' + esc(Q.envoyer) + "</button></div>" +
      '<p id="zj-sirr-msg" class="zj-msg" hidden></p></form></div>';
    var f = $("#zj-sirr-form");
    if (f) f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = Sr.reponseValide($("#zj-sirr-reponse").value);
      if (!v.ok) { message("#zj-sirr-msg", v.erreur, "ko"); return; }
      compte.demanderKhalwa(v.texte).then(function (r) {
        if (!r || !r.ok) { message("#zj-sirr-msg", (r && r.erreur) || "Ça n'a pas marché.", "ko"); return; }
        sirr.etat = Sr.normaliser(Object.assign({}, sirr.etat, { khalwa: { etat: r.etat || "demandee" } }));
        message("#zj-sirr-msg", Sr.QUESTION.posee, "ok");
        setTimeout(rendreKhalwa, 1200);
      });
    });
  }
  // L'appel : à son heure, la silhouette du minaret SE TOURNE — pour lui seul.
  // Jamais par-dessus autre chose, et une seule fois par session.
  function appelKhalwa() {
    if (!Sr || sirr.appel || dayf.actif || rahba.active || rihla.active || ecran !== "cour") return;
    if (!sirr.etat || !Sr.peutDemander(sirr.etat)) return;
    if (!voile.signal || !voile.signal.visible) return;
    if (cour.dialogue || panneauOuvert() || menuOuvert) return;
    sirr.appel = true;
    chaleurVoile();
    ouvrirDialogue({ nom: Sr.APPEL.nom, pages: Sr.APPEL.pages.slice(), apres: ouvrirTableaux });
  }

  // ---- v4.5 — Le retour : le mot de passe oublié -------------------------------------
  // Le lien reçu dans la boîte ramène ici avec ses jetons. On ouvre la session
  // avec eux, puis on EXIGE un nouveau mot de passe avant d'ouvrir la cour :
  // un retour qui n'en poserait pas laisserait le compte aussi fermé qu'avant.
  function ouvrirRetour(r) {
    afficher("porte");
    if (!r.ok) { message("#zj-porte-msg", Pr.PASSE.expire, "ko"); return Promise.resolve(); }
    return compte.reprendre(r).then(function (v) {
      if (!v.ok) { message("#zj-porte-msg", Pr.PASSE.expire, "ko"); return; }
      document.body.classList.add("zj-porte-retour");
      $("#zj-porte-retour-titre").textContent = Pr.PASSE.titre;
      $("#zj-porte-retour-texte").textContent = Pr.PASSE.lead2;
      $("#zj-porte-retour").hidden = false;
      var champ = $("#zj-retour-mdp");
      if (champ) { champ.value = ""; champ.focus(); }
    }).catch(function () { message("#zj-porte-msg", Pr.PASSE.expire, "ko"); });
  }
  function fermerRetour() {
    document.body.classList.remove("zj-porte-retour");
    $("#zj-porte-retour").hidden = true;
    var champ = $("#zj-retour-mdp");
    if (champ) champ.value = "";
  }

  function brancherRetour() {
    // Le lien « Mot de passe oublié » : la même mécanique que le dossier, et
    // la MÊME phrase que l'adresse ait un compte ou non — on ne dit pas à un
    // inconnu qui est de la maison.
    var ouvrir = $("#zj-passe-ouvrir"), form = $("#zj-form-passe");
    if (ouvrir && form) {
      ouvrir.addEventListener("click", function () {
        form.hidden = !form.hidden;
        ouvrir.setAttribute("aria-expanded", form.hidden ? "false" : "true");
        if (!form.hidden) {
          var e = $("#zj-email").value;
          if (e && !$("#zj-passe-email").value) $("#zj-passe-email").value = e;
          $("#zj-passe-email").focus();
        }
      });
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var v = Pr.validerEmail($("#zj-passe-email").value);
        if (!v.ok) { message("#zj-passe-msg", v.texte, "ko"); return; }
        var bouton = $("#zj-passe-bouton");
        bouton.disabled = true;
        message("#zj-passe-msg", "On envoie…", "");
        // Le lien ramène sur la maison elle-même, sans requête ni fragment :
        // l'adresse doit être dans les redirections autorisées du projet.
        var ici = location.origin + location.pathname;
        compte.envoyerLienDeRetour(v.email, ici).then(function (r) {
          bouton.disabled = false;
          if (r.raison === "atelier") { message("#zj-passe-msg", Pr.PASSE.atelier, ""); return; }
          message("#zj-passe-msg", r.ok ? Pr.PASSE.envoye : r.erreur, r.ok ? "ok" : "ko");
        }).catch(function () {
          bouton.disabled = false;
          message("#zj-passe-msg", "La maison ne répond pas. Réessaie dans un instant.", "ko");
        });
      });
    }

    // Le nouveau mot de passe posé, la suite est celle d'une entrée ordinaire.
    var fr = $("#zj-porte-retour");
    if (!fr) return;
    fr.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var bouton = $("#zj-retour-bouton");
      bouton.disabled = true;
      message("#zj-retour-msg", "On pose…", "");
      compte.changerMotDePasse($("#zj-retour-mdp").value).then(function (r) {
        bouton.disabled = false;
        if (!r.ok) { message("#zj-retour-msg", r.erreur, "ko"); return; }
        message("#zj-retour-msg", Pr.PASSE.faite, "ok");
        fermerRetour();
        return reclamerLignee().then(function () {
          if (!admission.admis) { fermerLaPorte(); return; }
          return compte.lireJoueur().then(function (j) {
            if (j) entrerCour(j); else afficher("atelier");
          });
        });
      }).catch(function (e) {
        bouton.disabled = false;
        message("#zj-retour-msg", "La maison ne répond pas : " + (e && e.message ? e.message : "réessaie."), "ko");
      });
    });
  }

  // Déplie le formulaire du dossier, avec l'adresse déjà écrite. Appelé par le
  // lien de la Porte, et par le refus d'inscription — qui sans cela laissait la
  // personne devant une règle, sans le geste qui la résout.
  function ouvrirDossierAvec(email) {
    var ouvrir = $("#zj-dossier-ouvrir"), form = $("#zj-form-dossier"), champ = $("#zj-dossier-email");
    if (!ouvrir || !form || !champ) return;
    form.hidden = false;
    ouvrir.setAttribute("aria-expanded", "true");
    if (email && !champ.value) champ.value = email;
    champ.focus();
    if (form.scrollIntoView) form.scrollIntoView({ block: "nearest" });
  }

  // v7.2 — la porte de l'invité, sur la Porte. Aucun champ, aucun envoi.
  // ⚠️ Un invité qui revient ne recommence pas : son hospitalité est entamée,
  //    et la porte le dit. On n'entre PAS tout seul à sa place — il peut
  //    vouloir se connecter pour de bon, et la Porte reste à lui.
  function majPorteDayf() {
    var b = $("#zj-dyaf-entrer"), mot = $(".zj-dyaf__mot");
    if (!b) return;
    var e = lireDayf(), j = lireJoueurDayf();
    if (!e.debut || !j || !j.pseudo) return;
    var n = Dy.jour(e, jourDeLaMaison());
    b.textContent = "Reprendre ma visite";
    if (mot) {
      mot.textContent = n > Dy.JOURS
        ? "Te revoilà, " + j.pseudo + "."
        : "Te revoilà, " + j.pseudo + " — jour " + n + " sur " + Dy.JOURS + ".";
    }
  }

  function brancherDayf() {
    var b = $("#zj-dyaf-entrer");
    if (b) b.addEventListener("click", entrerEnInvite);
    // la porte close reçoit aussi : une règle sans sortie est un mur
    var bf = $("#zj-porte-fermee-dyaf");
    if (bf) bf.addEventListener("click", function () { rouvrirLaPorte(); entrerEnInvite(); });
    majPorteDayf();
    var f = $("#zj-dyaf-portes-fermer");
    if (f) f.addEventListener("click", fermerPortesDayf);
    var m = $("#zj-menu-dyaf");
    if (m) m.addEventListener("click", function () { basculerMenu(false); ouvrirPortesDayf(); });
    // v7.3 — les cinq épreuves, et les sept tableaux
    var mo = $("#zj-menu-oumm");
    if (mo) mo.addEventListener("click", ouvrirOumm);
    var mt = $("#zj-menu-tableaux");
    if (mt) mt.addEventListener("click", ouvrirTableaux);
    var tf = $("#zj-tableaux-fermer");
    if (tf) tf.addEventListener("click", fermerTableaux);
  }

  function brancherDossier() {
    var ouvrir = $("#zj-dossier-ouvrir"), form = $("#zj-form-dossier");
    if (!ouvrir || !form) return;
    ouvrir.addEventListener("click", function () {
      if (form.hidden) { ouvrirDossierAvec($("#zj-email").value); return; }
      form.hidden = true;
      ouvrir.setAttribute("aria-expanded", "false");
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (invitation.envoi) return;
      var v = Pr.validerEmail($("#zj-dossier-email").value);
      if (!v.ok) { message("#zj-dossier-msg", v.texte, "ko"); return; }
      invitation.envoi = true;
      var bouton = $("#zj-dossier-bouton");
      bouton.disabled = true;
      message("#zj-dossier-msg", "On regarde…", "");
      compte.demanderDossier(v.email).then(function (r) {
        invitation.envoi = false; bouton.disabled = false;
        message("#zj-dossier-msg", r.ok ? r.message : r.erreur, r.ok ? "ok" : "ko");
      });
    });
    var sortir = $("#zj-porte-fermee-sortir");
    if (sortir) sortir.addEventListener("click", function () {
      compte.deconnecter().then(function () {
        rouvrirLaPorte();
        $("#zj-mdp").value = "";
        choisirOnglet(invitation.code ? "inscrire" : "entrer");
      });
    });
  }

  // v3.2 — le premier jour de l'Arb3ine tel qu'on le REGARDE : à travers le
  // masque du Morchid s'il en porte un, sinon celui de la ligne. La ligne
  // n'est jamais réécrite.
  function debutArb3ine() {
    return morchid.actif ? Mo.arb3ineDebut(morchid.masque, joueur.arb3ineDebut) : joueur.arb3ineDebut;
  }

  // v3.2 — incarner : une touche, un masque, un aller-retour. C'est la BASE
  // qui refuse tout autre compte et qui écrit le rang ; ici on pose ce
  // qu'elle rend — rang, lignée effective — et on rafraîchit l'écran.
  function incarner(touche) {
    if (!morchid.essai || !joueur || !compte || typeof compte.incarner !== "function") return;   // v8.2 — le compte d'essai seul
    var m = Mo.suivant(morchid.masque, touche, { maison: lignee.maison });
    if (m === undefined) return;
    compte.incarner(m).then(function (r) {
      if (!r || !r.ok) { ouvrirDialogue({ nom: "Le masque", pages: [(r && r.erreur) || "Le masque n'a pas tenu."] }); return; }
      morchid.masque = Mo.normaliser(r.masque);
      if (typeof r.maison === "boolean") lignee.maison = r.maison;
      if (r.rang) joueur.rang = r.rang;
      if (!lignee.maison) { lignee.chajara = null; lignee.devoile = null; }   // v3.8 — le masque « libre » remet le voile
      sonner("page_dlg");
      rafraichirHud();
    });
  }

  // ---- La Porte -------------------------------------------------------------------
  var onglet = "entrer";
  function choisirOnglet(nom) {
    onglet = nom;
    $$(".zj-onglet").forEach(function (b) {
      var actif = b.getAttribute("data-onglet") === nom;
      b.setAttribute("aria-selected", actif ? "true" : "false");
      b.tabIndex = actif ? 0 : -1;
    });
    var bouton = $("#zj-porte-bouton"), legende = $("#zj-porte-legende"), mdp = $("#zj-mdp");
    if (bouton) bouton.textContent = nom === "entrer" ? "Entrer" : "Créer mon compte";
    if (legende) legende.textContent = nom === "entrer"
      ? "Tu as déjà un personnage dans la cour."
      : Pr.REGLE + " Première fois : un e-mail, un mot de passe de " + C.MDP_MIN + " caractères au moins. Ton Arb3ine commence quand ton personnage entre.";
    if (mdp) mdp.setAttribute("autocomplete", nom === "entrer" ? "current-password" : "new-password");
    message("#zj-porte-msg", "");
  }

  function brancherPorte() {
    $$(".zj-onglet").forEach(function (b) {
      b.addEventListener("click", function () { choisirOnglet(b.getAttribute("data-onglet")); });
    });
    var form = $("#zj-form-porte");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = $("#zj-email").value, mdp = $("#zj-mdp").value;
      var bouton = $("#zj-porte-bouton");
      bouton.disabled = true;
      message("#zj-porte-msg", onglet === "entrer" ? "On ouvre…" : "On inscrit…", "");
      var inscription = onglet !== "entrer";
      var p = inscription ? compte.inscrire(email, mdp, invitation.code) : compte.connecter(email, mdp);
      p.then(function (r) {
        bouton.disabled = false;
        if (!r.ok) {
          message("#zj-porte-msg", r.erreur, "ko");
          // ⚠️ 19/09/2026 — le refus du hook Auth disait la RÈGLE sans montrer
          // la porte. Quelqu'un dont le dossier vient d'être accepté remplit
          // « S'inscrire », se fait refuser, et reste devant un mur : le
          // formulaire qui lui enverrait son lien est un lien discret plus bas,
          // replié. `Pr.estRefusDePorte` existait et n'était branché nulle part.
          if (inscription && Pr.estRefusDePorte(r.erreur)) ouvrirDossierAvec(email);
          return;
        }
        if (r.confirmation) { message("#zj-porte-msg", r.message, "ok"); choisirOnglet("entrer"); return; }
        $("#zj-mdp").value = "";
        return reclamerLignee().then(function () {
          if (!admission.admis) { fermerLaPorte(); return; }
          // l'invitation a servi : elle ne suit pas l'onglet plus loin
          if (inscription) oublierInvitation();
          message("#zj-porte-invitation", "");
          return compte.lireJoueur().then(function (j) {
            if (j) entrerCour(j); else afficher("atelier");
          });
        });
      }).catch(function (e) {
        bouton.disabled = false;
        message("#zj-porte-msg", "La maison ne répond pas : " + (e && e.message ? e.message : "réessaie."), "ko");
      });
    });
  }

  // ---- L'Atelier -----------------------------------------------------------------
  var atelier = { avatar: null, dir: "bas", frame: 0, t: 0, raf: 0, dernier: 0, auto: true };

  function brancherAtelier() {
    var peaux = $("#zj-peaux"), djellabas = $("#zj-djellabas"), tetes = $("#zj-tetes");
    if (peaux) peaux.innerHTML = R.PEAUX.map(function (hex, i) {
      return '<button type="button" class="zj-pastille" data-champ="peau" data-valeur="' + i + '" style="--c:' + hex + '" aria-label="Teinte de peau ' + (i + 1) + '" title="Teinte ' + (i + 1) + '"></button>';
    }).join("");
    if (djellabas) djellabas.innerHTML = R.DJELLABAS.map(function (d, i) {
      return '<button type="button" class="zj-pastille" data-champ="djellaba" data-valeur="' + i + '" style="--c:' + d.hex + '" aria-label="Djellaba ' + esc(d.nom) + '" title="' + esc(d.nom) + '"></button>';
    }).join("");
    if (tetes) tetes.innerHTML = R.TETES.map(function (t) {
      return '<button type="button" class="zj-choix" data-champ="tete" data-valeur="' + t.cle + '">' + esc(t.nom) + '</button>';
    }).join("");

    // v6.2 — les cinq axes du visage et des cheveux. Mêmes pastilles, mêmes
    // boutons, même `data-champ` : le gestionnaire ci-dessous ne distingue que
    // les champs à INDEX (peau, djellaba, cheveux) des champs à CLÉ.
    var pastilles = $("#zj-cheveux");
    if (pastilles && Tr) pastilles.innerHTML = Tr.CHEVEUX.map(function (c, i) {
      return '<button type="button" class="zj-pastille" data-champ="cheveux" data-valeur="' + i + '" style="--c:' + c.hex + '" aria-label="Cheveux ' + esc(c.nom) + '" title="' + esc(c.nom) + '"></button>';
    }).join("");
    if (Tr) [["#zj-coiffures", Tr.COIFFURES, "coiffure"], ["#zj-barbes", Tr.BARBES, "barbe"],
     ["#zj-moustaches", Tr.MOUSTACHES, "moustache"], ["#zj-bijoux", Tr.BIJOUX, "bijou"]].forEach(function (p) {
      var el = $(p[0]);
      if (el) el.innerHTML = p[1].map(function (o) {
        return '<button type="button" class="zj-choix" data-champ="' + p[2] + '" data-valeur="' + o.cle + '">' + esc(o.nom) + '</button>';
      }).join("");
    });

    var INDEX = { peau: true, djellaba: true, cheveux: true };
    $$("#zj-peaux button, #zj-djellabas button, #zj-tetes button, #zj-cheveux button, #zj-coiffures button, #zj-barbes button, #zj-moustaches button, #zj-bijoux button").forEach(function (b) {
      b.addEventListener("click", function () {
        var champ = b.getAttribute("data-champ"), val = b.getAttribute("data-valeur");
        atelier.avatar[champ] = INDEX[champ] ? parseInt(val, 10) : val;
        atelier.avatar = R.normaliserAvatar(atelier.avatar);
        rafraichirAtelier();
      });
    });

    var tourner = $("#zj-tourner");
    if (tourner) tourner.addEventListener("click", function () {
      var ordre = ["bas", "gauche", "haut", "droite"];
      atelier.auto = false;
      atelier.dir = ordre[(ordre.indexOf(atelier.dir) + 1) % 4];
    });

    var annuler = $("#zj-atelier-annuler");
    if (annuler) annuler.addEventListener("click", function () { if (joueur) entrerCour(joueur); });

    var sortir = $("#zj-atelier-sortir");
    if (sortir) sortir.addEventListener("click", function (ev) { ev.preventDefault(); sortirDeLaMaison(); });

    var form = $("#zj-form-atelier");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = R.validerPseudo($("#zj-pseudo").value);
      if (!v.ok) { message("#zj-atelier-msg", v.erreur, "ko"); $("#zj-pseudo").focus(); return; }
      var bouton = $("#zj-atelier-bouton");
      bouton.disabled = true;
      message("#zj-atelier-msg", "On coud la djellaba…", "");
      var neuf;
      if (joueur) {
        // Retouche : on garde l'Arb3ine, les défis et la position — on ne
        // rajeunit pas un Talib parce qu'il change de tarbouche.
        neuf = Object.assign({}, joueur, { pseudo: v.valeur, avatar: R.normaliserAvatar(atelier.avatar) });
      } else {
        neuf = R.nouveauJoueur({ pseudo: v.valeur, avatar: atelier.avatar });
      }
      // v7.2 — un invité n'a pas de compte : rien ne part au serveur, son
      // personnage vit dans son navigateur. Il entre tout de suite.
      if (dayf.actif) {
        bouton.disabled = false;
        message("#zj-atelier-msg", "");
        joueur = neuf;
        ecrireJoueurDayf();
        entrerCour(neuf);
        return;
      }
      compte.ecrireJoueur(neuf).then(function (r) {
        bouton.disabled = false;
        if (!r.ok) { message("#zj-atelier-msg", r.erreur, "ko"); return; }
        message("#zj-atelier-msg", "");
        entrerCour(r.joueur);
      }).catch(function (e) {
        bouton.disabled = false;
        message("#zj-atelier-msg", "La maison ne répond pas : " + (e && e.message ? e.message : "réessaie."), "ko");
      });
    });
  }

  function rafraichirAtelier() {
    var a = atelier.avatar;
    $$("#zj-peaux button, #zj-djellabas button, #zj-tetes button").forEach(function (b) {
      var champ = b.getAttribute("data-champ"), val = b.getAttribute("data-valeur");
      var actif = String(a[champ]) === val;
      b.setAttribute("aria-pressed", actif ? "true" : "false");
    });
    var detail = $("#zj-tete-detail");
    if (detail) {
      var t = R.TETES.filter(function (x) { return x.cle === a.tete; })[0];
      detail.textContent = t ? t.detail : "";
    }
    var dj = $("#zj-djellaba-nom");
    if (dj) dj.textContent = R.DJELLABAS[a.djellaba].nom;
    var ch = $("#zj-cheveux-nom");
    if (ch && Tr) ch.textContent = Tr.CHEVEUX[Tr.normaliser(a).cheveux].nom;
    // Sous un couvre-chef, la planche ne peint aucune chevelure : proposer une
    // tresse y ferait flotter des cheveux sur un foulard. Le choix disparaît —
    // il ne se grise pas : une option qu'on voit et qui ne fait rien se lit
    // comme une panne.
    var fsCoif = $("#zj-fs-coiffure");
    if (fsCoif && Tr) fsCoif.hidden = !!Tr.COUVRE[a.tete];
    if (Tr) [["#zj-coiffure-detail", Tr.COIFFURES, a.coiffure], ["#zj-bijou-detail", Tr.BIJOUX, a.bijou]]
      .forEach(function (x) {
        var el = $(x[0]);
        if (!el) return;
        var o = x[1].filter(function (y) { return y.cle === x[2]; })[0];
        el.textContent = o ? o.detail : "";
      });
  }

  function demarrerAtelier() {
    atelier.avatar = R.normaliserAvatar(joueur ? joueur.avatar : R.avatarParDefaut());
    atelier.dir = "bas"; atelier.frame = 0; atelier.t = 0; atelier.auto = true;
    $("#zj-pseudo").value = joueur ? joueur.pseudo : "";
    $("#zj-atelier-bouton").textContent = joueur ? "Retourner dans la cour" : "Entrer dans la Qarawiyine";
    $("#zj-atelier-annuler").hidden = !joueur;
    $("#zj-atelier-titre").textContent = joueur ? "Retoucher mon personnage" : "Mon personnage";
    message("#zj-atelier-msg", "");
    rafraichirAtelier();
    var cv = $("#zj-apercu");
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    atelier.dernier = performance.now();
    function boucle(now) {
      if (ecran !== "atelier") return;
      var dt = Math.min(0.05, (now - atelier.dernier) / 1000); atelier.dernier = now;
      atelier.t += dt;
      // Il marche sur place, et se tourne tout seul tant qu'on ne l'a pas tourné à la main.
      atelier.frame = mouvementReduit ? 0 : [0, 1, 0, 2][Math.floor(atelier.t * 6) % 4];
      if (atelier.auto && !mouvementReduit) atelier.dir = ["bas", "gauche", "haut", "droite"][Math.floor(atelier.t / 1.6) % 4];
      Rd.apercu(cv, atelier.avatar, atelier.dir, atelier.frame);
      atelier.raf = requestAnimationFrame(boucle);
    }
    cancelAnimationFrame(atelier.raf);
    atelier.raf = requestAnimationFrame(boucle);
    setTimeout(function () { var p = $("#zj-pseudo"); if (p && !p.value) p.focus(); }, 50);
  }
  function arreterAtelier() { cancelAnimationFrame(atelier.raf); }

  // ---- La Cour ---------------------------------------------------------------------
  var cour = {
    scene: null, raf: 0, dernier: 0, t: 0,
    perso: { x: 0, y: 0, dir: "bas", frame: 0, avatar: null, animT: 0, bouge: false },
    touches: { haut: false, bas: false, gauche: false, droite: false },
    dialogue: null, aBouge: false, dernierSauv: 0, minuterie: 0, tuileX: -1, tuileY: -1,
    pnjs: []   // v2.5 — les gens de la cour (pnj.js)
  };
  var VITESSE = 58;          // pixels monde par seconde (≈ 3,6 tuiles/s)
  var DEMI_PIED = M.CORPS.demi, HAUT_PIED = M.CORPS.haut; // la boîte de collision (monde.js)
  // v2.6 — le Sahn ouvert (sahn.js) : les autres joueurs, en direct. `autres`
  // est indexé par clé de présence (compte + heure d'entrée) ; `envoi` garde
  // le dernier pas ENVOYÉ ; `maBulle` ce que je viens de dire.
  // 23/09/2026 — `journal` : l'heure des dernières annonces de présence, tous
  // canaux confondus (cinq par 30 s au plus, sinon Supabase ferme le canal) ;
  // `voulu` : la pièce où l'on veut être, que la reprise rejoint si le canal tombe.
  var sahn = { canal: null, cle: null, actif: false, autres: {}, envoi: {}, maBulle: null,
    journal: [], voulu: null, essais: 0, enReprise: false, minuteurReprise: null, minuteurAnnonce: null, minuteurReponse: null };
  // v8.5 — LE KALAM DE LA PIÈCE et LES RASA'IL. Le fil de la pièce vit ICI, dans ce
  // navigateur, et s'efface quand on quitte la pièce (sahn.js : rien n'est gardé nulle
  // part) ; les Rasa'il vivent en base (rasail.js, zawia-rasail.sql). Ceux qu'on
  // n'entend plus : par compte, dans le localStorage de ce navigateur.
  var kalam = { fil: [], recus: {}, dernier: 0, nonVus: 0, mentions: 0, sourds: [], minuteurScene: null };
  var rasail = { fils: [], nouveaux: 0, nonLus: 0, charge: false, erreur: null, avec: null, fil: null,
    signaler: false, envoi: false, msg: "", vu: false };
  var gens = { onglet: "ici", personne: null };
  // v8.6 — LA BITAQA : la carte d'un membre (bitaqa.js, zawia-bitaqa.sql). `cartes` garde
  // une minute ce que la base a rendu, pour qu'un pas d'un autre joueur ne relise pas tout.
  var bitaqa = { mienne: null, cartes: {}, annuaire: null, filtres: {}, page: 0, charge: false, minuteur: null, retour: null, envoi: false };

  function entrerCour(j) {
    joueur = j;
    joueur.avatar = R.normaliserAvatar(joueur.avatar);
    joueur.defis = R.normaliserDefis(joueur.defis);
    joueur.sna3a = R.normaliserSna3a(joueur.sna3a);
    joueur.tahaddi = Th.normaliserTahaddi(joueur.tahaddi);
    joueur.dhakira = Math.max(0, Math.floor(Number(joueur.dhakira) || 0));
    joueur.pages = P.normaliserPages(joueur.pages);
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    afficher("cour");
  }

  function brancherCour() {
    // clavier
    var CLAVIER = {
      ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
      w: "haut", z: "haut", s: "bas", a: "gauche", q: "gauche", d: "droite",
      W: "haut", Z: "haut", S: "bas", A: "gauche", Q: "gauche", D: "droite"
    };
    document.addEventListener("keydown", function (ev) {
      if (ecran !== "cour") return;
      // Les commandes du jeu ne volent pas le clavier des contrôles : un
      // bouton d'un panneau, un <summary> d'al-Moujam ou un lien s'activent
      // à l'Entrée. Seule Échap traverse tout — fermer, d'où qu'on soit.
      if (ev.target && /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(ev.target.tagName) && ev.key !== "Escape") return;
      if (ev.key === "Escape" && $("#zj-dire") && !$("#zj-dire").hidden) { ev.preventDefault(); fermerDire(); return; }
      var dir = CLAVIER[ev.key];
      if (dir) { cour.touches[dir] = true; ev.preventDefault(); return; }
      // v2.6 — T : dire un mot dans la cour (quand le canal est ouvert)
      if ((ev.key === "t" || ev.key === "T") && sahn.actif && !cour.dialogue && !menuOuvert && !panneauOuvert()) { ev.preventDefault(); ouvrirDire(); return; }
      // v8.4 — la Barre au clavier : Y (l-youm) · G les gens · C aller · M le Dar · / chercher
      if (!ev.metaKey && !ev.ctrlKey && !ev.altKey && !cour.dialogue && !panneauOuvert()) {
        var geste = { y: "lyoum", Y: "lyoum", g: "gens", G: "gens", c: "aller", C: "aller", m: "dar", M: "dar", "/": "chercher" }[ev.key];
        if (geste && (!menuOuvert || geste === "dar")) { ev.preventDefault(); gesteBarre(geste); return; }
      }
      // 23/09/2026 — F : ma ferracha (mon tapis au Souk), d'où qu'on soit dans la cour
      if ((ev.key === "f" || ev.key === "F") && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !dayf.actif && !cour.dialogue && !menuOuvert && !panneauOuvert()) { ev.preventDefault(); ouvrirMaFerracha(); return; }
      // v3.2 — les raccourcis du Morchid (1-5 rang, L lignée, J Arb3ine, 0 retirer) : pour lui seul, la base le vérifie
      if (morchid.essai && Mo.estRaccourci(ev.key) && !cour.dialogue && !menuOuvert && !panneauOuvert()) { ev.preventDefault(); incarner(ev.key); return; }
      // v3.6 — R : le Morchid rejoue le début (intro, prologue, tutoriel, Wird du jour 1)
      // ⚠️ La lettre NUE est retirée (23/09/2026) : « r » se frappe en marchant, et
      // ce raccourci efface les pages et la Dhakira. Il faut désormais Maj+Alt+R —
      // une combinaison qu'on ne tape pas par accident. L'entrée du menu reste.
      if (morchid.essai && ev.shiftKey && ev.altKey && (ev.key === "r" || ev.key === "R" || ev.code === "KeyR") && !cour.dialogue && !menuOuvert && !panneauOuvert() && !intro.actif) { ev.preventDefault(); rejouerLeDebut(); return; }
      if (ev.key === "Escape" && $("#zj-majliss") && !$("#zj-majliss").hidden) { ev.preventDefault(); fermerMajliss(); return; }
      if (ev.key === "Escape" && $("#zj-parrainage") && !$("#zj-parrainage").hidden) { ev.preventDefault(); fermerParrainage(); return; }
      if (ev.key === "Escape" && $("#zj-cartes") && !$("#zj-cartes").hidden) { ev.preventDefault(); fermerCartes(); return; }
      if (ev.key === "Escape" && $("#zj-tableaux") && !$("#zj-tableaux").hidden) { ev.preventDefault(); fermerTableaux(); return; }
      if (ev.key === "Escape" && $("#zj-tariqa") && !$("#zj-tariqa").hidden) { ev.preventDefault(); fermerTariqa(); return; }   // v7.0
      if (ev.key === "Escape" && $("#zj-safqa") && !$("#zj-safqa").hidden) { ev.preventDefault(); fermerSafqa(); return; }   // v5.7
      if (ev.key === "Escape" && $("#zj-qissaria") && !$("#zj-qissaria").hidden) { ev.preventDefault(); fermerQissaria(); return; }   // v5.7
      if (ev.key === "Escape" && $("#zj-etal") && !$("#zj-etal").hidden) { ev.preventDefault(); fermerEtal(); return; }
      if (ev.key === "Escape" && $("#zj-combat") && !$("#zj-combat").hidden) { ev.preventDefault(); fermerCombat(); return; }
      if (ev.key === "Escape" && $("#zj-rafiq") && !$("#zj-rafiq").hidden) { ev.preventDefault(); fermerChoixRafiq(); return; }
      if (ev.key === "Escape" && $("#zj-carte") && !$("#zj-carte").hidden) { ev.preventDefault(); fermerCarteRafiq(); return; }
      if (ev.key === "Escape" && $("#zj-duel") && !$("#zj-duel").hidden) { ev.preventDefault(); fermerDuel(); return; }
      if (ev.key === "Escape" && $("#zj-kharita") && !$("#zj-kharita").hidden) { ev.preventDefault(); fermerKharita(); return; }
      if (ev.key === "Escape" && $("#zj-wird") && !$("#zj-wird").hidden) { ev.preventDefault(); fermerWird(); return; }
      if (ev.key === "Escape" && $("#zj-kelma") && !$("#zj-kelma").hidden) { ev.preventDefault(); fermerKelma(); return; }
      if (ev.key === "Escape" && $("#zj-atay") && !$("#zj-atay").hidden) { ev.preventDefault(); fermerAtay(); return; }
      if (ev.key === "Escape" && $("#zj-khessa") && !$("#zj-khessa").hidden) { ev.preventDefault(); fermerKhessa(); return; }
      if (ev.key === "Escape" && $("#zj-qlil") && !$("#zj-qlil").hidden) { ev.preventDefault(); fermerQlil(); return; }
      if (ev.key === "Escape" && $("#zj-aller") && !$("#zj-aller").hidden) { ev.preventDefault(); fermerAller(); return; }   // v8.5
      if (ev.key === "Escape" && $("#zj-bitaqa") && !$("#zj-bitaqa").hidden) { ev.preventDefault(); fermerMaCarte(); return; }   // v8.6
      if (ev.key === "Escape" && $("#zj-gens") && !$("#zj-gens").hidden) {
        ev.preventDefault();
        if (gens.personne) { gens.personne = null; rendreGens(); }
        else if (gens.onglet === "rasail" && rasail.avec) { rasail.avec = null; rasail.fil = null; rasail.signaler = false; rendreGens(); chargerBoite(); }
        else fermerGens();
        return;
      }
      if (ev.key === " " || ev.key === "Spacebar" || ev.code === "Space" || ev.key === "Enter" || ev.key === "e" || ev.key === "E") { ev.preventDefault(); agir(); return; }
      if (ev.key === "Escape" && $("#zj-imtihan") && !$("#zj-imtihan").hidden) { ev.preventDefault(); fermerImtihan(); return; }
    if (ev.key === "Escape" && $("#zj-tableau") && !$("#zj-tableau").hidden) { ev.preventDefault(); fermerTableau(); return; }
    if (ev.key === "Escape" && $("#zj-souk") && !$("#zj-souk").hidden) { ev.preventDefault(); if (!fermerFiche()) fermerSouk(); return; }
    if (ev.key === "Escape" && $("#zj-riwaq") && !$("#zj-riwaq").hidden) { ev.preventDefault(); fermerRiwaq(); return; }
    if (ev.key === "Escape" && $("#zj-kounnach") && !$("#zj-kounnach").hidden) { ev.preventDefault(); fermerKounnach(); return; }
    if (ev.key === "Escape" && $("#zj-masarat") && !$("#zj-masarat").hidden) { ev.preventDefault(); fermerMasarat(); return; }
    if (ev.key === "Escape" && $("#zj-maharat") && !$("#zj-maharat").hidden) { ev.preventDefault(); fermerMaharat(); return; }
    if (ev.key === "Escape" && $("#zj-rkhama") && !$("#zj-rkhama").hidden) { ev.preventDefault(); fermerRkhama(); return; }
    if (ev.key === "Escape" && $("#zj-ijaza") && !$("#zj-ijaza").hidden) { ev.preventDefault(); fermerCarteIjaza(); return; }
    if (ev.key === "Escape" && $("#zj-bibliotheque") && !$("#zj-bibliotheque").hidden) { ev.preventDefault(); fermerBibliotheque(); return; }
    if (ev.key === "Escape") { if (cour.dialogue) fermerDialogue(); else basculerMenu(false); }
    });
    document.addEventListener("keyup", function (ev) {
      var dir = CLAVIER[ev.key];
      if (dir) cour.touches[dir] = false;
    });
    window.addEventListener("blur", function () { for (var k in cour.touches) cour.touches[k] = false; });

    // tactile
    $$("#zj-tactile [data-dir]").forEach(function (b) {
      var dir = b.getAttribute("data-dir");
      var presser = function (ev) { ev.preventDefault(); cour.touches[dir] = true; b.classList.add("actif"); };
      var lacher = function () { cour.touches[dir] = false; b.classList.remove("actif"); };
      b.addEventListener("pointerdown", presser);
      b.addEventListener("pointerup", lacher); b.addEventListener("pointercancel", lacher); b.addEventListener("pointerleave", lacher);
      b.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    });
    var a = $("#zj-bouton-a");
    if (a) { a.addEventListener("pointerdown", function (ev) { ev.preventDefault(); agir(); }); a.addEventListener("contextmenu", function (ev) { ev.preventDefault(); }); }

    // la boîte de dialogue se ferme / avance au clic
    var dlg = $("#zj-dialogue");
    if (dlg) dlg.addEventListener("click", function () { agir(); });

    // menu
    $("#zj-menu-bouton").addEventListener("click", function () { basculerMenu(); });
    $("#zj-menu-fermer").addEventListener("click", function () { basculerMenu(false); });
    brancherDar();   // v8.4 — le Dar, la Barre, Aller, Les gens
    $("#zj-menu-perso").addEventListener("click", function () { basculerMenu(false); sauvegarderPosition(); afficher("atelier"); });
    var imtB = $("#zj-menu-imtihan");
    if (imtB) imtB.addEventListener("click", function () { ouvrirImtihan(); });
    var fermeI = $("#zj-imtihan-fermer");
    if (fermeI) fermeI.addEventListener("click", fermerImtihan);
    var tabB = $("#zj-menu-tableau");
    if (tabB) tabB.addEventListener("click", function () { ouvrirTableau(); });
    var fermeT = $("#zj-tableau-fermer");
    if (fermeT) fermeT.addEventListener("click", fermerTableau);
    var fondT = $("#zj-tableau");
    if (fondT) fondT.addEventListener("click", function (ev) { if (ev.target === fondT) fermerTableau(); });
    var soukB = $("#zj-menu-souk");
    // v5.7 — le Souk est une place : le menu y mène ; sur la place, il ouvre tout le Souk d'un coup d'œil
    if (soukB) soukB.addEventListener("click", function () { if (rahba.active) ouvrirSouk({ source: "tout" }); else entrerRahba(); });
    var safqaB = $("#zj-menu-safqa");
    if (safqaB) safqaB.addEventListener("click", function () { ouvrirSafqa(); });
    var fermeSf = $("#zj-safqa-fermer");
    if (fermeSf) fermeSf.addEventListener("click", fermerSafqa);
    var fondSf = $("#zj-safqa");
    if (fondSf) fondSf.addEventListener("click", function (ev) { if (ev.target === fondSf) fermerSafqa(); });
    var fermeQs = $("#zj-qissaria-fermer");
    if (fermeQs) fermeQs.addEventListener("click", fermerQissaria);
    var fondQs = $("#zj-qissaria");
    if (fondQs) fondQs.addEventListener("click", function (ev) { if (ev.target === fondQs) fermerQissaria(); });
    var mjMenu = $("#zj-menu-majliss");
    if (mjMenu) mjMenu.addEventListener("click", function () { ouvrirMajliss(); });
    // v4.1 — parrainer : au menu des gens de la maison
    var parB = $("#zj-menu-parrainer");
    if (parB) parB.addEventListener("click", function () { ouvrirParrainage(); });
    var fermeP = $("#zj-parrainage-fermer");
    if (fermeP) fermeP.addEventListener("click", fermerParrainage);
    var fondP = $("#zj-parrainage");
    if (fondP) fondP.addEventListener("click", function (ev) { if (ev.target === fondP) fermerParrainage(); });
    var cartesB = $("#zj-menu-cartes");
    if (cartesB) cartesB.addEventListener("click", function () { ouvrirCartes(); });
    // v7.0 — la Tariqa : au menu (Moi), la croix, le fond
    var tariqaB = $("#zj-menu-tariqa");
    if (tariqaB) tariqaB.addEventListener("click", function () { ouvrirTariqa(); });
    var fermeTq = $("#zj-tariqa-fermer");
    if (fermeTq) fermeTq.addEventListener("click", function () { fermerTariqa(); });
    var fondTq = $("#zj-tariqa");
    if (fondTq) fondTq.addEventListener("click", function (ev) { if (ev.target === fondTq) fermerTariqa(); });
    // v4.0 — la Kharita : la carte du grand monde
    var kharitaB = $("#zj-menu-kharita");
    if (kharitaB) kharitaB.addEventListener("click", function () { ouvrirKharita(); });
    var fermeK = $("#zj-kharita-fermer");
    if (fermeK) fermeK.addEventListener("click", fermerKharita);
    var fondK = $("#zj-kharita");
    if (fondK) fondK.addEventListener("click", function (ev) { if (ev.target === fondK) fermerKharita(); });
    // v3.6 — le Wird : au menu, sur la ligne du HUD, et sa croix
    var wirdB = $("#zj-menu-wird");
    if (wirdB) wirdB.addEventListener("click", function () { ouvrirWird(); });
    // 23/09/2026 — ma ferracha, d'un geste depuis n'importe où (et la touche F)
    var ferrachaB = $("#zj-menu-ferracha");
    if (ferrachaB) ferrachaB.addEventListener("click", function () { ouvrirMaFerracha(); });
    var wirdH = $("#zj-hud-wird");
    if (wirdH) wirdH.addEventListener("click", function () { ouvrirWird(); });
    var fermeW = $("#zj-wird-fermer");
    if (fermeW) fermeW.addEventListener("click", fermerWird);
    // v4.7 — les jeux de la zawia : au menu, leurs croix, leur fond
    var kelmaB = $("#zj-menu-kelma");
    if (kelmaB) kelmaB.addEventListener("click", function () { ouvrirKelma(); });
    var khessaB = $("#zj-menu-khessa");
    if (khessaB) khessaB.addEventListener("click", function () { ouvrirKhessa(); });
    // v7.7 — le Mechouar : dans la cour, le fil d'or jusqu'à sa porte ; sur la place, le panneau
    cablerMechouar();
    var mechB = $("#zj-menu-mechouar");
    if (mechB) mechB.addEventListener("click", function () {
      basculerMenu(false);
      if (mechouar.active) { ouvrirMechouar(); return; }
      if (rahba.active) sortirRahba();
      if (rihla.active) sortirRihla();
      guide.tuile = "C"; guide.fil = null; guide.deTuile = ""; guide.jeu = true;
    });
    var qlilB = $("#zj-menu-qlil");
    if (qlilB) qlilB.addEventListener("click", function () { ouvrirQlil(); });
    // v5.2 — la Rihla : dans la zawia, le fil d'or jusqu'à la porte ; dans Fès, le retour
    var rihlaB = $("#zj-menu-rihla");
    if (rihlaB) rihlaB.addEventListener("click", function () {
      if (rihla.active) { sortirRihla(); return; }
      basculerMenu(false);
      guide.tuile = "R"; guide.fil = null; guide.deTuile = ""; guide.jeu = true;
    });
    // v5.4 — la carte du Rafiq, et le duel par lien
    var carteB = $("#zj-menu-carte");
    if (carteB) carteB.addEventListener("click", ouvrirCarteRafiq);
    var duelB = $("#zj-menu-duel");
    if (duelB) duelB.addEventListener("click", ouvrirDuel);
    [["#zj-carte", fermerCarteRafiq], ["#zj-duel", fermerDuel]].forEach(function (x) {
      var fond = $(x[0]), croix = $(x[0] + "-fermer");
      if (croix) croix.addEventListener("click", x[1]);
      if (fond) fond.addEventListener("click", function (ev) { if (ev.target === fond) x[1](); });
    });
    var partB = $("#zj-carte-partager");
    if (partB) partB.addEventListener("click", partagerCarte);
    var defiB = $("#zj-carte-defi");
    if (defiB) defiB.addEventListener("click", ouvrirDuel);
    var fuirB = $("#zj-combat-fuir");   // v5.3 — reculer devant une ombre ne coûte rien
    if (fuirB) fuirB.addEventListener("click", fermerCombat);
    var fermeRf = $("#zj-rafiq-fermer");
    if (fermeRf) fermeRf.addEventListener("click", fermerChoixRafiq);
    var fermeEt = $("#zj-etal-fermer");
    if (fermeEt) fermeEt.addEventListener("click", fermerEtal);
    var fondEt = $("#zj-etal");
    if (fondEt) fondEt.addEventListener("click", function (ev) { if (ev.target === fondEt) fermerEtal(); });
    var atayB = $("#zj-menu-atay");   // v5.1 — l'atay n'était qu'au pied des orangers
    if (atayB) atayB.addEventListener("click", function () { ouvrirAtay(); });
    [["#zj-kelma", fermerKelma], ["#zj-atay", fermerAtay], ["#zj-khessa", fermerKhessa], ["#zj-qlil", fermerQlil]].forEach(function (x) {
      var fond = $(x[0]), croix = $(x[0] + "-fermer");
      if (croix) croix.addEventListener("click", x[1]);
      if (fond) fond.addEventListener("click", function (ev) { if (ev.target === fond) x[1](); });
    });
    // Le clavier de la kelma : les lettres, Entrée, Retour arrière. Entrée sur
    // un autre bouton du panneau (Partager, Fermer…) garde son sens.
    document.addEventListener("keydown", function (ev) {
      if (ecran !== "cour" || !Km) return;
      var pk = $("#zj-kelma");
      if (!pk || pk.hidden || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var cible = ev.target && ev.target.tagName;
      if (cible === "TEXTAREA" || cible === "INPUT") return;
      if (ev.key === "Enter") { if (cible === "BUTTON" && !ev.target.hasAttribute("data-k")) return; ev.preventDefault(); kelmaTouche(Km.ENTREE); return; }
      if (ev.key === "Backspace") { ev.preventDefault(); kelmaTouche(Km.EFFACER); return; }
      if (ev.key && Km.lettres(ev.key).length === 1) {
        var ch = Km.normaliser(ev.key, langueKelma());
        if (Km.LETTRES[langueKelma()].indexOf(ch) >= 0) { ev.preventDefault(); kelmaTouche(ch); }
      }
    });
    // L'atay : la barre d'espace, TENUE, lève la théière.
    document.addEventListener("keydown", function (ev) {
      var pa = $("#zj-atay");
      if (ecran !== "cour" || !pa || pa.hidden) return;
      if (ev.key !== " " && ev.code !== "Space") return;
      if (!atay.etat || atay.etat.fini) return;   // fini : l'espace rend la main aux boutons (Servir encore)
      ev.preventDefault();
      if (!ev.repeat) { atay.tient = true; var b = $("#zj-atay-verser"); if (b) b.classList.add("actif"); }
    });
    document.addEventListener("keyup", function (ev) {
      var pa = $("#zj-atay");
      if (!pa || pa.hidden || (ev.key !== " " && ev.code !== "Space")) return;
      if (!atay.etat || atay.etat.fini) { atay.tient = false; return; }
      ev.preventDefault();
      atay.tient = false; var b = $("#zj-atay-verser"); if (b) b.classList.remove("actif");
    });
    window.addEventListener("blur", function () { atay.tient = false; });
    var rejouerB = $("#zj-menu-rejouer");
    if (rejouerB) rejouerB.addEventListener("click", function () { rejouerLeDebut(); });
    var fondW = $("#zj-wird");
    if (fondW) fondW.addEventListener("click", function (ev) { if (ev.target === fondW) fermerWird(); });
    var fermeC = $("#zj-cartes-fermer");
    if (fermeC) fermeC.addEventListener("click", fermerCartes);
    var fermeMj = $("#zj-majliss-fermer");
    if (fermeMj) fermeMj.addEventListener("click", fermerMajliss);
    var fermeS = $("#zj-souk-fermer");
    if (fermeS) fermeS.addEventListener("click", fermerSouk);
    // v4.4 — dans une fiche, ← → passent au produit voisin (sens de lecture
    // respecté en arabe), sauf quand on écrit dans un champ.
    var panneauS = $("#zj-souk");
    if (panneauS) panneauS.addEventListener("keydown", function (ev) {
      if (!souk.fiche || /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target && ev.target.tagName) || "")) return;
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
      ev.preventDefault();
      ev.stopPropagation();
      var rtl = document.documentElement.getAttribute("dir") === "rtl";
      passerFiche((ev.key === "ArrowRight") !== rtl ? 1 : -1);
    });
    var fondS = $("#zj-souk");
    if (fondS) fondS.addEventListener("click", function (ev) { if (ev.target === fondS) fermerSouk(); });

    // ⚠️ Quitter la fenêtre pendant une question la brûle. On écoute les deux
    //    signaux : l'onglet qui passe en arrière-plan, et la fenêtre qui perd
    //    le focus (un autre écran, une autre application).
    document.addEventListener("visibilitychange", function () { if (document.hidden) abandonner("onglet"); });
    window.addEventListener("blur", function () { abandonner("focus"); });

    var riwaqB = $("#zj-menu-riwaq");
    if (riwaqB) riwaqB.addEventListener("click", function () { ouvrirRiwaq(); });
    var fermeR = $("#zj-riwaq-fermer");
    if (fermeR) fermeR.addEventListener("click", fermerRiwaq);
    var fondR = $("#zj-riwaq");
    if (fondR) fondR.addEventListener("click", function (ev) { if (ev.target === fondR) fermerRiwaq(); });

    var biblioB = $("#zj-menu-bibliotheque");
    if (biblioB) biblioB.addEventListener("click", function () { ouvrirBibliotheque(); });
    var fermeB = $("#zj-bibliotheque-fermer");
    if (fermeB) fermeB.addEventListener("click", fermerBibliotheque);
    var fondB = $("#zj-bibliotheque");
    if (fondB) fondB.addEventListener("click", function (ev) { if (ev.target === fondB) fermerBibliotheque(); });

    // v6.0 — le Kounnach : deux entrées du menu, la croix, le fond ; et le Wird qui y mène
    var kounB = $("#zj-menu-kounnach");
    if (kounB) kounB.addEventListener("click", function () { ouvrirKounnach(); });
    var wasfaB = $("#zj-menu-wasfa");
    if (wasfaB) wasfaB.addEventListener("click", function () { ouvrirKounnach({ ecrire: true }); });
    var fermeK = $("#zj-kounnach-fermer");
    if (fermeK) fermeK.addEventListener("click", fermerKounnach);
    // v6.1 — les Masarat : l'entrée du menu, la croix, le fond
    var masB = $("#zj-menu-masarat");
    if (masB) masB.addEventListener("click", function () { ouvrirMasarat(); });
    var fermeMs = $("#zj-masarat-fermer");
    if (fermeMs) fermeMs.addEventListener("click", fermerMasarat);
    var fondMs = $("#zj-masarat");
    if (fondMs) fondMs.addEventListener("click", function (ev) { if (ev.target === fondMs) fermerMasarat(); });
    // v7.8 — les Maharat : l'entrée du menu, la croix, le fond
    var mahB = $("#zj-menu-maharat");
    if (mahB) mahB.addEventListener("click", function () { ouvrirMaharat(); });
    var fermeMh = $("#zj-maharat-fermer");
    if (fermeMh) fermeMh.addEventListener("click", fermerMaharat);
    var fondMh = $("#zj-maharat");
    if (fondMh) fondMh.addEventListener("click", function (ev) { if (ev.target === fondMh) fermerMaharat(); });
    // v8.0 — la Rkhama : l'entrée du menu, la croix, le fond
    var rkB = $("#zj-menu-rkhama");
    if (rkB) rkB.addEventListener("click", function () { ouvrirRkhama(); });
    var fermeRk = $("#zj-rkhama-fermer");
    if (fermeRk) fermeRk.addEventListener("click", fermerRkhama);
    var fondRk = $("#zj-rkhama");
    if (fondRk) fondRk.addEventListener("click", function (ev) { if (ev.target === fondRk) fermerRkhama(); });
    // v7.8 — la carte de l'Ijaza : l'entrée du menu, la croix, le fond, le partage
    var ijB = $("#zj-menu-ijaza");
    if (ijB) ijB.addEventListener("click", function () { ouvrirCarteIjaza(); });
    var fermeIj = $("#zj-ijaza-fermer");
    if (fermeIj) fermeIj.addEventListener("click", fermerCarteIjaza);
    var fondIj = $("#zj-ijaza");
    if (fondIj) fondIj.addEventListener("click", function (ev) { if (ev.target === fondIj) fermerCarteIjaza(); });
    var partIj = $("#zj-ijaza-partager");
    if (partIj) partIj.addEventListener("click", partagerIjaza);
    var fondK = $("#zj-kounnach");
    if (fondK) fondK.addEventListener("click", function (ev) { if (ev.target === fondK) fermerKounnach(); });
    var wirdCorps = $("#zj-wird-corps");
    if (wirdCorps) wirdCorps.addEventListener("click", function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-kounnach]") : null;
      if (b) { fermerWird(); ouvrirKounnach({ id: b.getAttribute("data-kounnach") }); }
    });

    var carnet = $("#zj-menu-carnet");
    if (carnet) carnet.addEventListener("click", function () { basculerMenu(false); ouvrirCarnet(); });
    var relire = $("#zj-menu-prologue");
    if (relire) relire.addEventListener("click", function () { basculerMenu(false); ouvrirDialogue(Rc.prologue({ pseudo: joueur.pseudo })); });
    var tutoB = $("#zj-menu-tutoriel");
    if (tutoB) tutoB.addEventListener("click", function () { basculerMenu(false); relancerTutoriel(); });
    var tutoX = $("#zj-tuto-passer");
    if (tutoX) tutoX.addEventListener("click", function () { finirTutoriel(); });

    // le sandouq : la réponse saisie, l'indice, l'abandon
    var form = $("#zj-question");
    if (form) {
      form.addEventListener("click", function (ev) { ev.stopPropagation(); });
      form.addEventListener("submit", function (ev) { ev.preventDefault(); repondre(); });
      var indice = $("#zj-indice");
      if (indice) indice.addEventListener("click", function () { demanderIndice(); });
      var inp = $("#zj-reponse");
      if (inp) inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); fermerDialogue(); } });
    }
    // v2.6 — dire un mot dans la cour
    var direB = $("#zj-menu-dire");
    if (direB) direB.addEventListener("click", function () { basculerMenu(false); ouvrirGens("kalam"); });   // v8.5 — le Kalam de la pièce (T reste la barre rapide)
    var rasB = $("#zj-menu-rasail");
    if (rasB) rasB.addEventListener("click", function () { basculerMenu(false); ouvrirGens("rasail"); });   // v8.5 — les Rasa'il
    var bqB = $("#zj-menu-bitaqa");
    if (bqB) bqB.addEventListener("click", function () { basculerMenu(false); ouvrirMaCarte(); });   // v8.6 — ma carte de membre
    var derbB = $("#zj-menu-derb");
    if (derbB) derbB.addEventListener("click", function () { basculerMenu(false); ouvrirSouk({ source: "derb" }); });   // v8.7 — le Derb t-Tadamoun
    var direF = $("#zj-dire");
    if (direF) {
      direF.addEventListener("submit", function (ev) { ev.preventDefault(); direUnMot(); });
      var direX = $("#zj-dire-fermer");
      if (direX) direX.addEventListener("click", fermerDire);
    }
    $("#zj-menu-sortir").addEventListener("click", function () { basculerMenu(false); sortirDeLaMaison(); });

    window.addEventListener("resize", function () { if (cour.scene) cour.scene.redimensionner(); majTactile(); placerSousHud(); });
    // v4.6 — la bannière du tutoriel se pose sous le HUD, quelle que soit sa
    // hauteur (une ligne de plus pour le masque du Morchid, le Wird qui paraît).
    var hudEl = $("#zj-hud");
    if (hudEl && window.ResizeObserver) new ResizeObserver(placerSousHud).observe(hudEl);
    // v4.6 — le clavier d'un téléphone recouvre le bas de l'écran sans rien
    // redimensionner : on mesure ce qu'il cache (visualViewport) et la boîte
    // de dialogue, avec sa réponse, remonte d'autant.
    var vv = window.visualViewport;
    if (vv) {
      var majClavier = function () {
        var cache = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        document.documentElement.style.setProperty("--zj-clavier", (cache > 80 ? cache : 0) + "px");
      };
      vv.addEventListener("resize", majClavier);
      vv.addEventListener("scroll", majClavier);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) sauvegarderPosition();
      // Un onglet caché voit ses minuteries ralenties à la seconde :
      // l'ordonnanceur hoquette. On met en veille, on repart au retour.
      if (orchestre) { if (document.hidden) orchestre.arreter(); else orchestre.demarrer(); }
      // 23/09/2026 — de retour sur l'onglet, un canal tombé se reprend tout de suite,
      // sans attendre la fin de sa patience ; et on redit sa place à ceux qui nous ont vu s'assoupir.
      if (!document.hidden && sahn.voulu && sahn.minuteurReprise) {
        clearTimeout(sahn.minuteurReprise); sahn.minuteurReprise = null; sahn.essais = 0; reprendreSahn(0);
      } else if (!document.hidden && sahn.actif) repondreArrivee();
      if (!document.hidden) relireNonLus();   // v8.5 — ce qui m'a été écrit pendant que je n'étais pas là
    });
    window.addEventListener("pagehide", function () { sauvegarderPosition(); });
  }

  // La croix et le bouton A : sur un écran tactile, ou étroit.
  function placerSousHud() {
    var hud = $("#zj-hud"), cadre = $("#zj-scene-cadre");
    if (!hud || !cadre) return;
    var r = hud.getBoundingClientRect();
    if (!r.height) return;   // la cour n'est pas affichée
    cadre.style.setProperty("--zj-hud-bas", Math.round(r.bottom + 10) + "px");
  }
  function majTactile() {
    var tactile = $("#zj-tactile");
    if (tactile) tactile.hidden = !((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || window.innerWidth < 900);
  }

  function demarrerCour() {
    var cv = $("#zj-scene");
    chargerKounnach().then(function () { rafraichirHud(); });   // v6.0 — la liste du Kounnach, une fois par session (le HUD la dit)
    // v5.2 — on (re)entre toujours dans la zawia : la Rihla se rouvre par sa porte
    if (rihla.active || M !== Mz) { rihla.active = false; document.body.removeAttribute("data-rihla"); fermerEtal(); M = Mz; Rd.utiliserMonde(Mz); cour.scene = null; }
    if (mechouar.active) { mechouar.active = false; document.body.removeAttribute("data-mechouar"); fermerMechouar(); }
    if (rahba.active) { rahba.active = false; document.body.removeAttribute("data-rahba"); fermerSouk(); fermerQissaria(); }   // v5.7 — la Rahba aussi se rouvre par son Bab
    if (!cour.scene) {
      try { cour.scene = Rd.creerScene(cv); }
      catch (e) { $("#zj-cour-erreur").hidden = false; $("#zj-cour-erreur").textContent = "Le dessin ne démarre pas : " + e.message; return; }
    }
    cour.scene.redimensionner();
    // le même contexte 2D que la scène : le fil d'or se dessine par-dessus
    cour.ctx = cv.getContext("2d");
    var p = cour.perso;
    p.avatar = joueur.avatar;
    if (M.positionValide(joueur.position)) { p.x = Number(joueur.position.x); p.y = Number(joueur.position.y); p.dir = M.DIRS[joueur.position.dir] ? joueur.position.dir : "bas"; }
    else { p.x = M.APPARITION.x * T + T / 2; p.y = M.APPARITION.y * T + T - 1; p.dir = M.APPARITION.dir; }
    // Le filet, après les deux branches : si la carte a changé sous cette
    // position — une tuile devenue solide sous un coin de la boîte —, on dégage
    // d'un pas plutôt que de laisser quelqu'un immobile devant un jeu qui a
    // l'air planté. Sans effet quand la place est déjà bonne.
    var degage = M.degager(p.x, p.y);
    p.x = degage.x; p.y = degage.y;
    // v2.5 — les PNJ reprennent leur place à chaque entrée ; et si le joueur
    // avait été enregistré là où l'un d'eux se tient, c'est le joueur qui
    // fait un pas de côté — jamais deux corps l'un dans l'autre.
    cour.pnjs = Pn ? Pn.creer() : [];
    degagerDesGens(p);
    p.frame = 0; p.animT = 0; p.bouge = false;
    chargerImageRafiq();   // v5.3 — le Rafiq suit aussi dans la zawia
    for (var k in cour.touches) cour.touches[k] = false;
    document.body.setAttribute("data-dialogue", cour.dialogue ? "1" : "0");
    setTimeout(placerSousHud, 0);
    fermerDialogue(); basculerMenu(false);
    rafraichirHud();
    clearInterval(cour.minuterie);
    cour.minuterie = setInterval(rafraichirHud, 60 * 1000);
    // v4.7 — la fontaine du Sahn : lue à l'entrée, puis toutes les cinq minutes
    khessa.etat = null; khessa.verses = {};
    chargerKhessa().then(function () { verserGoutteWird(wirdEtat()); });   // un Wird déjà tenu aujourd'hui verse à l'entrée
    chargerSirr();   // v7.6 — les sept traces, telles que la base les compte
    clearInterval(cour.minuterieKhessa);
    cour.minuterieKhessa = setInterval(chargerKhessa, 5 * 60 * 1000);
    // le HUD : le petit portrait
    var mini = $("#zj-hud-avatar");
    if (mini) {
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      mini.width = Math.round(mini.clientWidth * dpr); mini.height = Math.round(mini.clientHeight * dpr);
      var mc = mini.getContext("2d"); mc.imageSmoothingEnabled = true;   // v3.0 : peint, lissé
      var z = Math.max(1, Math.floor(mini.height / (Rd.PH + 1)));
      Rd.dessinerPerso(mc, joueur.avatar, "bas", 0, mini.width / 2, mini.height - z, z, false);
    }
    majTactile();
    if (sahn.canal && sahn.voulu !== (Sh && Sh.CANAL)) quitterSahn();   // 23/09/2026 — jamais le canal d'une autre pièce
    entrerSahn();

    if (orchestre) {
      orchestre.allerA(Mu.lieuPour(Math.floor(p.x / T), Math.floor(p.y / T)));
      orchestre.demarrer();
      majBoutonSon();
      sonner("entree");
    }

    // La première fois dans la cour : le prologue de la Rihla. Relisible au menu.
    // Le tutoriel prend le relais à la fermeture du prologue — et se reprend
    // ici, à l'étape laissée, si une session s'est fermée en cours de route.
    // v7.2 — un invité n'entre pas dans le récit de la maison : le prologue,
    // le tutoriel et la tariqa sont l'affaire de ceux qui restent. Lui, on le
    // reçoit — c'est Ba Driss, et rien d'autre.
    if (hanout.code) setTimeout(direMotHanout, 2500);   // v7.8 — il attend son tour, après l'accueil
    if (dayf.actif) setTimeout(accueillirDayf, 900);
    else if (!Rc.prologueVu(joueur)) ouvrirDialogue(Rc.prologue({ pseudo: joueur.pseudo }));
    else if (Tt && Tt.enCours(joueur.recit.tutoriel) && !tuto.actif) demarrerTutoriel(true);
    else if (Jx && Jx.aAnnoncer(joueur.recit)) setTimeout(annoncerJeux, 900);   // v5.1
    else if (Tq && Tq.aDemander(joueur)) setTimeout(function () { demanderTariqa(null); }, 900);   // v7.0 — une fois, pour les anciens
    majBanniere();
    chargerQlil();   // v5.1 — le Wird et le losange de l'établi savent si un trou est joué
    chargerSafqat();   // v5.7 — mes affaires : le Bab s'allume si l'une attend ma réponse
    chargerSourds();   // v8.5 — ceux qu'on n'entend plus, dans ce navigateur
    rasail.vu = false; relireNonLus();   // v8.5 — la pastille des messages, dès l'entrée
    clearInterval(cour.minuterieRasail);
    cour.minuterieRasail = setInterval(relireNonLus, Rl ? Rl.RELECTURE_MS : 60000);
    chargerRkhama();   // v8.0 — la dalle du Sahn : ce qu'elle porte, et si elle porte quelque chose
    chargerQissaria();   // v7.3 — au passage, l'énoncé du défi du Voilé (genre « defi »)

    cour.dernier = performance.now();
    cancelAnimationFrame(cour.raf);
    cour.raf = requestAnimationFrame(boucleCour);
  }
  function arreterCour() {
    cancelAnimationFrame(cour.raf);
    clearInterval(cour.minuterie);
    clearInterval(cour.minuterieKhessa);
    clearInterval(cour.minuterieRasail);
    fermerAtay();
    quitterSahn();
    // On ne coupe pas la musique : `afficher()` a déjà changé de lieu, et une
    // maison ne se tait pas parce qu'on est passé dans l'Atelier.
  }

  function rafraichirHud() {
    if (!joueur) return;
    var a = R.arb3ine(debutArb3ine());
    var r = R.rang(joueur.rang);
    $("#zj-hud-pseudo").textContent = joueur.pseudo;
    // v7.2 — un invité n'a pas de rang : le premier degré est Talib, et il se
    // mérite. Lui montrer « Talib » lui donnerait ce qu'il n'a pas demandé.
    $("#zj-hud-rang").textContent = dayf.actif ? "Dayf" : r.nom;
    $("#zj-hud-rang-ar").textContent = dayf.actif ? "ضيف" : r.ar;
    $("#zj-hud-arb3ine").textContent = a.ecoule ? a.libelle : "Arb3ine · " + a.libelle;
    $("#zj-hud-arb3ine").title = a.ecoule ? "Les 40 jours sont passés." : "Jour " + a.jour + " sur " + a.total;
    // v5.5 — trois nombres, pas six : le M39ol (le rang), la Sna3a (le niveau du
    // Rafiq), les cartes (la Dhakira). Le jour de l'Arb3ine vit dans la ligne du Wird ;
    // le souffle et les mouzounat, dans Fès seulement.
    $("#zj-hud-arb3ine").hidden = true;
    // La lignée : le libellé vient du SERVEUR, qui ne le rend qu'à son
    // porteur — jamais du code (le voile). Un Talib libre voit son statut.
    var st = Cj.statut(lignee.maison);
    // v7.2 — un invité n'a ni rang ni lignée : il a une hospitalité. Le menu
    // dit où il en est de ses trois jours, et jamais un compteur.
    $("#zj-menu-qui").textContent = dayf.actif
      ? joueur.pseudo + " · " + Dy.ligne(dayf.etat, jourDeLaMaison())
      : joueur.pseudo + " · " + r.nom + " · " + (lignee.chajara || st.nom);
    var dyB = $("#zj-menu-dyaf");
    if (dyB) dyB.hidden = !dayf.actif;
    // v7.3 — la qubba du Voilé est ouverte à TOUT LE MONDE : ses légendes sont
    // ce que la maison veut transmettre, pas une récompense. Les cinq épreuves,
    // elles, sont le chemin d'un invité.
    var tbB = $("#zj-menu-tableaux");
    if (tbB) tbB.hidden = false;
    var omB = $("#zj-menu-oumm");
    if (omB) omB.hidden = !dayf.actif;
    var imtB = $("#zj-menu-imtihan");
    if (imtB) imtB.hidden = !lignee.maison;   // cosmétique — la vraie porte est en base
    // v3.2 — le masque porté, dit au HUD ; l'aide des raccourcis, au menu du Morchid seul
    var mq = $("#zj-hud-masque");
    if (mq) { var lib = morchid.actif ? Mo.libelle(morchid.masque, R) : ""; mq.textContent = lib; mq.hidden = !lib; }
    var aide = $("#zj-menu-raccourcis");
    if (aide) { aide.hidden = !morchid.essai; aide.textContent = Mo.AIDE; }   // v8.2 — le compte d'essai seul
    var rejB = $("#zj-menu-rejouer");
    if (rejB) rejB.hidden = !morchid.essai;   // v3.6 — le Morchid seul ; v8.2 — son compte d'ESSAI seul (la base dit qui)
    // v3.5 — la chambre du Majliss s'ouvre aussi du menu, pour ses membres seuls (la base tient la porte)
    var mjB = $("#zj-menu-majliss");
    if (mjB) mjB.hidden = !majliss.membre;
    // v8.0 — la Rkhama ne s'annonce que si la maison a gravé quelque chose :
    // une salle vide ne se propose pas, et la dalle nue ne s'allume pas non plus.
    var rkM = $("#zj-menu-rkhama");
    if (rkM) rkM.hidden = !rkhamaAQuoiLire();
    // v4.1 — seuls les gens de la maison parrainent (la base le vérifie aussi)
    var parB = $("#zj-menu-parrainer");
    if (parB) parB.hidden = !lignee.maison;
    // v5.2 — la Rihla au HUD : le souffle et la bourse ; le menu dit dans quel sens on va
    var rhH = $("#zj-hud-rihla");
    if (rhH) {
      rhH.hidden = !(rihla.active || rahba.active);
      if (rihla.active && rihla.etat) { var mxR = maxRihla(); rhH.textContent = "Fès · Nfs " + Rh.nfs(rihla.etat, mxR) + "/" + mxR + " · " + Rh.mz(rihla.etat) + " mouzounat"; }
      else if (rahba.active && rahba.dansDerb) rhH.textContent = "Derb t-Tadamoun · " + rahba.projets + " projet" + (rahba.projets > 1 ? "s" : "");   // v8.7
      else if (rahba.active) rhH.textContent = "La Rahba · " + rahba.marchands + " ferracha" + (rahba.marchands > 1 ? "s" : "");   // v5.7
    }
    // v5.7 — mes affaires : le menu dit combien attendent ma réponse
    // v7.1 — et combien de mots n'ont pas été lus : une affaire qui n'attend
    // aucun geste mais où l'autre a parlé mérite qu'on y revienne.
    var sfB = $("#zj-menu-safqa");
    if (sfB) {
      var neufs = Kl ? Kl.nonLus(safqa.liste) : 0;
      sfB.textContent = safqa.aTraiter > 0 ? "Mes affaires · " + safqa.aTraiter + " à traiter"
        : (neufs > 0 ? "Mes affaires · " + neufs + " mot" + (neufs > 1 ? "s" : "") + " à lire" : "Mes affaires");
    }
    // v7.8 — « Le Lawh » ouvrait le tableau, pas soi : le lien porte le pseudo,
    // posé ICI et jamais en dur dans la page (un pseudo ne se code pas).
    var lwB = $("#zj-menu-lawh");
    if (lwB) lwB.setAttribute("href", joueur && joueur.pseudo ? "/lawh?q=" + encodeURIComponent(joueur.pseudo) : "/lawh");
    var aRafiq = !!(Rf && Rh && etatRihla().rf);   // v5.4 — la carte et le duel, pour qui a un Rafiq
    ["#zj-menu-carte", "#zj-menu-duel"].forEach(function (id) { var b = $(id); if (b) b.hidden = !aRafiq; });
    // v5.5 — le menu propose ce qui est ouvert, et dit une fois ce qui vient (paliers.js)
    if (Pa) {
      var pc = palierCtx();
      ["rihla", "kelma", "atay", "qlil", "khessa", "nsyan", "wach"].forEach(function (cle) {
        var b = $("#zj-menu-" + cle);
        if (b) b.hidden = !(cle === "rihla" && rihla.active) && !Pa.ouvert(cle, pc);
      });
      var bt = $("#zj-menu-bientot");
      if (bt) { var tb = Pa.bientot(pc); bt.textContent = tb; bt.hidden = !tb; }
    }
    var rhB = $("#zj-menu-rihla");
    if (rhB) rhB.textContent = rihla.active ? "Rentrer à la zawia" : "La Rihla — sortir dans Fès";
    var c = R.carnet(joueur), th = Th.etat(joueur.tahaddi), pg = P.etat(joueur.pages);
    var mp = $("#zj-hud-m39ol");
    if (mp) {
      mp.hidden = rihla.active;
      mp.textContent = "M39ol · " + c.m39ol.points;
      mp.title = "Le rang — il vient des autres : la halqa du mercredi, le témoin, le bureau." +
        (c.m39ol.suivant ? " Encore " + c.m39ol.suivant.manque + " pour " + c.m39ol.suivant.rang.nom + "." : "");
    }
    var sp = $("#zj-hud-sna3a");
    if (sp) {
      var sR = aRafiq ? Rf.starter(etatRihla().rf) : null;
      sp.textContent = sR ? sR.nom + " · Sna3a " + c.sna3a.total : "Sna3a · " + c.sna3a.total;
      sp.title = (sR ? "Le niveau de ton Rafiq, c'est ta Sna3a. " : "") + "Technique — " + c.sna3a.niveau.nom + ", " + c.sna3a.niveau.sous + " · " + th.reussis + "/" + th.total + " Ta7addi" +
        (c.sna3a.prochain ? " · encore " + c.sna3a.prochain.manque + " pour " + c.sna3a.prochain.niveau.nom : "");
      // v6.0 — le Kounnach : la prochaine wasfa que la Sna3a ouvre
      var ke = etatKounnach();
      if (ke && ke.prochaine) sp.title += " · prochaine wasfa : « " + ke.prochaine.titre + " » à " + Kn.niveau(ke.prochaine.niveau).nom;
    }
    var dp = $("#zj-hud-dhakira");
    if (dp) {
      dp.hidden = rihla.active;
      dp.textContent = "Cartes · " + pg.resolues;
      // Bab — une maison peut montrer les POINTS de culture, comme les deux autres axes : chez
      // Nareva la carte dit « +15 Lumière » et le carnet « Lumière 15 » ; une barre qui disait
      // « Lumière · 1 » (le nombre de cartes) se contredisait.
      if (window.ZWJ_MAISON && window.ZWJ_MAISON.hudCulture === "points") dp.textContent = "Dhakira · " + c.dhakira.total;
      dp.title = "La Dhakira — culture marocaine : " + c.dhakira.total + " (" + c.dhakira.niveau.nom + "). Une carte par page retrouvée au sandouq : " + pg.resolues + " sur " + pg.total + "." +
        (c.dhakira.prochain ? " Encore " + c.dhakira.prochain.manque + " pour " + c.dhakira.prochain.niveau.nom + "." : "");
    }
    // v3.6 — le Wird du jour, en une ligne : le prochain pas, et son titre.
    // Muette une fois l'Arb3ine rendue et le Wird fini — la maison prend le relais.
    var wp = $("#zj-hud-wird");
    if (wp && Wd) {
      var we = wirdEtat();
      var texte = we ? Wd.libelleHud(we) : "";
      wp.textContent = texte;
      wp.hidden = !texte || (a.ecoule && we.fini);
      wp.title = we && we.prochain ? we.prochain.minutes + " minutes, pas plus. Un par jour, quarante jours." : "Le Wird : un défi par jour, quarante jours.";
    }
    // v7.2 — ce qu'un invité n'a pas. EN DERNIER : les blocs au-dessus règlent
    // leur bouton sur la lignée ou sur les paliers, et rouvriraient ce qu'on
    // vient de fermer. Ce n'est que cosmétique — la base refuse de toute façon
    // un visiteur qu'elle ne connaît pas.
    if (dayf.actif) {
      // LISTE BLANCHE, fail-close : on n'offre QUE ce qui lui est ouvert. Une
      // entrée ajoutée au menu demain n'apparaîtra pas dans le menu d'un
      // invité sans qu'on l'ait décidé ici — c'est la règle de `dayf.js`,
      // appliquée à l'écran.
      var jD = jourDayf();
      var OUVERT_DAYF = { atay: Dy.peut("atay", jD), kelma: Dy.peut("kelma", jD),
        bibliotheque: Dy.peut("rayons", jD), souk: Dy.peut("rahba", jD), qlil: Dy.peut("qlil", jD),
        derb: Dy.peut("rahba", jD),   // v8.7 — la ruelle solidaire se REGARDE (aider et parrainer demandent d'entrer)
        carnet: true, dyaf: true, langue: true, sortir: true, perso: true, fermer: true,
        bouton: true, qui: true, boucle: true,
        // la collection s'ouvre DÈS qu'il a sa première carte : c'est là qu'il
        // voit les vingt et une autres, et c'est ce qui manque qui donne envie
        cartes: P.etat(joueur.pages).resolues > 0,
        // v7.3 — les cinq épreuves et les sept tableaux sont le cœur de sa visite
        oumm: true, tableaux: true,
        // v7.8 — le catalogue des maharat se REGARDE (tout « à acquérir ») : on prouve en entrant
        maharat: true,
        // v8.0 — la Rkhama n'est pas un secret : un remerciement se lit de tous.
        // Mais un invité n'a pas de session, la base ne lui répond pas, et la
        // dalle reste muette — l'entrée ne s'affiche donc que s'il y a à lire.
        rkhama: rkhamaAQuoiLire() };
      "wird imtihan tableau bibliotheque kounnach masarat maharat rkhama ijaza kharita cartes rihla carte duel kelma atay qlil khessa nsyan wach bientot riwaq souk safqa wasfa dire lebsa lawh parrainer majliss carnet tariqa perso prologue tutoriel rejouer raccourcis oumm tableaux ferracha rasail bitaqa derb"
        .split(" ").forEach(function (c) { var b = $("#zj-menu-" + c); if (b) b.hidden = !OUVERT_DAYF[c]; });
      ["#zj-hud-m39ol", "#zj-hud-sna3a", "#zj-hud-dhakira", "#zj-hud-wird", "#zj-menu-bientot"]
        .forEach(function (s) { var el = $(s); if (el) el.hidden = true; });
    }
    // Bab — une maison cliente ne propose que ce qu'elle nomme (sa liste blanche) :
    // passé APRÈS toutes les règles ci-dessus, pour qu'aucune ne rallume une entrée.
    if (ZWJ.maison && ZWJ.maison.actif()) ZWJ.maison.filtrerMenu(document, ZWJ.maison.config());
    rafraichirBarre();   // v8.4 — la Barre lit les boutons que les règles ci-dessus viennent de régler
  }

  // ---- Le carnet : la note du joueur, trois axes qui ne se convertissent pas ----------
  function ouvrirCarnet() {
    // v7.2 — un invité n'a pas de carnet à trois axes : il n'a pas de points,
    // et lui en montrer trois à zéro serait lui dire qu'il a échoué. Il a une
    // hospitalité, et c'est elle qu'on lui lit.
    if (dayf.actif) {
      ouvrirDialogue({ nom: "Dayf — l'invité", pages: [Dy.carnet(dayf.etat, jourDeLaMaison())] });
      return;
    }
    var c = R.carnet(joueur), th = Th.etat(joueur.tahaddi), pg = P.etat(joueur.pages);
    var voies = R.VOIES.map(function (v) { return "   " + v.nom + " " + c.sna3a.parVoie[v.cle]; }).join("\n");
    ouvrirDialogue({
      nom: "Le carnet de " + joueur.pseudo,
      pages: [
        "M39ol " + c.m39ol.points + " — " + c.m39ol.rang.nom + " · " + c.m39ol.presences + " présence" + (c.m39ol.presences > 1 ? "s" : "") + "\n" +
          "Ce que tu as donné à la maison : ta présence aux sessions, ce que tu portes, ce que tu tiens." +
          (c.m39ol.points === 0 ? "\nIl se reçoit d'un autre — le témoin, la salle, le bureau. Jamais d'ici." : (c.m39ol.suivant ? "\nEncore " + c.m39ol.suivant.manque + " pour devenir " + c.m39ol.suivant.rang.nom + "." : "")),
        "Sna3a " + c.sna3a.total + " — " + c.sna3a.niveau.nom + ", " + c.sna3a.niveau.sous + "\n" +
          "Ce que tu sais faire : " + th.reussis + " Ta7addi sur " + th.total + " à l'établi" +
          ((joueur.imtihan || 0) > 0 ? ", et " + joueur.imtihan + " bonne" + (joueur.imtihan > 1 ? "s" : "") + " réponse" + (joueur.imtihan > 1 ? "s" : "") + " au rihal" : "") + ".\n" + voies + kounnachCarnet(),
        "Dhakira " + c.dhakira.total + " — " + c.dhakira.niveau.nom + ", " + c.dhakira.niveau.sous + "\n" +
          "Ce que tu sais de ton pays : " + pg.resolues + " page" + (pg.resolues > 1 ? "s" : "") + " de la Rihla sur " + pg.total + ", au sandouq de la Khizana.",
        "Les trois ne se changent pas l'un en l'autre. La technique et la mémoire se gagnent seul ; le rang, lui, ne se gagne qu'ensemble."
      ].concat(pageJeux(), pageRafiq(), pageChajara(), pageParrain()).concat(pageTariqa()).concat(pageVoile()).concat(pageSirr()).concat(pageMaharat())
    });
    tutorielEvenement("carnet");
  }

  // v7.8 — les maharat au carnet : ce que la base a déjà rendu au panneau, rien
  // de plus (aucun appel d'ici, aucun point). Vide tant qu'on n'a pas ouvert le panneau.
  function pageMaharat() {
    if (!Mh || dayf.actif || !maharat.donnees || !maharat.donnees.ok) return [];
    return [Mh.carnet(maharat.donnees)];
  }

  // v7.6 — le huitième cadre au carnet : ce qu'on a vu, jamais ce qui reste.
  function pageSirr() {
    if (!Sr || dayf.actif) return [];
    var c = Sr.carnet(sirr.etat);
    return c ? [c] : [];
  }

  // v7.4 — le Voilé au carnet : aperçu sur le minaret, ou descendu. Aucun point — un souvenir.
  function pageVoile() {
    if (!Vl || dayf.actif) return [];
    var e = etatVoile(), c = Vl.carnet(e, e.vu ? jourDe(e.vu) : null);
    return c ? [c] : [];
  }

  // v5.1 — ce qu'on a joué, à côté des trois axes : aucun point, une page.
  function pageJeux() {
    if (!Jx || maisonTait("jeux")) return [];   // Bab : une maison qui tait les jeux n'a pas leur page
    var ks = Km ? Km.stats(joueur.recit.kelma, Km.numero()) : null;
    var ae = At ? At.normaliserEtat(joueur.recit.atay) : null;
    var qc = Ql && qlil.etat && qlil.etat.ok ? Ql.carte(qlil.etat) : null;
    var ke = khessa.etat && khessa.etat.ok ? khessa.etat : null;
    return [Jx.carnet({ kelma: ks, atay: ae, qlil: qc, trous: Ql ? Ql.TROUS.length : null, gouttes: ke ? ke.miens.length : null })];
  }

  // v5.3 — le Rafiq au carnet : sa forme, ses techniques, l'axe, les ombres dissipées
  function pageRafiq() {
    var e = etatRihla();
    if (!Rf || !e || !e.rf) return [];
    var ar = Lg && Lg.estAr();
    var noms = Rf.techniques(e).map(function (t) { return ar ? t.ar : t.nom; }).join(" · ");
    return ["Ton Rafiq : " + Rf.nomForme(e.rf, sna3aJoueur(), e) + ", forme " + Rf.forme(sna3aJoueur(), e) + "\nTechniques : " + noms +
      "\nAxe : " + Rf.axe(e).nom + "\nOmbres dissipées : " + ((e.ob || []).length) + " sur " + Fx.OMBRES.length];
  }

  // v3.8 — le voile est une porte : aux gens de la maison, le carnet dit la
  // promo ET la maison, telles que la base les rend à leur porteur. À un Talib
  // libre, rien — et rien n'est écrit ici (le nom vient du serveur).
  function pageChajara() {
    if (!lignee.maison || !lignee.chajara) return [];
    var d = lignee.devoile;
    var phrase = d ? ((Lg && Lg.estAr() && d.phrase_ar) ? d.phrase_ar : d.phrase) : "";
    return ["Ta Chajara : " + lignee.chajara + "." + (d ? "\nPortée par " + d.nom + "." + (phrase ? "\n" + phrase : "") : "")];
  }

  // v4.1 — le carnet d'un externe dit qui lui a ouvert la porte.
  function pageParrain() {
    if (lignee.maison) return [];
    var t = Pr.voieTexte(admission);
    return t ? [t] : [];
  }

  // Le centre de tuile libre le plus proche qui ne touche aucun PNJ.
  function degagerDesGens(p) {
    if (!Pn || !Pn.heurte(cour.pnjs, p.x, p.y)) return;
    var tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    for (var r = 1; r <= 6; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        var c = M.centre(tx + dx, ty + dy);
        if (libre(c.x, c.y) && !Pn.heurte(cour.pnjs, c.x, c.y)) { p.x = c.x; p.y = c.y; return; }
      }
    }
  }

  // v2.5 — la petite bulle « … » au-dessus du PNJ qu'on regarde : ils sont
  // dessinés comme le joueur, il faut bien dire lesquels parlent.
  function dessinerBulle(cam) {
    if (!Pn || !cam || !cour.ctx || cour.dialogue) return;
    var dv = tuileDevant();
    var n = Pn.aTuile(cour.pnjs, dv.x, dv.y);
    if (!n) return;
    var ctx = cour.ctx, z = cam.zoom;
    var bx = (Math.round(n.x) - cam.camX + cam.ox) * z, by = (Math.round(n.y) - Rd.PH - 3 - cam.camY + cam.oy) * z;
    ctx.fillStyle = "#1d1a2e"; ctx.fillRect(bx - 6 * z, by - 4 * z, 12 * z, 7 * z);
    ctx.fillStyle = "#f7f1e1"; ctx.fillRect(bx - 5 * z, by - 3 * z, 10 * z, 5 * z);
    ctx.fillRect(bx - z, by + 2 * z, 2 * z, z);
    ctx.fillStyle = "#1d1a2e";
    for (var i = -3; i <= 3; i += 3) ctx.fillRect(bx + i * z - Math.floor(z / 2), by - z + Math.floor(z / 2), z, z);
  }

  function boucleCour(now) {
    if (ecran !== "cour") return;
    var ecoule = Math.min(0.25, Math.max(0, (now - cour.dernier) / 1000)); cour.dernier = now;
    cour.t += ecoule;
    var p = cour.perso;

    var dx = 0, dy = 0;
    if (!cour.dialogue && !menuOuvert && !panneauOuvert()) {
      if (cour.touches.gauche) dx -= 1; if (cour.touches.droite) dx += 1;
      if (cour.touches.haut) dy -= 1; if (cour.touches.bas) dy += 1;
    }
    p.bouge = dx !== 0 || dy !== 0;
    if (p.bouge) {
      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      // la direction du regard : l'axe dominant, le vertical en cas d'égalité
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? "gauche" : "droite"; else p.dir = dy < 0 ? "haut" : "bas";
      // À bas régime (onglet ralenti, téléphone qui peine), le temps se découpe
      // en pas de 1/60 s : la vitesse reste la même, et personne ne traverse un mur.
      var restant = ecoule;
      while (restant > 0) { var pas = Math.min(restant, 1 / 60); deplacer(p, dx * VITESSE * pas, dy * VITESSE * pas); restant -= pas; }
      if (Pn) { var gene = Pn.heurte(cour.pnjs, p.x, p.y); if (gene) degagerDesGens(p); }
      // Le filet, en marche : si quoi que ce soit a posé le corps dans un mur,
      // on le sort au lieu de le laisser sans aucune direction ouverte.
      if (!libre(p.x, p.y)) { var sortie = M.degager(p.x, p.y); p.x = sortie.x; p.y = sortie.y; }
      p.animT += ecoule;
      p.frame = [0, 1, 0, 2][Math.floor(p.animT * 7) % 4];
      cour.aBouge = true;
    } else { p.frame = 0; p.animT = 0; }

    // La musique suit la pièce : on ne teste qu'au changement de tuile.
    if (rihla.active) pasRihla(p);   // v5.2 — le souffle de la marche, les étoiles
    suivre(p, ecoule);   // v5.3 — le Rafiq, un pas derrière
    // v8.7 — sur la Rahba, le HUD dit quand on entre dans le Derb t-Tadamoun (au changement d'état seulement)
    if (rahba.active) {
      var dansD = Rb.dansDerb(Math.floor(p.x / T), Math.floor(p.y / T));
      if (dansD !== rahba.dansDerb) { rahba.dansDerb = dansD; rafraichirHud(); }
    }
    if (orchestre && !rihla.active && !rahba.active) {
      var tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
      if (tx !== cour.tuileX || ty !== cour.tuileY) {
        cour.tuileX = tx; cour.tuileY = ty;
        var avant = orchestre.etat().lieu;
        if (orchestre.allerA(Mu.lieuPour(tx, ty)) !== avant) majBoutonSon();
      }
    }

    // v2.5 — les PNJ marchent (pnj.js), gelés tant qu'une boîte ou un panneau
    // est ouvert, et jamais dans le joueur : bloqués, ils attendent.
    if (Pn) {
      var fige = !!cour.dialogue || menuOuvert || panneauOuvert();
      for (var i = 0; i < cour.pnjs.length; i++) Pn.avancer(cour.pnjs[i], ecoule, libre, p, fige, cour.pnjs);
    }

    // v2.6 — les autres joueurs (sahn.js) : des fantômes, dessinés avec les
    // gens de la cour, du plus haut au plus bas — et jamais heurtés.
    var maintenant = Date.now();
    var fantomes = sahn.actif ? fantomesDuSahn(maintenant) : [];
    var cam = cour.scene.rendre(p, cour.t, fantomes.length ? cour.pnjs.concat(fantomes) : cour.pnjs);
    if (rihla.active) dessinerRihla(cam);   // v5.2 — la poussière de Nsyan, les cuves, les étoiles
    else dessinerAlab(cam);   // v4.7 — lampes de la margelle, lanternes, invitations
    if (rihla.active) dessinerOmbres(cam);   // v5.3 — les ombres de Nsyan, par-dessus la poussière
    dessinerRafiq(cam);   // v5.3 — le compagnon n'est jamais gris
    dessinerVoile(cam, maintenant);   // v7.4 — le Voilé : le signal sur le minaret, ou lui devant ton tapis
    if (Sr && sirr.etat && !sirr.appel) appelKhalwa();   // v7.6 — il se tourne, pour celui-là seul
    if (tuto.actif || guide.tuile) dessinerFil(cam);
    if (majliss.membre && !rihla.active) dessinerPortesMajliss(cam);
    dessinerRkhama(cam);   // v8.0 — la dalle des partenaires, au mur du Sahn
    dessinerBulle(cam);
    if (sahn.actif) { dessinerSahn(cam, fantomes, maintenant); envoyerPas(p, maintenant); }

    if (cour.aBouge && now - cour.dernierSauv > 30000) sauvegarderPosition();
    cour.raf = requestAnimationFrame(boucleCour);
  }

  // Un déplacement, axe par axe : on glisse le long des murs au lieu de s'y coller.
  // ⚠️ `libre` vit dans monde.js depuis le 13/09/2026 : le déplacement et la
  //    reprise de position doivent poser la MÊME question, sinon on accepte une
  //    position d'où l'on ne peut plus bouger (c'est arrivé).
  function libre(x, y) { return M.libre(x, y); }   // v5.2 — le monde courant : la cour, ou une région
  // Le pas lui-même vit dans monde.js (`avancer`) : c'est de la physique de
  // monde, et c'est le seul endroit où on peut l'éprouver sans navigateur.
  // v2.5 — axe par axe, comme monde.avancer, mais un pas qui poserait le corps
  //    dans un PNJ est refusé : on glisse le long des gens comme le long des murs.
  function deplacer(p, dx, dy) {
    if (!Pn) return M.avancer(p, dx, dy);
    var ax = p.x, ay = p.y;
    if (dx !== 0) { M.avancer(p, dx, 0); if (Pn.heurte(cour.pnjs, p.x, p.y)) p.x = ax; }
    if (dy !== 0) { M.avancer(p, 0, dy); if (Pn.heurte(cour.pnjs, p.x, p.y)) p.y = ay; }
    return p;
  }

  // Un panneau plein écran est-il ouvert ? Les cinq partagent la convention
  // data-question : tant que l'un d'eux est affiché, on ne marche pas et on
  // n'agit pas — sinon deux panneaux s'empilent, un dialogue s'ouvre invisible
  // dessous, et la croix tactile se désynchronise à la première fermeture.
  var panneauxEls = null;
  function panneauOuvert() {
    if (!panneauxEls) panneauxEls = [$("#zj-imtihan"), $("#zj-tariqa"), $("#zj-tableau"), $("#zj-souk"), $("#zj-riwaq"), $("#zj-bibliotheque"), $("#zj-kounnach"), $("#zj-masarat"), $("#zj-maharat"), $("#zj-rkhama"), $("#zj-ijaza"), $("#zj-majliss"), $("#zj-cartes"), $("#zj-tableaux"), $("#zj-parrainage"), $("#zj-kharita"), $("#zj-wird"), $("#zj-kelma"), $("#zj-atay"), $("#zj-khessa"), $("#zj-safqa"), $("#zj-qissaria"), $("#zj-qlil"), $("#zj-etal"), $("#zj-rafiq"), $("#zj-combat"), $("#zj-carte"), $("#zj-duel"), $("#zj-mechouar"), $("#zj-aller"), $("#zj-gens"), $("#zj-bitaqa")];
    for (var i = 0; i < panneauxEls.length; i++) {
      if (panneauxEls[i] && !panneauxEls[i].hidden) return true;
    }
    // Bab — les panneaux de la vie de la maison (vie.js) : le Fil, la mémoire, la candidature
    return !!document.querySelector(".bab-panneau:not([hidden])");
  }

  // La tuile qu'on regarde : celle des pieds, plus la direction.
  function tuileDevant() {
    var p = cour.perso;
    var tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T);
    return M.devant(tx, ty, p.dir);
  }

  function agir() {
    if (menuOuvert || panneauOuvert()) return;
    if (cour.dialogue) { avancerDialogue(); return; }
    var dv = tuileDevant();
    // v7.2 — un invité ne pousse pas toutes les portes de la maison, et chaque
    // refus dit où aller à la place (dayf.js). Ce qui n'est pas listé lui est
    // ouvert : la cour, les murs, le thé, le mot du jour. ⚠️ Seulement dans la
    // ZAWIA — la Rahba et Fès ont leurs propres lettres de tuile, et une
    // collision y ferait refuser une porte qui n'a rien à voir.
    if (dayf.actif && !rahba.active && !rihla.active) {
      var TUILES_DAYF = { R: "rihla", E: "etabli", r: "rihal", f: "khessa", X: "majliss", h: "riwaq", S: "sandouq", B: "khizana", Y: "qlil", G: "rahba" };
      var cleDayf = TUILES_DAYF[dv.c];
      if (cleDayf && dayfFerme(cleDayf)) return;
    }
    if (mechouar.active) { agirMechouar(dv); return; }   // v7.7 — le Mechouar : la halqa, le mur, le Bab pour rentrer
    if (rahba.active) { agirRahba(dv); return; }   // v5.7 — la Rahba : ses étals, ses gens, la Qissaria, le Bab pour rentrer
    if (rihla.active) { agirRihla(dv); return; }   // v5.2 — Fès : ses gens, ses lieux, ses portes
    if (dv.c === "R") { entrerRihla(); return; }   // v5.2 — Bab ar-Rihla, la porte du temps
    // v2.5 — quelqu'un se tient là ? Il se tourne, et il parle.
    if (Pn) {
      var n = Pn.aTuile(cour.pnjs, dv.x, dv.y);
      if (n) {
        Pn.interpeller(n, cour.perso.dir);
        var dn = Pn.dialogue(n, { pseudo: joueur.pseudo, arb3ine: R.arb3ine(debutArb3ine()), wird: n.cle === "bawwab" ? wirdEtat() : null });
        // v7.8 — qui vient du hanout retrouve son mot chez le bawwab, autant de fois qu'il veut
        if (dn && n.cle === "bawwab" && hanout.code) { var hm = Dy.hanoutMot(hanout.code, jourDeLaMaison()); if (hm) { dn = { nom: dn.nom, pages: dn.pages.concat([hm.pages[1]]) }; hanout.dit = true; noterVisiteHanout(); } }
        // v7.4 — la rumeur du Voilé : certains jours, un figurant en dit un mot de
        // plus (voile.js tire le jour — la même cour pour tous, ce jour-là)
        if (dn && Vl) { var ru = Vl.rumeur(n.cle, jourDeLaMaison()); if (ru) dn = { nom: dn.nom, pages: dn.pages.concat([ru]) }; }
        // v7.6 — l'indice du Sirr : il CONFIRME, il n'explique pas, et il ne
        // compte jamais à voix haute. Il passe avant l'annonce des jeux.
        if (dn && Sr) { var iq = Sr.indice(n.cle, nSirr()); if (iq) dn = { nom: dn.nom, pages: dn.pages.concat([iq]) }; }
        // v5.1 — le bawwab dit les jeux de la cour, s'il ne l'a pas encore fait
        if (dn && n.cle === "bawwab" && Jx && Jx.aAnnoncer(joueur.recit) && palierOuvert("jeux")) dn = { nom: dn.nom, pages: dn.pages.concat(Jx.annonce(joueur.pseudo).pages), apres: marquerJeux };
        if (dn) ouvrirDialogue(dn);
        poserWird(Wd && Wd.marquerPnj(joueur.recit, n.cle));   // v3.6 — on lui a parlé
        return;
      }
    }
    // v3.3 — la porte du Majliss : un mur pour tout le monde, une porte pour
    // le conseil. La base tient la chambre (zawia-majliss.sql) ; ici on ouvre.
    if (dv.c === "X") { if (majliss.membre) ouvrirMajliss(); return; }
    // v8.0 — la Rkhama : un mur gravé. On s'arrête, on lit. Rien à lire, rien
    // ne s'ouvre — la dalle n'est alors même pas dessinée.
    if (dv.c === "P") { if (rkhamaAQuoiLire()) ouvrirRkhama(); return; }
    if (!M.estPointInteret(dv.c)) {
      // v2.6 — pas de point d'intérêt devant, mais peut-être un autre joueur
      // à portée : on le salue (sahn.js dit qui). Un fantôme se tient toujours
      // sur une tuile franchissable, donc jamais SUR un point d'intérêt.
      if (sahn.actif) {
        var autre = Sh.devant(cour.perso, Sh.vivants(sahn.autres, Date.now()), T, Date.now());
        if (autre) saluer(autre);
      }
      return;
    }
    if (dv.c === "S") { ouvrirSandouq(); return; }
    // v4.7 — les jeux de la zawia : le lawh du jour, les orangers du riad, la fontaine.
    if (dv.c === "K") { ouvrirKelma(); return; }
    if (dv.c === "T") { ouvrirAtay(); return; }
    if (dv.c === "f") { ouvrirKhessa(); return; }
    if (dv.c === "Y") { ouvrirQlil(); return; }   // v4.8 — l'établi du prompt, ouvert à tous
    // L'établi et le rihal sont aux gens de la maison. Le refus EXPLIQUE et
    // ORIENTE (chajara.js) — et la base tient la vraie porte : ce test-ci
    // n'est qu'un écran de politesse, la clé du jeu étant publique.
    // v6.1 — l'établi ouvre d'abord les Masarat, pour tout joueur entré ; les
    // seize Ta7addi QCM y sont un bouton (gens de la maison). Le tutoriel, lui,
    // attend un Ta7addi à cet endroit : il le garde.
    if (dv.c === "E") {
      var et = tuto.actif ? etapeTuto() : null;
      if (et && et.tuile === "E" && Cj.peut(lignee.maison, "etabli")) { ouvrirEtabli(); return; }
      ouvrirMasarat({ etabli: true });
      return;
    }
    // Les rayonnages de la Khizana ouvrent la bibliothèque : al-Moujam, les
    // ressources, le catalogue. (Le dialogue « B » de monde.js reste le repli.)
    if (dv.c === "B") { ouvrirBibliotheque(); return; }
    // Le cercle de la Qa3a ne servait à rien : c'est par lui qu'on entre au Riwaq.
    if (dv.c === "h") { ouvrirRiwaq(); return; }
    // Le rihal — le pupitre de lecture — est l'endroit où l'on est interrogé.
    if (dv.c === "r") { if (Cj.peut(lignee.maison, "rihal")) ouvrirImtihan(); else ouvrirDialogue(Cj.refus("rihal")); return; }
    // Le Bab. « La porte est ouverte. Elle le reste. » — on sort, et dehors
    // des murs il y a le Souk. C'est la place que le récit donne à l'annonce
    // (recit.js) : jamais au-dessus d'une tête, jamais dans une halqa.
    if (dv.c === "C") { entrerMechouar(); return; }   // v7.7 — Bab al-Mechouar : la place où l'on est vu
    if (dv.c === "G") { entrerRahba(); return; }   // v5.7 — on sort : le Souk est une place, la Rahba
    var a = R.arb3ine(debutArb3ine());
    var ctx = { joueur: joueur, arb3ine: a, defis: joueur.defis, DEFIS: R.DEFIS,
      carnet: R.carnet(joueur), tahaddi: Th.etat(joueur.tahaddi), pages: P.etat(joueur.pages) };
    // Le n-ième khatt du Sahn porte la n-ième valeur de la charte.
    // ⚠️ v7.2a — sauf UN, pour un invité : la pierre y est lisse. C'est le
    // mystère qu'il emporte en sortant, et celui qu'il ne peut pas refermer
    // tant qu'il est invité. La charte n'est pas touchée : c'est ce que
    // l'écran lui montre, pas ce que la maison tient.
    if (dv.c === "V" && dayf.actif && M.ordinal(dv.x, dv.y, "V") === Dy.KHATT_EFFACE) {
      ouvrirDialogue({ nom: Dy.MUR_EFFACE.nom, pages: Dy.MUR_EFFACE.pages.slice() });
      nsyanPasse(3);
      return;
    }
    if (dv.c === "V") ctx.khatt = Rc.khatt(M.ordinal(dv.x, dv.y, "V"));
    var d = M.dialogue(dv.c, ctx);
    if (d) ouvrirDialogue(d);
    if (dv.c === "V") {
      tutorielEvenement("tuile:V");
      poserWird(Wd && Wd.marquerKhatt(joueur.recit, M.ordinal(dv.x, dv.y, "V")));   // v3.6 — ce khatt est lu
    }
  }

  // ---- LE WIRD (v3.6) : un défi par jour, quarante jours -------------------------------
  // wird.js dit quoi et dans quel ordre ; ici on pose les drapeaux (khatt lu,
  // PNJ parlé, salle ouverte, jour tenu, daftar), on rend le panneau, la ligne
  // du HUD, et le fil d'or vers la tuile du jour. Rien de tout cela ne donne
  // un point : le Wird compte des jours, la Sna3a et la Dhakira viennent des
  // gestes eux-mêmes, comme avant.
  function wirdCtx() {
    return {
      jour: R.arb3ine(debutArb3ine()).jour, maison: lignee.maison, recit: joueur.recit, joueur: joueur,
      pages: P.etat(joueur.pages), tahaddi: Th.etat(joueur.tahaddi)
    };
  }
  function wirdEtat() { return (Wd && joueur) ? Wd.etat(wirdCtx()) : null; }
  // v5.5 — les paliers : ce que l'écran propose le jour 1, après le tutoriel, le jour 2.
  // Le jour est celui de l'Arb3ine (le masque du Morchid le déplace : on teste d'une touche).
  function palierCtx() {
    var a = R.arb3ine(debutArb3ine());
    return { jour: a.jour, ecoule: a.ecoule, tutorielFini: !!(Tt && joueur && Tt.fini(joueur.recit && joueur.recit.tutoriel)) };
  }
  function palierOuvert(cle) { return !Pa || !joueur || Pa.ouvert(cle, palierCtx()); }
  // Fermé ? La tuile explique et oriente (paliers.js), et l'on ne va pas plus loin.
  function palierFerme(cle) {
    if (palierOuvert(cle)) return false;
    basculerMenu(false);
    ouvrirDialogue(Pa.refus(cle, palierCtx()));
    return true;
  }
  // Pose un nouveau recit.wird (rendu par wird.js) — s'il a changé.
  function poserWird(nouveau) {
    if (!nouveau || !joueur) return;
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    var avant = JSON.stringify(joueur.recit.wird || {});
    var w = Object.assign({}, nouveau);
    if (joueur.recit.wird && joueur.recit.wird.presente) w.presente = true;
    if (JSON.stringify(w) === avant) return;
    joueur.recit.wird = w;
    sauvegarderJoueur();
    rafraichirHud();
    var et = wirdEtat();
    if (guide.tuile && !guide.jeu && et && et.courant && et.courant.tenu) { guide.tuile = null; guide.fil = null; }
    verserGoutteWird(et);   // v4.7
    if (!$("#zj-wird").hidden) rendreWird();
  }
  function ouvrirWird() {
    var panneau = $("#zj-wird");
    if (!panneau || !joueur || !Wd) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-wird-fermer");
    if (f) f.focus();
    rendreWird();
  }
  function fermerWird() {
    var panneau = $("#zj-wird");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    libererTutoriel();
  }
  // ---- v7.0 — la Tariqa : comment on sert la maison, et sur quel terrain (tariqa.js) ----------
  // Le mou'allim demande à la fermeture du prologue (une boîte, son portrait), puis
  // le panneau s'ouvre ; à sa fermeture, le tutoriel prend le relais. Les anciens le
  // voient une fois (recit.tariqa.vu). Jamais au HUD ni au-dessus de la tête (6ᵉ valeur).
  var tariqaApres = null;
  function demanderTariqa(apres) {
    // Bab — une maison qui tait la tariqa (ZWJ_MAISON.taire) rend la main tout de suite.
    if (!joueur || !Tq || maisonTait("tariqa")) { if (typeof apres === "function") apres(); return; }
    tariqaApres = typeof apres === "function" ? apres : null;
    var d = Tq.demande();
    ouvrirDialogue({ nom: d.nom, pages: d.pages, apres: function () { ouvrirTariqa(); } });
  }
  function ouvrirTariqa() {
    var panneau = $("#zj-tariqa");
    if (!panneau || !joueur || !Tq) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    rendreTariqa("");
    var f = $("#zj-tariqa-fermer");
    if (f) f.focus();
  }
  function fermerTariqa() {
    var panneau = $("#zj-tariqa");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    if (joueur && Tq) { joueur.recit = Tq.marquerVu(Rc.normaliserRecit(joueur.recit), new Date().toISOString()); sauvegarderJoueur(); }
    var apres = tariqaApres; tariqaApres = null;
    if (apres) apres();
    libererTutoriel();
  }
  function dateTariqa(iso) {
    try { return new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "long" }); }
    catch (e) { return String(iso || "").slice(0, 10); }
  }
  function rendreTariqa(msg) {
    var corps = $("#zj-tariqa-corps");
    if (!corps || !joueur || !Tq) return;
    var t = Tq.normaliser(joueur);
    var peut = Tq.peutChanger(joueur, new Date().toISOString(), morchid.actif);
    var rang = R.communaute(joueur).rang;
    // ⚠️ chaque morceau dans son <p> : langue.js traduit un élément « feuille » d'un bloc
    var html = '<div class="zj-tariqa">' + Tq.TARIQAT.map(function (q) {
      var mienne = q.cle === t.tariqa;
      return '<article class="zj-tariqa__carte' + (mienne ? " zj-tariqa__carte--mienne" : "") + '">' +
        '<img src="' + PORTRAITS.dossier + q.ville + '.jpg' + PORTRAITS.version + '" alt="" width="112" height="112">' +
        '<div class="zj-tariqa__nom"><p><strong>' + esc(q.nom) + '</strong></p><p class="ar" lang="ar" dir="rtl">' + esc(q.ar) + '</p></div>' +
        '<p class="zj-tariqa__geste">' + esc(q.geste) + '</p>' +
        '<p class="zj-tariqa__vie">' + esc(q.vie) + '</p>' +
        '<p class="zj-tariqa__rpg">' + esc(q.rpg) + '</p>' +
        (mienne ? '<p><strong>C\'est ta tariqa.</strong></p>' : (peut.ok ? '<button type="button" class="zj-bouton" data-tariqa="' + q.cle + '">Choisir ' + esc(q.nom) + '</button>' : "")) +
        '</article>';
    }).join("") + '</div>';
    html += '<p class="zj-tariqa__rang">Ton rang : ' + esc(rang.nom) + ' — il est le même pour toutes les tariqat.</p>';
    html += '<div class="zj-tariqa__maydan"><label for="zj-tq-maydan">Ton maydan — le terrain où ta sna3a sert</label>' +
      '<select id="zj-tq-maydan"><option value="">' + esc(Tq.SANS_MAYDAN.nom) + '</option>' +
      Tq.MAYADIN.map(function (m) { return '<option value="' + m.cle + '"' + (m.cle === t.maydan ? " selected" : "") + '>' + esc(m.nom) + '</option>'; }).join("") + '</select></div>';
    if (!peut.ok) html += '<p class="zj-tariqa__note">' + esc(peut.texte) + '</p>';
    if (t.tariqa) html += '<div class="zj-tariqa__note">' + Tq.attentes(t.tariqa).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join("") + (t.depuis ? '<p>Depuis le ' + esc(dateTariqa(t.depuis)) + '.</p>' : "") + '</div>';
    else html += '<p class="zj-tariqa__note">' + esc(Tq.RAPPEL) + '</p>';
    if (msg) html += '<p class="zj-msg">' + esc(msg) + '</p>';
    corps.innerHTML = html;
    // « Pas encore » tant que rien n'est choisi ; « Fermer » ensuite (les deux ont leur entrée arabe)
    var croix = $("#zj-tariqa-fermer");
    if (croix) croix.textContent = t.tariqa ? "Fermer" : "Pas encore";
    $$("#zj-tariqa-corps [data-tariqa]").forEach(function (b) { b.addEventListener("click", function () { choisirTariqa(b.getAttribute("data-tariqa")); }); });
    var sel = $("#zj-tq-maydan");
    if (sel) sel.addEventListener("change", function () { choisirMaydan(sel.value); });
  }
  function choisirTariqa(cle) {
    if (!joueur || !Tq || !Tq.tariqa(cle)) return;
    var peut = Tq.peutChanger(joueur, new Date().toISOString(), morchid.actif);
    if (!peut.ok) { rendreTariqa(peut.texte); return; }
    var r = Tq.changer(joueur, cle, new Date().toISOString());
    joueur.tariqa = r.tariqa; joueur.tariqaDepuis = r.tariqaDepuis;
    sauvegarderJoueur();
    sonner("page");
    rendreTariqa("");
  }
  function choisirMaydan(cle) {
    if (!joueur || !Tq) return;
    joueur.maydan = Tq.maydan(cle) ? cle : null;
    sauvegarderJoueur();
  }
  // Le carnet : une page pour la tariqa et le maydan — aucun point, le rang d'abord.
  function pageTariqa() {
    if (maisonTait("tariqa")) return [];   // Bab — pas de tariqa chez une maison qui la tait
    if (!Tq || !joueur) return [];
    var t = Tq.normaliser(joueur), lignes = Tq.carnet(joueur);
    if (t.tariqa && t.depuis) lignes = lignes.concat(["Depuis le " + dateTariqa(t.depuis) + "."]);
    return [lignes.join("\n")];
  }

  // v5.1 — ce que jeu.js sait des jeux du jour, pour jeux.js (qui ne lit rien lui-même)
  function qlilJoue() {
    var jour = Kx ? Kx.jourCasa() : "";
    if (khessa.verses[Ql ? Ql.GESTE : "qlil"] === jour) return true;
    if (khessa.etat && khessa.etat.ok && khessa.etat.miens.indexOf("qlil") >= 0) return true;
    return !!(Ql && qlil.etat && qlil.etat.ok && qlil.etat.restant < Ql.QUOTA);
  }
  function faitsDuJour() {
    var jour = Kx ? Kx.jourCasa() : "", nk = Km ? Km.numero() : 0;
    var ae = At ? At.normaliserEtat(joueur.recit.atay) : null;
    return {
      kelma: { numero: nk, fait: !!(Km && Km.joueAujourdhui(joueur.recit.kelma, nk)) },
      atay: { fait: !!(At && At.servi(joueur.recit.atay, jour)), note: ae ? ae.mj : 0 },
      qlil: { fait: qlilJoue() },
      khessa: khessa.etat && khessa.etat.ok ? { niveau: khessa.etat.niveau, objectif: khessa.etat.objectif } : null
    };
  }
  // « M'y mener » vers un jeu : le fil d'or jusqu'à sa tuile — on apprend où il est.
  function menerAuJeu(cle) {
    var j = cle === "rihla" ? { tuile: "R" } : (Jx && Jx.jeu(cle));   // v5.5 — la porte du temps se montre aussi
    if (!j || !j.tuile) return;
    if (rihla.active) sortirRihla();   // v5.2 — les jeux sont dans la zawia
    fermerWird();
    guide.tuile = j.tuile; guide.fil = null; guide.deTuile = ""; guide.jeu = true;
  }
  // Ba Driss hèle depuis la porte, une fois par édition des jeux.
  function marquerJeux() {
    if (!joueur || !Jx) return;
    joueur.recit = Jx.marquer(Rc.normaliserRecit(joueur.recit));
    sauvegarderJoueur();
  }
  function annoncerJeux() {
    if (!joueur || !Jx || ecran !== "cour" || !Jx.aAnnoncer(joueur.recit) || !palierOuvert("jeux")) return;   // v5.5 — le 2ᵉ jour
    if (cour.dialogue || panneauOuvert() || menuOuvert || tuto.actif || rihla.active) { setTimeout(annoncerJeux, 4000); return; }   // v5.2 — Ba Driss hèle depuis la porte de la zawia, pas dans Fès
    var d = Jx.annonce(joueur.pseudo);
    ouvrirDialogue({ nom: d.nom, pages: d.pages, apres: marquerJeux });
  }
  // « M'y mener » / le bouton d'une salle : ce que jeu.js sait ouvrir.
  function menerAuWird(w) {
    fermerWird();
    if (rihla.active && (w.tuile || /^etabli:/.test(w.ouvrir || ""))) sortirRihla();   // v5.2 — le Wird se tient dans la zawia
    var o = w.ouvrir || "";
    if (o === "tutoriel") { relancerTutoriel(); return; }
    if (o === "bibliotheque") { ouvrirBibliotheque(); return; }
    if (o === "kounnach") { ouvrirKounnach(); return; }
    if (o === "riwaq") { ouvrirRiwaq(); return; }
    if (o === "cartes") { ouvrirCartes(); return; }
    if (o === "kharita") { ouvrirKharita(); return; }
    if (o === "carnet") { ouvrirCarnet(); return; }
    if (o === "souk") { ouvrirSouk(); return; }
    if (o === "imtihan") { ouvrirImtihan(); return; }
    if (o.indexOf("etabli:") === 0) { if (Cj.peut(lignee.maison, "etabli")) { ouvrirEtabli(o.slice(7)); return; } }
    if (o === "wird") { ouvrirWird(); return; }
    // sinon, ou en plus : le fil d'or jusqu'à la tuile
    if (w.tuile) { guide.tuile = w.tuile; guide.fil = null; guide.deTuile = ""; guide.jeu = false; }
  }
  function carteWird(w, et, principal) {
    var fam = Wd.famille(w.famille) || { nom: w.famille, ar: "", sous: "" };
    var etat = w.tenu ? '<span class="zj-wird__etat zj-wird__etat--tenu">☑ tenu</span>'
      : w.manque ? '<span class="zj-wird__etat zj-wird__etat--manque">manqué</span>'
      : w.ouvert ? '<span class="zj-wird__etat">' + w.minutes + ' min</span>'
      : '<span class="zj-wird__etat">jour ' + w.jour + '</span>';
    var html = '<section class="zj-wird__carte' + (principal ? ' zj-wird__carte--jour' : '') + (w.tenu ? ' zj-wird__carte--tenue' : '') + '" data-jour="' + w.jour + '">' +
      // ⚠️ chaque morceau dans son <p> : langue.js traduit un élément « feuille »
      //    d'un bloc, et un gabarit qui commence par {1} (« {1} min ») avalerait le titre
      '<div class="zj-kicker zj-wird__kicker"><p>' + (w.jour === et.jour ? "Aujourd'hui" : (w.jour === et.jour - 1 ? "Hier — se rattrape aujourd'hui" : "Jour " + w.jour)) +
        '</p><p>' + esc(fam.nom) + '</p>' + (fam.ar ? '<p class="ar" lang="ar" dir="rtl">' + esc(fam.ar) + '</p>' : '') + '</div>' +
      '<div class="zj-wird__titre"><h3>' + esc(w.titre) + '</h3>' + etat + '</div>' +
      '<p class="zj-wird__consigne">' + esc(w.consigne) + '</p>';
    if (w.daftar) {
      html += '<label class="zj-wird__daftar"><span>Ton daftar — jour ' + w.jour + '</span>' +
        '<textarea maxlength="' + Wd.DAFTAR_MAX + '" rows="4" data-daftar="' + w.jour + '" placeholder="Cinq lignes. Personne ne les lit.">' + esc(w.texte) + '</textarea></label>' +
        '<div class="zj-wird__actions"><button type="button" class="zj-bouton zj-bouton--discret" data-garder="' + w.jour + '">Garder</button></div>';
    }
    if (!w.tenu && w.ouvert && !w.daftar) {
      html += '<div class="zj-wird__actions">';
      if (w.ouvrir || w.tuile) html += '<button type="button" class="zj-bouton" data-mener="' + w.jour + '">' + (w.ouvrir && w.ouvrir !== "wird" ? "Ouvrir" : "M'y mener") + '</button>';
      if (w.bouton) html += '<button type="button" class="zj-bouton zj-bouton--discret" data-tenir="' + w.jour + '">C\'est fait</button>';
      html += '</div>';
    }
    html += '</section>';
    return html;
  }
  function rendreWird() {
    var corps = $("#zj-wird-corps");
    if (!corps || !joueur || !Wd) return;
    var et = wirdEtat(), a = R.arb3ine(debutArb3ine());
    var html = '<div class="zj-wird__compte"><p><strong>Jour ' + et.jour + ' sur ' + et.total + '</strong></p><p>' + et.tenus + ' tenu' + (et.tenus > 1 ? 's' : '') + '</p>' +
      (et.manques ? '<p>' + et.manques + ' manqué' + (et.manques > 1 ? 's' : '') + '</p>' : '') +
      (a.ecoule ? '<p>l\'Arb3ine est rendue</p>' : '') + '</div>';
    // v5.5 — la boucle, dite à voix haute ; le Wird devient LA liste du jour, en trois gestes
    if (Pa) html += '<p class="zj-wird__boucle">' + esc(Pa.BOUCLE) + '</p>';
    if (et.fini) html += '<p class="zj-wird__fin">Quarante Wird, quarante jours. Le reste, c\'est la maison qui le dit — au tableau, et au point du mercredi.</p>';
    var pc = palierCtx();

    // 1 · Apprendre : le Wird du jour (et la veille), la page de la semaine, le rihal
    html += '<h3 class="zj-majliss__titre zj-wird__geste">1 · Apprendre — dans la zawia</h3>';
    if (et.veille) html += carteWird(et.veille, et, false);
    html += carteWird(et.courant, et, true);
    var pg = P.etat(joueur.pages);
    html += '<ul class="zj-majliss__liste zj-wird__aussi">';
    if (pg.prochaine) html += '<li>Une page ouverte t\'attend au sandouq : « ' + esc(pg.prochaine.titre) + ' ».</li>';
    else if (pg.aVenir) html += '<li>La prochaine page, « ' + esc(pg.aVenir.titre) + ' », s\'ouvre ' + esc(jourDe(pg.aVenir.le)) + '.</li>';
    if (lignee.maison) html += '<li>Le rihal pose cinq questions par jour — le seul compteur qui se remet chaque matin.</li>';
    // v6.0 — une wasfa ouverte, pas encore lue : le Kounnach attend (chaque morceau dans son bloc, pour langue.js)
    var kw = etatKounnach();
    if (kw && kw.aLire) html += '<li><p>Une wasfa ouverte t\'attend au Kounnach : « ' + esc(kw.aLire.titre) + ' ».</p><button type="button" class="zj-bouton zj-bouton--discret" data-kounnach="' + esc(kw.aLire.id) + '">Lire</button></li>';
    html += '</ul>';

    // 2 · Jouer : le prochain pas dans Fès, et les jeux du jour — ce qui est ouvert seulement
    html += '<h3 class="zj-majliss__titre zj-wird__geste">2 · Jouer — à Fès et dans la cour</h3><ul class="zj-majliss__liste zj-wird__jeux">';
    if (Rh && Fx && Pa && Pa.ouvert("rihla", pc)) {
      var eR = etatRihla(), but = Rh.prochainBut(eR, Fx, Rf ? voiesConnues(eR) : []);
      html += '<li><div class="zj-majliss__ligne"><p>' + esc(but.texte) + '</p>' +
        (rihla.active ? '' : '<button type="button" class="zj-bouton zj-bouton--discret" data-jeu="rihla">M\'y mener</button>') + '</div></li>';
    }
    if (Jx) {
      html += Jx.duJour(faitsDuJour()).filter(function (l) { return palierOuvert(l.cle); }).map(function (l) {
        var droite = l.fait ? '<span class="zj-badge zj-badge--ok">joué aujourd\'hui</span>'
          : '<button type="button" class="zj-bouton zj-bouton--discret" data-jeu="' + l.cle + '">M\'y mener</button>';
        return '<li class="' + (l.fait ? 'fait' : '') + '"><div class="zj-majliss__ligne"><p>' + esc(l.texte) + '</p>' + droite + '</div></li>';
      }).join("");
    }
    var bientot = Pa ? Pa.bientot(pc) : "";
    if (bientot) html += '<li class="zj-wird__bientot">' + esc(bientot) + '</li>';
    html += '</ul>';

    // 3 · Partager : le point du mercredi, les rencontres du Sahn, les amis
    html += '<h3 class="zj-majliss__titre zj-wird__geste">3 · Partager — à la halqa</h3><ul class="zj-majliss__liste zj-wird__aussi">';
    html += '<li id="zj-wird-seance">Le point de la maison, le mercredi soir : le seul M39ol de la semaine, sur preuve. Le Riwaq dit l\'heure.</li>';
    html += '<li>Salue quelqu\'un au Sahn — une rencontre vraie compte pour le défi des dix : ' + Math.min(10, joueur.rencontres || 0) + ' sur 10.</li>';
    if (Jx) {
      var amis = Jx.duRythme("amis").filter(function (j) { return palierOuvert(j.cle); });
      if (amis.length) html += '<li><div class="zj-majliss__ligne"><p>Entre amis, sans compte :</p><span class="zj-wird__amis">' +
        amis.map(function (j) { return '<a href="' + j.lien + '" target="_blank" rel="noopener">' + esc(j.nom) + '</a>'; }).join(" ") + '</span></div></li>';
    }
    if (Rf && etatRihla().rf) html += '<li><div class="zj-majliss__ligne"><p>Ton Rafiq contre celui d\'un ami : cinq épreuves, par un lien.</p><button type="button" class="zj-bouton zj-bouton--discret" data-duel="1">Défier un ami</button></div></li>';
    html += '</ul>';

    // la bande des quarante : tenu · manqué · aujourd'hui · à venir
    html += '<h3 class="zj-majliss__titre">Les quarante</h3><ol class="zj-wird__bande">' + et.liste.map(function (w) {
      var cls = w.tenu ? "tenu" : w.manque ? "manque" : w.jour === et.jour ? "jour" : w.ouvert ? "ouvert" : "avenir";
      return '<li class="' + cls + '" title="' + esc("Jour " + w.jour + " · " + w.titre + " · " + w.minutes + " min") + '"><span>' + w.jour + '</span></li>';
    }).join("") + '</ol>';

    // les quatre défis de l'Arb3ine : ce vers quoi les quarante jours mènent
    var etatDefi = function (cle) {
      if (cle === "reseau") { var n = joueur.rencontres || 0; return n >= 10 ? "validé" : n + " sur 10"; }
      var v = joueur.defis && joueur.defis[cle];
      return v === "valide" ? "validé" : v === "en_cours" ? "en cours" : "à faire";
    };
    html += '<h3 class="zj-majliss__titre">Les quatre défis de l\'Arb3ine</h3><ul class="zj-majliss__liste">' + R.DEFIS.map(function (d) {
      return '<li><strong>' + esc(d.titre) + '</strong> <span class="zj-badge' + (etatDefi(d.cle) === "validé" ? ' zj-badge--ok' : '') + '">' + esc(etatDefi(d.cle)) + '</span><br><span class="zj-majliss__quand">' + esc(d.detail) + '</span></li>';
    }).join("") + '</ul>' +
      '<p class="zj-tableau__note">Le Wird ne donne aucun point : la Sna3a et la Dhakira viennent des gestes, le M39ol vient des autres. Il compte des jours. La veille se rattrape ; un jour manqué reste manqué, et n\'efface rien.</p>';
    corps.innerHTML = html;

    // le mercredi, en vrai : la prochaine séance, lue dans la base
    if (compte && typeof compte.lireSeances === "function") {
      compte.lireSeances().then(function (s) {
        var li = $("#zj-wird-seance"), utiles = Rs.seancesUtiles(s || []);
        if (!li || !utiles.length) return;
        var e = Rs.etatSeance(utiles[0]).etat;
        li.textContent = (e === "ouverte" ? "Le point de la maison est OUVERT — " : "Le point de la maison : ") + utiles[0].titre + ", " + Rs.quandTexte(utiles[0].debut) + ". Le mot dit en séance vaut +1 M39ol, dans le Riwaq.";
      }).catch(function () { /* la ligne générale reste */ });
    }

    $$("#zj-wird-corps [data-jeu]").forEach(function (b) {
      b.addEventListener("click", function () { menerAuJeu(b.getAttribute("data-jeu")); });
    });
    $$("#zj-wird-corps [data-duel]").forEach(function (b) {
      b.addEventListener("click", function () { fermerWird(); ouvrirDuel(); });
    });
    $$("#zj-wird-corps [data-mener]").forEach(function (b) {
      b.addEventListener("click", function () { var w = Wd.wird(parseInt(b.getAttribute("data-mener"), 10), lignee.maison); if (w) menerAuWird(w); });
    });
    $$("#zj-wird-corps [data-tenir]").forEach(function (b) {
      b.addEventListener("click", function () { poserWird(Wd.tenir(joueur.recit, parseInt(b.getAttribute("data-tenir"), 10))); });
    });
    $$("#zj-wird-corps [data-garder]").forEach(function (b) {
      b.addEventListener("click", function () {
        var j = parseInt(b.getAttribute("data-garder"), 10), ta = $("#zj-wird-corps textarea[data-daftar=\"" + j + "\"]");
        poserWird(Wd.ecrireDaftar(joueur.recit, j, ta ? ta.value : ""));
        rendreWird();
      });
    });
  }

  // ---- v4.7 — LES JEUX DE LA ZAWIA : le mot du jour, l'atay, la fontaine ---------------
  // « Les jeux les plus addictifs de la zawia » (Youssef, 18/09/2026). Trois
  // salles de plus, chacune à sa place dans la cour — jamais une bannière :
  // le lawh du jour au mur nord de la Madrasa (tuile K, kelma.js), les
  // orangers du riad (T, atay.js), la margelle de la fontaine du Sahn (f,
  // khessa.js). Aucune ne donne un point. Chaque partie verse une goutte à
  // la fontaine, et c'est la BASE qui compte les gouttes (zawia-khessa.sql).

  // -- la fontaine ------------------------------------------------------------------
  var khessa = { etat: null, chargement: null, verses: {} };
  function chargerKhessa() {
    if (!Kx || !compte || typeof compte.khessaEtat !== "function" || !joueur) return Promise.resolve(null);
    if (khessa.chargement) return khessa.chargement;
    khessa.chargement = compte.khessaEtat().then(function (r) {
      khessa.chargement = null;
      khessa.etat = Kx.normaliser(r);
      if ($("#zj-khessa") && !$("#zj-khessa").hidden) rendreKhessa();
      return khessa.etat;
    }).catch(function () { khessa.chargement = null; return null; });
    return khessa.chargement;
  }
  // La goutte d'un geste : une par geste et par jour — la base le garantit, et
  // on ne la redemande pas deux fois dans la même journée.
  function verser(geste) {
    if (!Kx || !compte || typeof compte.khessaVerser !== "function" || !joueur || !Kx.estGeste(geste)) return;
    var jour = Kx.jourCasa();
    if (khessa.verses[geste] === jour) return;
    khessa.verses[geste] = jour;
    compte.khessaVerser(geste).then(function (r) {
      var e = Kx.normaliser(r);
      if (!e.ok) { delete khessa.verses[geste]; return; }   // on réessaiera au prochain geste
      khessa.etat = e;
      if ($("#zj-khessa") && !$("#zj-khessa").hidden) rendreKhessa();
    }).catch(function () { delete khessa.verses[geste]; });
  }
  // Le Wird du jour tenu verse sa goutte — pendant l'Arb3ine seulement : après
  // les quarante jours, le dernier resterait « tenu » à jamais.
  function verserGoutteWird(et) {
    if (!et || !et.courant || !et.courant.tenu || et.courant.jour !== et.jour) return;
    if (R.arb3ine(debutArb3ine()).ecoule) return;
    verser("wird");
  }
  function ouvrirKhessa() {
    var panneau = $("#zj-khessa");
    if (!panneau || !joueur || !Kx) return;
    if (palierFerme("khessa")) return;   // v5.5 — pas encore ouvert : la tuile le dit
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-khessa-fermer");
    if (f) f.focus();
    rendreKhessa();
    chargerKhessa();
  }
  function fermerKhessa() {
    var panneau = $("#zj-khessa");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  // Ce qu'un geste de la liste sait ouvrir — ou le fil d'or jusqu'à sa tuile.
  function allerKhessa(cle) {
    fermerKhessa();
    if (rihla.active && (cle === "page" || cle === "tahaddi")) sortirRihla();   // v5.2 — ces gestes sont dans la zawia
    if (cle === "kelma") { ouvrirKelma(); return; }
    if (cle === "atay") { ouvrirAtay(); return; }
    if (cle === "wird") { ouvrirWird(); return; }
    if (cle === "imtihan") { ouvrirImtihan(); return; }
    if (cle === "souk") { ouvrirSouk(); return; }
    if (cle === "qlil") { ouvrirQlil(); return; }
    var tuile = cle === "page" ? "S" : cle === "tahaddi" ? "E" : null;
    if (tuile) { guide.tuile = tuile; guide.fil = null; guide.deTuile = ""; guide.jeu = false; }
  }
  function rendreKhessa() {
    var corps = $("#zj-khessa-corps");
    if (!corps || !Kx) return;
    var e = khessa.etat;
    if (!e) { corps.innerHTML = '<p class="zj-riwaq__vide">On regarde l\'eau…</p>'; return; }
    if (!e.ok) { corps.innerHTML = '<p class="zj-riwaq__vide">' + esc(e.erreur) + '</p>'; return; }
    var allumees = Kx.lampes(e), lampes = "";
    for (var i = 0; i < Kx.LAMPES; i++) lampes += '<span class="' + (i < allumees ? "on" : "") + '"></span>';
    var pct = Math.min(100, Math.round(100 * e.niveau / e.objectif));
    var gouttes = e.niveau === 1 ? "1 goutte sur " + e.objectif : e.niveau + " gouttes sur " + e.objectif;
    var html =
      '<div class="zj-khessa__bassin' + (e.pleine ? ' zj-khessa__bassin--pleine' : '') + '" role="img" aria-label="' + esc(gouttes) + '">' +
        '<div class="zj-khessa__eau" style="height:' + pct + '%"></div><div class="zj-khessa__lampes">' + lampes + '</div></div>' +
      '<div class="zj-khessa__compte"><p><strong>' + gouttes + '</strong></p>' +
        '<p>' + (e.verseurs === 1 ? "1 personne a versé cette semaine" : e.verseurs + " personnes ont versé cette semaine") + '</p>' +
        '<p>' + (e.restants <= 1 ? "Dernier jour : jusqu'à dimanche minuit" : "Encore " + e.restants + " jours") + '</p></div>';
    if (e.pleine) html += '<p class="zj-khessa__pleine">La fontaine déborde. La semaine prochaine, les lanternes de la cour restent allumées — pour tout le monde.</p>';
    if (e.passeePleine) html += '<p class="zj-khessa__note">La semaine dernière, la cour a rempli la fontaine : cette semaine, les lanternes sont allumées.</p>';
    html += '<h3 class="zj-majliss__titre">Ce qui verse une goutte</h3><ul class="zj-majliss__liste zj-khessa__gestes">' +
      Kx.gestesPour(lignee.maison).map(function (g) {
        var fait = e.miens.indexOf(g.cle) >= 0;
        var aller = !fait && g.cle !== "salut" ? '<button type="button" class="zj-bouton zj-bouton--discret" data-aller="' + g.cle + '">Y aller</button>' : '';
        return '<li class="' + (fait ? 'fait' : '') + '"><div class="zj-majliss__ligne"><p>' + esc(g.texte) + '</p>' +
          (fait ? '<span class="zj-badge zj-badge--ok">versée aujourd\'hui</span>' : aller) + '</div></li>';
      }).join("") + '</ul>' +
      '<p class="zj-tableau__note">Une goutte par geste, par jour et par personne : c\'est la base qui compte, pas l\'écran. La fontaine ne donne aucun point — elle est à tous.</p>' +
      (e.atelier ? '<p class="zj-tableau__note">En atelier, elle n\'est qu\'à toi : ' + e.objectif + ' gouttes la remplissent.</p>' : '');
    corps.innerHTML = html;
    $$("#zj-khessa-corps [data-aller]").forEach(function (b) {
      b.addEventListener("click", function () { allerKhessa(b.getAttribute("data-aller")); });
    });
  }

  // -- Lkelma d'lyoum : le lawh du jour --------------------------------------------------
  var kelma = { n: 0, saisie: "", msg: "", ko: false };
  function langueKelma() { return Lg && Lg.estAr() ? "ar" : "fr"; }
  function etatKelma() { return joueur && joueur.recit ? joueur.recit.kelma : null; }
  // L'adresse du jeu, pour le partage — seulement sur son domaine : servi
  // ailleurs, le partage part sans adresse plutôt que de nommer la maison.
  function adresseJeu() {
    var h = String(location.hostname || "");
    return /zawia\.tech$/i.test(h) ? location.origin : "";
  }
  function ouvrirKelma() {
    var panneau = $("#zj-kelma");
    if (!panneau || !joueur || !Km) return;
    if (palierFerme("kelma")) return;   // v5.5 — pas encore ouvert : la tuile le dit
    basculerMenu(false);
    fermerDialogue();
    kelma.n = Km.numero(); kelma.saisie = ""; kelma.msg = "";
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    rendreKelma();
    var cadre = panneau.querySelector(".zj-riwaq__cadre");
    if (cadre) cadre.focus();   // Entrée valide l'essai, pas le bouton du menu resté en main
  }
  function fermerKelma() {
    var panneau = $("#zj-kelma");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function grilleKelma(gr) {
    var html = "";
    for (var r = 0; r < Km.ESSAIS; r++) {
      var ls = [], ev = null, courante = r === gr.essais.length && !gr.fini;
      if (r < gr.essais.length) { ls = Km.lettres(gr.essais[r]); ev = gr.evaluations[r]; }
      else if (courante) ls = Km.lettres(kelma.saisie);
      var cases = "";
      for (var i = 0; i < gr.mot.longueur; i++) {
        var ch = ls[i] || "";
        cases += '<span class="zj-kelma__case' + (ev ? " " + ev[i] : (ch ? " saisie" : "")) + '">' + esc(ch) + '</span>';
      }
      html += '<div class="zj-kelma__ligne' + (courante ? ' courante' + (kelma.ko ? ' ko' : '') : '') + '">' + cases + '</div>';
    }
    return html;
  }
  function clavierKelma(gr, l) {
    return '<div class="zj-kelma__clavier" dir="' + (l === "ar" ? "rtl" : "ltr") + '">' + Km.CLAVIERS[l].map(function (rang) {
      return '<div class="zj-kelma__rang">' + rang.map(function (k) {
        var etat = gr.clavier[k] || "", large = k === Km.ENTREE || k === Km.EFFACER;
        var nom = k === Km.ENTREE ? ' aria-label="Valider"' : k === Km.EFFACER ? ' aria-label="Effacer"' : '';
        return '<button type="button" tabindex="-1" class="zj-kelma__touche' + (etat ? " " + etat : "") + (large ? " large" : "") + '" data-k="' + esc(k) + '"' + nom + '>' + esc(k) + '</button>';
      }).join("") + '</div>';
    }).join("") + '</div>';
  }
  function finKelma(gr, l, auj) {
    var st = Km.stats(etatKelma(), auj), m = gr.mot, ar = l === "ar" ? ' lang="ar" dir="rtl"' : '';
    return '<div class="zj-kelma__fin">' +
      '<p class="zj-kelma__verdict">' + (gr.gagne ? (gr.essais.length === 1 ? "Du premier coup !" : "Trouvée en " + gr.essais.length + " essais.") : "Pas cette fois. Voici le mot :") + '</p>' +
      '<div class="zj-kelma__mot"><strong' + ar + '>' + esc(m.ecrit) + '</strong><p' + ar + '>' + esc(m.sens) + '</p></div>' +
      '<div class="zj-kelma__stats">' +
        '<div><strong>' + st.jours + '</strong><span>jours joués</span></div>' +
        '<div><strong>' + st.serie + '</strong><span>série</span></div>' +
        '<div><strong>' + st.record + '</strong><span>record</span></div>' +
        '<div><strong>' + st.trouvees + '</strong><span>trouvées</span></div></div>' +
      '<div class="zj-wird__actions"><button type="button" class="zj-bouton" id="zj-kelma-partager">Partager la grille</button>' +
        (gr.n === auj && Km.rattrapable(etatKelma(), auj, l) ? '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-kelma-hier">Rattraper celle d\'hier</button>' : '') +
        (gr.n !== auj ? '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-kelma-auj">Revenir à celle d\'aujourd\'hui</button>' : '') + '</div>' +
      '<p class="zj-tableau__note">La prochaine s\'écrit à minuit, heure de Fès. Aucun point : la kelma compte des jours — jouer compte, perdre ne casse rien. Ta goutte du jour est dans la fontaine du Sahn.</p></div>';
  }
  function rendreKelma() {
    var corps = $("#zj-kelma-corps");
    if (!corps || !joueur || !Km) return;
    var l = langueKelma(), auj = Km.numero(), gr = Km.grille(etatKelma(), kelma.n, l);
    var html = '<div class="zj-cartes__compte zj-kelma__tete"><p>Lkelma #' + gr.n + '</p><p>' + gr.mot.longueur + ' lettres</p>' +
        (gr.n !== auj ? '<p>celle d\'hier, à rattraper</p>' : '') + '</div>' +
      '<div id="zj-kelma-grille" class="zj-kelma__grille" dir="' + (l === "ar" ? "rtl" : "ltr") + '" style="--n:' + gr.mot.longueur + '"' + (l === "ar" ? ' lang="ar"' : '') + '>' + grilleKelma(gr) + '</div>' +
      '<p id="zj-kelma-msg" class="zj-kelma__msg" aria-live="polite">' + esc(kelma.msg) + '</p>' +
      (gr.fini ? finKelma(gr, l, auj) : clavierKelma(gr, l));
    corps.innerHTML = html;
    $$("#zj-kelma-corps [data-k]").forEach(function (b) {
      b.addEventListener("click", function () { kelmaTouche(b.getAttribute("data-k")); b.blur(); });
    });
    var pa = $("#zj-kelma-partager");
    if (pa) pa.addEventListener("click", partagerKelma);
    var hier = $("#zj-kelma-hier");
    if (hier) hier.addEventListener("click", function () { kelma.n = Km.numero() - Km.RATTRAPAGE; kelma.saisie = ""; kelma.msg = ""; rendreKelma(); });
    var retour = $("#zj-kelma-auj");
    if (retour) retour.addEventListener("click", function () { kelma.n = Km.numero(); kelma.saisie = ""; kelma.msg = ""; rendreKelma(); });
  }
  function majGrilleKelma() {
    var g = $("#zj-kelma-grille"), msg = $("#zj-kelma-msg");
    if (g) g.innerHTML = grilleKelma(Km.grille(etatKelma(), kelma.n, langueKelma()));
    if (msg) msg.textContent = kelma.msg;
  }
  function kelmaTouche(k) {
    if (!Km || !joueur) return;
    var l = langueKelma(), gr = Km.grille(etatKelma(), kelma.n, l);
    if (gr.fini) return;
    if (k === Km.ENTREE) { validerKelma(); return; }
    if (k === Km.EFFACER) { kelma.saisie = Km.lettres(kelma.saisie).slice(0, -1).join(""); kelma.msg = ""; majGrilleKelma(); return; }
    var ch = Km.normaliser(k, l);
    if (Km.lettres(ch).length !== 1 || Km.LETTRES[l].indexOf(ch) < 0) return;
    if (Km.lettres(kelma.saisie).length >= gr.mot.longueur) return;
    kelma.saisie += ch; kelma.msg = "";
    majGrilleKelma();
  }
  function validerKelma() {
    var l = langueKelma(), r = Km.jouer(etatKelma(), kelma.n, l, kelma.saisie, Km.numero());
    if (!r.resultat.ok) {
      kelma.msg = r.resultat.erreur; kelma.ko = true;
      majGrilleKelma();
      kelma.ko = false;
      sonner("faux");
      return;
    }
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.kelma = r.etat;
    kelma.saisie = ""; kelma.msg = "";
    sauvegarderJoueur();
    if (r.resultat.fini) { sonner(r.resultat.gagne ? "page" : "faux"); verser(Km.GESTE); }
    else sonner("page_dlg");
    rendreKelma();
  }
  function partagerKelma() {
    var txt = Km.partage(etatKelma(), kelma.n, langueKelma(), adresseJeu());
    if (!txt) return;
    var dire = function (m) { kelma.msg = m; var el = $("#zj-kelma-msg"); if (el) el.textContent = m; };
    var montrer = function () {
      var el = $("#zj-kelma-msg");
      if (!el) return;
      el.innerHTML = '<textarea class="zj-kelma__copie" rows="8" readonly>' + esc(txt) + '</textarea>';
      var ta = el.querySelector("textarea");
      if (ta) { ta.focus(); ta.select(); }
    };
    var copier = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { dire("Copiée. Colle-la sur WhatsApp."); }, montrer);
      else montrer();
    };
    var tactile = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (tactile && navigator.share) navigator.share({ text: txt }).catch(function (e) { if (!e || e.name !== "AbortError") copier(); });
    else copier();
  }

  // -- Atay : le thé versé de haut --------------------------------------------------------
  var atay = { etat: null, raf: 0, dernier: 0, tient: false, gouttes: [], textes: {}, maj: 0 };
  function ouvrirAtay() {
    var panneau = $("#zj-atay");
    if (!panneau || !joueur || !At) return;
    if (palierFerme("atay")) return;   // v5.5 — pas encore ouvert : la tuile le dit
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    nouveauService();
  }
  function fermerAtay() {
    var panneau = $("#zj-atay");
    if (!panneau || panneau.hidden) return;
    cancelAnimationFrame(atay.raf);
    atay.tient = false;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function nouveauService() {
    atay.etat = At.nouveau(); atay.tient = false; atay.gouttes = []; atay.textes = {}; atay.maj = 0;
    rendreAtay();
    atay.dernier = performance.now();
    cancelAnimationFrame(atay.raf);
    atay.raf = requestAnimationFrame(boucleAtay);
  }
  function rendreAtay() {
    var corps = $("#zj-atay-corps");
    if (!corps) return;
    var rec = At.normaliserEtat(joueur.recit.atay);
    corps.innerHTML =
      '<div class="zj-atay__scene"><canvas id="zj-atay-scene" tabindex="-1" aria-label="Le berrad, le verre et la siniya"></canvas></div>' +
      '<div class="zj-cartes__compte zj-atay__etat"><p id="zj-atay-verre"></p><p id="zj-atay-rghwa"></p></div>' +
      '<button type="button" id="zj-atay-verser" class="zj-bouton zj-atay__verser">Tenir pour verser</button>' +
      '<p class="zj-atay__aide">Ou la barre d\'espace, tenue. Lâche pour redescendre.</p>' +
      '<div id="zj-atay-fin" class="zj-atay__fin" hidden></div>' +
      (rec.s ? '<p class="zj-tableau__note">Services servis : ' + rec.s + ' · ta meilleure rghwa : ' + rec.m + '</p>' : '');
    var btn = $("#zj-atay-verser"), cv = $("#zj-atay-scene");
    var tenir = function (ev) { ev.preventDefault(); if (atay.etat && !atay.etat.fini) { atay.tient = true; if (btn) btn.classList.add("actif"); } };
    var lacher = function () { atay.tient = false; if (btn) btn.classList.remove("actif"); };
    [btn, cv].forEach(function (el) {
      if (!el) return;
      el.addEventListener("pointerdown", tenir);
      el.addEventListener("pointerup", lacher); el.addEventListener("pointercancel", lacher); el.addEventListener("pointerleave", lacher);
      el.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    });
    if (cv) cv.focus();
    majEtatAtay(true);
    dessinerAtay();
  }
  function majEtatAtay(force) {
    var e = atay.etat, maintenant = performance.now();
    if (!e || (!force && maintenant - atay.maj < 200)) return;
    atay.maj = maintenant;
    var s = At.score(e);
    var t1 = "Verre " + Math.min(At.VERRES, e.verre + 1) + " sur " + At.VERRES;
    var t2 = "Rghwa " + s.rghwa + (s.gouttes ? " · " + s.gouttes + " gouttes sur la siniya" : "");
    if (atay.textes.verre !== t1) { atay.textes.verre = t1; var a = $("#zj-atay-verre"); if (a) a.textContent = t1; }
    if (atay.textes.rghwa !== t2) { atay.textes.rghwa = t2; var b = $("#zj-atay-rghwa"); if (b) b.textContent = t2; }
  }
  function boucleAtay(now) {
    var panneau = $("#zj-atay");
    if (!panneau || panneau.hidden || !atay.etat) return;
    var dt = Math.min(0.1, Math.max(0, (now - atay.dernier) / 1000));
    atay.dernier = now;
    // la physique par pas de 1/60 s — la même, quel que soit l'écran
    while (dt > 1e-6 && !atay.etat.fini) {
      var p = Math.min(dt, 1 / 60), avant = atay.etat.t;
      atay.etat = At.pas(atay.etat, p, atay.tient);
      if (atay.etat.verse && !At.dansLeVerre(atay.etat.x) && Math.floor(atay.etat.t * 12) !== Math.floor(avant * 12) && atay.gouttes.length < 90) atay.gouttes.push(atay.etat.x);
      dt -= p;
    }
    dessinerAtay();
    majEtatAtay(false);
    if (atay.etat.fini) { finirService(); return; }
    atay.raf = requestAnimationFrame(boucleAtay);
  }
  function nomGouteur() {
    var cle = At.gouteur(Km ? Km.numero() : 0);
    var n = Pn && Pn.PNJ ? Pn.PNJ.filter(function (x) { return x.cle === cle; })[0] : null;
    return n ? n.nom : "Lalla Zhor";
  }
  function finirService() {
    majEtatAtay(true);
    var s = At.score(atay.etat), jour = Kx ? Kx.jourCasa() : new Date().toISOString().slice(0, 10);
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.atay = At.enregistrer(joueur.recit.atay, s, jour);
    sauvegarderJoueur();
    verser(At.GESTE);
    sonner(s.pleins >= At.VERRES && s.note >= 45 ? "page" : "faux");
    var btn = $("#zj-atay-verser"), aide = $(".zj-atay__aide"), fin = $("#zj-atay-fin");
    if (btn) btn.hidden = true;
    if (aide) aide.hidden = true;
    if (!fin) return;
    fin.innerHTML =
      '<div class="zj-atay__note"><strong>' + s.note + '</strong><span>sur 100</span></div>' +
      '<p class="zj-atay__qui">' + esc(nomGouteur()) + ' goûte :</p>' +
      '<p class="zj-atay__verdict">' + esc(At.verdict(s)) + '</p>' +
      '<div class="zj-wird__actions"><button type="button" class="zj-bouton" id="zj-atay-encore">Servir encore</button></div>' +
      '<p class="zj-tableau__note">Ta meilleure rghwa : ' + At.normaliserEtat(joueur.recit.atay).m + '. Ta goutte du jour est dans la fontaine du Sahn.</p>';
    fin.hidden = false;
    var encore = $("#zj-atay-encore");
    if (encore) { encore.addEventListener("click", nouveauService); encore.focus(); }
  }
  // Le dessin : la siniya, trois verres, le berrad, le filet, la jauge de hauteur.
  function dessinerAtay() {
    var cv = $("#zj-atay-scene");
    if (!cv || !atay.etat) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth || 320, H = cv.clientHeight || 280;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var c = cv.getContext("2d"), e = atay.etat;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    var ov = function (x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); };
    var cx = W / 2 + 10, plateau = H - 30, gH = 72, gHaut = 23, gBas = 17, haut = plateau - gH;
    // la siniya, argent ciselé
    c.fillStyle = "#6f7278"; ov(cx, plateau + 7, W * 0.43, 19); c.fill();
    c.fillStyle = "#c9ccd3"; ov(cx, plateau + 2, W * 0.42, 17); c.fill();
    c.strokeStyle = "rgba(111, 114, 120, 0.7)"; c.lineWidth = 1; ov(cx, plateau + 2, W * 0.34, 12); c.stroke();
    // ce qui est tombé à côté
    c.fillStyle = "rgba(122, 62, 18, 0.72)";
    atay.gouttes.forEach(function (x, i) { ov(cx + x * gHaut + ((i * 37) % 13) - 6, plateau + ((i * 53) % 11) - 3, 3.2, 1.6); c.fill(); });
    // un verre : bord doré, thé ambré, et la rghwa par-dessus
    var verre = function (x, niveau, mousse, actuel) {
      var hl = gH * Math.max(0, Math.min(1, niveau)), fond = plateau;
      c.save();
      c.beginPath(); c.moveTo(x - gHaut, haut); c.lineTo(x + gHaut, haut); c.lineTo(x + gBas, fond); c.lineTo(x - gBas, fond); c.closePath();
      c.fillStyle = "rgba(230, 240, 245, 0.18)"; c.fill();
      c.clip();
      if (hl > 0) {
        var y = fond - hl;
        c.fillStyle = "#9a4a12"; c.fillRect(x - gHaut, y, gHaut * 2, hl);
        c.fillStyle = "rgba(210, 120, 40, 0.35)"; c.fillRect(x - gHaut, y, gHaut * 0.7, hl);
        var ep = Math.min(hl, 2 + 12 * mousse);
        c.fillStyle = "#f3e6c8"; c.fillRect(x - gHaut, y, gHaut * 2, ep);
        c.fillStyle = "rgba(255, 255, 255, 0.55)";
        for (var b = 0; b < 6; b++) { ov(x - gHaut + 5 + b * 5.5, y + ep * 0.4, 1.6, 1.1); c.fill(); }
      }
      c.restore();
      c.strokeStyle = actuel ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.45)"; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x - gHaut, haut); c.lineTo(x - gBas, fond); c.lineTo(x + gBas, fond); c.lineTo(x + gHaut, haut); c.stroke();
      c.strokeStyle = "#e6b13f"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - gHaut + 1, haut + 6); c.lineTo(x + gHaut - 1, haut + 6); c.stroke();
    };
    e.verres.forEach(function (v, i) {
      var x = i < e.verre ? cx - 66 - (e.verre - 1 - i) * 34 : i > e.verre ? cx + 66 + (i - e.verre - 1) * 34 : cx;
      var echelle = i === e.verre ? 1 : 0.62;
      c.save(); c.translate(x, plateau); c.scale(echelle, echelle); c.translate(-x, -plateau);
      verre(x, v.niveau, v.niveau > 0 ? v.mousse / v.niveau : 0, i === e.verre);
      c.restore();
    });
    // le berrad : son bec au-dessus du verre, à la hauteur de la main
    var becY = haut - 14 - e.h * (haut - 56), becX = cx + 2;
    c.save(); c.translate(becX, becY); c.scale(1.3, 1.3); c.translate(-becX, -becY);   // le berrad, un peu plus grand que nature
    var corpsX = becX + 44, corpsY = becY - 8;
    c.fillStyle = "#b8bcc4"; ov(corpsX, corpsY, 21, 17); c.fill();
    c.fillStyle = "#e3e5ea"; ov(corpsX - 6, corpsY - 5, 8, 6); c.fill();
    c.fillStyle = "#9fa3ab"; c.fillRect(corpsX - 11, corpsY - 22, 22, 7);
    c.fillStyle = "#c9ccd3"; ov(corpsX, corpsY - 24, 9, 5); c.fill();
    c.fillStyle = "#e6b13f"; ov(corpsX, corpsY - 30, 3, 3); c.fill();
    c.strokeStyle = "#9fa3ab"; c.lineWidth = 3;
    c.beginPath(); c.arc(corpsX + 22, corpsY - 2, 11, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(corpsX - 17, corpsY + 2); c.quadraticCurveTo(corpsX - 32, corpsY - 2, becX, becY); c.stroke();
    c.restore();
    // le filet
    if (e.verse) {
      var dedans = At.dansLeVerre(e.x), tombeX = cx + e.x * gHaut;
      var v0 = e.verres[e.verre], tombeY = dedans ? plateau - gH * Math.max(0, Math.min(1, v0.niveau)) : plateau;
      c.strokeStyle = "rgba(170, 90, 25, 0.9)"; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(becX, becY); c.quadraticCurveTo(becX + (tombeX - becX) * 0.2, (becY + tombeY) / 2, tombeX, tombeY); c.stroke();
      if (!dedans) { c.fillStyle = "rgba(122, 62, 18, 0.8)"; ov(tombeX, plateau, 5, 2.2); c.fill(); }
    }
    // la jauge : la hauteur de la main, et le trait de la rghwa pleine
    var jx = 18, jHaut = 26, jBas = haut;
    c.fillStyle = "rgba(244, 236, 217, 0.1)"; c.fillRect(jx - 3, jHaut, 6, jBas - jHaut);
    var hy = jBas - (jBas - jHaut) * e.h;
    c.fillStyle = e.h >= At.HAUT_PARFAIT ? "#e6b13f" : "#2ee6a8"; c.fillRect(jx - 3, hy, 6, jBas - hy);
    var py = jBas - (jBas - jHaut) * At.HAUT_PARFAIT;
    c.fillStyle = "#e6b13f"; c.fillRect(jx - 8, py - 1, 16, 2);
  }

  // -- v4.8 — Qlil w mfid : le golf du prompt -----------------------------------------
  // Neuf trous, l'établi du prompt au coin nord-est de la Madrasa (tuile Y).
  // Le navigateur n'appelle jamais le modèle : la fonction Netlify zawia-qlil
  // réserve l'essai, appelle, juge avec qlil.js et consigne. Ici on affiche,
  // on envoie, et on crédite la Sna3a du PREMIER trou réussi — comme un Ta7addi.
  var qlil = { etat: null, trou: null, envoi: false, resultat: null, brouillon: {} };
  function ouvrirQlil(cle) {
    var panneau = $("#zj-qlil");
    if (!panneau || !joueur || !Ql) return;
    if (palierFerme("qlil")) return;   // v5.5 — pas encore ouvert : la tuile le dit
    basculerMenu(false);
    fermerDialogue();
    qlil.trou = cle && Ql.trou(cle) ? cle : null;
    qlil.resultat = null;
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-qlil-fermer");
    if (f) f.focus();
    rendreQlil();
    chargerQlil();
  }
  function fermerQlil() {
    var panneau = $("#zj-qlil");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function chargerQlil() {
    if (!compte || typeof compte.qlilEtat !== "function") return;
    compte.qlilEtat().then(function (r) {
      qlil.etat = Ql.normaliserEtat(r);
      if (!$("#zj-qlil").hidden) rendreQlil();
    }).catch(function () { /* l'établi dira qu'il ne répond pas quand on l'ouvrira */ });
  }
  function rendreQlil() {
    var corps = $("#zj-qlil-corps");
    if (!corps || !Ql) return;
    if (qlil.trou) { rendreTrouQlil(corps); return; }
    var e = qlil.etat, c = Ql.carte(e);
    var html = '';
    if (e && !e.ok) html += '<p class="zj-riwaq__vide">' + esc(e.erreur) + '</p>';
    if (e && e.ok) {
      html += '<div class="zj-cartes__compte"><p>' + (c.faits === 1 ? "1 trou réussi sur 9" : c.faits + " trous réussis sur 9") + '</p>' +
        (c.total != null ? '<p>' + (c.total === 0 ? "au par" : (c.total < 0 ? (-c.total) + " sous le par" : c.total + " au-dessus du par")) + '</p>' : '') +
        '<p>' + (e.restant === 1 ? "1 essai aujourd'hui" : e.restant + " essais aujourd'hui") + '</p></div>';
    }
    html += '<div class="zj-qlil__trous">' + Ql.TROUS.map(function (t, i) {
      var x = e && e.ok ? e.trous[t.cle] : null, m = x && x.moi;
      var tete = x && x.tete && x.tete[0];
      return '<button type="button" class="zj-qlil__trou' + (m ? ' fait' : '') + '" data-trou="' + t.cle + '">' +
        '<span class="zj-qlil__n">' + (i + 1) + '</span>' +
        '<span class="zj-qlil__info"><p class="zj-qlil__titre">' + esc(t.titre) + '</p>' +
        '<p>par ' + t.par + '</p>' +
        (m ? '<p class="zj-qlil__moi">ton meilleur : ' + m + ' (' + Ql.ecart(m, t.par) + ')</p>' : '') +
        (tete ? '<p class="zj-qlil__tete">le plus court : ' + tete.longueur + ' — ' + esc(tete.pseudo) + '</p>' : '') +
        '</span></button>';
    }).join("") + '</div>' +
    '<p class="zj-tableau__note">Le premier trou réussi rapporte de la Sna3a (voie « dire juste ») : 10, et 15 sous le par. Les records suivants ne rapportent que la place au tableau. Le prompt ne peut jamais contenir la réponse.</p>';
    corps.innerHTML = html;
    $$("#zj-qlil-corps [data-trou]").forEach(function (b) {
      b.addEventListener("click", function () { qlil.trou = b.getAttribute("data-trou"); qlil.resultat = null; rendreQlil(); });
    });
  }
  function compteQlil(t) {
    var ta = $("#zj-qlil-prompt"), out = $("#zj-qlil-compte");
    if (!ta || !out) return;
    var n = Ql.longueur(ta.value);
    out.textContent = (n === 1 ? "1 caractère" : n + " caractères") + " · par " + t.par;
    out.className = "zj-qlil__compte" + (n && n <= t.par ? " sous" : "");
    qlil.brouillon[t.cle] = ta.value;
  }
  function rendreTrouQlil(corps) {
    var t = Ql.trou(qlil.trou), e = qlil.etat, x = e && e.ok ? e.trous[t.cle] : null, r = qlil.resultat;
    var html = '<button type="button" class="zj-bouton zj-bouton--discret zj-qlil__retour" id="zj-qlil-retour">← Les neuf trous</button>' +
      '<div class="zj-cartes__compte"><p>Trou ' + Ql.numero(t.cle) + '</p><p>par ' + t.par + '</p>' +
        (x && x.moi ? '<p>ton meilleur : ' + x.moi + '</p>' : '') + '</div>' +
      '<h3 class="zj-qlil__nom">' + esc(t.titre) + '</h3>' +
      '<p class="zj-qlil__consigne">' + esc(t.consigne) + '</p>' +
      (t.interdits.length ? '<p class="zj-qlil__interdits">Interdit dans le prompt : ' + t.interdits.map(function (m) { return '« ' + esc(m) + ' »'; }).join(", ") + '</p>' : '') +
      '<textarea id="zj-qlil-prompt" class="zj-qlil__prompt" rows="3" maxlength="' + Ql.MAX_PROMPT + '" placeholder="Ton prompt. Le plus court possible." spellcheck="false"></textarea>' +
      '<div class="zj-majliss__ligne"><button type="button" class="zj-bouton" id="zj-qlil-envoyer"' + (qlil.envoi ? ' disabled' : '') + '>' + (qlil.envoi ? "Le modèle réfléchit…" : "Envoyer au modèle") + '</button>' +
        '<span id="zj-qlil-compte" class="zj-qlil__compte"></span></div>' +
      '<p id="zj-qlil-msg" class="zj-presence__msg" aria-live="polite"></p>';
    if (r) {
      html += '<div class="zj-qlil__resultat ' + (r.reussi ? 'ok' : 'ko') + '">' +
        '<p class="zj-qlil__verdict">' + (r.reussi ? "Trou réussi en " + r.longueur + " caractères." : "Pas encore.") + '</p>' +
        '<p>' + esc(r.raison) + '</p>' +
        '<p class="zj-kicker">Le modèle a répondu</p><pre class="zj-qlil__sortie">' + esc(r.sortie) + '</pre>' +
        (r.pts ? '<p class="zj-qlil__gain">+' + r.pts + ' Sna3a — ton premier passage sur ce trou' + (r.pts === Ql.SNA3A.sousLePar ? ", sous le par" : "") + '.</p>' : '') +
        (r.reussi && r.record && !r.premiere ? '<p class="zj-qlil__gain">Record personnel : ' + r.meilleur + ' caractères.</p>' : '') +
        (r.reussi && r.rang ? '<p>' + (r.rang === 1 ? "Tu es premier au tableau de ce trou." : "Rang " + r.rang + " au tableau de ce trou.") + '</p>' : '') +
        '</div>';
    }
    if (x && x.tete && x.tete.length) {
      html += '<h3 class="zj-majliss__titre">Les plus courts</h3><ol class="zj-qlil__tableau">' + x.tete.map(function (l) {
        return '<li' + (l.moi ? ' class="moi"' : '') + '><span>' + esc(l.pseudo) + '</span><strong>' + l.longueur + '</strong></li>';
      }).join("") + '</ol>';
    }
    if (e && e.ok) html += '<p class="zj-tableau__note">' + (e.restant === 1 ? "Il te reste 1 essai aujourd'hui." : "Il te reste " + e.restant + " essais aujourd'hui.") + ' Le tableau montre la longueur, jamais le prompt.</p>';
    if (e && !e.ok) html += '<p class="zj-riwaq__vide">' + esc(e.erreur) + '</p>';
    corps.innerHTML = html;
    var ta = $("#zj-qlil-prompt");
    if (ta) {
      ta.value = qlil.brouillon[t.cle] || "";
      ta.addEventListener("input", function () { compteQlil(t); });
      // Ctrl/Cmd + Entrée envoie ; Entrée seule va à la ligne (un prompt peut en avoir)
      ta.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); envoyerQlil(); } });
      compteQlil(t);
      if (!r) ta.focus();
    }
    var retour = $("#zj-qlil-retour");
    if (retour) retour.addEventListener("click", function () { qlil.trou = null; qlil.resultat = null; rendreQlil(); });
    var envoyer = $("#zj-qlil-envoyer");
    if (envoyer) envoyer.addEventListener("click", envoyerQlil);
    // le verdict tombe sous le pli : on l'amène sous les yeux
    var res = corps.querySelector(".zj-qlil__resultat");
    if (r && res && res.scrollIntoView) res.scrollIntoView({ block: "nearest", behavior: mouvementReduit ? "auto" : "smooth" });
  }
  function envoyerQlil() {
    if (qlil.envoi || !qlil.trou || !compte || typeof compte.qlilJouer !== "function") return;
    var t = Ql.trou(qlil.trou), ta = $("#zj-qlil-prompt"), msg = $("#zj-qlil-msg");
    var v = Ql.validerPrompt(t.cle, ta ? ta.value : "");
    if (!v.ok) { if (msg) { msg.textContent = v.erreur; msg.className = "zj-presence__msg ko"; } sonner("faux"); return; }
    qlil.envoi = true;
    var b = $("#zj-qlil-envoyer");
    if (b) { b.disabled = true; b.textContent = "Le modèle réfléchit…"; }
    if (msg) { msg.textContent = ""; msg.className = "zj-presence__msg"; }
    compte.qlilJouer(t.cle, v.prompt).then(function (r) {
      qlil.envoi = false;
      if (!r || !r.ok) {
        if (b) { b.disabled = false; b.textContent = "Envoyer au modèle"; }
        if (msg) { msg.textContent = (r && r.erreur) || "L'établi ne répond pas."; msg.className = "zj-presence__msg ko"; }
        if (r && r.quota && qlil.etat && qlil.etat.ok) qlil.etat.restant = 0;
        return;
      }
      // la Sna3a du premier passage, comme un Ta7addi (voie « dire juste »)
      var pts = Ql.sna3a(!!r.premiere, r.longueur, t.par);
      if (pts) { joueur.sna3a = R.ajouterSna3a(joueur.sna3a, Ql.VOIE, pts); sauvegarderJoueur(); rafraichirHud(); }
      verser(Ql.GESTE);   // un essai joué verse sa goutte à la fontaine
      sonner(r.reussi ? "defi" : "faux");
      qlil.resultat = Object.assign({}, r, { pts: pts });
      if (qlil.etat && qlil.etat.ok && typeof r.restant === "number") qlil.etat.restant = r.restant;
      rendreQlil();
      chargerQlil();   // le tableau et le meilleur, relus en base
    });
  }

  // -- Dans la cour : les lampes de la margelle, les lanternes, les invitations ---------
  var alab = { k: null, t: null, l: null, f: null, y: null, g: null, jour: "", n: 0, lu: 0 };
  function tuilesDe(ch) {
    var out = [];
    for (var y = 0; y < M.HAUTEUR; y++) for (var x = 0; x < M.LARGEUR; x++) if (M.tuile(x, y) === ch) out.push({ x: x, y: y });
    return out;
  }
  function dessinerAlab(cam) {
    if (!cam || !cour.ctx || !joueur || rahba.active) return;   // v5.7 — la Rahba a son décor, dessiné par la scène
    if (!alab.k) {
      alab.k = tuilesDe("K"); alab.t = tuilesDe("T"); alab.l = tuilesDe("L"); alab.y = tuilesDe("Y"); alab.g = tuilesDe("G");
      var fs = tuilesDe("f").concat(tuilesDe("F"));
      if (fs.length) {
        var xs = fs.map(function (p) { return p.x; }), ys = fs.map(function (p) { return p.y; });
        alab.f = { x0: Math.min.apply(null, xs) * T, y0: Math.min.apply(null, ys) * T, x1: (Math.max.apply(null, xs) + 1) * T, y1: (Math.max.apply(null, ys) + 1) * T };
      }
    }
    // l'horloge de la maison, relue une fois par seconde (Intl coûte cher à 60 images/s)
    var now = Date.now();
    if (now - alab.lu > 1000) { alab.lu = now; alab.jour = Kx ? Kx.jourCasa() : ""; alab.n = Km ? Km.numero() : 0; }
    var ctx = cour.ctx, z = cam.zoom;
    var ex = function (wx) { return (wx - cam.camX + cam.ox) * z; }, ey = function (wy) { return (wy - cam.camY + cam.oy) * z; };
    var souffle = mouvementReduit ? 0.8 : 0.6 + 0.3 * Math.sin(cour.t * 2.4);
    var ke = khessa.etat && khessa.etat.ok ? khessa.etat : null;
    // la récompense de la semaine : les lanternes allumées pour tous
    if (ke && ke.passeePleine) {
      alab.l.forEach(function (p) {
        var x = ex(p.x * T + T / 2), y = ey(p.y * T + T / 2), r = 26 * z;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255, 196, 92, " + (0.45 * souffle).toFixed(3) + ")"); g.addColorStop(1, "rgba(255, 196, 92, 0)");
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
    }
    // les douze lampes de la margelle : la jauge, dans la cour
    if (ke && alab.f) {
      var f = alab.f, allumees = Kx.lampes(ke), pts = [], k;
      var w = f.x1 - f.x0, h = f.y1 - f.y0, m = 2.5;
      for (k = 0; k < 3; k++) pts.push([f.x0 + w * (k * 2 + 1) / 6, f.y0 + m]);
      for (k = 0; k < 3; k++) pts.push([f.x1 - m, f.y0 + h * (k * 2 + 1) / 6]);
      for (k = 0; k < 3; k++) pts.push([f.x1 - w * (k * 2 + 1) / 6, f.y1 - m]);
      for (k = 0; k < 3; k++) pts.push([f.x0 + m, f.y1 - h * (k * 2 + 1) / 6]);
      pts.forEach(function (pt, i) {
        var x = ex(pt[0]), y = ey(pt[1]), on = i < allumees;
        if (on) {
          var g2 = ctx.createRadialGradient(x, y, 0, x, y, 5 * z);
          g2.addColorStop(0, "rgba(255, 210, 110, " + (0.7 * souffle).toFixed(3) + ")"); g2.addColorStop(1, "rgba(255, 210, 110, 0)");
          ctx.fillStyle = g2; ctx.fillRect(x - 5 * z, y - 5 * z, 10 * z, 10 * z);
        }
        ctx.fillStyle = on ? "#ffd36e" : "rgba(29, 26, 46, 0.55)";
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, 1.4 * z), 0, Math.PI * 2); ctx.fill();
      });
      // pleine : l'eau scintille
      if (ke.pleine && !mouvementReduit) {
        for (k = 0; k < 14; k++) {
          var tt = cour.t * 1.3 + k * 0.7, a = (Math.sin(tt * 2.1) + 1) / 2;
          var sx = ex(f.x0 + 10 + ((k * 23) % (w - 20))), sy = ey(f.y0 + 10 + ((k * 37) % (h - 20)));
          ctx.fillStyle = "rgba(255, 244, 200, " + (0.8 * a).toFixed(3) + ")";
          ctx.fillRect(sx - z, sy - z * 0.3, 2 * z, 0.6 * z); ctx.fillRect(sx - z * 0.3, sy - z, 0.6 * z, 2 * z);
        }
      }
    }
    // l'invitation : un losange d'or au-dessus de ce qui attend aujourd'hui
    var marque = function (p) {
      var x = ex(p.x * T + T / 2), y = ey(p.y * T) - (mouvementReduit ? 3 : 3 + 1.5 * Math.sin(cour.t * 3)) * z, s = 2.6 * z;
      ctx.fillStyle = "rgba(29, 26, 46, 0.6)";
      ctx.beginPath(); ctx.moveTo(x, y - s - z); ctx.lineTo(x + s + z, y); ctx.lineTo(x, y + s + z); ctx.lineTo(x - s - z, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(230, 177, 63, " + souffle.toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
    };
    if (Km && alab.n && palierOuvert("kelma") && !Km.joueAujourdhui(joueur.recit.kelma, alab.n)) alab.k.forEach(marque);
    if (At && alab.jour && palierOuvert("atay") && !At.servi(joueur.recit.atay, alab.jour)) alab.t.forEach(marque);
    if (Ql && alab.jour && palierOuvert("qlil") && qlil.etat && qlil.etat.ok && !qlilJoue()) alab.y.forEach(marque);   // v5.1 — l'état lu, sinon rien
    if (safqa.aTraiter > 0) alab.g.forEach(marque);   // v5.7 — une affaire attend ma réponse au Souk : le Bab s'allume
  }

  // ---- Le sandouq : une page perdue, une énigme, une réponse -----------------------------
  // v3.4 — la saison : le jeudi, en toutes lettres, heure de Casablanca.
  // v3.9 — la date se dit dans la langue de la page : en arabe, les mois du
  // Maroc (شتنبر) et les chiffres 0-9 ; la traduction du DOM n'a rien à faire.
  function locale() {
    return document.documentElement.lang === "ar" ? "ar-MA-u-nu-latn" : "fr-FR";
  }
  function jourDe(d) {
    try { return new Date(d).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Casablanca" }); }
    catch (e) { return new Date(d).toLocaleDateString(locale()); }
  }
  function ouvrirSandouq() {
    var e = P.etat(joueur.pages);
    // v7.2a — une page, et une seule : ce qu'on donne à un invité doit rester
    // un cadeau. Le coffre se referme, et dit pourquoi.
    if (dayf.actif && e.resolues >= Dy.PAGES_OFFERTES) {
      ouvrirDialogue({ nom: Dy.SANDOUQ_DONNE.nom, pages: Dy.SANDOUQ_DONNE.pages.slice() });
      return;
    }
    if (e.complet) { ouvrirDialogue(M.dialogue("S", { pages: e })); return; }
    if (!e.prochaine) {
      // toutes les pages ouvertes sont retrouvées : la suivante a son jour
      ouvrirDialogue({
        nom: "Le sandouq",
        pages: [
          "Tu as retrouvé les " + e.resolues + " pages que le sandouq tient pour l'instant. Nsyan en garde encore " + e.restantes + ".",
          "La prochaine, « " + e.aVenir.titre + " », s'ouvre " + jourDe(e.aVenir.le) + ". Une page par jeudi — on ne mange pas la Rihla en une nuit."
        ]
      });
      return;
    }
    var pg = e.prochaine, ville = Rc.mourchid(pg.ville);
    ouvrirDialogue({
      nom: "Le sandouq · " + (ville ? ville.ville : pg.ville),
      portrait: pg.ville,
      pages: [
        "Page " + (e.resolues + 1) + " sur " + e.ouvertes + (e.ouvertes < e.total ? " ouvertes" : "") + " — « " + pg.titre + " », " + pg.epoque + "." +
          (ville ? "\n" + ville.nom + " — " + ville.role + " — veille sur cette page." : ""),
        pg.enigme
      ],
      question: { page: pg, indicesVus: 0 }
    });
  }
  function questionVisible(v) {
    var f = $("#zj-question");
    if (!f) return;
    f.hidden = !v;
    document.body.setAttribute("data-question", v ? "1" : "0");
    var msg = $("#zj-question-msg");
    if (msg) msg.textContent = "";
    if (v) {
      var inp = $("#zj-reponse");
      if (inp) { inp.value = ""; inp.classList.remove("ko"); setTimeout(function () { inp.focus(); }, 30); }
      majIndice();
    }
  }
  function majIndice() {
    var dl = cour.dialogue, b = $("#zj-indice");
    if (!b || !dl || !dl.question) return;
    var n = dl.question.page.indices.length, vus = dl.question.indicesVus;
    b.disabled = vus >= n;
    b.textContent = vus >= n ? "Plus d'indice" : (vus === 0 ? "Un indice" : "Encore un indice (" + (n - vus) + ")");
  }
  function demanderIndice() {
    var dl = cour.dialogue;
    if (!dl || !dl.question) return;
    var q = dl.question;
    if (q.indicesVus >= q.page.indices.length) return;
    var texte = q.page.indices[q.indicesVus];
    q.indicesVus += 1;
    // L'indice remplace l'énigme dans la boîte ; l'énigme reste relisible en
    // fermant (Échap) et en revenant au sandouq — la page n'est pas perdue.
    $("#zj-dialogue-texte").textContent = texte;
    var msg = $("#zj-question-msg");
    if (msg) msg.textContent = "Un indice demandé : la page vaudra " + P.recompense(q.page, q.indicesVus) + " Sna3a.";
    majIndice();
    var inp = $("#zj-reponse");
    if (inp) inp.focus();
  }
  function repondre() {
    var dl = cour.dialogue;
    if (!dl || !dl.question) return;
    var q = dl.question, inp = $("#zj-reponse"), msg = $("#zj-question-msg");
    var r = P.verifierReponse(q.page, inp ? inp.value : "");
    if (!r.ok) {
      if (inp) { inp.classList.remove("ko"); void inp.offsetWidth; inp.classList.add("ko"); inp.select(); }
      if (msg) msg.textContent = r.saisie ? "Ce n'est pas ça. Nsyan sourit… Relis, demande un indice, ou va poser la question à ton compagnon." : "Écris une réponse d'abord.";
      sonner("faux");
      return;
    }
    sonner("page");
    var pts = P.recompense(q.page, q.indicesVus);
    joueur.dhakira = Math.max(0, Math.floor(Number(joueur.dhakira) || 0)) + pts;
    var listeAvant = P.etat(joueur.pages).liste;   // v4.0 — pour savoir si une ville revient sur la Kharita
    joueur.pages = P.retrouver(joueur.pages, q.page.cle);
    // v3.4 — la carte est dorée quand la page a été trouvée sans indice
    if (q.indicesVus === 0) { joueur.recit.dorees = joueur.recit.dorees || {}; joueur.recit.dorees[q.page.cle] = true; }
    sauvegarderJoueur();
    rafraichirHud();
    tutorielEvenement("page");
    nsyanRecule();    // v7.2a — « chaque page revenue, Nsyan recule d'un pas » : ça se VOIT
    verser("page");   // v4.7 — une goutte à la fontaine
    var e = P.etat(joueur.pages), v = R.voie(q.page.voie);
    var suite = e.complet ? "C'était la dernière page."
      : e.prochaine ? "Il reste " + e.restantes + " page" + (e.restantes > 1 ? "s" : "") + " dans le sandouq."
      : "La prochaine page s'ouvre " + jourDe(e.aVenir.le) + ".";
    var epilogue = e.complet && !joueur.recit.epilogue;
    var niveau = R.carnet(joueur).dhakira.niveau;
    questionVisible(false);
    // v7.2a — un invité ne reçoit pas de points, et on ne lui en annonce pas :
    // ce serait le seul mensonge de tout son parcours. Ce qu'il reçoit, il
    // vient de le VOIR — la couleur est revenue dans la cour.
    if (dayf.actif) {
      var cD = Dy.carte(q.page.titre, q.page.reponses[0]);
      ouvrirDialogue({ nom: cD.nom, portrait: "page:" + q.page.cle, pages: cD.pages.slice() });
      return;
    }
    ouvrirDialogue({
      nom: "Carte gagnée",
      portrait: "page:" + q.page.cle,
      pages: [
        "☑ « " + q.page.titre + " » — " + q.page.reponses[0] + ".\n+" + pts + " Dhakira" + (q.indicesVus === 0 ? " — trouvée sans indice : la carte est dorée." : " — la carte entre dans ta collection.") + "\nLa voie exercée : « " + (v ? v.nom : q.page.voie) + " ». Elle s'entraîne ici, elle se note à l'établi." +
          "\nDhakira : " + niveau.nom + ", " + niveau.sous + ".",
        q.page.fait,
        "Source : " + q.page.source,
        suite + " Ce que tu viens d'apprendre se pose sur ton tapis — étale, ne raconte pas."
      ].concat(Kh ? Kh.revenues(listeAvant, e.liste).map(function (cle) {
        var m = Rc.mourchid(cle);
        return m ? "Sur la Kharita, " + m.ville + " revient. " + m.nom + " t'y attend — Menu, puis La Kharita." : "";
      }).filter(Boolean) : []),
      apres: epilogue ? function () {
        joueur.recit.epilogue = new Date().toISOString();
        sauvegarderJoueur();
        ouvrirDialogue(Rc.EPILOGUE);
      } : null
    });
  }

  // ---- L'établi : un Ta7addi de la maison, corrigé par le jeu ---------------------------
  // v3.6 — `cle` : le Ta7addi que le Wird du jour demande, s'il n'est pas fait ;
  // sinon le prochain dans l'ordre. Un Ta7addi qui porte un `exercice` le
  // dit AVANT la question : quinze minutes avec une IA, puis on répond.
  function ouvrirEtabli(cle) {
    var e = Th.etat(joueur.tahaddi);
    if (e.complet) { ouvrirDialogue(M.dialogue("E", { tahaddi: e })); return; }
    var d = (cle && Th.defi(cle) && !Th.normaliserTahaddi(joueur.tahaddi)[cle]) ? Th.defi(cle) : e.prochain, v = R.voie(d.voie);
    var pages = [
      "Ta7addi " + (e.reussis + 1) + " sur " + e.total + " — « " + d.titre + " »." +
        (v ? "\nVoie « " + v.nom + " » : " + v.detail : "") +
        (e.sponsors ? "" : "\n(Les Ta7addi d'entreprise, eux, ne se corrigent pas ici : ils se livrent. Aucun n'est ouvert pour l'instant.)")
    ];
    if (d.exercice) pages.push("D'abord, l'exercice — quinze minutes, avec une IA :\n" + d.exercice + "\n\nPuis reviens répondre.");
    pages.push(d.enonce);
    ouvrirDialogue({
      nom: "L'établi · " + (v ? v.nom : d.voie),
      pages: pages,
      qcm: { defi: d, essais: 0 }
    });
  }

  function qcmVisible(v) {
    var box = $("#zj-choix");
    if (!box) return;
    box.hidden = !v;
    document.body.setAttribute("data-question", v ? "1" : "0");
    if (!v) { box.innerHTML = ""; return; }
    var dl = cour.dialogue;
    if (!dl || !dl.qcm) return;
    box.innerHTML = dl.qcm.defi.options.map(function (o, i) {
      return '<button type="button" class="zj-choix-qcm__b" data-i="' + i + '">' +
        '<span class="zj-choix-qcm__n">' + "ABCD".charAt(i) + '</span>' + esc(o) + '</button>';
    }).join("") + '<p id="zj-choix-msg" class="zj-question__msg" aria-live="polite"></p>';
    Array.prototype.slice.call(box.querySelectorAll("button")).forEach(function (b) {
      b.addEventListener("click", function (ev) { ev.stopPropagation(); choisir(parseInt(b.getAttribute("data-i"), 10)); });
    });
  }

  function choisir(i) {
    var dl = cour.dialogue;
    if (!dl || !dl.qcm) return;
    var q = dl.qcm, r = Th.verifier(q.defi, i);
    q.essais += 1;
    var btn = $("#zj-choix button[data-i=\"" + i + "\"]"), msg = $("#zj-choix-msg");
    if (!r.ok) {
      if (btn) { btn.disabled = true; btn.classList.add("faux"); }
      if (msg) msg.textContent = "Pas celle-là. Relis l'énoncé : la réponse s'y trouve.";
      sonner("faux");
      return;
    }
    if (btn) btn.classList.add("juste");
    sonner("defi");
    // v7.3 — une épreuve d'Oumm IA : AUCUN point non plus. Ce qu'on emporte est
    // l'explication, et la phrase qu'elle ne pourra plus redire.
    if (q.oumm) {
      qcmVisible(false);
      poserOumm(Om.marquer(etatOumm(), q.defi.cle));
      oummBrouille();
      var reste = Om.EPREUVES.length - Om.comptees(etatOumm());
      noterDayf(reste > 0 ? "epreuve" : "epreuves_finies");
      ouvrirDialogue({
        nom: "Épreuve passée",
        pages: [
          "☑ " + q.defi.options[q.defi.bonne] + (q.essais === 1 ? " — du premier coup." : "."),
          q.defi.explication,
          q.defi.prouve
        ],
        apres: reste > 0 ? epreuveSuivante : finirOumm
      });
      return;
    }
    // L'échauffement du tutoriel : même correction, AUCUN point, aucun registre.
    if (q.blanc) {
      qcmVisible(false);
      tutorielEvenement("echauffement");
      ouvrirDialogue({
        nom: "L'échauffement",
        pages: ["☑ " + q.defi.options[q.defi.bonne] + (q.essais === 1 ? " — du premier coup." : "."), q.defi.explication]
      });
      return;
    }
    var pts = Th.recompense(q.defi, q.essais), v = R.voie(q.defi.voie);
    var sna3aAvant = R.sna3a(joueur.sna3a, joueur.sna3aAttestee).total;   // v6.0 — pour dire ce que le point ouvre au Kounnach
    joueur.sna3a = R.ajouterSna3a(joueur.sna3a, q.defi.voie, pts);
    joueur.tahaddi = Th.reussir(joueur.tahaddi, q.defi.cle);
    sauvegarderJoueur();
    rafraichirHud();
    tutorielEvenement("defi");
    verser("tahaddi");   // v4.7
    var e = Th.etat(joueur.tahaddi);
    qcmVisible(false);
    ouvrirDialogue({
      nom: "Ta7addi passé",
      pages: [
        "☑ « " + q.defi.titre + " » — " + q.defi.options[q.defi.bonne] + "\n+" + pts + " Sna3a, voie « " + (v ? v.nom : q.defi.voie) + " »" + (q.essais === 1 ? " — du premier coup." : "."),
        q.defi.explication,
        e.complet
          ? "Les " + e.total + " Ta7addi de la maison sont passés. Les suivants viendront des entreprises : un vrai problème, un livrable, un jury — et des points qui s'attestent, pas qui se cliquent."
          : "Il reste " + e.restants + " Ta7addi à l'établi. La Sna3a dit ce que tu sais faire ; elle ne dit pas ta place dans la maison."
      ].concat(annonceKounnach(sna3aAvant))   // v6.0 — le point mène à la wasfa
    });
  }

  // ---- LE RIWAQ : la salle où la maison annonce -----------------------------------------
  // La galerie couverte d'une médersa : on y attend la leçon, on y lit ce qui
  // va se tenir. Depuis la v1.9 : les séances du point hebdo et les
  // rendez-vous — les ressources et le catalogue, eux, se lisent à la
  // bibliothèque. Tout vient de la base — le jeu n'écrit ni lien ni nom
  // (voir ressources.js, § le voile).
  // ⚠️ Une lecture encore en vol quand la salle se ferme ne doit pas
  //    repeupler le cache : on ne garde son résultat que si ce chargement
  //    est toujours LE chargement courant.
  function chargerRiwaq() {
    if (riwaq.lignes) return Promise.resolve(riwaq);
    if (!riwaq.chargement) {
      var moi = Promise.all([compte.lireRessources(), compte.lireSeances()]).then(function (r) {
        if (riwaq.chargement === moi) {
          riwaq.lignes = r[0] || [];
          riwaq.seances = r[1] || [];
          riwaq.chargement = null;
        }
        return riwaq;
      }).catch(function () {
        if (riwaq.chargement === moi) {
          riwaq.lignes = []; riwaq.seances = []; riwaq.chargement = null;
        }
        return riwaq;
      });
      riwaq.chargement = moi;
    }
    return riwaq.chargement;
  }

  function ouvrirRiwaq() {
    if (maisonSalleMuette("riwaq")) return;   // Bab — muette chez une maison
    var panneau = $("#zj-riwaq");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");   // la croix tactile laisse la place
    $("#zj-riwaq-corps").innerHTML = '<p class="zj-riwaq__vide">On regarde ce qui est affiché…</p>';
    var f = $("#zj-riwaq-fermer");
    if (f) f.focus();
    chargerRiwaq().then(rendreRiwaq);
    poserWird(Wd && Wd.marquerSalle(joueur.recit, "riwaq"));   // v3.6
  }

  function fermerRiwaq() {
    var panneau = $("#zj-riwaq");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    riwaq.lignes = null;   // relu à la prochaine ouverture : un lien change souvent
    riwaq.seances = [];
    riwaq.chargement = null;   // une lecture en vol ne repeuplera pas le cache
  }

  function rendreRiwaq() {
    var panneau = $("#zj-riwaq");
    if (!panneau || panneau.hidden) return;   // fermé pendant la lecture : rien à rendre
    var e = Rs.etat(riwaq.lignes), corps = $("#zj-riwaq-corps");
    var seances = Rs.seancesUtiles(riwaq.seances);
    if (!corps) return;
    // v1.9 : le Riwaq annonce les RENCONTRES ; les ressources et le catalogue
    // se lisent à la bibliothèque de la Khizana (les rayonnages, à l'ouest).
    if (!e.rendezvous.length && !seances.length) {
      corps.innerHTML = '<p class="zj-riwaq__vide">Aucune rencontre n\'est affichée pour l\'instant. De quoi apprendre ? Les rayonnages de la Khizana, à l\'ouest.</p>';
      return;
    }
    var html = "";

    if (seances.length) {
      html += '<h3 class="zj-riwaq__titre">Le point de la maison</h3><ul class="zj-riwaq__liste">';
      seances.forEach(function (s) {
        var et = Rs.etatSeance(s).etat;
        html += '<li class="zj-riwaq__item' + (et === "ouverte" ? " zj-riwaq__item--premier" : "") + '">' +
          '<div class="zj-riwaq__texte">' +
            '<strong>' + esc(s.titre) + (et === "validee" ? ' <span class="zj-riwaq__coche">☑ présence validée</span>' : '') + '</strong>' +
            '<span class="zj-riwaq__quand' + (et === "ouverte" ? " maintenant" : "") + '">' + esc(Rs.quandTexte(s.debut)) + '</span>' +
            (s.detail ? '<span class="zj-riwaq__detail">' + esc(s.detail) + '</span>' : '') +
            (et === "sans_mot" ? '<span class="zj-riwaq__detail">Le mot de passe de cette séance n\'a pas encore été posé.</span>' : '') +
            (et === "ouverte" ?
              '<form class="zj-presence" data-seance="' + esc(s.id) + '">' +
                '<label for="zj-mot-' + esc(s.id) + '">Le mot de passe dit en séance</label>' +
                '<div class="zj-presence__ligne">' +
                  '<input id="zj-mot-' + esc(s.id) + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60" placeholder="tape-le ici" />' +
                  '<button type="submit" class="zj-bouton">Valider (+' + (s.m39ol || 1) + ' M39ol)</button>' +
                '</div>' +
                '<p class="zj-presence__msg" aria-live="polite"></p>' +
              '</form>' : '') +
          '</div>' +
          ((s.lien && et !== "validee" && et !== "fermee") ?
            '<a class="zj-bouton' + (et === "ouverte" ? " zj-bouton--discret" : " zj-bouton--discret") + ' zj-riwaq__lien" href="' + esc(s.lien) + '" target="_blank" rel="noopener noreferrer">' + (et === "avenir" ? "Le lien" : "Rejoindre") + '</a>' : '') +
        '</li>';
      });
      html += '</ul>';
    }

    if (e.rendezvous.length) {
      html += '<h3 class="zj-riwaq__titre">Les rendez-vous</h3><ul class="zj-riwaq__liste">';
      e.rendezvous.forEach(function (r, i) {
        var ouvert = Rs.ouverte(r);
        html += '<li class="zj-riwaq__item' + (i === 0 ? " zj-riwaq__item--premier" : "") + '">' +
          '<div class="zj-riwaq__texte">' +
            '<strong>' + esc(r.titre) + '</strong>' +
            (r.quand ? '<span class="zj-riwaq__quand' + (ouvert ? " maintenant" : "") + '">' + esc(Rs.quandTexte(r.quand)) + '</span>' : '') +
            (r.detail ? '<span class="zj-riwaq__detail">' + esc(r.detail) + '</span>' : '') +
          '</div>' +
          (r.lien ? '<a class="zj-bouton zj-riwaq__lien" href="' + esc(r.lien) + '" target="_blank" rel="noopener noreferrer">' + (ouvert ? "Rejoindre" : "Le lien") + '</a>' : '') +
        '</li>';
      });
      html += '</ul>';
    }

    corps.innerHTML = html;

    Array.prototype.slice.call(corps.querySelectorAll(".zj-presence")).forEach(function (f) {
      f.addEventListener("submit", function (ev) { ev.preventDefault(); validerPresence(f); });
    });
  }

  // La présence : on envoie le mot au serveur, qui compare et crédite. Le mot
  // de passe n'est JAMAIS descendu jusqu'ici — sans quoi n'importe qui le
  // lirait avec la clé publique.
  function validerPresence(form) {
    var id = form.getAttribute("data-seance");
    var champ = form.querySelector("input");
    var bouton = form.querySelector("button");
    var msg = form.querySelector(".zj-presence__msg");
    var mot = champ ? champ.value : "";
    if (!mot.trim()) { msg.textContent = "Écris le mot de passe dit pendant la séance."; return; }
    bouton.disabled = true;
    msg.textContent = "On vérifie…";
    compte.validerPresence(id, mot).then(function (r) {
      bouton.disabled = false;
      if (!r || !r.ok) {
        msg.className = "zj-presence__msg ko";
        msg.textContent = (r && r.erreur) || "Ça n'a pas marché.";
        if (champ) champ.select();
        return;
      }
      msg.className = "zj-presence__msg ok";
      msg.textContent = r.deja ? "Ta présence était déjà validée." : "Présence validée. +" + (r.m39ol || 1) + " M39ol.";
      sonner("defi");
      // On relit le personnage : c'est le serveur qui a écrit le M39ol, pas nous.
      compte.lireJoueur().then(function (j) {
        // On recopie les trois champs que le SERVEUR vient d'écrire — sans
        // relancer la cour, qui rejouerait le prologue sous la salle ouverte.
        if (j) { joueur.m39ol = j.m39ol; joueur.presences = j.presences; joueur.rang = j.rang; rafraichirHud(); }
        riwaq.lignes = null; riwaq.seances = [];
        chargerRiwaq().then(rendreRiwaq);
      });
    });
  }

  // ---- LA BIBLIOTHÈQUE : les rayonnages de la Khizana ------------------------------------
  // Trois rayons (bibliotheque.js) : al-Moujam — le lexique du jeu, tenu dans
  // le code ; les ressources et le catalogue — tenus en base, comme au Riwaq
  // (aucun lien, aucun nom dans les fichiers servis). Un Talib libre ne
  // reçoit que les lignes `ouverte` : c'est la policy de la base qui filtre —
  // le rendu montre ce qui arrive, et rien d'autre.
  function chargerBiblio() {
    if (biblio.lignes) return Promise.resolve(biblio);
    if (!biblio.chargement) {
      // ⚠️ v7.3 — UN INVITÉ N'A PAS DE SESSION. La policy de `zawia_ressources`
      // est `lire [authenticated]` : `lireRessources` lui rend ZÉRO ligne, et la
      // porte « je veux apprendre » ouvrait une salle vide. Il passe donc par
      // `zawia_dyaf_rayons()`, la seule sortie vers lui — et qui ne rend que ce
      // que le bureau a coché (`aux_dyaf`, false par défaut).
      var lire = dayf.actif && typeof compte.lireRayonsDayf === "function"
        ? compte.lireRayonsDayf() : compte.lireRessources();
      var moi = lire.then(function (l) {
        if (biblio.chargement === moi) { biblio.lignes = l || []; biblio.chargement = null; }
        return biblio;
      }).catch(function () {
        if (biblio.chargement === moi) { biblio.lignes = []; biblio.chargement = null; }
        return biblio;
      });
      biblio.chargement = moi;
    }
    return biblio.chargement;
  }

  function ouvrirBibliotheque() {
    var panneau = $("#zj-bibliotheque");
    if (!panneau) return;
    // v5.3 — la Khizana enseigne Isnad au Rafiq : le mode social nourrit la quête
    if (Rf && Rh && joueur) {
      var eb = etatRihla();
      if (eb.rf && !Rf.connait(eb, "isnad")) { poserRihla(Rf.apprendre(eb, "isnad").e); annoncerRihla(Rf.lecon("La bibliothèque de la Khizana", "isnad")); }
    }
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");   // la croix tactile laisse la place
    $("#zj-bibliotheque-corps").innerHTML = '<p class="zj-riwaq__vide">On souffle sur la poussière…</p>';
    var f = $("#zj-bibliotheque-fermer");
    if (f) f.focus();
    chargerBiblio().then(rendreBibliotheque);
    tutorielEvenement("biblio");
  }

  function fermerBibliotheque() {
    var panneau = $("#zj-bibliotheque");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    biblio.lignes = null;   // relu à la prochaine ouverture : un rayon bouge
    biblio.chargement = null;
    libererTutoriel();
  }

  // ---- LE KOUNNACH (v6.0) : ce que la Sna3a ouvre -------------------------------------
  // Le carnet du m3ellem : des wasfat — des formules toutes prêtes, écrites
  // de bout en bout — que la Sna3a ouvre niveau par niveau, écrites par les
  // membres, publiées par le bureau (+80 M39ol, la ligne de la charte). La
  // LISTE (sans corps) se lit une fois par session et sert cinq endroits :
  // l'établi, le HUD, le Wird, le carnet, la bibliothèque. Le CORPS ne
  // descend que si la base le rend (zawia_wasfa, qui compte le niveau) — ici
  // on ne fait que le dire avant, comme chajara.js dit une porte fermée.
  function chargerKounnach() {
    if (!Kn) return Promise.resolve(kounnach);
    if (kounnach.lignes) return Promise.resolve(kounnach);
    if (!kounnach.chargement) {
      var moi = compte.lireKounnach().then(function (l) {
        if (kounnach.chargement === moi) { kounnach.lignes = l || []; kounnach.chargement = null; }
        return kounnach;
      }).catch(function () {
        if (kounnach.chargement === moi) { kounnach.lignes = []; kounnach.chargement = null; }
        return kounnach;
      });
      kounnach.chargement = moi;
    }
    return kounnach.chargement;
  }
  // v6.1 — la Sna3a du joueur, voie par voie : le déclaré (Ta7addi, pages du
  // golf) + l'attesté (les livrables des Masarat). Le Rafiq, le HUD et le
  // Kounnach lisent ce même nombre — celui que la base compte.
  function sna3aJoueur() { return R.sna3a(joueur && joueur.sna3a, joueur && joueur.sna3aAttestee).parVoie; }
  function luesKounnach() { return (joueur && joueur.recit && joueur.recit.kounnach && joueur.recit.kounnach.lues) || {}; }
  function etatKounnach() {
    if (!Kn || !joueur || !kounnach.lignes) return null;
    return Kn.etat(kounnach.lignes, R.sna3a(joueur.sna3a, joueur.sna3aAttestee).total, luesKounnach());
  }
  // le carnet : une ligne sous la Sna3a
  function kounnachCarnet() {
    var e = etatKounnach();
    if (!e || !e.publiees) return "";
    return "\nKounnach : " + e.ouvertes + " wasfat ouvertes sur " + e.publiees + ".";
  }
  // l'établi : ce que le point vient d'ouvrir — ou ce qui manque encore
  function annonceKounnach(avant) {
    if (!Kn || !joueur || !kounnach.lignes) return [];
    var t = Kn.annonce(avant, R.sna3a(joueur.sna3a, joueur.sna3aAttestee).total, kounnach.lignes);
    return t ? [t] : [];
  }
  function marquerWasfaLue(id) {
    if (!joueur || !id) return;
    var r = Rc.normaliserRecit(joueur.recit), k = r.kounnach || { lues: {} };
    k.lues = k.lues || {};
    if (k.lues[id] === true) return;
    k.lues[id] = true;
    r.kounnach = k;
    joueur.recit = Rc.normaliserRecit(r);
    sauvegarderJoueur();
  }
  // ouvrirKounnach({ id }) ouvre une wasfa ; ({ ecrire: true }) le formulaire.
  function ouvrirKounnach(opts) {
    if (maisonSalleMuette("kounnach")) return;   // Bab — muette chez une maison
    var panneau = $("#zj-kounnach");
    if (!panneau || !joueur) return;
    opts = opts || {};
    basculerMenu(false);
    fermerDialogue();
    fermerBibliotheque();
    fermerWird();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    kounnach.vue = opts.id ? { id: opts.id } : (opts.ecrire ? { ecrire: true } : null);
    $("#zj-kounnach-corps").innerHTML = '<p class="zj-riwaq__vide">On ouvre le carnet…</p>';
    var f = $("#zj-kounnach-fermer");
    if (f) f.focus();
    chargerKounnach().then(rendreKounnach);
  }
  function fermerKounnach() {
    var panneau = $("#zj-kounnach");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    kounnach.vue = null;
    kounnach.brouillon = null;
    // relu à la prochaine ouverture : une wasfa bouge (proposée, publiée) — et le HUD suit
    kounnach.lignes = null;
    kounnach.chargement = null;
    chargerKounnach().then(function () { rafraichirHud(); });
  }
  function ligneWasfa(w) {
    var niv = Kn.niveau(w.niveau), voie = R.voie(w.voie), total = R.sna3a(joueur.sna3a, joueur.sna3aAttestee).total;
    var meta = '<div class="zj-wasfa__meta"><p>' + esc(niv ? niv.nom : w.niveau) + '</p><p>' + esc(voie ? voie.nom : w.voie) + '</p>' +
      '<p>' + (w.auteur ? 'écrite par ' + esc(w.auteur) : 'la maison') + '</p>' + (w.servi ? '<p>appliquée par ' + w.servi + '</p>' : '') + '</div>';
    var action;
    if (w.mienne && w.etat !== "publiee") {
      action = '<span>' + (w.etat === "refusee" ? 'refusée — ' + esc(w.note || "sans un mot") : 'relue par le bureau') + '</span>' +
        '<button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-corriger="' + esc(w.id) + '">Corriger</button>';
    } else if (w.accessible) {
      action = '<button type="button" class="zj-bouton" data-wasfa-lire="' + esc(w.id) + '">Lire</button>' + (luesKounnach()[w.id] === true ? '<span>lue</span>' : '');
    } else {
      action = '<span>dès ' + esc(niv ? niv.nom : w.niveau) + ' — encore ' + Kn.manque(w, total) + ' Sna3a</span>' +
        '<button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-etabli="1">Aller à l\'établi</button>';
    }
    return '<li class="zj-wasfa' + (w.accessible || w.mienne ? '' : ' zj-wasfa--loin') + '"><div class="zj-wasfa__texte"><strong>' + esc(w.titre) + '</strong>' +
      (w.resume ? '<span class="zj-wasfa__resume">' + esc(w.resume) + '</span>' : '') + meta + '</div><div class="zj-wasfa__action">' + action + '</div></li>';
  }
  function rendreKounnach() {
    var panneau = $("#zj-kounnach");
    if (!panneau || panneau.hidden) return;
    var corps = $("#zj-kounnach-corps");
    if (!corps) return;
    var vue = kounnach.vue;
    if (vue && vue.id) { rendreWasfa(vue.id); return; }
    if (vue && vue.ecrire) { rendreFormulaireWasfa(vue.wasfa || null, vue.erreur || null); return; }
    var e = etatKounnach(), total = R.sna3a(joueur.sna3a, joueur.sna3aAttestee).total, niv = Kn.niveauPour(total);
    var html = "";
    if (!e || !e.publiees) {
      html += '<p class="zj-riwaq__vide">' + (lignee.maison ? "Le Kounnach est vide pour l'instant — la maison y écrit ses premières wasfat." : "Rien d'ouvert pour l'instant sur ce rayon ; le reste attend les gens de la maison.") + '</p>';
    } else {
      // ⚠️ chaque morceau dans son <p> : langue.js traduit une feuille d'un bloc
      html += '<div class="zj-kounnach__compte"><p><strong>' + e.ouvertes + ' sur ' + e.publiees + '</strong></p><p>Sna3a ' + total + ' — <strong>' + esc(niv.nom) + '</strong>, ' + esc(niv.sous) + '</p>' +
        (e.prochaine ? '<p>Encore ' + e.prochaine.manque + ' pour ' + esc(Kn.niveau(e.prochaine.niveau).nom) + ', qui ouvre « ' + esc(e.prochaine.titre) + ' ».</p>' : "<p>Le Kounnach t'est ouvert en entier.</p>") + '</div>';
      html += '<ul class="zj-kounnach__liste">' + e.wasfat.filter(function (w) { return w.etat === "publiee"; }).map(ligneWasfa).join("") + '</ul>';
    }
    var miennes = e ? e.miennes.filter(function (w) { return w.etat !== "publiee"; }) : [];
    if (miennes.length) html += '<h3 class="zj-majliss__titre">Mes wasfat</h3><ul class="zj-kounnach__liste">' + miennes.map(ligneWasfa).join("") + '</ul>';
    html += '<div class="zj-wasfa__pied"><button type="button" class="zj-bouton" data-wasfa-ecrire="1">Proposer une wasfa</button>' +
      '<span class="zj-riwaq__detail">Le bureau la relit. Publiée, elle porte ton nom — et ' + Kn.M39OL_WASFA + ' M39ol, donnés par la maison.</span></div>';
    corps.innerHTML = html;
    brancherKounnach();
  }
  function rendreWasfa(id) {
    var corps = $("#zj-kounnach-corps");
    corps.innerHTML = '<p class="zj-riwaq__vide">On tourne la page…</p>';
    compte.lireWasfa(id).then(function (r) {
      var panneau = $("#zj-kounnach");
      if (!panneau || panneau.hidden || !kounnach.vue || kounnach.vue.id !== id) return;
      if (!r || !r.ok) {
        corps.innerHTML = '<div class="zj-wasfa__page"><p class="zj-riwaq__vide">' + esc((r && r.erreur) || "Ça n'a pas tenu.") + '</p>' +
          '<div class="zj-wasfa__pied"><button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-retour="1">Retour au Kounnach</button>' +
          (r && r.niveau ? '<button type="button" class="zj-bouton" data-wasfa-etabli="1">Aller à l\'établi</button>' : "") + '</div></div>';
        brancherKounnach();
        return;
      }
      var wn = null;
      (kounnach.lignes || []).forEach(function (l) { if (l.id === id) wn = Kn.normaliser([l])[0] || null; });
      var html = '<div class="zj-wasfa__page">' +
        '<div><button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-retour="1">Retour au Kounnach</button></div>' +
        (wn ? '<div class="zj-wasfa__meta"><p>' + esc(Kn.niveau(wn.niveau).nom) + '</p><p>' + esc((R.voie(wn.voie) || {}).nom || wn.voie) + '</p><p>' + (wn.auteur ? 'écrite par ' + esc(wn.auteur) : 'la maison') + '</p></div>' : "") +
        Kn.rendre(r.corps) +
        (r.lien && Kn.lienSur(r.lien) ? '<p><a class="zj-bouton zj-bouton--discret" href="' + esc(r.lien) + '" target="_blank" rel="noopener noreferrer">Le fichier de la wasfa</a></p>' : "") +
        // « pour aller plus loin » : une ligne du catalogue, choisie par le bureau — dans la Khizana, jamais ailleurs
        (wn && wn.plusLoin ? '<p class="zj-wasfa__plusloin">Pour aller plus loin : <a href="' + esc(wn.plusLoin.lien) + '" target="_blank" rel="noopener noreferrer">' + esc(wn.plusLoin.titre) + '</a></p>' : "") +
        '<div class="zj-wasfa__pied">' +
          (r.mienne ? '<span class="zj-riwaq__detail">C\'est la tienne.</span>'
            : '<button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-servi="' + esc(id) + '" aria-pressed="' + (r.moi_servi ? "true" : "false") + '">' + (r.moi_servi ? "☑ Ça m'a servi" : "Ça m'a servi") + '</button>') +
          '<span class="zj-riwaq__detail" data-wasfa-compte="1">' + (r.servi ? 'appliquée par ' + r.servi : "personne ne l'a encore appliquée") + '</span>' +
        '</div></div>';
      corps.innerHTML = html;
      // un bouton Copier sur chaque bloc de code : une formule toute prête se copie
      $$("#zj-kounnach-corps pre.zj-wasfa__code").forEach(function (pre) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "zj-wasfa__copier"; b.textContent = "Copier";
        b.addEventListener("click", function () {
          var code = pre.querySelector("code"), t = code ? code.textContent : pre.textContent;
          var fini = function () { b.textContent = "Copié"; setTimeout(function () { b.textContent = "Copier"; }, 1600); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fini, fini); else fini();
        });
        pre.appendChild(b);
      });
      brancherKounnach();
      marquerWasfaLue(id);
      rafraichirHud();
    });
  }
  function rendreFormulaireWasfa(w, erreur) {
    var corps = $("#zj-kounnach-corps"), b = kounnach.brouillon || {};
    var v = {
      id: w ? w.id : (b.id || null),
      titre: b.titre != null ? b.titre : (w ? w.titre : ""),
      resume: b.resume != null ? b.resume : (w ? w.resume : ""),
      voie: b.voie || (w ? w.voie : "prompt"),
      corps: b.corps != null ? b.corps : "",
      lien: b.lien != null ? b.lien : ""
    };
    var options = R.VOIES.map(function (x) { return '<option value="' + x.cle + '"' + (v.voie === x.cle ? " selected" : "") + '>' + esc(x.nom) + '</option>'; }).join("");
    corps.innerHTML = '<form class="zj-wasfa__form" id="zj-wasfa-form" novalidate>' +
      '<p class="zj-riwaq__detail">' + (w ? "Corrige, puis repropose : le bureau relit." : "Une formule toute prête, écrite de bout en bout : ce que ça règle, ce qu'il faut, les étapes, le piège. En markdown — titres #, listes -, code entre ```. Colle ce que tu as écrit ailleurs.") + '</p>' +
      '<label><span>Titre</span><input id="zj-wasfa-titre" type="text" maxlength="' + Kn.LIMITES.titre + '" value="' + esc(v.titre) + '" /></label>' +
      '<label><span>Résumé — ce que ça règle, en une phrase</span><input id="zj-wasfa-resume" type="text" maxlength="' + Kn.LIMITES.resume + '" value="' + esc(v.resume) + '" /></label>' +
      '<div class="zj-wasfa__deux"><label><span>La voie</span><select id="zj-wasfa-voie">' + options + '</select></label>' +
      '<label><span>Un lien (https:// — ou rien)</span><input id="zj-wasfa-lien" type="text" maxlength="' + Kn.LIMITES.lien + '" value="' + esc(v.lien) + '" placeholder="https://…" /></label></div>' +
      '<label><span>Le corps</span><textarea id="zj-wasfa-corps" maxlength="' + Kn.LIMITES.corps + '">' + esc(v.corps) + '</textarea></label>' +
      (erreur ? '<p class="zj-riwaq__vide">' + esc(erreur) + '</p>' : "") +
      '<div class="zj-wasfa__pied"><button type="submit" class="zj-bouton">' + (w ? "Reproposer" : "Proposer au bureau") + '</button>' +
      '<button type="button" class="zj-bouton zj-bouton--discret" data-wasfa-retour="1">Annuler</button></div></form>';
    brancherKounnach();
    var form = $("#zj-wasfa-form");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var val = { id: v.id, titre: $("#zj-wasfa-titre").value, resume: $("#zj-wasfa-resume").value, voie: $("#zj-wasfa-voie").value, corps: $("#zj-wasfa-corps").value, lien: $("#zj-wasfa-lien").value };
      kounnach.brouillon = val;   // un refus ne vide pas les cases (la leçon du Souk)
      var ok = Kn.validerProposition(val);
      if (!ok.ok) { kounnach.vue = { ecrire: true, wasfa: w, erreur: ok.erreur }; rendreKounnach(); return; }
      var envoi = form.querySelector('button[type="submit"]');
      if (envoi) envoi.disabled = true;
      compte.proposerWasfa(Object.assign({ id: v.id }, ok.valeurs)).then(function (r) {
        if (!r || !r.ok) { kounnach.vue = { ecrire: true, wasfa: w, erreur: (r && r.erreur) || "Ça n'a pas tenu." }; rendreKounnach(); return; }
        kounnach.brouillon = null; kounnach.vue = null; kounnach.lignes = null; kounnach.chargement = null;
        chargerKounnach().then(function () {
          rendreKounnach();
          ouvrirDialogue({ nom: "Le Kounnach", pages: ["Ta wasfa est posée. Le bureau la relit — publiée, elle portera ton nom, et la maison te donnera " + Kn.M39OL_WASFA + " M39ol."] });
        });
      });
    });
  }
  function brancherKounnach() {
    $$("#zj-kounnach-corps [data-wasfa-lire]").forEach(function (b) { b.addEventListener("click", function () { kounnach.vue = { id: b.getAttribute("data-wasfa-lire") }; rendreKounnach(); }); });
    $$("#zj-kounnach-corps [data-wasfa-retour]").forEach(function (b) { b.addEventListener("click", function () { kounnach.vue = null; kounnach.brouillon = null; rendreKounnach(); }); });
    $$("#zj-kounnach-corps [data-wasfa-ecrire]").forEach(function (b) { b.addEventListener("click", function () { kounnach.brouillon = null; kounnach.vue = { ecrire: true }; rendreKounnach(); }); });
    // « Aller à l'établi » : le fil d'or jusqu'à la tuile E — le point mène à la wasfa
    $$("#zj-kounnach-corps [data-wasfa-etabli]").forEach(function (b) { b.addEventListener("click", function () {
      fermerKounnach();
      if (rihla.active) sortirRihla();
      guide.tuile = "E"; guide.fil = null; guide.deTuile = ""; guide.jeu = false;
    }); });
    $$("#zj-kounnach-corps [data-wasfa-corriger]").forEach(function (b) { b.addEventListener("click", function () {
      var id = b.getAttribute("data-wasfa-corriger"), w = null;
      (kounnach.lignes || []).forEach(function (l) { if (l.id === id) w = Kn.normaliser([l])[0] || null; });
      compte.lireWasfa(id).then(function (r) {
        kounnach.brouillon = { id: id, titre: w ? w.titre : "", resume: w ? w.resume : "", voie: w ? w.voie : "prompt", corps: r && r.ok ? r.corps : "", lien: r && r.ok && r.lien ? r.lien : "" };
        kounnach.vue = { ecrire: true, wasfa: w };
        rendreKounnach();
      });
    }); });
    $$("#zj-kounnach-corps [data-wasfa-servi]").forEach(function (b) { b.addEventListener("click", function () {
      var id = b.getAttribute("data-wasfa-servi"), deja = b.getAttribute("aria-pressed") === "true";
      b.disabled = true;
      compte.servirWasfa(id, !deja).then(function (r) {
        b.disabled = false;
        if (!r || !r.ok) { ouvrirDialogue({ nom: "Le Kounnach", pages: [(r && r.erreur) || "Ça n'a pas tenu."] }); return; }
        b.setAttribute("aria-pressed", r.moi_servi ? "true" : "false");
        b.textContent = r.moi_servi ? "☑ Ça m'a servi" : "Ça m'a servi";
        var c = $("#zj-kounnach-corps [data-wasfa-compte]");
        if (c) c.textContent = r.servi ? "appliquée par " + r.servi : "personne ne l'a encore appliquée";
        (kounnach.lignes || []).forEach(function (l) { if (l.id === id) l.servi = r.servi; });
      });
    }); });
  }

  // ---- v6.1 — LES MASARAT : les parcours à livrable ------------------------------------
  // La base tient tout (zawia-masarat.sql) : ouverte, accessible, le brief, le
  // livrable, l'attestation. Ici : le panneau. Les formations du joueur sont
  // recopiées du CRM par la fonction Netlify avant chaque lecture (elle borne sa
  // fréquence elle-même) ; la ligne du joueur est relue pour que la Sna3a
  // attestée entre au HUD dès que le bureau a attesté.
  function ouvrirMasarat(opts) {
    if (ZWJ.maison && ZWJ.maison.salleMuette && ZWJ.maison.salleMuette("masarat")) { if (opts && opts.etabli) ouvrirEtabli(); return; }   // Bab — pas de parcours : l'établi, ce sont les défis
    var panneau = $("#zj-masarat");
    if (!panneau || !joueur || !Ms) return;
    opts = opts || {};
    basculerMenu(false);
    fermerDialogue();
    fermerBibliotheque();
    fermerKounnach();
    fermerWird();
    fermerMaharat();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    masarat.vue = opts.id ? { id: opts.id } : null;
    masarat.brouillon = null;
    masarat.depuisEtabli = !!opts.etabli;
    $("#zj-masarat-corps").innerHTML = '<p class="zj-riwaq__vide">On déroule les parcours…</p>';
    var f = $("#zj-masarat-fermer");
    if (f) f.focus();
    chargerMasarat().then(rendreMasarat);
  }
  function chargerMasarat() {
    var formations = compte.rafraichirFormations ? compte.rafraichirFormations().catch(function () { return null; }) : Promise.resolve(null);
    return formations.then(function () {
      var ligne = compte.lireJoueur().then(function (j) {
        if (j && joueur) { joueur.sna3aAttestee = j.sna3aAttestee || {}; rafraichirHud(); }
      }).catch(function () {});
      return Promise.all([compte.lireMasarat(), ligne]);
    }).then(function (r) { masarat.donnees = Ms.normaliser(r[0]); return masarat.donnees; })
      .catch(function () { masarat.donnees = Ms.normaliser(null); return masarat.donnees; });
  }
  function fermerMasarat() {
    var panneau = $("#zj-masarat");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    masarat.vue = null;
    masarat.brouillon = null;
  }
  function ligneEtape(e) {
    var s = Ms.etat(e), voie = R.voie(e.voie);
    var meta = '<div class="zj-wasfa__meta"><p>Étape ' + e.position + '</p><p>' + esc(voie ? voie.nom : e.voie) + '</p>' +
      (e.dureeMin ? '<p>' + e.dureeMin + ' min</p>' : '') + '</div>';
    var action;
    if (Ms.peutOuvrir(e)) {
      action = '<button type="button" class="zj-bouton' + (s === "attestee" ? ' zj-bouton--discret' : '') + '" data-etape-ouvrir="' + esc(e.id) + '">Ouvrir</button>' +
        '<span>' + esc(Ms.ETATS[s]) + (s === "attestee" ? ' · +' + Ms.SNA3A_ETAPE + ' Sna3a' : '') + '</span>';
    } else {
      action = '<span>' + esc(Ms.ouvrePar(e)) + '</span>' +
        (e.plusLoin ? '<a class="zj-bouton zj-bouton--discret" href="' + esc(e.plusLoin.lien) + '" target="_blank" rel="noopener noreferrer">' + esc(e.plusLoin.titre) + '</a>' : '');
    }
    return '<li class="zj-wasfa zj-etape zj-etape--' + s + (Ms.peutOuvrir(e) ? '' : ' zj-wasfa--loin') + '"><div class="zj-wasfa__texte"><strong>' + esc(e.titre) + '</strong>' +
      (e.resume ? '<span class="zj-wasfa__resume">' + esc(e.resume) + '</span>' : '') + meta + '</div><div class="zj-wasfa__action">' + action + '</div></li>';
  }
  function rendreMasarat() {
    var panneau = $("#zj-masarat");
    if (!panneau || panneau.hidden) return;
    var corps = $("#zj-masarat-corps");
    if (!corps) return;
    if (masarat.vue && masarat.vue.id) { rendreEtapeMasar(masarat.vue.id); return; }
    var d = masarat.donnees || Ms.normaliser(null), html = "";
    // Les seize Ta7addi QCM de l'établi : un bouton, pour qui en a la porte.
    if (masarat.depuisEtabli) {
      html += Cj.peut(lignee.maison, "etabli")
        ? '<div class="zj-masar__qcm"><p>Seul, le soir : un Ta7addi de la maison, corrigé par le jeu.</p><button type="button" class="zj-bouton zj-bouton--discret" data-masar-qcm="1">Un Ta7addi de la maison</button></div>'
        : '<div class="zj-masar__qcm"><p>Les seize Ta7addi de l\'établi sont aux gens de la maison. Les Masarat, eux, t\'ouvrent leur première étape.</p></div>';
    }
    if (!d.ok) {
      html += '<p class="zj-riwaq__vide">' + esc(d.erreur || "Les Masarat ne répondent pas.") + '</p>';
    } else if (!d.masarat.length) {
      html += '<p class="zj-riwaq__vide">Aucun masar n\'est encore ouvert — la maison les pose.</p>';
    } else {
      var b = Ms.bilan(d.masarat), sn = R.sna3a(joueur.sna3a, joueur.sna3aAttestee);
      // ⚠️ chaque morceau dans son <p> : langue.js traduit une feuille d'un bloc
      html += '<div class="zj-kounnach__compte"><p><strong>' + b.attestees + ' sur ' + b.total + '</strong></p><p>étapes attestées</p>' +
        '<p>Sna3a ' + sn.total + ' — <strong>' + esc(sn.niveau.nom) + '</strong></p>' +
        (b.ijazat ? '<p>Ijazat : <strong>' + b.ijazat + '</strong></p>' : '') + '</div>';
      d.masarat.forEach(function (m) {
        var pr = Ms.progression(m);
        html += '<section class="zj-masar"><div class="zj-masar__tete"><h3>' + esc(m.titre) + '</h3>' +
          (m.ijaza ? '<p class="zj-masar__ijaza">Ijaza</p>' : '<p class="zj-masar__prog">' + pr.attestees + ' sur ' + pr.total + '</p>') + '</div>' +
          (m.resume ? '<p class="zj-riwaq__detail">' + esc(m.resume) + '</p>' : '') +
          '<ol class="zj-kounnach__liste">' + m.etapes.map(ligneEtape).join("") + '</ol></section>';
      });
    }
    html += '<p class="zj-riwaq__detail zj-masar__note">Une étape se prouve par un vrai livrable : le bureau le relit contre la grille, et l\'atteste. Tes formations sont lues avec l\'adresse de ton compte de jeu.</p>';
    corps.innerHTML = html;
    brancherMasarat();
  }
  function rendreEtapeMasar(id) {
    var corps = $("#zj-masarat-corps");
    corps.innerHTML = '<p class="zj-riwaq__vide">On ouvre l\'étape…</p>';
    compte.lireEtape(id).then(function (r) {
      var panneau = $("#zj-masarat");
      if (!panneau || panneau.hidden || !masarat.vue || masarat.vue.id !== id) return;
      var retour = '<div><button type="button" class="zj-bouton zj-bouton--discret" data-masar-retour="1">Retour aux Masarat</button></div>';
      if (!r || !r.ok) {
        corps.innerHTML = '<div class="zj-wasfa__page">' + retour + '<p class="zj-riwaq__vide">' + esc((r && r.erreur) || "Ça n'a pas tenu.") + '</p></div>';
        brancherMasarat();
        return;
      }
      var voie = R.voie(r.voie), liv = r.livrable || null, b = masarat.brouillon || {};
      var s = liv ? (liv.etat === "atteste" ? "attestee" : liv.etat === "a_revoir" ? "a_revoir" : "remise") : null;
      var v = { lien: b.lien != null ? b.lien : (liv ? liv.lien : ""), regle: b.regle != null ? b.regle : (liv ? liv.regle : ""),
                ia: b.ia != null ? b.ia : (liv ? liv.ia : ""), main: b.main != null ? b.main : (liv ? liv.main : "") };
      var grille = (Array.isArray(r.grille) ? r.grille : []).map(function (g) { return '<li>' + esc(g) + '</li>'; }).join("");
      var html = '<div class="zj-wasfa__page">' + retour +
        '<h3>' + esc(r.titre) + '</h3>' +
        '<div class="zj-wasfa__meta"><p>' + esc(voie ? voie.nom : r.voie) + '</p>' + (r.duree_min ? '<p>' + r.duree_min + ' min</p>' : '') + '<p>+' + Ms.SNA3A_ETAPE + ' Sna3a, attestée</p></div>' +
        // le brief porte ses propres intertitres (« Ce que tu construis », « Les pièges »…)
        Kn.rendre(r.brief || "") +
        '<h4>La grille</h4><ul class="zj-masar__grille">' + grille + '</ul>' +
        (r.livrable_attendu ? '<h4>Ce que tu remets</h4><p>' + esc(r.livrable_attendu) + '</p>' : '') +
        ((r.wasfa && r.wasfa.id) || r.ou_apprendre ? '<h4>Pour apprendre</h4>' +
          (r.ou_apprendre ? '<p>Dans ta formation : ' + esc(r.ou_apprendre) + '</p>' : '') +
          (r.wasfa && r.wasfa.id ? '<p><button type="button" class="zj-bouton zj-bouton--discret" data-masar-wasfa="' + esc(r.wasfa.id) + '">Lire la wasfa</button></p>' : '') : '');
      if (s === "attestee") {
        html += '<div class="zj-masar__etat zj-masar__etat--attestee"><p><strong>Attestée</strong> · +' + Ms.SNA3A_ETAPE + ' Sna3a</p>' +
          (liv.note_bureau ? '<p>' + esc(liv.note_bureau) + '</p>' : '') + '<p><a href="' + esc(liv.lien) + '" target="_blank" rel="noopener noreferrer">Ton livrable</a></p></div>';
      } else {
        if (s === "a_revoir") html += '<div class="zj-masar__etat zj-masar__etat--revoir"><p><strong>À revoir</strong></p><p>' + esc(liv.note_bureau || "") + '</p></div>';
        if (s === "remise") html += '<div class="zj-masar__etat"><p><strong>Remise</strong> — le bureau la relit contre la grille.</p></div>';
        html += '<h4>' + (liv ? 'Corriger et remettre' : 'Remettre') + '</h4><div class="zj-wasfa__form">' +
          '<label><span>Le lien du livrable (https://)</span><input id="zj-livrable-lien" type="text" inputmode="url" maxlength="' + Ms.LIMITES.lien + '" value="' + esc(v.lien) + '" placeholder="https://…" /></label>' +
          Ms.LIGNES.map(function (l) {
            return '<label><span>' + esc(l.nom) + '</span><input id="zj-livrable-' + l.cle + '" type="text" maxlength="' + Ms.LIMITES.ligne + '" value="' + esc(v[l.cle]) + '" /></label>';
          }).join("") +
          '<p id="zj-livrable-msg" class="zj-question__msg" aria-live="polite"></p>' +
          '<div class="zj-wasfa__pied"><button type="button" class="zj-bouton" data-masar-livrer="' + esc(id) + '">' + (liv ? 'Remettre à nouveau' : 'Remettre') + '</button>' +
          '<span class="zj-riwaq__detail">Attestée, elle vaut ' + Ms.SNA3A_ETAPE + ' Sna3a.</span></div></div>';
      }
      html += '</div>';
      corps.innerHTML = html;
      ajouterCopier("#zj-masarat-corps");
      brancherMasarat();
    });
  }
  // Un bouton Copier sur chaque bloc de code d'un brief : une commande se copie.
  function ajouterCopier(racine) {
    $$(racine + " pre.zj-wasfa__code").forEach(function (pre) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "zj-wasfa__copier"; b.textContent = "Copier";
      b.addEventListener("click", function () {
        var code = pre.querySelector("code"), t = code ? code.textContent : pre.textContent;
        var fini = function () { b.textContent = "Copié"; setTimeout(function () { b.textContent = "Copier"; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fini, fini); else fini();
      });
      pre.appendChild(b);
    });
  }
  function brancherMasarat() {
    $$("#zj-masarat-corps [data-etape-ouvrir]").forEach(function (b) { b.addEventListener("click", function () { masarat.brouillon = null; masarat.vue = { id: b.getAttribute("data-etape-ouvrir") }; rendreMasarat(); }); });
    $$("#zj-masarat-corps [data-masar-retour]").forEach(function (b) { b.addEventListener("click", function () { masarat.vue = null; masarat.brouillon = null; chargerMasarat().then(rendreMasarat); }); });
    $$("#zj-masarat-corps [data-masar-qcm]").forEach(function (b) { b.addEventListener("click", function () { fermerMasarat(); ouvrirEtabli(); }); });
    $$("#zj-masarat-corps [data-masar-wasfa]").forEach(function (b) { b.addEventListener("click", function () { var w = b.getAttribute("data-masar-wasfa"); fermerMasarat(); ouvrirKounnach({ id: w }); }); });
    $$("#zj-masarat-corps [data-masar-livrer]").forEach(function (b) { b.addEventListener("click", function () {
      var id = b.getAttribute("data-masar-livrer"), msg = $("#zj-livrable-msg");
      var v = { lien: ($("#zj-livrable-lien") || {}).value, regle: ($("#zj-livrable-regle") || {}).value, ia: ($("#zj-livrable-ia") || {}).value, main: ($("#zj-livrable-main") || {}).value };
      masarat.brouillon = v;   // un refus ne vide jamais les cases (la leçon du Souk)
      var ok = Ms.validerLivrable(v);
      if (!ok.ok) { if (msg) msg.textContent = ok.erreur; sonner("faux"); return; }
      b.disabled = true;
      compte.livrer(id, ok.valeurs).then(function (r) {
        b.disabled = false;
        if (!r || !r.ok) { if (msg) msg.textContent = (r && r.erreur) || "Ça n'a pas tenu. Réessaie."; sonner("faux"); return; }
        masarat.brouillon = null;
        sonner("defi");
        rendreMasarat();
      });
    }); });
  }

  // ---- v7.8 — LES MAHARAT : le catalogue des gestes, et l'Ijaza de la Zawia ----------
  // maharat.js porte le catalogue et COMPTE ; la base tient ce qui est prouvé
  // (une étape attestée, le bureau, la maison à l'entrée) et ce qui est appris
  // (déduit d'une formation) — zawia-maharat.sql. Ici : le panneau, rien d'autre.
  // Aucun point, aucun rang, jamais au HUD. Un invité voit le catalogue entier,
  // tout « à acquérir », sans qu'on appelle la base pour lui.
  function ouvrirMaharat() {
    var panneau = $("#zj-maharat");
    if (!panneau || !joueur || !Mh) return;
    basculerMenu(false);
    fermerDialogue();
    fermerBibliotheque();
    fermerKounnach();
    fermerWird();
    fermerMasarat();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    $("#zj-maharat-corps").innerHTML = '<p class="zj-riwaq__vide">On relit tes maharat…</p>';
    var f = $("#zj-maharat-fermer");
    if (f) f.focus();
    chargerMaharat().then(rendreMaharat);
  }
  function chargerMaharat() {
    if (dayf.actif || !compte || typeof compte.lireMaharat !== "function") {
      maharat.donnees = { ok: true, invite: true, maison: false, prouvees: [], apprises: [], ponts: [] };
      return Promise.resolve(maharat.donnees);
    }
    return compte.lireMaharat().then(function (r) { maharat.donnees = r || { ok: false }; return maharat.donnees; })
      .catch(function () { maharat.donnees = { ok: false }; return maharat.donnees; });
  }
  function fermerMaharat() {
    var panneau = $("#zj-maharat");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function sourceMahara(src) {
    return src === "etape" ? "par une étape attestée" : src === "fondateur" ? "reconnue par la maison" : "par le bureau";
  }
  function dateMahara(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
  }
  // Ce qui manque au diplôme, en mots — chaque ligne a son gabarit arabe.
  function manqueMahara(m) {
    if (m.quoi === "socle") return m.n + (m.n > 1 ? " maharat du socle" : " mahara du socle");
    if (m.quoi === "amana") return m.n + " de l'amana";
    if (m.quoi === "ijazat") return m.n + (m.n > 1 ? " ijazat de terrain" : " ijaza de terrain");
    return "une mahara de Silsila (transmettre)";
  }
  function rendreMaharat() {
    var panneau = $("#zj-maharat");
    if (!panneau || panneau.hidden) return;
    var corps = $("#zj-maharat-corps");
    if (!corps) return;
    var d = maharat.donnees || { ok: false };
    if (!d.ok) {
      corps.innerHTML = '<p class="zj-riwaq__vide">' + esc(d.erreur || "Les maharat ne répondent pas.") + '</p>';
      return;
    }
    // En page arabe, le catalogue se lit dans SA langue (le dictionnaire ne
    // porte pas les cent onze noms) ; le reste du panneau, langue.js le traduit.
    var ar = !!(Lg && Lg.estAr()), mien = Mh.normaliser(d), b = Mh.bilan(d), pro = Mh.prochaine(d), html = "";
    var pontsPar = {};
    (Array.isArray(d.ponts) ? d.ponts : []).forEach(function (p) { if (p && p.mahara) pontsPar[p.mahara] = p; });
    function nomDom(dm) { return ar ? dm.ar : dm.nom; }

    // 1. la carte du diplôme — ⚠️ chaque morceau dans son <p> : langue.js traduit une feuille d'un bloc
    html += '<div class="zj-maharat__diplome' + (b.diplome ? ' zj-maharat__diplome--obtenue' : '') + '">' +
      '<p class="zj-kicker">L\'Ijaza de la Zawia</p>';
    if (b.diplome) {
      html += '<p class="zj-maharat__obtenue">Obtenue</p>';
    } else {
      html += '<p class="zj-maharat__manque-titre">Il manque encore :</p><ul class="zj-maharat__manque">' +
        b.manque.map(function (m) { return '<li>' + esc(manqueMahara(m)) + '</li>'; }).join("") + '</ul>';
    }
    html += '<div class="zj-kounnach__compte"><p>Prouvées : ' + b.prouvees + '</p><p>Apprises : ' + b.apprises + '</p><p>sur ' + b.total + '</p>' +
      (b.ijazat.length ? '<p>Ijazat : ' + esc(b.ijazat.map(function (c) { return nomDom(Mh.domaine(c)); }).join(", ")) + '</p>' : '') + '</div>';
    if (pro) html += '<p class="zj-maharat__prochaine">Prochaine à viser : ' + esc(ar ? pro.ar : pro.nom) + '</p>';
    if (!d.invite) html += '<div class="zj-wird__actions"><button type="button" class="zj-bouton zj-bouton--discret" id="zj-maharat-carte">Ma carte de l\'Ijaza</button></div>';
    if (d.invite) html += '<p class="zj-riwaq__detail">Un invité regarde le catalogue : tout est à acquérir. On prouve une mahara en entrant dans la maison — un livrable, relu par le bureau.</p>';
    html += '</div>';

    // 2. un volet par terrain, dans l'ordre des DOMAINES
    Mh.DOMAINES.forEach(function (dm) {
      var bd = b.parCle[dm.cle], liste = Mh.parDomaine(dm.cle);
      var ij = '';
      if (!dm.transversal) {
        if (bd.ijaza) ij = '<span class="zj-maharat__ij zj-maharat__ij--oui">Ijaza : obtenue</span>';
        else {
          if (bd.manque) ij += '<span class="zj-maharat__ij">' + bd.manque + ' de plus pour l\'ijaza</span>';
          if (bd.manqueHaut) ij += '<span class="zj-maharat__ij">dont une de niveau 7adeq</span>';
        }
      }
      var nom = ar ? '<span class="zj-maharat__dom-nom" lang="ar">' + esc(dm.ar) + '</span>'
                   : '<span class="zj-maharat__dom-nom" translate="no">' + esc(dm.nom) + ' <span class="ar" lang="ar" dir="rtl">' + esc(dm.ar) + '</span></span>';   // Bab : le nom ne s'avale pas avec le compte
      html += '<details class="zj-maharat__dom"' + (bd.prouvees || bd.apprises ? ' open' : '') + '><summary>' + nom +
        '<span class="zj-maharat__dom-compte">' + bd.prouvees + ' / ' + bd.total + '</span>' + ij + '</summary><ul class="zj-maharat__liste">';
      liste.forEach(function (x) {
        var e = Mh.etat(x.cle, mien), p = mien.prouvees[x.cle], pont = pontsPar[x.cle], nv = Mh.niveau(x.niveau), g = Mh.geste(x.geste);
        html += '<li class="zj-maharat__ligne zj-maharat__ligne--' + e + '">' +
          '<span class="zj-maharat__marque" aria-hidden="true"></span>' +
          '<div class="zj-maharat__texte">' +
          '<p class="zj-maharat__nom"' + (ar ? ' lang="ar"' : '') + '>' + esc(ar ? x.ar : x.nom) + '</p>' +
          '<p class="zj-maharat__meta"><span class="zj-maharat__niveau">' + esc(nv ? (ar ? nv.ar : nv.nom) : x.niveau) + '</span>' +
            '<span>' + esc(g ? (ar ? g.ar : g.nom) : x.geste) + '</span>' +
            '<span class="zj-maharat__etat">' + esc(ar ? Mh.ETATS_AR[e] : Mh.ETATS[e]) + '</span></p>' +
          '<p class="zj-maharat__preuve">Ce qui la prouve : ' + esc(ar ? x.ar_preuve : x.preuve) + '</p>';
        if (e === "prouvee") {
          var quand = dateMahara(p.le);
          html += '<p class="zj-maharat__quand">' + (quand ? 'Prouvée le ' + esc(quand) + ' — ' : 'Prouvée — ') + sourceMahara(p.source) + '</p>';
          if (p.note) html += '<p class="zj-riwaq__detail">' + esc(p.note) + '</p>';
          // ⚠️ l'ancre est un bloc à elle seule, jamais seule dans un <p> : langue.js
          //    remplacerait le texte du <p> entier et le lien disparaîtrait en arabe
          if (p.preuve) html += '<a class="zj-maharat__lien" href="' + esc(p.preuve) + '" target="_blank" rel="noopener noreferrer">Voir la preuve</a>';
        } else if (e === "apprise") {
          html += '<p class="zj-maharat__quand">Apprise — reste à prouver</p>';
        }
        if (pont) {
          if (Array.isArray(pont.formations) && pont.formations.length) {
            // v8.1 — OÙ L'ON APPREND. Nommer une formation sans y mener était du texte
            // mort : le titre devient un bouton qui ouvre la QISSARIA sur sa vitrine —
            // on reste dans la maison, et c'est la fiche qui porte le lien de sortie.
            // ⚠️ Sans vitrine (un pré-requis offert n'est pas une offre), le titre reste
            //    du TEXTE : ni bouton mort, ni lien vide. Et si la base rend encore
            //    l'ancien format — une chaîne —, on l'affiche tel quel : fail-soft.
            html += '<p class="zj-maharat__pont"><span>Apprendre :</span>' + pont.formations.map(function (f) {
              if (typeof f === "string") return '<span class="zj-maharat__formation">' + esc(f) + '</span>';
              if (!f || !f.titre) return "";
              if (!f.vitrine) return '<span class="zj-maharat__formation">' + esc(f.titre) + '</span>';
              return '<button type="button" class="zj-bouton zj-bouton--discret" data-mahara-vitrine="' + esc(String(f.vitrine)) + '">' + esc(f.titre) + '</button>';
            }).join("") + '</p>';
          } else if (typeof pont.formations === "number" && pont.formations > 0) {
            html += '<p class="zj-maharat__pont">' + pont.formations + (pont.formations > 1 ? ' formations de la maison l\'enseignent' : ' formation de la maison l\'enseigne') + '</p>';
          }
          var et = (Array.isArray(pont.etapes) ? pont.etapes : []).filter(function (s) { return s && s.id; });
          if (et.length) html += '<p class="zj-maharat__pont"><span>Prouver :</span>' + et.map(function (s) {
            return '<button type="button" class="zj-bouton zj-bouton--discret" data-mahara-etape="' + esc(s.id) + '">' + esc(s.titre || "Une étape") + '</button>';
          }).join("") + '</p>';
        }
        html += '</div></li>';
      });
      html += '</ul></details>';
    });
    html += '<p class="zj-riwaq__detail zj-maharat__note">Une mahara ne se déclare pas : elle se prouve par un livrable qu\'un témoin regarde — une étape attestée, ou le bureau. Aucun point, aucun rang : l\'Ijaza de la Zawia n\'est pas un rang de la charte.</p>';
    corps.innerHTML = html;
    brancherMaharat();
  }
  function brancherMaharat() {
    // « Prouver » mène à l'étape du masar qui atteste la mahara (masarat.vue est posé par ouvrirMasarat)
    // ⚠️ $$ et jamais $ : $ est querySelector, .forEach y JETTE, et l'exception emporte
    //    tout ce qui se câble après elle — la faute qui a tué le Souk deux jours durant.
    $$("#zj-maharat-corps [data-mahara-etape]").forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-mahara-etape"); fermerMaharat(); ouvrirMasarat({ id: id }); }); });
    // v8.1 — « Apprendre » mène à la vitrine de la Qissaria : l'identifiant d'une ligne du catalogue
    $$("#zj-maharat-corps [data-mahara-vitrine]").forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-mahara-vitrine"); fermerMaharat(); ouvrirQissaria(id); }); });
    var cIj = $("#zj-maharat-carte");
    if (cIj) cIj.addEventListener("click", function () { ouvrirCarteIjaza(); });
  }

  // ---- v7.8 — LA CARTE DE L'IJAZA : le certificat qu'on partage -----------------------
  // ijaza-carte.js dit ce qu'elle porte et la dessine ; ici, le panneau et le
  // partage. Elle se dessine AUSSI quand le diplôme n'est pas obtenu — « en
  // chemin », avec les terrains déjà tenus : c'est ce qui donne envie de finir.
  function donneesIjaza() {
    var d = maharat.donnees || {};
    var prises = (Array.isArray(d.prouvees) ? d.prouvees : []).map(function (r) { return r && r.mahara ? r.mahara : r; });
    var c = joueur ? R.carnet(joueur) : null;
    return {
      pseudo: joueur ? joueur.pseudo : "",
      maharat: prises,
      rang: c && c.m39ol.rang ? c.m39ol.rang.cle : "",
      ar: !!(Lg && Lg.estAr()),
      adresse: adresseJeu()
    };
  }
  function ouvrirCarteIjaza() {
    var pn = $("#zj-ijaza");
    if (!pn || !joueur || !Ij || dayf.actif) return;
    basculerMenu(false); fermerDialogue(); fermerMaharat();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    var msg = $("#zj-ijaza-msg");
    if (msg) msg.textContent = "";
    var f = $("#zj-ijaza-fermer");
    if (f) f.focus();
    // la carte se dessine sur ce que la base a déjà rendu ; sinon on va le lire
    chargerMaharat().then(function () { Ij.dessiner($("#zj-ijaza-canvas"), donneesIjaza()); });
  }
  function fermerCarteIjaza() {
    var pn = $("#zj-ijaza");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function partagerIjaza() {
    var cv = $("#zj-ijaza-canvas");
    if (!cv || !cv.toBlob || !Ij) return;
    cv.toBlob(function (b) {
      if (!b) return;
      var nom = Ij.nomFichier(joueur ? joueur.pseudo : "");
      var fichier = typeof File === "function" ? new File([b], nom, { type: "image/png" }) : null;
      if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] })) {
        navigator.share({ files: [fichier] }).catch(function () { /* partage annulé */ });
        return;
      }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = nom;
      document.body.appendChild(a); a.click(); a.remove();
      var msg = $("#zj-ijaza-msg");
      if (msg) msg.textContent = "La carte est téléchargée : partage-la où tu veux.";
    }, "image/png");
  }

  function rendreBibliotheque() {
    var panneau = $("#zj-bibliotheque");
    if (!panneau || panneau.hidden) return;   // fermée pendant la lecture : rien à rendre
    var corps = $("#zj-bibliotheque-corps");
    if (!corps) return;
    var e = Rs.etat(biblio.lignes);
    var html = "";

    if (!lignee.maison) {
      html += '<p class="zj-biblio__note">Les rayons montrent ce qui est ouvert à tous ; le reste attend les gens de la maison.</p>';
    } else if (lignee.devoile) {
      // v3.8 — entre gens de la maison, la maison se nomme (texte rendu par la base, jamais écrit ici)
      var dv = lignee.devoile, ph = (Lg && Lg.estAr() && dv.phrase_ar) ? dv.phrase_ar : dv.phrase;
      html += '<p class="zj-biblio__note"><strong>' + esc(dv.nom) + '</strong>' + (ph ? ' — ' + esc(ph) : '') + '</p>';
    }

    // ---- v6.0 — le Kounnach, en tête : ce que ta Sna3a ouvre (la salle est à part)
    var kr = Bb.rayon("kounnach"), ke = etatKounnach();
    html += '<h3 class="zj-riwaq__titre">' + esc(kr.nom) + ' · <span class="ar" lang="ar" dir="rtl">' + esc(kr.ar) + '</span></h3>' +
      '<div class="zj-biblio__kharita"><div>' +
        (ke && ke.publiees ? '<p class="zj-riwaq__detail">' + ke.ouvertes + ' sur ' + ke.publiees + '</p>' +
          (ke.prochaine ? '<p class="zj-riwaq__detail">Encore ' + ke.prochaine.manque + ' pour ' + esc(Kn.niveau(ke.prochaine.niveau).nom) + ', qui ouvre « ' + esc(ke.prochaine.titre) + ' ».</p>' : '')
          : '<p class="zj-riwaq__detail">' + esc(kr.sous) + '</p>') +
      '</div><button type="button" class="zj-bouton zj-bouton--discret" id="zj-biblio-kounnach">Ouvrir le Kounnach</button></div>';

    // Bab — les rayons de culture d'une maison (l'histoire, les codes, les rituels,
    // les métiers et les gens), pliés comme le lexique ; chaque entrée lue compte.
    if (ZWJ.maison && ZWJ.maison.actif() && ZWJ.maison.rayonsCulture) {
      ZWJ.maison.rayonsCulture().forEach(function (r) {
        html += '<h3 class="zj-riwaq__titre">' + esc(r.nom) + '</h3>' + (r.sous ? '<p class="zj-riwaq__detail">' + esc(r.sous) + '</p>' : '') +
          '<div class="zj-biblio__moujam">' + r.entrees.map(function (m) {
            return '<details class="zj-biblio__mot" data-bab="' + esc(m.id) + '"><summary>' + esc(m.titre) + '</summary><p>' + esc(m.texte) + '</p></details>';
          }).join("") + '</div>';
      });
    }

    // ---- Al-Moujam : le lexique, plié entrée par entrée pour ne rien écraser
    var moujam = Bb.rayon("moujam");
    html += '<h3 class="zj-riwaq__titre">' + esc(moujam.nom) + ' · <span class="ar" lang="ar" dir="rtl">' + esc(moujam.ar) + '</span></h3>' +
      '<div class="zj-biblio__moujam">' + Bb.MOUJAM.map(function (m) {
        return '<details class="zj-biblio__mot"><summary>' + esc(m.nom) +
          ' <span class="ar" lang="ar" dir="rtl">' + esc(m.ar) + '</span></summary>' +
          '<p>' + esc(m.detail) + '</p></details>';
      }).join("") + '</div>';

    // ---- Les ressources : de quoi apprendre
    html += '<h3 class="zj-riwaq__titre">' + esc(Bb.rayon("ressources").nom) + '</h3>';
    if (e.ressources.length) {
      html += '<ul class="zj-riwaq__liste">' + e.ressources.map(function (r) {
        return '<li class="zj-riwaq__item">' +
          '<div class="zj-riwaq__texte">' +
            '<strong>' + esc(r.titre) + '</strong>' +
            (r.detail ? '<span class="zj-riwaq__detail">' + esc(r.detail) + '</span>' : '') +
          '</div>' +
          (r.lien ? '<a class="zj-bouton zj-bouton--discret zj-riwaq__lien" href="' + esc(r.lien) + '" target="_blank" rel="noopener noreferrer">Ouvrir</a>' : '') +
        '</li>';
      }).join("") + '</ul>';
    } else {
      html += '<p class="zj-riwaq__vide">Rien sur ce rayon pour l\'instant.</p>';
    }

    // ---- Le catalogue : ce que la maison propose. Sa place ici est un choix
    // (motivation 5) : une salle où l'on entre, jamais une bannière.
    html += '<h3 class="zj-riwaq__titre">' + esc(Bb.rayon("catalogue").nom) + '</h3>';
    if (e.produits.length) {
      html += '<ul class="zj-riwaq__liste">' + e.produits.map(function (p) {
        return '<li class="zj-riwaq__item">' +
          '<div class="zj-riwaq__texte">' +
            '<strong>' + esc(p.titre) + '</strong>' +
            (p.detail ? '<span class="zj-riwaq__detail">' + esc(p.detail) + '</span>' : '') +
          '</div>' +
          (p.lien ? '<a class="zj-bouton zj-riwaq__lien" href="' + esc(p.lien) + '" target="_blank" rel="noopener noreferrer">Voir</a>' : '') +
        '</li>';
      }).join("") + '</ul>';
    } else {
      html += '<p class="zj-riwaq__vide">Le catalogue est vide pour l\'instant.</p>';
    }
    // v7.3 — le 5ᵉ rayon : la qubba du Voilé. On y entre depuis les rayonnages,
    // pas seulement depuis le menu : une légende se range où l'on range les
    // récits, et on y arrive en marchant.
    var rt = Bb.rayon("tableaux");
    if (rt) {
      html += '<h3 class="zj-riwaq__titre">' + esc(rt.nom) + '</h3>' +
        '<p class="zj-riwaq__vide">' + esc(rt.sous) + '</p>' +
        '<button type="button" id="zj-biblio-tableaux" class="zj-bouton zj-bouton--discret">Aller voir les sept tableaux</button>';
    }
    html += '<p class="zj-biblio__note">On entre ici de son pas — rien ne s\'affiche au-dessus d\'une tête. C\'est la règle de la maison.</p>';

    corps.innerHTML = html;
    var bt = $("#zj-biblio-tableaux");
    if (bt) bt.addEventListener("click", function () { fermerBibliotheque(); ouvrirTableaux(); });
    var bk = $("#zj-biblio-kounnach");
    if (bk) bk.addEventListener("click", function () { fermerBibliotheque(); ouvrirKounnach(); });
    // v3.6 — Al-Moujam est « lu » quand on déplie un mot : le Wird du jour 3 le demande
    $$("#zj-bibliotheque-corps .zj-biblio__mot").forEach(function (d) {
      d.addEventListener("toggle", function () { if (d.open) poserWird(Wd && Wd.marquerSalle(joueur.recit, "moujam")); });
    });
  }

  // ---- L'IMTIHAN : une question, seul, chronométré ---------------------------------------
  function ouvrirImtihan() {
    // Le chemin du menu : même politesse que la tuile — et de toute façon,
    // c'est le serveur qui refuse de tirer pour un Talib libre.
    if (!Cj.peut(lignee.maison, "rihal")) { basculerMenu(false); ouvrirDialogue(Cj.refus("rihal")); return; }
    var panneau = $("#zj-imtihan");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    $("#zj-imtihan-corps").innerHTML = '<p class="zj-riwaq__vide">On ouvre le pupitre…</p>';
    var f = $("#zj-imtihan-fermer");
    if (f) f.focus();
    tirerQuestion();
  }

  function fermerImtihan() {
    var panneau = $("#zj-imtihan");
    if (!panneau || panneau.hidden) return;
    // Fermer la salle pendant une question compte comme quitter : la question
    // est brûlée. On le fait avant de cacher l'écran, jamais après.
    if (epreuve.question) abandonner("fermeture");
    clearInterval(epreuve.minuterie);
    epreuve.question = null;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  function tirerQuestion() {
    var corps = $("#zj-imtihan-corps");
    compte.imtihanTirer().then(function (r) {
      if (!r || !r.ok) {
        epreuve.question = null;
        corps.innerHTML = '<p class="zj-riwaq__vide">' + esc(Im.pourquoiRien(r)) + '</p>';
        return;
      }
      epreuve.question = r;
      epreuve.servieLe = new Date().toISOString();   // repli si l'horloge locale dérive
      epreuve.envoi = false;
      corps.innerHTML =
        '<p class="zj-imtihan__theme">' + esc(r.theme || "Culture IA") + ' · il te reste ' + r.restantes + ' question' + (r.restantes > 1 ? 's' : '') + ' aujourd\'hui</p>' +
        '<div class="zj-imtihan__barre"><span id="zj-imtihan-jauge" class="calme"></span></div>' +
        '<p class="zj-imtihan__chrono"><span id="zj-imtihan-secondes">' + r.secondes + '</span> secondes</p>' +
        '<p class="zj-imtihan__enonce">' + esc(r.enonce) + '</p>' +
        '<div class="zj-choix-qcm" id="zj-imtihan-choix">' +
          r.options.map(function (o) {
            return '<button type="button" class="zj-choix-qcm__b" data-i="' + o.i + '">' + esc(o.t) + '</button>';
          }).join("") +
        '</div>';
      Array.prototype.slice.call(corps.querySelectorAll("#zj-imtihan-choix button")).forEach(function (b) {
        b.addEventListener("click", function () { repondreImtihan(parseInt(b.getAttribute("data-i"), 10)); });
      });
      lancerChrono();
    });
  }

  // Le chronomètre d'AFFICHAGE. L'arbitre, c'est le serveur : il connaît
  // l'heure à laquelle il a servi la question. Ici on ne fait que montrer le
  // temps qui passe — et envoyer la réponse vide quand il est écoulé.
  function lancerChrono() {
    clearInterval(epreuve.minuterie);
    epreuve.minuterie = setInterval(function () {
      if (!epreuve.question) { clearInterval(epreuve.minuterie); return; }
      var r = Im.restant(epreuve.servieLe, epreuve.question.secondes);
      var jauge = $("#zj-imtihan-jauge"), secs = $("#zj-imtihan-secondes");
      if (jauge) { jauge.style.width = (r.part * 100) + "%"; jauge.className = Im.urgence(r.part); }
      if (secs) secs.textContent = r.secondes;
      if (r.fini) { clearInterval(epreuve.minuterie); repondreImtihan(-1); }
    }, 200);
  }

  function repondreImtihan(choix) {
    if (!epreuve.question || epreuve.envoi) return;
    epreuve.envoi = true;
    clearInterval(epreuve.minuterie);
    var q = epreuve.question;
    epreuve.question = null;
    Array.prototype.slice.call(document.querySelectorAll("#zj-imtihan-choix button")).forEach(function (b) { b.disabled = true; });
    compte.imtihanRepondre(q.question, choix, false).then(function (r) {
      epreuve.envoi = false;
      if (r && r.ok) verser("imtihan");   // v4.7 — répondre verse, juste ou non
      montrerVerdict(q, r);
    });
  }

  // Quitter la fenêtre brûle la question. On le signale tout de suite : c'est
  // la règle que Youssef a posée, et elle ne vaut que si le signal part AVANT
  // que le joueur ait le temps de revenir avec la réponse.
  function abandonner(raison) {
    if (!epreuve.question || epreuve.envoi) return;
    var q = epreuve.question;
    epreuve.question = null;
    epreuve.envoi = true;
    clearInterval(epreuve.minuterie);
    compte.imtihanRepondre(q.question, -1, true).then(function (r) {
      epreuve.envoi = false;
      if (raison !== "fermeture") montrerVerdict(q, r);
    });
  }

  function montrerVerdict(q, r) {
    var corps = $("#zj-imtihan-corps");
    if (!corps) return;
    var v = Im.verdict(r);
    var suite = (r && r.ok && !r.quota) ? '<button id="zj-imtihan-suivante" type="button" class="zj-bouton">Une autre</button>' : '';
    corps.innerHTML =
      '<p class="zj-imtihan__verdict ' + v.etat + '">' + esc(v.texte) + '</p>' +
      ((r && r.juste_etait && v.etat !== "juste") ? '<p class="zj-imtihan__reponse">La bonne réponse : ' + esc(r.juste_etait) + '</p>' : '') +
      ((r && r.explication) ? '<p class="zj-imtihan__explication">' + esc(r.explication) + '</p>' : '') +
      '<div class="zj-imtihan__apres">' + suite + '<button id="zj-imtihan-fermer2" type="button" class="zj-bouton zj-bouton--discret">Se lever</button></div>';
    var suiv = $("#zj-imtihan-suivante");
    if (suiv) suiv.addEventListener("click", function () {
      $("#zj-imtihan-corps").innerHTML = '<p class="zj-riwaq__vide">On tourne la page…</p>';
      tirerQuestion();
    });
    var f2 = $("#zj-imtihan-fermer2");
    if (f2) f2.addEventListener("click", fermerImtihan);
    if (r && r.juste) {
      sonner("defi");
      compte.lireJoueur().then(function (j) {
        if (j) { joueur.sna3a = j.sna3a; joueur.sna3aAttestee = j.sna3aAttestee; joueur.imtihan = j.imtihan; rafraichirHud(); }
      });
    } else { sonner("faux"); }
  }

  // ---- LE TABLEAU : qui a quoi, lisible par tous -----------------------------------------
  function ouvrirTableau() {
    if (maisonSalleMuette("tableau")) return;   // Bab — muette chez une maison
    var panneau = $("#zj-tableau");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-tableau-fermer");
    if (f) f.focus();
    tutorielEvenement("tableau");
    $("#zj-tableau-corps").innerHTML = '<p class="zj-riwaq__vide">On lit le tableau…</p>';
    compte.lireTableau().then(function (lignes) {
      var corps = $("#zj-tableau-corps");
      if (!lignes || !lignes.length) {
        corps.innerHTML = '<p class="zj-riwaq__vide">Personne n\'a encore posé son nom. Sois le premier.</p>';
        return;
      }
      corps.innerHTML =
        '<table class="zj-tableau"><thead><tr>' +
          '<th></th><th>Qui</th><th title="Ce qu\'on donne à la maison">M39ol</th>' +
          '<th title="Ce qu\'on sait faire">Sna3a</th><th title="Ce qu\'on sait du pays">Dhakira</th>' +
        '</tr></thead><tbody>' +
        lignes.map(function (l) {
          return '<tr' + (l.moi ? ' class="moi"' : '') + '>' +
            '<td class="zj-tableau__place">' + l.place + '</td>' +
            '<td>' + esc(l.pseudo) + '<span class="zj-tableau__rang">' + esc(R.rang(l.rang).nom) + (l.presences ? ' · ' + l.presences + ' présence' + (l.presences > 1 ? 's' : '') : '') + '</span></td>' +
            '<td class="zj-tableau__n">' + l.m39ol + '</td>' +
            '<td class="zj-tableau__n">' + l.sna3a + '</td>' +
            '<td class="zj-tableau__n">' + l.dhakira + '<span class="zj-tableau__rang">' + esc(R.dhakira(l.dhakira).niveau.nom) + '</span></td>' +
          '</tr>';
        }).join("") +
        '</tbody></table>' +
        '<p class="zj-tableau__note">Le M39ol classe, parce qu\'il est le seul des trois à donner un rang. Il se reçoit d\'un autre — la présence au point hebdo, et ce que le bureau accorde.</p>';
    });
  }

  function fermerTableau() {
    var panneau = $("#zj-tableau");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    libererTutoriel();
  }

  // ---- LES CARTES DE LA DHAKIRA (v3.4) --------------------------------------------------
  // La collection : une carte par page perdue — gagnée (le portrait), dorée
  // (trouvée sans indice), à venir (son jeudi), ou encore chez Nsyan. En bas,
  // ce que la maison offre à chaque niveau (zawia-recompenses.sql) : des
  // options, jamais un rang — et une récompense réelle se RÉCLAME, la maison
  // la remet quand le Rawi a raconté sa page.
  function ouvrirCartes() {
    var panneau = $("#zj-cartes");
    if (!panneau || !joueur) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-cartes-fermer");
    if (f) f.focus();
    rendreCartes();
    poserWird(Wd && Wd.marquerSalle(joueur.recit, "cartes"));   // v3.6
  }
  function rendreCartes() {
    var corps = $("#zj-cartes-corps");
    if (!corps) return;
    var cartes = P.cartes(joueur.pages, joueur.recit.dorees), c = R.carnet(joueur);
    var gagnees = cartes.filter(function (k) { return k.gagnee; }).length, dorees = cartes.filter(function (k) { return k.doree; }).length;
    // v3.9 — titre, ville et époque dans des blocs séparés : langue.js traduit
    // un bloc d'un seul tenant, et « Casablanca · vers 1770 » n'a pas d'entrée
    // quand « Casablanca » et « vers 1770 » en ont chacun une.
    var legende = function (k, ville, apres) {
      return '<div class="zj-carte__titre">' + esc(k.titre) + '</div>' +
        '<div class="zj-carte__lieu"><p>' + esc(ville ? ville.ville : k.ville) + '</p><p>' + esc(apres) + '</p></div>';
    };
    var grille = function (liste) {
      return '<div class="zj-cartes__grille">' + liste.map(function (k) {
        var ville = Rc.mourchid(k.ville);
        if (k.gagnee) {
          return '<figure class="zj-carte' + (k.doree ? ' zj-carte--doree' : '') + '">' +
            '<img src="' + CARTES.dossier + esc(k.cle) + '.jpg' + CARTES.version + '" alt="" loading="lazy" />' +
            '<figcaption>' + legende(k, ville, k.epoque) +
            (k.doree ? '<div class="zj-carte__doree">dorée — sans indice</div>' : '') + '</figcaption></figure>';
        }
        if (!k.ouverte) {
          return '<figure class="zj-carte zj-carte--fermee"><div class="zj-carte__vide">' + jourDe(P.ouvertureDe(k.cle)) + '</div>' +
            '<figcaption>' + legende(k, ville, "s'ouvre bientôt") + '</figcaption></figure>';
        }
        return '<figure class="zj-carte zj-carte--perdue"><div class="zj-carte__vide">chez Nsyan</div>' +
          '<figcaption>' + legende(k, ville, k.epoque) + '</figcaption></figure>';
      }).join("") + '</div>';
    };
    // v7.2a — la collection d'un invité : on ne lui cache pas les vingt et une
    // autres, on les lui MONTRE fermées. Sans les offres de la maison (elles
    // viennent de la base, et il n'a pas de compte) ni la garde-robe.
    if (dayf.actif) {
      // le chapô parle de rangs et de niveaux : un invité n'en a pas
      var leadD = $("#zj-cartes-lead");
      if (leadD) leadD.textContent = "Vingt-deux pages ont été arrachées à la Rihla d'Ibn Battuta. Chacune retrouvée est une carte peinte — et un pas que Nsyan recule.";
      corps.innerHTML =
        '<div class="zj-cartes__compte"><p>Cartes : ' + gagnees + ' sur ' + cartes.length + '</p>' +
          '<p>' + esc(Dy.collection(gagnees, cartes.length)) + '</p></div>' +
        '<h3 class="zj-majliss__titre">La saison — une page par jeudi</h3>' + grille(cartes.filter(function (k) { return k.saison === 1; })) +
        '<h3 class="zj-majliss__titre">Les pages fondatrices</h3>' + grille(cartes.filter(function (k) { return k.saison === 0; }));
      return;
    }
    corps.innerHTML =
      '<div class="zj-cartes__compte"><p>Cartes : ' + gagnees + ' sur ' + cartes.length + '</p>' +
        (dorees ? '<p>Dorées : ' + dorees + '</p>' : '') +
        '<p>Dhakira ' + c.dhakira.total + ' — <strong>' + esc(c.dhakira.niveau.nom) + '</strong>, ' + esc(c.dhakira.niveau.sous) + '</p>' +
        (c.dhakira.prochain ? '<p>Encore ' + c.dhakira.prochain.manque + ' pour ' + esc(c.dhakira.prochain.niveau.nom) + '</p>' : '') + '</div>' +
      // v3.9 — la Dhakira habille : une ville retrouvée ouvre ses habits dans la lebsa
      '<p class="zj-cartes__lebsa">Une ville retrouvée ouvre ses habits dans ta lebsa. <a href="/lebsa-vivante" target="_blank" rel="noopener">Voir ma garde-robe</a></p>' +
      '<h3 class="zj-majliss__titre">La saison — une page par jeudi</h3>' + grille(cartes.filter(function (k) { return k.saison === 1; })) +
      '<h3 class="zj-majliss__titre">Les pages fondatrices</h3>' + grille(cartes.filter(function (k) { return k.saison === 0; })) +
      '<h3 class="zj-majliss__titre">Ce que la maison offre</h3><div id="zj-cartes-offres"><p class="zj-riwaq__vide">On regarde…</p></div>';
    var offres = $("#zj-cartes-offres");
    compte.lireRecompenses().then(function (lignes) {
      if (!offres) return;
      if (!lignes || !lignes.length) { offres.innerHTML = '<p class="zj-riwaq__vide">La maison n\'a encore rien posé ici. Les cartes, elles, restent.</p>'; return; }
      var mien = c.dhakira.niveau.cle, rangs = R.DHAKIRA_NIVEAUX.map(function (n) { return n.cle; });
      offres.innerHTML = '<ul class="zj-majliss__liste zj-offres">' + lignes.map(function (o) {
        var niv = R.DHAKIRA_NIVEAUX.filter(function (n) { return n.cle === o.niveau; })[0];
        var atteint = rangs.indexOf(mien) >= rangs.indexOf(o.niveau);
        var etat = o.remise_le ? '<span class="zj-badge zj-badge--ok">remise</span>'
          : o.reclamee_le ? '<span class="zj-badge">réclamée — la maison te la remet</span>'
          : atteint ? '<button type="button" class="zj-bouton zj-bouton--discret zj-offre__reclamer" data-id="' + esc(o.id) + '">Réclamer</button>'
          : '<span class="zj-majliss__quand">dès ' + esc(niv ? niv.nom : o.niveau) + '</span>';
        return '<li class="zj-offre' + (atteint ? '' : ' zj-offre--loin') + '"><strong>' + esc(o.titre) + '</strong>' +
          (o.detail ? '<p>' + esc(o.detail) + '</p>' : '') +
          (o.lien && /^https:\/\//.test(o.lien) ? '<a href="' + esc(o.lien) + '" rel="noopener noreferrer" target="_blank">' + esc(o.lien) + '</a>' : '') +
          '<div class="zj-majliss__ligne">' + etat + '</div></li>';
      }).join("") + '</ul>';
      Array.prototype.slice.call(offres.querySelectorAll(".zj-offre__reclamer")).forEach(function (b) {
        b.addEventListener("click", function () {
          b.disabled = true;
          compte.reclamerRecompense(b.getAttribute("data-id")).then(function (r) {
            if (!r || !r.ok) { b.disabled = false; ouvrirDialogue({ nom: "La maison", pages: [(r && r.erreur) || "Ça n'a pas tenu."] }); return; }
            rendreCartes();
          });
        });
      });
    });
  }
  function fermerCartes() {
    var panneau = $("#zj-cartes");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  // ---- LA KHARITA (v4.1) ---------------------------------------------------------------
  // La carte des mots du site, devenue la carte du grand monde. Elle s'ouvre
  // effacée : une ville revient quand une de ses pages est retrouvée au
  // sandouq (kharita.js). Le dessin est celui du site (window.ZWK) ; le jeu
  // ne fournit que le brouillard et la fiche d'une ville. On lit, on ne
  // voyage pas encore : seule Fès est bâtie.
  function ouvrirKharita() {
    var panneau = $("#zj-kharita");
    if (!panneau || !joueur) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-kharita-fermer");
    if (f) f.focus();
    rendreKharita();
  }
  function rendreKharita() {
    var corps = $("#zj-kharita-corps");
    if (!corps) return;
    if (!Kh || !window.ZWK) { corps.innerHTML = '<p class="zj-riwaq__vide">La carte n\'a pas pu se déplier.</p>'; return; }
    var e = Kh.etat(P.etat(joueur.pages).liste);
    corps.innerHTML =
      '<p class="zj-cartes__compte">' + e.revenues + ' ville' + (e.revenues > 1 ? 's' : '') + ' sur ' + e.total + ' revenue' + (e.revenues > 1 ? 's' : '') + ' sur la carte.' +
        (e.revenues < e.total ? ' Les autres attendent leurs pages au sandouq.' : ' Nsyan n\'efface plus rien.') + '</p>' +
      '<div class="kh-scroll zj-kharita__carte"><div class="kh-scene" data-kh-scene></div></div>' +
      '<p class="zj-biblio__note">Touche une ville ou une enseigne pour la lire.</p>';
    var parVille = {};
    e.villes.forEach(function (v) { parVille[v.cle] = v; });
    window.ZWK.rendre(corps, {
      base: "",
      brouillard: e.brouillard,
      fiche: function (type, cle) {
        if (type !== "ville") return "";
        var mots = window.ZWK.MOTS.filter(function (m) { return m.ville === cle; }).map(function (m) { return m.nom; });
        return Kh.fiche(parVille[cle], Rc.mourchid(cle), { portrait: PORTRAITS.dossier + cle + ".jpg" + PORTRAITS.version, mots: mots });
      }
    });
    // Sur téléphone la carte déborde : on l'ouvre centrée sur la maison, pas sur l'océan.
    var sc = corps.querySelector(".kh-scroll"), maison = corps.querySelector('.kh-ville[data-ville="' + Kh.MAISON + '"]');
    if (sc && maison && (sc.scrollWidth > sc.clientWidth || sc.scrollHeight > sc.clientHeight)) {
      var r = maison.getBoundingClientRect(), b = sc.getBoundingClientRect();
      sc.scrollLeft += (r.left + r.width / 2) - (b.left + sc.clientWidth / 2);
      sc.scrollTop += (r.top + r.height / 2) - (b.top + sc.clientHeight / 2);
    }
  }
  function fermerKharita() {
    var panneau = $("#zj-kharita");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  // ---- LA CHAMBRE DU MAJLISS (v3.3) ---------------------------------------------------
  // Derrière la porte X de la Qa3a, que seuls les membres du conseil voient.
  // Tout vient de la base (zawia-majliss.sql) : les chiffres de la maison,
  // ses membres, les derniers entrés, le journal — et la fonction refuse
  // quiconque n'est pas du Majliss, quoi qu'il tente avec la clé publique.
  function dessinerPortesMajliss(cam) {
    if (rahba.active) return;   // v5.7 — la Rahba n'a pas de porte du Majliss
    if (!cam || !cour.ctx) return;
    if (!majliss.portes) {
      majliss.portes = [];
      for (var y = 0; y < M.HAUTEUR; y++) for (var x = 0; x < M.LARGEUR; x++) if (M.tuile(x, y) === "X") majliss.portes.push({ x: x, y: y });
    }
    var ctx = cour.ctx, z = cam.zoom;
    var souffle = mouvementReduit ? 0.75 : 0.6 + 0.25 * Math.sin(cour.t * 2);
    majliss.portes.forEach(function (pt) {
      var sx = (pt.x * T - cam.camX + cam.ox) * z, sy = (pt.y * T - cam.camY + cam.oy) * z;
      // le bois de la porte, dans l'épaisseur du mur
      ctx.fillStyle = "#3a2417";
      ctx.fillRect(Math.round(sx + 3 * z), Math.round(sy + 2 * z), 10 * z, 14 * z);
      // l'arc outrepassé, en or, qui respire
      ctx.strokeStyle = "rgba(230, 177, 63, " + souffle.toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, z);
      ctx.beginPath();
      ctx.moveTo(sx + 3 * z, sy + 16 * z); ctx.lineTo(sx + 3 * z, sy + 7 * z);
      ctx.arc(sx + 8 * z, sy + 7 * z, 5 * z, Math.PI, 0);
      ctx.lineTo(sx + 13 * z, sy + 16 * z);
      ctx.stroke();
      // le heurtoir
      ctx.fillStyle = "#e6b13f";
      ctx.fillRect(Math.round(sx + 7 * z), Math.round(sy + 10 * z), 2 * z, 2 * z);
    });
  }

  function ouvrirMajliss() {
    var panneau = $("#zj-majliss");
    if (!panneau || !majliss.membre) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-majliss-fermer");
    if (f) f.focus();
    $("#zj-majliss-corps").innerHTML = '<p class="zj-riwaq__vide">On ouvre la chambre…</p>';
    chargerMajliss();
  }

  function chargerMajliss() {
    compte.lireMajliss().then(function (r) {
      var corps = $("#zj-majliss-corps");
      if (!corps) return;
      if (!r || !r.ok) { corps.innerHTML = '<p class="zj-riwaq__vide">' + esc((r && r.erreur) || "La chambre ne répond pas.") + '</p>'; return; }
      var c = r.chiffres || {};
      var quand = function (iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString(locale(), { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }); };
      var tuile = function (n, l) { return '<div class="zj-majliss__chiffre"><strong>' + esc(n == null ? "—" : n) + '</strong><span>' + esc(l) + '</span></div>'; };
      corps.innerHTML =
        '<h3 class="zj-majliss__titre">La maison en chiffres</h3>' +
        '<div class="zj-majliss__chiffres">' +
          tuile(c.comptes, "comptes") + tuile(c.personnages, "entrés dans la cour") + tuile(c.maison, "gens de la maison") +
          tuile(c.entres_7j, "actifs sur 7 jours") + tuile(c.presences, "présences au point hebdo") + tuile(c.m39ol, "M39ol donnés") +
          tuile(c.rencontres, "rencontres au Sahn") + tuile(c.pages, "pages retrouvées") + tuile(c.tahaddi, "Ta7addi réussis") +
          tuile(c.etals, "étals au Souk") + tuile(c.seances_a_venir, "séances à venir") +
        '</div>' +
        '<h3 class="zj-majliss__titre">Le conseil</h3>' +
        '<ul class="zj-majliss__liste">' + (r.membres || []).map(function (m) {
          return '<li>' + (m.entre ? esc(m.pseudo) + ' <span class="zj-tableau__rang">' + esc(R.rang(m.rang).nom) + '</span>' : '<em>pas encore entré dans la cour</em>') +
            (m.derniere_entree ? ' <span class="zj-majliss__quand">· vu le ' + esc(quand(m.derniere_entree)) + '</span>' : '') + '</li>';
        }).join("") + '</ul>' +
        '<h3 class="zj-majliss__titre">Les derniers passés dans la cour</h3>' +
        (r.derniers && r.derniers.length
          ? '<ul class="zj-majliss__liste">' + r.derniers.map(function (d) {
              return '<li>' + esc(d.pseudo) + ' <span class="zj-tableau__rang">' + esc(R.rang(d.rang).nom) + '</span> <span class="zj-majliss__quand">· ' + esc(quand(d.quand)) + '</span></li>';
            }).join("") + '</ul>'
          : '<p class="zj-riwaq__vide">Personne encore.</p>') +
        '<h3 class="zj-majliss__titre">Le journal du Majliss</h3>' +
        '<form id="zj-majliss-form" class="zj-majliss__form">' +
          '<textarea id="zj-majliss-texte" maxlength="600" rows="3" placeholder="Ce que le conseil décide, en une ligne ou deux."></textarea>' +
          '<div class="zj-majliss__ligne"><button type="submit" class="zj-bouton">Poser au journal</button><span id="zj-majliss-msg" class="zj-presence__msg" aria-live="polite"></span></div>' +
        '</form>' +
        (r.journal && r.journal.length
          ? '<ul class="zj-majliss__journal">' + r.journal.map(function (l) {
              return '<li' + (l.moi ? ' class="moi"' : '') + '><span class="zj-majliss__quand">' + esc(quand(l.quand)) + ' · ' + esc(l.pseudo) + '</span><p>' + esc(l.texte) + '</p></li>';
            }).join("") + '</ul>'
          : '<p class="zj-riwaq__vide">Le journal est vierge. Le premier mot est à vous.</p>');
      var form = $("#zj-majliss-form");
      if (form) form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        if (majliss.envoi) return;
        var t = $("#zj-majliss-texte").value.trim(), msg = $("#zj-majliss-msg");
        if (!t) { if (msg) { msg.textContent = "Rien à poser."; msg.className = "zj-presence__msg ko"; } return; }
        majliss.envoi = true;
        compte.ecrireMajliss(t).then(function (rr) {
          majliss.envoi = false;
          if (!rr || !rr.ok) { if (msg) { msg.textContent = (rr && rr.erreur) || "Ça n'a pas tenu."; msg.className = "zj-presence__msg ko"; } return; }
          chargerMajliss();
        });
      });
    });
  }

  function fermerMajliss() {
    var panneau = $("#zj-majliss");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  // ---- LA RKHAMA (v8.0) : la dalle du mur du Sahn ------------------------------------
  // Dans une médersa, la rkhama est la plaque de marbre gravée au mur de la cour :
  // elle nomme ceux qui ont payé la fontaine, le toit, les bourses — et les
  // remercie. Ici, les partenaires de la maison. Un membre passe devant, s'arrête,
  // lit, et sait à qui la maison doit quelque chose.
  // ⚠️ AUCUN NOM N'EST ÉCRIT ICI. La dalle est gravée par le bureau, en base
  // (`zawia_partenaires`) : un partenaire est une maison réelle, et le voile veut
  // qu'aucun fichier servi ne la nomme. Le logo n'arrive que comme CHEMIN dans le
  // seau public — l'adresse se compose ici, comme pour la galerie du Souk.
  function chargerRkhama() {
    // Un invité n'a pas de session : la fonction ne lui répondrait pas. On ne
    // l'interroge donc pas — la dalle reste muette, et elle le dit.
    if (dayf.actif || !compte || typeof compte.lirePartenaires !== "function") {
      rkhama.donnees = { ok: true, maison: false, partenaires: [] };
      return Promise.resolve(rkhama.donnees);
    }
    if (rkhama.chargement) return rkhama.chargement;
    rkhama.chargement = compte.lirePartenaires().then(function (r) {
      rkhama.donnees = r || { ok: false };
      rkhama.chargement = null;
      rafraichirHud();   // l'entrée du menu n'apparaît qu'une fois la dalle lue
      return rkhama.donnees;
    }).catch(function () {
      rkhama.donnees = { ok: false };
      rkhama.chargement = null;
      return rkhama.donnees;
    });
    return rkhama.chargement;
  }
  function partenairesRkhama() {
    var d = rkhama.donnees;
    if (!d || !d.ok || !Array.isArray(d.partenaires)) return [];
    return d.partenaires.slice().sort(function (a, b) { return (a && a.ordre || 0) - (b && b.ordre || 0); });
  }
  function rkhamaAQuoiLire() { return partenairesRkhama().length > 0; }

  // Le marbre, gravé en code — rien à charger, comme la porte du Majliss. Et
  // rien du tout tant que la maison n'a remercié personne : un mur nu vaut
  // mieux qu'un cadre vide.
  function dessinerRkhama(cam) {
    if (!cam || !cour.ctx) return;
    // ⚠️ la Rkhama est une tuile de la ZAWIA : dans Fès, sur la Rahba ou au
    // Mechouar, « P » ne veut rien dire — et le balayage des tuiles ci-dessous
    // lirait le monde courant.
    if (rihla.active || rahba.active || (mechouar && mechouar.active)) return;
    if (!rkhamaAQuoiLire()) return;
    if (!rkhama.dalles) rkhama.dalles = tuilesDe("P");
    var ctx = cour.ctx, z = cam.zoom;
    var souffle = mouvementReduit ? 0.75 : 0.6 + 0.25 * Math.sin(cour.t * 2);
    rkhama.dalles.forEach(function (pt) {
      var sx = (pt.x * T - cam.camX + cam.ox) * z, sy = (pt.y * T - cam.camY + cam.oy) * z;
      // le marbre, encastré dans le mur
      ctx.fillStyle = "#b9ae99";
      ctx.fillRect(Math.round(sx + 2 * z), Math.round(sy + 2 * z), 12 * z, 12 * z);
      ctx.fillStyle = "#ded5c2";
      ctx.fillRect(Math.round(sx + 3 * z), Math.round(sy + 3 * z), 10 * z, 10 * z);
      // deux veines, toujours les mêmes
      ctx.strokeStyle = "rgba(120, 108, 88, 0.35)";
      ctx.lineWidth = Math.max(1, 0.4 * z);
      ctx.beginPath();
      ctx.moveTo(sx + 3 * z, sy + 6 * z); ctx.lineTo(sx + 13 * z, sy + 4 * z);
      ctx.moveTo(sx + 3 * z, sy + 11 * z); ctx.lineTo(sx + 13 * z, sy + 9 * z);
      ctx.stroke();
      // ce qui est gravé : quatre lignes d'écriture, sans une lettre lisible
      ctx.fillStyle = "rgba(92, 78, 56, 0.55)";
      [[5, 5.5, 6], [4.5, 7.5, 7], [4.5, 9.5, 5], [5, 11.5, 6]].forEach(function (l) {
        ctx.fillRect(Math.round(sx + l[0] * z), Math.round(sy + l[1] * z), l[2] * z, Math.max(1, 0.5 * z));
      });
      // le filet d'or du cadre, qui respire
      ctx.strokeStyle = "rgba(230, 177, 63, " + souffle.toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, 0.5 * z);
      ctx.strokeRect(sx + 2.5 * z, sy + 2.5 * z, 11 * z, 11 * z);
      // le losange d'or : seulement tant qu'on ne l'a pas lue
      if (!rkhama.lue) losangeOr(ctx, sx + 8 * z, sy - 2 * z - (mouvementReduit ? 0 : 1.5 * Math.sin(cour.t * 3)) * z, z, souffle);
    });
  }

  function ouvrirRkhama() {
    var panneau = $("#zj-rkhama");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    rkhama.lue = true;
    var f = $("#zj-rkhama-fermer");
    if (f) f.focus();
    var corps = $("#zj-rkhama-corps");
    if (corps && !rkhama.donnees) corps.innerHTML = '<p class="zj-riwaq__vide">On lit la dalle…</p>';
    chargerRkhama().then(rendreRkhama);
  }
  function fermerRkhama() {
    var panneau = $("#zj-rkhama");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  // « depuis » : le mois et l'année, dans la langue de la page. Une date illisible
  // ne se montre pas — on ne grave pas un tiret sur du marbre.
  function depuisRkhama(v) {
    if (!v) return "";
    var d = new Date(v);
    if (isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString(locale(), { month: "long", year: "numeric", timeZone: "Africa/Casablanca" }); }
    catch (e) { return String(d.getFullYear()); }
  }
  function rendreRkhama() {
    var panneau = $("#zj-rkhama"), corps = $("#zj-rkhama-corps");
    if (!panneau || panneau.hidden || !corps) return;
    var d = rkhama.donnees || { ok: false };
    if (!d.ok) { corps.innerHTML = '<p class="zj-riwaq__vide">' + esc(d.erreur || "La dalle ne répond pas.") + '</p>'; return; }
    var liste = partenairesRkhama();
    if (!liste.length) { corps.innerHTML = '<p class="zj-riwaq__vide">La maison n\'a encore remercié personne ici.</p>'; return; }
    corps.innerHTML = '<ul class="zj-rkhama__liste">' + liste.map(function (pa) {
      // le logo : un CHEMIN du seau, jamais une adresse — la même garde que la
      // galerie du Souk (souk.js), et l'adresse composée par l'adaptateur.
      // Le logo vient sous deux formes, et deux seulement : un chemin du seau
      // (l'adresse se compose ici, comme au Souk), ou un asset de LA MAISON
      // (`/assets/img/…`), servi par notre propre serveur — rien ne part chez
      // un tiers. Toute autre forme ne se dessine pas.
      var logo = "";
      if (pa.logo && /^\/assets\/img\/[A-Za-z0-9._/-]{3,120}\.(webp|jpeg|jpg|png|svg)$/.test(pa.logo) && pa.logo.indexOf("..") < 0) logo = pa.logo;
      else if (pa.logo && Sk && Sk.cheminSur(pa.logo) && compte && compte.urlImage) logo = compte.urlImage(pa.logo);
      var lien = typeof pa.lien === "string" && pa.lien.indexOf("https://") === 0 ? pa.lien : "";
      var depuis = depuisRkhama(pa.depuis);
      var html = '<li class="zj-rkhama__ligne">';
      // ⚠️ pas de chargement paresseux ici : le panneau s'ouvre sur un geste, et une
      // image qui arrive après coup fait sauter la plaque sous les yeux du lecteur.
      if (logo) html += '<img class="zj-rkhama__logo" src="' + esc(logo) + '" alt="" decoding="async">';
      html += '<div class="zj-rkhama__texte">' +
        '<p class="zj-rkhama__nom">' + esc(pa.nom || "") + '</p>' +
        (pa.mot ? '<p class="zj-rkhama__mot">' + esc(pa.mot) + '</p>' : '') +
        (depuis ? '<p class="zj-rkhama__depuis">Depuis ' + esc(depuis) + '</p>' : '');
      // ⚠️ l'ancre est un bloc à elle seule, jamais seule dans un <p> : langue.js
      //    remplacerait le texte du <p> entier et le lien disparaîtrait en arabe
      //    (la leçon du lien de preuve des maharat).
      if (lien) html += '<a class="zj-rkhama__lien" href="' + esc(lien) + '" target="_blank" rel="noopener noreferrer">Aller voir</a>';
      return html + '</div></li>';
    }).join("") + '</ul>';
  }

  // ---- v4.1 — PARRAINER : répondre de quelqu'un ---------------------------------------
  // Au menu des gens de la maison. Inviter passe par la fonction Netlify, qui
  // fait juger la base au nom du joueur (maison ? place libre ?) puis envoie
  // le lien. Le lien s'affiche aussi, à copier : au Maroc, il part souvent
  // par WhatsApp.
  function ouvrirParrainage() {
    var panneau = $("#zj-parrainage");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    parrain.dernier = null;
    dessinerParrainage(null);
    chargerParrainage();
  }

  function fermerParrainage() {
    var panneau = $("#zj-parrainage");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
  }

  function chargerParrainage() {
    compte.lireFilleuls().then(function (d) {
      if ($("#zj-parrainage").hidden) return;
      dessinerParrainage(Pr.normaliserFilleuls(d));
    });
  }

  function dessinerParrainage(f) {
    var corps = $("#zj-parrainage-corps");
    if (!corps) return;
    if (!lignee.maison) { corps.innerHTML = '<p class="zj-riwaq__vide">' + esc(Pr.PANNEAU.externe) + '</p>'; return; }
    var html = '<p class="zj-riwaq__vide">' + esc(Pr.PANNEAU.regles) + '</p>' +
      '<form id="zj-parrain-form" class="zj-parrain__form" novalidate>' +
        '<label for="zj-parrain-email" class="zj-visuel-cache">E-mail de la personne invitée</label>' +
        '<input id="zj-parrain-email" type="email" autocomplete="off" inputmode="email" placeholder="son adresse e-mail" required />' +
        '<button id="zj-parrain-bouton" type="submit" class="zj-bouton">Inviter</button>' +
      '</form>' +
      '<p id="zj-parrain-msg" class="zj-msg" hidden></p>' +
      '<div id="zj-parrain-lien"></div>';
    if (f) {
      html += '<p class="zj-majliss__quand"><span>' + esc(Pr.placesTexte(f)) + '</span></p>';
      html += '<h3 class="zj-majliss__titre">Mes invitations</h3>';
      html += f.invitations.length
        ? '<ul class="zj-majliss__liste">' + f.invitations.map(function (i) {
            return '<li><div><strong>' + esc(i.email) + '</strong></div>' +
              '<div class="zj-majliss__ligne"><span class="zj-parrain__etat' + (i.etat === "acceptee" ? ' zj-parrain__etat--ok' : '') + '">' + esc(i.libelle) + '</span>' +
              (i.filleul ? '<span class="zj-majliss__quand">' + esc(i.filleul) + '</span>' : '') +
              (i.etat === "attente" && i.code ? '<button type="button" class="zj-bouton zj-bouton--discret" data-retirer="' + esc(i.code) + '">Retirer</button>' : '') +
              '</div></li>';
          }).join("") + '</ul>'
        : '<p class="zj-riwaq__vide">Personne encore. La cour attend ceux dont tu répondras.</p>';
    } else html += '<p class="zj-riwaq__vide">On regarde tes invitations…</p>';
    corps.innerHTML = html;

    var form = $("#zj-parrain-form");
    if (form) form.addEventListener("submit", function (ev) { ev.preventDefault(); envoyerParrainage(); });
    if (parrain.dernier) dessinerLien(parrain.dernier);
    $$("#zj-parrainage-corps [data-retirer]").forEach(function (b) {
      b.addEventListener("click", function () {
        b.disabled = true;
        compte.retirerInvitation(b.getAttribute("data-retirer")).then(function (r) {
          if (!r.ok) { b.disabled = false; message("#zj-parrain-msg", r.erreur, "ko"); return; }
          chargerParrainage();
        });
      });
    });
  }

  function envoyerParrainage() {
    if (parrain.envoi) return;
    var champ = $("#zj-parrain-email");
    var v = Pr.validerEmail(champ.value);
    if (!v.ok) { message("#zj-parrain-msg", v.texte, "ko"); champ.focus(); return; }
    parrain.envoi = true;
    var bouton = $("#zj-parrain-bouton");
    bouton.disabled = true;
    message("#zj-parrain-msg", "On prépare l'invitation…", "");
    compte.parrainer(v.email).then(function (r) {
      parrain.envoi = false;
      bouton.disabled = false;
      message("#zj-parrain-msg", Pr.envoiTexte(r), r && r.ok ? "ok" : "ko");
      if (!r || !r.ok) return;
      champ.value = "";
      parrain.dernier = r;
      sonner("page_dlg");
      compte.lireFilleuls().then(function (d) {
        if ($("#zj-parrainage").hidden) return;
        var msg = $("#zj-parrain-msg");
        var garde = msg ? { t: msg.textContent, c: msg.className } : null;
        dessinerParrainage(Pr.normaliserFilleuls(d));
        if (garde) { message("#zj-parrain-msg", garde.t, /ko/.test(garde.c) ? "ko" : "ok"); }
      });
    });
  }

  function dessinerLien(r) {
    var bloc = $("#zj-parrain-lien");
    if (!bloc || !r || !r.lien) return;
    bloc.innerHTML = '<div class="zj-parrain__lien">' +
      '<label for="zj-parrain-url" class="zj-visuel-cache">Le lien d\'invitation</label>' +
      '<input id="zj-parrain-url" type="text" readonly value="' + esc(r.lien) + '" />' +
      '<button id="zj-parrain-copier" type="button" class="zj-bouton zj-bouton--discret">Copier le lien</button>' +
      '</div>';
    var url = $("#zj-parrain-url"), copier = $("#zj-parrain-copier");
    copier.addEventListener("click", function () {
      var fait = function () { copier.textContent = "Lien copié"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(r.lien).then(fait, function () { url.select(); try { document.execCommand("copy"); fait(); } catch (e) { /* on laisse le champ sélectionné */ } });
      } else { url.select(); try { document.execCommand("copy"); fait(); } catch (e) { /* idem */ } }
    });
  }

  // ---- LE SOUK : dehors des murs, LA ferracha -----------------------------------------
  // On y entre par le Bab. v3.7 — UNE SEULE FERRACHA : ce que le Souk montre
  // est la table des ferrachas du SITE (zawia_projets, tenue par les fonctions
  // Netlify), lue et écrite par /.netlify/functions/zawia-souk sur la même
  // origine. Poser ici = poser sur sa ferracha ; l'inverse aussi. Qui a un
  // tapis se décide EN BASE (le dossier accepté) : le jeu n'a plus ni seuil de
  // points ni table à lui. Ici on dit pourquoi une porte est fermée, et on
  // vérifie avant d'envoyer ce que la fonction revérifie.
  // v5.7 — `vue` : { source: "tout" } le Souk entier (le dellal, le menu sur la place) ;
  // { source: "mien" } ma ferracha seule (ma place) ; { source: "place", cible } le
  // tapis d'un autre (son étal). La cible se retrouve par son compte de jeu, son
  // adresse ou son nom : la liste a pu bouger depuis l'entrée sur la place.
  function ouvrirSouk(vue) {
    if (maisonSalleMuette("souk")) return;   // Bab — muette chez une maison
    var panneau = $("#zj-souk");
    if (!panneau) return;
    basculerMenu(false);
    fermerDialogue();
    panneau.hidden = false;
    document.body.setAttribute("data-question", "1");
    souk.vue = vue && vue.source ? vue : { source: "tout" };
    var f = $("#zj-souk-fermer");
    if (f) { f.textContent = rahba.active || souk.vue.source === "mien" ? "Fermer" : "Rentrer"; f.focus(); }
    souk.fiche = null;
    souk.edition = null;
    $("#zj-souk-corps").innerHTML = '<p class="zj-riwaq__vide">On traverse le Bab…</p>';
    compte.lireSouk().then(function (d) {
      souk.tapis = (d && d.tapis) || [];
      souk.moi = (d && d.moi) || { membre: false, raison: "panne" };
      souk.devoile = !!(d && d.devoile);
      rendreSouk();
      if (souk.vue && souk.vue.source === "derb") chargerParrainages();   // v8.7
      // v3.6 — le pas « ferracha » du tutoriel : qui a déjà un tapis l'a
      // prouvé ; en atelier le Souk est fermé ; et si la fonction ne
      // reconnaît pas le joueur (v4.3 : tout joueur admis étale, même sans
      // dossier) on ne le retient pas devant une porte fermée.
      if (!souk.moi.membre || miens().length || compte.mode === "local") tutorielEvenement("etal");
    });
  }

  function miens() { return souk.moi && Array.isArray(souk.moi.projets) ? souk.moi.projets : []; }

  // 23/09/2026 — MA FERRACHA, D'UN GESTE. Le soir de l'ouverture, le Morchid n'a trouvé
  // sa ferracha ni au menu ni au Souk : le menu n'en disait rien, et sur la Rahba son
  // étal — le plus garni de la place — était le dix-septième, au fond. Le panneau
  // s'ouvre donc sur MON tapis, d'où que je sois (menu, touche F), et mène à mon
  // étal par le fil d'or. Rien de neuf côté base : c'est la vue « mien » du Souk.
  function ouvrirMaFerracha() {
    if (maisonSalleMuette("souk")) return;   // Bab — muette chez une maison
    if (dayf.actif) return;
    ouvrirSouk({ source: "mien" });
  }
  function allerAMonEtal() {
    if (dayf.actif || !Rb) return;
    fermerSouk(); basculerMenu(false);
    if (rahba.active && rahba.mienne) { viserMonEtal(); return; }
    rahba.viserMienne = true;   // chargerRahba posera le fil quand la place sera lue
    if (!rahba.active) entrerRahba();
  }
  function viserMonEtal() {
    var m = rahba.mienne;
    if (!rahba.active || !m) return;
    guide.tuile = { x: m.x + 1, y: m.y + Rb.ETAL };   // la tuile devant mon tapis (celle où le Voilé m'attend)
    guide.fil = null; guide.deTuile = ""; guide.jeu = true;
  }

  function fermerSouk() {
    var panneau = $("#zj-souk");
    if (!panneau || panneau.hidden) return;
    panneau.hidden = true;
    document.body.setAttribute("data-question", "0");
    souk.tapis = null;   // relu à la prochaine ouverture : un tapis bouge
    souk.fiche = null;
    souk.edition = null;
    souk.vue = null;
    souk.derbNeuf = false;   // v8.7
    if (rahba.active) chargerRahba();   // v5.7 — un tapis posé ou retiré : la place se redessine
    libererTutoriel();
  }

  // L'adresse d'une ferracha sur le site de la maison : le même domaine que
  // le jeu, sans son « l3b. » — aucun nom écrit ici. En local, pas d'adresse.
  function adresseSite(chemin) {
    var h = String(location.hostname || "");
    if (!/zawia\.tech$/i.test(h)) return null;
    return "https://" + h.replace(/^l3b\./i, "") + (chemin || "/");
  }
  function adresseFerracha(slug) {
    return slug ? adresseSite("/ferracha?f=" + encodeURIComponent(slug)) : null;
  }

  // v4.4 — LA VITRINE (17/09/2026, demande de Youssef : « une ferracha
  // exceptionnelle à regarder — une vraie fiche, une belle affiche, une belle
  // photo, une vue de haut style inventaire, et quand on clique on découvre »).
  // Chaque tapis est vu de haut : une grille de cases, une affiche par case.
  // Un clic ouvre la FICHE dans le panneau (affiche, capture, accroche, ce que
  // ça règle, pour qui, description, « Découvrir »), ← → pour passer au
  // suivant, Échap pour revenir au Souk. Sans image, l'affiche est une lettre
  // sur une teinte tirée du nom (souk.js) — jamais une case vide.
  // v-tranche B : la PREMIÈRE IMAGE DE LA GALERIE fait le visage du produit
  // quand la maison n'a pas posé d'affiche. C'était le vrai manque : `affiche`
  // exige un fichier committé par la maison — un membre ne pouvait donc JAMAIS
  // donner un visage à son produit, et les seules cases en image étaient
  // celles de la maison. Une image qu'il pose lui-même en fait une.
  function vignette(p, grande) {
    var src = p.affiche || (p.galerie && p.galerie.length && compte.urlImage ? compte.urlImage(p.galerie[0]) : "");
    if (src) {
      return '<img src="' + esc(src) + '" alt="" loading="' + (grande ? "eager" : "lazy") + '" decoding="async">';
    }
    var a = Sk.affiche(p.nom);
    return '<span class="zj-souk__lettre" style="--fond:' + a.fond + ";--encre:" + a.encre + '">' + esc(a.lettre) + "</span>";
  }

  function caseProduit(p, source, t, i) {
    var derb = p.derb === "tadamoun";   // v8.7 — un projet du Derb, dans ma ferracha : il porte sa marque verte
    return '<button type="button" class="zj-souk__case' + (p.visible === false ? " zj-souk__case--masque" : "") + (derb ? " zj-souk__case--derb" : "") + '" data-source="' + source + '" data-t="' + t + '" data-p="' + i + '">' +
      '<span class="zj-souk__vignette">' + vignette(p, false) + (derb ? '<span class="zj-souk__marque-derb">Derb</span>' : "") + "</span>" +
      '<span class="zj-souk__etiquette">' + esc(p.nom) + "</span>" +
    "</button>";
  }

  // Les produits d'une source : « mien » (ma ferracha, avec id) ou « place »
  // (le tapis nº t du Souk).
  function produitsDe(source, t) {
    if (source === "mien") return miens().map(Sk.produit);
    if (source === "derb") return derbVisibles().map(function (x) { return x.projet; });   // v8.7
    var e = Sk.etat(souk.tapis);
    return (e.tapis[t] && e.tapis[t].produits) || [];
  }

  // LA FICHE SE SUFFIT (20/09/2026) — la FAQ du marchand : les paires déjà
  // écrites, plus UNE case vide (jamais cinq d'un coup : on remplit une
  // question à la fois, et le tapis ne ressemble pas à un formulaire d'impôts).
  function champsFaq(faq) {
    var liste = Sk.faq(faq), n = Math.min(Sk.FAQ_MAX, liste.length + 1), html = "", i;
    for (i = 0; i < n; i++) {
      var e = liste[i] || { q: "", r: "" };
      html += '<div class="zj-souk__faq-paire">' +
        '<label>Question<input id="zj-souk-faq-q' + i + '" type="text" maxlength="' + Sk.FAQ_Q_MAX + '" placeholder="Ce qu\'on te demande souvent" value="' + esc(e.q) + '"></label>' +
        '<label>Réponse<textarea id="zj-souk-faq-r' + i + '" rows="2" maxlength="' + Sk.FAQ_R_MAX + '">' + esc(e.r) + "</textarea></label>" +
      "</div>";
    }
    return '<div class="zj-souk__faq-champs"><p class="zj-kicker">Questions fréquentes</p>' + html + "</div>";
  }

  // Ce que les cases disent au moment de l'envoi — souk.js jette les paires
  // boiteuses, et la fonction le revérifie.
  function lireFaq() {
    var out = [], i;
    for (i = 0; i < Sk.FAQ_MAX; i++) {
      var q = $("#zj-souk-faq-q" + i), r = $("#zj-souk-faq-r" + i);
      if (q && r) out.push({ q: q.value, r: r.value });
    }
    return out;
  }

  // LA GALERIE (tranche B, 20/09/2026) : les images que le marchand pose
  // lui-même. Elles vivent dans le seau du projet du jeu ; la fiche n'en garde
  // que le CHEMIN, et l'adresse se compose ici (compte.urlImage).
  function vignettesGalerie() {
    return (souk.galerie || []).map(function (c) {
      return '<figure class="zj-souk__gal-item">' +
        '<img src="' + esc(compte.urlImage ? compte.urlImage(c) : "") + '" alt="" loading="lazy" decoding="async">' +
        '<button type="button" class="zj-souk__gal-retirer" data-chemin="' + esc(c) + '" aria-label="Retirer cette image">✕</button>' +
      "</figure>";
    }).join("");
  }
  function champsGalerie() {
    return '<div class="zj-souk__gal"><p class="zj-kicker">Les images</p>' +
      '<div id="zj-souk-gal-liste" class="zj-souk__gal-liste">' + vignettesGalerie() + "</div>" +
      '<label class="zj-souk__gal-ajout">Ajouter une image<input id="zj-souk-gal-fichier" type="file" accept="image/webp,image/jpeg,image/png"></label>' +
      '<p id="zj-souk-gal-mot" class="zj-souk__regle" role="status"></p></div>';
  }
  function motGalerie(t) { var el = $("#zj-souk-gal-mot"); if (el) el.textContent = t || ""; }
  // ⚠️ On redessine la GALERIE seule, jamais le panneau : redessiner viderait
  // les cases déjà remplies (la leçon de la v3.6).
  function redessinerGalerie() {
    var l = $("#zj-souk-gal-liste");
    if (!l) return;
    l.innerHTML = vignettesGalerie();
    cablerGalerie();
  }
  function cablerGalerie() {
    $$("#zj-souk-gal-liste .zj-souk__gal-retirer").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-chemin");
        souk.galerie = (souk.galerie || []).filter(function (x) { return x !== c; });
        if (compte.retirerImage) compte.retirerImage(c);
        redessinerGalerie();
        motGalerie("");
      });
    });
  }

  // v8.7 — LE DERB T-TADAMOUN : une ligne de la ferracha peut être un projet solidaire.
  // Le choix se fait en tête du formulaire ; les champs du Derb n'apparaissent qu'au Derb,
  // et basculer ne redessine rien (la leçon de la v3.6 : on ne vide pas ce qu'on a tapé).
  function champsDerb(p) {
    var options = function (liste, choisi, vide) {
      return (vide ? '<option value="">' + esc(vide) + "</option>" : "") + liste.map(function (e) {
        return '<option value="' + esc(e.cle) + '"' + (e.cle === choisi ? " selected" : "") + ">" + esc(nomAr(e)) + "</option>";
      }).join("");
    };
    var besoins = p.besoins || [];
    return '<fieldset id="zj-souk-derb-champs" class="zj-souk__derb"' + (p.derb === "tadamoun" ? "" : " hidden") + ">" +
      "<p class=\"zj-souk__regle\">Au Derb, pas de prix et pas d'affaire : ton projet dit ce qu'il change et ce dont il a besoin. La zawia n'y prend rien.</p>" +
      "<label>Ce qu'est ton projet<select id=\"zj-souk-forme\">" + options(Tm.FORMES, p.forme, "Choisis…") + "</select></label>" +
      '<label>Où tu en es<select id="zj-souk-stade">' + options(Tm.STADES, p.stade || "idee") + "</select></label>" +
      '<label>Ce que ça change<textarea id="zj-souk-impact" rows="3" maxlength="' + Tm.IMPACT_MAX + '" placeholder="Qui en profite, où, combien">' + esc(p.impact || "") + "</textarea></label>" +
      '<fieldset class="zj-souk__besoins"><legend>Ce dont tu as besoin</legend>' +
        Tm.BESOINS.map(function (b) {
          return '<label class="zj-souk__besoin"><input type="checkbox" name="zj-souk-besoin" value="' + esc(b.cle) + '"' + (besoins.indexOf(b.cle) >= 0 ? " checked" : "") + "><span>" + esc(nomAr(b)) + "</span></label>";
        }).join("") +
      "</fieldset>" +
    "</fieldset>";
  }
  function formulaireSouk(p) {
    var edition = !!(p && p.id);
    p = p || {};
    souk.galerie = Sk.galerie(p.galerie);   // l'état de la galerie pendant que le formulaire vit
    var derb = p.derb === "tadamoun" || (!edition && souk.derbNeuf);   // v8.7
    if (derb && p.derb !== "tadamoun") p = Object.assign({}, p, { derb: "tadamoun" });
    return '<form id="zj-souk-form" class="zj-souk__form"' + (edition ? ' data-id="' + esc(p.id) + '"' : "") + ' autocomplete="off">' +
      (Tm ? '<fieldset class="zj-souk__ou"><legend>Où le poser ?</legend>' +
        '<label class="zj-souk__ou-choix"><input type="radio" name="zj-souk-derb" value="souk"' + (derb ? "" : " checked") + '><span>Au Souk — un produit, un service</span></label>' +
        '<label class="zj-souk__ou-choix zj-souk__ou-choix--derb"><input type="radio" name="zj-souk-derb" value="tadamoun"' + (derb ? " checked" : "") + '><span>Au Derb t-Tadamoun — un projet solidaire</span></label>' +
      "</fieldset>" : "") +
      '<label><span id="zj-souk-nom-mot">' + (derb ? "Le projet" : "Le produit") + '</span><input id="zj-souk-produit" type="text" maxlength="' + Sk.NOM_MAX + '" required placeholder="Son nom, simplement" value="' + esc(p.nom || "") + '"></label>' +
      '<label>Ce que ça règle<input id="zj-souk-regle" type="text" maxlength="' + Sk.RESOUT_MAX + '" placeholder="Le problème que ça enlève à quelqu\'un" value="' + esc(p.resout || "") + '"></label>' +
      '<label>Le lien<input id="zj-souk-url" type="text" inputmode="url" autocapitalize="off" spellcheck="false" maxlength="' + Sk.LIEN_MAX + '" placeholder="https://…" value="' + esc(p.lien || "") + '"></label>' +
      (Tm ? champsDerb(p) : "") +
      '<details class="zj-souk__plus"' + (edition ? " open" : "") + "><summary>Une vraie fiche (facultatif)</summary>" +
        '<label>L\'accroche<input id="zj-souk-accroche" type="text" maxlength="' + Sk.ACCROCHE_MAX + '" placeholder="Une phrase qui donne envie" value="' + esc(p.accroche || "") + '"></label>' +
        '<label>Pour qui<input id="zj-souk-pourqui" type="text" maxlength="' + Sk.POUR_QUI_MAX + '" placeholder="Qui s\'en sert" value="' + esc(p.pourQui || "") + '"></label>' +
        '<label>La description<textarea id="zj-souk-description" rows="5" maxlength="' + Sk.DESCRIPTION_MAX + '" placeholder="Ce que c\'est, comment ça marche, ce qui le distingue">' + esc(p.description || "") + "</textarea></label>" +
        '<label>Ce que l\'acheteur reçoit<input id="zj-souk-livre" type="text" maxlength="' + Sk.LIVRE_MAX + '" placeholder="Un fichier, un accès, une séance…" value="' + esc(p.livre || "") + '"></label>' +
        '<label>En combien de temps<input id="zj-souk-delai" type="text" maxlength="' + Sk.DELAI_MAX + '" placeholder="Tout de suite, sous 48 h, une semaine…" value="' + esc(p.delai || "") + '"></label>' +
        '<label>La fiche complète<textarea id="zj-souk-fiche" rows="10" maxlength="' + Sk.CORPS_MAX + '" placeholder="Tout ce qu\'il faut savoir pour décider, ici — sans avoir à sortir. Les titres s\'écrivent avec # et les listes avec -.">' + esc(p.corps || "") + "</textarea></label>" +
        champsFaq(p.faq) +
        champsGalerie() +
      "</details>" +
      '<div class="zj-souk__actions">' +
        '<button type="submit" class="zj-bouton" id="zj-souk-envoyer">' + (edition ? "Enregistrer la fiche" : (derb ? "Poser au Derb" : "Étaler")) + "</button>" +
        (edition ? '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-souk-annuler">Annuler</button>' : "") +
      "</div>" +
    "</form>";
  }

  // ---- v8.7 — LE DERB T-TADAMOUN (درب التضامن) : les projets solidaires -------------------------
  // Le Souk montre des produits ; le Derb, des projets qui ont besoin des autres. Même table,
  // même ferracha (tadamoun.js) — mais ni prix ni affaire : on y AIDE (un mot au porteur,
  // par les Rasa'il) ou on y PARRAINE (une entreprise écrit au bureau). Aucun point.
  // ⚠️ Ce qu'un membre a écrit (nom, porteur, ce que ça change) porte translate="no" et
  //    dir="auto" : la version arabe ne traduit jamais les mots d'un membre.
  function ongletsSouk(vue, e) {
    var actif = vue.source === "place" ? "tout" : vue.source;
    var n = e && e.projets ? e.projets : 0;
    return '<nav class="zj-souk__onglets" aria-label="Le Souk">' + [["tout", "Le Souk"], ["derb", "Tadamoun"], ["mien", "Ma ferracha"]].map(function (o) {
      return '<button type="button" class="zj-souk__onglet' + (o[0] === "derb" ? " zj-souk__onglet--derb" : "") + (o[0] === actif ? " zj-souk__onglet--actif" : "") + '" aria-pressed="' + (o[0] === actif) + '" data-souk-vue="' + o[0] + '">' +
        "<bdi>" + esc(o[1]) + "</bdi>" + (o[0] === "derb" && n ? '<span class="zj-souk__onglet-n">' + n + "</span>" : "") + "</button>";   // ⚠️ pas zj-pastille : elle est posée pour la Barre
    }).join("") + "</nav>";
  }
  // La ruelle telle qu'on la regarde : un porteur seul (venu de son tapis), puis les filtres.
  function derbVisibles() {
    if (!Tm) return [];
    var e = Sk.etat(souk.tapis), vue = souk.vue || {};
    var l = Tm.liste(e.tapis);
    if (vue.source === "derb" && vue.cible) {
      var ti = indiceTapis(e.tapis, vue.cible);
      if (ti >= 0) l = l.filter(function (x) { return x.t === ti; });
    }
    return Tm.filtrer(l, souk.derbFiltre);
  }
  function renvoiDerb(t) {
    return '<div class="zj-souk__renvoi-derb"><p>Son projet est au Derb t-Tadamoun :</p><p translate="no" dir="auto"><strong>' +
      t.derb.map(function (p) { return esc(p.nom); }).join(" · ") + "</strong></p>" +
      '<button type="button" class="zj-bouton zj-bouton--discret" data-derb-porteur="' + esc(t.joueur || "") + '" data-derb-slug="' + esc(t.slug || "") + '" data-derb-nom="' + esc(t.nom) + '">Le voir au Derb</button></div>';
  }
  function carteDerb(x, i) {
    var p = x.projet, t = x.tapis;
    var besoins = (p.besoins || []).map(function (b) { return "<li>" + esc(nomAr(Tm.trouver(Tm.BESOINS, b))) + "</li>"; }).join("");
    return '<article class="zj-derb__projet">' +
      '<div class="zj-derb__etiquettes"><span class="zj-derb__forme">' + esc(nomAr(Tm.trouver(Tm.FORMES, p.forme))) + '</span><span class="zj-derb__stade">' + esc(nomAr(Tm.trouver(Tm.STADES, p.stade))) + "</span></div>" +
      '<h5 translate="no" dir="auto">' + esc(p.nom) + "</h5>" +
      '<div class="zj-derb__porteur"><p>Porté par</p><p translate="no" dir="auto">' + esc(t.nom) + "</p></div>" +
      (p.impact ? '<p class="zj-derb__impact" translate="no" dir="auto">' + esc(p.impact) + "</p>" : "") +
      (besoins ? '<ul class="zj-derb__besoins">' + besoins + "</ul>" : "") +
      '<button type="button" class="zj-derb__ouvrir" data-derb-i="' + i + '">Voir le projet</button>' +
    "</article>";
  }
  function sectionDerb(e, moi, droit) {
    var vue = souk.vue || {}, seul = vue.cible ? indiceTapis(e.tapis, vue.cible) : -1;
    var toute = Tm.liste(e.tapis), c = Tm.compter(toute), l = derbVisibles(), f = souk.derbFiltre || {};
    var choix = function (nom, tous, liste) {
      return '<select data-derb-filtre="' + nom + '" aria-label="' + esc(tous) + '"><option value="">' + esc(tous) + "</option>" +
        liste.map(function (x) { return '<option value="' + esc(x.cle) + '"' + (f[nom] === x.cle ? " selected" : "") + ">" + esc(nomAr(x)) + "</option>"; }).join("") + "</select>";
    };
    var html = '<section class="zj-derb">' +
      '<header class="zj-derb__tete"><p class="zj-derb__ar" lang="ar" translate="no">درب التضامن</p>' +
        "<h4>" + (seul >= 0 ? esc(e.tapis[seul].nom) : "Le Derb t-Tadamoun") + "</h4>" +
        "<p>Ici, pas de produits à vendre : des projets qui ont besoin des autres — une coopérative, une association, une entreprise sociale, un projet RSE, une initiative de quartier, ou une idée.</p>" +
        '<p class="zj-derb__regle">La zawia n\'y prend rien : pas de smsra sur la solidarité.</p></header>';
    if (!toute.length) {
      html += '<p class="zj-souk__vide">Aucun projet dans la ruelle pour l\'instant. Le premier qui pose le sien l\'ouvre pour tous.</p>';
    } else {
      if (seul < 0) {
        html += '<p class="zj-souk__compte">' + c.projets + " projet" + (c.projets > 1 ? "s" : "") + " · " + c.porteurs + " porteur" + (c.porteurs > 1 ? "s" : "") + "</p>" +
          '<div class="zj-derb__filtres">' + choix("besoin", "Tous les besoins", Tm.BESOINS) + choix("forme", "Toutes les formes", Tm.FORMES) + "</div>";
      } else {
        html += '<p class="zj-souk__regle"><button type="button" class="zj-bouton zj-bouton--discret" data-souk-vue="derb">Tous les projets du Derb</button></p>';
      }
      html += l.length ? '<div class="zj-derb__liste">' + l.map(carteDerb).join("") + "</div>"
        : '<p class="zj-souk__vide">Aucun projet ne répond à ces filtres.</p>';
    }
    // poser le sien : la même ferracha, un autre derb
    if (!dayf.actif) {
      html += '<div class="zj-derb__poser"><p>Tu portes un projet solidaire, même à l\'état d\'idée ?</p>' +
        (moi && moi.membre
          ? '<button type="button" class="zj-bouton" data-derb-poser="1">Poser mon projet au Derb</button>'
          : '<p class="zj-souk__regle">' + esc((droit && droit.texte) || "") + "</p>") + "</div>";
    }
    return html + "</section>";
  }
  // Le bloc d'un projet du Derb, sous sa fiche : ce qu'il est, ce qu'il change, ce qu'il
  // cherche — et les deux gestes : aider (au porteur), parrainer (au bureau).
  function blocDerb(p, tapis, f) {
    if (!Tm || p.derb !== "tadamoun") return "";
    var mien = f.source === "mien" || !!(tapis && tapis.moi);
    var peutAider = !mien && !dayf.actif && !!(tapis && tapis.joueur) && !!Rl;
    var html = '<section class="zj-derb__bloc">' +
      '<div class="zj-derb__etiquettes"><span class="zj-derb__forme">' + esc(nomAr(Tm.trouver(Tm.FORMES, p.forme))) + '</span><span class="zj-derb__stade">' + esc(nomAr(Tm.trouver(Tm.STADES, p.stade))) + "</span></div>";
    if (p.impact) html += '<div class="zj-derb__change"><p class="zj-kicker">Ce que ça change</p><p translate="no" dir="auto">' + esc(p.impact) + "</p></div>";
    if (p.besoins && p.besoins.length) {
      html += '<div class="zj-derb__cherche"><p class="zj-kicker">Ce dont le projet a besoin</p><ul class="zj-derb__besoins">' + p.besoins.map(function (b) {
        var n = esc(nomAr(Tm.trouver(Tm.BESOINS, b)));
        return "<li>" + (peutAider ? '<button type="button" data-derb-aider="' + esc(b) + '" title="Je peux aider pour ça">' + n + "</button>" : n) + "</li>";
      }).join("") + "</ul></div>";
    }
    if (mien) {
      html += '<p class="zj-souk__regle">C\'est ton projet. Qui veut aider t\'écrira : regarde tes messages.</p>';
    } else if (dayf.actif) {
      html += '<p class="zj-souk__regle">Entre dans la maison pour écrire à son porteur, ou proposer un parrainage.</p>';
    } else {
      html += '<div class="zj-souk__actions">' +
        (peutAider ? '<button type="button" class="zj-bouton" data-derb-aider="">Je peux aider</button>' : "") +
        (tapis && tapis.joueur && Bq ? '<button type="button" class="zj-bouton zj-bouton--discret" data-souk-carte="' + esc(tapis.joueur) + '" data-souk-nom="' + esc(tapis.nom) + '">Sa carte</button>' : "") +
        (p.id ? '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-derb-parrainer-ouvrir">Parrainer (RSE)</button>' : "") +
      "</div>";
      if (!(tapis && tapis.joueur)) html += '<p class="zj-souk__regle">Son porteur n\'est pas encore entré dans la cour : ton aide attendra qu\'il y passe. Le bureau, lui, peut déjà faire le lien.</p>';
      var mes = (souk.parrainages || []).filter(function (x) { return x && x.projet === p.id; });
      if (mes.length) {
        html += '<div class="zj-derb__statut"><p class="zj-kicker">Ta proposition de parrainage</p><p>' + esc(nomAr(Tm.trouver(Tm.ETATS, mes[0].etat) || Tm.ETATS[0])) + "</p>" +
          (mes[0].note ? '<p translate="no" dir="auto">' + esc(mes[0].note) + "</p>" : "") + "</div>";
      }
      if (p.id) {
        html += '<form id="zj-derb-parrainer" class="zj-souk__form zj-derb__parrainer" hidden autocomplete="off">' +
          "<p>Une entreprise peut adopter ce projet : un financement, un local, du mentorat, des bénévoles de ses équipes. Ta proposition part au bureau de la maison : il vérifie, fait le lien avec le porteur, et grave à la Rkhama l'entreprise qui s'engage.</p>" +
          '<label>Au nom de quelle entreprise<input id="zj-derb-entreprise" type="text" maxlength="' + Tm.ENTREPRISE_MAX + '" required placeholder="Le nom de l\'entreprise"></label>' +
          '<label>Ce que vous proposez (facultatif)<textarea id="zj-derb-mot" rows="3" maxlength="' + Tm.MOT_MAX + '" placeholder="Un financement, un local, du mentorat, des bénévoles…"></textarea></label>' +
          '<div class="zj-souk__actions"><button type="submit" class="zj-bouton">Envoyer au bureau</button><button type="button" class="zj-bouton zj-bouton--discret" id="zj-derb-parrainer-annuler">Annuler</button></div>' +
        "</form>";
      }
    }
    return html + '<p class="zj-souk__note">Ici, la zawia ne prend rien : pas de smsra sur la solidarité.</p></section>';
  }
  // « Je peux aider » : le fil avec le porteur s'ouvre, le premier mot déjà écrit — il ne part pas seul.
  function aiderDerb(besoin) {
    var f = souk.fiche, x = f && f.source === "derb" ? derbVisibles()[f.p] : null;
    if (!x || !x.tapis || !x.tapis.joueur || !x.projet) return;
    var t = x.tapis, texte = Tm.messageAide(x.projet.nom, besoin || "", !!(Lg && Lg.estAr()));
    fermerSouk();
    ouvrirFil(t.joueur, t.nom, null, texte);
  }
  // `message` : ce qu'on vient de dire (« c'est parti au bureau ») — le redessin le garde.
  function chargerParrainages(message) {
    if (!Tm || !compte || typeof compte.mesParrainages !== "function" || dayf.actif) return;
    compte.mesParrainages().then(function (r) {
      souk.parrainages = r && r.ok && Array.isArray(r.liste) ? r.liste : [];
      // la fiche se redessine seulement si l'on n'est pas en train d'écrire une proposition
      var form = $("#zj-derb-parrainer");
      if (souk.fiche && souk.fiche.source === "derb" && (!form || form.hidden)) rendreSouk(message);
    });
  }

  function rendreSouk(message) {
    var corps = $("#zj-souk-corps");
    if (!corps) return;
    if (souk.fiche) { rendreFiche(message); return; }
    var e = Sk.etat(souk.tapis);
    var moi = souk.moi || { membre: false, raison: "panne" };
    var mes = miens().map(Sk.produit);
    var droit = Sk.peutEtaler(moi, mes.length);
    var html = "";
    // v5.7 — depuis la Rahba : mon étal seul, ou le tapis d'un autre seul
    var vue = souk.vue || { source: "tout" }, seul = -1;
    if (vue.source === "place") { seul = indiceTapis(e.tapis, vue.cible); if (seul < 0) vue = { source: "tout" }; }
    if (joueur && moi.membre && mes.length) poserWird(Wd && Wd.marquerSalle(joueur.recit, "souk"));   // v3.6 — la ferracha est posée
    if (message) {
      html += '<p class="zj-souk__mot' + (message.erreur ? ' zj-souk__mot--non' : '') + '">' + esc(message.texte) + "</p>";
    }
    // v8.7 — trois onglets : le Souk, le Derb t-Tadamoun, ma ferracha
    if (Tm) html += ongletsSouk(vue, e);
    if (Tm && vue.source === "derb") html += sectionDerb(e, moi, droit);

    // ---- Ma ferracha : la même qu'on tient sur le site, et le tapis pour en poser un de plus
    if (vue.source !== "place" && vue.source !== "derb") {
    html += '<section class="zj-souk__mienne"><h4>Ta ferracha</h4>';
    // 23/09/2026 — ouverte depuis le menu (ou la touche F) : le chemin vers tout le reste
    if (vue.source === "mien") {
      html += '<div class="zj-souk__raccourcis">' +
        (Rb ? '<button type="button" class="zj-bouton zj-bouton--ferracha" data-souk-etal="1">' + (rahba.active ? "Le fil d'or jusqu'à mon étal" : "Mon étal sur la Rahba") + "</button>" : "") +
        '<button type="button" class="zj-bouton zj-bouton--discret" data-souk-vue="tout">Tout le Souk</button>' +
      "</div>";
    }
    if (moi.membre) {
      if (mes.length) {
        html += '<div class="zj-souk__tapis zj-souk__tapis--mien"><div class="zj-souk__grille">' +
          mes.map(function (p, i) { return caseProduit(p, "mien", 0, i); }).join("") + "</div></div>";
      } else {
        html += '<p class="zj-souk__vide">Ton tapis est vide. Ce que tu poses ici, les autres le voient.</p>';
      }
      if (souk.edition) {
        var aEditer = mes.filter(function (p) { return p.id === souk.edition; })[0];
        html += aEditer ? formulaireSouk(aEditer) : "";
      } else if (droit.oui) {
        html += formulaireSouk(null);
      } else {
        html += '<p class="zj-souk__regle">' + esc(droit.texte) + "</p>";
      }
      if (moi.voie === "joueur") {
        // v4.3 — sans dossier accepté : le tapis vit dans la table du site,
        // rattaché au compte de jeu, et devient la ferracha du site à
        // l'acceptation d'un dossier au même e-mail (zawia-souk.js, adopter).
        var enAttente = moi.dossier === "pas-fondateur";
        var siteJ = enAttente ? null : adresseSite("/");
        html += '<p class="zj-souk__regle">' + esc(enAttente
          ? "Ton tapis est gardé par la maison, et tout le Souk le voit sous ton nom de la cour. Ta fiche est bien arrivée : quand la maison l'aura acceptée, ce tapis sera aussi ta ferracha sur le site."
          : "Ton tapis est gardé par la maison, et tout le Souk le voit sous ton nom de la cour. Dépose ta fiche de membre sur le site avec le même e-mail : une fois acceptée, ce tapis sera aussi ta ferracha là-bas.") +
          (siteJ ? ' <a href="' + esc(siteJ) + '" target="_blank" rel="noopener noreferrer">Déposer ma fiche</a>' : "") + "</p>";
      } else {
        var adr = moi.publique ? adresseFerracha(moi.slug) : null;
        html += '<p class="zj-souk__regle">' + (moi.publique
          ? 'Le même tapis que ta ferracha sur le site de la maison.' + (adr ? ' <a href="' + esc(adr) + '" target="_blank" rel="noopener noreferrer">La voir</a>' : "")
          : 'Ce tapis est le tien. Il ne s\'affiche en public que si tu as coché « le mur » sur ta fiche.') + "</p>";
      }
    } else {
      var site = droit.fiche ? adresseSite("/") : null;
      html += '<p class="zj-souk__regle">' + esc(droit.texte) +
        (site ? ' <a href="' + esc(site) + '" target="_blank" rel="noopener noreferrer">Déposer ma fiche</a>' : "") + "</p>";
    }
    html += "</section>";
    }

    // ---- Le Souk des autres : chaque tapis vu de haut
    if (vue.source !== "mien" && vue.source !== "derb") {
    html += '<section class="zj-souk__place"><h4>' + (seul >= 0 ? esc(e.tapis[seul].nom) : "Le Souk") + "</h4>";
    if (e.vide) {
      html += '<p class="zj-souk__vide">Personne n\'a encore étalé. La place est à prendre.</p>';
    } else {
      if (seul < 0) html += '<p class="zj-souk__compte">' + e.marchands + " ferracha" + (e.marchands > 1 ? "s" : "") +
        " · " + e.produits + " produit" + (e.produits > 1 ? "s" : "") + "</p>";
      if (seul < 0 && e.projets) html += '<p class="zj-souk__compte zj-souk__compte--derb">' + e.projets + " projet" + (e.projets > 1 ? "s" : "") + " au Derb t-Tadamoun</p>";   // v8.7
      else if (Sf) html += '<p class="zj-souk__regle">' + esc(e.tapis[seul].joueur
        ? "Ouvre un produit : tu peux proposer ton prix. La zawia prend " + Sf.SMSRA_PCT + " % — la smsra — sur ce qui se conclut."
        : "Ce tapis se regarde : son marchand n'a pas encore ouvert son étal dans le jeu.") + "</p>";
      // 23/09/2026 — la vitrine : les tapis garnis d'abord (souk.js, ordreVitrine) ; les
      // vides ont leur place, en une ligne au bout — un fondateur y est même sans produit.
      var ordre = seul >= 0 ? [seul] : Sk.ordreVitrine(e.tapis);
      var enAttente = seul >= 0 ? [] : ordre.filter(function (ti) { return e.tapis[ti].vide; });
      if (seul < 0) ordre = ordre.filter(function (ti) { return !e.tapis[ti].vide; });
      html += ordre.map(function (ti) {
        var t = e.tapis[ti];
        var moiAussi = t.moi || (moi.membre && moi.slug && t.slug === moi.slug);
        var a = adresseFerracha(t.slug);
        return '<article class="zj-souk__tapis' + (moiAussi ? " moi" : "") + '">' +
          '<p class="zj-souk__qui">' + esc(t.nom) +
            (t.rang ? '<span class="zj-souk__rang">nº ' + esc(t.rang) + "</span>" : "") +
            (a ? ' <a class="zj-souk__lien" href="' + esc(a) + '" target="_blank" rel="noopener noreferrer">Sa ferracha</a>' : "") +
            // v8.6 — sa carte de membre (la Bitaqa) : qui il est, ce qu'il cherche, lui écrire
            (t.joueur && !moiAussi && Bq ? ' <button type="button" class="zj-souk__lien zj-souk__carte" data-souk-carte="' + esc(t.joueur) + '" data-souk-nom="' + esc(t.nom) + '">Sa carte</button>' : "") + "</p>" +
          (t.produits.length
            ? '<div class="zj-souk__grille">' + t.produits.map(function (p, i) { return caseProduit(p, "place", ti, i); }).join("") + "</div>"
            : (t.derb && t.derb.length ? renvoiDerb(t) : '<p class="zj-souk__vide">Rien d\'étalé encore.</p>')) +   // v5.7b — un fondateur a sa place même sans produit ; v8.7 — son projet peut être au Derb
        "</article>";
      }).join("");
      if (enAttente.length) {
        // la phrase et les noms dans deux <p> : langue.js traduit un paragraphe d'un bloc (la leçon du Wird)
        html += '<div class="zj-souk__attente"><p>' + esc(enAttente.length > 1 ? "Ils ont leur place, et rien d'étalé encore :" : "Il a sa place, et rien d'étalé encore :") +
          "</p><p><strong>" + enAttente.map(function (ti) { return esc(e.tapis[ti].nom); }).join(" · ") + "</strong></p></div>";
      }
    }
    html += "</section>";
    }
    html += '<p class="zj-souk__note">Le Souk est dehors des murs, et c\'est voulu : dans la maison on apprend, ici on montre. Un lien mène chez son auteur — la maison n\'en répond pas.</p>';

    corps.innerHTML = html;
    cablerSouk();
  }

  // v5.7 — retrouver un tapis dans la liste relue : son compte de jeu, son adresse, son nom.
  function indiceTapis(liste, cible) {
    if (!cible) return -1;
    for (var i = 0; i < liste.length; i++) {
      var t = liste[i];
      if ((cible.joueur && t.joueur === cible.joueur) || (cible.slug && t.slug === cible.slug) || (!cible.joueur && !cible.slug && t.nom === cible.nom)) return i;
    }
    return -1;
  }
  // v5.7 — proposer une affaire depuis la fiche d'un produit d'un AUTRE (safqa.js). Le
  // formulaire s'ouvre sous la fiche ; la base revérifie tout (zawia-safqa.sql).
  function affaireHtml(f, p, tapis) {
    if (!Sf || f.source !== "place" || !tapis) return "";
    if (p.derb === "tadamoun") return "";   // v8.7 — au Derb, pas d'affaire : la zawia ne prend rien sur la solidarité
    if (!tapis.joueur) return '<p class="zj-souk__regle zj-safqa__regle">Ce tapis se regarde : son marchand n\'a pas encore ouvert son étal dans le jeu.</p>';
    var regle = "La zawia prend " + Sf.SMSRA_PCT + " % — la smsra — sur chaque affaire conclue. Le règlement se fait entre vous ; le Souk tient la parole des deux.";
    return '<div class="zj-safqa__proposer" data-vendeur="' + esc(tapis.joueur) + '" data-produit="' + esc(p.id || "") + '" data-nom="' + esc(p.nom) + '">' +
      '<button type="button" class="zj-bouton" id="zj-safqa-ouvrir">Proposer une affaire</button>' +
      '<form id="zj-safqa-form" class="zj-souk__form" hidden autocomplete="off">' +
        '<label>Ton prix (MAD)<input id="zj-safqa-prix" type="text" inputmode="decimal" maxlength="12" placeholder="300" required></label>' +
        '<label>Un mot pour le vendeur (facultatif)<input id="zj-safqa-mot" type="text" maxlength="' + Sf.MOT_MAX + '" placeholder="Ce que tu attends, et quand"></label>' +
        '<p class="zj-safqa__partage" id="zj-safqa-partage" data-regle="' + esc(regle) + '">' + esc(regle) + "</p>" +
        '<div class="zj-souk__actions"><button type="submit" class="zj-bouton">Proposer</button><button type="button" class="zj-bouton zj-bouton--discret" id="zj-safqa-annuler">Annuler</button></div>' +
      "</form></div>";
  }

  // ---- La fiche d'un produit ----------------------------------------------------------------
  function rendreFiche(message) {
    var corps = $("#zj-souk-corps");
    var f = souk.fiche;
    var entrees = f.source === "derb" ? derbVisibles() : null;   // v8.7 — la ruelle : chaque projet avec son porteur
    var liste = entrees ? entrees.map(function (x) { return x.projet; }) : produitsDe(f.source, f.t);
    if (!liste.length) { souk.fiche = null; rendreSouk(message); return; }
    f.p = Math.max(0, Math.min(f.p, liste.length - 1));
    var p = liste[f.p];
    var tapis = f.source === "mien" ? null : entrees ? entrees[f.p].tapis : Sk.etat(souk.tapis).tapis[f.t];
    var qui = f.source === "mien" ? "Ta ferracha" : (tapis ? tapis.nom : "");
    // v8.7 — ce qu'un membre a écrit porte translate="no" et dir="auto" : la page arabe ne le
    // traduit pas, et un texte français y garde son sens de lecture (sa ponctuation au bout).
    var MB = ' translate="no" dir="auto"';
    var paragraphes = p.description ? p.description.split(/\n{2,}/).map(function (b) {
      return "<p" + MB + ">" + esc(b).replace(/\n/g, "<br>") + "</p>";
    }).join("") : "";
    var details = "";
    if (p.resout) details += "<div><dt>Ce que ça règle</dt><dd" + MB + ">" + esc(p.resout) + "</dd></div>";
    if (p.pourQui) details += "<div><dt>Pour qui</dt><dd" + MB + ">" + esc(p.pourQui) + "</dd></div>";
    // LA FICHE SE SUFFIT (20/09/2026) : ce qu'on reçoit et quand — les deux
    // questions qu'on partait poser ailleurs.
    if (p.livre) details += "<div><dt>Ce que tu reçois</dt><dd" + MB + ">" + esc(p.livre) + "</dd></div>";
    if (p.delai) details += "<div><dt>En combien de temps</dt><dd" + MB + ">" + esc(p.delai) + "</dd></div>";
    if (p.maturite) details += "<div><dt>État</dt><dd>" + esc(p.maturite) + "</dd></div>";
    if (p.type) details += "<div><dt>Nature</dt><dd>" + esc(p.type) + "</dd></div>";

    var html = "";
    if (message) html += '<p class="zj-souk__mot' + (message.erreur ? ' zj-souk__mot--non' : '') + '">' + esc(message.texte) + "</p>";
    html += '<article class="zj-souk__fiche" aria-live="polite">' +
      '<nav class="zj-souk__fiche-nav">' +
        '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-souk-retour">' + (f.source === "derb" ? "← Retour au Derb" : "← Retour au Souk") + "</button>" +
        '<span class="zj-souk__fiche-pos">' + (f.p + 1) + " / " + liste.length + "</span>" +
        '<span class="zj-souk__fiche-fleches">' +
          '<button type="button" class="zj-souk__fleche" id="zj-souk-precedent" aria-label="Précédent"' + (liste.length < 2 ? " disabled" : "") + ">‹</button>" +
          '<button type="button" class="zj-souk__fleche" id="zj-souk-suivant" aria-label="Suivant"' + (liste.length < 2 ? " disabled" : "") + ">›</button>" +
        "</span>" +
      "</nav>" +
      '<div class="zj-souk__fiche-corps">' +
        '<figure class="zj-souk__affiche">' + vignette(p, true) + "</figure>" +
        '<div class="zj-souk__fiche-texte">' +
          '<p class="zj-kicker"' + (f.source === "mien" ? "" : MB) + ">" + esc(qui) + "</p>" +
          "<h3" + MB + ">" + esc(p.nom) + "</h3>" +
          (p.accroche ? '<p class="zj-souk__accroche"' + MB + ">" + esc(p.accroche) + "</p>" : "") +
          (details ? '<dl class="zj-souk__details">' + details + "</dl>" : "") +
          (paragraphes ? '<div class="zj-souk__description">' + paragraphes + "</div>" : "") +
          blocDerb(p, tapis, f) +   // v8.7 — au Derb, ce que le projet change et ce qu'il cherche passe avant tout
          '<div class="zj-souk__actions">' +
            (p.lien ? '<a class="zj-bouton" href="' + esc(p.lien) + '" target="_blank" rel="noopener noreferrer">Découvrir</a>' : "") +
            (f.source === "mien" && p.id
              ? '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-souk-modifier" data-id="' + esc(p.id) + '">Modifier la fiche</button>' +
                '<button type="button" class="zj-souk__retirer" data-id="' + esc(p.id) + '">Retirer</button>'
              : (p.id ? '<button type="button" class="zj-souk__signaler" id="zj-souk-signaler" data-id="' + esc(p.id) + '">Signaler</button>' +
                  '<span id="zj-souk-sig-forme" class="zj-souk__sig-forme" hidden>' +
                    '<input id="zj-souk-sig-mot" type="text" maxlength="120" placeholder="Ce qui ne va pas, en un mot">' +
                    '<button type="button" class="zj-bouton zj-bouton--discret" id="zj-souk-sig-envoyer">Envoyer</button>' +
                  "</span>" : "")) +
          "</div>" +
          affaireHtml(f, p, tapis) +
        "</div>" +
      "</div>" +
      // La fiche longue et la FAQ, sous la première vue : on décide ici, on ne
      // sort plus pour comprendre. Le markdown passe par kounnach.js — tout est
      // échappé d'abord, et aucune balise de l'auteur ne traverse.
      // La première image sert déjà d'affiche là-haut quand la maison n'en a
      // pas posé : la galerie reprend à la seconde, pour ne pas la redire.
      (p.galerie && p.galerie.length
        ? '<section class="zj-souk__galerie">' + (p.affiche ? p.galerie : p.galerie.slice(1)).map(function (c) {
            var u = compte.urlImage ? compte.urlImage(c) : "";
            return u ? '<figure><img src="' + esc(u) + '" alt="" loading="lazy" decoding="async"></figure>' : "";
          }).join("") + "</section>"
        : "") +
      (p.corps ? '<section class="zj-souk__md">' + Kn.rendre(p.corps) + "</section>" : "") +
      (p.faq && p.faq.length
        ? '<section class="zj-souk__faq"><p class="zj-kicker">Questions fréquentes</p>' +
          p.faq.map(function (e) {
            return "<details><summary>" + esc(e.q) + "</summary><p>" + esc(e.r) + "</p></details>";
          }).join("") + "</section>"
        : "") +
      (p.capture ? '<figure class="zj-souk__capture"><img src="' + esc(p.capture) + '" alt="" loading="lazy" decoding="async"></figure>' : "") +
    "</article>";
    corps.innerHTML = html;
    var retour = $("#zj-souk-retour");
    if (retour) retour.focus();
    cablerSouk();
  }

  function ouvrirFiche(source, t, p) {
    souk.fiche = { source: source, t: t, p: p };
    rendreSouk();
    var cadre = $("#zj-souk .zj-riwaq__cadre");
    if (cadre) cadre.scrollTop = 0;
  }
  function fermerFiche() {
    if (!souk.fiche) return false;
    var f = souk.fiche;
    souk.fiche = null;
    rendreSouk();
    var c = f.source === "derb" ? $('#zj-souk-corps [data-derb-i="' + f.p + '"]')
      : $('#zj-souk-corps .zj-souk__case[data-source="' + f.source + '"][data-t="' + f.t + '"][data-p="' + f.p + '"]');
    if (c) c.focus();
    return true;
  }
  function passerFiche(pas) {
    if (!souk.fiche) return;
    var n = produitsDe(souk.fiche.source, souk.fiche.t).length;
    if (n < 2) return;
    souk.fiche.p = (souk.fiche.p + pas + n) % n;
    rendreSouk();
  }

  // v8.7 — les gestes du Derb t-Tadamoun : filtrer, ouvrir un projet, aider, parrainer, poser le sien
  function cablerDerb() {
    if (!Tm) return;
    $$("#zj-souk-corps [data-derb-i]").forEach(function (b) {
      b.addEventListener("click", function () { ouvrirFiche("derb", 0, Number(b.getAttribute("data-derb-i"))); });
    });
    $$("#zj-souk-corps [data-derb-filtre]").forEach(function (sel) {
      sel.addEventListener("change", function () { souk.derbFiltre[sel.getAttribute("data-derb-filtre")] = sel.value || ""; rendreSouk(); });
    });
    $$("#zj-souk-corps [data-derb-porteur]").forEach(function (b) {
      b.addEventListener("click", function () {
        souk.vue = { source: "derb", cible: { joueur: b.getAttribute("data-derb-porteur") || null, slug: b.getAttribute("data-derb-slug") || null, nom: b.getAttribute("data-derb-nom") } };
        souk.fiche = null;
        if (souk.parrainages === null) chargerParrainages();
        rendreSouk();
      });
    });
    $$("#zj-souk-corps [data-derb-poser]").forEach(function (b) {
      b.addEventListener("click", function () {
        souk.vue = { source: "mien" }; souk.fiche = null; souk.edition = null; souk.derbNeuf = true;
        rendreSouk();
        var form = $("#zj-souk-form");
        if (form) { form.scrollIntoView({ block: "start", behavior: mouvementReduit ? "auto" : "smooth" }); var n = $("#zj-souk-produit"); if (n) n.focus(); }
      });
    });
    $$("#zj-souk-corps [data-derb-aider]").forEach(function (b) {
      b.addEventListener("click", function () { aiderDerb(b.getAttribute("data-derb-aider")); });
    });
    // Où le poser : le Souk ou le Derb. On MONTRE les champs du Derb, on ne redessine rien.
    $$('#zj-souk-form input[name="zj-souk-derb"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var derb = r.checked && r.value === "tadamoun";
        if (!r.checked) return;
        var champs = $("#zj-souk-derb-champs"), mot = $("#zj-souk-nom-mot"), envoi = $("#zj-souk-envoyer"), form = $("#zj-souk-form");
        if (champs) champs.hidden = !derb;
        if (mot) mot.textContent = derb ? "Le projet" : "Le produit";
        if (envoi && form && !form.getAttribute("data-id")) envoi.textContent = derb ? "Poser au Derb" : "Étaler";
      });
    });
    // Parrainer (RSE) : une proposition au bureau, jamais au porteur
    var ouvrirP = $("#zj-derb-parrainer-ouvrir"), formP = $("#zj-derb-parrainer");
    if (ouvrirP && formP) ouvrirP.addEventListener("click", function () { formP.hidden = false; ouvrirP.hidden = true; var e1 = $("#zj-derb-entreprise"); if (e1) e1.focus(); });
    var annulerP = $("#zj-derb-parrainer-annuler");
    if (annulerP && formP) annulerP.addEventListener("click", function () { formP.hidden = true; if (ouvrirP) ouvrirP.hidden = false; });
    if (formP) formP.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (souk.envoi || !compte || typeof compte.parrainerDerb !== "function") return;
      var f = souk.fiche, x = f && f.source === "derb" ? derbVisibles()[f.p] : null;
      if (!x) return;
      var v = Tm.validerParrainage({ entreprise: $("#zj-derb-entreprise").value, mot: $("#zj-derb-mot").value });
      if (!v.ok) { motSouk(v.texte, true); return; }   // on dit, on garde ce qui est tapé
      souk.envoi = true;
      compte.parrainerDerb({ projet: x.projet.id, projetNom: x.projet.nom, porteur: x.tapis.nom, entreprise: v.valeur.entreprise, mot: v.valeur.mot }).then(function (r) {
        souk.envoi = false;
        if (!r || !r.ok) { motSouk((r && r.erreur) || "Ça n'a pas marché.", true); return; }
        formP.hidden = true; if (ouvrirP) ouvrirP.hidden = false;
        var dit = { texte: r.deja ? "Ta proposition attend déjà le bureau." : "C'est parti au bureau. Il te répondra dans le jeu." };
        motSouk(dit.texte, false);
        sonner("page");
        chargerParrainages(dit);
      });
    });
  }

  function cablerSouk() {
    // 23/09/2026 — les raccourcis de ma ferracha : tout le Souk, et le fil d'or jusqu'à mon étal
    $$("[data-souk-vue]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-souk-vue");
        souk.vue = { source: v }; souk.fiche = null;
        if (v === "derb" && souk.parrainages === null) chargerParrainages();   // v8.7
        rendreSouk();
      });
    });
    cablerDerb();   // v8.7 — le Derb t-Tadamoun
    $$("[data-souk-etal]").forEach(function (b) { b.addEventListener("click", allerAMonEtal); });
    $$("[data-souk-carte]").forEach(function (b) {   // v8.6
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-souk-carte"), nom = b.getAttribute("data-souk-nom");
        fermerSouk();
        gens.onglet = "annuaire";
        ouvrirPersonne(null, id, { pseudo: nom });
      });
    });
    // v5.7 — proposer une affaire (safqa.js) : le formulaire sous la fiche, le partage dit en direct
    var ouvrirSf = $("#zj-safqa-ouvrir"), formSf = $("#zj-safqa-form");
    if (ouvrirSf && formSf) ouvrirSf.addEventListener("click", function () { formSf.hidden = false; ouvrirSf.hidden = true; var pr = $("#zj-safqa-prix"); if (pr) pr.focus(); });
    var annulerSf = $("#zj-safqa-annuler");
    if (annulerSf && formSf) annulerSf.addEventListener("click", function () { formSf.hidden = true; if (ouvrirSf) ouvrirSf.hidden = false; });
    var prixSf = $("#zj-safqa-prix");
    if (prixSf) prixSf.addEventListener("input", function () {
      var v = Sf.validerPrix(prixSf.value), el = $("#zj-safqa-partage");
      if (el) el.textContent = v.ok ? Sf.textePartage(v.prix) : el.getAttribute("data-regle");
    });
    if (formSf) formSf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (safqa.envoi) return;
      var bloc = formSf.parentNode;
      var v = Sf.validerProposition({ vendeur: bloc.getAttribute("data-vendeur"), produit: bloc.getAttribute("data-produit") || null, produitNom: bloc.getAttribute("data-nom"), prix: $("#zj-safqa-prix").value, mot: $("#zj-safqa-mot").value });
      if (!v.ok) { motSouk(v.texte, true); return; }
      safqa.envoi = true;
      var tapis = souk.fiche ? Sk.etat(souk.tapis).tapis[souk.fiche.t] : null;
      compte.proposerSafqa(v.valeur).then(function (r) {
        safqa.envoi = false;
        if (!r || !r.ok) { motSouk((r && r.erreur) || "Ça n'a pas marché.", true); return; }
        formSf.hidden = true; if (ouvrirSf) ouvrirSf.hidden = false;
        motSouk(Sf.texteProposee(tapis ? tapis.nom : ""), false);
        sonner("page");
        verser("souk");   // v4.7 — un geste du Souk
        chargerSafqat();
      });
    });
    $$("#zj-souk-corps .zj-souk__case").forEach(function (b) {
      b.addEventListener("click", function () {
        ouvrirFiche(b.getAttribute("data-source"), Number(b.getAttribute("data-t")), Number(b.getAttribute("data-p")));
      });
    });
    var retour = $("#zj-souk-retour");
    if (retour) retour.addEventListener("click", fermerFiche);
    var prec = $("#zj-souk-precedent");
    if (prec) prec.addEventListener("click", function () { passerFiche(-1); });
    var suiv = $("#zj-souk-suivant");
    if (suiv) suiv.addEventListener("click", function () { passerFiche(1); });
    var modif = $("#zj-souk-modifier");
    if (modif) modif.addEventListener("click", function () {
      souk.edition = modif.getAttribute("data-id");
      souk.fiche = null;
      rendreSouk();
      var champ = $("#zj-souk-form");
      if (champ) { champ.scrollIntoView({ block: "start", behavior: mouvementReduit ? "auto" : "smooth" }); $("#zj-souk-produit").focus(); }
    });
    // La galerie : un fichier choisi monte tout de suite, et la vignette paraît.
    cablerGalerie();
    var galF = $("#zj-souk-gal-fichier");
    if (galF) galF.addEventListener("change", function () {
      var f = galF.files && galF.files[0];
      if (!f) return;
      if ((souk.galerie || []).length >= Sk.GALERIE_MAX) { motGalerie("Six images, c'est le plafond."); galF.value = ""; return; }
      motGalerie("L'image monte…");
      compte.televerser(f).then(function (r) {
        galF.value = "";
        if (!r || !r.ok) { motGalerie((r && r.erreur) || "Ça n'a pas marché."); return; }
        souk.galerie = (souk.galerie || []).concat([r.chemin]);
        redessinerGalerie();
        motGalerie("");
      });
    });
    // Signaler une fiche : n'importe quel joueur, jamais la sienne. Le bureau
    // tranche — un signalement ne masque rien tout seul.
    var sig = $("#zj-souk-signaler"), sigForme = $("#zj-souk-sig-forme"), sigEnvoi = $("#zj-souk-sig-envoyer");
    // Deux gestes, et le second porte la RAISON : sans elle le bureau lit « 3
    // signalements » sans savoir de quoi, et la colonne ne sert à rien.
    if (sig && sigForme) sig.addEventListener("click", function () {
      sig.hidden = true;
      sigForme.hidden = false;
      var champ = $("#zj-souk-sig-mot");
      if (champ) champ.focus();
    });
    if (sigEnvoi) sigEnvoi.addEventListener("click", function () {
      var champ = $("#zj-souk-sig-mot"), id = sig ? sig.getAttribute("data-id") : "";
      sigEnvoi.disabled = true;
      compte.signalerEtal(id, champ ? champ.value : "").then(function (r) {
        if (r && r.ok) { if (sigForme) sigForme.hidden = true; }
        else { sigEnvoi.disabled = false; }
        motSouk(r && r.ok ? "C'est signalé. Le bureau regardera." : ((r && r.erreur) || "Ça n'a pas marché."), !(r && r.ok));
      });
    });
    var annuler = $("#zj-souk-annuler");
    if (annuler) annuler.addEventListener("click", function () { souk.edition = null; rendreSouk(); });

    var form = $("#zj-souk-form");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (souk.envoi) return;
      var champ = function (id) { var el = $(id); return el ? el.value : undefined; };
      var v = Sk.valider({
        nom: $("#zj-souk-produit").value,
        resout: $("#zj-souk-regle").value,
        lien: $("#zj-souk-url").value,
        accroche: champ("#zj-souk-accroche"),
        pourQui: champ("#zj-souk-pourqui"),
        description: champ("#zj-souk-description"),
        corps: champ("#zj-souk-fiche"),
        livre: champ("#zj-souk-livre"),
        delai: champ("#zj-souk-delai"),
        faq: lireFaq(),
        galerie: souk.galerie || [],
        // v8.7 — le Derb t-Tadamoun (tadamoun.js) : où il s'étale, et ce qu'un projet solidaire dit de lui
        derb: (function () { var r = form.querySelector('input[name="zj-souk-derb"]:checked'); return r ? r.value : "souk"; })(),
        forme: champ("#zj-souk-forme"),
        stade: champ("#zj-souk-stade"),
        impact: champ("#zj-souk-impact"),
        besoins: $$('#zj-souk-form input[name="zj-souk-besoin"]:checked').map(function (b) { return b.value; })
      });
      // v3.6 — ⚠️ le titre du panneau portait l’id zj-souk-nom, comme le champ
      // du nom : $() rendait le <h2>, .value était undefined, et TOUT envoi
      // finissait en « Un produit a un nom. » — le Souk n'a jamais accepté un
      // produit. Les champs ont maintenant des id à eux ; un test interdit
      // tout id partagé entre la page et les formulaires que ce fichier écrit.
      // v3.6 — un refus ne redessine PAS le panneau : redessiner vidait les
      // trois champs, et le clic suivant partait à vide. On dit, on garde.
      if (!v.ok) { motSouk(v.texte, true); return; }
      var id = form.getAttribute("data-id");
      souk.envoi = true;
      (id ? compte.modifierEtal(id, v.valeur) : compte.poserEtal(v.valeur)).then(function (r) {
        souk.envoi = false;
        if (!r.ok) { motSouk(r.erreur || "Ça n'a pas marché.", true); return; }
        if (id) {
          souk.edition = null;
          rafraichirSouk({ texte: "La fiche est à jour." });
          return;
        }
        souk.derbNeuf = false;
        rafraichirSouk({ texte: v.valeur.derb === "tadamoun" ? "C'est posé. " + v.valeur.nom + " est au Derb t-Tadamoun." : "C'est posé. " + v.valeur.nom + " est sur ton tapis." });
        tutorielEvenement("etal");   // v3.6 — le geste du dernier pas du tutoriel
        verser("souk");   // v4.7
      });
    });
    $$("#zj-souk-corps .zj-souk__retirer").forEach(function (b) {
      b.addEventListener("click", function () {
        if (souk.envoi) return;
        souk.envoi = true;
        compte.retirerEtal(b.getAttribute("data-id")).then(function (r) {
          souk.envoi = false;
          if (!r.ok) { motSouk(r.erreur || "Ça n'a pas marché.", true); return; }
          souk.fiche = null;
          rafraichirSouk({ texte: "Retiré de ton tapis." });
        });
      });
    });
  }

  // Le mot du Souk, posé ou remplacé en tête du panneau — sans toucher au
  // formulaire ni à ce qu'on y a tapé.
  function motSouk(texte, erreur) {
    var corps = $("#zj-souk-corps");
    if (!corps) return;
    var p = corps.querySelector(".zj-souk__mot");
    if (!p) { p = document.createElement("p"); corps.insertBefore(p, corps.firstChild); }
    p.className = "zj-souk__mot" + (erreur ? " zj-souk__mot--non" : "");
    p.textContent = texte;
    var inp = $("#zj-souk-produit");
    if (erreur && inp && !inp.value.trim()) inp.focus();
  }

  // On relit tout : poser un produit change son tapis et le Souk entier.
  function rafraichirSouk(message) {
    compte.lireSouk().then(function (d) {
      souk.tapis = (d && d.tapis) || [];
      souk.moi = (d && d.moi) || { membre: false, raison: "panne" };
      souk.devoile = !!(d && d.devoile);
      rendreSouk(message);
    });
  }

  // ---- La boîte de dialogue ------------------------------------------------------------
  var frappe = 0;
  // Une boîte : { nom, pages, question?, prologue?, apres? }. `question` ouvre
  // le formulaire de réponse sur la dernière page ; `prologue` marque le récit
  // comme lu à la fermeture ; `apres` s'exécute à la fermeture (l'épilogue).
  function ouvrirDialogue(d) {
    clearInterval(frappe);
    // v3.1 — la boîte se traduit AVANT d'être tapée lettre à lettre : on ne
    // montre pas le français puis l'arabe. Le reste de la page passe par
    // l'observateur de langue.js.
    // Bab — et le vocabulaire d'une maison, sur le français, de la même façon.
    if (Lg && (Lg.estAr() || (Lg.traduit && Lg.traduit()))) {
      d = Object.assign({}, d, { nom: Lg.t(d.nom), pages: Array.isArray(d.pages) ? d.pages.map(function (p) { return Lg.t(p); }) : d.pages });
    }
    cour.dialogue = { nom: d.nom, pages: d.pages, page: 0, complet: false, question: d.question || null, qcm: d.qcm || null, prologue: !!d.prologue, apres: d.apres || null };
    document.body.setAttribute("data-dialogue", "1");   // v4.6 — la croix laisse lire
    for (var k in cour.touches) cour.touches[k] = false;
    var box = $("#zj-dialogue");
    box.hidden = false;
    questionVisible(false);
    qcmVisible(false);
    $("#zj-dialogue-nom").textContent = d.nom;
    // v2.4 : le visage de qui parle. Une clé de ville explicite, sinon le nom
    // de la boîte (« Le mou'allim · Fès »), sinon le prologue — que le
    // mou'allim de Fès porte. Un lieu n'a pas de visage : l'image se cache.
    var cle = Rc.portrait(d.portrait) || Rc.portrait(d.nom) || (d.prologue ? "fes" : null);
    var src = cle ? PORTRAITS.dossier + cle + ".jpg" + PORTRAITS.version : null;
    // v3.4 — « page:<cle> » : le portrait de la carte, pas celui du Mourchid
    if (typeof d.portrait === "string" && d.portrait.indexOf("page:") === 0 && P.page(d.portrait.slice(5))) {
      cle = d.portrait; src = CARTES.dossier + d.portrait.slice(5) + ".jpg" + CARTES.version;
    }
    var img = $("#zj-dialogue-portrait");
    if (img) {
      if (src) { img.src = src; img.hidden = false; }
      else { img.removeAttribute("src"); img.hidden = true; }
      box.classList.toggle("zj-dialogue--portrait", !!cle);
    }
    montrerPage();
  }
  function finDePage() {
    var dl = cour.dialogue;
    if (!dl) return;
    dl.complet = true;
    var derniere = dl.page + 1 >= dl.pages.length;
    if (dl.question && derniere) { $("#zj-dialogue-suite").hidden = true; questionVisible(true); }
    else if (dl.qcm && derniere) { $("#zj-dialogue-suite").hidden = true; qcmVisible(true); }
    else $("#zj-dialogue-suite").hidden = false;
  }
  function montrerPage() {
    var dl = cour.dialogue, texte = dl.pages[dl.page] || "";
    var el = $("#zj-dialogue-texte"), suite = $("#zj-dialogue-suite");
    clearInterval(frappe);
    suite.hidden = true;
    if (mouvementReduit) { el.textContent = texte; finDePage(); return; }
    var i = 0; el.textContent = ""; dl.complet = false;
    frappe = setInterval(function () {
      i += 1; el.textContent = texte.slice(0, i);
      if (i >= texte.length) { clearInterval(frappe); finDePage(); }
    }, 16);
  }
  function avancerDialogue() {
    var dl = cour.dialogue;
    if (!dl) return;
    if (!dl.complet) { clearInterval(frappe); $("#zj-dialogue-texte").textContent = dl.pages[dl.page]; finDePage(); return; }
    if (dl.page + 1 < dl.pages.length) { dl.page += 1; sonner("page_dlg"); montrerPage(); return; }
    // Une question ouverte ne se ferme pas d'un clic : on répond, ou Échap.
    if (dl.question || dl.qcm) return;
    fermerDialogue();
  }
  function fermerDialogue() {
    clearInterval(frappe);
    var dl = cour.dialogue;
    cour.dialogue = null;
    document.body.setAttribute("data-dialogue", "0");
    var box = $("#zj-dialogue");
    if (box) box.hidden = true;
    questionVisible(false);
    qcmVisible(false);
    if (dl && dl.prologue && joueur && !Rc.prologueVu(joueur)) {
      joueur.recit = Rc.normaliserRecit(joueur.recit);
      joueur.recit.prologue = new Date().toISOString();
      sauvegarderJoueur();
      // Le prologue a dit pourquoi ; le mou'allim demande d'où l'on sert (v7.0, la
      // Tariqa), puis montre comment — le tutoriel finit sur le premier geste de la tariqa.
      var suite = function () { if (Tt && !Tt.fini(joueur.recit.tutoriel)) demarrerTutoriel(false); };
      if (Tq && !joueur.tariqa) demanderTariqa(suite); else suite();
    }
    if (dl && typeof dl.apres === "function") dl.apres();
    libererTutoriel();
  }

  // ---- Le menu -------------------------------------------------------------------------
  var menuOuvert = false;
  function basculerMenu(force) {
    menuOuvert = typeof force === "boolean" ? force : !menuOuvert;
    // v8.4 — le Dar remplace le menu. L'ancien #zj-menu reste le REGISTRE DES
    // COMMANDES : jamais montré, ses boutons gardent leurs écouteurs et leurs
    // règles de visibilité — le Dar ne fait que les lire et les actionner.
    var m = $("#zj-menu");
    if (m) m.hidden = true;
    var d = $("#zj-dar");
    if (d) {
      d.hidden = !menuOuvert;
      if (menuOuvert) { rendreDar(); var q = $("#zj-dar-q"); if (q && dar.chercher) setTimeout(function () { q.focus(); }, 30); }
      dar.chercher = false;
    }
    rafraichirBarre();
    var b = $("#zj-menu-bouton");
    if (b) b.setAttribute("aria-expanded", menuOuvert ? "true" : "false");
    if (menuOuvert) for (var k in cour.touches) cour.touches[k] = false;
  }

  // ---- v8.4 — LE DAR (الدار), LA BARRE, ALLER, LES GENS ---------------------------------------
  // Les règles vivent dans dar.js (le registre, la recherche, les lieux) ; ici le
  // rendu et les gestes. ⚠️ Le Dar ne décide d'AUCUNE visibilité : une carte ne
  // s'affiche que si son bouton #zj-menu-<clé> est visible, et la toucher
  // actionne ce bouton — la liste blanche de l'invité, les paliers, la lignée,
  // le Morchid et le Majliss valent donc sans une ligne de plus.
  var dar = { porte: "apprendre", q: "", chercher: false };
  function commandeVisible(cle) { var b = $("#zj-menu-" + cle); return !!b && !b.hidden; }
  function actionnerCommande(cle) {
    var b = $("#zj-menu-" + cle);
    if (!b || b.hidden) return;
    basculerMenu(false);
    b.click();
  }
  function iconeDar(nom, classe) {
    if (nom && typeof nom === "object" && nom.lettre) return '<span class="zj-ico zj-ico--lettre' + (classe ? " " + classe : "") + '" aria-hidden="true">' + esc(nom.lettre) + "</span>";
    var c = Dr ? Dr.cellule(nom) : null;
    if (!c) return "";
    return '<span class="zj-ico' + (classe ? " " + classe : "") + '" style="--c:' + c.c + ";--r:" + c.r + '" aria-hidden="true"></span>';
  }
  function medaillonDar(nom) { return '<span class="zj-medaillon">' + iconeDar(nom) + "</span>"; }
  function rendreDar() {
    if (!Dr || !joueur) return;
    // ta carte : le visage, le nom, le rang et la tariqa, les trois axes tels que le HUD les dit
    var r = R.rang(joueur.rang), nom = $("#zj-dar-nom"), rang = $("#zj-dar-rang"), axes = $("#zj-dar-axes");
    if (nom) nom.textContent = joueur.pseudo;
    if (rang) rang.textContent = dayf.actif ? "Dayf" : r.nom + (Tq && Tq.laqab(joueur) ? " · " + Tq.laqab(joueur) : "");
    if (axes) {
      axes.innerHTML = "";
      [["#zj-hud-m39ol", ""], ["#zj-hud-sna3a", " zj-dar__axe--s"], ["#zj-hud-dhakira", " zj-dar__axe--d"]].forEach(function (a) {
        var el = $(a[0]);
        if (!el || el.hidden || !el.textContent) return;
        var span = document.createElement("span");
        span.className = "zj-dar__axe" + a[1]; span.textContent = el.textContent;
        axes.appendChild(span);
      });
    }
    var cv = $("#zj-dar-avatar");
    if (cv && Rd && Rd.dessinerPerso) {
      var dpr = Math.min(3, window.devicePixelRatio || 1), cx = cv.getContext("2d");
      cv.width = Math.round(44 * dpr); cv.height = Math.round(58 * dpr);
      cx.imageSmoothingEnabled = true;
      var z = Math.max(1, Math.floor(cv.height / (Rd.PH + 1)));
      Rd.dessinerPerso(cx, joueur.avatar, "bas", 0, cv.width / 2, cv.height - z, z, false);
    }
    rendreJourDar();
    rendrePortesDar();
    rendreGrilleDar();
  }
  // Aujourd'hui : le Wird, les jeux du jour (cochés s'ils sont joués), et Aller.
  function rendreJourDar() {
    var el = $("#zj-dar-jour");
    if (!el) return;
    var html = "";
    if (commandeVisible("wird")) {
      var hw = $("#zj-hud-wird"), texte = hw && !hw.hidden && hw.textContent ? hw.textContent : "Le Wird : un défi par jour, quarante jours.";
      html += '<button type="button" class="zj-dar__bloc zj-dar__bloc--wird" data-dar-jour="wird">' + medaillonDar("wird") +
        "<span><h3>Le Wird du jour</h3><p>" + esc(texte) + "</p></span></button>";
    }
    var jeux = Jx && typeof faitsDuJour === "function" ? Jx.duJour(faitsDuJour()).filter(function (l) { return palierOuvert(l.cle) && commandeVisible(l.cle); }) : [];
    if (jeux.length) {
      var ICONE_JEU = { kelma: "tuiles", atay: "theiere", qlil: "plume", khessa: "fontaine" };
      // Bab — une maison nomme ce bloc (le vocabulaire l'avalerait : la boîte n'a qu'un <span>, langue.js la prend pour une feuille)
      var titreJeux = (window.ZWJ_MAISON && window.ZWJ_MAISON.jeuxDuJour) || "Les jeux du jour";
      // Bab — un seul jeton (chez Nareva, la jauge des sites) : une icône seule ne se lisait pas.
      // Le bloc prend alors la forme de ses deux voisins : l'icône, le titre, le nom en clair.
      if (jeux.length === 1) {
        var j1 = jeux[0], e1 = Dr.entree(j1.cle);
        html += '<button type="button" class="zj-dar__bloc" data-dar-jour="' + esc(j1.cle) + '">' + medaillonDar(ICONE_JEU[j1.cle] || "wird") +
          "<span><h3>" + esc(titreJeux) + "</h3><p>" + esc(e1 ? e1.nom : j1.cle) + (j1.fait ? " · ✓" : "") + "</p></span></button>";
      } else {
        html += '<div class="zj-dar__bloc" role="group" aria-label="' + esc(titreJeux) + '"><span><h3>' + esc(titreJeux) + '</h3><span class="zj-dar__jetons">' +
          jeux.map(function (l) {
            var e = Dr.entree(l.cle), nom = e ? e.nom : l.cle;
            return '<button type="button" class="zj-dar__jeton" data-dar-jour="' + esc(l.cle) + '" title="' + esc(nom) + '">' + medaillonDar(ICONE_JEU[l.cle] || "wird") +
              (l.fait ? '<span class="zj-dar__fait" aria-label="fait">✓</span>' : "") + "</button>";
          }).join("") + "</span></span></div>";
      }
    }
    html += '<button type="button" class="zj-dar__bloc" data-dar-jour="aller">' + medaillonDar("aller") +
      '<span><h3>Aller</h3><p>La maison, d\'un geste.</p></span></button>';
    el.innerHTML = html;
  }
  function rendrePortesDar() {
    var el = $("#zj-dar-portes");
    if (!el) return;
    el.innerHTML = Dr.PORTES.map(function (p) {
      return '<button type="button" class="zj-dar__porte" role="tab" aria-selected="' + (p.cle === dar.porte ? "true" : "false") + '" data-dar-porte="' + p.cle + '">' +
        iconeDar(p.icone) + "<b>" + esc(p.nom) + '</b><small lang="ar" dir="rtl">' + esc(p.ar) + "</small></button>";
    }).join("");
    el.setAttribute("data-cherche", dar.q ? "1" : "0");
  }
  function rendreGrilleDar() {
    var el = $("#zj-dar-grille"), vide = $("#zj-dar-vide");
    if (!el) return;
    var visibles = Dr.ENTREES.filter(function (e) { return commandeVisible(e.cle); });
    var liste = dar.q ? Dr.chercher(visibles, dar.q) : visibles.filter(function (e) { return e.porte === dar.porte; });
    el.innerHTML = liste.map(function (e) {
      return '<button type="button" class="zj-dar__carte" data-dar-cle="' + esc(e.cle) + '">' + iconeDar(e.icone) +
        '<span><b>' + esc(e.nom) + '</b><span class="ar" lang="ar" dir="rtl">' + esc(e.ar) + '</span><span class="zj-dar__pq">' + esc(e.pourquoi) + "</span></span></button>";
    }).join("");
    if (vide) vide.hidden = liste.length > 0;
    var portes = $("#zj-dar-portes");
    if (portes) portes.setAttribute("data-cherche", dar.q ? "1" : "0");
  }
  // Un geste de la Barre (ou sa touche). Jamais pour un invité ce qu'il n'a pas.
  function gesteBarre(geste) {
    if (geste === "dar") { basculerMenu(); return; }
    if (geste === "chercher") { dar.chercher = true; if (menuOuvert) { var q = $("#zj-dar-q"); if (q) q.focus(); } else basculerMenu(true); return; }
    if (menuOuvert) basculerMenu(false);
    if (geste === "lyoum") { if (commandeVisible("wird")) ouvrirWird(); return; }
    if (geste === "ferracha") { ouvrirMaFerracha(); return; }
    if (geste === "gens") { if (!dayf.actif) ouvrirGens(); return; }
    if (geste === "aller") { ouvrirAller(); return; }
  }
  // La Barre : ce que l'invité n'a pas se cache ; les pastilles disent ce qui attend.
  function rafraichirBarre() {
    var barre = $("#zj-barre");
    if (!barre) return;
    var enCour = ecran === "cour" && !!joueur;
    barre.hidden = !enCour;
    document.body.setAttribute("data-barre", enCour ? "1" : "0");
    if (!enCour) return;
    var voir = { lyoum: !dayf.actif && commandeVisible("wird"), ferracha: !dayf.actif, gens: !dayf.actif && !rihla.active, aller: true, dar: true };
    for (var k in voir) { var b = $("#zj-barre-" + k); if (b) b.hidden = !voir[k]; }
    var nL = $("#zj-barre-lyoum-n");
    if (nL && Dr) {
      var we = typeof wirdEtat === "function" ? wirdEtat() : null;
      var jeux = Jx && typeof faitsDuJour === "function" ? Jx.duJour(faitsDuJour()).filter(function (l) { return palierOuvert(l.cle) && l.cle !== "khessa"; }) : [];
      var n = Dr.pastilleAujourdhui(we && we.courant ? { tenu: !!we.courant.tenu } : null, jeux);
      nL.textContent = String(n); nL.hidden = !n;
    }
    // v8.5 — la pastille des gens : ce qui m'ATTEND (messages privés, mentions) en terre cuite ;
    // sinon, calme, combien sont là.
    var nG = $("#zj-barre-gens-n");
    if (nG && Sh) {
      var g = sahn.actif ? Sh.vivants(sahn.autres, Date.now(), nombreSahn()).length : 0;
      var attend = (rasail.nonLus || 0) + (kalam.mentions || 0);
      nG.textContent = String(attend || g); nG.hidden = !(attend || g);
      nG.classList.toggle("zj-pastille--calme", !attend);
    }
  }
  // ---- Aller : la maison, d'un geste ----------------------------------------------------------
  function ouvrirAller() {
    var pn = $("#zj-aller");
    if (!pn || !Dr) return;
    basculerMenu(false); fermerDialogue(); fermerGens();
    rendreAller();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-aller-fermer"); if (f) f.focus();
  }
  function fermerAller() {
    var pn = $("#zj-aller");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function lieuActuel() { return rahba.active ? "rahba" : mechouar.active ? "mechouar" : rihla.active ? "fes" : "zawia"; }
  function rendreAller() {
    var el = $("#zj-aller-corps");
    if (!el) return;
    // Dans Fès, la marche est le jeu : on n'y saute pas, on peut seulement rentrer.
    if (rihla.active) {
      el.innerHTML = '<div class="zj-lieu zj-lieu--ici">' + medaillonDar("porte-fes") + '<div><h3>Tu es dans Fès</h3><p>Ici, on marche : c\'est le jeu. Tu peux rentrer à la zawia.</p>' +
        '<div class="zj-lieu__gestes"><button type="button" class="zj-bouton" data-aller-rentrer="1">Rentrer à la zawia</button></div></div></div>';
      return;
    }
    var ici = lieuActuel();
    el.innerHTML = Dr.LIEUX.map(function (l) {
      // v8.7 — le Derb est DANS la Rahba : « Tu y es » seulement quand on est dans la ruelle
      var surPlace = (l.monde === "rahba" && ici === "rahba" && (l.tuile === "G" ? !rahba.dansDerb : rahba.dansDerb)) || (l.monde === "mechouar" && ici === "mechouar");
      var fil = (l.monde === "zawia" && ici === "zawia") || (l.monde === "rahba" && l.tuile !== "G" && ici === "rahba");   // le fil d'or ne se tend que dans le monde où l'on est
      return '<div class="zj-lieu' + (surPlace ? " zj-lieu--ici" : "") + '">' + medaillonDar(l.icone) +
        '<div><h3>' + esc(l.nom) + '</h3><p>' + esc(l.detail) + '</p><div class="zj-lieu__gestes">' +
        (surPlace ? '<span class="zj-legende">Tu y es.</span>' : '<button type="button" class="zj-bouton" data-aller-y="' + esc(l.cle) + '">Y aller</button>') +
        (fil ? '<button type="button" class="zj-bouton zj-bouton--discret" data-aller-mener="' + esc(l.cle) + '">M\'y mener</button>' : "") +
        "</div></div></div>";
    }).join("");
  }
  // Où se poser pour être « à » un lieu de la zawia : la case libre la plus proche
  // de sa tuile, au bout du fil d'or (tutoriel.js) — jamais dans un mur.
  function destinationLieu(l) {
    if (!l || !Tt) return null;
    var p = cour.perso, tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T);
    var fil = Tt.cheminVers(M, tx, ty, l.tuile) || Tt.cheminVers(M, M.APPARITION.x, M.APPARITION.y, l.tuile);
    if (!fil || !fil.chemin.length) return null;
    var bout = fil.chemin[fil.chemin.length - 1], c = fil.cible;
    var dir = c.y < bout.y ? "haut" : c.y > bout.y ? "bas" : c.x < bout.x ? "gauche" : "droite";   // face à ce qu'on est venu voir
    return { x: bout.x, y: bout.y, dir: dir };
  }
  function allerA(cle) {
    var l = Dr && Dr.lieu(cle);
    if (!l || rihla.active) return;
    fermerAller();
    if (l.monde === "rahba") {
      if (!rahba.active) { if (mechouar.active) sortirMechouar(); entrerRahba(); }
      // v8.7 — le Derb t-Tadamoun est un lieu DE la Rahba : on s'y pose, devant l'arganier
      if (l.tuile !== "G") { var dR = destinationLieu(l); if (dR) { placer(cour.perso, dR.x, dR.y, dR.dir); degagerDesGens(cour.perso); envoyerPas(cour.perso, Date.now(), true); rafraichirHud(); } }
      return;
    }
    if (l.monde === "mechouar") { if (!mechouar.active) { if (rahba.active) sortirRahba(); entrerMechouar(); } return; }
    if (rahba.active) sortirRahba();
    if (mechouar.active) sortirMechouar();
    var d = destinationLieu(l);
    if (!d) return;
    placer(cour.perso, d.x, d.y, d.dir);
    degagerDesGens(cour.perso);
    cour.aBouge = true; sauvegarderPosition();
    if (orchestre) { orchestre.allerA(Mu.lieuPour(d.x, d.y)); majBoutonSon(); }
    envoyerPas(cour.perso, Date.now(), true);   // ceux qui regardent te voient arriver là
    rafraichirHud();
  }
  function menerA(cle) {
    var l = Dr && Dr.lieu(cle);
    if (!l) return;
    var ici = lieuActuel();
    // v8.7 — sur la Rahba, le fil d'or mène au Derb t-Tadamoun ; ailleurs, seulement dans la zawia
    if (!((l.monde === "zawia" && ici === "zawia") || (l.monde === "rahba" && l.tuile !== "G" && ici === "rahba"))) return;
    fermerAller();
    guide.tuile = l.tuile; guide.fil = null; guide.deTuile = ""; guide.jeu = true;
  }
  // ---- Les gens : qui est là, ce qui se dit, et à qui j'écris ---------------------------------
  // v8.5 — trois onglets. ICI : qui est dans la pièce (le Sahn ouvert). LE KALAM : ce qui
  // s'y dit depuis que je suis entré (sahn.js — rien n'est gardé nulle part). MESSAGES : les
  // Rasa'il, mes conversations privées (rasail.js — la base les garde et tient les freins).
  // Toucher un nom ouvre la PERSONNE : lui écrire, la saluer, y aller, ne plus l'entendre.
  // ⚠️ Le panneau ne se redessine en entier qu'en s'ouvrant ou en changeant de vue :
  //    `majGens` ne touche qu'aux listes — sinon chaque pas d'un autre joueur viderait le
  //    message qu'on est en train d'écrire.
  // ⚠️ Tout ce qu'un membre a écrit (pseudo, message) porte translate="no" : la version
  //    arabe traduit le DOM (langue.js), jamais les mots d'un membre. Et dir="auto" : un
  //    message en français garde son sens de lecture dans une page arabe (et l'inverse).
  function montrerGens() {
    var pn = $("#zj-gens");
    if (!pn || dayf.actif) return false;
    if (pn.hidden) {
      basculerMenu(false); fermerDialogue(); fermerAller();
      pn.hidden = false;
      document.body.setAttribute("data-question", "1");
    }
    return true;
  }
  function ouvrirGens(onglet) {
    if (dayf.actif || !montrerGens()) return;   // un invité n'a ni canal ni boîte (v7.2)
    if (onglet === "ici" || onglet === "annuaire" || onglet === "kalam" || onglet === "rasail") gens.onglet = onglet;
    gens.personne = null;
    if (gens.onglet === "rasail") { rasail.avec = null; rasail.fil = null; rasail.signaler = false; chargerBoite(); }
    rendreGens();
    var tactile = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var champ = gens.onglet === "kalam" && !tactile ? $("#zj-gens-kalam-texte") : null;   // au doigt, on n'ouvre pas le clavier d'office
    if (champ) champ.focus(); else { var f = $("#zj-gens-fermer"); if (f) f.focus(); }
  }
  function fermerGens() {
    var pn = $("#zj-gens");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
    rasail.signaler = false;
    rendreKalamScene();   // le fil revient dans la cour
  }
  function changerOngletGens(o) {
    gens.onglet = o === "annuaire" || o === "kalam" || o === "rasail" ? o : "ici";
    gens.personne = null;
    if (gens.onglet === "rasail") { rasail.avec = null; rasail.fil = null; rasail.signaler = false; chargerBoite(); }
    rendreGens();
  }
  function rendreOngletsGens() {
    var ici = sahn.actif ? Sh.vivants(sahn.autres, Date.now(), nombreSahn()).length : 0;
    [["ici", ici, true], ["annuaire", 0, true], ["kalam", kalam.mentions || kalam.nonVus, !kalam.mentions], ["rasail", rasail.nonLus, false]].forEach(function (o) {
      var b = $('#zj-gens-onglets [data-gens-onglet="' + o[0] + '"]');
      if (b) b.setAttribute("aria-selected", gens.onglet === o[0] && !gens.personne ? "true" : "false");
      var n = $("#zj-gens-n-" + o[0]);
      if (n) { n.textContent = String(o[1] || 0); n.hidden = !o[1]; n.classList.toggle("zj-pastille--calme", o[2]); }
    });
  }
  function rendreGens() {
    var el = $("#zj-gens-corps");
    if (!el) return;
    if (gens.onglet === "kalam" && !gens.personne) { kalam.nonVus = 0; kalam.mentions = 0; }
    rendreOngletsGens();
    if (gens.personne) rendrePersonne(el);
    else if (gens.onglet === "annuaire") rendreAnnuaire(el);   // v8.6 — la Bitaqa : les cartes ouvertes
    else if (gens.onglet === "kalam") rendreKalamOnglet(el);
    else if (gens.onglet === "rasail") { if (rasail.avec) rendreFilOuvert(el); else rendreBoite(el); }
    else rendreIci(el);
    rafraichirBarre();
    rendreKalamScene();
  }
  // Ce qui a bougé (un pas, une ligne, une boîte relue), sans toucher à ce qu'on écrit.
  function majGens() {
    var pn = $("#zj-gens");
    if (!pn || pn.hidden) { rafraichirBarre(); return; }
    if (gens.onglet === "kalam" && !gens.personne) { kalam.nonVus = 0; kalam.mentions = 0; }
    rendreOngletsGens();
    var el = $("#zj-gens-corps");
    if (el) {
      if (gens.personne) { var g = $("#zj-personne-gestes"); if (g) g.innerHTML = gestesPersonne(gens.personne); }
      else if (gens.onglet === "ici") rendreIci(el);
      else if (gens.onglet === "kalam") rendreFilKalam();
      else if (gens.onglet === "rasail") { if (rasail.avec) rendreMessagesFil(); else rendreBoite(el); }
    }
    rafraichirBarre();
  }
  function dessinerAvatarDans(cv, avatar, l, h) {
    if (!cv || !Rd || !Rd.dessinerPerso) return;
    var cx = cv.getContext("2d"), dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(l * dpr); cv.height = Math.round(h * dpr);
    cx.imageSmoothingEnabled = true;
    // le personnage peint se met à l'échelle en douceur : on remplit le médaillon, sans arrondir à l'entier
    var z = Math.max(1, cv.height / (Rd.PH + 1));
    Rd.dessinerPerso(cx, R.normaliserAvatar(avatar), "bas", 0, cv.width / 2, cv.height - z, z, false);
  }
  function horsLigneGens() {
    return rihla.active ? "Dans Fès, on marche seul. Les gens sont à la zawia." : sahn.enReprise ? "La cour se reconnecte…" : "La cour est hors ligne pour l'instant.";
  }
  // ICI — qui est dans la pièce, en ce moment.
  function rendreIci(el) {
    if (!sahn.actif) { el.innerHTML = '<p class="zj-gens__vide">' + esc(horsLigneGens()) + "</p>"; return; }
    var maintenant = Date.now(), liste = Sh.vivants(sahn.autres, maintenant, nombreSahn());
    var proche = Sh.devant(cour.perso, liste, T, maintenant);
    if (!liste.length) {
      el.innerHTML = '<p class="zj-gens__vide">Personne d\'autre ici pour l\'instant.</p><p class="zj-gens__vide">La halqa du mercredi est le meilleur moment pour croiser du monde.</p>' +
        '<p><button type="button" class="zj-bouton zj-bouton--discret" data-gens-riwaq="1">Voir le Riwaq</button></p>';
      return;
    }
    el.innerHTML = '<ul class="zj-gens__liste">' + liste.map(function (a) {
      var pres = proche && proche.cle === a.cle, soi = joueur && a.id === joueur.id;
      return '<li class="zj-gens__qui"><span class="zj-medaillon zj-medaillon--gens"><canvas width="34" height="45" data-gens-avatar="' + esc(a.cle) + '" aria-hidden="true"></canvas></span><div>' +
        (soi ? '<b translate="no" dir="auto">' + esc(a.pseudo) + "</b>" : '<button type="button" class="zj-gens__nom" data-gens-personne="' + esc(a.cle) + '" translate="no" dir="auto">' + esc(a.pseudo) + "</button>") +
        '<span>' + esc(a.assoupi ? "absent pour l'instant" : pres ? "juste à côté de toi" : "dans la pièce") + "</span></div>" +
        '<div class="zj-gens__gestes">' +
        (soi ? "" : '<button type="button" class="zj-bouton zj-bouton--discret" data-gens-ecrire="' + esc(a.cle) + '">Écrire</button>') +
        (pres ? '<button type="button" class="zj-bouton" data-gens-saluer="' + esc(a.cle) + '">Saluer</button>'
              : '<button type="button" class="zj-bouton zj-bouton--discret" data-gens-mener="' + esc(a.cle) + '">M\'y mener</button>') +
        "</div></li>";
    }).join("") + '</ul><p style="margin-top:12px"><button type="button" class="zj-bouton zj-bouton--discret" data-gens-kalam="1">Parler à la pièce</button></p>';
    liste.forEach(function (a) { dessinerAvatarDans(el.querySelector('canvas[data-gens-avatar="' + a.cle.replace(/"/g, "") + '"]'), a.avatar, 34, 45); });
  }
  // LA PERSONNE — ce qu'on peut faire avec quelqu'un qu'on a vu ou entendu.
  function personneDepuis(cle, id) {
    var a = cle ? sahn.autres[cle] : null;
    if (!a && id) for (var k in sahn.autres) if (sahn.autres[k].id === id) { a = sahn.autres[k]; break; }
    if (a) return { id: a.id, cle: a.cle, pseudo: a.pseudo, avatar: a.avatar };
    for (var i = kalam.fil.length - 1; i >= 0; i--) {
      var l = kalam.fil[i];
      if ((cle && l.cle === cle) || (id && l.id === id)) return { id: l.id, cle: l.cle, pseudo: l.pseudo, avatar: null };
    }
    return null;
  }
  // v8.6 — `connu` : ce qu'on sait déjà d'elle quand elle n'est ni dans la pièce ni dans le
  // Kalam (l'annuaire, un tapis du Souk) : { pseudo, avatar }.
  function ouvrirPersonne(cle, id, connu) {
    var p = personneDepuis(cle, id);
    if (!p && id && connu) p = { id: id, cle: null, pseudo: connu.pseudo || "Un Talib", avatar: connu.avatar || null };
    if (!p || !p.id || (joueur && p.id === joueur.id)) return;
    if (!montrerGens()) return;
    gens.personne = p;
    rendreGens();
    chargerCartePersonne(p.id);
  }
  function presenceDe(p) {
    if (!p) return null;
    var liste = Sh.vivants(sahn.autres, Date.now(), nombreSahn());
    for (var i = 0; i < liste.length; i++) if (liste[i].id === p.id) return liste[i];
    return null;
  }
  function gestesPersonne(p) {
    var a = presenceDe(p), maintenant = Date.now();
    var proche = a ? Sh.devant(cour.perso, Sh.vivants(sahn.autres, maintenant, nombreSahn()), T, maintenant) : null;
    var pres = !!(a && proche && proche.cle === a.cle), sourd = Sh.estSourd(kalam.sourds, p.id);
    return '<button type="button" class="zj-bouton" data-gens-ecrire-id="' + esc(p.id) + '">Écrire</button>' +
      (pres ? '<button type="button" class="zj-bouton zj-bouton--discret" data-gens-saluer="' + esc(a.cle) + '">Saluer</button>' : "") +
      (a && !pres ? '<button type="button" class="zj-bouton zj-bouton--discret" data-gens-mener="' + esc(a.cle) + '">M\'y mener</button>' : "") +
      '<button type="button" class="zj-bouton zj-bouton--discret" data-gens-sourd="' + esc(p.id) + '" data-oui="' + (sourd ? "0" : "1") + '">' +
      esc(sourd ? "L'entendre à nouveau" : "Ne plus l'entendre") + "</button>";
  }
  function rendrePersonne(el) {
    var p = gens.personne, a = presenceDe(p);
    el.innerHTML = '<button type="button" class="zj-bouton zj-bouton--discret zj-gens__retour" data-gens-retour="1">← Retour</button>' +
      '<div class="zj-personne"><span class="zj-medaillon zj-medaillon--personne"><canvas width="44" height="58" data-gens-avatar-p="1" aria-hidden="true"></canvas></span><div><b class="zj-personne__nom" translate="no" dir="auto">' + esc(p.pseudo) + "</b>" +
      '<span>' + esc(a ? (a.assoupi ? "absent pour l'instant" : "dans la pièce") : "plus dans la pièce") + "</span></div></div>" +
      '<div id="zj-personne-gestes" class="zj-personne__gestes">' + gestesPersonne(p) + "</div>" +
      '<div id="zj-personne-carte" class="zj-bitaqa"></div>' +   // v8.6 — sa carte (la Bitaqa)
      '<p class="zj-gens__note">« Ne plus l\'entendre » vit dans ce navigateur : ses mots quittent ta cour tout de suite, et personne n\'en sait rien.</p>';
    dessinerAvatarDans(el.querySelector("canvas[data-gens-avatar-p]"), p.avatar || (a && a.avatar), 44, 58);
    rendreCartePersonne();
  }
  // Ceux qu'on n'entend plus : par compte, dans ce navigateur (sahn.js).
  function cleSourds() { return "zwj.sourds." + (joueur && joueur.id ? joueur.id : ""); }
  function chargerSourds() {
    try { kalam.sourds = Sh.normaliserSourds(JSON.parse(localStorage.getItem(cleSourds()) || "[]")); }
    catch (e) { kalam.sourds = []; }
  }
  function basculerSourd(id, oui) {
    kalam.sourds = Sh.basculerSourd(kalam.sourds, id, oui);
    try { localStorage.setItem(cleSourds(), JSON.stringify(kalam.sourds)); } catch (e) { /* navigation privée : le temps de l'onglet */ }
    if (oui) {
      kalam.fil = Sh.sansLesSourds(kalam.fil, kalam.sourds);
      for (var k in sahn.autres) if (sahn.autres[k].id === id) sahn.autres[k].bulle = null;
    }
    rendreGens();
  }
  // LE KALAM — ce qui se dit dans la pièce, depuis que j'y suis entré.
  function rendreKalamOnglet(el) {
    var ouvert = !!sahn.actif;
    el.innerHTML = '<p class="zj-gens__note">' + esc(ouvert ? "Ce qui se dit ici reste ici : rien n'est gardé. Tu vois ce qui s'est dit depuis ton arrivée." : horsLigneGens()) + "</p>" +
      '<ol id="zj-gens-kalam-fil" class="zj-kalamo__fil" aria-live="polite"></ol>' +
      (ouvert ? '<div class="zj-kalamo__phrases">' + Sh.PHRASES.map(function (ph) {
        return '<button type="button" class="zj-kalamo__phrase" data-kalam-phrase="' + esc(ph.cle) + '">' + esc(ph.texte) + "</button>";
      }).join("") + "</div>" +
        '<form id="zj-gens-kalam-form" class="zj-kalamo__form" autocomplete="off" novalidate>' +
        '<input id="zj-gens-kalam-texte" type="text" maxlength="' + Sh.KALAM_MAX + '" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Un mot pour la pièce — 280 caractères, sans lien" aria-label="Ton mot" />' +
        '<button type="submit" class="zj-bouton">Dire</button></form><p id="zj-gens-kalam-msg" class="zj-dire__msg" aria-live="polite"></p>' : "");
    rendreFilKalam();
  }
  function rendreFilKalam() {
    var ol = $("#zj-gens-kalam-fil");
    if (!ol) return;
    var enBas = ol.scrollHeight - ol.scrollTop - ol.clientHeight < 40, maintenant = Date.now();
    if (!kalam.fil.length) {
      ol.innerHTML = '<li class="zj-kalamo__vide">' + esc(sahn.actif ? "Rien n'a été dit depuis ton arrivée. Dis salam : tous ceux de la pièce le verront." : "…") + "</li>";
    } else {
      ol.innerHTML = kalam.fil.map(function (l) {
        return '<li class="zj-kalamo__l' + (l.moi ? " zj-kalamo__l--moi" : "") + (l.mention ? " zj-kalamo__l--mention" : "") + '">' +
          (l.moi ? '<b class="zj-kalamo__qui" translate="no" dir="auto">' + esc(l.pseudo) + "</b>"
                 : '<button type="button" class="zj-kalamo__qui" data-gens-personne="' + esc(l.cle) + '" data-gens-personne-id="' + esc(l.id) + '" translate="no" dir="auto">' + esc(l.pseudo) + "</button>") +
          '<span class="zj-kalamo__t" translate="no" dir="auto">' + esc(l.texte) + "</span>" +
          '<time class="zj-kalamo__quand">' + esc(Rl ? Rl.quand(new Date(l.t).toISOString(), maintenant) : "") + "</time></li>";
      }).join("");
    }
    if (enBas || ol.getAttribute("data-vu") !== "1") ol.scrollTop = ol.scrollHeight;
    ol.setAttribute("data-vu", "1");
  }
  function direDepuisLeKalam(texte) {
    var inp = $("#zj-gens-kalam-texte"), msg = $("#zj-gens-kalam-msg");
    var r = direDansLaPiece(typeof texte === "string" ? texte : (inp ? inp.value : ""));
    if (msg) msg.textContent = r.ok ? "" : r.erreur;
    if (r.ok && inp && typeof texte !== "string") inp.value = "";
    return r;
  }
  // Les phrases rapides : en page arabe, on dit la phrase que la page montre.
  function phraseKalam(cle) {
    var ph = null;
    Sh.PHRASES.forEach(function (x) { if (x.cle === cle) ph = x; });
    if (!ph) return;
    var ar = Lg && Lg.estAr();
    if (ph.debut) {
      var inp = $("#zj-gens-kalam-texte");
      if (!inp) return;
      inp.value = (ar ? Lg.t(ph.debut.trim()) : ph.debut.trim()) + " ";
      inp.focus();
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* un champ sans sélection */ }
      return;
    }
    direDepuisLeKalam(ar ? Lg.t(ph.texte) : ph.texte);
  }
  // LE FIL DANS LA COUR — les dernières lignes, en bas à gauche (au-dessus de la croix au
  // téléphone), vingt secondes ; les toucher ouvre le Kalam. Caché quand un panneau parle.
  var KALAM_SCENE_MS = 20000;
  function rendreKalamScene() {
    var el = $("#zj-kalam-cour");
    if (!el) return;
    clearTimeout(kalam.minuteurScene);
    var maintenant = Date.now(), pn = $("#zj-gens"), n = window.innerWidth < 760 ? 2 : 3;
    var cache = (pn && !pn.hidden) || ecran !== "cour" || !sahn.canal;
    var recentes = cache ? [] : kalam.fil.filter(function (l) { return maintenant - l.t < KALAM_SCENE_MS; }).slice(-n);
    if (!recentes.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = recentes.map(function (l) {
      return '<button type="button" class="zj-kalam-cour__l' + (l.moi ? " zj-kalam-cour__l--moi" : "") + (l.mention ? " zj-kalam-cour__l--mention" : "") + '" data-kalam-ouvrir="1">' +
        '<b translate="no" dir="auto">' + esc(l.pseudo) + '</b><span translate="no" dir="auto">' + esc(l.texte) + "</span></button>";
    }).join("");
    kalam.minuteurScene = setTimeout(rendreKalamScene, Math.max(400, KALAM_SCENE_MS - (maintenant - recentes[0].t)));
  }
  // MESSAGES — les Rasa'il. La boîte se lit sans rien marquer ; un fil ne se lit qu'ouvert.
  function chargerBoite() {
    if (dayf.actif || !Rl || !compte || typeof compte.fils !== "function") return Promise.resolve(null);
    return compte.fils().then(function (r) {
      if (!r || !r.ok) { rasail.erreur = Rl.texteErreur(r); majGens(); return r; }
      var b = Rl.normaliserFils(r);
      rasail.fils = b.fils; rasail.nouveaux = b.nouveaux; rasail.nonLus = Rl.nonLus(b.fils);
      rasail.charge = true; rasail.erreur = null;
      majGens();
      return r;
    });
  }
  // La relecture de fond (à la minute, au retour sur l'onglet, à un « toc ») : le NOMBRE seul.
  function relireNonLus() {
    if (dayf.actif || ecran !== "cour" || document.hidden || !compte || typeof compte.nonLus !== "function") return;
    compte.nonLus().then(function (n) {
      if (typeof n !== "number") return;
      var avant = rasail.nonLus || 0, deja = rasail.vu;
      rasail.nonLus = n; rasail.vu = true;
      var pn = $("#zj-gens"), ici = pn && !pn.hidden && gens.onglet === "rasail" && !gens.personne;
      if (deja && n > avant) sonner("entree");
      if (ici && rasail.avec && n > 0) relireFilOuvert();   // je le regarde : le lire, c'est l'avoir lu
      else if (ici && !rasail.avec && n !== avant) chargerBoite();
      majGens();
    });
  }
  function trouverFil(id) {
    for (var i = 0; i < rasail.fils.length; i++) if (rasail.fils[i].autre === id) return rasail.fils[i];
    return null;
  }
  // v8.7 — `brouillon` : le premier mot déjà écrit (« Je peux aider », au Derb). Il se pose
  // dans la case si elle est vide et ouverte ; il ne part JAMAIS tout seul.
  function ouvrirFil(id, pseudo, avatar, brouillon) {
    if (!id || dayf.actif || !Rl || !compte || typeof compte.lireFil !== "function") return;
    if (joueur && id === joueur.id) return;
    if (!montrerGens()) return;
    gens.onglet = "rasail"; gens.personne = null;
    rasail.avec = { id: id, pseudo: pseudo || "…", avatar: avatar || null };
    rasail.fil = null; rasail.signaler = false; rasail.msg = "";
    rendreGens();
    compte.lireFil(id).then(function (r) {
      if (!rasail.avec || rasail.avec.id !== id) return;
      if (!r || !r.ok) { rasail.msg = Rl.texteErreur(r); rendreMessagesFil(); return; }
      rasail.fil = Rl.normaliserFil(r); rasail.nouveaux = Number(r.nouveaux) || 0;
      rasail.avec.pseudo = rasail.fil.autre.pseudo;
      if (rasail.fil.autre.avatar) rasail.avec.avatar = rasail.fil.autre.avatar;
      var f = trouverFil(id); if (f) f.nonLus = 0;
      rendreGens();
      var t = $("#zj-rasail-texte"), tactile = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      if (t && !t.disabled && brouillon && !t.value) { t.value = String(brouillon).slice(0, Rl.TEXTE_MAX); t.setSelectionRange(t.value.length, t.value.length); }
      if (t && !t.disabled && !tactile) t.focus();
      relireNonLus();
    });
  }
  function relireFilOuvert() {
    if (!rasail.avec || !compte) return;
    var id = rasail.avec.id;
    compte.lireFil(id).then(function (r) {
      if (!rasail.avec || rasail.avec.id !== id || !r || !r.ok) return;
      rasail.fil = Rl.normaliserFil(r); rasail.nouveaux = Number(r.nouveaux) || 0;
      rendreMessagesFil();
    });
  }
  function filPlusAncien() {
    var f = rasail.fil;
    if (!f || !f.messages.length || !rasail.avec || !compte) return;
    var id = rasail.avec.id;
    compte.lireFil(id, Number(f.messages[0].id)).then(function (r) {
      if (!rasail.avec || rasail.avec.id !== id || !r || !r.ok || !rasail.fil) return;
      var avant = Rl.normaliserFil(r);
      rasail.fil.messages = avant.messages.concat(rasail.fil.messages);
      rasail.fil.plus = avant.plus;
      var ol = $("#zj-rasail-messages"), h = ol ? ol.scrollHeight : 0;
      rendreMessagesFil();
      if (ol) ol.scrollTop = ol.scrollHeight - h;   // on reste sur le message qu'on lisait
    });
  }
  function rendreBoite(el) {
    var tete = '<p class="zj-gens__note">Tes conversations privées. Deux messages au plus tant que l\'autre n\'a pas répondu : ici, on ne prospecte pas.</p>';
    if (!rasail.charge) { el.innerHTML = tete + '<p class="zj-gens__vide">' + esc(rasail.erreur || "On ouvre ta boîte…") + "</p>"; return; }
    if (!rasail.fils.length) {
      el.innerHTML = tete + '<p class="zj-gens__vide">Aucune conversation encore. Pour écrire à quelqu\'un : touche son nom, dans « Ici » ou dans le Kalam.</p>';
      return;
    }
    var maintenant = Date.now();
    el.innerHTML = tete + '<ul class="zj-rasail__liste">' + rasail.fils.map(function (f) {
      return '<li><button type="button" class="zj-rasail__fil' + (f.nonLus ? " zj-rasail__fil--nonlu" : "") + '" data-rasail-ouvrir="' + esc(f.autre) + '">' +
        '<span class="zj-medaillon zj-medaillon--gens"><canvas width="34" height="45" data-rasail-avatar="' + esc(f.autre) + '" aria-hidden="true"></canvas></span>' +
        '<span class="zj-rasail__qui"><b translate="no" dir="auto">' + esc(f.pseudo) + "</b>" +
        '<span class="zj-rasail__apercu">' + (f.dernierMoi ? "<i>Toi :</i> " : "") + '<span translate="no" dir="auto">' + esc(f.apercu) + "</span></span></span>" +
        '<time class="zj-rasail__quand">' + esc(Rl.quand(f.dernierLe, maintenant)) + "</time>" +
        (f.nonLus ? '<span class="zj-pastille zj-rasail__n">' + f.nonLus + "</span>" : "") +
        (f.bloque ? '<span class="zj-rasail__etiquette">bloqué</span>' : "") +
        "</button></li>";
    }).join("") + "</ul>";
    rasail.fils.forEach(function (f) { dessinerAvatarDans(el.querySelector('canvas[data-rasail-avatar="' + f.autre + '"]'), f.avatar, 34, 45); });
  }
  function rendreFilOuvert(el) {
    var a = rasail.avec;
    el.innerHTML = '<div class="zj-rasail__tete"><button type="button" class="zj-bouton zj-bouton--discret" data-rasail-retour="1">← Mes messages</button>' +
      '<span class="zj-medaillon zj-medaillon--gens"><canvas width="34" height="45" data-rasail-avatar-fil="1" aria-hidden="true"></canvas></span><b class="zj-rasail__avec" translate="no" dir="auto">' + esc(a.pseudo) + "</b>" +
      '<span id="zj-rasail-actions" class="zj-rasail__actions"></span></div>' +
      '<div id="zj-rasail-signal"></div>' +
      '<ol id="zj-rasail-messages" class="zj-rasail__messages" aria-live="polite"></ol>' +
      '<form id="zj-rasail-form" class="zj-rasail__form" autocomplete="off" novalidate>' +
      '<textarea id="zj-rasail-texte" maxlength="' + Rl.TEXTE_MAX + '" rows="2" placeholder="Ton message — 600 caractères" aria-label="Ton message"></textarea>' +
      '<button id="zj-rasail-envoyer" type="submit" class="zj-bouton">Envoyer</button></form>' +
      '<p id="zj-rasail-msg" class="zj-rasail__msg" aria-live="polite"></p>';
    dessinerAvatarDans(el.querySelector("canvas[data-rasail-avatar-fil]"), a.avatar, 34, 45);
    rendreMessagesFil();
  }
  function rendreMessagesFil() {
    var ol = $("#zj-rasail-messages"), f = rasail.fil;
    if (!ol || !rasail.avec) return;
    var act = $("#zj-rasail-actions");
    if (act) act.innerHTML = !f ? "" :
      '<button type="button" class="zj-bouton zj-bouton--discret" data-rasail-bloquer="' + (f.bloque ? "0" : "1") + '">' + esc(f.bloque ? "Débloquer" : "Bloquer") + "</button>" +
      (f.messages.some(function (m) { return !m.moi; })
        ? '<button type="button" class="zj-bouton zj-bouton--discret" data-rasail-signaler="1"' + (f.signale ? " disabled" : "") + ">" + esc(f.signale ? "Signalé" : "Signaler") + "</button>" : "");
    var sg = $("#zj-rasail-signal");
    if (sg) sg.innerHTML = !rasail.signaler ? "" :
      '<form id="zj-rasail-signal-form" class="zj-rasail__signal" novalidate><p>Dis en quelques mots ce qui ne va pas. Le bureau lira ce fil — lui seul, et parce que tu le signales.</p>' +
      '<input id="zj-rasail-signal-mot" type="text" maxlength="' + Rl.MOT_MAX + '" placeholder="Ce qui ne va pas — relance, insulte, arnaque…" aria-label="Ce qui ne va pas" />' +
      '<div class="zj-rasail__signal-gestes"><button type="submit" class="zj-bouton">Envoyer au bureau</button>' +
      '<button type="button" class="zj-bouton zj-bouton--discret" data-rasail-signal-annuler="1">Annuler</button></div></form>';
    var enBas = ol.scrollHeight - ol.scrollTop - ol.clientHeight < 40, maintenant = Date.now();
    if (!f) ol.innerHTML = '<li class="zj-rasail__vide">' + esc(rasail.msg || "On ouvre le fil…") + "</li>";
    else if (!f.messages.length) ol.innerHTML = '<li class="zj-rasail__vide">Écris le premier mot. Présente-toi, et dis pourquoi tu écris : c\'est ce qui fait répondre.</li>';
    else {
      ol.innerHTML = (f.plus ? '<li class="zj-rasail__plus"><button type="button" class="zj-bouton zj-bouton--discret" data-rasail-plus="1">Messages plus anciens</button></li>' : "") +
        f.messages.map(function (m) {
          return '<li class="zj-rasail__m' + (m.moi ? " zj-rasail__m--moi" : "") + '"><p translate="no" dir="auto">' + (Kl ? Kl.rendre(m.texte) : esc(m.texte)) + "</p>" +
            '<time>' + esc(Rl.quand(m.le, maintenant)) + "</time></li>";
        }).join("");
    }
    if (enBas || ol.getAttribute("data-vu") !== "1") ol.scrollTop = ol.scrollHeight;
    ol.setAttribute("data-vu", "1");
    // La porte d'écriture : ce que la base dirait, dit AVANT d'essayer (rasail.js).
    var msg = $("#zj-rasail-msg"), bt = $("#zj-rasail-envoyer"), ta = $("#zj-rasail-texte");
    var porte = f ? Rl.peutEcrire(f) : { ok: false, raison: rasail.msg || "" };
    if (f && porte.ok && !f.messages.length) {
      var o = Rl.peutOuvrir(rasail.nouveaux);
      porte = o.ok ? { ok: true, info: "Nouvelle conversation — il t'en reste " + o.reste + " aujourd'hui." } : { ok: false, raison: o.raison };
    }
    if (msg && !rasail.envoi) { msg.textContent = porte.ok ? (porte.info || "") : porte.raison; msg.classList.toggle("zj-rasail__msg--refus", !porte.ok); }
    if (bt) bt.disabled = !porte.ok || rasail.envoi;
    if (ta) ta.disabled = !porte.ok;
  }
  function envoyerFil() {
    var ta = $("#zj-rasail-texte"), msg = $("#zj-rasail-msg");
    if (!rasail.avec || rasail.envoi || !compte || typeof compte.ecrire !== "function") return;
    var v = Rl.valider(ta ? ta.value : "");
    if (!v.ok) { if (msg) msg.textContent = v.erreur; return; }
    var porte = Rl.peutEcrire(rasail.fil);
    if (!porte.ok) { if (msg) msg.textContent = porte.raison; return; }
    var id = rasail.avec.id, bt = $("#zj-rasail-envoyer");
    rasail.envoi = true;
    if (bt) bt.disabled = true;
    compte.ecrire(id, v.texte).then(function (r) {
      rasail.envoi = false;
      if (!rasail.avec || rasail.avec.id !== id) return;
      if (!r || !r.ok) {
        var m2 = $("#zj-rasail-msg"), b2 = $("#zj-rasail-envoyer");
        if (m2) { m2.textContent = Rl.texteErreur(r); m2.classList.add("zj-rasail__msg--refus"); }
        if (b2) b2.disabled = false;
        return;
      }
      var t2 = $("#zj-rasail-texte"); if (t2) t2.value = "";
      rasail.fil = Rl.normaliserFil(r); rasail.nouveaux = Number(r.nouveaux) || 0;
      rendreMessagesFil();
      tocPour(id);
      chargerBoite();
      // Bab — en atelier, le collègue de démonstration répond quelques secondes plus tard : on
      // relit le fil à ce moment-là plutôt qu'à la relecture de la minute (vu en rejouant la démo).
      // Seulement s'il est encore sous les yeux : lire, c'est marquer lu.
      if (compte.mode === "local") setTimeout(function () {
        var pn = $("#zj-gens");
        if (pn && !pn.hidden && gens.onglet === "rasail" && rasail.avec && rasail.avec.id === id) relireFilOuvert();
      }, 4500);
    });
  }
  function bloquerFil(oui) {
    if (!rasail.avec || !compte || typeof compte.bloquer !== "function") return;
    var id = rasail.avec.id;
    compte.bloquer(id, !!oui).then(function (r) {
      if (!r || !r.ok) { var m = $("#zj-rasail-msg"); if (m) m.textContent = Rl.texteErreur(r); return; }
      if (rasail.fil && rasail.avec && rasail.avec.id === id) rasail.fil.bloque = !!r.bloque;
      rendreMessagesFil();
      chargerBoite();
    });
  }
  function signalerFilOuvert() {
    var inp = $("#zj-rasail-signal-mot"), msg = $("#zj-rasail-msg");
    var v = Rl.validerMot(inp ? inp.value : "");
    if (!v.ok) { if (msg) { msg.textContent = v.erreur; msg.classList.add("zj-rasail__msg--refus"); } return; }
    if (!rasail.avec || !compte || typeof compte.signalerFil !== "function") return;
    var id = rasail.avec.id;
    compte.signalerFil(id, v.mot).then(function (r) {
      var m = $("#zj-rasail-msg");
      if (!r || !r.ok) { if (m) m.textContent = Rl.texteErreur(r); return; }
      rasail.signaler = false;
      if (rasail.fil) rasail.fil.signale = true;
      rendreMessagesFil();
      if (m) { m.textContent = "Signalé. Le bureau lira ce fil. Tu peux aussi bloquer cette personne."; m.classList.remove("zj-rasail__msg--refus"); }
    });
  }
  // ---- v8.6 — LA BITAQA : la carte d'un membre, et l'annuaire (bitaqa.js, zawia-bitaqa.sql) ---------
  // Deux moitiés : ce que le JEU SAIT (rang, tariqa, maharat prouvées, depuis quand — la même
  // vérité que le Lawh) et ce que le membre CHOISIT DE DIRE (ville, métier, ce qu'il cherche et
  // ce qu'il offre, langues, liens). Fermée par défaut ; lue par les joueurs admis seulement —
  // la base tient la porte. ⚠️ Ni téléphone ni e-mail : on se joint par les Rasa'il.
  var CARTE_FRAICHE_MS = 60000;
  function nomAr(x) { return x ? (Lg && Lg.estAr() && x.ar ? x.ar : x.nom) : ""; }
  // ⚠️ En UTC : le Maroc y est depuis le 20/09/2026, et la tzdata des navigateurs le met encore à +1.
  function dateLongue(iso) {
    try { return new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); }
    catch (e) { return ""; }
  }
  function chargerCartePersonne(id) {
    if (!id || dayf.actif || !Bq || !compte || typeof compte.carte !== "function") return;
    var c = bitaqa.cartes[id];
    if (c && c.r && Date.now() - c.t < CARTE_FRAICHE_MS) return;
    compte.carte(id).then(function (r) {
      bitaqa.cartes[id] = { t: Date.now(), r: r && r.ok ? Bq.normaliser(r) : null, erreur: r && !r.ok ? (r.erreur || null) : null };
      if (gens.personne && gens.personne.id === id) rendreCartePersonne();
    });
  }
  function rendreCartePersonne() {
    var el = $("#zj-personne-carte"), p = gens.personne;
    if (!el || !p || !Bq) return;
    var c = bitaqa.cartes[p.id];
    if (!c) { el.innerHTML = '<p class="zj-gens__vide">On lit sa carte…</p>'; return; }
    if (!c.r) { el.innerHTML = '<p class="zj-gens__vide">' + esc(c.erreur || "La carte ne s'est pas ouverte.") + "</p>"; return; }
    el.innerHTML = htmlCarte(c.r, false);
    if (!p.avatar && c.r.joueur.avatar) {   // venue de l'annuaire ou du Souk : le visage arrive avec la carte
      p.avatar = c.r.joueur.avatar;
      dessinerAvatarDans($("#zj-gens-corps canvas[data-gens-avatar-p]"), p.avatar, 44, 58);
    }
  }
  // La carte telle que les autres la voient. `mienne` : l'aperçu, dans mon éditeur.
  function htmlCarte(n, mienne) {
    var c = n.carte, html = "";
    if (c && !Bq.vide(c)) {
      html += '<section class="zj-bitaqa__dit">';
      if (c.metier) html += '<p class="zj-bitaqa__metier" translate="no" dir="auto">' + esc(c.metier) + "</p>";
      var lieu = [];
      if (c.ville) lieu.push('<span class="zj-bitaqa__ville" translate="no" dir="auto">' + esc(c.ville) + "</span>");
      c.langues.forEach(function (l) { lieu.push("<span>" + esc(nomAr(Bq.entree(Bq.LANGUES, l))) + "</span>"); });
      if (lieu.length) html += '<p class="zj-bitaqa__lieu">' + lieu.join(" · ") + "</p>";
      if (c.cherche.length || c.chercheMot) html += blocEtiquettes("Cherche", Bq.CHERCHE, c.cherche, c.chercheMot, "cherche");
      if (c.offre.length || c.offreMot) html += blocEtiquettes("Offre", Bq.OFFRE, c.offre, c.offreMot, "offre");
      if (c.liens.length) html += '<p class="zj-bitaqa__liens">' + c.liens.map(function (l) {
        return '<a class="zj-bouton zj-bouton--discret" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer nofollow ugc">' + esc(nomAr(Bq.entree(Bq.LIENS, l.type))) + "</a>";
      }).join("") + "</p>";
      html += "</section>";
    } else if (mienne) {
      html += '<p class="zj-bitaqa__fermee">Tu n\'as rien écrit encore : ta carte ne dirait que ce que la maison sait.</p>';
    } else {
      html += '<p class="zj-bitaqa__fermee">Cette carte est encore fermée : ce membre n\'a rien dit de plus.</p>';
    }
    return html + faitsCarte(n.joueur);
  }
  function blocEtiquettes(titre, liste, cles, mot, genre) {
    return '<div class="zj-bitaqa__bloc"><p class="zj-bitaqa__titre">' + esc(titre) + "</p>" +
      (cles.length ? '<p class="zj-bitaqa__puces">' + cles.map(function (k) { return '<span class="zj-puce zj-puce--' + genre + '">' + esc(nomAr(Bq.entree(liste, k))) + "</span>"; }).join("") + "</p>" : "") +
      (mot ? '<p class="zj-bitaqa__mot" translate="no" dir="auto">' + esc(mot) + "</p>" : "") + "</div>";
  }
  // Ce que la maison sait : les noms viennent des modules (leur `ar`), jamais du dictionnaire.
  function faitsCarte(j) {
    var rg = R.rang(j.rang || "talib"), tq = j.tariqa && Tq ? Tq.tariqa(j.tariqa) : null, md = j.maydan && Tq ? Tq.maydan(j.maydan) : null;
    var mh = Mh ? Mh.ijazatDe(j.maharat) : { prouvees: 0, ijazat: [], diplome: false };
    var noms = Mh ? j.maharat.map(function (k) { return Mh.mahara(k); }).filter(Boolean).slice(0, 3).map(nomAr) : [];
    var l = [];
    l.push('<li><b>Rang</b><span translate="no">' + esc(nomAr(rg)) + "</span></li>");
    if (tq) l.push('<li><b>Tariqa</b><span translate="no">' + esc(nomAr(tq)) + (md ? " · " + esc(nomAr(md)) : "") + "</span></li>");
    l.push("<li><b>Maharat</b><span>" + esc(mh.prouvees ? mh.prouvees + " prouvée" + (mh.prouvees > 1 ? "s" : "") : "aucune prouvée encore") + "</span>" +
      (noms.length ? '<span class="zj-bitaqa__noms" translate="no">' + noms.map(esc).join(" · ") + "</span>" : "") + "</li>");
    if (mh.ijazat.length) l.push('<li><b>Ijazat</b><span translate="no">' + mh.ijazat.map(function (d) { return esc(nomAr(Mh.domaine(d))); }).join(" · ") + "</span></li>");
    if (mh.diplome) l.push('<li class="zj-bitaqa__diplome"><b>Ijaza de la Zawia</b><span>obtenue</span></li>');
    if (j.depuis) l.push('<li><b>Dans la cour depuis</b><span translate="no">' + esc(dateLongue(j.depuis)) + "</span></li>");
    return '<section class="zj-bitaqa__faits"><p class="zj-bitaqa__titre">Ce que la maison sait</p><ul>' + l.join("") + "</ul></section>";
  }
  // L'ANNUAIRE — les cartes ouvertes, filtrées par la base.
  function chargerMaCarte() {
    if (dayf.actif || !Bq || !compte || typeof compte.maCarte !== "function") return Promise.resolve(null);
    return compte.maCarte().then(function (r) {
      if (r && r.ok) bitaqa.mienne = Bq.normaliser(r);
      rendreMaCarteResume();
      return r;
    });
  }
  function rendreMaCarteResume() {
    var el = $("#zj-annuaire-moi");
    if (!el) return;
    var m = bitaqa.mienne, ouverte = !!(m && m.visible);
    el.innerHTML = "<p>" + esc(!m ? "…" : ouverte ? "Ta carte est ouverte aux membres de la maison." : "Ta carte est fermée : personne ne la voit.") + "</p>" +
      '<button type="button" class="zj-bouton' + (ouverte ? " zj-bouton--discret" : "") + '" data-bitaqa-editer="1">' + esc(ouverte ? "Modifier ma carte" : "Écrire ma carte") + "</button>";
  }
  function rendreAnnuaire(el) {
    var f = bitaqa.filtres || {};
    var choix = function (nom, tous, liste) {
      return '<select data-annuaire-filtre="' + nom + '" aria-label="' + esc(tous) + '"><option value="">' + esc(tous) + "</option>" +
        liste.map(function (e) { return '<option value="' + esc(e.cle) + '"' + (f[nom] === e.cle ? " selected" : "") + ">" + esc(nomAr(e)) + "</option>"; }).join("") + "</select>";
    };
    // qui sait faire quoi : les maharat, rangées par terrain (leurs noms viennent du catalogue)
    var savoir = !Mh ? "" : '<select data-annuaire-filtre="mahara" aria-label="Qui sait faire…"><option value="">Qui sait faire…</option>' +
      Mh.DOMAINES.map(function (d) {
        return '<optgroup label="' + esc(nomAr(d)) + '">' + Mh.parDomaine(d.cle).map(function (m) {
          return '<option value="' + esc(m.cle) + '"' + (f.mahara === m.cle ? " selected" : "") + ">" + esc(nomAr(m)) + "</option>";
        }).join("") + "</optgroup>";
      }).join("") + "</select>";
    el.innerHTML = '<div id="zj-annuaire-moi" class="zj-annuaire__moi"></div>' +
      '<p class="zj-gens__note">Les cartes que les membres ont ouvertes. Qui peut t\'apprendre, qui cherche un associé, qui recrute : écris-lui.</p>' +
      '<div class="zj-annuaire__filtres">' +
        '<input id="zj-annuaire-texte" type="search" maxlength="40" autocomplete="off" placeholder="Un nom, un métier, une ville…" aria-label="Chercher dans l\'annuaire" value="' + esc(f.texte || "") + '" />' +
        choix("cherche", "Qui cherche…", Bq.CHERCHE) + choix("offre", "Qui offre…", Bq.OFFRE) +
        choix("tariqa", "Toutes les tariqat", Tq ? Tq.TARIQAT : []) + choix("maydan", "Tous les terrains", Tq ? Tq.MAYADIN : []) + savoir +
      "</div>" +
      '<p id="zj-annuaire-compte" class="zj-annuaire__compte"></p>' +
      '<ul id="zj-annuaire-liste" class="zj-annuaire__liste" aria-live="polite"></ul>';
    rendreMaCarteResume();
    if (bitaqa.annuaire) rendreListeAnnuaire();   // la page d'avant, le temps que la base réponde
    chargerMaCarte();
    chargerAnnuaire(0);
  }
  function chargerAnnuaire(page) {
    if (dayf.actif || !Bq || !compte || typeof compte.annuaire !== "function") return;
    var f = Bq.filtres(bitaqa.filtres, Tq ? Tq.TARIQAT : [], Tq ? Tq.MAYADIN : []);
    var demande = (bitaqa.demande || 0) + 1;
    bitaqa.demande = demande;
    compte.annuaire(f, page || 0).then(function (r) {
      if (demande !== bitaqa.demande) return;   // une frappe plus récente a demandé autre chose
      var liste = $("#zj-annuaire-liste");
      if (!r || !r.ok) { if (liste) liste.innerHTML = '<li class="zj-gens__vide">' + esc((r && r.erreur) || "L'annuaire ne répond pas.") + "</li>"; return; }
      var a = Bq.normaliserAnnuaire(r);
      bitaqa.annuaire = page && bitaqa.annuaire
        ? { cartes: bitaqa.annuaire.cartes.concat(a.cartes), total: a.total, page: a.page, plus: a.plus } : a;
      rendreListeAnnuaire();
    });
  }
  function filtresActifs() {
    var f = bitaqa.filtres || {};
    return !!(f.texte || f.tariqa || f.maydan || f.cherche || f.offre || f.ville || f.mahara);
  }
  function rendreListeAnnuaire() {
    var liste = $("#zj-annuaire-liste"), compteEl = $("#zj-annuaire-compte"), a = bitaqa.annuaire;
    if (!liste || !a) return;
    if (compteEl) compteEl.textContent = a.total ? a.total + " carte" + (a.total > 1 ? "s" : "") + " ouverte" + (a.total > 1 ? "s" : "") : "";
    if (!a.cartes.length) {
      liste.innerHTML = '<li class="zj-gens__vide">' + esc(filtresActifs() ? "Personne ne répond à ces filtres pour l'instant." : "Aucune carte ouverte encore. Ouvre la tienne : c'est ainsi que l'annuaire commence.") + "</li>";
      return;
    }
    liste.innerHTML = a.cartes.map(function (x) {
      var j = x.joueur, c = x.carte, soi = !!(joueur && j.id === joueur.id);
      var etiq = c.cherche.slice(0, 2).map(function (k) { return '<span class="zj-puce zj-puce--cherche">' + esc(nomAr(Bq.entree(Bq.CHERCHE, k))) + "</span>"; })
        .concat(c.offre.slice(0, 2).map(function (k) { return '<span class="zj-puce zj-puce--offre">' + esc(nomAr(Bq.entree(Bq.OFFRE, k))) + "</span>"; })).join("");
      return '<li><button type="button" class="zj-annuaire__carte" data-annuaire-ouvrir="' + esc(j.id) + '"' + (soi ? " disabled" : "") + ">" +
        '<span class="zj-medaillon zj-medaillon--gens"><canvas width="34" height="45" data-annuaire-avatar="' + esc(j.id) + '" aria-hidden="true"></canvas></span>' +
        '<span class="zj-annuaire__qui"><b translate="no" dir="auto">' + esc(j.pseudo) + "</b>" + (soi ? " <i>(toi)</i>" : "") +
        (c.metier ? '<span class="zj-annuaire__metier" translate="no" dir="auto">' + esc(c.metier) + "</span>" : "") +
        '<span class="zj-annuaire__lieu"><span translate="no">' + esc(nomAr(R.rang(j.rang || "talib"))) + "</span>" +
        (c.ville ? ' · <span translate="no" dir="auto">' + esc(c.ville) + "</span>" : "") + "</span></span>" +
        (etiq ? '<span class="zj-annuaire__etiq">' + etiq + "</span>" : "") + "</button></li>";
    }).join("") + (a.plus ? '<li class="zj-annuaire__plus"><button type="button" class="zj-bouton zj-bouton--discret" data-annuaire-plus="1">Voir plus</button></li>' : "");
    a.cartes.forEach(function (x) { dessinerAvatarDans(liste.querySelector('canvas[data-annuaire-avatar="' + x.joueur.id + '"]'), x.joueur.avatar, 34, 45); });
  }
  function trouverDansAnnuaire(id) {
    var a = bitaqa.annuaire;
    if (!a) return null;
    for (var i = 0; i < a.cartes.length; i++) if (a.cartes[i].joueur.id === id) return a.cartes[i];
    return null;
  }
  // MA CARTE — l'éditeur. Il s'ouvre par-dessus tout ; venu de l'annuaire, il y ramène.
  function ouvrirMaCarte(retour) {
    var pn = $("#zj-bitaqa");
    if (!pn || dayf.actif || !Bq) return;
    bitaqa.retour = retour || null;
    basculerMenu(false); fermerDialogue(); fermerAller(); fermerGens();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    rendreEditeurCarte();
    chargerMaCarte().then(function () { if (!pn.hidden) rendreEditeurCarte(); });
  }
  function fermerMaCarte() {
    var pn = $("#zj-bitaqa");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
    if (bitaqa.retour === "annuaire") { bitaqa.retour = null; ouvrirGens("annuaire"); }
  }
  function rendreEditeurCarte(message) {
    var el = $("#zj-bitaqa-corps");
    if (!el || !Bq) return;
    var m = bitaqa.mienne;
    if (!m) { el.innerHTML = '<p class="zj-gens__vide">On ouvre ta carte…</p>'; return; }
    var c = m.carte || Bq.normaliserCarte({});
    var puces = function (nom, liste, choisies) {
      return '<div class="zj-bitaqa__choix">' + liste.map(function (e) {
        return '<label class="zj-puce zj-puce--choix"><input type="checkbox" name="' + nom + '" value="' + esc(e.cle) + '"' + (choisies.indexOf(e.cle) >= 0 ? " checked" : "") + " /><span>" + esc(nomAr(e)) + "</span></label>";
      }).join("") + "</div>";
    };
    var liens = c.liens.slice();
    while (liens.length < Bq.LIENS_MAX) liens.push({ type: liens.length ? "site" : "linkedin", url: "" });
    el.innerHTML = '<form id="zj-bitaqa-form" class="zj-bitaqa__form" novalidate autocomplete="off">' +
      '<label class="zj-bitaqa__ouvrir"><input id="zj-bq-visible" type="checkbox"' + (m.visible ? " checked" : "") + " /><span>Montrer ma carte aux membres de la maison</span></label>" +
      '<p class="zj-gens__note">Fermée, personne ne la lit. Ouverte, seuls les membres admis la voient — jamais un invité, jamais le Lawh public. Ni téléphone ni e-mail : on te joint par les messages de la maison.</p>' +
      '<div class="zj-bitaqa__deux">' +
        '<label class="zj-bitaqa__champ"><span>Ta ville</span><input id="zj-bq-ville" type="text" maxlength="' + Bq.VILLE_MAX + '" list="zj-bq-villes" value="' + esc(c.ville) + '" /></label>' +
        '<label class="zj-bitaqa__champ"><span>Ce que tu fais</span><input id="zj-bq-metier" type="text" maxlength="' + Bq.METIER_MAX + '" placeholder="En une ligne — ton métier, ton projet" value="' + esc(c.metier) + '" /></label>' +
      "</div>" +
      '<datalist id="zj-bq-villes">' + Bq.VILLES.map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join("") + "</datalist>" +
      '<fieldset class="zj-bitaqa__groupe"><legend>Je cherche</legend>' + puces("cherche", Bq.CHERCHE, c.cherche) +
        '<input id="zj-bq-cherche-mot" type="text" maxlength="' + Bq.MOT_MAX + '" placeholder="Ce que tu cherches, en une ligne" value="' + esc(c.chercheMot) + '" /></fieldset>' +
      '<fieldset class="zj-bitaqa__groupe"><legend>J\'offre</legend>' + puces("offre", Bq.OFFRE, c.offre) +
        '<input id="zj-bq-offre-mot" type="text" maxlength="' + Bq.MOT_MAX + '" placeholder="Ce que tu peux donner, en une ligne" value="' + esc(c.offreMot) + '" /></fieldset>' +
      '<fieldset class="zj-bitaqa__groupe"><legend>Mes langues</legend>' + puces("langues", Bq.LANGUES, c.langues) + "</fieldset>" +
      '<fieldset class="zj-bitaqa__groupe"><legend>Mes liens — cinq au plus, en https</legend>' + liens.map(function (l, i) {
        return '<div class="zj-bitaqa__lien"><select data-bq-lien-type="' + i + '" aria-label="Le type du lien">' +
          Bq.LIENS.map(function (t) { return '<option value="' + t.cle + '"' + (t.cle === l.type ? " selected" : "") + ">" + esc(nomAr(t)) + "</option>"; }).join("") + "</select>" +
          '<input data-bq-lien-url="' + i + '" type="url" inputmode="url" maxlength="' + Bq.URL_MAX + '" placeholder="https://" value="' + esc(l.url) + '" aria-label="L\'adresse du lien" /></div>';
      }).join("") + "</fieldset>" +
      '<div class="zj-bitaqa__gestes"><button id="zj-bq-enregistrer" type="submit" class="zj-bouton">Enregistrer ma carte</button></div>' +
      '<p id="zj-bq-msg" class="zj-rasail__msg' + (message && message.erreur ? " zj-rasail__msg--refus" : "") + '" aria-live="polite">' + esc(message ? message.texte : "") + "</p>" +
      "</form>" +
      '<section class="zj-bitaqa__apercu"><p class="zj-bitaqa__titre">Ce que les membres verront</p><div class="zj-bitaqa">' + htmlCarte(m, true) + "</div></section>";
  }
  function enregistrerMaCarte() {
    var form = $("#zj-bitaqa-form"), msg = $("#zj-bq-msg");
    if (!form || bitaqa.envoi || !Bq || !compte || typeof compte.poserCarte !== "function") return;
    var coches = function (nom) { return $$('#zj-bitaqa-form input[name="' + nom + '"]:checked').map(function (x) { return x.value; }); };
    var val = function (id) { var x = $("#" + id); return x ? x.value : ""; };
    var liens = [];
    for (var i = 0; i < Bq.LIENS_MAX; i++) {
      var t = $('[data-bq-lien-type="' + i + '"]'), u = $('[data-bq-lien-url="' + i + '"]');
      if (t && u) liens.push({ type: t.value, url: u.value });
    }
    var v = Bq.valider({ visible: !!($("#zj-bq-visible") && $("#zj-bq-visible").checked), ville: val("zj-bq-ville"), metier: val("zj-bq-metier"),
      cherche: coches("cherche"), chercheMot: val("zj-bq-cherche-mot"), offre: coches("offre"), offreMot: val("zj-bq-offre-mot"),
      langues: coches("langues"), liens: liens });
    // ⚠️ Un refus ne redessine pas le formulaire : ce qui a été tapé reste (la leçon du Souk).
    if (!v.ok) { if (msg) { msg.textContent = v.erreur; msg.classList.add("zj-rasail__msg--refus"); } return; }
    bitaqa.envoi = true;
    var bt = $("#zj-bq-enregistrer"); if (bt) bt.disabled = true;
    compte.poserCarte(v.carte).then(function (r) {
      bitaqa.envoi = false;
      var b2 = $("#zj-bq-enregistrer"); if (b2) b2.disabled = false;
      if (!r || !r.ok) { var m2 = $("#zj-bq-msg"); if (m2) { m2.textContent = (r && r.erreur) || "La carte n'est pas partie. Réessaie."; m2.classList.add("zj-rasail__msg--refus"); } return; }
      bitaqa.mienne = Bq.normaliser(r);
      if (joueur) delete bitaqa.cartes[joueur.id];
      bitaqa.annuaire = null;   // l'annuaire se relira avec elle
      rendreEditeurCarte({ texte: bitaqa.mienne.visible ? "Ta carte est enregistrée, et ouverte aux membres." : "Ta carte est enregistrée. Elle reste fermée : coche la case pour la montrer." });
    });
  }

  // Le « toc » : quelqu'un de la pièce vient de m'écrire. Il ne porte AUCUN contenu —
  // seulement à qui — et ne part que si le destinataire est dans la pièce ; le message,
  // lui, vient toujours de la base.
  function tocPour(id) {
    if (!sahn.canal || !sahn.actif || !id) return;
    var la = false;
    for (var k in sahn.autres) if (sahn.autres[k].id === id) { la = true; break; }
    if (!la) return;   // ailleurs : sa boîte se relira à la minute
    try { sahn.canal.send({ type: "broadcast", event: "toc", payload: { vers: String(id) } }); } catch (e) { /* idem */ }
  }
  function recevoirToc(p) {
    if (!p || !joueur || String(p.vers || "") !== String(joueur.id)) return;
    relireNonLus();
  }
  function brancherDar() {
    var fermeD = $("#zj-dar-fermer");
    if (fermeD) fermeD.addEventListener("click", function () { basculerMenu(false); });
    var fondD = $("#zj-dar");
    if (fondD) fondD.addEventListener("click", function (ev) { if (ev.target === fondD) basculerMenu(false); });
    var q = $("#zj-dar-q");
    if (q) {
      q.addEventListener("input", function () { dar.q = q.value; rendreGrilleDar(); });
      q.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { var premiere = $("#zj-dar-grille [data-dar-cle]"); if (premiere) { ev.preventDefault(); actionnerCommande(premiere.getAttribute("data-dar-cle")); } }
      });
    }
    var portes = $("#zj-dar-portes");
    if (portes) portes.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-dar-porte]"); if (!b) return;
      dar.porte = b.getAttribute("data-dar-porte"); dar.q = ""; if (q) q.value = "";
      rendrePortesDar(); rendreGrilleDar();
    });
    var grille = $("#zj-dar-grille");
    if (grille) grille.addEventListener("click", function (ev) { var b = ev.target.closest("[data-dar-cle]"); if (b) actionnerCommande(b.getAttribute("data-dar-cle")); });
    var jour = $("#zj-dar-jour");
    if (jour) jour.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-dar-jour]"); if (!b) return;
      var c = b.getAttribute("data-dar-jour");
      if (c === "aller") { basculerMenu(false); ouvrirAller(); } else actionnerCommande(c);
    });
    ["lyoum", "ferracha", "gens", "aller", "dar"].forEach(function (g) {
      var b = $("#zj-barre-" + g);
      if (b) b.addEventListener("click", function () { gesteBarre(g); });
    });
    var fermeA = $("#zj-aller-fermer"); if (fermeA) fermeA.addEventListener("click", fermerAller);
    var fondA = $("#zj-aller"); if (fondA) fondA.addEventListener("click", function (ev) { if (ev.target === fondA) fermerAller(); });
    var planA = $("#zj-aller-corps");
    if (planA) planA.addEventListener("click", function (ev) {
      var y = ev.target.closest("[data-aller-y]"), m = ev.target.closest("[data-aller-mener]"), rt = ev.target.closest("[data-aller-rentrer]");
      if (y) allerA(y.getAttribute("data-aller-y"));
      else if (m) menerA(m.getAttribute("data-aller-mener"));
      else if (rt) { fermerAller(); sortirRihla(); }
    });
    var fermeG = $("#zj-gens-fermer"); if (fermeG) fermeG.addEventListener("click", fermerGens);
    var fondG = $("#zj-gens"); if (fondG) fondG.addEventListener("click", function (ev) { if (ev.target === fondG) fermerGens(); });
    var ongletsG = $("#zj-gens-onglets");
    if (ongletsG) ongletsG.addEventListener("click", function (ev) { var b = ev.target.closest("[data-gens-onglet]"); if (b) changerOngletGens(b.getAttribute("data-gens-onglet")); });
    var corpsG = $("#zj-gens-corps");
    if (corpsG) {
      corpsG.addEventListener("click", function (ev) {
        var t = ev.target, x;
        if ((x = t.closest("[data-gens-saluer]"))) { var a = sahn.autres[x.getAttribute("data-gens-saluer")]; fermerGens(); if (a) saluer(a); }
        else if ((x = t.closest("[data-gens-mener]"))) {
          var o = sahn.autres[x.getAttribute("data-gens-mener")];
          if (o && o.cible) { fermerGens(); guide.tuile = { x: Math.floor(o.cible.x / T), y: Math.floor((o.cible.y - 2) / T) }; guide.fil = null; guide.deTuile = ""; guide.jeu = true; }
        }
        else if ((x = t.closest("[data-gens-personne]"))) ouvrirPersonne(x.getAttribute("data-gens-personne"), x.getAttribute("data-gens-personne-id"));
        else if ((x = t.closest("[data-gens-ecrire]"))) { var q = sahn.autres[x.getAttribute("data-gens-ecrire")]; if (q) ouvrirFil(q.id, q.pseudo, q.avatar); }
        else if ((x = t.closest("[data-gens-ecrire-id]"))) { var pe = gens.personne; ouvrirFil(x.getAttribute("data-gens-ecrire-id"), pe && pe.pseudo, pe && pe.avatar); }
        else if ((x = t.closest("[data-gens-sourd]"))) basculerSourd(x.getAttribute("data-gens-sourd"), x.getAttribute("data-oui") === "1");
        else if (t.closest("[data-gens-retour]")) { gens.personne = null; rendreGens(); }
        else if (t.closest("[data-gens-kalam]")) changerOngletGens("kalam");
        else if (t.closest("[data-gens-riwaq]")) { fermerGens(); ouvrirRiwaq(); }
        else if ((x = t.closest("[data-kalam-phrase]"))) phraseKalam(x.getAttribute("data-kalam-phrase"));
        else if ((x = t.closest("[data-rasail-ouvrir]"))) { var id = x.getAttribute("data-rasail-ouvrir"), f = trouverFil(id); ouvrirFil(id, f && f.pseudo, f && f.avatar); }
        else if (t.closest("[data-rasail-retour]")) { rasail.avec = null; rasail.fil = null; rasail.signaler = false; rendreGens(); chargerBoite(); }
        else if ((x = t.closest("[data-rasail-bloquer]"))) bloquerFil(x.getAttribute("data-rasail-bloquer") === "1");
        else if (t.closest("[data-rasail-signaler]")) { rasail.signaler = true; rendreMessagesFil(); var mo = $("#zj-rasail-signal-mot"); if (mo) mo.focus(); }
        else if (t.closest("[data-rasail-signal-annuler]")) { rasail.signaler = false; rendreMessagesFil(); }
        else if (t.closest("[data-rasail-plus]")) filPlusAncien();
        // v8.6 — la Bitaqa : l'annuaire, et ma carte
        else if (t.closest("[data-bitaqa-editer]")) ouvrirMaCarte("annuaire");
        else if (t.closest("[data-annuaire-plus]")) chargerAnnuaire((bitaqa.annuaire ? bitaqa.annuaire.page : 0) + 1);
        else if ((x = t.closest("[data-annuaire-ouvrir]"))) {
          var ida = x.getAttribute("data-annuaire-ouvrir"), qa = trouverDansAnnuaire(ida);
          ouvrirPersonne(null, ida, qa ? { pseudo: qa.joueur.pseudo, avatar: qa.joueur.avatar } : null);
        }
      });
      // v8.6 — les filtres de l'annuaire : un choix relit tout de suite, une frappe après un souffle
      corpsG.addEventListener("change", function (ev) {
        var sel = ev.target && ev.target.closest && ev.target.closest("[data-annuaire-filtre]");
        if (!sel) return;
        bitaqa.filtres[sel.getAttribute("data-annuaire-filtre")] = sel.value || null;
        chargerAnnuaire(0);
      });
      corpsG.addEventListener("input", function (ev) {
        if (!ev.target || ev.target.id !== "zj-annuaire-texte") return;
        bitaqa.filtres.texte = ev.target.value;
        clearTimeout(bitaqa.minuteur);
        bitaqa.minuteur = setTimeout(function () { chargerAnnuaire(0); }, 300);
      });
      corpsG.addEventListener("submit", function (ev) {
        var f = ev.target, i = f && f.id;
        if (i === "zj-gens-kalam-form") { ev.preventDefault(); direDepuisLeKalam(); }
        else if (i === "zj-rasail-form") { ev.preventDefault(); envoyerFil(); }
        else if (i === "zj-rasail-signal-form") { ev.preventDefault(); signalerFilOuvert(); }
      });
      // Entrée envoie le message privé ; Maj+Entrée va à la ligne.
      corpsG.addEventListener("keydown", function (ev) {
        if (ev.target && ev.target.id === "zj-rasail-texte" && ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); envoyerFil(); }
      });
    }
    var fermeB = $("#zj-bitaqa-fermer"); if (fermeB) fermeB.addEventListener("click", fermerMaCarte);   // v8.6 — ma carte
    var fondB = $("#zj-bitaqa"); if (fondB) fondB.addEventListener("click", function (ev) { if (ev.target === fondB) fermerMaCarte(); });
    var corpsB = $("#zj-bitaqa-corps");
    if (corpsB) corpsB.addEventListener("submit", function (ev) { if (ev.target && ev.target.id === "zj-bitaqa-form") { ev.preventDefault(); enregistrerMaCarte(); } });
    var kalamC = $("#zj-kalam-cour");
    if (kalamC) kalamC.addEventListener("click", function (ev) { if (ev.target.closest("[data-kalam-ouvrir]")) ouvrirGens("kalam"); });
  }

  // ---- v2.6 — Le Sahn ouvert : les autres joueurs, en direct ---------------------------------
  // Les règles vivent dans sahn.js ; ici le canal (compte.js), le dessin, le
  // salut. Pas de canal en atelier : la cour reste à soi. Rien de ce qui
  // transite n'est secret — pseudo, avatar, position : ce que la cour montre.
  // ⚠️ v7.2 — un INVITÉ n'entre pas dans le canal des membres : il n'a pas
  // d'identité à diffuser (son id est nul), son salut n'irait nulle part
  // (zawia_rencontres exige une session), et faire entrer un navigateur
  // anonyme dans le direct de la maison est une décision qui se prend, pas un
  // effet de bord. Fail-close en attendant qu'elle soit prise (D9, dayf.js).
  // ⚠️⚠️ 23/09/2026 — Supabase FERME le canal d'un client qui annonce sa présence
  // plus de cinq fois en 30 s (sahn.js, en tête). Chaque écouteur vérifie donc
  // que son canal est ENCORE le nôtre (`sahn.canal !== canal`) : un canal quitté
  // ou fermé parle encore un instant, et son « CLOSED » ne doit ni relancer une
  // reprise ni éteindre le canal neuf.
  function entrerSahn(nom) {   // v5.7 — `nom` : le canal de la Rahba (« souk ») ; la cour sinon
    if (dayf.actif || !Sh || !compte || !joueur || sahn.canal || typeof compte.canal !== "function") return;
    var maintenant = Date.now();
    sahn.cle = Sh.cleDeSession(joueur.id, maintenant);
    var canal = compte.canal(nom || Sh.CANAL, sahn.cle);
    if (!canal) return;
    sahn.voulu = nom || Sh.CANAL;   // la pièce où l'on veut être : c'est elle qu'on reprend si le canal tombe
    clearTimeout(sahn.minuteurReprise); sahn.minuteurReprise = null;
    sahn.canal = canal; sahn.autres = {}; sahn.envoi = {}; sahn.actif = false;
    try {
      canal.on("presence", { event: "sync" }, function () { if (sahn.canal !== canal) return; synchroniserSahn(); })
        // quelqu'un arrive : on lui dit où l'on est, par un pas (la présence ne porte que l'entrée)
        .on("presence", { event: "join" }, function (m) { if (sahn.canal !== canal || !m || m.key === sahn.cle) return; repondreArrivee(); })
        .on("broadcast", { event: "pas" }, function (m) { if (sahn.canal !== canal) return; recevoirPasSahn(m && m.payload); })
        .on("broadcast", { event: "bulle" }, function (m) { if (sahn.canal !== canal) return; recevoirBulleSahn(m && m.payload); })
        // v8.5 — quelqu'un de la pièce vient de m'écrire en privé : relire ma boîte (le contenu vient de la base)
        .on("broadcast", { event: "toc" }, function (m) { if (sahn.canal !== canal) return; recevoirToc(m && m.payload); })
        .subscribe(function (statut) {
          if (sahn.canal !== canal) return;   // l'écho d'un canal qu'on a quitté
          if (statut === "SUBSCRIBED") { sahn.actif = true; sahn.essais = 0; sahn.enReprise = false; annoncerSahn(); }
          else if (statut === "CLOSED" || statut === "CHANNEL_ERROR" || statut === "TIMED_OUT") { sahn.actif = false; reprendreSahn(); }
          rafraichirHudSahn();
        });
    } catch (e) { sahn.canal = null; sahn.actif = false; reprendreSahn(); }
    rafraichirHudSahn();
  }
  function quitterSahn() {
    var canal = sahn.canal;
    sahn.canal = null; sahn.actif = false; sahn.autres = {}; sahn.maBulle = null;
    // v8.5 — le Kalam de la pièce s'efface avec elle : ce qui s'y est dit y reste (rien n'est gardé)
    kalam.fil = []; kalam.recus = {}; kalam.nonVus = 0; kalam.mentions = 0;
    rendreKalamScene();
    sahn.voulu = null; sahn.essais = 0; sahn.enReprise = false;   // on part pour de bon : aucune reprise
    clearTimeout(sahn.minuteurReprise); sahn.minuteurReprise = null;
    clearTimeout(sahn.minuteurAnnonce); sahn.minuteurAnnonce = null;
    clearTimeout(sahn.minuteurReponse); sahn.minuteurReponse = null;
    if (canal && compte && typeof compte.quitterCanal === "function") compte.quitterCanal(canal);
    rafraichirHudSahn();
  }
  // Le canal est tombé (fermé par Supabase, réseau coupé, projet trop bavard) :
  // on le reprend soi-même, de plus en plus patiemment, tant qu'on est dans la
  // pièce — supabase-js ne rouvre pas un canal que le serveur a FERMÉ. Revenir
  // à l'onglet reprend tout de suite (voir la veille, dans brancher).
  function reprendreSahn(delai) {   // `delai` : tout de suite (0), sinon la patience du n-ième essai
    var nom = sahn.voulu;
    if (!nom || sahn.minuteurReprise || !Sh) return;
    var attente = typeof delai === "number" ? delai : Sh.reprise(sahn.essais || 0);
    sahn.essais = (sahn.essais || 0) + 1;
    sahn.enReprise = true;
    sahn.minuteurReprise = setTimeout(function () {
      sahn.minuteurReprise = null;
      if (sahn.voulu !== nom) return;   // on a changé de pièce entre-temps : ce n'est plus là qu'on va
      var vieux = sahn.canal;
      sahn.canal = null; sahn.actif = false; sahn.autres = {};
      // On rend l'ancien canal AVANT d'ouvrir le neuf : les deux ne se croisent jamais. ⚠️ Ce n'est
      // pas ce qui chasse les fantômes — vu en essai contre le vrai Realtime, un canal que le SERVEUR
      // a fermé peut laisser sa présence dans l'état des autres navigateurs. C'est sahn.js qui les
      // chasse : une personne n'y est qu'une fois (plusRecentes), et une présence qui n'a jamais
      // donné un pas en dix secondes ne se dessine pas (JAMAIS_ENTENDU_MS).
      var apres = function () {
        if (sahn.voulu !== nom || sahn.canal) return;   // parti ailleurs, ou déjà revenu
        entrerSahn(nom);
        if (!sahn.canal) reprendreSahn();   // le client n'a pas rendu de canal : on réessaie plus tard
      };
      var rendu = vieux && compte && typeof compte.quitterCanal === "function" ? compte.quitterCanal(vieux) : null;
      if (rendu && typeof rendu.then === "function") rendu.then(apres, apres); else apres();
    }, attente);
    rafraichirHudSahn();
  }
  // Ma présence : QUI je suis, et la place où j'entre. Une seule fois par
  // entrée dans un canal — jamais en marchant — et seulement à mon tour : la
  // cinquième annonce en 30 s ferme le canal (Supabase), la mienne attend donc
  // que la fenêtre se libère. Ma place, ensuite, se dit par des pas.
  function annoncerSahn() {
    if (!sahn.canal || !sahn.actif || !joueur) return;
    var maintenant = Date.now(), droit = Sh.presencePermise(sahn.journal, maintenant);
    if (!droit.ok) {
      clearTimeout(sahn.minuteurAnnonce);
      sahn.minuteurAnnonce = setTimeout(function () { sahn.minuteurAnnonce = null; annoncerSahn(); }, droit.attente);
      return;
    }
    sahn.journal = Sh.noterPresence(sahn.journal, maintenant);
    var p = cour.perso;
    try {
      var r = sahn.canal.track({ id: joueur.id, pseudo: joueur.pseudo, avatar: joueur.avatar, x: Math.round(p.x), y: Math.round(p.y), dir: p.dir });
      if (r && typeof r.catch === "function") r.catch(function () { });
    } catch (e) { /* le canal est tombé : sa fermeture le dira, et la reprise suivra */ }
  }
  // Quelqu'un vient d'entrer : il connaît mon nom (la présence) mais pas ma
  // place du moment. Je la lui dis — une fois, même si cinq entrent ensemble.
  function repondreArrivee() {
    if (sahn.minuteurReponse) return;
    sahn.minuteurReponse = setTimeout(function () {
      sahn.minuteurReponse = null;
      if (sahn.actif) envoyerPas(cour.perso, Date.now(), true);
    }, 400);
  }
  function nombreSahn() { var n = 0; for (var k in sahn.autres) n++; return n; }
  function synchroniserSahn() {
    if (!sahn.canal) return;
    var etat = {};
    try { etat = sahn.canal.presenceState() || {}; } catch (e) { etat = {}; }
    var maintenant = Date.now(), vus = {};
    // une personne n'est qu'une fois dans la cour : sa présence la plus récente (sahn.js)
    var garde = Sh.plusRecentes(Object.keys(etat).filter(function (k) { return k !== sahn.cle; }));
    for (var cle in etat) {
      if (cle === sahn.cle || !garde[cle]) continue;
      var liste = etat[cle], brut = liste && liste.length ? liste[liste.length - 1] : null;
      var frais = Sh.normaliserPresence(cle, brut, M, R, maintenant);
      if (!frais) continue;
      vus[cle] = true;
      if (sahn.autres[cle]) Sh.rafraichir(sahn.autres[cle], frais, maintenant); else sahn.autres[cle] = frais;
    }
    for (var k in sahn.autres) if (!vus[k]) delete sahn.autres[k];
    rafraichirHudSahn();
  }
  function recevoirPasSahn(p) {
    if (!p || !sahn.autres[p.cle]) return;
    var pas = Sh.normaliserPas(p, M);
    if (pas) Sh.recevoirPas(sahn.autres[p.cle], pas, Date.now(), Sh.cadencePour(nombreSahn()));
  }
  // v8.5 — un mot de la pièce : sa bulle, et une ligne du Kalam. Pas pour qui on n'entend
  // plus ; pas plus de cinq en six secondes par personne (sahn.js — la clé du jeu est publique).
  function recevoirBulleSahn(p) {
    if (!p || !sahn.autres[p.cle]) return;
    var a = sahn.autres[p.cle], maintenant = Date.now();
    if (Sh.estSourd(kalam.sourds, a.id) || !Sh.recevoirDit(kalam.recus, p.cle, maintenant)) return;
    Sh.poserBulle(a, p.texte, maintenant);
    var l = Sh.ligneDuFil({ cle: p.cle, id: a.id, pseudo: a.pseudo, texte: p.texte, t: maintenant, monPseudo: joueur && joueur.pseudo });
    if (!l) return;
    kalam.fil = Sh.ajouterAuFil(kalam.fil, l);
    var pn = $("#zj-gens"), vu = pn && !pn.hidden && gens.onglet === "kalam" && !gens.personne;
    if (!vu) { kalam.nonVus++; if (l.mention) kalam.mentions++; }
    if (l.mention) sonner("page_dlg");
    majGens();
    rendreKalamScene();
  }
  // Mon pas : au changement de tuile, de direction ou à l'arrêt, et à chaque
  // battement même immobile — à la cadence que la cour se permet (sahn.js
  // décide, selon le nombre de présents). `force` : répondre à qui arrive.
  // ⚠️ Plus jamais la présence ici (23/09/2026) : elle se paie cinq fois par
  // demi-minute au plus, et le sixième arrêt fermait le canal.
  function envoyerPas(p, maintenant, force) {
    if (!sahn.canal || !sahn.actif) return;
    var pas = { tx: Math.floor(p.x / T), ty: Math.floor(p.y / T), dir: p.dir, bouge: p.bouge };
    var n = nombreSahn();
    if (!force && !Sh.doitEnvoyer(sahn.envoi, pas, maintenant, n)) return;
    Sh.marquerEnvoye(sahn.envoi, pas, maintenant);
    try {
      sahn.canal.send({ type: "broadcast", event: "pas", payload: { cle: sahn.cle, x: Math.round(p.x), y: Math.round(p.y), dir: p.dir, bouge: p.bouge } });
    } catch (e) { /* idem */ }
  }
  // Les fantômes, prêts pour rendu.rendre : la même forme que le joueur et
  // les PNJ (x, y, dir, frame, avatar). Jamais passés à Pn.heurte.
  function fantomesDuSahn(maintenant) {
    var liste = Sh.vivants(sahn.autres, maintenant, nombreSahn()), out = [];
    for (var i = 0; i < liste.length; i++) {
      var a = liste[i], pos = Sh.interpoler(a, maintenant);
      out.push({ x: pos.x, y: pos.y, dir: a.dir, avatar: a.avatar, frame: a.bouge ? [0, 1, 0, 2][Math.floor(cour.t * 7) % 4] : 0, fantome: a });
    }
    return out;
  }
  // Par-dessus la scène : le pseudo au-dessus de chaque tête, et les bulles.
  function dessinerSahn(cam, fantomes, maintenant) {
    var ctx = cour.ctx;
    if (!ctx || !cam) return;
    // z est en pixels du canvas (dpr compris) : la taille du texte le suit.
    var z = cam.zoom, hauteur = (Rd.PH + 2) * z, taille = Math.max(10, Math.round(3.2 * z));
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "600 " + taille + "px system-ui, -apple-system, sans-serif";
    for (var i = 0; i < fantomes.length; i++) {
      var f = fantomes[i], a = f.fantome;
      var sx = (Math.round(f.x) - cam.camX + cam.ox) * z, sy = (Math.round(f.y) - cam.camY + cam.oy) * z - hauteur;
      // un assoupi (onglet caché, réseau lent) reste là, estompé : la présence dit qu'il n'est pas parti
      ctx.globalAlpha = a.assoupi ? 0.5 : 1;
      etiquetteSahn(ctx, a.pseudo, sx, sy, taille, "rgba(8, 20, 17, 0.72)", "#f3e7c9");
      ctx.globalAlpha = 1;
      if (Sh.bulleVisible(a.bulle, maintenant)) etiquetteSahn(ctx, a.bulle.texte, sx, sy - taille * 1.7, taille, "#f3e7c9", "#1d1610");
    }
    if (Sh.bulleVisible(sahn.maBulle, maintenant)) {
      var p = cour.perso;
      var mx = (Math.round(p.x) - cam.camX + cam.ox) * z, my = (Math.round(p.y) - cam.camY + cam.oy) * z - hauteur;
      etiquetteSahn(ctx, sahn.maBulle.texte, mx, my, taille, "#f3e7c9", "#1d1610");
    }
    ctx.restore();
  }
  // Une étiquette : un cartouche plein, le texte centré dessus. ⚠️ La taille
  // se passe en paramètre — parseFloat(ctx.font) lirait la graisse « 600 ».
  function etiquetteSahn(ctx, texte, x, y, taille, fond, encre) {
    var w = Math.ceil(ctx.measureText(texte).width) + 10, h = Math.ceil(taille * 1.5) + 2;
    ctx.fillStyle = fond; ctx.fillRect(Math.round(x - w / 2), Math.round(y - h), w, h);
    ctx.fillStyle = encre; ctx.fillText(texte, Math.round(x), Math.round(y - taille * 0.45));
  }
  function rafraichirHudSahn() {
    var el = $("#zj-hud-sahn");
    if (!el) return;
    if (!sahn.canal && !sahn.enReprise) { el.hidden = true; return; }
    el.hidden = false;
    var lieu = rahba.active ? "souk" : "";
    var n = Sh.vivants(sahn.autres, Date.now(), nombreSahn()).length;
    el.textContent = sahn.actif ? Sh.compterTexte(n, lieu) : (sahn.enReprise ? Sh.texteReprise(lieu) : "Cour hors ligne");
    rafraichirBarre();   // v8.4 — la pastille des gens
    var pnG = $("#zj-gens"); if (pnG && !pnG.hidden) majGens();   // v8.5 — les listes seules : ce qu'on écrit reste
    el.title = sahn.actif
      ? "Les autres joueurs connectés en ce moment. Approche-toi de quelqu'un et fais le geste d'action pour le saluer ; T pour dire un mot."
      : (sahn.enReprise ? "Le canal de la cour s'est fermé — le jeu s'y reconnecte tout seul."
        : "Le canal de la cour ne répond pas — tu joues seul le temps qu'il revienne.");
  }
  // Le salut : une preuve à deux. Je salue ; si l'autre me rend le salam dans
  // la minute, la BASE compte la rencontre (zawia-rencontres.sql) — pour nous
  // deux. Ma bulle « Salam » part avec, pour que l'autre sache qu'on l'attend.
  function saluer(autre) {
    if (dayf.actif) return;   // v7.2 — un invité ne salue pas : il n'a pas de compte pour porter la rencontre
    if (!autre || !joueur || !compte || typeof compte.saluer !== "function") return;
    if (autre.id === joueur.id) { ouvrirDialogue({ nom: autre.pseudo, pages: ["C'est toi — dans un autre onglet. On ne se rencontre pas soi-même."] }); return; }
    direUnMot("Salam, " + autre.pseudo + " !", true);
    sonner("page_dlg");
    compte.saluer(autre.id).then(function (r) {
      ouvrirDialogue({ nom: autre.pseudo, pages: [Sh.texteSalut(r, autre.pseudo)] });
      if (r && r.ok) verser("salut");   // v4.7
      if (r && r.ok && typeof r.rencontres === "number") {
        joueur.rencontres = r.rencontres;
        var etat = Sh.defiReseau(r.rencontres);
        if (joueur.defis && joueur.defis.reseau !== etat) { joueur.defis.reseau = etat; sauvegarderJoueur(); }
      }
    });
  }
  // Dire un mot : la barre rapide (T). v8.5 — le mot entre au Kalam de la pièce :
  // 280 caractères, sans lien ; la bulle en montre 80, plus longtemps s'il y a à lire.
  function ouvrirDire() {
    var f = $("#zj-dire");
    if (!f || !sahn.actif) return;
    f.hidden = false;
    document.body.setAttribute("data-dire", "1");
    var inp = $("#zj-dire-texte");
    if (inp) { inp.value = ""; setTimeout(function () { inp.focus(); }, 30); }
    var msg = $("#zj-dire-msg");
    if (msg) msg.textContent = "";
  }
  function fermerDire() {
    var f = $("#zj-dire");
    if (f) f.hidden = true;
    document.body.setAttribute("data-dire", "0");
  }
  function direUnMot(texte, silencieux) {
    var inp = $("#zj-dire-texte"), msg = $("#zj-dire-msg");
    var r = direDansLaPiece(typeof texte === "string" ? texte : (inp ? inp.value : ""));
    if (!r.ok) { if (msg && !silencieux) msg.textContent = r.erreur; return; }
    if (!silencieux) fermerDire();
  }
  // Dire dans la pièce : ma bulle, et une ligne dans le Kalam de chacun — jamais plus d'un
  // mot toutes les 1,5 s. ⚠️ L'événement reste « bulle » : les navigateurs d'avant la v8.5
  // l'entendent encore (ils coupent à 80 caractères). Rend { ok } ou { ok: false, erreur }.
  function direDansLaPiece(brut) {
    if (dayf.actif || !joueur) return { ok: false, erreur: "" };
    var m = Sh.message(brut);
    if (!m.ok) return m;
    var maintenant = Date.now(), droit = Sh.peutDire(kalam.dernier, maintenant);
    if (!droit.ok) return { ok: false, erreur: "Doucement — un mot après l'autre." };
    if (!sahn.canal || !sahn.actif) return { ok: false, erreur: horsLigneGens() };
    kalam.dernier = maintenant;
    sahn.maBulle = { texte: Sh.bulle(m.texte).texte, jusqu: maintenant + Sh.dureeBulle(m.texte) };
    try { sahn.canal.send({ type: "broadcast", event: "bulle", payload: { cle: sahn.cle, texte: m.texte } }); } catch (e) { /* le canal est tombé : sa fermeture le dira */ }
    kalam.fil = Sh.ajouterAuFil(kalam.fil, Sh.ligneDuFil({ cle: sahn.cle, id: joueur.id, pseudo: joueur.pseudo, texte: m.texte, t: maintenant, moi: true }));
    rendreFilKalam();
    rendreKalamScene();
    return { ok: true };
  }

  // ---- v5.7 — LA RAHBA : le Souk est une place (rahba.js) --------------------------------------
  // On passe le Bab : la cour laisse la place à la Rahba, dehors des murs — le
  // même moteur (la fabrique de monde.js, le rendu peint, les gens de pnj.js, le
  // Sahn ouvert sur son propre canal) sur une autre carte. Chaque ferracha du
  // site y est un étal : un tapis teinté de la couleur de son marchand, un
  // auvent rayé, ses produits en paquets. Devant un étal : le tapis, et une
  // affaire à proposer (safqa.js). Au fond, la Qissaria — la vitrine de la
  // maison, dont les vitrines montrent le catalogue tenu en base. Le Bab, en
  // bas, ramène dans la cour. ⚠️ Rien ici ne touche au M39ol, à la Sna3a ni à
  // la Dhakira : une affaire ne donne jamais un point.
  // v7.7 — la langue de la page voyage vers la base : les affirmations de
  // l'Isnad vivent EN BASE, donc langue.js ne les traduit pas (comme le Riwaq).
  function langueDeLaPage() {
    try { return document.documentElement.lang === "ar" ? "ar" : "fr"; } catch (e) { return "fr"; }
  }

  // ================= v7.7 — AL-MECHOUAR, l'arène =================================
  // La place où l'on est vu : la salle qui combat le PREMIER adversaire de la
  // charte, « l'invisibilité du talent marocain ». Trois armes, une par axe ;
  // deux manches sur trois ; AUCUN point. Ce qui compte vit en base
  // (zawia-mechouar.sql) : la vérité de l'Isnad, le chronomètre, les voix et
  // les titres. Ici, on demande et on montre.
  function entrerMechouar() {
    if (!Mc || !joueur || mechouar.active || rahba.active || rihla.active || ecran !== "cour") return;
    if (palierFerme("mechouar")) return;   // v5.5 — pas encore ouvert : la tuile le dit
    cour.aBouge = true; sauvegarderPosition();
    quitterSahn();
    fermerDialogue(); basculerMenu(false); fermerMechouar();
    guide.tuile = null; guide.fil = null; guide.jeu = false;
    tuto.fil = null; tuto.deTuile = "";
    changerMonde(Mc.monde);
    mechouar.active = true; mechouar.etat = null;
    document.body.setAttribute("data-mechouar", "1");
    placer(cour.perso, Mc.APPARITION.x, Mc.APPARITION.y, Mc.APPARITION.dir);
    cour.pnjs = Pn ? Pn.creer(Mc.PNJ) : [];
    degagerDesGens(cour.perso);
    entrerSahn("mechouar");
    rafraichirHud();
    if (orchestre) { orchestre.allerA("qa3a"); majBoutonSon(); sonner("entree"); }
    chargerMechouar();
    // la première fois, le dellal crie depuis la place — une fois (recit.mechouar)
    if (!(joueur.recit && joueur.recit.mechouar && joueur.recit.mechouar.vu)) {
      var a = Mc.accueil(joueur.pseudo);
      setTimeout(function () {
        if (!mechouar.active || cour.dialogue || panneauOuvert()) return;
        ouvrirDialogue({ nom: a.nom, pages: a.pages, apres: function () {
          joueur.recit = Rc.normaliserRecit(joueur.recit);
          joueur.recit.mechouar = { vu: new Date().toISOString() };
          sauvegarderJoueur();
        } });
      }, 450);
    }
  }
  function sortirMechouar() {
    if (!mechouar.active) return;
    mechouar.active = false;
    document.body.removeAttribute("data-mechouar");
    fermerMechouar(); fermerDialogue(); basculerMenu(false);
    tuto.fil = null; tuto.deTuile = "";
    changerMonde(Mz);
    placer(cour.perso, 14, 33, "haut");   // sous Bab al-Mechouar, face à la Qa3a
    cour.pnjs = Pn ? Pn.creer() : [];
    degagerDesGens(cour.perso);
    cour.aBouge = true; sauvegarderPosition();
    quitterSahn();   // ⚠️ 23/09/2026 — le canal de la place d'abord, sinon on reste sur lui (voir sortirRahba)
    entrerSahn();
    rafraichirHud();
    if (orchestre) { orchestre.allerA(Mu.lieuPour(14, 33)); majBoutonSon(); }
  }
  function agirMechouar(dv) {
    if (Pn) {
      var n = Pn.aTuile(cour.pnjs, dv.x, dv.y);
      if (n) {
        var e = mechouar.etat || {};
        var porteurs = (e.mur || []).filter(function (l) { return l.banniere; }).length;
        var d = Mc.parler(n.cle, { pseudo: joueur.pseudo, titre: e.titre,
          moujahid: e.titre && e.titre !== "mtmarren", porteurs: porteurs || 0 });
        Pn.interpeller(n, cour.perso.dir);   // (n, dir) — pas (liste, cle, perso)
        ouvrirDialogue({ nom: d.nom, pages: d.pages });
        return;
      }
    }
    if (dv.c === "G") { sortirMechouar(); return; }
    if (dv.c === "h") { ouvrirMechouar(); return; }
    if (dv.c === "V") {
      var c = Mc.cadreA(dv.x, dv.y), b = c && Mc.banniere(c.cle);
      if (b) {
        var por = ((mechouar.etat && mechouar.etat.mur) || []).filter(function (l) { return l.banniere === b.cle; })[0];
        ouvrirDialogue({ nom: "La bannière de " + b.ville, pages: [por
          ? "Elle est portée. " + por.pseudo + " l'a prise, et il la garde jusqu'à ce qu'on la lui prenne."
          : "Le cadre est vide. Personne ne porte encore la bannière de " + b.ville + " — le premier nom écrit là y restera longtemps."] });
        return;
      }
    }
    var dm = M.dialoguePour(dv.c);
    if (dm) ouvrirDialogue(dm);
  }
  function chargerMechouar() {
    if (!compte || !compte.mechouarEtat) return Promise.resolve();
    return compte.mechouarEtat().then(function (e) {
      if (e && e.ok) mechouar.etat = e;
      if (mechouar.vue === "accueil") rendreMechouar();
      return e;
    }, function () { return null; });
  }
  function ouvrirMechouar() {
    var el = $("#zj-mechouar");
    if (!el) return;
    mechouar.vue = "accueil"; mechouar.joute = null;
    el.hidden = false;
    rendreMechouar();
    chargerMechouar();
  }
  function fermerMechouar() {
    var el = $("#zj-mechouar");
    if (el) el.hidden = true;
    if (mechouar.minuteur) { clearInterval(mechouar.minuteur); mechouar.minuteur = null; }
    mechouar.vue = "accueil";
  }
  // ---- le rendu du panneau -----------------------------------------------------
  function ligneArme(a) {
    // ⚠️ un morceau par <p> : un élément feuille se traduit d'un bloc, et une
    // ligne mixte n'a pas d'entrée — le français resterait en page arabe.
    return '<div class="zj-mech__arme"><p class="zj-kicker">' + esc(a.nom) + ' <span class="ar">' + esc(a.ar) + '</span></p>'
      + '<p class="zj-mech__sous"><strong>' + esc(a.sous) + '</strong></p>'
      + '<p>' + esc(a.dit) + '</p>'
      + '<p class="zj-mech__contre">' + esc(a.repond) + '</p></div>';
  }
  function rendreMechouar() {
    var corps = $("#zj-mechouar-corps");
    if (!corps) return;
    if (mechouar.vue === "isnad") { rendreIsnad(corps); return; }
    if (mechouar.vue === "mizan") { rendreMizan(corps); return; }
    if (mechouar.vue === "peser") { rendrePeser(corps); return; }
    var e = mechouar.etat, T = Mc.TEXTES, h = "";
    if (!e) { corps.innerHTML = '<p class="zj-mech__attente">…</p>'; return; }
    var t = Mc.titre(e.titre || "mtmarren");
    h += '<div class="zj-mech__moi"><p class="zj-kicker">Ton titre</p><h3>' + esc(t.nom)
       + ' <span class="ar">' + esc(t.ar) + '</span></h3>'
       + '<p class="zj-mech__sous">' + esc(t.sous) + '</p><p>' + esc(t.comment) + '</p>';
    if (e.victoires) h += '<p class="zj-mech__vic">' + (e.victoires > 1 ? e.victoires + ' joutes gagnées' : '1 joute gagnée') + '</p>';
    h += '</div>';
    // les trois portes
    var po = Mc.portes({ sna3a: e.portes && e.portes.sna3a ? 1 : 0, pages: e.portes && e.portes.dhakira ? 1 : 0,
                         recit: { mechouar: { admis: e.portes && e.portes.valeurs } } });
    if (!po.pret) {
      h += '<div class="zj-mech__portes"><p class="zj-kicker">' + esc(T.portesTitre) + '</p><p>' + esc(T.portesDit) + '</p><ul>';
      po.portes.forEach(function (x) {
        h += '<li class="' + (x.ouverte ? 'est-ouverte' : 'est-fermee') + '">'
          + '<p class="zj-mech__sous"><strong>' + esc(x.nom) + '</strong></p><p>' + esc(x.comment) + '</p>';
        if (!x.ouverte && x.cle !== "valeurs") h += '<p><button type="button" class="zj-bouton zj-bouton--discret" data-mech="mener" data-tuile="' + esc(x.ou) + '">M\'y mener</button></p>';
        if (!x.ouverte && x.cle === "valeurs") h += '<p><button type="button" class="zj-bouton" data-mech="admission">' + esc(T.admission) + '</button></p>';
        h += '</li>';
      });
      h += '</ul><p class="zj-mech__note">' + esc(T.pasPret) + '</p></div>';
    } else {
      h += '<p class="zj-mech__pret">' + esc(T.pret) + '</p>';
    }
    // la nzaha : les trois armes, sans adversaire et sans trace
    h += '<div class="zj-mech__nzaha"><p class="zj-kicker">' + esc(T.nzaha) + '</p><p>' + esc(T.nzahaDit) + '</p>';
    Mc.ARMES.forEach(function (a) { h += ligneArme(a); });
    h += '<p class="zj-mech__boutons">'
       + '<button type="button" class="zj-bouton" data-mech="nz-qalam">Al-Qalam</button> '
       + '<button type="button" class="zj-bouton" data-mech="nz-isnad">Al-Isnad</button> '
       + '<button type="button" class="zj-bouton" data-mech="nz-mizan">Al-Mizan</button></p>'
       + '<p class="zj-mech__note">' + esc(T.jamais) + '</p></div>';
    // les joutes
    h += '<div class="zj-mech__joutes"><p class="zj-kicker">' + esc(T.mesJoutes) + '</p>';
    if (e.atelier) {
      h += '<p class="zj-mech__note">' + esc(T.atelier) + '</p>';
    } else if (po.pret) {
      h += '<p>' + esc(T.jouteDit) + '</p>'
        + '<p class="zj-mech__defi"><input type="text" id="zj-mech-defi" maxlength="24" placeholder="le pseudo de celui que tu défies" autocomplete="off"> '
        + '<button type="button" class="zj-bouton" data-mech="defier">Entrer en joute</button></p>';
    }
    var js = (e.joutes || []);
    if (!js.length) h += '<p class="zj-mech__note">' + esc(T.aucuneJoute) + '</p>';
    else {
      h += '<ul>';
      js.forEach(function (j) {
        var armes = j.armes || [], reste = Mc.ARMES.filter(function (a) { return armes.indexOf(a.cle) < 0; });
        h += '<li><p class="zj-mech__sous"><strong>' + esc(j.contre || "—") + '</strong></p>';
        if (j.etat === "reglee") h += '<p>' + esc(j.nulle ? "Joute nulle." : (j.gagnee ? "Joute gagnée." : "Joute perdue.")) + '</p>';
        else if (reste.length) h += '<p>' + esc("À toi de jouer : " + reste.map(function (a) { return a.nom; }).join(", ")) + '</p>'
          + '<p><button type="button" class="zj-bouton zj-bouton--discret" data-mech="jouer" data-joute="' + esc(j.id) + '" data-trou="' + esc(j.trou || "") + '">Jouer</button></p>';
        else h += '<p>' + esc("La halqa pèse les raisons.") + '</p>';
        h += '</li>';
      });
      h += '</ul>';
    }
    h += '</div>';
    // peser les raisons des autres
    if ((e.aPeser || []).length) {
      h += '<div class="zj-mech__peser"><p class="zj-kicker">' + esc(T.voter) + '</p><p>' + esc(T.voterDit) + '</p>'
        + '<button type="button" class="zj-bouton" data-mech="peser" data-joute="' + esc(e.aPeser[0].id) + '">Peser deux raisons</button></div>';
    }
    // le mur
    h += '<div class="zj-mech__mur"><p class="zj-kicker">' + esc(T.mur) + '</p>';
    if (!(e.mur || []).length) h += '<p class="zj-mech__note">' + esc(T.murVide) + '</p>';
    else {
      h += '<ul>';
      (e.mur || []).forEach(function (l) {
        var lt = Mc.titre(l.titre), b = l.banniere ? Mc.banniere(l.banniere) : null;
        h += '<li><p class="zj-mech__sous"><strong>' + esc(l.pseudo) + '</strong></p>'
          + '<p>' + esc(lt.nom) + (b ? ' <span class="zj-mech__ville">' + esc(b.ville) + '</span>' : '') + '</p>'
          + (l.kunya ? '<p class="zj-mech__kunya">' + esc(l.kunya) + '</p>' : '') + '</li>';
      });
      h += '</ul>';
    }
    h += '</div>';
    corps.innerHTML = h;
  }
  // ---- l'Isnad : une affirmation à la fois, sept secondes, le serveur juge ------
  function lancerIsnad(joute) {
    if (!compte || !compte.mechouarIsnad) return;
    mechouar.vue = "isnad"; mechouar.joute = joute || null;
    mechouar.faits = []; mechouar.i = 0; mechouar.score = 0;
    rendreMechouar();
    compte.mechouarIsnad(joute || null, langueDeLaPage()).then(function (r) {
      if (!r || !r.ok) { mechouar.vue = "accueil"; rendreMechouar(); return; }
      mechouar.faits = r.faits || []; mechouar.i = 0;
      demarrerFait();
    });
  }
  function demarrerFait() {
    mechouar.reste = Math.round(Mc.ISNAD_MS / 1000);
    if (mechouar.minuteur) clearInterval(mechouar.minuteur);
    mechouar.minuteur = setInterval(function () {
      mechouar.reste -= 1;
      if (mechouar.reste <= 0) { clearInterval(mechouar.minuteur); mechouar.minuteur = null; appelerFait(null); return; }
      var b = $("#zj-mech-reste");
      if (b) b.textContent = String(mechouar.reste);
    }, 1000);
    rendreMechouar();
  }
  function appelerFait(appel) {
    if (mechouar.minuteur) { clearInterval(mechouar.minuteur); mechouar.minuteur = null; }
    var f = mechouar.faits[mechouar.i];
    if (!f) return;
    if (appel === null) { f.verdict = { ok: true, juste: false, tard: true }; rendreMechouar(); return; }
    compte.mechouarAppeler(mechouar.joute, f.fait, appel, langueDeLaPage()).then(function (r) {
      f.verdict = r || { ok: false };
      if (r && r.juste) mechouar.score += 1;
      rendreMechouar();
    });
  }
  function rendreIsnad(corps) {
    var f = mechouar.faits[mechouar.i], T = Mc.TEXTES;
    if (!mechouar.faits.length) { corps.innerHTML = '<p class="zj-mech__attente">…</p>'; return; }
    if (!f) {   // fini
      var h = '<div class="zj-mech__fin"><p class="zj-kicker">Al-Isnad <span class="ar">الإسناد</span></p>'
        + '<h3>' + esc(mechouar.score + " sur " + Mc.ISNAD_FAITS) + '</h3>';
      h += mechouar.joute ? '<p>Ta manche est posée. C\'est la base qui a compté.</p>'
                          : '<p>' + esc(Mc.TEXTES.nzahaTrace) + '</p>';
      h += '<p><button type="button" class="zj-bouton" data-mech="retour">Revenir au cercle</button></p></div>';
      corps.innerHTML = h;
      if (mechouar.joute && compte.mechouarManche) compte.mechouarManche(mechouar.joute, "isnad", {}).then(chargerMechouar);
      return;
    }
    var v = f.verdict, h2 = '<div class="zj-mech__isnad"><p class="zj-kicker">'
      + esc("Al-Isnad · " + (mechouar.i + 1) + " sur " + mechouar.faits.length) + '</p>';
    h2 += '<blockquote class="zj-mech__fait">' + esc(f.texte) + '</blockquote>';
    if (!v) {
      h2 += '<p class="zj-mech__chrono"><span id="zj-mech-reste">' + mechouar.reste + '</span> s</p>'
         + '<p class="zj-mech__boutons"><button type="button" class="zj-bouton" data-mech="solide">Solide</button> '
         + '<button type="button" class="zj-bouton" data-mech="forgee">Forgée</button></p>';
    } else {
      var mot = v.tard ? (v.solide ? "Trop tard. Elle est solide." : "Trop tard. Elle est forgée.")
              : v.juste ? (v.solide ? "Juste. Elle est solide." : "Juste. Elle est forgée.")
              : (v.solide ? "Non. Elle est solide." : "Non. Elle est forgée.");
      h2 += '<p class="zj-mech__verdict ' + (v.juste ? 'est-juste' : 'est-faux') + '">' + esc(mot) + '</p>';
      if (v.correction) h2 += '<p class="zj-mech__correction">' + esc(v.correction) + '</p>';
      if (v.source) h2 += '<p class="zj-mech__source">' + esc(v.source) + '</p>';
      h2 += '<p><button type="button" class="zj-bouton" data-mech="suivant">Suivante</button></p>';
    }
    h2 += '</div>';
    corps.innerHTML = h2;
  }
  // ---- le Mizan : un cas, deux réponses défendables, une raison -----------------
  function lancerMizan(casCle, joute) {
    mechouar.vue = "mizan"; mechouar.cas = casCle; mechouar.joute = joute || null;
    rendreMechouar();
  }
  function rendreMizan(corps) {
    var c = Mc.cas(mechouar.cas), T = Mc.TEXTES;
    if (!c) { mechouar.vue = "accueil"; rendreMechouar(); return; }
    var admission = mechouar.cas === Mc.CAS_ADMISSION && !mechouar.joute;
    var h = '<div class="zj-mech__mizan"><p class="zj-kicker">Al-Mizan <span class="ar">الميزان</span></p>';
    h += '<p class="zj-mech__regle">' + esc(c.regle) + '</p>';
    h += '<blockquote class="zj-mech__cas">' + esc(c.texte) + '</blockquote>';
    h += '<p class="zj-mech__boutons">';
    c.options.forEach(function (o, i) {
      h += '<button type="button" class="zj-bouton" data-mech="choix" data-choix="' + i + '">' + esc(o) + '</button> ';
    });
    h += '</p>';
    h += '<p><label for="zj-mech-raison">' + esc(T.raison) + '</label>'
      + '<textarea id="zj-mech-raison" maxlength="140" rows="2" placeholder="' + esc(T.raisonCourte) + '"></textarea></p>';
    h += '<p id="zj-mech-mizan-msg" class="zj-mech__msg" hidden></p>';
    h += '<p><button type="button" class="zj-bouton" data-mech="' + (admission ? "admettre" : "poser-mizan") + '">Poser ma raison</button></p>';
    if (admission) h += '<p class="zj-mech__note">' + esc(T.admissionDit) + '</p>';
    else h += '<p class="zj-mech__note">' + esc(T.voterDit) + '</p>';
    h += '<p class="zj-mech__amin">' + esc(c.note) + '</p>';
    h += '</div>';
    corps.innerHTML = h;
  }
  // ---- peser deux raisons, à l'aveugle -----------------------------------------
  function rendrePeser(corps) {
    var d = mechouar.peser, T = Mc.TEXTES;
    if (!d) { corps.innerHTML = '<p class="zj-mech__attente">…</p>'; return; }
    if (d.fait) {
      corps.innerHTML = '<div class="zj-mech__peser"><p>' + esc(T.voteFait) + '</p>'
        + '<p><button type="button" class="zj-bouton" data-mech="retour">Revenir au cercle</button></p></div>';
      return;
    }
    var h = '<div class="zj-mech__peser"><p class="zj-kicker">' + esc(T.voter) + '</p><p>' + esc(T.voterDit) + '</p>';
    (d.raisons || []).forEach(function (r) {
      h += '<div class="zj-mech__raison"><blockquote>' + esc(r.raison) + '</blockquote>'
        + '<button type="button" class="zj-bouton" data-mech="voter" data-place="' + r.place + '">Celle-ci</button></div>';
    });
    h += '</div>';
    corps.innerHTML = h;
  }
  // ---- les gestes du panneau ---------------------------------------------------
  function cablerMechouar() {
    var f = $("#zj-mechouar-fermer");
    if (f) f.addEventListener("click", fermerMechouar);
    var corps = $("#zj-mechouar-corps");
    if (!corps) return;
    corps.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("[data-mech]") : null;
      if (!b) return;
      var a = b.getAttribute("data-mech");
      if (a === "retour") { mechouar.vue = "accueil"; mechouar.joute = null; rendreMechouar(); chargerMechouar(); return; }
      if (a === "mener") { fermerMechouar(); sortirMechouar(); guide.tuile = b.getAttribute("data-tuile"); guide.fil = null; guide.deTuile = ""; guide.jeu = true; return; }
      if (a === "admission") { lancerMizan(Mc.CAS_ADMISSION, null); return; }
      if (a === "nz-isnad") { lancerIsnad(null); return; }
      if (a === "nz-mizan") { lancerMizan(Mc.CAS[Math.abs(Mc.hache(String(joueur && joueur.pseudo))) % Mc.CAS.length].cle, null); return; }
      if (a === "nz-qalam") {
        // le Qalam se joue à l'établi du prompt : le juge y est déjà, et le
        // premier trou réussi ouvre la porte de la Sna3a.
        fermerMechouar(); sortirMechouar();
        guide.tuile = "Y"; guide.fil = null; guide.deTuile = ""; guide.jeu = true;
        return;
      }
      if (a === "solide" || a === "forgee") { appelerFait(a === "solide"); return; }
      if (a === "suivant") { mechouar.i += 1; if (mechouar.faits[mechouar.i]) demarrerFait(); else rendreMechouar(); return; }
      if (a === "choix") {
        var tous = corps.querySelectorAll('[data-mech="choix"]');
        for (var i = 0; i < tous.length; i++) tous[i].classList.remove("est-choisi");
        b.classList.add("est-choisi");
        return;
      }
      if (a === "admettre" || a === "poser-mizan") {
        var ch = corps.querySelector('[data-mech="choix"].est-choisi');
        var ta = $("#zj-mech-raison"), msg = $("#zj-mech-mizan-msg");
        var v = Mc.validerRaison(ta ? ta.value : "");
        if (!ch) { if (msg) { msg.hidden = false; msg.textContent = "Choisis une des deux réponses."; } return; }
        if (!v.ok) { if (msg) { msg.hidden = false; msg.textContent = v.mot; } return; }
        var choix = Number(ch.getAttribute("data-choix"));
        var p = a === "admettre"
          ? compte.mechouarAdmettre(choix, v.raison)
          : compte.mechouarManche(mechouar.joute, "mizan", { choix: choix, raison: v.raison });
        p.then(function (r) {
          if (!r || !r.ok) { if (msg) { msg.hidden = false; msg.textContent = (r && r.erreur) || "La maison ne répond pas."; } return; }
          mechouar.vue = "accueil"; mechouar.joute = null;
          chargerMechouar();
        });
        return;
      }
      if (a === "defier") {
        var el = $("#zj-mech-defi");
        if (!el || !el.value.trim()) return;
        compte.mechouarDefier(el.value.trim()).then(function (r) {
          if (!r || !r.ok) { ouvrirDialogue({ nom: "Le cercle", pages: [(r && r.erreur) || "La maison ne répond pas."] }); return; }
          chargerMechouar();
        });
        return;
      }
      if (a === "jouer") {
        var jid = b.getAttribute("data-joute"), trou = b.getAttribute("data-trou");
        mechouar.joute = jid;
        ouvrirDialogue({ nom: "Ta joute", pages: [
          "Trois manches, dans l'ordre que tu veux. Le Qalam se joue à l'établi du prompt (le trou « " + (trou || "—") + " ») ; l'Isnad et le Mizan, ici.",
          "Quand vous aurez tous les deux joué, la halqa pèsera vos deux raisons — sans voir vos noms."] });
        return;
      }
      if (a === "peser") {
        compte.mechouarPeser(b.getAttribute("data-joute")).then(function (r) {
          if (!r || !r.ok) { ouvrirDialogue({ nom: "Le cercle", pages: [(r && r.erreur) || (r && r.mienne ? Mc.TEXTES.pasTaVoix : "Rien à peser.")] }); return; }
          mechouar.peser = r; mechouar.vue = "peser"; rendreMechouar();
        });
        return;
      }
      if (a === "voter") {
        compte.mechouarVoter(mechouar.peser && mechouar.peser.joute, Number(b.getAttribute("data-place"))).then(function (r) {
          mechouar.peser = { fait: true }; rendreMechouar();
          if (r && r.ok) chargerMechouar();
        });
        return;
      }
    });
  }

  function entrerRahba() {
    if (maisonSalleMuette("rahba")) return;   // Bab — muette chez une maison
    if (!Rb || !joueur || rahba.active || rihla.active || ecran !== "cour") return;
    cour.aBouge = true; sauvegarderPosition();   // la place dans la zawia, gardée
    quitterSahn();
    fermerDialogue(); basculerMenu(false); fermerSouk();
    guide.tuile = null; guide.fil = null; guide.jeu = false;
    tuto.fil = null; tuto.deTuile = "";
    changerMonde(Rb.monde);
    rahba.active = true; rahba.places = []; rahba.mienne = null; rahba.debordement = []; rahba.marchands = 0; rahba.vitrines = Rb.vitrines([]); rahba.catalogue = []; rahba.rayons = [];
    rahba.derb = Rb.placerDerb([]); rahba.projets = 0; rahba.dansDerb = false;   // v8.7
    document.body.setAttribute("data-rahba", "1");
    placer(cour.perso, Rb.APPARITION.x, Rb.APPARITION.y, Rb.APPARITION.dir);
    cour.pnjs = Pn ? Pn.creer(Rb.PNJ) : [];
    degagerDesGens(cour.perso);
    if (cour.scene) cour.scene.decor = { sol: dessinerRahbaSol, dessus: dessinerRahbaDessus };
    entrerSahn("souk");
    rafraichirHud();
    if (orchestre) { orchestre.allerA("souk"); majBoutonSon(); sonner("entree"); }
    // v7.4 — s'il doit venir, il est là quand les tapis et le défi sont lus (voile.js)
    Promise.all([chargerRahba(), chargerQissaria(), chargerSafqat()]).then(preparerRencontreVoile, preparerRencontreVoile);
    // la première fois : le dellal hèle depuis la fontaine — une fois (recit.rahba)
    if (!(joueur.recit && joueur.recit.rahba && joueur.recit.rahba.vu)) {
      var a = Rb.accueil(joueur.pseudo);
      setTimeout(function () {
        if (!rahba.active || cour.dialogue || panneauOuvert()) return;
        ouvrirDialogue({ nom: a.nom, pages: a.pages, apres: function () {
          joueur.recit = Rc.normaliserRecit(joueur.recit);
          joueur.recit.rahba = { vu: new Date().toISOString() };
          sauvegarderJoueur();
        } });
      }, 450);
    }
  }
  function sortirRahba() {
    if (!rahba.active) return;
    rahba.active = false;
    voile.rencontre = null;   // v7.4 — il n'attend que devant ton tapis
    document.body.removeAttribute("data-rahba");
    fermerSouk(); fermerSafqa(); fermerQissaria(); fermerDialogue(); basculerMenu(false);
    tuto.fil = null; tuto.deTuile = "";
    changerMonde(Mz);
    placer(cour.perso, Mz.APPARITION.x, Mz.APPARITION.y, "bas");   // sous le Bab, face à la cour
    cour.pnjs = Pn ? Pn.creer() : [];
    degagerDesGens(cour.perso);
    cour.aBouge = true; sauvegarderPosition();
    // ⚠️ 23/09/2026 — quitter le canal du Souk AVANT d'entrer dans celui de la cour : entrerSahn ne fait rien
    // tant qu'un canal est ouvert, et l'on restait, dans la cour, branché sur le Souk (ni vu ni voyant).
    quitterSahn();
    entrerSahn();
    rafraichirHud();
    if (orchestre) { orchestre.allerA(Mu.lieuPour(Mz.APPARITION.x, Mz.APPARITION.y)); majBoutonSon(); }
  }
  // La place : les ferrachas du site (souk.js les range), posées sur les places (rahba.js).
  function chargerRahba() {
    if (!rahba.active || !compte) return Promise.resolve();
    return compte.lireSouk().then(function (d) {
      if (!rahba.active) return;
      var tapis = Sk.etat((d && d.tapis) || []).tapis;
      var r = Rb.placer(tapis, { pseudo: joueur.pseudo });
      rahba.places = r.places; rahba.mienne = r.mienne; rahba.debordement = r.debordement; rahba.marchands = tapis.length;
      // v8.7 — le Derb t-Tadamoun : un tapis de projet par porteur, dans la ruelle
      rahba.derb = Rb.placerDerb(tapis);
      rahba.projets = tapis.reduce(function (n, t) { return n + ((t.derb && t.derb.length) || 0); }, 0);
      souk.moi = (d && d.moi) || souk.moi;
      if (rahba.viserMienne) { rahba.viserMienne = false; viserMonEtal(); }   // 23/09/2026 — « Mon étal sur la Rahba »
      rafraichirHud();
    });
  }
  // La Qissaria : le catalogue que la base rend au joueur (ressources.js le range).
  function chargerQissaria() {
    if (!compte || !Rs || typeof compte.lireRessources !== "function") return Promise.resolve();
    return compte.lireRessources().then(function (l) {
      var e = Rs.etat(Rs.normaliser(l || []), Date.now());
      rahba.catalogue = e.produits || []; rahba.rayons = e.ressources || [];
      oumm.defi = e.defi || null;   // v7.3 — l'énoncé du défi du Voilé vient de la base
      rahba.vitrines = Rb.vitrines(rahba.catalogue);
      var pn = $("#zj-qissaria");
      if (pn && !pn.hidden) rendreQissaria();
    }).catch(function () { /* la vitrine reste fermée */ });
  }
  function agirRahba(dv) {
    // v7.4 — le Voilé, devant ton tapis : lui faire face et agir, c'est lui parler
    if (voile.rencontre && dv.x === voile.rencontre.tx && dv.y === voile.rencontre.ty) { ouvrirRencontreVoile(); return; }
    // les gens de la place
    if (Pn) {
      var n = Pn.aTuile(cour.pnjs, dv.x, dv.y);
      if (n) {
        Pn.interpeller(n, cour.perso.dir);
        var mienne = rahba.mienne;
        var d = Rb.parler(n.cle, { pseudo: joueur.pseudo, marchands: rahba.marchands, mienne: !!(mienne && !mienne.libre), placeLibre: !!(mienne && mienne.libre), aTraiter: safqa.aTraiter,
          projets: rahba.projets, monProjet: !!(rahba.derb && rahba.derb.mienne) });   // v8.7 — Lalla Ito dit la ruelle
        if (!d) return;
        var suite = d.affaires ? ouvrirSafqa : (d.souk ? function () { ouvrirSouk({ source: "tout" }); } : (d.derb ? function () { ouvrirSouk({ source: "derb" }); } : null));
        ouvrirDialogue({ nom: d.nom, pages: d.pages, apres: suite });
        return;
      }
    }
    // le Bab : on rentre
    if (dv.c === "G") { sortirRahba(); return; }
    // la Qissaria : sa porte ouvre tout ; une vitrine ouvre son produit, ou dit ses volets
    if (dv.c === "1" && Rb.estPorte(dv.x, dv.y)) { ouvrirQissaria(); return; }
    if (dv.c === "2") {
      var v = Rb.vitrineA(rahba.vitrines, dv.x, dv.y);
      if (v && v.produit) { ouvrirQissaria(v.i); return; }
      ouvrirDialogue(Rb.direVitrineFermee(compte.mode === "local"));
      return;
    }
    // un étal : le tapis de quelqu'un, le mien, ou une place libre
    if (dv.c === "e") {
      var pl = Rb.placeA(rahba.places, dv.x, dv.y);
      // v8.7 — un tapis de projet du Derb t-Tadamoun : on n'y marchande pas, on y aide
      var pd = pl ? null : Rb.placeA(rahba.derb.places, dv.x, dv.y);
      if (pd) {
        if (pd.libre) { ouvrirDialogue(Rb.direPlaceDerb()); return; }
        if (pd.mien) { ouvrirSouk({ source: "mien" }); return; }
        ouvrirSouk({ source: "derb", cible: { joueur: pd.tapis.joueur, slug: pd.tapis.slug, nom: pd.tapis.nom } });
        return;
      }
      if (!pl) { var d0 = M.dialogue("e", {}); if (d0) ouvrirDialogue(d0); return; }
      if (pl.mien) {
        if (pl.libre) { var dm = Rb.direPlace(pl, joueur.pseudo); ouvrirDialogue({ nom: dm.nom, pages: dm.pages, apres: function () { ouvrirSouk({ source: "mien" }); } }); }
        else ouvrirSouk({ source: "mien" });
        return;
      }
      if (pl.libre) { ouvrirDialogue(Rb.direPlace(pl, joueur.pseudo)); return; }
      ouvrirSouk({ source: "place", cible: { joueur: pl.tapis.joueur, slug: pl.tapis.slug, nom: pl.tapis.nom } });
      return;
    }
    if (!M.estPointInteret(dv.c)) {
      // v2.6 — pas de point d'intérêt, mais peut-être un autre joueur à portée : on le salue
      if (sahn.actif) { var autre = Sh.devant(cour.perso, Sh.vivants(sahn.autres, Date.now()), T, Date.now()); if (autre) saluer(autre); }
      return;
    }
    var dd = M.dialogue(dv.c, {});
    if (dd) ouvrirDialogue(dd);
  }

  // ---- Le décor de la place, dessiné PAR LA SCÈNE (rendu.js : crochets sol / dessus) --------------
  // Sous les gens : les tapis teintés (le sprite peint du tapis, recoloré par
  // rendu.spriteTeinte) et les paquets. Sur les gens : les auvents rayés, les
  // noms, la corde des teinturiers, les guirlandes, la grande toile de la
  // Qissaria, ses vitrines et sa porte. La géométrie vient de rahba.js.
  var TAPIS_COINS = [["tapis.rouge.hg", 0, 0], ["tapis.rouge.hd", 1, 0], ["tapis.rouge.bg", 0, 1], ["tapis.rouge.bd", 1, 1]];
  var MAISON = ["#e6b13f", "#1f4d45", "#c45c3a", "#f3e7c9"];   // les couleurs de la maison, pour sa toile
  function dessinerRahbaSol(ctx, cam, t) {
    if (!rahba.active || !cam) return;
    var z = cam.zoom, k = z / Rd.ECHELLE_SPRITE, W = ctx.canvas.width, H = ctx.canvas.height, tz = T * z;
    var ex = function (wx) { return (wx - cam.camX + cam.ox) * z; }, ey = function (wy) { return (wy - cam.camY + cam.oy) * z; };
    for (var i = 0; i < rahba.places.length; i++) {
      var p = rahba.places[i];
      var x0 = ex(p.x * T), y0 = ey(p.y * T), l = Rb.ETAL * tz;
      if (x0 > W || y0 > H || x0 + l < 0 || y0 + l < 0) continue;
      if (p.libre && !p.mien) {
        // une place libre : un tapis roulé, posé dans un coin — discret
        ctx.fillStyle = "rgba(70, 48, 34, 0.55)"; ctx.fillRect(x0 + 0.3 * tz, y0 + 1.15 * tz, 1.4 * tz, 0.42 * tz);
        ctx.fillStyle = "rgba(120, 88, 60, 0.6)"; ctx.fillRect(x0 + 0.3 * tz, y0 + 1.15 * tz, 1.4 * tz, 0.12 * tz);
        continue;
      }
      var hex = p.couleur.hex;
      if (p.libre) ctx.globalAlpha = 0.6;   // ma place, encore vide : le tapis attend
      for (var c = 0; c < TAPIS_COINS.length; c++) {
        var cv = Rd.spriteTeinte(TAPIS_COINS[c][0], hex);
        var dx = ex((p.x + TAPIS_COINS[c][1]) * T), dy = ey((p.y + TAPIS_COINS[c][2]) * T);
        if (cv) ctx.drawImage(cv, dx, dy, cv.width * k, cv.height * k);
        else { ctx.fillStyle = hex; ctx.fillRect(dx, dy, tz, tz); }
      }
      ctx.globalAlpha = 1;
      // les paquets : un par produit, de la teinte de son affiche (souk.js) — huit au plus
      if (p.tapis) {
        var pq = Rb.paquets(p.tapis.produits.length);
        for (var q = 0; q < pq.length; q++) {
          var a = Sk.affiche(p.tapis.produits[q].nom);
          var px = ex((p.x + pq[q].x) * T), py = ey((p.y + pq[q].y) * T), s = pq[q].taille * tz;
          ctx.fillStyle = "rgba(20, 10, 0, 0.28)"; ctx.fillRect(px + 0.12 * s, py + 0.18 * s, s, s * 0.8);
          ctx.fillStyle = a.fond; ctx.fillRect(px, py, s, s * 0.8);
          ctx.fillStyle = a.encre; ctx.fillRect(px + 0.15 * s, py + 0.14 * s, 0.7 * s, 0.16 * s);
        }
      }
    }
    dessinerDerbSol(ctx, t, ex, ey, tz, k, W, H);   // v8.7
  }
  // ---- v8.7 — LE DERB T-TADAMOUN, dessiné comme la place : sous les gens, les tapis de
  // projet (une pousse en pot par projet — on y fait grandir, on n'y vend pas), la margelle
  // du puits, l'ombre de l'arganier ; sur les gens, les auvents VERTS, les fanions de la
  // Twiza, sa bannière, la ramure de l'arganier (et sa chèvre), le bois du puits.
  // Rien n'est une image : la planche n'a ni puits ni arganier, et c'est très bien ainsi.
  var TWIZA_VERT = "#2f8f5f", TWIZA_CREME = "#f3e7c9", TWIZA_TERRE = "#c45c3a";
  function rond(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill(); }
  function ovale(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); ctx.fill(); }
  function dessinerDerbSol(ctx, t, ex, ey, tz, k, W, H) {
    if (!rahba.derb) return;
    var x0D = ex(Rb.DERB.x0 * T), x1D = ex((Rb.DERB.x1 + 1) * T);
    if (x1D < 0 || x0D > W) return;
    var dp = rahba.derb.places, i, c;
    for (i = 0; i < dp.length; i++) {
      var q = dp[i], qx = ex(q.x * T), qy = ey(q.y * T), l = Rb.ETAL * tz;
      if (qx > W || qy > H || qx + l < 0 || qy + l < 0) continue;
      if (q.libre) {
        // une place du Derb : une natte roulée contre l'auvent, qui attend un projet
        ctx.fillStyle = "rgba(47, 143, 95, 0.28)"; ctx.fillRect(qx + 0.25 * tz, qy + 1.12 * tz, 1.5 * tz, 0.46 * tz);
        ctx.fillStyle = "rgba(243, 231, 201, 0.55)"; ctx.fillRect(qx + 0.25 * tz, qy + 1.12 * tz, 1.5 * tz, 0.12 * tz);
        continue;
      }
      for (c = 0; c < TAPIS_COINS.length; c++) {
        var cv = Rd.spriteTeinte(TAPIS_COINS[c][0], q.couleur.hex);
        var dx = ex((q.x + TAPIS_COINS[c][1]) * T), dy = ey((q.y + TAPIS_COINS[c][2]) * T);
        if (cv) ctx.drawImage(cv, dx, dy, cv.width * k, cv.height * k);
        else { ctx.fillStyle = q.couleur.hex; ctx.fillRect(dx, dy, tz, tz); }
      }
      var pq = Rb.paquets(q.projets);
      for (c = 0; c < pq.length; c++) {
        var px = ex((q.x + pq[c].x) * T), py = ey((q.y + pq[c].y) * T), s0 = pq[c].taille * tz;
        ctx.fillStyle = "rgba(20, 10, 0, 0.25)"; ovale(ctx, px + 0.55 * s0, py + 0.86 * s0, 0.5 * s0, 0.16 * s0);
        ctx.fillStyle = TWIZA_TERRE;   // le pot
        ctx.beginPath(); ctx.moveTo(px + 0.12 * s0, py + 0.42 * s0); ctx.lineTo(px + 0.88 * s0, py + 0.42 * s0); ctx.lineTo(px + 0.74 * s0, py + 0.86 * s0); ctx.lineTo(px + 0.26 * s0, py + 0.86 * s0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3c7d3a"; ovale(ctx, px + 0.34 * s0, py + 0.24 * s0, 0.22 * s0, 0.12 * s0); ovale(ctx, px + 0.66 * s0, py + 0.2 * s0, 0.22 * s0, 0.12 * s0);   // deux feuilles
        ctx.fillStyle = "#79b35a"; ovale(ctx, px + 0.5 * s0, py + 0.08 * s0, 0.1 * s0, 0.16 * s0);
      }
    }
    // l'ombre de l'arganier
    var A = Rb.ARGANIER;
    ctx.fillStyle = "rgba(20, 30, 10, 0.2)"; ovale(ctx, ex((A.x + 0.5) * T), ey((A.y + 0.55) * T), 1.55 * tz, 0.62 * tz);
    // la margelle du puits : la pierre, puis l'eau sombre, et une ride qui s'en va
    var P = Rb.PUITS, cx = ex((P.x + 1) * T), cy = ey((P.y + 1) * T), r = 0.86 * tz;
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ovale(ctx, cx + 0.08 * tz, cy + 0.14 * tz, r, r * 0.92);
    ctx.fillStyle = "#b9a58a"; rond(ctx, cx, cy, r);
    ctx.strokeStyle = "#8a7760"; ctx.lineWidth = Math.max(1, 0.06 * tz);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    for (i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
    }
    ctx.fillStyle = "#16343d"; rond(ctx, cx, cy, r * 0.62);
    var ride = mouvementReduit ? 0.5 : (t * 0.35) % 1;
    ctx.strokeStyle = "rgba(170, 225, 235, " + (0.45 * (1 - ride)).toFixed(3) + ")"; ctx.lineWidth = Math.max(1, 0.04 * tz);
    ctx.beginPath(); ctx.arc(cx, cy, r * (0.12 + 0.44 * ride), 0, Math.PI * 2); ctx.stroke();
  }
  function dessinerDerbDessus(ctx, t, ex, ey, tz, W, H, taille, balance, souffle, z) {
    if (!rahba.derb) return;
    var x0D = ex(Rb.DERB.x0 * T), x1D = ex((Rb.DERB.x1 + 1) * T);
    var i, b, c;
    // 0. le passage, vu de la place : l'enseigne verte qui invite à entrer
    var en = Rb.DERB.entree, ya = ey(en[0][1] * T), yb = ey((en[en.length - 1][1] + 1) * T), xm = ex((Rb.MUR_EST + 0.5) * T);
    if (xm > -tz * 4 && xm < W + tz * 4) {
      ctx.fillStyle = TWIZA_VERT; ctx.fillRect(xm - 0.5 * tz, ya - 0.2 * tz, tz, 0.2 * tz); ctx.fillRect(xm - 0.5 * tz, yb, tz, 0.2 * tz);
      etiquetteSahn(ctx, etiquetteTraduite("Derb t-Tadamoun") + " →", xm - 1.6 * tz, ya - 0.3 * tz, taille, "rgba(47, 143, 95, 0.92)", TWIZA_CREME);
    }
    if (x1D < 0 || x0D > W) return;
    // 1. les auvents verts des tapis de projet — même vides : la ruelle se reconnaît de loin
    var dp = rahba.derb.places;
    for (i = 0; i < dp.length; i++) {
      var q = dp[i], xa0 = ex(q.x * T), xa1 = ex((q.x + Rb.ETAL) * T), yT = ey(q.y * T);
      if (xa1 < 0 || xa0 > W || yT < -tz * 2 || yT > H + tz * 2) continue;
      var xa = xa0 - 0.15 * tz, xb = xa1 + 0.15 * tz, yA = yT - 1.08 * tz, yB = yT - 0.4 * tz, nr = 7, wr = (xb - xa) / nr;
      ctx.globalAlpha = q.libre ? 0.55 : 1;
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(xa0 + 0.06 * tz, yA + 0.2 * tz, 0.09 * tz, 1.15 * tz);
      ctx.fillRect(xa1 - 0.15 * tz, yA + 0.2 * tz, 0.09 * tz, 1.15 * tz);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(xa + 0.12 * tz, yA); ctx.lineTo(xb - 0.12 * tz, yA); ctx.lineTo(xb, yB); ctx.lineTo(xa, yB); ctx.closePath(); ctx.clip();
      for (b = 0; b < nr; b++) { ctx.fillStyle = b % 2 ? TWIZA_CREME : TWIZA_VERT; ctx.fillRect(xa + b * wr, yA, wr + 1, yB - yA); }
      var gr = ctx.createLinearGradient(0, yA, 0, yB);
      gr.addColorStop(0, "rgba(255, 255, 255, 0.22)"); gr.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.fillStyle = gr; ctx.fillRect(xa, yA, xb - xa, yB - yA);
      ctx.restore();
      for (b = 0; b < nr; b++) { ctx.fillStyle = b % 2 ? TWIZA_CREME : TWIZA_VERT; ctx.beginPath(); ctx.arc(xa + (b + 0.5) * wr, yB, wr / 2, 0, Math.PI); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (!q.libre) etiquetteSahn(ctx, q.nom, (xa0 + xa1) / 2, yA - 0.12 * tz, taille, q.mien ? "rgba(230, 177, 63, 0.92)" : "rgba(20, 60, 40, 0.8)", q.mien ? "#1d1610" : TWIZA_CREME);
    }
    // 2. les fanions de la Twiza, d'un mur à l'autre
    var fs = Rb.fanions();
    for (i = 0; i < fs.length; i++) {
      var fl = fs[i], fx0 = ex(fl.x0 * T), fx1 = ex(fl.x1 * T), fy = ey(fl.y * T), creux = 0.45 * tz;
      if (fy < -tz || fy > H + tz) continue;
      ctx.strokeStyle = "#5a4634"; ctx.lineWidth = Math.max(1, 0.04 * tz);
      ctx.beginPath(); ctx.moveTo(fx0, fy); ctx.quadraticCurveTo((fx0 + fx1) / 2, fy + creux * 2, fx1, fy); ctx.stroke();
      for (b = 0; b < fl.fanions.length; b++) {
        var u = fl.fanions[b].u, gx = fx0 + (fx1 - fx0) * u, gy = fy + 2 * creux * u * (1 - u) + balance * 0.02 * tz;
        ctx.fillStyle = fl.fanions[b].couleur;
        ctx.beginPath(); ctx.moveTo(gx - 0.16 * tz, gy); ctx.lineTo(gx + 0.16 * tz, gy); ctx.lineTo(gx, gy + 0.34 * tz); ctx.closePath(); ctx.fill();
      }
    }
    // 3. la ramure de l'arganier, ses fruits, et la chèvre qui y a grimpé
    var A = Rb.ARGANIER, ax = ex((A.x + 0.5) * T), ay = ey((A.y + 0.9) * T);
    if (ax > -tz * 3 && ax < W + tz * 3 && ay > -tz * 3 && ay < H + tz * 3) {
      ctx.strokeStyle = "#5b3a24"; ctx.lineCap = "round";
      ctx.lineWidth = 0.24 * tz; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax - 0.3 * tz, ay - 0.55 * tz, ax + 0.04 * tz, ay - 1.05 * tz); ctx.stroke();
      ctx.lineWidth = 0.1 * tz;
      ctx.beginPath(); ctx.moveTo(ax - 0.05 * tz, ay - 0.8 * tz); ctx.quadraticCurveTo(ax - 0.6 * tz, ay - 0.95 * tz, ax - 0.85 * tz, ay - 1.3 * tz); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + 0.02 * tz, ay - 0.95 * tz); ctx.quadraticCurveTo(ax + 0.55 * tz, ay - 1.05 * tz, ax + 0.9 * tz, ay - 1.35 * tz); ctx.stroke();
      ctx.lineCap = "butt";
      var BLOCS = [[-0.95, -1.5, 0.6], [-0.3, -1.9, 0.68], [0.45, -1.78, 0.64], [0.98, -1.38, 0.52], [0.08, -1.32, 0.58], [-0.58, -1.12, 0.46], [0.62, -1.06, 0.44]];
      for (c = 0; c < BLOCS.length; c++) { ctx.fillStyle = "#2c5530"; rond(ctx, ax + BLOCS[c][0] * tz, ay + BLOCS[c][1] * tz, BLOCS[c][2] * tz); }
      for (c = 0; c < BLOCS.length; c++) { ctx.fillStyle = "#467a3c"; rond(ctx, ax + (BLOCS[c][0] - 0.12) * tz, ay + (BLOCS[c][1] - 0.14) * tz, BLOCS[c][2] * 0.6 * tz); }
      for (c = 0; c < 11; c++) {   // les fruits de l'argan : jaunes, jamais au hasard
        var fa = c * 2.39996, fr = 0.35 + (c % 4) * 0.18;
        ctx.fillStyle = c % 3 ? "#d4c04e" : "#b99a3a";
        rond(ctx, ax + Math.cos(fa) * fr * 1.25 * tz, ay - 1.45 * tz + Math.sin(fa) * fr * 0.8 * tz, 0.07 * tz);
      }
      // la chèvre, debout sur une branche
      var gx0 = ax + 0.62 * tz, gy0 = ay - 2.12 * tz;
      ctx.strokeStyle = "#3a2a1c"; ctx.lineWidth = Math.max(1, 0.05 * tz);
      [-0.14, -0.06, 0.07, 0.15].forEach(function (d) { ctx.beginPath(); ctx.moveTo(gx0 + d * tz, gy0 + 0.06 * tz); ctx.lineTo(gx0 + d * tz, gy0 + 0.24 * tz); ctx.stroke(); });
      ctx.fillStyle = "#efe6d6"; ovale(ctx, gx0, gy0, 0.24 * tz, 0.13 * tz);
      ctx.fillStyle = "#8a6242"; ovale(ctx, gx0 + 0.08 * tz, gy0 - 0.02 * tz, 0.09 * tz, 0.07 * tz);
      ctx.fillStyle = "#efe6d6"; ovale(ctx, gx0 - 0.27 * tz, gy0 - 0.1 * tz, 0.1 * tz, 0.08 * tz);
      ctx.beginPath(); ctx.moveTo(gx0 - 0.3 * tz, gy0 - 0.16 * tz); ctx.quadraticCurveTo(gx0 - 0.25 * tz, gy0 - 0.3 * tz, gx0 - 0.16 * tz, gy0 - 0.28 * tz); ctx.stroke();
      ctx.fillStyle = "#1d1610"; rond(ctx, gx0 - 0.3 * tz, gy0 - 0.11 * tz, 0.018 * tz);
    }
    // 4. le bois du puits : deux montants, la traverse, la poulie, la corde et le seau
    var P = Rb.PUITS, cx = ex((P.x + 1) * T), cy = ey((P.y + 1) * T), r = 0.86 * tz, haut = cy - 1.25 * tz;
    if (cx > -tz * 3 && cx < W + tz * 3 && cy > -tz * 3 && cy < H + tz * 3) {
      ctx.fillStyle = "#6b4a2e";
      ctx.fillRect(cx - r * 0.98 - 0.06 * tz, haut, 0.12 * tz, cy + 0.2 * tz - haut);
      ctx.fillRect(cx + r * 0.98 - 0.06 * tz, haut, 0.12 * tz, cy + 0.2 * tz - haut);
      ctx.fillRect(cx - r * 1.1, haut - 0.05 * tz, r * 2.2, 0.12 * tz);
      ctx.fillStyle = "#3a2a1c"; rond(ctx, cx, haut + 0.01 * tz, 0.12 * tz);
      var seau = cy - 0.42 * tz + balance * 0.03 * tz;
      ctx.strokeStyle = "#c9b48a"; ctx.lineWidth = Math.max(1, 0.03 * tz);
      ctx.beginPath(); ctx.moveTo(cx, haut + 0.1 * tz); ctx.lineTo(cx, seau); ctx.stroke();
      ctx.fillStyle = "#7a5230";
      ctx.beginPath(); ctx.moveTo(cx - 0.15 * tz, seau); ctx.lineTo(cx + 0.15 * tz, seau); ctx.lineTo(cx + 0.11 * tz, seau + 0.22 * tz); ctx.lineTo(cx - 0.11 * tz, seau + 0.22 * tz); ctx.closePath(); ctx.fill();
    }
    // 5. la bannière de la Twiza, tendue au-dessus du passage
    var BN = Rb.BANNIERE, by = ey(BN.y * T), bx0 = ex(BN.x0 * T), bx1 = ex(BN.x1 * T);
    if (by > -tz * 2 && by < H + tz * 2) {
      ctx.strokeStyle = "#4a3826"; ctx.lineWidth = Math.max(1, 0.05 * tz);
      ctx.beginPath(); ctx.moveTo(bx0, by); ctx.lineTo(bx1, by); ctx.stroke();
      var cl0 = ex((BN.cx - BN.largeur / 2) * T), cl1 = ex((BN.cx + BN.largeur / 2) * T), ch = BN.hauteur * tz, ondule = balance * 0.03 * tz;
      ctx.fillStyle = "rgba(20, 10, 0, 0.2)"; ctx.fillRect(cl0 + 0.08 * tz, by + 0.1 * tz, cl1 - cl0, ch);
      ctx.fillStyle = TWIZA_TERRE; ctx.fillRect(cl0, by, cl1 - cl0, ch + ondule);
      ctx.strokeStyle = TWIZA_CREME; ctx.lineWidth = Math.max(1, 0.06 * tz);
      ctx.strokeRect(cl0 + 0.1 * tz, by + 0.1 * tz, cl1 - cl0 - 0.2 * tz, ch - 0.2 * tz + ondule);
      for (b = 0; b < 12; b++) {   // la frange
        var fx = cl0 + (b + 0.5) * (cl1 - cl0) / 12;
        ctx.fillStyle = b % 2 ? TWIZA_CREME : TWIZA_VERT;
        ctx.beginPath(); ctx.moveTo(fx - 0.14 * tz, by + ch + ondule); ctx.lineTo(fx + 0.14 * tz, by + ch + ondule); ctx.lineTo(fx, by + ch + ondule + 0.22 * tz); ctx.closePath(); ctx.fill();
      }
      ctx.save();
      ctx.fillStyle = TWIZA_CREME; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "700 " + Math.round(0.62 * tz) + "px Amiri, 'Noto Naskh Arabic', serif";
      ctx.fillText("التويزة", (cl0 + cl1) / 2, by + ch * 0.42);
      ctx.font = "600 " + Math.max(9, Math.round(0.24 * tz)) + "px system-ui, -apple-system, sans-serif";
      ctx.fillText(etiquetteTraduite("La Twiza · Derb t-Tadamoun"), (cl0 + cl1) / 2, by + ch * 0.8);
      ctx.restore();
    }
  }
  // v5.7b — une étiquette peinte sur le canevas échappe à l'observateur de langue.js : on la traduit à la main.
  function etiquetteTraduite(t) { return Lg && Lg.estAr() ? Lg.t(t) : t; }
  function losangeOr(ctx, x, y, z, souffle) {
    var s = 2.6 * z;
    ctx.fillStyle = "rgba(29, 26, 46, 0.6)";
    ctx.beginPath(); ctx.moveTo(x, y - s - z); ctx.lineTo(x + s + z, y); ctx.lineTo(x, y + s + z); ctx.lineTo(x - s - z, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(230, 177, 63, " + souffle.toFixed(3) + ")";
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
  }
  function dessinerRahbaDessus(ctx, cam, t) {
    if (!rahba.active || !cam) return;
    var z = cam.zoom, W = ctx.canvas.width, H = ctx.canvas.height, tz = T * z;
    var ex = function (wx) { return (wx - cam.camX + cam.ox) * z; }, ey = function (wy) { return (wy - cam.camY + cam.oy) * z; };
    var balance = mouvementReduit ? 0 : Math.sin(t * 1.6), souffle = mouvementReduit ? 0.8 : 0.6 + 0.3 * Math.sin(t * 2.4);
    var taille = Math.max(10, Math.round(3 * z)), i, b;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "600 " + taille + "px system-ui, -apple-system, sans-serif";
    // 1. la corde des teinturiers, sous le mur nord, de part et d'autre de la Qissaria
    var co = Rb.corde(), yc = ey(co.y * T);
    if (yc > -tz * 2 && yc < H + tz) {
      ctx.strokeStyle = "#4a3826"; ctx.lineWidth = Math.max(1, 0.06 * tz);
      for (i = 0; i < co.segments.length; i++) { ctx.beginPath(); ctx.moveTo(ex(co.segments[i].x0 * T), yc); ctx.lineTo(ex(co.segments[i].x1 * T), yc); ctx.stroke(); }
      for (i = 0; i < co.echeveaux.length; i++) {
        var ec = co.echeveaux[i], sx = ex(ec.x * T) + balance * Math.sin(ec.phase) * 0.05 * tz, w = 0.4 * tz, h = ec.hauteur * tz;
        if (sx < -tz || sx > W + tz) continue;
        ctx.fillStyle = "rgba(20, 10, 0, 0.18)"; ctx.fillRect(sx - w / 2 + 0.08 * tz, yc + 0.1 * tz, w, h);
        ctx.fillStyle = ec.couleur; ctx.fillRect(sx - w / 2, yc, w, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.28)"; ctx.fillRect(sx - w / 2 + 0.06 * tz, yc + 0.08 * tz, 0.1 * tz, h - 0.2 * tz);
        ctx.fillStyle = "#4a3826"; ctx.fillRect(sx - w / 2 - 0.02 * tz, yc + 0.12 * tz, w + 0.04 * tz, 0.07 * tz);
        for (b = 0; b < 3; b++) { ctx.fillStyle = ec.couleur; ctx.fillRect(sx - w / 2 + 0.05 * tz + b * 0.13 * tz, yc + h, 0.07 * tz, 0.22 * tz); }
      }
    }
    // 2. les guirlandes, entre les lanternes de la fontaine
    var gs = Rb.guirlandes();
    for (i = 0; i < gs.length; i++) {
      var gl = gs[i], ax = ex((gl.x0 + 0.5) * T), bx = ex((gl.x1 + 0.5) * T), ay = ey((gl.y + 0.1) * T);
      if (ay < -tz || ay > H + tz) continue;
      var n = 14, creux = 0.55 * tz;
      ctx.strokeStyle = "#5a4634"; ctx.lineWidth = Math.max(1, 0.05 * tz);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, ay + creux * 2, bx, ay); ctx.stroke();
      for (b = 0; b < n; b++) {
        var u = (b + 0.5) / n, gx = ax + (bx - ax) * u, gy = ay + 2 * creux * u * (1 - u) + balance * 0.02 * tz;
        ctx.fillStyle = Rb.PALETTE[(b * 5 + i) % Rb.PALETTE.length].hex;
        ctx.beginPath(); ctx.moveTo(gx - 0.14 * tz, gy); ctx.lineTo(gx + 0.14 * tz, gy); ctx.lineTo(gx, gy + 0.32 * tz); ctx.closePath(); ctx.fill();
      }
    }
    // 3. la Qissaria : la grande toile aux couleurs de la maison, ses vitrines, sa porte
    var Q = Rb.QISSARIA, qx0 = ex(Q.x0 * T), qx1 = ex((Q.x1 + 1) * T), qy0 = ey(Q.y0 * T), qy1 = ey((Q.y1 + 1) * T);
    if (qx1 > 0 && qx0 < W && qy1 > 0 && qy0 < H) {
      var toitY0 = qy0 - 0.35 * tz, toitY1 = ey(Q.y1 * T) - 0.06 * tz, tx0 = qx0 - 0.3 * tz, nb = 12, wb = (qx1 - qx0 + 0.6 * tz) / nb;
      for (b = 0; b < nb; b++) { ctx.fillStyle = MAISON[b % MAISON.length]; ctx.fillRect(tx0 + b * wb, toitY0, wb + 1, toitY1 - toitY0); }
      var g2 = ctx.createLinearGradient(0, toitY0, 0, toitY1);
      g2.addColorStop(0, "rgba(255, 255, 255, 0.2)"); g2.addColorStop(1, "rgba(0, 0, 0, 0.3)");
      ctx.fillStyle = g2; ctx.fillRect(tx0, toitY0, qx1 - qx0 + 0.6 * tz, toitY1 - toitY0);
      for (b = 0; b < nb; b++) { ctx.fillStyle = MAISON[b % MAISON.length]; ctx.beginPath(); ctx.arc(tx0 + (b + 0.5) * wb, toitY1, wb / 2, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = "rgba(29, 26, 46, 0.82)";
      ctx.font = "700 " + Math.round(1.05 * tz) + "px Amiri, 'Noto Naskh Arabic', serif";
      ctx.fillText("القيسارية", (qx0 + qx1) / 2, qy0 + 1.25 * tz);
      ctx.font = "600 " + taille + "px system-ui, -apple-system, sans-serif";
      for (i = 0; i < rahba.vitrines.length; i++) {
        var v = rahba.vitrines[i], vx0 = ex(v.x * T), vy0 = ey(v.y * T), vw = v.w * tz, vh = v.h * tz;
        ctx.fillStyle = "#3a2a1c"; ctx.fillRect(vx0 + 0.08 * tz, vy0 + 0.1 * tz, vw - 0.16 * tz, vh - 0.16 * tz);
        if (v.produit) {
          ctx.fillStyle = v.couleur.hex; ctx.fillRect(vx0 + 0.16 * tz, vy0 + 0.18 * tz, vw - 0.32 * tz, vh - 0.32 * tz);
          var gv = ctx.createLinearGradient(vx0, vy0, vx0 + vw, vy0 + vh);
          gv.addColorStop(0, "rgba(255, 255, 255, 0.38)"); gv.addColorStop(0.5, "rgba(255, 255, 255, 0.04)"); gv.addColorStop(1, "rgba(255, 255, 255, 0.24)");
          ctx.fillStyle = gv; ctx.fillRect(vx0 + 0.16 * tz, vy0 + 0.18 * tz, vw - 0.32 * tz, vh - 0.32 * tz);
          ctx.fillStyle = "#f7eedc"; ctx.textBaseline = "middle";
          ctx.font = "700 " + Math.round(0.52 * tz) + "px system-ui, -apple-system, sans-serif";
          ctx.fillText(v.lettre, vx0 + vw / 2, vy0 + vh / 2);
          ctx.textBaseline = "alphabetic"; ctx.font = "600 " + taille + "px system-ui, -apple-system, sans-serif";
        } else {
          ctx.fillStyle = "#7a5636"; ctx.fillRect(vx0 + 0.16 * tz, vy0 + 0.18 * tz, vw - 0.32 * tz, vh - 0.32 * tz);
          ctx.fillStyle = "#5a3e26"; ctx.fillRect(vx0 + vw / 2 - 0.03 * tz, vy0 + 0.18 * tz, 0.06 * tz, vh - 0.32 * tz);
        }
      }
      var px0 = ex(Q.porte[0][0] * T), px1 = ex((Q.porte[1][0] + 1) * T), py0 = ey(Q.porte[0][1] * T), py1 = ey((Q.porte[0][1] + 1) * T);
      ctx.fillStyle = "#e6b13f"; ctx.fillRect(px0 + 0.12 * tz, py0 + 0.42 * tz, px1 - px0 - 0.24 * tz, py1 - py0 - 0.42 * tz);
      ctx.beginPath(); ctx.arc((px0 + px1) / 2, py0 + 0.42 * tz, (px1 - px0) / 2 - 0.12 * tz, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#12211d"; ctx.fillRect(px0 + 0.28 * tz, py0 + 0.5 * tz, px1 - px0 - 0.56 * tz, py1 - py0 - 0.5 * tz);
      ctx.beginPath(); ctx.arc((px0 + px1) / 2, py0 + 0.5 * tz, (px1 - px0) / 2 - 0.28 * tz, Math.PI, 0); ctx.fill();
      var lg = ctx.createRadialGradient((px0 + px1) / 2, py0 + 0.9 * tz, 0, (px0 + px1) / 2, py0 + 0.9 * tz, 0.7 * tz);
      lg.addColorStop(0, "rgba(255, 196, 92, " + (0.45 * souffle).toFixed(3) + ")"); lg.addColorStop(1, "rgba(255, 196, 92, 0)");
      ctx.fillStyle = lg; ctx.fillRect(px0 - 0.5 * tz, py0, px1 - px0 + tz, 1.6 * tz);
      etiquetteSahn(ctx, etiquetteTraduite("La Qissaria — la vitrine de la maison"), (qx0 + qx1) / 2, toitY0 - 0.14 * tz, taille, "rgba(8, 20, 17, 0.72)", "#f3e7c9");
    }
    // 4. les auvents des étals, le nom du marchand, ma place
    for (i = 0; i < rahba.places.length; i++) {
      var p = rahba.places[i];
      if (p.libre && !p.mien) continue;
      var x0 = ex(p.x * T), x1 = ex((p.x + Rb.ETAL) * T), yT = ey(p.y * T);
      if (x1 < 0 || x0 > W || yT < -tz * 2 || yT > H + tz * 2) continue;
      var hex = p.couleur.hex, xa = x0 - 0.15 * tz, xb = x1 + 0.15 * tz, yA = yT - 1.08 * tz, yB = yT - 0.4 * tz;
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(x0 + 0.06 * tz, yA + 0.2 * tz, 0.09 * tz, 1.15 * tz);
      ctx.fillRect(x1 - 0.15 * tz, yA + 0.2 * tz, 0.09 * tz, 1.15 * tz);
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)"; ctx.fillRect(x0, yT + 0.02 * tz, x1 - x0, 0.4 * tz);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(xa + 0.12 * tz, yA); ctx.lineTo(xb - 0.12 * tz, yA); ctx.lineTo(xb, yB); ctx.lineTo(xa, yB); ctx.closePath(); ctx.clip();
      var nr = 7, wr = (xb - xa) / nr;
      for (b = 0; b < nr; b++) { ctx.fillStyle = b % 2 ? "#f7eedc" : hex; ctx.fillRect(xa + b * wr, yA, wr + 1, yB - yA); }
      var grad = ctx.createLinearGradient(0, yA, 0, yB);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.22)"); grad.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.fillStyle = grad; ctx.fillRect(xa, yA, xb - xa, yB - yA);
      ctx.restore();
      for (b = 0; b < nr; b++) { ctx.fillStyle = b % 2 ? "#f7eedc" : hex; ctx.beginPath(); ctx.arc(xa + (b + 0.5) * wr, yB, wr / 2, 0, Math.PI); ctx.fill(); }
      etiquetteSahn(ctx, etiquetteTraduite(p.libre ? "Ta place" : p.nom), (x0 + x1) / 2, yA - 0.12 * tz, taille, p.mien ? "rgba(230, 177, 63, 0.92)" : "rgba(8, 20, 17, 0.72)", p.mien ? "#1d1610" : "#f3e7c9");
      if (p.mien && p.libre) losangeOr(ctx, (x0 + x1) / 2, yA - 0.95 * tz - (mouvementReduit ? 0 : 1.5 * Math.sin(t * 3)) * z, z, souffle);
    }
    dessinerDerbDessus(ctx, t, ex, ey, tz, W, H, taille, balance, souffle, z);   // v8.7
    ctx.restore();
  }

  // ---- v5.7 — LA QISSARIA : la vitrine de la maison ------------------------------------------------
  // Le même catalogue que la bibliothèque (zawia_ressources, genre « produit »), exposé
  // comme une devanture qu'on longe ; les rayons gratuits en dessous. Aucun nom
  // dans le code : ce que la base rend au joueur est ce qu'il voit — le voile est une porte.
  // `vitrine` : le rang d'une vitrine (une tuile de la Qissaria en montre une par
  // place) OU — v8.1 — l'IDENTIFIANT d'une ligne du catalogue, tel que les maharat
  // le donnent. On le garde : le catalogue peut n'arriver qu'après.
  function ouvrirQissaria(vitrine) {
    var pn = $("#zj-qissaria");
    if (!pn) return;
    basculerMenu(false); fermerDialogue();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    rahba.suivie = (typeof vitrine === "number" || (typeof vitrine === "string" && vitrine)) ? vitrine : null;
    var f = $("#zj-qissaria-fermer");
    if (f) f.focus();
    rendreQissaria(rahba.suivie);
    chargerQissaria();
  }
  function fermerQissaria() {
    var pn = $("#zj-qissaria");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    rahba.suivie = null;
    document.body.setAttribute("data-question", "0");
    libererTutoriel();
  }
  // Le rang de la vitrine suivie dans le catalogue : un nombre est déjà un rang,
  // une chaîne est l'identifiant d'une ligne. -1 si on ne la retrouve pas.
  function rangVitrine(vitrine) {
    var c = rahba.catalogue || [];
    if (typeof vitrine === "number") return vitrine;
    if (typeof vitrine !== "string" || !vitrine) return -1;
    for (var i = 0; i < c.length; i++) if (c[i] && c[i].id === vitrine) return i;
    return -1;
  }
  function rendreQissaria(vitrine) {
    var corps = $("#zj-qissaria-corps");
    if (!corps) return;
    if (vitrine === undefined || vitrine === null) vitrine = rahba.suivie;
    var rang = rangVitrine(vitrine);
    var c = rahba.catalogue || [], r = rahba.rayons || [], html = "";
    if (!c.length && !r.length) {
      html += '<p class="zj-souk__vide">' + esc(compte.mode === "local"
        ? "En mode atelier, les vitrines sont vides : le catalogue vit en base."
        : "Les vitrines de la Qissaria s'ouvrent aux gens de la maison — et à tous, le jour du dévoilement.") + "</p>";
    } else {
      if (c.length) {
        html += '<h3 class="zj-riwaq__titre">Les vitrines</h3><div class="zj-qissaria__vitrines">' + c.map(function (p, i) {
          var col = Rb.couleurDe(p.titre).hex, lettre = Sk.affiche(p.titre).lettre;
          return '<article class="zj-qissaria__carte' + (i === rang ? " zj-qissaria__carte--suivie" : "") + '" data-i="' + i + '" style="--teinte:' + col + '">' +
            '<div class="zj-qissaria__lampe" aria-hidden="true">' + esc(lettre) + "</div>" +
            '<div class="zj-qissaria__texte"><p class="zj-kicker">' + esc("Vitrine " + (i + 1)) + "</p><h4>" + esc(p.titre) + "</h4>" +
            (p.detail ? "<p>" + esc(p.detail) + "</p>" : "") +
            (p.lien ? '<a class="zj-bouton" href="' + esc(p.lien) + '" target="_blank" rel="noopener noreferrer">Découvrir</a>' : "") +
            "</div></article>";
        }).join("") + "</div>";
      }
      if (r.length) {
        html += '<h3 class="zj-riwaq__titre">Sur les rayons, sans rien payer</h3><ul class="zj-riwaq__liste">' + r.map(function (p) {
          return '<li class="zj-riwaq__item"><div class="zj-riwaq__texte"><strong>' + esc(p.titre) + "</strong>" +
            (p.detail ? '<span class="zj-riwaq__detail">' + esc(p.detail) + "</span>" : "") + "</div>" +
            (p.lien ? '<a class="zj-bouton zj-riwaq__lien" href="' + esc(p.lien) + '" target="_blank" rel="noopener noreferrer">Voir</a>' : "") + "</li>";
        }).join("") + "</ul>";
      }
    }
    html += '<p class="zj-souk__note">Rien ne se vend ici : un lien mène chez la maison. Ce que les vitrines montrent, le bureau le pose depuis la console — jamais depuis le code.</p>';
    corps.innerHTML = html;
    if (rang >= 0) {
      var carte = corps.querySelector('[data-i="' + rang + '"]');
      if (carte && carte.scrollIntoView) setTimeout(function () { carte.scrollIntoView({ block: "nearest", inline: "center", behavior: mouvementReduit ? "auto" : "smooth" }); }, 30);
    }
  }

  // ---- v5.7 — MES AFFAIRES : la Safqa (safqa.js), tenue par la base ------------------------------
  function chargerSafqat() {
    if (!Sf || !compte || !joueur || typeof compte.safqat !== "function") return Promise.resolve();
    return compte.safqat().then(function (r) {
      if (!r || !r.ok || !joueur) return;
      safqa.liste = (r.liste || []).map(function (b) { var a = Sf.normaliser(b); return Kl ? Kl.compter(a, b) : a; });
      safqa.aTraiter = Sf.aTraiter(safqa.liste, joueur.id);
      rafraichirHud();
      var pn = $("#zj-safqa");
      if (pn && !pn.hidden) rendreSafqa();
    });
  }
  function ouvrirSafqa() {
    var pn = $("#zj-safqa");
    if (!pn) return;
    basculerMenu(false); fermerDialogue();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    var f = $("#zj-safqa-fermer");
    if (f) f.focus();
    rendreSafqa();
    chargerSafqat();
  }
  function fermerSafqa() {
    var pn = $("#zj-safqa");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
    libererTutoriel();
  }
  function rendreSafqa(message) {
    var corps = $("#zj-safqa-corps");
    if (!corps || !Sf || !joueur) return;
    var moi = joueur.id, html = "";
    if (message) html += '<p class="zj-souk__mot' + (message.erreur ? " zj-souk__mot--non" : "") + '">' + esc(message.texte) + "</p>";
    if (compte.mode === "local") html += '<p class="zj-souk__regle">Mode atelier : les affaires que tu proposes restent dans ce navigateur — Yassine accepte, Nour refuse, Omar ne répond pas.</p>';
    var due = Sf.smsraDue(safqa.liste, moi);
    if (due > 0) html += '<p class="zj-safqa__due">' + esc("Ce que tu dois à la maison : " + Sf.dirhams(due) + " — la smsra des affaires conclues, pas encore notée reçue.") + "</p>";
    if (!safqa.liste.length) {
      html += '<p class="zj-souk__vide">Aucune affaire pour l\'instant. Au Souk, devant un étal, ouvre un produit et propose ton prix.</p>';
    } else {
      html += '<ul class="zj-safqa__liste">' + safqa.liste.map(function (a) {
        var r = Sf.role(a, moi), autre = r === "vendeur" ? a.acheteurPseudo : a.vendeurPseudo;
        var actions = Sf.actions(a, moi).map(function (x) {
          var fort = x.cle === "accepter" || x.cle === "regler" || x.cle === "livrer";
          return '<button type="button" class="zj-bouton' + (fort ? "" : " zj-bouton--discret") + '" data-agir="' + x.cle + '" data-id="' + esc(a.id) + '">' + esc(x.libelle) + "</button>";
        }).join("");
        return '<li class="zj-safqa__affaire' + (Sf.attendMoi(a, moi) ? " zj-safqa__affaire--attend" : "") + '"><div>' +
          '<p class="zj-safqa__qui">' + esc(r === "vendeur" ? "Tu vends à " + autre : "Tu achètes à " + autre) + "</p>" +
          '<p class="zj-safqa__quoi"><strong>' + esc(a.produitNom) + "</strong></p>" +
          '<p class="zj-safqa__prix">' + esc(Sf.dirhams(a.prix)) + "</p>" +
          '<p class="zj-safqa__etat">' + esc(Sf.libelleEtat(a)) + "</p>" +
          (r === "vendeur" ? '<p class="zj-safqa__part">' + esc("Ta part : " + Sf.dirhams(a.net) + " · smsra : " + Sf.dirhams(a.smsra)) + "</p>" : "") +
          (a.mot ? '<p class="zj-safqa__mot">' + esc("« " + a.mot + " »") + "</p>" : "") +
          (a.reponse ? '<p class="zj-safqa__mot">' + esc("Réponse : « " + a.reponse + " »") + "</p>" : "") +
          filHtml(a) +
          "</div>" + (actions ? '<div class="zj-souk__actions">' + actions + "</div>" : "") + "</li>";
      }).join("") + "</ul>";
    }
    corps.innerHTML = html;
    $$("#zj-safqa-corps [data-agir]").forEach(function (b) {
      b.addEventListener("click", function () { agirSurAffaire(b.getAttribute("data-id"), b.getAttribute("data-agir")); });
    });
    cablerFil();
  }

  // ---- v7.1 — LE FIL D'UNE AFFAIRE (kalam.js, zawia-safqa-kalam.sql) --------------------------
  // « Avançons sur le fil de la discussion sur l'affaire » (Youssef, 20/09/2026).
  // Entre « j'ai proposé » et « j'ai livré », il n'y avait rien : pour s'entendre
  // sur ce qu'on livre et quand, les deux sortaient de la zawia — et la maison
  // ne tenait plus la parole de personne. Le fil s'ouvre SOUS l'affaire, dans la
  // même liste : on ne quitte pas des yeux le prix dont on parle.
  // ⚠️ Lire MARQUE LU côté base : on n'appelle kalamLire que sur un geste du
  //    joueur, jamais pour rafraîchir un compteur en fond.
  function filHtml(a) {
    if (!Kl || !a.id || typeof compte.kalamLire !== "function") return "";
    var ouvert = safqa.fil && safqa.fil.id === a.id;
    var n = Kl.badge(a), total = Number(a.messages) || 0;
    var libelle = ouvert ? "Fermer le fil"
      : (n ? "Le fil · " + n + " nouveau" + (n > 1 ? "x" : "")
           : (total ? "Le fil · " + total : "Parler au sujet de cette affaire"));
    var html = '<p class="zj-safqa__filbtn"><button type="button" class="zj-safqa__fil-ouvrir' + (n ? " zj-safqa__fil-ouvrir--neuf" : "") +
      '" data-fil="' + esc(a.id) + '">' + esc(libelle) + "</button></p>";
    if (!ouvert) return html;
    var f = safqa.fil;
    html += '<div class="zj-kalam">';
    if (f.chargement) html += '<p class="zj-souk__regle">Le fil s\'ouvre…</p>';
    else if (!f.liste.length) html += '<p class="zj-souk__vide">Rien de dit encore. C\'est ici qu\'on s\'entend : ce qu\'on livre, et quand.</p>';
    else {
      html += '<ul class="zj-kalam__liste">' + f.liste.map(function (m) {
        return '<li class="zj-kalam__mot' + (m.moi ? " zj-kalam__mot--moi" : "") + '">' +
          // v8.5 — translate="no" : la version arabe ne traduit jamais les mots d'un membre (langue.js)
          '<p class="zj-kalam__qui">' + (m.moi ? esc("Toi") : '<span translate="no" dir="auto">' + esc(m.pseudo) + "</span>") + (m.quand ? ' <span class="zj-kalam__quand">' + esc(quandCourt(m.quand)) + "</span>" : "") + "</p>" +
          '<p class="zj-kalam__texte" translate="no" dir="auto">' + Kl.rendre(m.texte) + "</p></li>";
      }).join("") + "</ul>";
    }
    if (f.message) html += '<p class="zj-souk__mot' + (f.erreur ? " zj-souk__mot--non" : "") + '">' + esc(f.message) + "</p>";
    if (f.ouvert) {
      var reste = Kl.finApres(a, new Date());
      html += '<form class="zj-kalam__form" data-fil-form="' + esc(a.id) + '" autocomplete="off">' +
        '<label class="zj-kalam__champ">Ce que tu veux dire<textarea id="zj-kalam-texte" rows="2" maxlength="' + Kl.TEXTE_MAX + '" placeholder="Ce que tu livres, quand, où — un lien https si tu en as un"></textarea></label>' +
        '<div class="zj-souk__actions"><button type="submit" class="zj-bouton">Dire</button></div></form>';
      if (reste && reste.reste) html += '<p class="zj-souk__regle">' + esc("L'affaire est conclue : le fil reste ouvert encore " + reste.reste + " jour" + (reste.reste > 1 ? "s" : "") + ".") + "</p>";
    } else if (f.raison) {
      html += '<p class="zj-souk__regle">' + esc(f.raison) + "</p>";
    }
    html += '<p class="zj-souk__regle">Ce qui se dit ici reste entre vous deux. Le bureau le lit si l\'un de vous l\'appelle — il n\'y parle jamais.</p>';
    return html + "</div>";
  }
  // « 14:05 » aujourd'hui, « 18 sept. » avant — à l'heure du joueur : c'est SA
  // conversation, pas un horaire de la maison (le Riwaq, lui, dit Casablanca).
  function quandCourt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var auj = new Date(), memeJour = d.toDateString() === auj.toDateString();
    try {
      return memeJour
        ? d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
    } catch (e) { return ""; }
  }
  function cablerFil() {
    $$("#zj-safqa-corps [data-fil]").forEach(function (b) {
      b.addEventListener("click", function () { basculerFil(b.getAttribute("data-fil")); });
    });
    var form = $("#zj-safqa-corps [data-fil-form]");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      direDansLeFil(form.getAttribute("data-fil-form"), $("#zj-kalam-texte") ? $("#zj-kalam-texte").value : "");
    });
  }
  function basculerFil(id) {
    if (safqa.fil && safqa.fil.id === id) { safqa.fil = null; rendreSafqa(); return; }
    safqa.fil = { id: id, liste: [], ouvert: false, raison: null, chargement: true, message: "", erreur: false, envoi: false };
    rendreSafqa();
    compte.kalamLire(id).then(function (r) {
      if (!safqa.fil || safqa.fil.id !== id) return;   // le joueur est passé ailleurs
      if (!r || !r.ok) { safqa.fil.chargement = false; safqa.fil.message = (r && r.erreur) || "Le fil ne s'est pas ouvert."; safqa.fil.erreur = true; rendreSafqa(); return; }
      safqa.fil.chargement = false;
      safqa.fil.liste = Kl.normaliserFil(r.fil, joueur.id);
      safqa.fil.ouvert = !!r.ouvert;
      safqa.fil.raison = r.raison || null;
      // lire, c'est avoir lu : le témoin s'éteint ici aussi
      if (r.affaire) {
        var a = Kl.compter(Sf.normaliser(r.affaire), r.affaire);
        a.nonLus = 0;
        safqa.liste = safqa.liste.map(function (x) { return x.id === a.id ? a : x; });
      }
      rafraichirHud();
      rendreSafqa();
    });
  }
  function direDansLeFil(id, texte) {
    if (!safqa.fil || safqa.fil.id !== id || safqa.fil.envoi || typeof compte.kalamDire !== "function") return;
    var v = Kl.valider(texte);
    if (!v.ok) { safqa.fil.message = v.erreur; safqa.fil.erreur = true; rendreSafqa(); focusFil(); return; }
    safqa.fil.envoi = true;
    compte.kalamDire(id, v.texte).then(function (r) {
      if (!safqa.fil || safqa.fil.id !== id) return;
      safqa.fil.envoi = false;
      if (!r || !r.ok) { safqa.fil.message = (r && r.erreur) || "Ça n'a pas marché."; safqa.fil.erreur = true; rendreSafqa(); focusFil(); return; }
      safqa.fil.message = ""; safqa.fil.erreur = false;
      // la base rend le message ; l'atelier rend le fil entier (le marchand répond)
      safqa.fil.liste = r.fil ? Kl.normaliserFil(r.fil, joueur.id)
        : safqa.fil.liste.concat([Kl.normaliser(r.message, joueur.id)]);
      safqa.liste = safqa.liste.map(function (x) {
        if (x.id !== id) return x;
        x.messages = (Number(x.messages) || 0) + 1; x.nonLus = 0; return x;
      });
      sonner("page");
      rendreSafqa();
      focusFil();
    });
  }
  function focusFil() { var t = $("#zj-kalam-texte"); if (t) { t.focus(); var l = t.value.length; try { t.setSelectionRange(l, l); } catch (e) {} } }
  function agirSurAffaire(id, action) {
    if (safqa.envoi || !compte || typeof compte.agirSafqa !== "function") return;
    var mot = "";
    if (action === "refuser" || action === "annuler") {
      var q = "Un mot pour l'autre (facultatif) :";
      mot = window.prompt(Lg && Lg.estAr() ? Lg.t(q) : q, "");
      if (mot === null) return;
    }
    safqa.envoi = true;
    compte.agirSafqa(id, action, mot).then(function (r) {
      safqa.envoi = false;
      if (!r || !r.ok) { rendreSafqa({ texte: (r && r.erreur) || "Ça n'a pas marché.", erreur: true }); return; }
      var a = Sf.normaliser(r.affaire);
      if (Kl) Kl.compter(a, r.affaire);
      safqa.liste = safqa.liste.map(function (x) { return x.id === a.id ? a : x; });
      safqa.aTraiter = Sf.aTraiter(safqa.liste, joueur.id);
      rafraichirHud();
      sonner("page");
      if (a.etat === "conclue") verser("souk");
      rendreSafqa({ texte: a.etat === "conclue"
        ? "Affaire conclue. La smsra de la zawia — " + Sf.dirhams(a.smsra) + " — est due par le vendeur ; le bureau la notera reçue."
        : Sf.libelleEtat(a) + "." });
    });
  }

  // ---- v5.2 — LA RIHLA : Fès en monde ouvert (fes.js, rihla.js) --------------------------------
  // On passe Bab ar-Rihla (tuile R, au fond de la Khizana) : la cour laisse la
  // place à la médina de Fès. Le même moteur — la fabrique de monde.js, le rendu
  // peint, les gens de pnj.js — sur une autre carte ; la zawia garde sa place.
  // Étape A : marcher, manger, travailler, apprendre les noms. Pas de combat.
  // ⚠️ Rien ici ne touche au M39ol, à la Sna3a ni à la Dhakira (rihla.js le garde).
  var rihla = { active: false, etat: null, dist: 0, tuile: "", minuterieAnnonce: null };
  var etal = { spec: null, msg: "" };
  function jourRihla() { return Rh.jourCasa(); }
  // Le souffle maximum du jour : l'Atay servi aujourd'hui dans la zawia l'allonge.
  function maxRihla() {
    var ae = At ? At.normaliserEtat(joueur.recit.atay) : null, jour = jourRihla();
    return Rh.nfsMax(ae && ae.dj === jour ? ae.mj : 0);
  }
  function poserRihla(e) {
    rihla.etat = Rc.normaliserRihla(e);
    joueur.recit = Rc.normaliserRecit(joueur.recit);
    joueur.recit.rihla = rihla.etat;
    sauvegarderJoueur();
    rafraichirHud();
  }
  // Le monde que la scène dessine : la cour, ou une région. Une scène résout sa
  // carte une fois — on en crée une neuve à chaque changement.
  function changerMonde(m) {
    M = m;
    Rd.utiliserMonde(m);
    var cv = $("#zj-scene");
    try { cour.scene = Rd.creerScene(cv); cour.scene.redimensionner(); } catch (e) { /* creerScene a son propre repli */ }
    cour.ctx = cv.getContext("2d");
    cour.tuileX = null; cour.tuileY = null;
  }
  // Poser le marcheur sur une case : les pieds en bas de la tuile, comme à l'apparition.
  function placer(p, tx, ty, dir) {
    p.x = tx * T + T / 2; p.y = ty * T + T - 1; p.dir = dir || "bas";
    var d = M.degager(p.x, p.y); p.x = d.x; p.y = d.y;
    p.frame = 0; p.animT = 0; p.bouge = false;
    for (var k in cour.touches) cour.touches[k] = false;
  }
  function entrerRihla() {
    if (!Fx || !Rh || !joueur || rihla.active || ecran !== "cour") return;
    if (!Rc.prologueVu(joueur) || tuto.actif) {
      ouvrirDialogue({ nom: "Bab ar-Rihla", pages: ["La porte ne s'ouvre pas encore. Finis d'abord ce que le mou'allim te montre."] });
      return;
    }
    if (palierFerme("rihla")) return;   // v5.5 — la porte du temps s'ouvre à la fin du tutoriel, ou le 2ᵉ jour
    cour.aBouge = true; sauvegarderPosition();   // la place dans la zawia, gardée
    quitterSahn();
    fermerDialogue(); basculerMenu(false);
    guide.tuile = null; guide.fil = null; guide.jeu = false;
    changerMonde(Fx.monde);
    rihla.active = true; rihla.dist = 0; rihla.tuile = "";
    document.body.setAttribute("data-rihla", "1");
    var e = Rh.rafraichir(Rh.etat(joueur.recit), jourRihla(), maxRihla());
    var arr = Rh.arriver(e); e = arr.e;
    var p = cour.perso;
    if (!arr.premiere && e.pos && M.positionValide(e.pos)) { p.x = e.pos.x; p.y = e.pos.y; p.dir = e.pos.dir; var d = M.degager(p.x, p.y); p.x = d.x; p.y = d.y; }
    else placer(p, Fx.APPARITION.x, Fx.APPARITION.y, Fx.APPARITION.dir);
    cour.pnjs = Pn ? Pn.creer(Fx.PNJ) : [];
    degagerDesGens(p);
    poserRihla(e);
    if (orchestre) { orchestre.allerA("vestibule"); majBoutonSon(); sonner("entree"); }
    chargerImageRafiq();
    // v5.3 — la première fois : l'arrivée ; ensuite, qui n'a pas de Rafiq est rappelé à la porte
    var appel = arr.premiere ? Fx.arrivee(joueur.pseudo) : (Rf && !e.rf ? Fx.appelRafiq(joueur.pseudo) : null);
    if (appel) setTimeout(function () { if (rihla.active && !cour.dialogue) ouvrirDialogue({ nom: appel.nom, pages: appel.pages, apres: Rf ? ouvrirChoixRafiq : null }); }, 350);
  }
  function sortirRihla() {
    if (!rihla.active) return;
    cour.aBouge = true; sauvegarderPosition();   // la place dans Fès, gardée pour la prochaine fois
    rihla.active = false;
    document.body.removeAttribute("data-rihla");
    fermerEtal(); fermerDialogue(); basculerMenu(false);
    guide.tuile = null; guide.fil = null; guide.jeu = false;
    changerMonde(Mz);
    var porte = tuilesDe("R")[0] || { x: M.APPARITION.x, y: M.APPARITION.y + 1 };
    placer(cour.perso, porte.x, porte.y - 1, "haut");   // devant Bab ar-Rihla, dans la Khizana
    cour.pnjs = Pn ? Pn.creer() : [];
    degagerDesGens(cour.perso);
    cour.aBouge = true; sauvegarderPosition();
    entrerSahn();
    rafraichirHud();
    if (orchestre) { orchestre.allerA(Mu.lieuPour(porte.x, porte.y - 1)); majBoutonSon(); }
  }
  // Une nouvelle, sous le HUD, qui s'efface d'elle-même.
  function annoncerRihla(texte) {
    var el = $("#zj-rihla-annonce");
    if (!el) return;
    el.textContent = texte; el.hidden = false;
    clearTimeout(rihla.minuterieAnnonce);
    rihla.minuterieAnnonce = setTimeout(function () { el.hidden = true; }, 3500);
  }
  // À chaque nouvelle case : le souffle de la marche, et les étoiles sous les pieds.
  function pasRihla(p) {
    var tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T), cle = tx + "," + ty;
    if (cle === rihla.tuile) return;
    if (rihla.tuile) rihla.dist += 1;
    rihla.tuile = cle;
    var e = rihla.etat, change = false;
    if (rihla.dist >= Rh.PAS_MARCHE) { rihla.dist = 0; e = Rh.marcher(e, maxRihla()); change = true; }
    var i = Rh.etoileA(e, Fx, tx, ty);
    if (i >= 0) {
      var r = Rh.ramasser(e, Fx, i); e = r.e; change = true;
      sonner("page");
      annoncerRihla("Une étoile de zellige ! +" + r.gain + " mouzounat · " + r.trouvees + " sur " + r.total);
    }
    if (change) { rihla.etat = e; joueur.recit.rihla = e; rafraichirHud(); }
  }
  function texteDecouverte(r) {
    if (!r) return [];
    var t = "Tu connais ce quartier, maintenant : " + r.quartier.nom + ". Il reprend ses couleurs. +" + r.prime + " mouzounat.";
    return r.tous ? [t, "Toute la médina a repris ses couleurs. Fès te reconnaît."] : [t];
  }
  // Reconnaître le quartier que garde `cle` (un lieu ou un habitant), s'il en garde un.
  function reconnaitre(cle) {
    var q = Fx.quartierGarde(cle);
    if (!q) return null;
    var r = Rh.decouvrir(rihla.etat, Fx, q.cle);
    if (!r.nouveau) return null;
    poserRihla(r.e);
    sonner("page");
    return r;
  }
  function agirRihla(dv) {
    // v5.3 — une ombre devant soi, ou sous ses pieds : le combat
    var pp = cour.perso, om = Fx.ombreA(dv.x, dv.y, rihla.etat) || Fx.ombreA(Math.floor(pp.x / T), Math.floor((pp.y - 2) / T), rihla.etat);
    if (om) { ouvrirCombat(om); return; }
    // les gens de Fès : ce qu'ils disent, et ce que leurs quêtes changent
    if (Pn) {
      var n = Pn.aTuile(cour.pnjs, dv.x, dv.y);
      if (n) {
        Pn.interpeller(n, cour.perso.dir);
        var d = Fx.parler(n.cle, rihla.etat, { pseudo: joueur.pseudo, pret: pretGrande() });
        if (!d) return;
        poserRihla(Rh.appliquer(rihla.etat, d.effets, maxRihla()));
        var r = reconnaitre(n.cle), def = Fx.pnj(n.cle) || {};
        var suite = null;
        if (def.metier) suite = function () { ouvrirEtalPour({ nom: d.nom, metier: def.metier }); };
        else if (n.cle === "gardien" && !Rh.porteOuverte(rihla.etat, Fx, "borj", jourRihla())) suite = function () { ouvrirEtalPour({ nom: "La porte du Borj Nord", porte: "borj" }); };
        ouvrirDialogue({ nom: d.nom, pages: d.pages.concat(texteDecouverte(r), lecon(n.cle, d.nom)), apres: suite });
        return;
      }
    }
    var l = Fx.lieuA(dv.x, dv.y);
    if (l) { agirLieu(l, dv); return; }
    if (!M.estPointInteret(dv.c)) return;
    var dd = M.dialogue(dv.c, {});
    if (dd) ouvrirDialogue(dd);
  }
  function agirLieu(l, dv) {
    if (l.porte) { passerPorte(l, dv); return; }
    if (l.cle === "cuves" && grandeAttend()) { ouvrirCombat({ grande: true }); return; }   // v5.4 — l'arène
    var e = rihla.etat;
    var pages = typeof l.pages === "function" ? l.pages({ rihla: e, decouvert: !!(e.q && e.q.indexOf("chouara") >= 0) }) : (l.pages || []).slice();
    var r = reconnaitre(l.cle);
    var suite = (l.etal || l.metier) ? function () { ouvrirEtalPour({ nom: l.nom, lieu: l }); } : null;
    var plus = texteDecouverte(r).concat(lecon(l.cle, l.nom));   // v5.3 — un maître enseigne au Rafiq
    if (pages.length || plus.length) ouvrirDialogue({ nom: l.nom, pages: pages.concat(plus), apres: suite });
    else if (suite) suite();
  }
  // Passer une porte : de l'autre côté du mur. Payer, répondre, ou revenir plus tard.
  function traverser(dv) {
    var p = cour.perso, dest = Fx.autreCote(dv.x, dv.y, Math.floor((p.y - 2) / T));
    placer(p, dest.x, dest.y, dest.dir);
    degagerDesGens(p);
    rihla.tuile = ""; cour.aBouge = true;
  }
  function passerPorte(l, dv) {
    var cle = l.porte, P = Fx.PORTES[cle];
    if (!P) return;
    if (P.type === "retour") { sortirRihla(); return; }
    if (P.type === "fermee") { ouvrirDialogue({ nom: l.nom, pages: (P.ijaza && Rh.aIjaza(rihla.etat, Fx.CLE) ? P.ijaza : P.pages).slice() }); return; }
    var r = reconnaitre(l.cle);
    var dedans = P.dedans === "nord" && Math.floor((cour.perso.y - 2) / T) < dv.y;   // on sort toujours
    if (dedans || Rh.porteOuverte(rihla.etat, Fx, cle, jourRihla())) {
      if (r) { ouvrirDialogue({ nom: l.nom, pages: (l.pages || []).concat(texteDecouverte(r)), apres: function () { traverser(dv); } }); return; }
      traverser(dv);
      return;
    }
    ouvrirDialogue({ nom: l.nom, pages: (P.pages || []).slice(), apres: function () { ouvrirEtalPour({ nom: l.nom, porte: cle, dv: dv }); } });
  }

  // -- L'étal : manger, travailler, payer une porte, répondre au gardien ------------------------
  function ouvrirEtalPour(spec) {
    var pn = $("#zj-etal");
    if (!pn || !rihla.active) return;
    etal.spec = spec; etal.msg = "";
    basculerMenu(false);
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    rendreEtal();
    var f = $("#zj-etal-fermer");
    if (f) f.focus();
  }
  function fermerEtal() {
    var pn = $("#zj-etal");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
    etal.spec = null;
  }
  function resultatEtal(r) {
    if (r.ok) poserRihla(r.e);
    etal.msg = r.texte;
    sonner(r.ok ? "page" : "faux");
    rendreEtal();
  }
  function rendreEtal() {
    var s = etal.spec, corps = $("#zj-etal-corps");
    if (!s || !corps) return;
    var e = rihla.etat, max = maxRihla(), jour = jourRihla(), heure = Rh.heureCasa();
    $("#zj-etal-titre").textContent = s.nom;
    // ⚠️ chaque morceau dans son <p> : langue.js traduit un élément « feuille » d'un bloc
    var html = '<div class="zj-etal__bourse"><p>Ton souffle : ' + Rh.nfs(e, max) + '/' + max + '</p><p>Tes mouzounat : ' + Rh.mz(e) + '</p></div>';
    if (s.lieu && s.lieu.etal) {
      html += '<h3 class="zj-majliss__titre">À manger</h3><ul class="zj-majliss__liste">';
      Fx.platsDe(s.lieu.cle).forEach(function (p) {
        var bouton = Rh.disponible(p, heure)
          ? '<button type="button" class="zj-bouton" data-manger="' + p.cle + '">Manger — ' + p.prix + ' mouzounat</button>'
          : '<span class="zj-badge">de ' + p.heures[0] + ' h à ' + p.heures[1] + ' h</span>';
        html += '<li><div class="zj-majliss__ligne"><div><p><strong>' + esc(p.nom) + '</strong></p><p>+' + p.nfs + ' Nfs</p></div>' + bouton + '</div>' +
          '<p class="zj-majliss__quand">' + esc(p.fiche) + '</p></li>';
      });
      if (s.lieu.cle === "olives" && e.qu && e.qu.olives === 1) {
        html += '<li><div class="zj-majliss__ligne"><p>Un sachet d\'olives noires pour Lalla Ghita</p><button type="button" class="zj-bouton" data-sachet="1">Acheter — 2 mouzounat</button></div></li>';
      }
      html += '</ul>';
    }
    var metierCle = s.metier || (s.lieu && s.lieu.metier);
    if (metierCle) {
      var w = Fx.metier(metierCle), fait = Rh.travailleAujourdhui(e, w.cle, jour);
      html += '<h3 class="zj-majliss__titre">Travailler</h3><ul class="zj-majliss__liste"><li><div class="zj-majliss__ligne"><div><p><strong>' + esc(w.nom) + '</strong></p><p>−' + w.nfs + ' Nfs · +' + w.mz + ' mouzounat</p></div>' +
        (fait ? '<span class="zj-badge zj-badge--ok">fait aujourd\'hui</span>' : '<button type="button" class="zj-bouton" data-travail="' + w.cle + '">Travailler</button>') +
        '</div><p class="zj-majliss__quand">Une fois par jour.</p></li></ul>';
    }
    if (s.porte) {
      var P = Fx.PORTES[s.porte];
      html += '<h3 class="zj-majliss__titre">Passer</h3><ul class="zj-majliss__liste">' +
        '<li><div class="zj-majliss__ligne"><div><p><strong>' + esc(P.achat) + '</strong></p><p>' + (P.duree === "jour" ? "Pour aujourd'hui." : "Pour toujours.") + '</p></div>' +
        '<button type="button" class="zj-bouton" data-payer="' + s.porte + '">Payer — ' + P.prix + ' mouzounat</button></div></li>' +
        '<li><p>' + esc(P.autre) + '</p></li>';
      if (P.enigme && Fx.ENIGME) {
        html += '<li><p><strong>' + esc(Fx.ENIGME.question) + '</strong></p>' +
          '<form id="zj-etal-enigme" class="zj-etal__enigme"><input id="zj-etal-reponse" type="text" autocomplete="off" maxlength="60" aria-label="Ta réponse"><button type="submit" class="zj-bouton">Répondre</button></form></li>';
      }
      html += '</ul>';
    }
    if (etal.msg) html += '<p class="zj-etal__msg" role="status">' + esc(etal.msg) + '</p>';
    corps.innerHTML = html;
    $$("#zj-etal-corps [data-manger]").forEach(function (b) {
      b.addEventListener("click", function () { resultatEtal(Rh.manger(rihla.etat, Fx, b.getAttribute("data-manger"), Rh.heureCasa(), maxRihla())); });
    });
    $$("#zj-etal-corps [data-sachet]").forEach(function (b) {
      b.addEventListener("click", function () { resultatEtal(Rh.acheterPourQuete(rihla.etat, 2, "olives", 1, 2)); });
    });
    $$("#zj-etal-corps [data-travail]").forEach(function (b) {
      b.addEventListener("click", function () { resultatEtal(Rh.travailler(rihla.etat, Fx, b.getAttribute("data-travail"), jourRihla(), maxRihla())); });
    });
    var passer = function (r) {
      if (!r.ok) { resultatEtal(r); return; }
      poserRihla(r.e); sonner("page");
      var dv = etal.spec && etal.spec.dv;
      fermerEtal();
      if (dv) traverser(dv); else annoncerRihla(r.texte);
    };
    $$("#zj-etal-corps [data-payer]").forEach(function (b) {
      b.addEventListener("click", function () { passer(Rh.payerPorte(rihla.etat, Fx, b.getAttribute("data-payer"), jourRihla())); });
    });
    var fe = $("#zj-etal-enigme");
    if (fe) fe.addEventListener("submit", function (ev) {
      ev.preventDefault();
      passer(Rh.repondreEnigme(rihla.etat, Fx, s.porte, ($("#zj-etal-reponse") || {}).value));
    });
  }

  // -- Le rendu de Fès : la poussière de Nsyan, les cuves, les étoiles ---------------------------
  function dessinerRihla(cam) {
    if (!cam || !cour.ctx || !rihla.etat) return;
    var ctx = cour.ctx, z = cam.zoom, W = ctx.canvas.width, H = ctx.canvas.height;
    var ex = function (wx) { return (wx - cam.camX + cam.ox) * z; }, ey = function (wy) { return (wy - cam.camY + cam.oy) * z; };
    var connus = rihla.etat.q || [];
    // les cuves de Dar Dbagh retrouvent leurs couleurs avec leur quartier
    if (connus.indexOf("chouara") >= 0) {
      ctx.save(); ctx.globalCompositeOperation = "color"; ctx.globalAlpha = 0.85;
      Fx.CUVES.forEach(function (c) { ctx.fillStyle = c.couleur; ctx.fillRect(ex(c.x * T + 3), ey(c.y * T + 3), (2 * T - 6) * z, (2 * T - 6) * z); });
      ctx.restore();
    }
    // la poussière : ce qu'on n'a pas encore appris reste gris (y compris soi — on y est)
    if (connus.length < Fx.QUARTIERS.length && !Rh.aIjaza(rihla.etat, Fx.CLE)) {   // v5.4 — l'ijaza lève la poussière
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H);
      Fx.QUARTIERS.forEach(function (q) {
        if (connus.indexOf(q.cle) < 0) return;
        q.zones.forEach(function (r) { ctx.rect(ex(r[0] * T), ey(r[1] * T), (r[2] - r[0] + 1) * T * z, (r[3] - r[1] + 1) * T * z); });
      });
      ctx.clip("evenodd");
      ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "hsl(0, 0%, 50%)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "rgba(120, 110, 95, 0.16)"; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // les étoiles de zellige : elles brillent quand on s'en approche
    var p = cour.perso, px = p.x / T, py = (p.y - 2) / T, pris = rihla.etat.e || [];
    Fx.ETOILES.forEach(function (s, i) {
      if (pris.indexOf(i) >= 0) return;
      var d = Math.abs(s[0] + 0.5 - px) + Math.abs(s[1] + 0.5 - py);
      if (d > 5) return;
      var a = (mouvementReduit ? 0.8 : 0.6 + 0.35 * Math.sin(cour.t * 5 + i)) * (1 - d / 6);
      var x = ex(s[0] * T + T / 2), y = ey(s[1] * T + T / 2), r = 3 * z;
      ctx.fillStyle = "rgba(255, 236, 170, " + a.toFixed(3) + ")";
      ctx.fillRect(x - r, y - z * 0.5, 2 * r, z); ctx.fillRect(x - z * 0.5, y - r, z, 2 * r);
    });
  }

  // ---- v5.3 — LE RAFIQ ET LES OMBRES (rafiq.js, combat.js) — étape B de la Rihla ---------------
  // Le Rafiq se choisit une fois, à la porte du temps ; il suit le joueur partout
  // (Fès et zawia) ; son niveau, c'est la Sna3a ; les maîtres lui apprennent des
  // techniques. Face à une ombre de Nsyan : une technique, puis une vraie épreuve.
  // ⚠️ Rien ici n'écrit la Sna3a ni le M39ol : l'ombre dissipée rend des mouzounat.
  var RAFIQ_V = "?v=" + (FILM.version || "").replace(/^\?v=/, "");
  var suiveur = { x: 0, y: 0, cle: "", forme: 0, img: null, pret: false };
  function etatRihla() { return rihla.etat || (joueur ? Rh.etat(joueur.recit) : {}); }
  function chargerImageRafiq() {
    verifierEvolution();   // v5.4 — la troisième forme, et sa branche
    var e = etatRihla();
    if (!Rf || !e || !e.rf) { suiveur.img = null; suiveur.cle = ""; return; }
    var f = Rf.forme(sna3aJoueur(), e), br = Rf.branche(e);
    if (suiveur.cle === e.rf && suiveur.forme === f && suiveur.br === br && suiveur.img) return;
    suiveur.cle = e.rf; suiveur.forme = f; suiveur.br = br; suiveur.pret = false;
    var im = new Image();
    im.onload = function () { suiveur.pret = true; };
    im.src = Rf.image(e.rf, f, br) + RAFIQ_V;
    suiveur.img = im;
    suiveur.x = cour.perso.x - 12; suiveur.y = cour.perso.y;
  }
  // Il suit, un pas derrière et un peu de côté : il ne marche jamais sur tes talons.
  function suivre(p, dt) {
    if (!suiveur.img) return;
    var d = { haut: [0, 1], bas: [0, -1], gauche: [1, 0], droite: [-1, 0] }[p.dir] || [0, -1];
    var cx = p.x + d[0] * 14 + (d[1] !== 0 ? 11 : 0), cy = p.y + d[1] * 9 + (d[0] !== 0 ? 3 : 0);
    var k = Math.min(1, dt * 5);
    suiveur.x += (cx - suiveur.x) * k; suiveur.y += (cy - suiveur.y) * k;
    if (Math.abs(suiveur.x - p.x) > 120 || Math.abs(suiveur.y - p.y) > 120) { suiveur.x = cx; suiveur.y = cy; }
  }
  function dessinerRafiq(cam) {
    if (!suiveur.img || !suiveur.pret || !cam || !cour.ctx) return;
    var ctx = cour.ctx, z = cam.zoom, p = cour.perso;
    var taille = (suiveur.forme === 3 ? 20 : suiveur.forme === 2 ? 17 : 14) * z;
    var sx = (suiveur.x - cam.camX + cam.ox) * z, sy = (suiveur.y - cam.camY + cam.oy) * z;
    var bond = mouvementReduit ? 0 : Math.abs(Math.sin(cour.t * 6)) * (p.bouge ? 1.5 : 0.4) * z;
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath(); ctx.ellipse(sx, sy, taille * 0.32, taille * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(suiveur.img, sx - taille / 2, sy - taille - bond, taille, taille);
    // v7.6 — à six traces, il s'arrête et regarde le minaret. Il ne dit rien :
    // c'est un animal, et c'est pour ça qu'on le croit.
    if (Sr && !rahba.active && !rihla.active && Sr.rafiqRegarde(nSirr()) && !p.bouge) {
      var vers = { x: Vl.PERCHOIR.x * T, y: Vl.PERCHOIR.y * T };
      var dx = (vers.x - suiveur.x) * z, dy = (vers.y - suiveur.y) * z;
      var d = Math.hypot(dx, dy) || 1, souffleR = mouvementReduit ? 0.5 : 0.35 + 0.25 * Math.sin(cour.t * 1.8);
      ctx.strokeStyle = "rgba(230, 177, 63, " + (souffleR * 0.5).toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, 0.5 * z);
      ctx.beginPath();
      ctx.moveTo(sx, sy - taille * 0.6 - bond);
      ctx.lineTo(sx + (dx / d) * taille * 0.9, sy - taille * 0.6 - bond + (dy / d) * taille * 0.9);
      ctx.stroke();
    }
    // derrière le joueur : on redessine le joueur par-dessus, pour la profondeur
    if (suiveur.y < p.y) Rd.dessinerPerso(ctx, joueur.avatar, p.dir, p.frame, (Math.round(p.x) - cam.camX + cam.ox) * z, (Math.round(p.y) - cam.camY + cam.oy) * z, z, true);
  }

  // -- Le choix du Rafiq --------------------------------------------------------------------
  function ouvrirChoixRafiq() {
    var pn = $("#zj-rafiq");
    if (!pn || !Rf || !rihla.active || (rihla.etat && rihla.etat.rf)) return;
    basculerMenu(false);
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    // ⚠️ chaque morceau dans son <p> : langue.js traduit un élément « feuille » d'un bloc
    $("#zj-rafiq-corps").innerHTML = Rf.STARTERS.map(function (s) {
      var v = R.voie(s.voie);
      return '<article class="zj-rafiq__carte"><img src="' + Rf.image(s.cle, 1) + RAFIQ_V + '" alt="" width="160" height="160">' +
        '<div class="zj-rafiq__nom"><p><strong>' + esc(s.nom) + '</strong></p><p class="ar" lang="ar" dir="rtl">' + esc(s.ar) + '</p></div>' +
        '<p class="zj-rafiq__voie">' + esc(v ? v.nom : "") + '</p>' +
        '<p>' + esc(s.dit) + '</p>' +
        '<p class="zj-rafiq__tech">' + s.techniques.map(function (t) { return esc(Rf.technique(t).nom); }).join(" · ") + '</p>' +
        '<button type="button" class="zj-bouton" data-rafiq="' + s.cle + '">Choisir ' + esc(s.nom) + '</button></article>';
    }).join("");
    $$("#zj-rafiq-corps [data-rafiq]").forEach(function (b) { b.addEventListener("click", function () { choisirRafiq(b.getAttribute("data-rafiq")); }); });
  }
  function fermerChoixRafiq() {
    var pn = $("#zj-rafiq");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function choisirRafiq(cle) {
    if (!Rf.starter(cle) || (rihla.etat && rihla.etat.rf)) return;
    poserRihla(Rf.choisir(rihla.etat, cle));
    fermerChoixRafiq();
    chargerImageRafiq();
    sonner("page");
    ouvrirDialogue(Rf.accueil(cle));
  }
  // Un maître enseigne sa technique au Rafiq, une fois : la phrase s'ajoute à ce qu'il dit.
  function lecon(cleMaitre, nomMaitre) {
    if (!Rf || !rihla.etat || !rihla.etat.rf) return [];
    var t = Rf.techniqueDe(cleMaitre);
    if (!t) return [];
    var r = Rf.apprendre(rihla.etat, t.cle);
    if (!r.nouveau) return [];
    poserRihla(r.e);
    return [Rf.lecon(nomMaitre, t.cle)];
  }

  // -- Le combat --------------------------------------------------------------------------
  var combat = { ombre: null, c: null, phase: "", tech: null, ep: null, res: null };
  function ouvrirCombat(o) {
    if (!Rf || !Cb) return;
    var grande = !!(o && o.grande);   // v5.4 — Ghobra la grande, sous les cuves de Dar Dbagh
    var type = grande ? Cb.GRANDE : Cb.OMBRES[o.type];
    if (!rihla.etat.rf) { ouvrirDialogue({ nom: type.nom, pages: ["Sans Rafiq, tu ne peux rien contre elle. Le mou'allim t'en confie un à Bab ar-Rihla."], apres: ouvrirChoixRafiq }); return; }
    // assez de souffle pour tenir au moins un tour raté — sinon, on mange d'abord
    if (Rh.nfs(rihla.etat, maxRihla()) < Cb.COUT_TOUR + Cb.COUT_RATE) { ouvrirDialogue({ nom: type.nom, pages: ["Tu n'as plus assez de souffle pour affronter une ombre. Mange d'abord."] }); return; }
    combat = { ombre: grande ? { cle: Cb.GRANDE.cle, type: "kabira" } : o, c: grande ? Cb.nouveauGrande() : Cb.nouveau(o.cle, o.type), phase: "choix", tech: null, ep: null, res: null, grande: grande };
    var pn = $("#zj-combat");
    if (!pn) return;
    basculerMenu(false);
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    sonner("faux");
    rendreCombat();
  }
  function fermerCombat() {
    var pn = $("#zj-combat");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
    var perdu = combat.phase === "fin" && combat.c && !combat.c.gagne;
    var sacre = combat.phase === "fin" && combat.c && combat.c.gagne && combat.grande;
    combat = { ombre: null, c: null, phase: "", tech: null, ep: null, res: null };
    // v5.4 — Ghobra la grande dissipée : le mou'allim remet l'ijaza de Fès
    if (sacre) { var ij = Fx.ijaza(joueur.pseudo); ouvrirDialogue({ nom: ij.nom, pages: ij.pages, apres: chargerImageRafiq }); return; }
    if (perdu) { poserRihla(Rh.reposer(rihla.etat)); sortirRihla(); annoncerRihla("Tu te reposes à la zawia : le souffle revient un peu."); }   // à bout de souffle : on rentre se reposer
  }
  function rendreCombat() {
    var corps = $("#zj-combat-corps");
    if (!corps || !combat.c) return;
    var o = infoOmbre(combat.c), e = rihla.etat, max = maxRihla(), s = Rf.starter(e.rf);
    var pct = Math.round(100 * combat.c.brouillard / combat.c.max), n = Rh.nfs(e, max), f = Rf.forme(sna3aJoueur(), e);
    $("#zj-combat-titre").textContent = o.nom + " — " + o.sous;
    // v5.6 — le coup se VOIT : l'ombre tremble et perd son brouillard en chiffres, le Rafiq
    // recule d'un pas quand la réponse est fausse, la victoire dissout le nuage en or.
    var rs = (combat.phase === "resultat" || combat.phase === "fin") ? combat.res : null;
    var clsO = rs && rs.juste && rs.degats ? " zj-combat__ombre--touche" + (rs.eff >= 2 ? " zj-combat__ombre--fort" : rs.eff < 1 ? " zj-combat__ombre--faible" : "") : "";
    if (combat.phase === "fin" && combat.c.gagne) clsO += " zj-combat__ombre--dissipe";
    if (rs && rs.visage) clsO += " zj-combat__ombre--visage";
    var clsR = rs && !rs.juste ? " zj-combat__rafiq--rate" : "";
    var coup = rs && rs.juste && rs.degats ? '<span class="zj-combat__degats" aria-hidden="true">−' + rs.degats + '</span>' : "";
    var html = '<div class="zj-combat__scene">' +
      '<div class="zj-combat__ombre' + clsO + '" style="--zj-ombre:' + o.couleur + '"><span class="zj-combat__nuage" aria-hidden="true"></span>' + coup +
        '<p><strong>' + esc(o.nom) + '</strong></p><div class="zj-combat__barre"><i style="width:' + pct + '%"></i></div><p>Brouillard : ' + combat.c.brouillard + '/' + combat.c.max + '</p></div>' +
      '<div class="zj-combat__rafiq' + clsR + '"><img src="' + Rf.image(e.rf, f, Rf.branche(e)) + RAFIQ_V + '" alt="" width="96" height="96">' +
        '<p><strong>' + esc(Rf.nomForme(e.rf, sna3aJoueur(), e)) + '</strong></p><div class="zj-combat__barre zj-combat__barre--nfs"><i style="width:' + Math.round(100 * n / max) + '%"></i></div><p>Ton souffle : ' + n + '/' + max + '</p></div>' +
      '</div>' +
      (combat.c.grande ? (combat.c.gagne ? '' : '<p class="zj-combat__types">' + esc(Cb.GRANDE.visages[combat.c.phase]) + '</p>')
        : '<p class="zj-combat__types">' + esc(o.nom) + ' craint : ' + esc(R.voie(o.faible).nom) + '. Elle résiste à : ' + esc(R.voie(o.resiste).nom) + '.</p>');
    if (combat.phase === "choix") {
      html += '<p class="zj-combat__dit">' + esc(combat.c.tour === 0 ? o.entree : "Choisis une technique.") + '</p><div class="zj-combat__choix">' +
        Rf.techniques(e).map(function (t) {
          return '<button type="button" class="zj-bouton" data-tech="' + t.cle + '">' + esc(t.nom + " · " + R.voie(t.voie).nom) + '</button>';
        }).join("") + '</div>';
    } else if (combat.phase === "epreuve") {
      html += '<p class="zj-kicker">' + esc(combat.tech.nom) + '</p><p class="zj-majliss__quand">' + esc(combat.tech.sens) + '</p><p class="zj-combat__q">' + esc(combat.ep.q) + '</p><div class="zj-combat__reponses">' +
        combat.ep.choix.map(function (c, i) { return '<button type="button" class="zj-bouton zj-bouton--discret" data-rep="' + i + '">' + esc(c) + '</button>'; }).join("") + '</div>';
    } else if (combat.phase === "resultat") {
      var r = combat.res;
      html += '<p class="zj-combat__verdict ' + (r.juste ? "ok" : "ko") + '">' + (r.juste ? "Juste !" : "Pas tout à fait.") + '</p>' +
        (r.juste ? '<p>−' + r.degats + ' de brouillard.</p>' + (Cb.motEfficacite(r.eff) ? '<p>' + esc(Cb.motEfficacite(r.eff)) + '</p>' : '') : '<p>' + esc(r.bonne) + '</p>') +
        (r.visage ? '<p class="zj-combat__verdict ok">Ghobra la grande change de visage.</p>' : '') +
        '<p class="zj-majliss__quand">' + esc(r.pourquoi) + '</p>' +
        '<div class="zj-wird__actions"><button type="button" class="zj-bouton" data-suite="1">Continuer</button></div>';
    } else if (combat.phase === "fin") {
      var gagne = combat.c.gagne;
      html += '<p class="zj-combat__verdict ' + (gagne ? "ok" : "ko") + '">' + esc(gagne ? o.sortie : "À bout de souffle, tu rentres à la zawia.") + '</p>';
      if (gagne && combat.res && combat.res.fin) combat.res.fin.forEach(function (t) { html += '<p>' + esc(t) + '</p>'; });
      html += '<div class="zj-wird__actions"><button type="button" class="zj-bouton" data-clore="1">Fermer</button></div>';
    }
    corps.innerHTML = html;
    $$("#zj-combat-corps [data-tech]").forEach(function (b) { b.addEventListener("click", function () { choisirTechnique(b.getAttribute("data-tech")); }); });
    $$("#zj-combat-corps [data-rep]").forEach(function (b) { b.addEventListener("click", function () { repondreCombat(parseInt(b.getAttribute("data-rep"), 10)); }); });
    $$("#zj-combat-corps [data-suite]").forEach(function (b) { b.addEventListener("click", suiteCombat); });
    $$("#zj-combat-corps [data-clore]").forEach(function (b) { b.addEventListener("click", fermerCombat); });
    var premier = corps.querySelector("button");
    if (premier) premier.focus();
  }
  function choisirTechnique(cle) {
    var t = Rf.technique(cle);
    if (!t || combat.phase !== "choix") return;
    combat.tech = t;
    combat.ep = Cb.epreuve(combat.c, t.voie, (rihla.etat && rihla.etat.ev) || []);   // v5.6 — le neuf d'abord
    combat.phase = "epreuve";
    rendreCombat();
  }
  function repondreCombat(i) {
    if (combat.phase !== "epreuve") return;
    var juste = i === combat.ep.bonne;
    var r = Cb.jouer(combat.c, combat.tech, combat.ep, juste, Rf.puissance(sna3aJoueur(), combat.tech.voie));
    var s = Rh.souffler(rihla.etat, r.cout, maxRihla()), e = s.e;
    if (juste) e = Rf.incliner(e, combat.tech.cle);
    e.ev = Cb.retenir(e.ev, combat.ep);   // v5.6 — vue une fois, elle attend son tour
    combat.c = r.c;
    combat.res = { juste: juste, degats: r.degats, eff: r.eff, pourquoi: combat.ep.pourquoi, bonne: "La bonne réponse : " + combat.ep.choix[combat.ep.bonne], visage: r.visage };
    sonner(juste ? "page" : "faux");
    if (r.c.gagne) verser("ombre");   // v5.6 — une ombre dissipée verse sa goutte : Fès remplit la fontaine de la cour
    if (r.c.gagne && combat.grande) {
      var ij = Rh.accorderIjaza(e, Fx);   // v5.4 — l'ijaza de Fès
      e = ij.e;
      combat.res.fin = ["+" + ij.gain + " mouzounat."];
      poserRihla(e);
      combat.phase = "fin";
    } else if (r.c.gagne) {
      var v = Rh.vaincre(e, Fx, combat.ombre.cle, Cb.MZ_VICTOIRE);
      e = v.e;
      combat.res.fin = ["+" + v.gain + " mouzounat."].concat(v.restantes === 0 ? ["Toutes les ombres de la médina ont reculé. Le mou'allim t'attend sur la terrasse de Dar Dbagh."] : []);
      poserRihla(e);
      combat.phase = "fin";
    } else if (s.epuise) {
      poserRihla(e);
      combat.phase = "fin";
    } else {
      poserRihla(e);
      combat.phase = "resultat";
    }
    rendreCombat();
  }
  function suiteCombat() { if (combat.phase === "resultat") { combat.phase = "choix"; rendreCombat(); } }

  // Les ombres dans la médina : un nuage qui tourne, de la couleur de sa sorte, et deux yeux.
  function dessinerOmbres(cam) {
    if (!Cb || !cam || !cour.ctx) return;
    var ctx = cour.ctx, z = cam.zoom, battues = (rihla.etat && rihla.etat.ob) || [];
    if (grandeAttend()) {   // v5.4 — Ghobra la grande, au-dessus des cuves
      var gx = (52.5 * T - cam.camX + cam.ox) * z, gy = (16 * T - cam.camY + cam.oy) * z, tg = mouvementReduit ? 0 : cour.t;
      for (var q = 0; q < 12; q++) {
        var ag = tg * (0.5 + q * 0.04) + q * 0.7, rg = (12 + (q % 4) * 5) * z;
        var xg = gx + Math.cos(ag) * 14 * z, yg = gy + Math.sin(ag * 1.2) * 8 * z;
        var dg = ctx.createRadialGradient(xg, yg, 0, xg, yg, rg * 1.5);
        dg.addColorStop(0, Cb.GRANDE.couleur + "b0"); dg.addColorStop(1, Cb.GRANDE.couleur + "00");
        ctx.fillStyle = dg; ctx.fillRect(xg - rg * 1.5, yg - rg * 1.5, rg * 3, rg * 3);
      }
      ctx.fillStyle = "rgba(255, 244, 214, 0.95)";
      ctx.fillRect(gx - 7 * z, gy - 8 * z, 3 * z, 3 * z); ctx.fillRect(gx + 4 * z, gy - 8 * z, 3 * z, 3 * z);
    }
    Fx.OMBRES.forEach(function (o, k) {
      if (battues.indexOf(o.cle) >= 0) return;
      var t = Cb.OMBRES[o.type];
      var cx = (o.x * T + T / 2 - cam.camX + cam.ox) * z, cy = (o.y * T + T / 2 - cam.camY + cam.oy) * z;
      var temps = mouvementReduit ? 0 : cour.t;
      for (var i = 0; i < 7; i++) {
        var a = temps * (0.8 + i * 0.07) + i * 0.9 + k, r = (4 + (i % 3) * 2) * z;
        var x = cx + Math.cos(a) * 4 * z, y = cy - 4 * z + Math.sin(a * 1.3) * 3 * z;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
        g.addColorStop(0, t.couleur + "cc"); g.addColorStop(1, t.couleur + "00");
        ctx.fillStyle = g; ctx.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2);
      }
      ctx.fillStyle = "rgba(255, 244, 214, 0.9)";
      ctx.fillRect(cx - 3 * z, cy - 6 * z, 1.5 * z, 1.5 * z); ctx.fillRect(cx + 1.5 * z, cy - 6 * z, 1.5 * z, 1.5 * z);
    });
  }

  // ---- v5.4 — L'ARÈNE, L'IJAZA, LA CARTE ET LE DUEL — étape C de la Rihla --------------------
  // Ghobra la grande sous les cuves de Dar Dbagh ; l'ijaza de Fès ; la troisième
  // forme du Rafiq (sa branche fixée le jour où il évolue) ; la carte du Rafiq à
  // partager ; le duel par lien, que l'ami joue sans compte (/duel).
  function voiesConnues(e) {
    var v = [];
    Rf.techniques(e).forEach(function (t) { if (v.indexOf(t.voie) < 0) v.push(t.voie); });
    return v;
  }
  function pretGrande() {
    var e = rihla.etat;
    if (!Rf || !e || !e.rf) return { ombres: false, voies: false, pret: false };
    return Rh.pretPourLaGrande(e, Fx, voiesConnues(e));
  }
  function grandeAttend() { return !!(rihla.active && pretGrande().pret && !Rh.aIjaza(rihla.etat, Fx.CLE)); }
  function infoOmbre(c) {
    if (c && c.grande) { var G = Cb.GRANDE; return { nom: G.nom, sous: G.sous, couleur: G.couleur, entree: G.entree, sortie: G.sortie, faible: G.phases[c.phase], resiste: null }; }
    return Cb.OMBRES[c.type];
  }
  // Le Rafiq évolue quand il atteint sa troisième forme : la branche se fixe, on l'annonce.
  function verifierEvolution() {
    if (!Rf || !joueur) return;
    var e = etatRihla();
    if (!e || !e.rf) return;
    var ev = Rf.evoluer(e, sna3aJoueur());
    if (!ev.nouveau) return;
    poserRihla(ev.e);
    annoncerRihla(Rf.starter(e.rf).nom + " évolue : " + Rf.nomForme(e.rf, sna3aJoueur(), ev.e) + " !");
  }

  // -- La carte du Rafiq ---------------------------------------------------------------------
  function traduire(s) { return Lg && Lg.estAr() ? Lg.t(s) : s; }
  function etoile8(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 16; i++) {
      var a = Math.PI / 8 * i, rr = i % 2 ? r * 0.55 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.stroke();
  }
  function lignesCarte(e) {
    var ar = Lg && Lg.estAr();
    var noms = Rf.techniques(e).map(function (t) { return ar ? t.ar : t.nom; }).join(" · ");
    return [
      "Axe : " + Rf.axe(e).nom,
      "Techniques : " + noms,
      "Ombres dissipées : " + ((e.ob || []).length) + " sur " + Fx.OMBRES.length,
      Rh.aIjaza(e, Fx.CLE) ? "Ijaza de Fès : reçue" : "Ijaza de Fès : pas encore",
      "Étoiles de zellige : " + ((e.e || []).length) + " sur " + Fx.ETOILES.length
    ].map(traduire);
  }
  function dessinerCarteRafiq(cv) {
    var e = etatRihla();
    if (!cv || !e.rf) return;
    var ar = Lg && Lg.estAr(), W = 1080, H = 1350, c = cv.getContext("2d");
    cv.width = W; cv.height = H;
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#123a2f"); g.addColorStop(1, "#07140f");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(230, 177, 63, 0.10)"; c.lineWidth = 2;
    for (var y = 60, k = 0; y < H; y += 120, k++) for (var x = 60 + (k % 2) * 60; x < W; x += 120) etoile8(c, x, y, 34);
    c.strokeStyle = "#e6b13f"; c.lineWidth = 6; c.strokeRect(30, 30, W - 60, H - 60);
    c.lineWidth = 2; c.strokeRect(44, 44, W - 88, H - 88);
    c.textAlign = "center";
    try { c.direction = ar ? "rtl" : "ltr"; } catch (err) { /* les vieux navigateurs */ }
    var serif = ar ? '"Amiri", serif' : '"Cormorant Garamond", Georgia, serif', caps = ar ? '"Amiri", serif' : '"Cinzel", serif';
    c.fillStyle = "#e6b13f"; c.font = "600 34px " + caps; c.fillText(traduire("Jami3at al Qarawiyine — la Rihla"), W / 2, 112, W - 160);
    var dessinerTexte = function () {
      c.fillStyle = "#f7f1e1"; c.font = "700 74px " + serif; c.fillText(traduire(Rf.nomForme(e.rf, sna3aJoueur(), e)), W / 2, 850, W - 160);
      c.fillStyle = "#e6b13f"; c.font = "500 40px " + serif; c.fillText(traduire("Le Rafiq de " + joueur.pseudo), W / 2, 910, W - 160);
      c.fillStyle = "#e8dfc8"; c.font = "400 34px " + (ar ? '"Amiri", serif' : '"Inter", sans-serif');
      lignesCarte(e).forEach(function (l, i) { c.fillText(l, W / 2, 990 + i * 52, W - 160); });
      c.fillStyle = "#e6b13f"; c.font = "600 30px " + caps; c.fillText("l3b.zawia.tech", W / 2, H - 80);
    };
    var im = new Image();
    im.onload = function () {
      var halo = c.createRadialGradient(W / 2, 470, 40, W / 2, 470, 330);
      halo.addColorStop(0, "rgba(230, 177, 63, 0.28)"); halo.addColorStop(1, "rgba(230, 177, 63, 0)");
      c.fillStyle = halo; c.fillRect(0, 140, W, 660);
      c.drawImage(im, W / 2 - 300, 160, 600, 600);
      dessinerTexte();
    };
    im.onerror = dessinerTexte;
    var f = Rf.forme(sna3aJoueur(), e);
    im.src = Rf.image(e.rf, f, Rf.branche(e)) + RAFIQ_V;
  }
  function ouvrirCarteRafiq() {
    var e = etatRihla(), pn = $("#zj-carte");
    if (!Rf || !e.rf || !pn) return;
    basculerMenu(false); fermerDialogue();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    $("#zj-carte-msg").textContent = "";
    dessinerCarteRafiq($("#zj-carte-canvas"));
  }
  function fermerCarteRafiq() {
    var pn = $("#zj-carte");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function partagerCarte() {
    var cv = $("#zj-carte-canvas"), e = etatRihla();
    if (!cv || !cv.toBlob) return;
    cv.toBlob(function (b) {
      if (!b) return;
      var nom = "rafiq-" + e.rf + ".png";
      var fichier = typeof File === "function" ? new File([b], nom, { type: "image/png" }) : null;
      if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] })) {
        navigator.share({ files: [fichier] }).catch(function () { /* partage annulé */ });
        return;
      }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = nom;
      document.body.appendChild(a); a.click(); a.remove();
      $("#zj-carte-msg").textContent = "La carte est téléchargée : partage-la où tu veux.";
    }, "image/png");
  }

  // -- Le duel par lien : cinq épreuves, puis on envoie le défi ----------------------------------
  var duelJeu = { g: "", liste: [], i: 0, score: 0, rep: null, msg: "" };
  function nouvelleGraine() {
    var g = (Cb.hache(String(joueur.id || joueur.pseudo) + ":" + Date.now()) >>> 0).toString(36);
    return Cb.graineValide(g) ? g : "zawia" + g.slice(0, 6);
  }
  function ouvrirDuel() {
    var e = etatRihla(), pn = $("#zj-duel");
    if (!Rf || !Cb || !e.rf || !pn) return;
    duelJeu = { g: nouvelleGraine(), liste: [], i: 0, score: 0, rep: null, msg: "" };
    duelJeu.liste = Cb.duel(duelJeu.g);
    basculerMenu(false); fermerDialogue(); fermerCarteRafiq();
    pn.hidden = false;
    document.body.setAttribute("data-question", "1");
    rendreDuel();
  }
  function fermerDuel() {
    var pn = $("#zj-duel");
    if (!pn || pn.hidden) return;
    pn.hidden = true;
    document.body.setAttribute("data-question", "0");
  }
  function lienDuel() {
    var e = etatRihla(), f = Rf.forme(sna3aJoueur(), e);
    var base = /zawia\.tech$/i.test(location.hostname) ? location.origin + "/duel" : "";
    return base + "?d=" + duelJeu.g + "&s=" + duelJeu.score + "&n=" + encodeURIComponent(String(joueur.pseudo).slice(0, 24)) +
      "&r=" + e.rf + "&f=" + f + (f === 3 ? "&b=" + Rf.branche(e) : "");
  }
  function rendreDuel() {
    var corps = $("#zj-duel-corps");
    if (!corps) return;
    var e = etatRihla(), nom = Rf.nomForme(e.rf, sna3aJoueur(), e), n = duelJeu.liste.length, html = "";
    if (duelJeu.i >= n) {
      html = '<p class="zj-combat__verdict ok">Ton ' + esc(nom) + ' a répondu juste ' + duelJeu.score + ' fois sur ' + n + '.</p>' +
        '<p>Envoie le défi : ton ami joue les mêmes cinq épreuves, sans compte, et voit s\'il fait mieux.</p>' +
        '<div class="zj-wird__actions"><button type="button" class="zj-bouton" data-envoyer="1">Envoyer le défi</button>' +
        '<button type="button" class="zj-bouton zj-bouton--discret" data-rejouer="1">Rejouer</button></div>' +
        (duelJeu.msg ? '<p class="zj-etal__msg" role="status">' + esc(duelJeu.msg) + '</p>' : '');
    } else {
      var ep = duelJeu.liste[duelJeu.i];
      html = '<p class="zj-kicker">Épreuve ' + (duelJeu.i + 1) + ' sur ' + n + '</p>' +
        '<p class="zj-majliss__quand">' + esc(R.voie(ep.voie).nom) + '</p><p class="zj-combat__q">' + esc(ep.q) + '</p>';
      if (duelJeu.rep === null) {
        html += '<div class="zj-combat__reponses">' + ep.choix.map(function (c, i) { return '<button type="button" class="zj-bouton zj-bouton--discret" data-drep="' + i + '">' + esc(c) + '</button>'; }).join("") + '</div>';
      } else {
        var juste = duelJeu.rep === ep.bonne;
        html += '<p class="zj-combat__verdict ' + (juste ? "ok" : "ko") + '">' + (juste ? "Juste !" : "Pas tout à fait.") + '</p>' +
          (juste ? '' : '<p>' + esc("La bonne réponse : " + ep.choix[ep.bonne]) + '</p>') +
          '<p class="zj-majliss__quand">' + esc(ep.pourquoi) + '</p><div class="zj-wird__actions"><button type="button" class="zj-bouton" data-dsuite="1">Continuer</button></div>';
      }
    }
    corps.innerHTML = html;
    $$("#zj-duel-corps [data-drep]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (duelJeu.rep !== null) return;
        duelJeu.rep = parseInt(b.getAttribute("data-drep"), 10);
        if (duelJeu.rep === duelJeu.liste[duelJeu.i].bonne) { duelJeu.score += 1; sonner("page"); } else sonner("faux");
        rendreDuel();
      });
    });
    $$("#zj-duel-corps [data-dsuite]").forEach(function (b) { b.addEventListener("click", function () { duelJeu.i += 1; duelJeu.rep = null; rendreDuel(); }); });
    $$("#zj-duel-corps [data-rejouer]").forEach(function (b) { b.addEventListener("click", ouvrirDuel); });
    $$("#zj-duel-corps [data-envoyer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var lien = lienDuel(), txt = traduire("Mon " + nom + " a répondu juste " + duelJeu.score + " fois sur 5 contre les ombres de Nsyan. À toi : " + lien);
        if (navigator.share) { navigator.share({ text: txt }).catch(function () { /* annulé */ }); return; }
        var fini = function (ok) { duelJeu.msg = ok ? "Le défi est copié : colle-le à un ami." : txt; rendreDuel(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { fini(true); }, function () { fini(false); });
        else fini(false);
      });
    });
    var premier = corps.querySelector("button");
    if (premier) premier.focus();
  }

  // ---- Sauvegarde et sortie ------------------------------------------------------------------
  function sauvegarderPosition() {
    if (!joueur || ecran !== "cour" || !cour.aBouge) return;
    // v5.7 — la Rahba ne garde pas de place : on y entre toujours par le Bab, et la zawia garde la sienne
    if (rahba.active) { cour.aBouge = false; cour.dernierSauv = performance.now(); return; }
    var p = cour.perso;
    if (rihla.active) {   // v5.2 — dans Fès, on garde la place dans Fès ; la zawia garde la sienne
      rihla.etat = Rc.normaliserRihla(Object.assign({}, rihla.etat, { pos: { x: Math.round(p.x), y: Math.round(p.y), dir: p.dir } }));
      joueur.recit = Rc.normaliserRecit(joueur.recit);
      joueur.recit.rihla = rihla.etat;
    } else joueur.position = { x: Math.round(p.x), y: Math.round(p.y), dir: p.dir };
    cour.aBouge = false; cour.dernierSauv = performance.now();
    // v7.2 — un invité n'écrit jamais en base : son personnage reste chez lui.
    if (dayf.actif) { ecrireJoueurDayf(); return; }
    compte.ecrireJoueur(joueur).catch(function () { /* on réessaiera au prochain pas */ });
  }
  // Le personnage entier (Sna3a, pages, récit compris), sans condition de mouvement.
  function sauvegarderJoueur() {
    if (!joueur) return;
    if (dayf.actif) { ecrireJoueurDayf(); return; }
    compte.ecrireJoueur(joueur).catch(function () { /* on réessaiera au prochain geste */ });
  }
  function sortirDeLaMaison() {
    sauvegarderPosition();
    // Un invité n'a pas de session à fermer : on le ramène à la Porte, et ses
    // trois jours l'attendent s'il revient.
    if (dayf.actif) {
      dayf.actif = false; joueur = null;
      choisirOnglet("entrer");
      afficher("porte");
      return;
    }
    compte.deconnecter().then(function () {
      joueur = null;
      $("#zj-email").value = ""; $("#zj-mdp").value = "";
      choisirOnglet("entrer");
      afficher("porte");
    });
  }

  // ---- Branchement ---------------------------------------------------------------------------
  function brancher() {
    // v3.1 — la langue, avant tout : la page se traduit en place et l'observateur
    // suit ce que le jeu écrira. Le bouton bascule et recharge.
    if (Lg) {
      Lg.activer();
      // v7.1 — DEUX boutons, le même geste : celui de l'en-tête (la Porte, l'Atelier)
      // et celui du menu. L'en-tête est masqué dans la cour — un joueur déjà entré
      // n'avait plus aucun moyen de changer de langue, et sur téléphone aucun
      // contournement (signalé par Youssef, 20/09/2026).
      ["#zj-langue", "#zj-menu-langue"].forEach(function (sel) {
        var bl = $(sel);
        if (!bl) return;
        var ar = Lg.estAr();
        bl.innerHTML = ar ? "Français" : '<span lang="ar" dir="rtl">العربية</span>';
        // l'infobulle dit où l'on VA, pas d'où l'on vient — en page arabe elle
        // annonçait encore « العب بالعربية » sur le bouton du retour.
        var dit = ar ? "Jouer en français" : "Jouer en arabe";
        bl.setAttribute("aria-label", dit);
        bl.title = dit;
        bl.addEventListener("click", function () {
          Lg.choisir(Lg.estAr() ? "fr" : "ar");
          location.reload();
        });
      });
    }
    brancherPorte(); brancherDossier(); brancherRetour(); brancherAtelier(); brancherCour(); brancherIntro(); brancherDayf();
    choisirOnglet("entrer");
    if (Mu) {
      orchestre = Mu.creer();
      orchestre.muet(muetEnregistre());
      var b = $("#zj-son");
      if (b && !orchestre.dispo()) b.hidden = true;
      if (b) b.addEventListener("click", function () {
        orchestre.reveiller();
        enregistrerMuet(orchestre.muet());
        orchestre.demarrer();
        majBoutonSon();
      });
      majBoutonSon();
      // Le premier geste, quel qu'il soit, ouvre le son — mais JAMAIS
      // par-dessus le film de l'intro, qui est raconté : le clic qui lance le
      // film ne doit pas lancer l'Āla avec. On garde l'écoute et l'oud
      // attendra le geste d'après, une fois l'intro refermée.
      ["pointerdown", "keydown"].forEach(function (ev) {
        document.addEventListener(ev, function premier() {
          if (intro.actif && intro.film) return;
          document.removeEventListener(ev, premier);
          reveillerMusique();
        });
      });
    }
    // La librairie Supabase ne se charge que si le jeu est branché sur un
    // projet : en atelier, rien ne part sur le réseau.
    if (CFG.supabaseUrl && CFG.supabaseAnonKey && !window.supabase) {
      var s = document.createElement("script");
      s.src = CFG.supabaseScript || "assets/js/vendor/supabase.umd.js";
      s.onload = demarrer;
      s.onerror = function () { demarrer(); message("#zj-porte-msg", "La librairie des comptes n'a pas chargé : mode atelier.", "ko"); };
      document.head.appendChild(s);
    } else demarrer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher); else brancher();

  // Pour vérifier depuis la console — ou depuis un test de navigateur.
  window.ZWJ_APP = {
    get joueur() { return joueur; }, get ecran() { return ecran; }, get perso() { return cour.perso; },
    get dayf() { return dayf.actif; }, get dayfEtat() { return dayf.etat; }, get menuOuvert() { return menuOuvert; },   // Bab — vie.js
    get arb3ineDebut() { return joueur ? debutArb3ine() : null; },   // Bab — vie.js : le jour du rapport d'étonnement
    afficher: afficher, agir: agir, touches: cour.touches, get compte() { return compte; }, get scene() { return cour.scene; },
    sandouq: ouvrirSandouq, repondre: repondre, indice: demanderIndice, fermer: fermerDialogue,
    etabli: ouvrirEtabli, choisir: choisir, carnet: ouvrirCarnet, riwaq: ouvrirRiwaq, fermerRiwaq: fermerRiwaq,
    imtihan: ouvrirImtihan, fermerImtihan: fermerImtihan, repondreImtihan: repondreImtihan, tableau: ouvrirTableau,
    souk: ouvrirSouk, fermerSouk: fermerSouk, maFerracha: ouvrirMaFerracha, allerAMonEtal: allerAMonEtal,   // 23/09/2026
    derb: function () { ouvrirSouk({ source: "derb" }); }, get soukEtat() { return souk; }, allerA: allerA,   // v8.7
    bibliotheque: ouvrirBibliotheque, fermerBibliotheque: fermerBibliotheque,
    kounnach: ouvrirKounnach, fermerKounnach: fermerKounnach, kounnachEtat: etatKounnach,
    masarat: ouvrirMasarat, fermerMasarat: fermerMasarat,
    maharat: ouvrirMaharat, fermerMaharat: fermerMaharat,   // v7.8
    ijaza: ouvrirCarteIjaza, fermerIjaza: fermerCarteIjaza, partagerIjaza: partagerIjaza,   // v7.8 — la carte du diplôme
    get lignee() { return lignee; },
    get admission() { return admission; }, parrainage: ouvrirParrainage, fermerParrainage: fermerParrainage,
    retour: ouvrirRetour, fermerRetour: fermerRetour,
    get morchid() { return morchid; }, incarner: incarner, cartes: ouvrirCartes, fermerCartes: fermerCartes, kharita: ouvrirKharita, fermerKharita: fermerKharita, get majliss() { return majliss; }, ouvrirMajliss: ouvrirMajliss, fermerMajliss: fermerMajliss,
    // v8.0 — la Rkhama : exposée comme la chambre du Majliss, pour que la dalle se vérifie en CLIQUANT
    get rkhama() { return rkhama; }, ouvrirRkhama: ouvrirRkhama, fermerRkhama: fermerRkhama,
    get rihla() { return rihla; }, entrerRihla: entrerRihla, sortirRihla: sortirRihla, etal: ouvrirEtalPour, fermerEtal: fermerEtal,
    get rahba() { return rahba; }, entrerRahba: entrerRahba, sortirRahba: sortirRahba, qissaria: ouvrirQissaria, affaires: ouvrirSafqa,   // v5.7
    // v7.7 — le Mechouar : exposé comme la Rahba, pour que la place se vérifie en CLIQUANT
    get mechouar() { return mechouar; }, entrerMechouar: entrerMechouar, sortirMechouar: sortirMechouar,
    ouvrirMechouar: ouvrirMechouar, fermerMechouar: fermerMechouar,
    get combat() { return combat; }, ouvrirCombat: ouvrirCombat, choisirTechnique: choisirTechnique, repondreCombat: repondreCombat, suiteCombat: suiteCombat,
    fermerCombat: fermerCombat, choixRafiq: ouvrirChoixRafiq, choisirRafiq: choisirRafiq, get suiveur() { return suiveur; },
    carteRafiq: ouvrirCarteRafiq, fermerCarteRafiq: fermerCarteRafiq, duel: ouvrirDuel, fermerDuel: fermerDuel, get duelJeu() { return duelJeu; }, get pretGrande() { return pretGrande(); },
    wird: ouvrirWird, fermerWird: fermerWird, get wirdEtat() { return wirdEtat(); }, get guide() { return guide; }, rejouerLeDebut: rejouerLeDebut,
    get dialogue() { return cour.dialogue; },
    get pnjs() { return cour.pnjs; },
    get sahn() { return sahn; }, saluer: saluer, dire: direUnMot,
    // v8.5 — le Kalam de la pièce et les Rasa'il
    get kalam() { return kalam; }, get rasail() { return rasail; }, get gens() { return gens; },
    ouvrirGens: ouvrirGens, fermerGens: fermerGens, ouvrirFil: ouvrirFil, relireNonLus: relireNonLus, tocPour: tocPour,
    get bitaqa() { return bitaqa; }, ouvrirMaCarte: ouvrirMaCarte, ouvrirPersonne: ouvrirPersonne,   // v8.6
    get musique() { return orchestre; },
    intro: ouvrirIntro, fermerIntro: fermerIntro, avancerIntro: avancerIntro,
    get introActive() { return intro.actif; }, get introScene() { return intro.scene; },
    tutoriel: relancerTutoriel, finirTutoriel: finirTutoriel,
    get tutorielActif() { return tuto.actif; }, get tutorielEtape() { return tuto.index; }
  };
})();
