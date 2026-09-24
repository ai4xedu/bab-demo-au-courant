// ZAW'IA — le jeu · LA MUSIQUE.
//
// DEUX COUCHES, et il faut les distinguer pour lire ce fichier :
//
//  1. LE FOND — un MORCEAU ENREGISTRÉ, joué en boucle (`assets/audio/`), depuis
//     le 14/09/2026. C'est la pièce composée pour ZAW'IA ; elle a remplacé la
//     nappe synthétisée, qui sonnait « pixel » sous une image peinte.
//     ⚠️ La boucle ne fait pas de trou parce que le FICHIER a été fabriqué pour
//        ça : ses cinq dernières secondes ont été fondues sur son début. Un
//        morceau remplacé sans refaire ce fondu croisé rouvrira un blanc toutes
//        les 57 secondes. La recette est dans CLAUDE.md, § v2.3.
//
//  2. LES EFFETS — toujours synthétisés par le navigateur (Web Audio), comme
//     les tuiles sont dessinées par rendu.js : la page retrouvée, le défi
//     passé, l'erreur, l'entrée. Rien à héberger pour une note d'oud.
//
// LES TABLES CI-DESSOUS RESTENT, et servent toujours : les ṭubū' et les mizan
// donnent aux effets leurs hauteurs, `LIEUX[].gain` règle le volume pièce par
// pièce (la Khizana plus bas — on y lit), et les neuf villes attendent leur
// carte. Ce sont aussi les notes de la maison sur sa propre matière : al-Āla,
// la musique arabo-andalouse du Maroc, celle des onze noubas de Fès, sœur du
// gharnati d'Oujda et de Tlemcen.
//
// ⚠️ HONNÊTETÉ : le tempérament égal du navigateur ne SAIT PAS jouer les
//    intervalles de l'Āla — il manque les quarts de ton, et un oud n'est pas
//    une onde. Ces tables sont une ÉVOCATION en douze demi-tons, pas une
//    transcription. On le dit ici pour que personne ne prenne ce fichier pour
//    une source : la source, ce sont les orchestres, et un Fqih de la musique
//    aurait son mot à dire avant qu'on prétende autre chose.
//
// ⚠️ Le voile (ZAWIA-VOILE.md) s'applique : la maison ne se nomme pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.musique = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  /* ======================= LES ṬUBŪ' (les modes) =======================
     Degrés en demi-tons depuis la tonique. `couleur` est la note qui donne
     au mode son visage : celle qu'on fait sonner en fin de phrase. */
  var TUBU = [
    { cle: "ramal",     nom: "Ramal al-Māya",     ar: "رمل الماية",   degres: [0, 2, 3, 5, 7, 8, 10], couleur: 3,
      note: "Le ṭab' d'ouverture de bien des noubas — grave, posé, un peu mélancolique." },
    { cle: "istihlal",  nom: "Al-Istihlāl",       ar: "الاستهلال",    degres: [0, 2, 3, 5, 7, 9, 10], couleur: 5,
      note: "Celui des entrées et des seuils : il monte sans se presser." },
    { cle: "hijaz",     nom: "Ḥijāz al-Kabīr",    ar: "الحجاز الكبير", degres: [0, 1, 4, 5, 7, 8, 11], couleur: 1,
      note: "La seconde abaissée et la tierce haute : le pas d'écart qu'on reconnaît entre mille." },
    { cle: "rasd",      nom: "Raṣd",              ar: "رصد",          degres: [0, 2, 4, 5, 7, 9, 11], couleur: 4,
      note: "Le plus clair, le plus droit — celui des jours qui vont bien." },
    { cle: "gharibat",  nom: "Gharībat al-Ḥusayn", ar: "غريبة الحسين", degres: [0, 1, 4, 5, 7, 9, 10], couleur: 9,
      note: "L'étrangère : faite pour ce qui part et ce qui passe." },
    { cle: "maya",      nom: "Al-Māya",           ar: "الماية",       degres: [0, 2, 4, 5, 7, 8, 10], couleur: 8,
      note: "Doux, un peu voilé — la nouba des fins de soirée." }
  ];

  function tab(cle) {
    for (var i = 0; i < TUBU.length; i++) if (TUBU[i].cle === cle) return TUBU[i];
    return TUBU[0];
  }

  /* ======================= LES MIZAN (les rythmes) =======================
     Une case = une pulsation. « D » = dum (la frappe grave, au centre de la
     peau), « t » = tak (la frappe claire, au bord), « . » = silence.
     L'ordre de cette table est celui d'une nouba : du plus lent au plus vif. */
  var MIZAN = [
    { cle: "basit",   nom: "Basīṭ",          ar: "بسيط",         temps: ["D", ".", "t", ".", "D", "t"],                    bpm: 54,
      note: "Six temps larges. On l'entend à l'ouverture, quand rien ne presse." },
    { cle: "qaim",    nom: "Qā'im wa niṣf",  ar: "قائم ونصف",    temps: ["D", ".", "t", "D", ".", "t", "t", "."],           bpm: 66,
      note: "Huit temps, la marche d'un bâtisseur." },
    { cle: "btayhi",  nom: "Btāyhī",         ar: "بطايحي",       temps: ["D", "t", ".", "t", "D", ".", "t", "."],           bpm: 76,
      note: "Le cœur de la nouba : celui qu'on fredonne en marchant dans la cour." },
    { cle: "darj",    nom: "Darj",           ar: "درج",          temps: ["D", "t", "t", ".", "D", "t"],                     bpm: 92,
      note: "Ça se resserre. On avance, on apprend." },
    { cle: "quddam",  nom: "Quddām",         ar: "قدّام",         temps: ["D", "t", "t", "D", ".", "t"],                     bpm: 112,
      note: "La fin de la nouba, la plus vive : celle où la salle bat des mains." }
  ];

  function mizan(cle) {
    for (var i = 0; i < MIZAN.length; i++) if (MIZAN[i].cle === cle) return MIZAN[i];
    return MIZAN[2];
  }

  /* ======================= LES NEUF VILLES =======================
     Chacune aura sa carte (game design § 4) ; chacune a déjà sa couleur
     sonore, pour que le jour venu on n'invente rien dans l'urgence.
     Fès joue l'Āla, Oujda le gharnati — ce sont les deux écoles, et le jeu
     les distingue comme la maison les distingue. */
  var VILLES = [
    { cle: "fes",        tab: "ramal",     mizan: "btayhi", note: "L'Āla de Fès, la source." },
    { cle: "meknes",     tab: "istihlal",  mizan: "qaim",   note: "La ville des murs et des portes : une marche." },
    { cle: "marrakech",  tab: "rasd",      mizan: "quddam", note: "La place, les ferrachas, le bruit clair." },
    { cle: "rabat",      tab: "maya",      mizan: "basit",  note: "La tour inachevée : ce qui reste suspendu." },
    { cle: "casablanca", tab: "rasd",      mizan: "darj",   note: "Le port, la négociation, le pas rapide." },
    { cle: "tanger",     tab: "gharibat",  mizan: "darj",   note: "L'étrangère, pour le détroit et ce qui part." },
    { cle: "agadir",     tab: "istihlal",  mizan: "basit",  note: "On recommence : lentement, puis on tient." },
    { cle: "dakhla",     tab: "hijaz",     mizan: "quddam", note: "Le vent et le mawsem." },
    { cle: "oujda",      tab: "hijaz",     mizan: "darj",   note: "Le gharnati — l'autre école, celle de Grenade." }
  ];

  function ville(cle) {
    for (var i = 0; i < VILLES.length; i++) if (VILLES[i].cle === cle) return VILLES[i];
    return VILLES[0];
  }

  /* ======================= LES LIEUX DE LA QARAWIYINE =======================
     Tant qu'il n'y a qu'une ville, c'est la pièce qui fait la couleur.
     `oud`, `ney`, `perc` disent qui joue : la Khizana n'a pas de tambour, on
     n'y bat pas la mesure au-dessus des livres. */
  var LIEUX = [
    { cle: "porte",    tab: "ramal",    mizan: "basit",  oud: true,  ney: true,  perc: false, gain: 0.75,
      nom: "Devant la porte", note: "Un oud seul, très lent : on attend d'entrer." },
    { cle: "atelier",  tab: "rasd",     mizan: "basit",  oud: true,  ney: false, perc: false, gain: 0.7,
      nom: "L'Atelier", note: "On coud une djellaba, on ne fait pas de bruit." },
    { cle: "vestibule", tab: "istihlal", mizan: "qaim",  oud: true,  ney: true,  perc: true,  gain: 0.85,
      nom: "Le Bab et le riad", note: "On vient d'entrer : la maison se présente." },
    { cle: "sahn",     tab: "ramal",    mizan: "btayhi", oud: true,  ney: true,  perc: true,  gain: 1,
      nom: "Le Sahn", note: "La cour, la fontaine : le btāyhī, le cœur de la nouba." },
    { cle: "khizana",  tab: "maya",     mizan: "basit",  oud: true,  ney: false, perc: false, gain: 0.65,
      nom: "La Khizana", note: "Oud seul, sans tambour : on lit." },
    { cle: "madrasa",  tab: "istihlal", mizan: "darj",   oud: true,  ney: true,  perc: true,  gain: 0.9,
      nom: "La Madrasa", note: "Le darj : ça se resserre, on apprend, on est noté." },
    { cle: "qa3a",     tab: "hijaz",    mizan: "quddam", oud: true,  ney: true,  perc: true,  gain: 1,
      nom: "La Qa3a", note: "Le quddām : la halqa, la salle qui bat des mains." },
    // v5.7 — la Rahba du Souk (rahba.js), dehors des murs : le quddām aussi — on crie les prix, on bat des mains.
    { cle: "souk",     tab: "rasd",     mizan: "quddam", oud: true,  ney: true,  perc: true,  gain: 1,
      nom: "La Rahba du Souk", note: "Dehors des murs : le dellal crie, les mains battent." }
  ];

  function lieu(cle) {
    for (var i = 0; i < LIEUX.length; i++) if (LIEUX[i].cle === cle) return LIEUX[i];
    return LIEUX[3];
  }

  // Où est le joueur, en TUILES (monde.js) → quel lieu sonne.
  // Pur, et testé : la carte peut bouger, les frontières se relisent ici.
  function lieuPour(tx, ty) {
    var x = Number(tx), y = Number(ty);
    if (isNaN(x) || isNaN(y)) return "sahn";
    if (y >= 27) return "qa3a";        // au sud du grand mur : la salle de prière
    if (y <= 8) return "vestibule";    // au nord : le Bab, le riad, les ablutions
    if (x <= 8) return "khizana";      // à l'ouest : les rayonnages
    if (x >= 37) return "madrasa";     // à l'est : le lawh et l'établi
    return "sahn";
  }

  /* ======================= LES HAUTEURS =======================
     La tonique par défaut est un ré grave (D3 ≈ 146,83 Hz) : l'oud marocain
     est accordé bas, et le grave passe mieux sur un haut-parleur de téléphone. */
  var TONIQUE = 146.83;

  // frequence(ṭab', degré, octave) — le degré est un rang dans le mode
  // (0 = tonique, 7 = la tonique à l'octave), pas un demi-ton.
  function frequence(t, degre, octave) {
    var m = typeof t === "string" ? tab(t) : (t || TUBU[0]);
    var n = Math.round(Number(degre) || 0);
    var g = m.degres.length;
    var oct = Math.floor(n / g) + (Number(octave) || 0);
    var i = ((n % g) + g) % g;
    var demi = m.degres[i] + 12 * oct;
    return TONIQUE * Math.pow(2, demi / 12);
  }

  // Un hasard REPRODUCTIBLE : même graine, même phrase. Pas de Math.random —
  // deux joueurs côte à côte entendraient deux musiques différentes, et un
  // test ne pourrait rien vérifier. (Même fonction que rendu.js.)
  function hache(a, b) {
    var n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  // Une phrase d'oud : `n` degrés qui tournent autour de la tonique et
  // retombent sur la couleur du mode. Ce n'est pas de l'improvisation — c'est
  // une marche au hasard bornée, ce qui suffit à ne pas lasser l'oreille.
  function phrase(cleTab, graine, n) {
    var m = tab(cleTab);
    var out = [];
    var d = 0;
    var taille = Math.max(1, Number(n) || 8);
    for (var i = 0; i < taille; i++) {
      var r = hache(graine, i);
      if (i === 0) d = 0;
      else if (i === taille - 1) d = m.degres.indexOf(m.couleur) >= 0 ? m.degres.indexOf(m.couleur) : 0;
      else {
        var pas = r < 0.34 ? -1 : (r < 0.72 ? 1 : (r < 0.86 ? 2 : -2));
        d += pas;
        if (d > 9) d = 9;
        if (d < -2) d = -2;
      }
      out.push(d);
    }
    return out;
  }

  /* ======================= LA NAPPE (le fond sonore) =======================
     Depuis le 14/09/2026, le FOND est un morceau enregistré, joué en boucle —
     la pièce composée pour ZAW'IA. Les tables ci-dessus n'ont pas disparu :
     elles règlent toujours les EFFETS (la page retrouvée, le défi passé) et le
     volume de chaque pièce (`LIEUX[].gain`).
     ⚠️ La boucle est SANS TROU parce que le fichier a été fabriqué pour ça :
        ses cinq dernières secondes ont été fondues sur son début. Remplacer le
        morceau sans refaire ce fondu croisé rouvrirait un blanc toutes les
        57 secondes. La durée ci-dessous est celle du fichier livré. */
  var NAPPE = { dossier: "assets/audio/", version: "?v=85", secondes: 57.043729 };

  /* ======================= LE JOUEUR (navigateur) =======================
     Tout ce qui suit touche au son et n'est pas testé sous Node — comme
     rendu.js pour le pixel. L'API est volontairement petite :
       creer() → { demarrer, arreter, allerA(lieu), effet(nom), muet(bool), etat() }
     ⚠️ Un navigateur REFUSE de jouer avant un geste de l'utilisateur : on ne
        crée le contexte audio qu'au premier clic/touche, et `demarrer()` est
        sans effet avant. C'est pour ça que le bouton ♪ existe. */
  function creer(opts) {
    opts = opts || {};
    var AC = typeof window !== "undefined" ? (window.AudioContext || window.webkitAudioContext) : null;
    var ctx = null, maitre = null, bus = null, reverb = null;
    var courant = lieu("sahn"), enMarche = false, silencieux = false;
    // La nappe enregistrée : le buffer décodé, la promesse de chargement, et la
    // source en cours (une seule à la fois).
    var nappe = null, chargement = null, lecteur = null;

    function dispo() { return !!AC; }

    // Deux bus, et c'est voulu :
    //   bus    — les EFFETS (oud, ney, darbouka), qui passent par la réverb ;
    //   maitre — le volume général, où tout se rejoint : c'est lui que `muet`
    //            et `allerA` font monter et descendre.
    // La nappe entre directement dans `maitre` : elle est déjà mixée, la
    // repasser dans une réverbération de synthèse la rendrait boueuse.
    function init() {
      if (ctx || !AC) return ctx;
      ctx = new AC();
      maitre = ctx.createGain();
      maitre.gain.value = silencieux ? 0 : 0.22;   // bas : une musique de fond reste en dessous
      maitre.connect(ctx.destination);
      bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(maitre);
      // Une réverbération courte, faite d'un bruit qui décroît : la cour d'une
      // médersa sonne, un casque sec sonne faux.
      var sec = 1.6, buf = ctx.createBuffer(2, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var d = buf.getChannelData(c);
        for (var i = 0; i < d.length; i++) {
          var t = i / d.length;
          d[i] = (hache(i, c * 7 + 1) * 2 - 1) * Math.pow(1 - t, 2.6);
        }
      }
      reverb = ctx.createConvolver();
      reverb.buffer = buf;
      var envoi = ctx.createGain();
      envoi.gain.value = 0.3;
      bus.connect(envoi);
      envoi.connect(reverb);
      reverb.connect(maitre);
      return ctx;
    }

    // ---- la nappe : le morceau, en boucle ------------------------------------
    // Opus quand le navigateur le lit (la boucle y est sans blanc, par
    // construction), MP3 sinon — il n'y a pas de navigateur sans MP3.
    function sourceNappe() {
      var a = typeof document !== "undefined" ? document.createElement("audio") : null;
      var opus = a && a.canPlayType && a.canPlayType('audio/ogg; codecs="opus"');
      return NAPPE.dossier + (opus ? "zawia-ambiance.ogg" : "zawia-ambiance.mp3") + NAPPE.version;
    }

    function charger() {
      if (chargement) return chargement;
      if (typeof fetch !== "function" || !ctx) return Promise.reject(new Error("pas de contexte"));
      chargement = fetch(sourceNappe())
        .then(function (r) {
          if (!r.ok) throw new Error("nappe HTTP " + r.status);
          return r.arrayBuffer();
        })
        .then(function (octets) {
          return new Promise(function (ok, ko) {
            // L'ancienne signature (callbacks) est la seule que Safari
            // ait toujours acceptée ; elle rend aussi une promesse ailleurs.
            var p = ctx.decodeAudioData(octets, ok, ko);
            if (p && typeof p.then === "function") p.then(ok, ko);
          });
        })
        .then(function (buf) { nappe = buf; return buf; });
      return chargement;
    }

    function jouerNappe() {
      if (!ctx || !nappe || lecteur) return;
      lecteur = ctx.createBufferSource();
      lecteur.buffer = nappe;
      lecteur.loop = true;
      // La queue du morceau a été fondue sur sa tête à la fabrication : la
      // boucle se referme sans trou. On borne quand même la zone bouclée à la
      // durée connue — un décodeur qui ajoute du rembourrage ne s'entend pas.
      lecteur.loopStart = 0;
      lecteur.loopEnd = Math.min(nappe.duration, NAPPE.secondes);
      lecteur.connect(maitre);
      lecteur.start(0);
    }

    function stopperNappe() {
      if (!lecteur) return;
      try { lecteur.stop(); } catch (e) { /* déjà arrêtée */ }
      try { lecteur.disconnect(); } catch (e) { /* déjà détachée */ }
      lecteur = null;
    }

    function reveiller() {
      init();
      if (ctx && ctx.state === "suspended") ctx.resume();
    }

    // ---- les instruments ---------------------------------------------------
    // L'oud : une corde pincée. Deux ondes légèrement désaccordées dans un
    // filtre qui se referme — c'est le pincement, pas la corde, qui fait le son.
    function oud(f, t, duree, gain) {
      if (!ctx) return;
      var g = ctx.createGain(), filtre = ctx.createBiquadFilter();
      filtre.type = "lowpass";
      filtre.frequency.setValueAtTime(Math.min(6000, f * 9), t);
      filtre.frequency.exponentialRampToValueAtTime(Math.max(220, f * 2), t + duree);
      filtre.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
      [0, 4].forEach(function (cents, k) {
        var o = ctx.createOscillator();
        o.type = k ? "triangle" : "sawtooth";
        o.frequency.setValueAtTime(f * Math.pow(2, cents / 1200), t);
        o.connect(filtre);
        o.start(t); o.stop(t + duree + 0.02);
      });
      filtre.connect(g); g.connect(bus);
    }

    // Le ney : un souffle. Sinus + un peu de bruit filtré, attaque lente.
    function ney(f, t, duree, gain) {
      if (!ctx) return;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + duree * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t);
      // le vibrato : sans lui, c'est une sirène
      var lfo = ctx.createOscillator(), prof = ctx.createGain();
      lfo.frequency.value = 4.8; prof.gain.value = f * 0.006;
      lfo.connect(prof); prof.connect(o.frequency);
      lfo.start(t); lfo.stop(t + duree + 0.02);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + duree + 0.02);
    }

    function bruit(duree) {
      var n = Math.max(1, Math.floor(ctx.sampleRate * duree));
      var b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = hache(i, 97) * 2 - 1;
      var s = ctx.createBufferSource(); s.buffer = b;
      return s;
    }

    // La darbouka : le dum descend en hauteur, le tak est un claquement filtré.
    function dum(t, gain) {
      if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(165, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 0.24);
    }
    function tak(t, gain) {
      if (!ctx) return;
      var s = bruit(0.09), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "bandpass"; f.frequency.value = 2100; f.Q.value = 1.6;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      s.connect(f); f.connect(g); g.connect(bus);
      s.start(t); s.stop(t + 0.1);
    }

    // ---- la marche ----------------------------------------------------------
    // `demarrer()` rend la main tout de suite : le morceau peut n'être pas
    // encore descendu. Quand il arrive, on ne le lance que si l'on est TOUJOURS
    // en marche — sinon la nappe partirait après un `arreter()`, dans le dos du
    // joueur qui vient de couper le son ou de quitter l'écran.
    function demarrer() {
      if (!dispo()) return false;
      reveiller();
      if (!ctx) return false;
      if (enMarche) return true;
      enMarche = true;
      if (nappe) { jouerNappe(); return true; }
      charger().then(function () {
        if (enMarche) jouerNappe();
      }).catch(function () {
        // Le morceau n'est pas venu (réseau, format refusé) : le jeu continue
        // en silence. Les effets, eux, sont synthétisés et marchent toujours.
        chargement = null;
      });
      return true;
    }

    function arreter() {
      enMarche = false;
      stopperNappe();
    }

    // Changer de lieu : on ne coupe pas, on laisse la mesure finir — d'où le
    // fondu du volume plutôt qu'un arrêt net.
    function allerA(cle) {
      var l = lieu(cle);
      if (l.cle === courant.cle) return courant.cle;
      courant = l;
      if (ctx && maitre) {
        var cible = silencieux ? 0 : 0.22 * l.gain;
        maitre.gain.cancelScheduledValues(ctx.currentTime);
        maitre.gain.setValueAtTime(maitre.gain.value, ctx.currentTime);
        maitre.gain.linearRampToValueAtTime(cible, ctx.currentTime + 0.6);
      }
      return courant.cle;
    }

    // ---- les effets --------------------------------------------------------
    var EFFETS = {
      // une montée qui se pose sur la tonique : la page revient
      page:     { degres: [0, 2, 4, 7], duree: 0.16, gain: 0.26, inst: "oud" },
      // le Ta7addi passé : plus court, plus sec, plus « atelier »
      defi:     { degres: [4, 5, 7], duree: 0.13, gain: 0.24, inst: "oud" },
      // on s'est trompé : deux notes qui redescendent, sans drame
      faux:     { degres: [2, 0], duree: 0.18, gain: 0.16, inst: "oud" },
      // on entre : le ney annonce
      entree:   { degres: [0, 4], duree: 0.5, gain: 0.12, inst: "ney" },
      // la page d'un dialogue qui tourne : un tak discret
      page_dlg: { degres: [], duree: 0, gain: 0.1, inst: "tak" }
    };

    function effet(nom) {
      if (!ctx || silencieux) return false;
      var e = EFFETS[nom];
      if (!e) return false;
      var t0 = ctx.currentTime + 0.01, t = tab(courant.tab);
      if (e.inst === "tak") { tak(t0, e.gain); return true; }
      e.degres.forEach(function (d, i) {
        var quand = t0 + i * e.duree;
        if (e.inst === "ney") ney(frequence(t, d, 1), quand, e.duree * 2.2, e.gain);
        else oud(frequence(t, d, 0), quand, e.duree * 2.4, e.gain);
      });
      return true;
    }

    function muet(v) {
      if (typeof v === "boolean") silencieux = v;
      else silencieux = !silencieux;
      if (ctx && maitre) {
        var cible = silencieux ? 0 : 0.22 * courant.gain;
        maitre.gain.cancelScheduledValues(ctx.currentTime);
        maitre.gain.setValueAtTime(maitre.gain.value, ctx.currentTime);
        maitre.gain.linearRampToValueAtTime(cible, ctx.currentTime + 0.25);
      }
      return silencieux;
    }

    function etat() {
      return {
        dispo: dispo(), enMarche: enMarche, silencieux: silencieux,
        // « running » = le son sort vraiment ; « suspended » = le navigateur
        // attend encore un geste. Sans cette ligne, impossible de vérifier.
        contexte: ctx ? ctx.state : null,
        // `nappe` dit si le morceau est descendu et décodé, `boucle` s'il
        // tourne vraiment — deux choses différentes quand le réseau traîne.
        nappe: !!nappe, boucle: !!lecteur,
        lieu: courant.cle, nomLieu: courant.nom,
        // Le ṭab' et le mizan ne décrivent plus le fond (c'est un
        // enregistrement) : ils règlent les EFFETS de la pièce. On les garde
        // nommés pour ça, pas pour les afficher comme « ce qui joue ».
        tab: tab(courant.tab).nom, mizan: mizan(courant.mizan).nom
      };
    }

    return { demarrer: demarrer, arreter: arreter, allerA: allerA, effet: effet, muet: muet, etat: etat, reveiller: reveiller, dispo: dispo };
  }

  return {
    TUBU: TUBU, tab: tab,
    MIZAN: MIZAN, mizan: mizan,
    VILLES: VILLES, ville: ville,
    LIEUX: LIEUX, lieu: lieu, lieuPour: lieuPour,
    TONIQUE: TONIQUE, frequence: frequence, phrase: phrase, hache: hache,
    creer: creer
  };
});
