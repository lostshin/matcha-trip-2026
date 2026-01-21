/**
 * 天氣 API 模組 - 抹茶山生日旅遊 PWA
 * 資料來源：中央氣象署 Open Data
 */

const WEATHER_CONFIG = {
  // API 金鑰（Open Data 免費使用）
  API_KEY: 'CWA-2113E8B4-1388-4373-8F45-7A13D2D5A545',

  // 資料集 ID
  DATASETS: {
    JIAOXI: 'F-D0047-003',      // 宜蘭縣鄉鎮天氣（礁溪）
    MOUNTAIN: 'F-B0053-031'     // 育樂區天氣（三角崙山）
  },

  // 目標地點
  LOCATIONS: {
    JIAOXI: '礁溪鄉',
    MOUNTAIN: '三角崙山'
  },

  // 旅遊日期（用於礁溪標注）
  TRIP_DATES: ['2026-01-24', '2026-01-25', '2026-01-26'],

  // 登山日期（用於三角崙山/抹茶山標注）
  HIKING_DATES: ['2026-01-25'],

  // 快取時間（30 分鐘）
  CACHE_DURATION: 30 * 60 * 1000
};

// 天氣代碼對應圖示
const WEATHER_ICONS = {
  '01': '☀️', // 晴天
  '02': '🌤️', // 晴時多雲
  '03': '⛅', // 多雲時晴
  '04': '🌥️', // 多雲
  '05': '☁️', // 陰天
  '06': '☁️', // 陰時多雲
  '07': '☁️', // 多雲時陰
  '08': '🌧️', // 多雲短暫雨
  '09': '🌧️', // 多雲時陰短暫雨
  '10': '🌧️', // 陰時多雲短暫雨
  '11': '🌧️', // 陰短暫雨
  '12': '🌧️', // 多雲短暫陣雨
  '13': '🌧️', // 多雲時陰短暫陣雨
  '14': '🌧️', // 陰時多雲短暫陣雨
  '15': '🌧️', // 陰短暫陣雨
  '16': '⛈️', // 多雲雷陣雨
  '17': '⛈️', // 多雲時陰雷陣雨
  '18': '⛈️', // 陰時多雲雷陣雨
  '19': '⛈️', // 陰雷陣雨
  '20': '🌨️', // 多雲短暫雨或雪
  '21': '🌨️', // 多雲時陰短暫雨或雪
  '22': '🌨️', // 陰時多雲短暫雨或雪
  '23': '🌨️', // 陰短暫雨或雪
  '24': '❄️', // 多雲有雪
  '25': '❄️', // 多雲時陰有雪
  '26': '❄️', // 陰時多雲有雪
  '27': '❄️', // 陰有雪
  '28': '🌫️', // 有霧
  '29': '🌫️', // 多雲有霧
  '30': '🌫️', // 陰有霧
  '31': '🌙', // 晴（夜）
  '32': '🌙', // 晴時多雲（夜）
  '33': '☁️', // 多雲時晴（夜）
  '34': '☁️', // 多雲（夜）
};

/**
 * 從 API 取得天氣資料
 */
async function fetchWeatherFromAPI(datasetId) {
  const url = `https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/${datasetId}?Authorization=${WEATHER_CONFIG.API_KEY}&downloadType=WEB&format=JSON`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API 回應錯誤: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('天氣 API 請求失敗:', error);
    throw error;
  }
}

/**
 * 解析礁溪鄉天氣資料（F-D0047-003）
 */
function parseJiaoxiWeather(data) {
  const locations = data.cwaopendata.Dataset.Locations.Location;
  const jiaoxi = locations.find(loc => loc.LocationName === WEATHER_CONFIG.LOCATIONS.JIAOXI);

  if (!jiaoxi) {
    throw new Error('找不到礁溪鄉資料');
  }

  return parseWeatherElements(jiaoxi.WeatherElement);
}

/**
 * 解析三角崙山天氣資料（F-B0053-031）
 */
function parseMountainWeather(data) {
  const locations = data.cwaopendata.Dataset.Locations.Location;
  const mountain = locations.find(loc => loc.LocationName === WEATHER_CONFIG.LOCATIONS.MOUNTAIN);

  if (!mountain) {
    throw new Error('找不到三角崙山資料');
  }

  return parseWeatherElements(mountain.WeatherElement);
}

/**
 * 解析天氣元素，整理成每日預報
 */
function parseWeatherElements(elements) {
  const dailyData = {};

  elements.forEach(element => {
    element.Time.forEach(timeSlot => {
      const startDate = timeSlot.StartTime.split('T')[0];

      if (!dailyData[startDate]) {
        dailyData[startDate] = {
          date: startDate,
          isTripDay: WEATHER_CONFIG.TRIP_DATES.includes(startDate),
          isHikingDay: WEATHER_CONFIG.HIKING_DATES.includes(startDate)
        };
      }

      const value = timeSlot.ElementValue;

      switch (element.ElementName) {
        case '最高溫度':
          dailyData[startDate].maxTemp = parseInt(value.MaxTemperature);
          break;
        case '最低溫度':
          dailyData[startDate].minTemp = parseInt(value.MinTemperature);
          break;
        case '天氣現象':
          if (!dailyData[startDate].weather) {
            dailyData[startDate].weather = value.Weather;
            dailyData[startDate].weatherCode = value.WeatherCode;
          }
          break;
        case '12小時降雨機率':
        case '24小時降雨機率':
          const prob = parseInt(value.ProbabilityOfPrecipitation);
          if (!isNaN(prob)) {
            dailyData[startDate].rainProb = Math.max(
              dailyData[startDate].rainProb || 0,
              prob
            );
          }
          break;
      }
    });
  });

  // 轉成陣列並排序，取最近 7 天
  return Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map(day => ({
      ...day,
      icon: WEATHER_ICONS[day.weatherCode] || '🌡️',
      dateDisplay: formatDate(day.date)
    }));
}

/**
 * 格式化日期顯示
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}/${day} (${weekday})`;
}

/**
 * 取得礁溪天氣（含快取）
 */
async function getJiaoxiWeather() {
  const cacheKey = 'weather_jiaoxi';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const data = await fetchWeatherFromAPI(WEATHER_CONFIG.DATASETS.JIAOXI);
  const weather = parseJiaoxiWeather(data);
  saveToCache(cacheKey, weather);
  return weather;
}

/**
 * 取得三角崙山天氣（含快取）
 */
async function getMountainWeather() {
  const cacheKey = 'weather_mountain';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const data = await fetchWeatherFromAPI(WEATHER_CONFIG.DATASETS.MOUNTAIN);
  const weather = parseMountainWeather(data);
  saveToCache(cacheKey, weather);
  return weather;
}

/**
 * 從 localStorage 取得快取
 */
function getFromCache(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > WEATHER_CONFIG.CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * 儲存到 localStorage
 */
function saveToCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('無法快取天氣資料:', e);
  }
}

/**
 * 取得所有天氣資料
 */
async function getAllWeather() {
  try {
    const [jiaoxi, mountain] = await Promise.all([
      getJiaoxiWeather(),
      getMountainWeather()
    ]);

    return {
      jiaoxi,
      mountain,
      lastUpdate: new Date().toLocaleString('zh-TW'),
      success: true
    };
  } catch (error) {
    console.error('取得天氣失敗:', error);
    return {
      jiaoxi: null,
      mountain: null,
      error: error.message,
      success: false
    };
  }
}
