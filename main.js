
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbyMyzoGiTF2l63N4VztDjG1Qg4yOT9Fg",
  authDomain: "zakazivanje-slikanja.firebaseapp.com",
  projectId: "zakazivanje-slikanja",
  storageBucket: "zakazivanje-slikanja.firebasestorage.app",
  messagingSenderId: "1021967152923",
  appId: "1:1021967152923:web:47468192fb336e067ec5be"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const startHour = 9;
const endHour = 19;
const interval = 30;

function getTodayInSerbia() {
  const now = new Date();
  const offset = 2 * 60;
  const local = new Date(now.getTime() + (now.getTimezoneOffset() + offset) * 60000);
  const yyyy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

let datumKey = getTodayInSerbia();
let savedData = {};

async function ucitajIzFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "termini"));
    const novaData = {};
    snapshot.forEach(docSnap => {
      const [datum, vreme] = docSnap.id.split("_");
      if (!novaData[datum]) novaData[datum] = {};
      novaData[datum][vreme] = docSnap.data();
    });

    savedData = novaData;
    localStorage.setItem("slicanja", JSON.stringify(savedData));

    renderSchedule(datumKey);
    popuniDropdown();
    proveriNeodslikaneStanove();
  } catch (error) {
    console.error("Greška pri učitavanju iz Firestore:", error);
    document.getElementById("daySchedule").innerHTML = "<h2>Greška pri učitavanju podataka</h2>";
  }
}

async function updateFirestore(dateStr, timeStr, slotData) {
  try {
    const docId = `${dateStr}_${timeStr}`;
    await setDoc(doc(db, "termini", docId), slotData);
  } catch (error) {
    console.error("Greška pri čuvanju u Firestore:", error);
  }
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function renderSchedule(dateStr) {
  const container = document.getElementById("daySchedule");
  container.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `Datum: ${dateStr.split("-").reverse().join(".")}`;
  container.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "grid";

  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const timeStr = `${pad(h)}:${pad(m)}`;
      const slotData = savedData[dateStr]?.[timeStr] || {
        agent: "",
        adresa: "",
        broj: "",
        telefon: "",
        sifra: "",
        slikano: false,
        emailPoslat: false
      };

      const slotDiv = document.createElement("div");
      slotDiv.className = "time-slot";
      if (slotData.agent || slotData.adresa || slotData.broj || slotData.telefon) {
        slotDiv.classList.add("filled");
      }

      slotDiv.id = `slot-${dateStr.replace(/-/g, "")}-${timeStr.replace(":", "")}-${slotData.sifra}`;

      const label = document.createElement("h4");
      label.textContent = timeStr;
      slotDiv.appendChild(label);

      const agent = document.createElement("input");
      agent.type = "text";
      agent.placeholder = "Agent";
      agent.value = slotData.agent;

      const adresa = document.createElement("input");
      adresa.type = "text";
      adresa.placeholder = "Adresa stana";
      adresa.value = slotData.adresa;

      const broj = document.createElement("input");
      broj.type = "text";
      broj.placeholder = "Broj stana";
      broj.value = slotData.broj;

      const telefon = document.createElement("input");
      telefon.type = "tel";
      telefon.placeholder = "Kontakt telefon";
      telefon.value = slotData.telefon;

      const sifra = document.createElement("input");
      sifra.type = "text";
      sifra.placeholder = "Šifra stana";
      sifra.value = slotData.sifra || "";

      const slikanoLabel = document.createElement("label");
      slikanoLabel.className = "slikano-label";
      const slikano = document.createElement("input");
      slikano.type = "checkbox";
      slikano.checked = slotData.slikano;
      slikanoLabel.appendChild(slikano);
      slikanoLabel.appendChild(document.createTextNode("Slikano"));
      slotDiv.appendChild(slikanoLabel);

      function updateStorage() {
        const noviSlot = {
          agent: agent.value,
          adresa: adresa.value,
          broj: broj.value,
          telefon: telefon.value,
          sifra: sifra.value,
          slikano: slikano.checked,
          emailPoslat: slotData.emailPoslat || false
        };
        savedData[dateStr][timeStr] = noviSlot;
        localStorage.setItem("slicanja", JSON.stringify(savedData));
        updateFirestore(dateStr, timeStr, noviSlot);

        if (agent.value || adresa.value || broj.value || telefon.value) {
          slotDiv.classList.add("filled");
        } else {
          slotDiv.classList.remove("filled");
        }
      }

      [agent, adresa, broj, telefon, sifra, slikano].forEach(el =>
        el.addEventListener("input", updateStorage)
      );

      slotDiv.appendChild(agent);
      slotDiv.appendChild(adresa);
      slotDiv.appendChild(broj);
      slotDiv.appendChild(telefon);
      slotDiv.appendChild(sifra);
      grid.appendChild(slotDiv);
    }
  }

  container.appendChild(grid);
}

