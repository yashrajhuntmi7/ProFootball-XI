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

function renderFormation(name) {
  pitch.innerHTML = "";
  selectedPlayers.clear();

  if (!formations[name]) return;

  formations[name].forEach(function(pos) {
    const player = document.createElement("div");
    player.className = "player";
    player.style.left = pos[0] + "%";
    player.style.top = pos[1] + "%";
    player.textContent = "+";
    player.dataset.playerId = "";

    player.addEventListener("click", function() {
      if (player.dataset.playerId) {
        selectedPlayers.delete(player.dataset.playerId);
        player.dataset.playerId = "";
        player.classList.remove("active");
        player.textContent = "+";
        return;
      }

      currentSlot = player;
      modal.style.display = "flex";
      renderPlayers(playersData);
    });

    pitch.appendChild(player);
  });
}

async function fetchPlayers() {
  try {
    const res = await fetch("http://localhost:3000/players");
    const data = await res.json();

    if (Array.isArray(data)) {
      playersData = data;
    } else if (data.players) {
      playersData = data.players;
    } else if (data.player) {
      playersData = [data.player];
    } else {
      playersData = [];
    }

    renderPlayers(playersData);

  } catch (error) {
    console.log(error);
  }
}

function renderPlayers(data) {
  playerList.innerHTML = "";

  data.forEach(function(p) {
    if (selectedPlayers.has(p.id)) return;

    const div = document.createElement("div");
    div.className = "player-item";

    div.innerHTML = `
      <img src="${p.picture}">
      <span>${p.name} (${p.overall})</span>
    `;

    div.addEventListener("click", function() {
      currentSlot.classList.add("active");
      currentSlot.dataset.playerId = p.id;
      selectedPlayers.add(p.id);
      currentSlot.innerHTML = `<img src="${p.picture}">`;
      modal.style.display = "none";
    });

    playerList.appendChild(div);
  });
}

function applyFilters() {
  let filtered = [...playersData];

  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const sort = sortSelect.value;

  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
  if (filter) filtered = filtered.filter(p => p.position.includes(filter));
  if (sort) filtered = filtered.sort((a,b)=>b[sort]-a[sort]);

  renderPlayers(filtered);
}

searchInput.addEventListener("input", applyFilters);
filterSelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

formationSelect.addEventListener("change", function() {
  renderFormation(formationSelect.value);
});

window.addEventListener("click", function(e) {
  if (e.target === modal) modal.style.display = "none";
});

document.addEventListener("DOMContentLoaded", function() {
  fetchPlayers();
  renderFormation(formationSelect.value);
});