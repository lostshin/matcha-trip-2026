/**
 * 天氣 API 模組 - 抹茶山生日旅遊 PWA
 * 資料來源：中央氣象署 Open Data
 *
 * 功能：
 * - 礁溪鄉 + 三角崙山天氣預報
 * - 3 天精準預報（逐小時資料）
 * - 智慧模式：自動選擇最佳 API
 * - 風險評估系統
 */

const WEATHER_CONFIG = {
  // API 金鑰（Open Data 免費使用）
  API_KEY: 'CWA-2113E8B4-1388-4373-8F45-7A13D2D5A545',

  // 資料集 ID - 一週預報
  DATASETS: {
    JIAOXI: 'F-D0047-003',      // 宜蘭縣鄉鎮天氣（礁溪）
    MOUNTAIN: 'F-B0053-031'     // 育樂區天氣（三角崙山）
  },

  // 資料集 ID - 3 天精準預報（每小時資料）
  DATASETS_3DAY: {
    JIAOXI: 'F-D0047-001',      // 宜蘭縣鄉鎮 3 天精準預報
    RECREATION: 'F-B0053-035'   // 育樂區（登山）3 天精準預報
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

// ===== 風險評估系統 =====

/**
 * 評估天氣風險等級
 * @param {Object} day - 單日天氣資料
 * @param {boolean} isMountain - 是否為山區（使用更嚴格的標準）
 * @returns {Object} { level: 'low'|'medium'|'high', messages: string[] }
 */
function assessWeatherRisk(day, isMountain = false) {
  const risks = [];

  // 降雨機率評估
  if (day.rainProb !== undefined && day.rainProb !== null) {
    if (day.rainProb >= 70) {
      risks.push(`降雨機率高達 ${day.rainProb}%，建議攜帶雨具或考慮改期`);
    } else if (day.rainProb >= 40) {
      risks.push(`降雨機率 ${day.rainProb}%，建議攜帶雨具`);
    }
  }

  // 氣溫評估（山區標準更嚴格）
  const coldThresholdHigh = isMountain ? 5 : 10;  // 高風險閾值
  const coldThresholdLow = isMountain ? 10 : 15;  // 中風險閾值

  if (day.minTemp !== undefined && day.minTemp !== null) {
    if (day.minTemp <= coldThresholdHigh) {
      risks.push(`低溫 ${day.minTemp}°C，注意保暖與失溫風險`);
    } else if (day.minTemp <= coldThresholdLow) {
      risks.push(`氣溫偏低 ${day.minTemp}°C，建議攜帶保暖衣物`);
    }
  }

  // 高溫評估
  if (day.maxTemp !== undefined && day.maxTemp >= 33) {
    risks.push(`高溫 ${day.maxTemp}°C，注意防曬與中暑風險`);
  }

  // 天氣現象評估
  if (day.weather) {
    if (day.weather.includes('雷') || day.weather.includes('暴')) {
      risks.push('有雷雨或暴風預報，登山行程應延期');
    }
    if (day.weather.includes('雪') && isMountain) {
      risks.push('有降雪預報，需具備雪地裝備與經驗');
    }
    if (day.weather.includes('霧')) {
      risks.push('有霧，能見度可能受限');
    }
  }

  // 濕度評估（若有資料）
  if (day.humidity !== undefined && day.humidity >= 90) {
    risks.push(`濕度過高 ${day.humidity}%，戶外活動請留意`);
  }

  // 判斷整體風險等級
  const highRiskKeywords = ['改期', '延期', '失溫', '雪地'];
  const hasHighRisk = risks.some(r =>
    highRiskKeywords.some(kw => r.includes(kw))
  );

  let level;
  if (hasHighRisk) {
    level = 'high';
  } else if (risks.length > 0) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, messages: risks };
}

// ===== 智慧模式 =====

/**
 * 判斷是否應該使用 3 天精準預報
 * 如果最早的旅遊日期在 3 天內，使用精準預報
 */
function shouldUse3DayForecast() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripDates = WEATHER_CONFIG.TRIP_DATES.map(d => new Date(d));
  const earliestDate = new Date(Math.min(...tripDates));
  earliestDate.setHours(0, 0, 0, 0);

  const daysUntilTrip = Math.ceil((earliestDate - today) / (1000 * 60 * 60 * 24));

  // 如果行程在 0-3 天內，使用精準預報
  return daysUntilTrip >= 0 && daysUntilTrip <= 3;
}

