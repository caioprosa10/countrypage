// Footer year + last modified
const yearSpan = document.querySelector('#year');
const lastModSpan = document.querySelector('#last-modified');
yearSpan.textContent = new Date().getFullYear();
lastModSpan.textContent = document.lastModified;

/* =========================
   CONFIGURAÇÃO
   ========================= */
// Posição padrão: Rio de Janeiro (Centro)
const DEFAULT_COORDS = { lat: -22.9068, lon: -43.1729 };
// Se quiser usar a localização do usuário, mude para true
const USE_GEOLOCATION = false;

/* =========================
   UTILITÁRIOS DE DOM
   ========================= */
const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
const setAll = (baseId, value) => {
  setText(baseId, value);
  setText(`${baseId}-sm`, value);
};

/* =========================
   WIND CHILL (MÉTRICO)
   ========================= */
// Uma linha, arredondado 1 casa: T em °C, V em km/h
const calculateWindChill = (tC, vKmh) =>
  Math.round((13.12 + 0.6215*tC - 11.37*Math.pow(vKmh, 0.16) + 0.3965*tC*Math.pow(vKmh, 0.16)) * 10) / 10;

const meetsWindChillConditions = (tC, vKmh) => tC <= 10 && vKmh > 4.8;

/* =========================
   OPEN-METEO (tempo real)
   ========================= */
// Mapeia weather_code -> descrição simples
const WMO = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
  85: "Snow showers", 86: "Snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 97: "Thunderstorm w/ hail"
};

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const data = await res.json();
  const t = data?.current?.temperature_2m;
  const v = data?.current?.wind_speed_10m;
  const code = data?.current?.weather_code;
  return { t, v, desc: WMO[code] ?? "—" };
}

/* =========================
   INICIALIZAÇÃO
   ========================= */
async function initWeather() {
  try {
    // Coordenadas: geolocalização (opcional) ou padrão
    let coords = DEFAULT_COORDS;

    if (USE_GEOLOCATION && "geolocation" in navigator) {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
      );
      coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    }

    const { t, v, desc } = await fetchWeather(coords.lat, coords.lon);

    // Preenche temperatura, vento, condição (métrico)
    setAll("temp", t.toFixed(0));
    setAll("wind", v.toFixed(0));
    setAll("cond", desc);

    // Calcula/exibe wind chill apenas se atender às condições
    const windChillValue = meetsWindChillConditions(t, v) ? `${calculateWindChill(t, v)} °C` : "N/A";
    setAll("windchill", windChillValue);
  } catch (err) {
    // Em caso de erro, mantém os valores anteriores e mostra N/A no chill
    console.error("Weather error:", err);
    setAll("cond", "N/A");
    setAll("windchill", "N/A");
  }
}

initWeather();
