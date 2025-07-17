const apiUrl = "https://sheetdb.io/api/v1/ywvbhlm9ikdui";
const terminiDiv = document.getElementById("termini");
const izborDatuma = document.getElementById("izborDatuma");
const agenti = ["SAŠKA", "CECA", "LJILJA", "RUŽA", "SEKA", "SANDRA", "NIKOLA", "ANĐELA", "ATINA", "VIŠNJA", "MILA", "BUDA", "NATAŠA"];

let izabraniDatum = new Date().toISOString().split("T")[0];
izborDatuma.value = izabraniDatum;

function kreirajTermine() {
  terminiDiv.innerHTML = "";
  const vremena = kreirajVremena();
  vremena.forEach((vreme) => {
    const kartica = document.createElement("div");
    kartica.className = "kartica";
    kartica.innerHTML = `
      <h3>${vreme}</h3>
      <p class="datum-label">${izabraniDatum}</p>
      <input placeholder="Šifra stana" class="sifra">
      <select class="agent">
        <option value="">Agent</option>
        ${agenti.map((a) => `<option>${a}</option>`).join("")}
      </select>
      <input placeholder="Adresa" class="adresa">
      <input placeholder="Telefon" class="telefon">
      <label><input type="checkbox" class="slikano"> Slikano</label>
      <button class="sacuvaj">Sačuvaj</button>
    `;
    kartica.querySelector(".sacuvaj").addEventListener("click", () => {
      const sifra = kartica.querySelector(".sifra").value;
      const agent = kartica.querySelector(".agent").value;
      const adresa = kartica.querySelector(".adresa").value;
      const telefon = kartica.querySelector(".telefon").value;
      const slikano = kartica.querySelector(".slikano").checked;

      const podaci = {
        Datum: izabraniDatum,
        Vreme: vreme,
        "Šifra stana": sifra,
        Agent: agent,
        Adresa: adresa,
        Telefon: telefon,
        Slikano: slikano ? "TRUE" : "FALSE"
      };

      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: podaci })
      }).then(() => {
        alert("Sačuvano!");
        ucitajTermine(izabraniDatum); // ✅ osveži kartice odmah
      });
    });
    terminiDiv.appendChild(kartica);
  });
}

function kreirajVremena() {
  const vremena = [];
  let sati = 9, minuti = 0;
  while (sati < 20) {
    const sat = sati.toString().padStart(2, "0");
    const min = minuti.toString().padStart(2, "0");
    vremena.push(`${sat}:${min}`);
    minuti += 30;
    if (minuti === 60) {
      minuti = 0;
      sati++;
    }
  }
  return vremena;
}

function ucitajTermine(datum) {
  izabraniDatum = datum;
  fetch(`${apiUrl}/search?Datum=${datum}`)
    .then(res => res.json())
    .then(podaci => {
      kreirajTermine();
      if (!Array.isArray(podaci)) return;
      podaci.forEach((termin) => {
        const kartice = document.querySelectorAll(".kartica");
        kartice.forEach((k) => {
          if (k.querySelector("h3").textContent === termin.Vreme) {
            k.querySelector(".sifra").value = termin["Šifra stana"] || "";
            k.querySelector(".agent").value = termin.Agent || "";
            k.querySelector(".adresa").value = termin.Adresa || "";
            k.querySelector(".telefon").value = termin.Telefon || "";
            if (termin.Slikano === "TRUE") {
              k.querySelector(".slikano").checked = true;
              k.style.opacity = 0.5;
            }
          }
        });
      });
    });
}

izborDatuma.addEventListener("change", () => {
  ucitajTermine(izborDatuma.value);
});

ucitajTermine(izabraniDatum); // učitava današnji datum na startu