/**
 * 取得距離行程還有幾天
 */
function getDaysUntilTrip() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripDates = WEATHER_CONFIG.TRIP_DATES.map(d => new Date(d));
  const earliestDate = new Date(Math.min(...tripDates));
  earliestDate.setHours(0, 0, 0, 0);

  return Math.ceil((earliestDate - today) / (1000 * 60 * 60 * 24));
}

// ===== API 請求 =====

/**
 * 從 API 取得天氣資料（標準 fileapi）
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

// ===== 資料解析 =====

/**
 * 解析礁溪鄉天氣資料（F-D0047-003 或 F-D0047-001）
 */
function parseJiaoxiWeather(data) {
  const locations = data.cwaopendata.Dataset.Locations.Location;
  const jiaoxi = locations.find(loc => loc.LocationName === WEATHER_CONFIG.LOCATIONS.JIAOXI);

  if (!jiaoxi) {
    throw new Error('找不到礁溪鄉資料');
  }

  return parseWeatherElements(jiaoxi.WeatherElement, false);
}

/**
 * 解析三角崙山天氣資料（F-B0053-031 或 F-B0053-035）
 * 同時提取登山日的每小時詳細資料
 */
function parseMountainWeather(data) {
  const locations = data.cwaopendata.Dataset.Locations.Location;
  const mountain = locations.find(loc => loc.LocationName === WEATHER_CONFIG.LOCATIONS.MOUNTAIN);

  if (!mountain) {
    throw new Error('找不到三角崙山資料');
  }

  // 解析每日預報
  const dailyForecast = parseWeatherElements(mountain.WeatherElement, true);

  // 解析登山日每小時詳細資料（僅在使用 3 天精準預報時）
  const hikingDate = WEATHER_CONFIG.HIKING_DATES[0];
  const hourlyData = parseHourlyWeatherForDate(mountain.WeatherElement, hikingDate);

  // 將每小時資料附加到對應的登山日
  return dailyForecast.map(day => {
    if (day.isHikingDay && hourlyData.length > 0) {
      return { ...day, hourlyForecast: hourlyData };
    }
    return day;
  });
}

/**
 * 解析特定日期的每小時天氣資料
 * @param {Array} elements - 天氣元素陣列
 * @param {string} targetDate - 目標日期 (YYYY-MM-DD)
 * @returns {Array} 每小時天氣資料
 */
function parseHourlyWeatherForDate(elements, targetDate) {
  const hourlyData = {};

  elements.forEach(element => {
    if (!element.Time) return;

    element.Time.forEach(timeSlot => {
      const timeStr = timeSlot.StartTime || timeSlot.DataTime || '';
      if (!timeStr) return;

      const [datePart, timePart] = timeStr.split('T');
      if (datePart !== targetDate) return;

      // 取得小時 (格式: HH:MM:SS)
      const hour = timePart ? parseInt(timePart.split(':')[0]) : null;
      if (hour === null) return;

      // 只取登山時段 (05:00 - 18:00)
      if (hour < 5 || hour > 18) return;

      const hourKey = hour.toString().padStart(2, '0');
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { hour, time: `${hourKey}:00` };
      }

      const value = timeSlot.ElementValue;
      if (!value) return;

      switch (element.ElementName) {
        case '溫度':
          const temp = parseInt(value.Temperature);
          if (!isNaN(temp)) {
            hourlyData[hourKey].temp = temp;
          }
          break;
        case '天氣現象':
          if (!hourlyData[hourKey].weather) {
            hourlyData[hourKey].weather = value.Weather;
            hourlyData[hourKey].weatherCode = value.WeatherCode;
            hourlyData[hourKey].icon = WEATHER_ICONS[value.WeatherCode] || '🌡️';
          }
          break;
        case '3小時降雨機率':
        case '降雨機率':
          const prob = parseInt(value.ProbabilityOfPrecipitation);
          if (!isNaN(prob)) {
            hourlyData[hourKey].rainProb = prob;
          }
          break;
        case '相對濕度':
          const humidity = parseInt(value.RelativeHumidity);
          if (!isNaN(humidity)) {
            hourlyData[hourKey].humidity = humidity;
          }
          break;
        case '風速':
          if (value.WindSpeed) {
            hourlyData[hourKey].windSpeed = value.WindSpeed;
          }
          break;
      }
    });
  });

  // 轉成陣列並排序
  return Object.values(hourlyData)
    .filter(h => h.temp !== undefined) // 只保留有溫度資料的時段
    .sort((a, b) => a.hour - b.hour);
}

