const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const agenti = ["SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"];
const vremeTermina = [
  "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00",
  "13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30"
];

document.addEventListener("DOMContentLoaded", () => {
  const izborDatuma = document.getElementById("izborDatuma");
  // postavi današnji datum kao podrazumevani
  izborDatuma.value = new Date().toISOString().split("T")[0];

  izborDatuma.addEventListener("change", () => {
    prikaziTermine(izborDatuma.value);
  });

  prikaziTermine(izborDatuma.value);
});

function prikaziTermine(datum) {
  fetch(`${API_URL}?Datum=${datum}`)
    .then(res => {
      if (!res.ok) throw new Error("Greška pri dohvaćanju podataka");
      return res.json();
    })
    .then(data => {
      const container = document.getElementById("termini");
      container.innerHTML = "";

      vremeTermina.forEach(vreme => {
        const entry = data.find(d => d.Vreme === vreme);

        const div = document.createElement("div");
        div.className = "termin";

        if (entry && entry.Slikano === "TRUE") div.classList.add("zavrseno");

        div.innerHTML = `
          <div><strong>Datum:</strong> ${datum}</div>
          <div><strong>Termin:</strong> ${vreme}</div>
          <label>Šifra stana</label><input type="text" value="${entry ? entry["Šifra stana"] : ""}" />
          <label>Adresa</label><input type="text" value="${entry ? entry.Adresa : ""}" />
          <label>Telefon</label><input type="text" value="${entry ? entry.Telefon : ""}" />
          <label>Agent</label>
          <select>
            ${agenti.map(agent => `<option${entry && entry.Agent === agent ? " selected" : ""}>${agent}</option>`).join("")}
          </select>
          <label><input type="checkbox" ${entry && entry.Slikano === "TRUE" ? "checked" : ""}/> Slikano</label>
          <button onclick="sacuvaj(this, '${datum}', '${vreme}')">Sačuvaj</button>
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      alert("Došlo je do greške pri učitavanju termina.");
    });
}

function sacuvaj(btn, datum, vreme) {
  const kartica = btn.parentElement;
  const sifra = kartica.querySelectorAll("input")[1].value;
  const adresa = kartica.querySelectorAll("input")[2].value;
  const telefon = kartica.querySelectorAll("input")[3].value;
  const agent = kartica.querySelector("select").value;
  const slikano = kartica.querySelector("input[type=checkbox]").checked ? "TRUE" : "";

  const noviUnos = {
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
    body: JSON.stringify({ data: [noviUnos] })
  })
  .then(res => {
    if (!res.ok) throw new Error("Greška pri čuvanju");
    return res.json();
  })
  .then(() => {
    prikaziTermine(datum);
  })
  .catch(err => {
    console.error(err);
    alert("Došlo je do greške pri čuvanju.");
  });
}
