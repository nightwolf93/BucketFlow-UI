import axios from 'axios';

let api = null;

export const setApiConfig = async (apiUrl, apiKey) => {
  try {
    // Créer une nouvelle instance axios avec la configuration
    const newApi = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    // Test de la connexion
    await newApi.get('/buckets');

    // Si le test réussit, on sauvegarde la configuration
    api = newApi;
    localStorage.setItem('apiConfig', JSON.stringify({ apiUrl, apiKey }));
  } catch (error) {
    throw new Error('Impossible de se connecter à l\'API avec ces identifiants');
  }
};

// Fonction pour initialiser l'API avec les données stockées
export const initApi = () => {
  const storedConfig = localStorage.getItem('apiConfig');
  if (storedConfig) {
    const { apiUrl, apiKey } = JSON.parse(storedConfig);
    api = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });
  }
  return api !== null;
};

// Fonction pour vérifier si l'API est configurée
export const isApiConfigured = () => {
  return api !== null;
};

// Réinitialiser la configuration
export const resetApiConfig = () => {
  api = null;
  localStorage.removeItem('apiConfig');
};

// Gestion globale des erreurs
const handleApiError = (error, customMessage) => {
  if (!api) {
    throw new Error('API non configurée');
  }
  const message = error.response?.data?.error || customMessage;
  throw new Error(message);
};

export const fetchBuckets = async () => {
  try {
    const response = await api.get('/buckets');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des buckets');
  }
};

export const createBucket = async (name) => {
  try {
    const response = await api.post('/buckets', { name });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de la création du bucket');
  }
};

export const fetchBucketData = async (bucketId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Ajout des filtres d'égalité
    Object.entries(filters.equality || {}).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    // Ajout des filtres gte
    Object.entries(filters.gte || {}).forEach(([key, value]) => {
      queryParams.append(`${key}[gte]`, value);
    });

    // Ajout des filtres in
    Object.entries(filters.in || {}).forEach(([key, value]) => {
      queryParams.append(`${key}[in]`, value.join(','));
    });

    // Ajout des filtres de dates
    Object.entries(filters.dateRanges || {}).forEach(([key, value]) => {
      queryParams.append(`${key}[between]`, `${value.start},${value.end}`);
    });

    const response = await api.get(`/buckets/${bucketId}/data?${queryParams}`);
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des données du bucket');
  }
};

export const deleteBucket = async (bucketId) => {
  try {
    const response = await api.delete(`/buckets/${bucketId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de la suppression du bucket');
  }
};

export const addBucketData = async (bucketId, data) => {
  try {
    const response = await api.post(`/buckets/${bucketId}/data`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de l\'ajout des données');
  }
};

export const deleteBucketData = async (bucketId, filters) => {
  try {
    const response = await api.delete(`/buckets/${bucketId}/data`, { data: filters });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Erreur lors de la suppression des données');
  }
}; 