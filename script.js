const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const agenti = ["SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"];
const vremeTermina = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
let podaci = [];

document.addEventListener("DOMContentLoaded", () => {
  const izborDatuma = document.getElementById("izborDatuma");
  izborDatuma.value = new Date().toISOString().split("T")[0];
  izborDatuma.addEventListener("change", prikaziTermine);
  prikaziTermine();
});

function prikaziTermine() {
  const datum = document.getElementById("izborDatuma").value;
  fetch(`${API_URL}?search=Datum&eq=${datum}`)
    .then(res => res.json())
    .then(data => {
      podaci = data;
      const container = document.getElementById("rezultatiPretrage");
      container.innerHTML = "";

      vremeTermina.forEach(vreme => {
        const entry = data.find(t => t.Vreme === vreme);
        const div = document.createElement("div");
        div.className = "termin";
        if (entry?.Slikano === "TRUE") div.classList.add("zavrseno");

        div.innerHTML = `
          <h3>${vreme}</h3>
          <label>Šifra stana</label><input type="text" value="${entry?.["Šifra stana"] || ""}" />
          <label>Adresa</label><input type="text" value="${entry?.Adresa || ""}" />
          <label>Telefon</label><input type="text" value="${entry?.Telefon || ""}" />
          <label>Agent</label>
          <select>
            ${agenti.map(agent => `<option${entry?.Agent === agent ? " selected" : ""}>${agent}</option>`).join("")}
          </select>
          <label><input type="checkbox" ${entry?.Slikano === "TRUE" ? "checked" : ""}/> Slikano</label>
          <button onclick="sacuvaj(this, '${vreme}')">Sačuvaj</button>
        `;
        container.appendChild(div);
      });

      azurirajStatistiku();
    });
}

function sacuvaj(btn, vreme) {
  const div = btn.parentElement;
  const datum = document.getElementById("izborDatuma").value;
  const sifra = div.querySelectorAll("input")[0].value;
  const adresa = div.querySelectorAll("input")[1].value;
  const telefon = div.querySelectorAll("input")[2].value;
  const agent = div.querySelector("select").value;
  const slikano = div.querySelector("input[type=checkbox]").checked ? "TRUE" : "";

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
  }).then(() => {
    prikaziTermine();
  });
}

function azurirajStatistiku() {
  const stats = {};
  podaci.forEach(p => {
    if (p.Slikano === "TRUE") {
      stats[p.Agent] = (stats[p.Agent] || 0) + 1;
    }
  });

  let html = "<h3>Broj stanova po agentima:</h3><ul>";
  agenti.forEach(agent => {
    html += `<li>${agent}: ${stats[agent] || 0}</li>`;
  });
  html += "</ul>";
  document.getElementById("statistika").innerHTML = html;
}
