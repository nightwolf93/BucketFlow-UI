import { fetchBucketData } from './api';

export const fetchWidgetData = async (config) => {
  try {
    const { bucket, timeRange, aggregation } = config;
    
    // Récupérer toutes les données du bucket
    const data = await fetchBucketData(bucket, {});

    // Calculer la plage de temps
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now - 3600000);
        break;
      case '6h':
        startTime = new Date(now - 21600000);
        break;
      case '12h':
        startTime = new Date(now - 43200000);
        break;
      case '24h':
        startTime = new Date(now - 86400000);
        break;
      case '7d':
        startTime = new Date(now - 604800000);
        break;
      case '30d':
        startTime = new Date(now - 2592000000);
        break;
      default:
        startTime = new Date(now - 3600000);
    }

    console.log('Période de filtrage:', {
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    });

    // Filtrer les données par plage de temps
    const filteredData = data.filter(item => {
      // Convertir le timestamp en millisecondes (multiplier par 1000)
      const itemTimestamp = parseInt(item.timestamp) * 1000;
      const itemDate = new Date(itemTimestamp);

      return itemDate >= startTime && itemDate <= now;
    });

    console.log('Données filtrées:', filteredData);

    // Grouper les données par intervalle de temps (5 minutes)
    const interval = 5 * 60 * 1000; // 5 minutes en millisecondes
    const groupedData = {};

    filteredData.forEach(item => {
      const timestamp = new Date(parseInt(item.timestamp) * 1000);
      const timeKey = new Date(Math.floor(timestamp.getTime() / interval) * interval);
      const timeString = timeKey.toISOString();

      if (!groupedData[timeString]) {
        groupedData[timeString] = {
          timestamp: timeKey,
          value: 0
        };
      }

      groupedData[timeString].value += 1;
    });

    const result = Object.values(groupedData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({
        timestamp: item.timestamp.toLocaleTimeString(),
        value: item.value
      }));

    return result;

  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
}; 