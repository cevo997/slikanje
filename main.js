const firebaseConfig = {
  apiKey: "AIzaSyCbyMyzoGiTF2l63N4VztDjG1Qg4yOT9Fg",
  authDomain: "zakazivanje-slikanja.firebaseapp.com",
  projectId: "zakazivanje-slikanja",
  storageBucket: "zakazivanje-slikanja.firebasestorage.app",
  messagingSenderId: "1021967152923",
  appId: "1:1021967152923:web:47468192fb336e067ec5be"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const startHour = 9;
const endHour = 19;
const interval = 30;

function getTodayInSerbia() {
  const now = new Date();
  const offset = 2 * 60;
  const local = new Date(now.getTime() + (now.getTimezoneOffset() + offset) * 60000);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

let datumKey = getTodayInSerbia();
let savedData = {};

function pad(n) {
  return n.toString().padStart(2, "0");
}

function renderSchedule(dateStr) {
  const container = document.getElementById("daySchedule");
  container.innerHTML = `<h2>Datum: ${dateStr.split("-").reverse().join(".")}</h2>`;

  const grid = document.createElement("div");
  grid.className = "grid";

  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const timeStr = `${pad(h)}:${pad(m)}`;
      const slotData = savedData[dateStr]?.[timeStr] || {
        agent: "", adresa: "", broj: "", telefon: "", sifra: "", slikano: false, emailPoslat: false
      };

      const slotDiv = document.createElement("div");
      slotDiv.className = "time-slot";
      if (slotData.agent || slotData.adresa || slotData.broj || slotData.telefon) slotDiv.classList.add("filled");

      const label = document.createElement("h4");
      label.textContent = timeStr;
      slotDiv.appendChild(label);

      const inputs = ["agent", "adresa", "broj", "telefon", "sifra"].map(field => {
        const input = document.createElement("input");
        input.type = field === "telefon" ? "tel" : "text";
        input.placeholder = field.charAt(0).toUpperCase() + field.slice(1);
        input.value = slotData[field] || "";
        slotDiv.appendChild(input);
        return [field, input];
      });

      const slikano = document.createElement("input");
      slikano.type = "checkbox";
      slikano.checked = slotData.slikano;
      const slikanoLabel = document.createElement("label");
      slikanoLabel.className = "slikano-label";
      slikanoLabel.appendChild(slikano);
      slikanoLabel.appendChild(document.createTextNode("Slikano"));
      slotDiv.appendChild(slikanoLabel);

      function updateStorage() {
        const noviSlot = Object.fromEntries(inputs.map(([k, i]) => [k, i.value]));
        noviSlot.slikano = slikano.checked;
        noviSlot.emailPoslat = slotData.emailPoslat || false;

        if (!savedData[dateStr]) savedData[dateStr] = {};
        savedData[dateStr][timeStr] = noviSlot;

        localStorage.setItem("slicanja", JSON.stringify(savedData));
        db.collection("termini").doc(`${dateStr}_${timeStr}`).set(noviSlot);

        slotDiv.classList.toggle("filled", noviSlot.agent || noviSlot.adresa || noviSlot.broj || noviSlot.telefon);
      }

      [...inputs.map(i => i[1]), slikano].forEach(el => el.addEventListener("input", updateStorage));
      grid.appendChild(slotDiv);
    }
  }

  container.appendChild(grid);
}

function popuniDropdown() {
  const select = document.getElementById("izborDatuma");
  select.innerHTML = "";
  Object.keys(savedData).sort().reverse().forEach(datum => {
    const opcija = document.createElement("option");
    opcija.value = datum;
    opcija.textContent = datum.split("-").reverse().join(".");
    if (datum === datumKey) opcija.selected = true;
    select.appendChild(opcija);
  });
}

function promeniDatum(izabraniDatum) {
  datumKey = izabraniDatum;
  renderSchedule(datumKey);
  document.getElementById("pretragaSifre").value = "";
  document.getElementById("rezultatiPretrage").textContent = "";
}

function pretraziSifru() {
  const query = document.getElementById("pretragaSifre").value.trim().toLowerCase();
  const rezDiv = document.getElementById("rezultatiPretrage");
  if (!query) return (rezDiv.textContent = "");

  let prviDatum = null, prviId = null, rezultati = [];

  for (let [datum, termini] of Object.entries(savedData)) {
    for (let [vreme, podaci] of Object.entries(termini)) {
      if (podaci.sifra?.toLowerCase().includes(query)) {
        rezultati.push(`- ${datum.split("-").reverse().join(".")} u ${vreme} | Šifra: ${podaci.sifra}`);
        if (!prviDatum) {
          prviDatum = datum;
          prviId = `slot-${datum.replace(/-/g, "")}-${vreme.replace(":", "")}-${podaci.sifra}`;
        }
      }
    }
  }

  if (rezultati.length) {
    rezDiv.textContent = `Pronađeno ${rezultati.length} termin(a):\n` + rezultati.join("\n");
    if (prviDatum !== datumKey) {
      datumKey = prviDatum;
      document.getElementById("izborDatuma").value = prviDatum;
      renderSchedule(datumKey);
      setTimeout(() => {
        const el = document.getElementById(prviId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  } else {
    rezDiv.textContent = "Nema rezultata za ovu šifru.";
  }
}

function ucitajIzFirestore() {
  db.collection("termini").get().then(snapshot => {
    const novaData = {};
    snapshot.forEach(doc => {
      const [datum, vreme] = doc.id.split("_");
      if (!novaData[datum]) novaData[datum] = {};
      novaData[datum][vreme] = doc.data();
    });
    savedData = novaData;
    localStorage.setItem("slicanja", JSON.stringify(savedData));
    renderSchedule(datumKey);
    popuniDropdown();
  }).catch(err => {
    console.error("Greška:", err);
    document.getElementById("daySchedule").innerHTML = "<h2>Greška pri učitavanju podataka</h2>";
  });
}

ucitajIzFirestore();
