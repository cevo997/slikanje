const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const AGENTI = [
  "SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA",
  "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"
];

document.addEventListener("DOMContentLoaded", () => {
  const datumInput = document.getElementById("izborDatuma");
  datumInput.valueAsDate = new Date();
  datumInput.addEventListener("change", () => ucitajTermine(datumInput.value));

  ucitajTermine(datumInput.value);
});

function ucitajTermine(datum) {
  const container = document.getElementById("termini");
  container.innerHTML = "Učitavanje...";

  fetch(`${API_URL}/search?Datum=${datum}`)
    .then(res => res.json())
    .then(podaci => {
      container.innerHTML = "";
      const vremena = generisiVremena();

      vremena.forEach(vreme => {
        const podatak = podaci.find(p => p.Vreme === vreme) || {};
        const kartica = napraviKarticu(datum, vreme, podatak);
        container.appendChild(kartica);
      });

      prikaziStatistiku(podaci);
    });
}

function generisiVremena() {
  const vremena = [];
  let sati = 9, minuti = 0;
  while (sati < 20) {
    vremena.push(
      `${String(sati).padStart(2, "0")}:${String(minuti).padStart(2, "0")}`
    );
    minuti += 30;
    if (minuti === 60) {
      minuti = 0;
      sati++;
    }
  }
  return vremena;
}

function napraviKarticu(datum, vreme, podatak) {
  const kartica = document.createElement("div");
  kartica.className = "kartica";

  const sifraInput = napraviInput("Šifra stana", podatak["Šifra stana"] || "");
  const adresaInput = napraviInput("Adresa", podatak["Adresa"] || "");
  const telefonInput = napraviInput("Telefon", podatak["Telefon"] || "");

  const agentSelect = document.createElement("select");
  AGENTI.forEach(ime => {
    const opcija = document.createElement("option");
    opcija.value = ime;
    opcija.textContent = ime;
    if (ime === podatak["Agent"]) opcija.selected = true;
    agentSelect.appendChild(opcija);
  });

  const slikano = document.createElement("input");
  slikano.type = "checkbox";
  slikano.checked = podatak["Slikano"] === "TRUE";

  const sacuvajBtn = document.createElement("button");
  sacuvajBtn.textContent = "Sačuvaj";
  sacuvajBtn.onclick = () => {
    const noviPodatak = {
      Datum: datum,
      Vreme: vreme,
      "Šifra stana": sifraInput.value,
      Adresa: adresaInput.value,
      Telefon: telefonInput.value,
      Agent: agentSelect.value,
      Slikano: slikano.checked ? "TRUE" : "FALSE"
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [noviPodatak] })
    }).then(() => {
      alert("Sačuvano!");
      ucitajTermine(datum);
    });
  };

  if (slikano.checked) kartica.style.opacity = "0.4";

  kartica.innerHTML = `<h3>${vreme}</h3>`;
  kartica.appendChild(sifraInput);
  kartica.appendChild(adresaInput);
  kartica.appendChild(telefonInput);
  kartica.appendChild(agentSelect);
  kartica.appendChild(slikano);
  kartica.appendChild(sacuvajBtn);

  return kartica;
}

function napraviInput(placeholder, value) {
  const input = document.createElement("input");
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

function prikaziStatistiku(podaci) {
  const stat = document.getElementById("statistika");
  const brojac = {};

  podaci.forEach(p => {
    if (p.Slikano === "TRUE") {
      brojac[p.Agent] = (brojac[p.Agent] || 0) + 1;
    }
  });

  stat.innerHTML = "<h3>Statistika:</h3>";
  Object.entries(brojac).forEach(([agent, broj]) => {
    const red = document.createElement("div");
    red.textContent = `${agent}: ${broj} stanova`;
    stat.appendChild(red);
  });
}
