const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const agenti = ["SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"];
const vremeTermina = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
let podaci = [];

document.addEventListener("DOMContentLoaded", () => {
  const izborDatuma = document.getElementById("izborDatuma");
  izborDatuma.value = new Date().toISOString().split("T")[0]; // danasnji datum
  izborDatuma.addEventListener("change", prikaziTermine);
  prikaziTermine();
});

function prikaziTermine() {
  const datum = document.getElementById("izborDatuma").value;
  fetch(`${API_URL}?Datum=${datum}`)
    .then(res => {
      if (!res.ok) throw new Error("Neuspesan odgovor sa servera");
      return res.json();
    })
    .then(data => {
      podaci = data;
      const container = document.getElementById("termini");
      container.innerHTML = "";

      vremeTermina.forEach(vreme => {
        const entry = podaci.find(t => t.Vreme === vreme);
        const div = document.createElement("div");
        div.className = "termin";
        if (entry?.Slikano === "TRUE") div.classList.add("zavrseno");

        div.innerHTML = `
          <div><b>Datum:</b> ${datum}</div>
          <div><b>Vreme:</b> ${vreme}</div>
          <label>Šifra stana</label>
          <input type="text" value="${entry?.["Šifra stana"] || ""}" />
          <label>Adresa</label>
          <input type="text" value="${entry?.Adresa || ""}" />
          <label>Telefon</label>
          <input type="text" value="${entry?.Telefon || ""}" />
          <label>Agent</label>
          <select>
            ${agenti.map(agent => `<option${entry?.Agent === agent ? " selected" : ""}>${agent}</option>`).join("")}
          </select>
          <label><input type="checkbox" ${entry?.Slikano === "TRUE" ? "checked" : ""} /> Slikano</label>
          <button onclick="sacuvaj(this, '${vreme}', '${datum}')">Sačuvaj</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      alert(err.message);
    });
}

function sacuvaj(btn, vreme, datum) {
  const div = btn.parentElement;
  const sifra = div.querySelectorAll("input")[0].value;
  const adresa = div.querySelectorAll("input")[1].value;
  const telefon = div.querySelectorAll("input")[2].value;
  const agent = div.querySelector("select").value;
  const slikano = div.querySelector("input[type=checkbox]").checked ? "TRUE" : "FALSE";

  const novi = {
    Datum: datum,
    Vreme: vreme,
    "Šifra stana": sifra,
    Adresa: adresa,
    Telefon: telefon,
    Agent: agent,
    Slikano: slikano
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [novi] })
  })
  .then(res => {
    if (!res.ok) throw new Error("Greška pri čuvanju podataka.");
    return res.json();
  })
  .then(() => {
    prikaziTermine();
  })
  .catch(err => alert(err.message));
}
