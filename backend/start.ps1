$env:PORT = if ($env:PORT) { $env:PORT } else { "3001" }
$env:WS_PORT = if ($env:WS_PORT) { $env:WS_PORT } else { "3002" }
$env:TIKTOK_UNIQUE_ID = if ($env:TIKTOK_UNIQUE_ID) { $env:TIKTOK_UNIQUE_ID } else { "shentyandrianirina" }
npm start

