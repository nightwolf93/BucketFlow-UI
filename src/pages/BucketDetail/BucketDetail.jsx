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
      setData(result);
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
        case 'between':
          const [start, end] = value.split(',').map(v => v.trim());
          newFilters.dateRanges = { ...prev.dateRanges, [field]: { start, end } };
          break;
      }
      return newFilters;
    });

    setFilterInput({ field: '', operator: 'equality', value: '' });
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
      const date = new Date(timestamp);
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch {
      return timestamp; // Retourne la valeur originale si le parsing échoue
    }
  };

  // Fonction mise à jour pour obtenir la valeur formatée d'une cellule
  const getCellValue = (item, column) => {
    const value = item[column];
    
    if (value === null || value === undefined) return '-';
    
    // Détection et formatage des champs timestamp
    if (
      (column.toLowerCase().includes('timestamp') || 
       column.toLowerCase().includes('date') ||
       column.toLowerCase().includes('time')) && 
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return formatTimestamp(value);
    }
    
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
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
        <h2>Bucket: {id}</h2>
        <div className="bucket-stats">
          <span>{data.length} éléments au total</span>
        </div>
      </header>

      {/* Filtres */}
      <section className="filters-section">
        <h3>Filtres</h3>
        <div className="filter-form">
          <input
            type="text"
            placeholder="Nom du champ"
            value={filterInput.field}
            onChange={e => setFilterInput(prev => ({ ...prev, field: e.target.value }))}
          />
          <select
            value={filterInput.operator}
            onChange={e => setFilterInput(prev => ({ ...prev, operator: e.target.value }))}
          >
            <option value="equality">Égal à</option>
            <option value="gte">Supérieur ou égal à</option>
            <option value="in">Dans la liste</option>
            <option value="between">Entre deux dates</option>
          </select>
          <input
            type="text"
            placeholder={filterInput.operator === 'between' ? 'YYYY-MM-DD,YYYY-MM-DD' : 'Valeur'}
            value={filterInput.value}
            onChange={e => setFilterInput(prev => ({ ...prev, value: e.target.value }))}
          />
          <button className="primary" onClick={addFilter}>Ajouter le filtre</button>
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
                            title={getCellValue(item, column)}
                            onClick={() => toggleRowExpansion(index)}
                            className={isTimestamp ? 'timestamp-cell' : ''}
                            style={{ cursor: 'pointer' }}
                          >
                            {getCellValue(item, column)}
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