/**
 * 解析天氣元素，整理成每日預報
 * @param {Array} elements - 天氣元素陣列
 * @param {boolean} isMountain - 是否為山區
 */
function parseWeatherElements(elements, isMountain = false) {
  const dailyData = {};

  elements.forEach(element => {
    element.Time.forEach(timeSlot => {
      // 支援兩種時間格式
      const timeStr = timeSlot.StartTime || timeSlot.DataTime || '';
      if (!timeStr) return;

      const startDate = timeStr.split('T')[0];

      if (!dailyData[startDate]) {
        dailyData[startDate] = {
          date: startDate,
          isTripDay: WEATHER_CONFIG.TRIP_DATES.includes(startDate),
          isHikingDay: WEATHER_CONFIG.HIKING_DATES.includes(startDate)
        };
      }

      const value = timeSlot.ElementValue;
      if (!value) return;

      switch (element.ElementName) {
        case '最高溫度':
          const maxT = parseInt(value.MaxTemperature);
          if (!isNaN(maxT)) {
            dailyData[startDate].maxTemp = Math.max(dailyData[startDate].maxTemp || -999, maxT);
          }
          break;
        case '最低溫度':
          const minT = parseInt(value.MinTemperature);
          if (!isNaN(minT)) {
            dailyData[startDate].minTemp =
              dailyData[startDate].minTemp !== undefined
                ? Math.min(dailyData[startDate].minTemp, minT)
                : minT;
          }
          break;
        case '溫度':
          // 3 天精準預報使用 Temperature
          const temp = parseInt(value.Temperature);
          if (!isNaN(temp)) {
            // 收集所有溫度來計算最高最低
            if (!dailyData[startDate]._temps) {
              dailyData[startDate]._temps = [];
            }
            dailyData[startDate]._temps.push(temp);
          }
          break;
        case '天氣現象':
          if (!dailyData[startDate].weather) {
            dailyData[startDate].weather = value.Weather;
            dailyData[startDate].weatherCode = value.WeatherCode;
          }
          break;
        case '12小時降雨機率':
        case '24小時降雨機率':
        case '3小時降雨機率':
        case '降雨機率':
          const prob = parseInt(value.ProbabilityOfPrecipitation);
          if (!isNaN(prob)) {
            dailyData[startDate].rainProb = Math.max(
              dailyData[startDate].rainProb || 0,
              prob
            );
          }
          break;
        case '相對濕度':
        case '平均相對濕度':
          const humidity = parseInt(value.RelativeHumidity);
          if (!isNaN(humidity)) {
            // 取第一個有效值
            if (dailyData[startDate].humidity === undefined) {
              dailyData[startDate].humidity = humidity;
            }
          }
          break;
        case '風速':
          if (!dailyData[startDate].windSpeed) {
            dailyData[startDate].windSpeed = value.WindSpeed;
          }
          break;
        case '風向':
          if (!dailyData[startDate].windDirection) {
            dailyData[startDate].windDirection = value.WindDirection;
          }
          break;
        case '紫外線指數':
          if (!dailyData[startDate].uvIndex) {
            dailyData[startDate].uvIndex = value.UVIndex;
          }
          break;
      }
    });
  });

  // 後處理：從 _temps 計算最高最低溫（3 天精準預報用）
  Object.values(dailyData).forEach(day => {
    if (day._temps && day._temps.length > 0) {
      if (day.maxTemp === undefined) {
        day.maxTemp = Math.max(...day._temps);
      }
      if (day.minTemp === undefined) {
        day.minTemp = Math.min(...day._temps);
      }
      delete day._temps;
    }
  });

  // 轉成陣列並排序，取最近 7 天
  return Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map(day => {
      // 加入風險評估
      const risk = assessWeatherRisk(day, isMountain);

      return {
        ...day,
        icon: WEATHER_ICONS[day.weatherCode] || '🌡️',
        dateDisplay: formatDate(day.date),
        riskLevel: risk.level,
        riskMessages: risk.messages
      };
    });
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

// ===== 快取機制 =====

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

// ===== 主要查詢函式 =====

/**
 * 取得礁溪天氣（含快取 + 智慧模式）
 */
async function getJiaoxiWeather() {
  const use3Day = shouldUse3DayForecast();
  const datasetId = use3Day
    ? WEATHER_CONFIG.DATASETS_3DAY.JIAOXI
    : WEATHER_CONFIG.DATASETS.JIAOXI;

  const cacheKey = `weather_jiaoxi_${use3Day ? '3day' : 'weekly'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { data: cached, is3Day: use3Day };

  const data = await fetchWeatherFromAPI(datasetId);
  const weather = parseJiaoxiWeather(data);
  saveToCache(cacheKey, weather);
  return { data: weather, is3Day: use3Day };
}

/**
 * 取得三角崙山天氣（含快取 + 智慧模式）
 */
async function getMountainWeather() {
  const use3Day = shouldUse3DayForecast();
  const datasetId = use3Day
    ? WEATHER_CONFIG.DATASETS_3DAY.RECREATION
    : WEATHER_CONFIG.DATASETS.MOUNTAIN;

  const cacheKey = `weather_mountain_${use3Day ? '3day' : 'weekly'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { data: cached, is3Day: use3Day };

  const data = await fetchWeatherFromAPI(datasetId);
  const weather = parseMountainWeather(data);
  saveToCache(cacheKey, weather);
  return { data: weather, is3Day: use3Day };
}

/**
 * 取得所有天氣資料
 */
async function getAllWeather() {
  try {
    const [jiaoxiResult, mountainResult] = await Promise.all([
      getJiaoxiWeather(),
      getMountainWeather()
    ]);

    const daysUntil = getDaysUntilTrip();
    const use3Day = shouldUse3DayForecast();

    return {
      jiaoxi: jiaoxiResult.data,
      mountain: mountainResult.data,
      lastUpdate: new Date().toLocaleString('zh-TW'),
      success: true,
      // 新增：智慧模式資訊
      smartMode: {
        enabled: true,
        using3Day: use3Day,
        daysUntilTrip: daysUntil,
        message: use3Day
          ? `距離行程 ${daysUntil} 天，使用精準預報`
          : `距離行程 ${daysUntil} 天，使用一週預報`
      }
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

// ===== 工具函式（供外部使用）=====

/**
 * 取得旅遊日的天氣風險摘要
 */
function getTripDayRiskSummary(weatherData) {
  if (!weatherData) return null;

  const tripDays = weatherData.filter(day => day.isTripDay || day.isHikingDay);
  if (tripDays.length === 0) return null;

  const highRiskDays = tripDays.filter(d => d.riskLevel === 'high');
  const mediumRiskDays = tripDays.filter(d => d.riskLevel === 'medium');

  if (highRiskDays.length > 0) {
    return {
      level: 'high',
      summary: `⚠️ ${highRiskDays.length} 天有高風險`,
      days: highRiskDays
    };
  } else if (mediumRiskDays.length > 0) {
    return {
      level: 'medium',
      summary: `⚡ ${mediumRiskDays.length} 天需注意`,
      days: mediumRiskDays
    };
  } else {
    return {
      level: 'low',
      summary: '✅ 天氣狀況良好',
      days: tripDays
    };
  }
}
