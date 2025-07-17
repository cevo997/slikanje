const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const terminiDiv = document.getElementById("termini");
const izborDatuma = document.getElementById("izborDatuma");

const agenti = [
  "SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA",
  "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA",
  "BUDA", "NATAŠA"
];

// Automatski postavi današnji datum pri učitavanju
const danas = new Date().toISOString().split("T")[0];
izborDatuma.value = danas;
ucitajTermine(danas);

izborDatuma.addEventListener("change", () => {
  ucitajTermine(izborDatuma.value);
});

function ucitajTermine(datum) {
  terminiDiv.innerHTML = ""; // Očisti prethodni sadržaj

  const vremena = [];
  for (let h = 9; h <= 19; h++) {
    vremena.push(`${h.toString().padStart(2, '0')}:00`);
    vremena.push(`${h.toString().padStart(2, '0')}:30`);
  }

  fetch(`${API_URL}/search?Datum=${datum}`)
    .then(res => res.json())
    .then(podaci => {
      vremena.forEach(vreme => {
        const termin = Array.isArray(podaci)
          ? podaci.find(p => p.Vreme === vreme)
          : null;

        const kartica = document.createElement("div");
        kartica.className = "kartica";
        if (termin?.Slikano === "TRUE") kartica.classList.add("slikano");

        const datumEl = document.createElement("div");
        datumEl.className = "datum-info";
        datumEl.textContent = datum;
        kartica.appendChild(datumEl);

        kartica.innerHTML += `
          <strong>${vreme}</strong><br/>
          <label>Šifra:</label>
          <input type="text" value="${termin?.['Šifra stana'] || ''}" /><br/>
          <label>Agent:</label>
          <select>
            ${agenti.map(a => `<option ${termin?.Agent === a ? 'selected' : ''}>${a}</option>`).join("")}
          </select>
          <label>Adresa:</label>
          <input type="text" value="${termin?.Adresa || ''}" /><br/>
          <label>Telefon:</label>
          <input type="tel" value="${termin?.Telefon || ''}" /><br/>
          <label>Slikano:</label>
          <input type="checkbox" ${termin?.Slikano === "TRUE" ? "checked" : ""} /><br/>
          <button onclick="sacuvaj(this, '${datum}', '${vreme}')">Sačuvaj</button>
        `;

        terminiDiv.appendChild(kartica);
      });
    });
}

function sacuvaj(dugme, datum, vreme) {
  const kartica = dugme.parentElement;
  const inputs = kartica.querySelectorAll("input, select");
  const podaci = {
    Datum: datum,
    Vreme: vreme,
    "Šifra stana": inputs[1].value,
    Agent: inputs[2].value,
    Adresa: inputs[3].value,
    Telefon: inputs[4].value,
    Slikano: inputs[5].checked ? "TRUE" : "FALSE"
  };

  // Brišemo prethodni unos za isti datum + vreme
  fetch(`${API_URL}/search?Datum=${datum}&Vreme=${vreme}`)
    .then(res => res.json())
    .then(pronadjeni => {
      if (Array.isArray(pronadjeni) && pronadjeni.length > 0) {
        const id = pronadjeni[0].id;
        fetch(`${API_URL}/id/${id}`, {
          method: "DELETE"
        }).then(() => dodajNovi(podaci));
      } else {
        dodajNovi(podaci);
      }
    });
}

function dodajNovi(podaci) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [podaci] })
  }).then(() => {
    ucitajTermine(podaci.Datum);
  });
}
