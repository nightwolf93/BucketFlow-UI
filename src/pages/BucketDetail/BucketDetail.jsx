import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchBucketData, deleteBucket, addBucketData, deleteBucketData } from '../../services/api';
import './BucketDetail.scss';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BucketDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    equality: {},
    gte: {},
    in: {},
    like: {},
    dateRanges: {}
  });
  const [filterInput, setFilterInput] = useState({
    field: '',
    operator: 'equality',
    value: ''
  });
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Chargement des données avec filtres
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchBucketData(id, filters);
      // Tri des données par timestamp décroissant
      const sortedResult = result.sort((a, b) => {
        const timestampA = new Date(a.timestamp || a.created_at || 0).getTime();
        const timestampB = new Date(b.timestamp || b.created_at || 0).getTime();
        return timestampB - timestampA;
      });
      setData(sortedResult);
      // Réinitialisation de la page courante
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, filters]);

  // Gestion de la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Ajout d'un filtre
  const addFilter = () => {
    const { field, operator, value } = filterInput;
    if (!field || !value) return;

    setFilters(prev => {
      const newFilters = { ...prev };
      switch (operator) {
        case 'equality':
          newFilters.equality = { ...prev.equality, [field]: value };
          break;
        case 'gte':
          newFilters.gte = { ...prev.gte, [field]: value };
          break;
        case 'in':
          newFilters.in = { ...prev.in, [field]: value.split(',').map(v => v.trim()) };
          break;
        case 'like':
          newFilters.like = { ...prev.like, [field]: value };
          break;
        case 'between':
          const [start, end] = value.split(',').map(v => v.trim());
          newFilters.dateRanges = { ...prev.dateRanges, [field]: { start, end } };
          break;
      }
      return newFilters;
    });

    // Réinitialisation du formulaire de filtre et de la page courante
    setFilterInput({ field: '', operator: 'equality', value: '' });
    setCurrentPage(1);
  };

  // Suppression d'un filtre
  const removeFilter = (type, field) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[type][field];
      return newFilters;
    });
  };

  // Fonction pour extraire les colonnes du premier élément
  const getColumns = (data) => {
    if (data.length === 0) return [];
    const firstItem = data[0];
    return Object.keys(firstItem);
  };

  // Fonction pour formater un timestamp
  const formatTimestamp = (timestamp) => {
    try {
      // Convertir le timestamp en millisecondes si nécessaire
      const timestampMs = String(timestamp).length === 10 
        ? timestamp * 1000  // Si le timestamp est en secondes (10 chiffres)
        : Number(timestamp); // Sinon on garde la valeur telle quelle

      const date = new Date(timestampMs);
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch {
      return timestamp; // Retourne la valeur originale si le parsing échoue
    }
  };

  // Ajoutez ces fonctions pour gérer les styles spéciaux
  const getSpecialFieldStyle = (fieldName, value) => {
    fieldName = fieldName.toLowerCase();
    
    // Style pour les champs de type/status/état
    if (['type', 'status', 'state', 'etat', 'statut'].includes(fieldName)) {
      return getStatusStyle(value);
    }

    return null;
  };

  const getStatusStyle = (value) => {
    const statusStyles = {
      // Vert - Actions positives/légales
      'give': { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' },
      'bank': { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' },
      
      // Rouge - Actions illégales/dangereuses
      'illegal': { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' },
      'kill': { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' },
      
      // Orange - Services d'urgence
      'ems': { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' },
      'police': { backgroundColor: '#fff7ed', color: '#ea580c', borderColor: '#fdba74' },
      
      // Bleu - Commerce
      'shop': { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
      'market': { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc' },
      
      // Violet - Modifications/Customisation
      'mods': { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' },
      'custom': { backgroundColor: '#fae8ff', color: '#86198f', borderColor: '#f0abfc' },
      
      // Jaune - Récompenses/Événements
      'battlepass': { backgroundColor: '#fef9c3', color: '#854d0e', borderColor: '#fde047' },
      'event': { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
      
      // Cyan - Administration
      'admin': { backgroundColor: '#cffafe', color: '#155e75', borderColor: '#67e8f9' },
      'system': { backgroundColor: '#ecfeff', color: '#164e63', borderColor: '#22d3ee' },
      
      // Indigo - Véhicules
      'vehicle': { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' },
      'garage': { backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#818cf8' },
      
      // Rose - Social
      'social': { backgroundColor: '#fce7f3', color: '#9d174d', borderColor: '#fbcfe8' },
      'chat': { backgroundColor: '#fdf2f8', color: '#be185d', borderColor: '#f9a8d4' },
      
      // Vert foncé - Argent/Économie
      'money': { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' },
      'economy': { backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#34d399' }
    };
    
    return statusStyles[value?.toLowerCase()] || {
      // Style par défaut pour les valeurs non définies
      backgroundColor: '#f1f5f9',
      color: '#475569',
      borderColor: '#cbd5e1'
    };
  };

  // Modifiez la fonction getCellValue pour inclure les styles spéciaux
  const getCellValue = (item, column) => {
    const value = item[column];
    
    if (value === null || value === undefined) return { value: '-' };
    
    // Détection et formatage des champs timestamp
    if (
      (column.toLowerCase().includes('timestamp') || 
       column.toLowerCase().includes('date') ||
       column.toLowerCase().includes('time')) && 
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return { 
        value: formatTimestamp(value),
        className: 'timestamp-cell'
      };
    }
    
    // Vérification des styles spéciaux
    const specialStyle = getSpecialFieldStyle(column, value);
    if (specialStyle) {
      return {
        value: String(value),
        style: specialStyle
      };
    }
    
    if (typeof value === 'object') return { value: JSON.stringify(value) };
    return { value: String(value) };
  };

  // Fonction pour basculer l'expansion d'une ligne
  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Fonction pour rafraîchir les données
  const refreshData = () => {
    setFilters({
      equality: {},
      gte: {},
      in: {},
      like: {},
      dateRanges: {}
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="bucket-detail">
        <div className="loading">Chargement des données...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bucket-detail">
        <div className="error">Erreur: {error}</div>
      </div>
    );
  }

  const columns = getColumns(data);

  return (
    <div className="bucket-detail">
      <header className="bucket-header">
        <div className="header-left">
          <h2>Bucket: {id}</h2>
          <div className="bucket-stats">
            <span>{data.length} éléments au total</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={refreshData}
            title="Rafraîchir les données"
          >
            <span>↻</span> Rafraîchir
          </button>
        </div>
      </header>

      {/* Section d'aide pour les filtres */}
      <section className="filters-help">
        <details>
          <summary>Guide d'utilisation des filtres</summary>
          <div className="filters-help-content">
            <h4>Types de filtres disponibles :</h4>
            
            <div className="filter-type">
              <h5>Égal à</h5>
              <p>Recherche une correspondance exacte.</p>
              <em>Exemple : champ = "valeur"</em>
            </div>

            <div className="filter-type">
              <h5>Supérieur ou égal à</h5>
              <p>Trouve les valeurs supérieures ou égales à la valeur spécifiée.</p>
              <em>Exemple : prix ≥ 100</em>
            </div>

            <div className="filter-type">
              <h5>Dans la liste</h5>
              <p>Recherche parmi une liste de valeurs (séparées par des virgules).</p>
              <em>Exemple : status = "actif,en_attente,terminé"</em>
            </div>

            <div className="filter-type">
              <h5>Contient (Like)</h5>
              <p>Recherche avec caractères spéciaux :</p>
              <ul>
                <li><code>%</code> : remplace n'importe quelle séquence de caractères</li>
                <li><code>_</code> : remplace un seul caractère</li>
              </ul>
              <p>Exemples :</p>
              <ul>
                <li><code>nom[like] = "Jean%"</code> : trouve "Jean", "Jeanne", "Jeannette", etc.</li>
                <li><code>email[like] = "%@gmail.com"</code> : trouve tous les emails Gmail</li>
                <li><code>texte[like] = "%mot%"</code> : trouve toutes les entrées contenant "mot"</li>
              </ul>
            </div>

            <div className="filter-type">
              <h5>Entre deux dates</h5>
              <p>Recherche entre deux dates (format YYYY-MM-DD).</p>
              <em>Exemple : "2024-01-01,2024-12-31"</em>
            </div>
          </div>
        </details>
      </section>

      {/* Filtres */}
      <section className="filters-section">
        <h3>Filtres</h3>
        <div className="filter-form">
          <select
            value={filterInput.field}
            onChange={e => setFilterInput(prev => ({ ...prev, field: e.target.value }))}
          >
            <option value="">Sélectionner un champ</option>
            {getColumns(data).map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
          <select
            value={filterInput.operator}
            onChange={e => setFilterInput(prev => ({ ...prev, operator: e.target.value }))}
          >
            <option value="equality">Égal à</option>
            <option value="gte">Supérieur ou égal à</option>
            <option value="in">Dans la liste</option>
            <option value="like">Contient</option>
            <option value="between">Entre deux dates</option>
          </select>
          <input
            type="text"
            placeholder={filterInput.operator === 'between' ? 'YYYY-MM-DD,YYYY-MM-DD' : 'Valeur'}
            value={filterInput.value}
            onChange={e => setFilterInput(prev => ({ ...prev, value: e.target.value }))}
          />
          <button 
            className="primary" 
            onClick={addFilter}
            disabled={!filterInput.field || !filterInput.value}
          >
            Ajouter le filtre
          </button>
        </div>

        {/* Filtres actifs */}
        <div className="active-filters">
          {Object.entries(filters.equality).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {field} = {value}
              <button onClick={() => removeFilter('equality', field)}>×</button>
            </div>
          ))}
          {Object.entries(filters.gte).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {field} ≥ {value}
              <button onClick={() => removeFilter('gte', field)}>×</button>
            </div>
          ))}
          {Object.entries(filters.like).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {field} contient {value}
              <button onClick={() => removeFilter('like', field)}>×</button>
            </div>
          ))}
          {/* ... autres types de filtres ... */}
        </div>
      </section>

      {/* Nouvelle section de données en tableau */}
      <section className="data-section">
        {data.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="expand-column"></th>
                  {columns.map(column => (
                    <th key={column}>{column}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <>
                    <tr 
                      key={index}
                      className={expandedRows.has(index) ? 'expanded' : ''}
                    >
                      <td className="expand-column">
                        <button 
                          className="expand-btn"
                          onClick={() => toggleRowExpansion(index)}
                        >
                          {expandedRows.has(index) ? '▼' : '▶'}
                        </button>
                      </td>
                      {columns.map(column => {
                        const isTimestamp = column.toLowerCase().includes('timestamp') || 
                                           column.toLowerCase().includes('date') ||
                                           column.toLowerCase().includes('time');
                        return (
                          <td 
                            key={column}
                            title={getCellValue(item, column).value}
                            className={getCellValue(item, column).className}
                            style={getCellValue(item, column).style}
                            onClick={() => toggleRowExpansion(index)}
                          >
                            {getCellValue(item, column).value}
                          </td>
                        );
                      })}
                      <td className="actions">
                        <button 
                          className="delete-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await deleteBucketData(id, {
                                equality: Object.fromEntries(
                                  Object.entries(item).map(([key, value]) => [key, String(value)])
                                )
                              });
                              loadData();
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr className="expanded-content">
                        <td colSpan={columns.length + 2}>
                          <div className="json-viewer">
                            <pre>{JSON.stringify(item, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            Aucune donnée trouvée
          </div>
        )}

        {/* Pagination */}
        {data.length > 0 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BucketDetail; 