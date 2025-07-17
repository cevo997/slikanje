const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const agenti = [
  "SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA",
  "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"
];

const vremena = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30"
];

function ucitajTermine() {
  const datumInput = document.getElementById("datum");
  const datum = datumInput.value;

  if (!datum) {
    alert("Izaberite datum!");
    return;
  }

  fetch(`${API_URL}/search?Datum=${datum}`)
    .then(res => res.json())
    .then(podaci => {
      const terminiDiv = document.getElementById("termini");
      terminiDiv.innerHTML = "";

      vremena.forEach(vreme => {
        let unos = Array.isArray(podaci) ? podaci.find(p => p.Vreme === vreme) : null;

        const div = document.createElement("div");
        div.className = "kartica";

        div.innerHTML = `
          <h3>${vreme}</h3>
          <input type="text" placeholder="Šifra stana" value="${unos?.["Šifra stana"] || ""}" />
          <select>
            <option value="">Agent</option>
            ${agenti.map(agent => `
              <option value="${agent}" ${unos?.Agent === agent ? "selected" : ""}>${agent}</option>
            `).join("")}
          </select>
          <input type="text" placeholder="Adresa" value="${unos?.Adresa || ""}" />
          <input type="text" placeholder="Telefon" value="${unos?.Telefon || ""}" />
          <label>
            <input type="checkbox" ${unos?.Slikano === "TRUE" ? "checked" : ""} />
            Slikano
          </label>
          <button onclick="sacuvajTermin(this, '${datum}', '${vreme}')">Sačuvaj</button>
        `;

        if (unos?.Slikano === "TRUE") div.classList.add("slikano");

        terminiDiv.appendChild(div);
      });
    });
}

function sacuvajTermin(dugme, datum, vreme) {
  const kartica = dugme.parentElement;
  const inputs = kartica.querySelectorAll("input");
  const select = kartica.querySelector("select");

  const sifra = inputs[0].value;
  const agent = select.value;
  const adresa = inputs[1].value;
  const telefon = inputs[2].value;
  const slikano = inputs[3].checked;

  const podaci = {
    Datum: datum,
    Vreme: vreme,
    "Šifra stana": sifra,
    Agent: agent,
    Adresa: adresa,
    Telefon: telefon,
    Slikano: slikano ? "TRUE" : "FALSE"
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [podaci] })
  })
    .then(res => res.json())
    .then(() => {
      alert("Sačuvano!");
      ucitajTermine();
    });
}
