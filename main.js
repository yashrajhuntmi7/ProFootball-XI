let pitch = document.getElementById("pitch");
let formationSelect = document.getElementById("formation");
let modal = document.getElementById("playerModal");
let playerList = document.getElementById("playerList");
let searchInput = document.getElementById("search");
let sortSelect = document.getElementById("sort");
let filterSelect = document.getElementById("filter");

let currentSlot = null;
let playersData = [];
let selectedPlayers = [];

let formations = {
  "4-3-3": [[50,90],[20,70],[40,70],[60,70],[80,70],[30,50],[50,50],[70,50],[20,25],[50,20],[80,25]], "4-4-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[20,50],[40,50],[60,50],[80,50],[35,25],[65,25]], "3-5-2": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[50,40],[35,20],[65,20]], "5-3-2": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[30,50],[50,50],[70,50],[35,25],[65,25]], "4-2-3-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[35,55],[65,55],[20,35],[50,35],[80,35],[50,20]], "4-1-2-1-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[50,60],[30,45],[70,45],[50,35],[35,20],[65,20]], "3-4-3": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[20,25],[50,20],[80,25]], "5-4-1": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[20,50],[40,50],[60,50],[80,50],[50,20]], "4-5-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[10,50],[30,50],[50,50],[70,50],[90,50],[50,20]], "3-4-2-1": [[50,90],[30,70],[50,70],[70,70],[20,50],[40,50],[60,50],[80,50],[35,30],[65,30],[50,20]], "4-3-2-1": [[50,90],[20,70],[40,70],[60,70],[80,70],[30,50],[50,50],[70,50],[40,30],[60,30],[50,20]], "5-2-3": [[50,90],[10,70],[30,70],[50,70],[70,70],[90,70],[40,50],[60,50],[20,25],[50,20],[80,25]], "3-3-4": [[50,90],[30,70],[50,70],[70,70],[30,50],[50,50],[70,50],[10,25],[35,20],[65,20],[90,25]], "4-2-2-2": [[50,90],[20,70],[40,70],[60,70],[80,70],[35,50],[65,50],[30,30],[70,30],[40,20],[60,20]], "3-6-1": [[50,90],[30,70],[50,70],[70,70],[10,50],[30,50],[50,50],[70,50],[90,50],[50,35],[50,20]]
};

function showError(message) {
  playerList.innerHTML = "<p style='color:red;text-align:center'>" + message + "</p>";
}

function renderFormation(name) {
  pitch.innerHTML = "";
  selectedPlayers = [];

  let formation = formations[name];
  if (!formation) return;

  for (let i = 0; i < formation.length; i++) {

    let pos = formation[i];

    let div = document.createElement("div");
    div.className = "player";
    div.style.left = pos[0] + "%";
    div.style.top = pos[1] + "%";
    div.innerHTML = "+";
    div.setAttribute("data-id", "");

    div.onclick = function() {

      if (this.getAttribute("data-id") !== "") {
        this.setAttribute("data-id", "");
        this.classList.remove("active");
        this.innerHTML = "+";
        return;
      }

      currentSlot = this;
      modal.style.display = "flex";
      renderPlayers(playersData);
    };

    pitch.appendChild(div);
  }
}

function fetchPlayers() {
  playerList.innerHTML = "Loading...";

  fetch("https://api-813k.onrender.com/cars")
    .then(function(response) {

      if (!response.ok) {
        throw "Error fetching data";
      }

      return response.json();
    })
    .then(function(data) {

      if (data.players) {
        playersData = data.players;
      } else if (data.player) {
        playersData = [data.player];
      } else {
        playersData = data;
      }

      if (playersData.length === 0) {
        showError("No players found");
        return;
      }

      renderPlayers(playersData);
    })
    .catch(function(error) {
      showError(error);
    });
}

function renderPlayers(data) {
  playerList.innerHTML = "";

  if (data.length === 0) {
    showError("No players match");
    return;
  }

  for (let i = 0; i < data.length; i++) {

    let p = data[i];

    if (selectedPlayers.includes(p.id)) continue;

    let div = document.createElement("div");
    div.className = "player-item";

    div.innerHTML =
      "<img src='" + p.picture + "'>" +
      "<span>" + p.name + " (" + p.overall + ")</span>";

    div.onclick = function(player) {
      return function() {
        currentSlot.classList.add("active");
        currentSlot.setAttribute("data-id", player.id);
        selectedPlayers.push(player.id);
        currentSlot.innerHTML = "<img src='" + player.picture + "'>";
        modal.style.display = "none";
      };
    }(p);

    playerList.appendChild(div);
  }
}

function applyFilters() {

  let data = playersData.slice();

  let search = searchInput.value.toLowerCase();
  let filter = filterSelect.value;
  let sort = sortSelect.value;

  if (search !== "") {
    let temp = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].name.toLowerCase().includes(search)) {
        temp.push(data[i]);
      }
    }
    data = temp;
  }

  if (filter !== "") {
    let temp2 = [];
    for (let i = 0; i < data.length; i++) {
      let pos = data[i].position;

      if (filter === "GK" && pos === "GK") temp2.push(data[i]);
      if (filter === "DEF" && ["CB","LB","RB"].includes(pos)) temp2.push(data[i]);
      if (filter === "MID" && ["CM","CDM","CAM"].includes(pos)) temp2.push(data[i]);
      if (filter === "ATT" && ["ST","LW","RW"].includes(pos)) temp2.push(data[i]);
    }
    data = temp2;
  }

  if (sort !== "") {
    data.sort(function(a, b) {
      return b[sort] - a[sort];
    });
  }

  renderPlayers(data);
}

searchInput.oninput = applyFilters;
filterSelect.onchange = applyFilters;
sortSelect.onchange = applyFilters;

formationSelect.onchange = function() {
  renderFormation(formationSelect.value);
};

window.onclick = function(e) {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", function() {
  fetchPlayers();
  renderFormation(formationSelect.value);
});