function popuniDropdown() {
  const select = document.getElementById("izborDatuma");
  select.innerHTML = "";

  const sviDatumi = Object.keys(savedData).sort().reverse();
  sviDatumi.forEach(datum => {
    const opcija = document.createElement("option");
    opcija.value = datum;
    opcija.textContent = datum.split("-").reverse().join(".");
    if (datum === datumKey) opcija.selected = true;
    select.appendChild(opcija);
  });
}

function promeniDatum(izabraniDatum) {
  datumKey = izabraniDatum;
  renderSchedule(izabraniDatum);
  document.getElementById("pretragaSifre").value = "";
  document.getElementById("rezultatiPretrage").textContent = "";
}

function pretraziSifru() {
  const query = document.getElementById("pretragaSifre").value.trim().toLowerCase();
  const rezDiv = document.getElementById("rezultatiPretrage");
  if (!query) {
    rezDiv.textContent = "";
    return;
  }

  let rezultati = [];
  let prviRezultatId = null;
  let prviDatum = null;

  Object.entries(savedData).forEach(([datum, termini]) => {
    Object.entries(termini).forEach(([vreme, podaci]) => {
      if (podaci.sifra && podaci.sifra.toLowerCase().includes(query)) {
        rezultati.push(`- ${datum.split("-").reverse().join(".")} u ${vreme} | Šifra: ${podaci.sifra}`);
        if (!prviRezultatId) {
          prviRezultatId = `slot-${datum.replace(/-/g, "")}-${vreme.replace(":", "")}-${podaci.sifra}`;
          prviDatum = datum;
        }
      }
    });
  });

  if (rezultati.length) {
    rezDiv.textContent = `Pronađeno ${rezultati.length} termin(a):
` + rezultati.join("
");

    if (prviDatum && prviDatum !== datumKey) {
      datumKey = prviDatum;
      document.getElementById("izborDatuma").value = prviDatum;
      renderSchedule(prviDatum);
      setTimeout(() => {
        const el = document.getElementById(prviRezultatId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      setTimeout(() => {
        const el = document.getElementById(prviRezultatId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  } else {
    rezDiv.textContent = "Nema rezultata za ovu šifru.";
  }
}

function posaljiZbirniEmailFormspree(nizSifri) {
  if (nizSifri.length === 0) return;
  const spisak = nizSifri.map(s => `- Šifra: ${s}`).join("\n");
  fetch("https://formspree.io/f/xvgqoawy", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Sledeći stanovi nisu odslikani:\n\n${spisak}`,
      name: "Sistem za slikanje",
      email: "stefanbarac@gmail.com"
    })
  })
  .then(() => console.log("✅ Email poslat preko Formspree"))
  .catch(err => console.error("❌ Greška pri slanju emaila:", err));
}

function proveriNeodslikaneStanove() {
  const danas = new Date();
  const sviDatumi = Object.keys(savedData);
  let neodslikani = [];
  sviDatumi.forEach(datum => {
    const datumObj = new Date(datum + "T00:00");
    const razlikaDana = Math.floor((danas - datumObj) / (1000 * 60 * 60 * 24));
    if (razlikaDana >= 2) {
      const danTermini = savedData[datum];
      for (let vreme in danTermini) {
        const slot = danTermini[vreme];
        if (!slot.slikano && !slot.emailPoslat && slot.sifra) {
          neodslikani.push(slot.sifra);
          slot.emailPoslat = true;
        }
      }
    }
  });
  if (neodslikani.length > 0) {
    posaljiZbirniEmailFormspree(neodslikani);
    localStorage.setItem("slicanja", JSON.stringify(savedData));
  }
}

ucitajIzFirestore();
