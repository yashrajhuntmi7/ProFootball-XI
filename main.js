const pitch = document.getElementById("pitch");
const formationSelect = document.getElementById("formation");
const modal = document.getElementById("playerModal");
const playerList = document.getElementById("playerList");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const filterSelect = document.getElementById("filter");

let currentSlot = null;
let playersData = [];
let selectedPlayers = new Set();

const formations = {
  "4-3-3": [[50,90],[20,70],[40,70],[60,70],[80,70],[30,50],[50,50],[70,50],[20,25],[50,20],[80,25]],
  "4-4-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[20,50],[40,50],[60,50],[80,50],[35,25],[65,25]],
  "3-5-2": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[50,40],[35,20],[65,20]],
  "5-3-2": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[30,50],[50,50],[70,50],[35,25],[65,25]],
  "4-2-3-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[35,55],[65,55],[20,35],[50,35],[80,35],[50,20]],
  "4-1-2-1-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[50,60],[30,45],[70,45],[50,35],[35,20],[65,20]],
  "3-4-3": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[20,25],[50,20],[80,25]],
  "5-4-1": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[20,50],[40,50],[60,50],[80,50],[50,20]],
  "4-5-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[10,50],[30,50],[50,50],[70,50],[90,50],[50,20]],
  "3-4-2-1": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[35,30],[65,30],[50,20]],
  "4-3-2-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[30,50],[50,50],[70,50],[40,30],[60,30],[50,20]],
  "5-2-3": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[40,50],[60,50],[20,25],[50,20],[80,25]],
  "3-3-4": [[50,90],[30,70],[50,70],[70,70],[30,50],[50,50],[70,50],[10,25],[35,20],[65,20],[90,25]],
  "4-2-2-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[35,50],[65,50],[30,30],[70,30],[40,20],[60,20]],
  "3-6-1": [[50,90],[30,70],[50,70],[70,70],[10,50],[30,50],[50,50],[70,50],[90,50],[50,35],[50,20]]
};

const positionMap = {
  GK: ["GK"],
  DEF: ["CB","LB","RB","LWB","RWB"],
  MID: ["CM","CDM","CAM","LM","RM"],
  ATT: ["ST","CF","LW","RW"]
};

const showError = msg => playerList.innerHTML = `<div style="padding:20px;color:red;text-align:center;">${msg}</div>`;

function renderFormation(name) {
  pitch.innerHTML = "";
  selectedPlayers.clear();
  if (!formations[name]) return;

  formations[name].forEach(([x,y]) => {
    const el = document.createElement("div");
    el.className = "player";
    el.style.left = x + "%";
    el.style.top = y + "%";
    el.textContent = "+";
    el.dataset.playerId = "";

    el.onclick = () => {
      if (el.dataset.playerId) {
        selectedPlayers.delete(el.dataset.playerId);
        el.dataset.playerId = "";
        el.classList.remove("active");
        el.textContent = "+";
        return;
      }
      currentSlot = el;
      modal.style.display = "flex";
      renderPlayers(playersData);
    };

    pitch.appendChild(el);
  });
}

async function fetchPlayers() {
  try {
    playerList.innerHTML = "Loading...";
    const res = await fetch("http://localhost:3000/players");
    if (!res.ok) throw Error("Failed to fetch");

    const data = await res.json();
    playersData = data.players || (data.player ? [data.player] : data);

    if (!playersData.length) throw Error("No players found");

    renderPlayers(playersData);
  } catch (e) {
    showError(e.message);
  }
}

function renderPlayers(data) {
  playerList.innerHTML = "";
  if (!data.length) return showError("No players match");

  data
    .filter(p => !selectedPlayers.has(p.id))
    .forEach(p => {
      const div = document.createElement("div");
      div.className = "player-item";
      div.innerHTML = `<img src="${p.picture}"><span>${p.name} (${p.overall})</span>`;

      div.onclick = () => {
        currentSlot.classList.add("active");
        currentSlot.dataset.playerId = p.id;
        selectedPlayers.add(p.id);
        currentSlot.innerHTML = `<img src="${p.picture}">`;
        modal.style.display = "none";
      };

      playerList.appendChild(div);
    });
}

function applyFilters() {
  try {
    let data = [...playersData];

    if (searchInput.value)
      data = data.filter(p => p.name.toLowerCase().includes(searchInput.value.toLowerCase()));

    if (filterSelect.value)
      data = data.filter(p => positionMap[filterSelect.value].includes(p.position));

    if (sortSelect.value)
      data.sort((a,b) => b[sortSelect.value] - a[sortSelect.value]);

    renderPlayers(data);
  } catch {
    showError("Error processing data");
  }
}

searchInput.oninput = applyFilters;
filterSelect.onchange = applyFilters;
sortSelect.onchange = applyFilters;

formationSelect.onchange = () => renderFormation(formationSelect.value);

window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

document.addEventListener("DOMContentLoaded", () => {
  fetchPlayers();
  renderFormation(formationSelect.value);
});