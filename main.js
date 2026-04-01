const API = "http://localhost:3000/players";
const playersDiv = document.getElementById("players");

function loadPlayers() {
  fetch(API)
    .then(res => res.json())
    .then(data => {
      const players = data.players;

      players.forEach(p => {
        const div = document.createElement("div");
        div.innerHTML = `
          <h3>${p.name}</h3>
          <img src="${p.picture}" width="100" alt="${p.name}">
          <p>${p.nationality}</p>
          <p>${p.position}</p>
          <p>${p.league}</p>
          <p>${p.team}</p>
          <p>OVR: ${p.overall}</p>
          <hr>
        `;
        playersDiv.appendChild(div);
      });
    })
    .catch(error => {
      console.error("Error fetching players:", error);
    });
}

loadPlayers();
