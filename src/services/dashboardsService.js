const STORAGE_KEY = 'dashboards';

const getDefaultDashboards = () => {
  return [];
};

export const fetchDashboards = () => {
  try {
    const dashboards = localStorage.getItem(STORAGE_KEY);
    return Promise.resolve(dashboards ? JSON.parse(dashboards) : getDefaultDashboards());
  } catch (error) {
    console.error('Erreur lors de la lecture des dashboards:', error);
    return Promise.resolve(getDefaultDashboards());
  }
};

export const fetchDashboard = (id) => {
  try {
    const dashboards = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const dashboard = dashboards.find(d => d.id === id);
    
    if (dashboard) {
      // S'assurer que les widgets ont toutes les propriétés nécessaires
      dashboard.widgets = (dashboard.widgets || []).map(widget => ({
        id: widget.id || Date.now().toString(),
        type: widget.type || '',
        title: widget.title || 'Widget sans titre',
        config: {
          bucket: widget.config?.bucket || '',
          timeField: widget.config?.timeField || 'timestamp',
          timeRange: widget.config?.timeRange || '24h',
          aggregation: widget.config?.aggregation || 'count',
          fields: widget.config?.fields || [],
          groupBy: widget.config?.groupBy || []
        },
        isConfigured: widget.isConfigured || false
      }));

      // S'assurer que buckets est un tableau
      dashboard.buckets = dashboard.buckets || [];
      if (!Array.isArray(dashboard.buckets)) {
        dashboard.buckets = Array.from(dashboard.buckets || []);
      }
    }

    return Promise.resolve(dashboard || null);
  } catch (error) {
    console.error('Erreur lors de la lecture du dashboard:', error);
    return Promise.resolve(null);
  }
};

export const saveDashboard = (dashboardData) => {
  try {
    const dashboards = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let updatedDashboards;

    // Préparation des données du dashboard
    const dashboardToSave = {
      ...dashboardData,
      widgets: dashboardData.widgets?.map(widget => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        config: widget.config,
        isConfigured: widget.isConfigured
      })) || [],
      // Convertir buckets en tableau de manière sécurisée
      buckets: dashboardData.buckets ? 
        (Array.isArray(dashboardData.buckets) ? 
          dashboardData.buckets : 
          Array.from(dashboardData.buckets)
        ) : []
    };

    if (dashboardData.id) {
      // Mise à jour d'un dashboard existant
      updatedDashboards = dashboards.map(d => 
        d.id === dashboardData.id ? dashboardToSave : d
      );
    } else {
      // Création d'un nouveau dashboard
      const newDashboard = {
        ...dashboardToSave,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      updatedDashboards = [...dashboards, newDashboard];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDashboards));
    return Promise.resolve(dashboardData.id ? dashboardToSave : updatedDashboards[updatedDashboards.length - 1]);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du dashboard:', error);
    return Promise.reject(error);
  }
};

export const deleteDashboard = (id) => {
  try {
    const dashboards = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updatedDashboards = dashboards.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDashboards));
    return Promise.resolve(true);
  } catch (error) {
    console.error('Erreur lors de la suppression du dashboard:', error);
    return Promise.reject(error);
  }
}; 