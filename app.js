const API_URL = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const agenti = ["SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"];

document.addEventListener("DOMContentLoaded", () => {
  const izborDatuma = document.getElementById("izborDatuma");
  izborDatuma.valueAsDate = new Date();
  ucitajTermine(izborDatuma.value);
  izborDatuma.addEventListener("change", () => ucitajTermine(izborDatuma.value));
});

function ucitajTermine(datum) {
  const grid = document.getElementById("terminiGrid");
  grid.innerHTML = "Učitavanje...";
  fetch(`${API_URL}?search=Datum:${datum}`)
    .then(res => res.json())
    .then(podaci => {
      const termini = generisiTermine(datum);
      podaci.forEach(p => {
        const termin = termini.find(t => t.vreme === p.Vreme);
        if (termin) {
          Object.assign(termin, p);
        }
      });
      prikaziTermine(termini, datum);
    });
}

function generisiTermine(datum) {
  const termini = [];
  for (let h = 9; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      termini.push({
        datum,
        vreme: `${hh}:${mm}`,
        "Šifra stana": "",
        Agent: "",
        Adresa: "",
        Telefon: "",
        Slikano: ""
      });
    }
  }
  return termini;
}

function prikaziTermine(termini, datum) {
  const grid = document.getElementById("terminiGrid");
  grid.innerHTML = "";
  const brojac = {};
  termini.forEach(t => {
    const kartica = document.createElement("div");
    kartica.className = "kartica";
    if (t.Slikano === "TRUE") kartica.classList.add("slikano");

    kartica.innerHTML = `
      <strong>${t.vreme}</strong><br/>
      <label>Šifra stana: <input value="${t["Šifra stana"]}" /></label>
      <label>Agent:
        <select>
          <option value="">-</option>
          ${agenti.map(a => `<option ${a === t.Agent ? "selected" : ""}>${a}</option>`).join("")}
        </select>
      </label>
      <label>Adresa: <input value="${t.Adresa}" /></label>
      <label>Telefon: <input value="${t.Telefon}" /></label>
      <label>Slikano: <input type="checkbox" ${t.Slikano === "TRUE" ? "checked" : ""} /></label>
      <button>Sačuvaj</button>
    `;

    const [inputSifra, selectAgent, inputAdresa, inputTelefon, chkSlikano, dugmeSacuvaj] = kartica.querySelectorAll("input, select, button");

    dugmeSacuvaj.addEventListener("click", () => {
      const podaci = {
        Datum: datum,
        Vreme: t.vreme,
        "Šifra stana": inputSifra.value,
        Agent: selectAgent.value,
        Adresa: inputAdresa.value,
        Telefon: inputTelefon.value,
        Slikano: chkSlikano.checked ? "TRUE" : ""
      };

      fetch(`${API_URL}?search=Datum:${datum}&search_by=Datum,Vreme`, {
        method: "DELETE"
      }).then(() =>
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [podaci] })
        })
      ).then(() => {
        if (chkSlikano.checked) kartica.classList.add("slikano");
        else kartica.classList.remove("slikano");
        alert("Sačuvano!");
        ucitajTermine(datum);
      });
    });

    grid.appendChild(kartica);
    if (t.Agent && t.Slikano === "TRUE") {
      brojac[t.Agent] = (brojac[t.Agent] || 0) + 1;
    }
  });

  prikaziStatistiku(brojac);
  proveriZakasnele(termini);
}

function prikaziStatistiku(brojac) {
  const stat = document.getElementById("statistika");
  stat.innerHTML = Object.keys(brojac).map(agent => `${agent}: ${brojac[agent]} stanova`).join(" | ") || "Nema podataka.";
}

function proveriZakasnele(termini) {
  const danas = new Date();
  const stari = termini.filter(t => {
    if (!t.Slikano || t.Slikano !== "TRUE") {
      const datumTermina = new Date(t.datum);
      return (danas - datumTermina) / (1000 * 60 * 60 * 24) > 2;
    }
    return false;
  });

  if (stari.length > 0) {
    const poruka = stari.map(t => `${t.datum} ${t.vreme} | ${t.Agent} | ${t["Šifra stana"]}`).join("\n");
    fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_xxx",
        template_id: "template_xxx",
        user_id: "user_xxx",
        template_params: {
          to_email: "stefanbarac@gmail.com",
          message: poruka
        }
      })
    });
  }
}
