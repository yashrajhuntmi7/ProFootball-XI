const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const PLAYER_CSV_PATH =
  process.env.PLAYER_CSV_PATH || "/Users/yashrajpanghal/Downloads/EAFC26-Men.csv";

let playerCache = [];
let cacheLoadedAt = null;

const imageOverrides = {
  teams: readJsonFile(path.join(__dirname, "data", "team-images.json")),
  nations: readJsonFile(path.join(__dirname, "data", "nation-images.json")),
};

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function createSvgDataUri(label, backgroundColor) {
  const safeLabel = String(label || "?")
    .slice(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="36" fill="${backgroundColor}"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">
        ${safeLabel || "?"}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const header = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);

    return header.reduce((record, columnName, index) => {
      record[columnName] = cells[index] ?? "";
      return record;
    }, {});
  });
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePlayer(record) {
  const nationName = record.Nation || "Unknown";
  const teamName = record.Team || "Unknown";

  return {
    id: String(record.ID || ""),
    name: record.Name || "Unknown Player",
    picture: record.card || "",
    league: record.League || "Unknown League",
    team: teamName,
    teamImage:
      imageOverrides.teams[teamName] || createSvgDataUri(getInitials(teamName), "#0f6b36"),
    position: record.Position || "N/A",
    nationality: nationName,
    nationImage:
      imageOverrides.nations[nationName] || createSvgDataUri(getInitials(nationName), "#1f4e8c"),
    age: toNumber(record.Age),
    preferredFoot: record["Preferred foot"] || "Unknown",
    overall: toNumber(record.OVR),
    pace: toNumber(record.PAC),
    shooting: toNumber(record.SHO),
    passing: toNumber(record.PAS),
    dribbling: toNumber(record.DRI),
    defending: toNumber(record.DEF),
    physical: toNumber(record.PHY),
  };
}

function loadPlayers() {
  const csvContent = fs.readFileSync(PLAYER_CSV_PATH, "utf8");
  const rawRecords = parseCsv(csvContent);

  playerCache = rawRecords
    .filter((record) => record.ID && record.Name)
    .map(normalizePlayer);

  cacheLoadedAt = new Date().toISOString();
}

function ensurePlayersLoaded() {
  if (playerCache.length === 0) {
    loadPlayers();
  }
}

function sortPlayers(players, sortBy, order) {
  const direction = order === "asc" ? 1 : -1;
  const sortableFields = new Set([
    "name",
    "team",
    "league",
    "nationality",
    "position",
    "overall",
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
    "age",
  ]);

  if (!sortableFields.has(sortBy)) {
    return players;
  }

  return [...players].sort((first, second) => {
    const left = first[sortBy];
    const right = second[sortBy];

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }

    return String(left).localeCompare(String(right)) * direction;
  });
}

function filterPlayers(players, searchParams) {
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const team = searchParams.get("team");
  const league = searchParams.get("league");
  const position = searchParams.get("position");
  const nationality = searchParams.get("nationality");
  const preferredFoot = searchParams.get("preferredFoot");

  return players
    .filter((player) => (search ? player.name.toLowerCase().includes(search) : true))
    .filter((player) => (team ? player.team === team : true))
    .filter((player) => (league ? player.league === league : true))
    .filter((player) => (position ? player.position === position : true))
    .filter((player) => (nationality ? player.nationality === nationality : true))
    .filter((player) => (preferredFoot ? player.preferredFoot === preferredFoot : true));
}

function getMeta(players, fieldName) {
  return [...new Set(players.map((player) => player[fieldName]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  try {
    ensurePlayersLoaded();
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    if (request.method === "GET" && pathname === "/health") {
      sendJson(response, 200, {
        success: true,
        message: "Football API is running",
        count: playerCache.length,
        csvPath: PLAYER_CSV_PATH,
        cacheLoadedAt,
      });
      return;
    }

    if (request.method === "GET" && pathname === "/players") {
      const filteredPlayers = filterPlayers(playerCache, requestUrl.searchParams);
      const sortBy = requestUrl.searchParams.get("sortBy") || "overall";
      const order = requestUrl.searchParams.get("order") || "desc";
      const page = Math.max(Number(requestUrl.searchParams.get("page") || 1), 1);
      const requestedLimit = requestUrl.searchParams.get("limit");
      const limit = requestedLimit ? Math.max(Number(requestedLimit), 1) : filteredPlayers.length;
      const sortedPlayers = sortPlayers(filteredPlayers, sortBy, order);
      const startIndex = (page - 1) * limit;
      const paginatedPlayers = sortedPlayers.slice(startIndex, startIndex + limit);

      sendJson(response, 200, {
        success: true,
        count: filteredPlayers.length,
        page,
        limit,
        totalPages: Math.max(Math.ceil(filteredPlayers.length / limit), 1),
        players: paginatedPlayers,
      });
      return;
    }

    if (request.method === "GET" && pathname.startsWith("/players/")) {
      const playerId = pathname.split("/")[2];
      const player = playerCache.find((item) => item.id === playerId);

      if (!player) {
        sendJson(response, 404, {
          success: false,
          message: `Player with id ${playerId} was not found.`,
        });
        return;
      }

      sendJson(response, 200, {
        success: true,
        player,
      });
      return;
    }

    if (request.method === "GET" && pathname === "/meta") {
      sendJson(response, 200, {
        success: true,
        leagues: getMeta(playerCache, "league"),
        teams: getMeta(playerCache, "team"),
        positions: getMeta(playerCache, "position"),
        nationalities: getMeta(playerCache, "nationality"),
      });
      return;
    }

    sendJson(response, 404, {
      success: false,
      message: "Route not found",
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      message: error.message,
    });
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  try {
    ensurePlayersLoaded();
    console.log(`Football API running on http://localhost:${PORT}`);
    console.log(`Loaded ${playerCache.length} players from ${PLAYER_CSV_PATH}`);
  } catch (error) {
    console.error("Server started, but player data failed to load.");
    console.error(error.message);
  }
});
