import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchBucketData, deleteBucket, addBucketData, deleteBucketData, fetchBuckets } from '../../services/api';
import './BucketDetail.scss';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { monokaiSublime } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Enregistrer le langage JSON
SyntaxHighlighter.registerLanguage('json', json);

const BucketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [buckets, setBuckets] = useState([]);
  const [editingFilter, setEditingFilter] = useState(null);
  const [activeArray, setActiveArray] = useState(null);

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

  // Chargement de la liste des buckets
  useEffect(() => {
    const loadBuckets = async () => {
      try {
        const result = await fetchBuckets(); 
        setBuckets(result.data);
      } catch (err) {
        console.error('Erreur lors du chargement des buckets:', err);
      }
    };
    loadBuckets();
  }, []);

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
      'deposit': { backgroundColor: '#cffafe', color: '#155e75', borderColor: '#67e8f9' },
      'withdrawal': { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' },
      
      // Indigo - Véhicules
      'started': { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' },
      'completed': { backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#818cf8' },
      
      // Rose - Social
      'car_sales': { backgroundColor: '#fce7f3', color: '#9d174d', borderColor: '#fbcfe8' },
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

  // Ajouter cette fonction utilitaire en haut du fichier
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optionnel : Vous pouvez ajouter un feedback visuel ici
    });
  };

  // Fonction pour gérer l'affichage des détails
  const showArrayDetails = (event, items) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setActiveArray({
      items,
      position: {
        left: rect.left,
        top: rect.bottom + 10,
      }
    });
  };

  const hideArrayDetails = (event) => {
    // Ne rien faire si on passe sur le portal ou la zone tampon
    const relatedTarget = event.relatedTarget;
    const detailsElement = document.getElementById('array-details-portal');
    const bufferElement = document.getElementById('array-details-buffer');
    
    if (detailsElement?.contains(relatedTarget) || bufferElement?.contains(relatedTarget)) {
      return;
    }
    setActiveArray(null);
  };

  // Modifier la partie de rendu des tableaux dans getCellValue
  const getCellValue = (item, column) => {
    const value = item[column];
    
    if (value === null || value === undefined) return { value: '-' };
    
    // Détection des timestamps
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
    
    // Détection et formatage des tableaux
    if (Array.isArray(value) || (typeof value === 'string' && value.startsWith('[') && value.endsWith(']'))) {
      let arrayValue;
      try {
        arrayValue = Array.isArray(value) ? value : JSON.parse(value);
        return {
          value: (
            <div className="array-cell">
              <div 
                className="array-preview"
                onMouseEnter={(e) => showArrayDetails(e, arrayValue)}
                onMouseLeave={hideArrayDetails}
              >
                {arrayValue.length} identifiants
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          ),
          isComponent: true
        };
      } catch (e) {
        return { value: String(value) };
      }
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

  // Fonction pour commencer l'édition d'un filtre
  const startEditFilter = (type, field, value) => {
    setEditingFilter({
      type,
      field,
      value: type === 'in' ? value.join(', ') : 
             type === 'dateRanges' ? `${value.start},${value.end}` : 
             String(value)
    });
  };

  // Fonction pour sauvegarder l'édition d'un filtre
  const saveEditFilter = () => {
    if (!editingFilter) return;
    const { type, field, value } = editingFilter;

    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (type) {
        case 'in':
          newFilters[type][field] = value.split(',').map(v => v.trim());
          break;
        case 'dateRanges':
          const [start, end] = value.split(',').map(v => v.trim());
          newFilters[type][field] = { start, end };
          break;
        default:
          newFilters[type][field] = value;
      }
      
      return newFilters;
    });

    setEditingFilter(null);
  };

  if (loading) {
    return (
      <div className="bucket-detail">
        <div className="loading-state">
          <div className="spinner" />
          <h3>Chargement des données...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bucket-detail">
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Une erreur est survenue</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const columns = getColumns(data);

  return (
    <div className="bucket-detail">
      <div className="detail-header">
        <div className="header-content">
          <div className="header-left">
            <div className="bucket-selector">
              <select 
                value={id}
                onChange={(e) => navigate(`/bucket/${e.target.value}`)}
                className="bucket-dropdown"
              >
                {buckets.map(bucket => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name || bucket.id}
                  </option>
                ))}
              </select>
              <div className="bucket-stats">
                <span>
                  <i className="fas fa-layer-group"></i>
                  {data.length} éléments au total
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={refreshData}
              title="Rafraîchir les données"
            >
              <i className="fas fa-sync-alt"></i>
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      <section className="filters-section">
        <h3>
          <i className="fas fa-filter"></i>
          Filtres
        </h3>
        <div className="filter-form">
          <select
            value={filterInput.field}
            onChange={e => setFilterInput(prev => ({ ...prev, field: e.target.value }))}
          >
            <option value="">Sélectionner un champ</option>
            {columns.map(column => (
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
            <i className="fas fa-plus"></i>
            Ajouter le filtre
          </button>
        </div>

        <div className="active-filters">
          {Object.entries(filters.equality).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {editingFilter?.type === 'equality' && editingFilter?.field === field ? (
                <div className="filter-edit">
                  <span>{field} = </span>
                  <input
                    type="text"
                    value={editingFilter.value}
                    onChange={e => setEditingFilter(prev => ({ ...prev, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditFilter();
                      if (e.key === 'Escape') setEditingFilter(null);
                    }}
                    autoFocus
                  />
                  <button onClick={saveEditFilter} className="save-btn">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <span onClick={() => startEditFilter('equality', field, value)}>
                    {field} = {value}
                  </span>
                  <button onClick={() => removeFilter('equality', field)}>×</button>
                </>
              )}
            </div>
          ))}
          {Object.entries(filters.gte).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {editingFilter?.type === 'gte' && editingFilter?.field === field ? (
                <div className="filter-edit">
                  <span>{field} ≥ </span>
                  <input
                    type="text"
                    value={editingFilter.value}
                    onChange={e => setEditingFilter(prev => ({ ...prev, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditFilter();
                      if (e.key === 'Escape') setEditingFilter(null);
                    }}
                    autoFocus
                  />
                  <button onClick={saveEditFilter} className="save-btn">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <span onClick={() => startEditFilter('gte', field, value)}>
                    {field} ≥ {value}
                  </span>
                  <button onClick={() => removeFilter('gte', field)}>×</button>
                </>
              )}
            </div>
          ))}
          {Object.entries(filters.in).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {editingFilter?.type === 'in' && editingFilter?.field === field ? (
                <div className="filter-edit">
                  <span>{field} in [</span>
                  <input
                    type="text"
                    value={editingFilter.value}
                    onChange={e => setEditingFilter(prev => ({ ...prev, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditFilter();
                      if (e.key === 'Escape') setEditingFilter(null);
                    }}
                    autoFocus
                  />
                  <span>]</span>
                  <button onClick={saveEditFilter} className="save-btn">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <span onClick={() => startEditFilter('in', field, value)}>
                    {field} in [{value.join(', ')}]
                  </span>
                  <button onClick={() => removeFilter('in', field)}>×</button>
                </>
              )}
            </div>
          ))}
          {Object.entries(filters.like).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {editingFilter?.type === 'like' && editingFilter?.field === field ? (
                <div className="filter-edit">
                  <span>{field} contient </span>
                  <input
                    type="text"
                    value={editingFilter.value}
                    onChange={e => setEditingFilter(prev => ({ ...prev, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditFilter();
                      if (e.key === 'Escape') setEditingFilter(null);
                    }}
                    autoFocus
                  />
                  <button onClick={saveEditFilter} className="save-btn">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <span onClick={() => startEditFilter('like', field, value)}>
                    {field} contient {value}
                  </span>
                  <button onClick={() => removeFilter('like', field)}>×</button>
                </>
              )}
            </div>
          ))}
          {Object.entries(filters.dateRanges).map(([field, {start, end}]) => (
            <div key={field} className="filter-tag">
              {editingFilter?.type === 'dateRanges' && editingFilter?.field === field ? (
                <div className="filter-edit">
                  <span>{field} entre </span>
                  <input
                    type="text"
                    value={editingFilter.value}
                    onChange={e => setEditingFilter(prev => ({ ...prev, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditFilter();
                      if (e.key === 'Escape') setEditingFilter(null);
                    }}
                    autoFocus
                  />
                  <span> et </span>
                  <button onClick={saveEditFilter} className="save-btn">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <span onClick={() => startEditFilter('dateRanges', field, {start, end})}>
                    {field} entre {start} et {end}
                  </span>
                  <button onClick={() => removeFilter('dateRanges', field)}>×</button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

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
                  <React.Fragment key={index}>
                    <tr className={expandedRows.has(index) ? 'expanded' : ''}>
                      <td className="expand-column">
                        <button 
                          className="expand-btn"
                          onClick={() => toggleRowExpansion(index)}
                        >
                          <i className={`fas fa-chevron-${expandedRows.has(index) ? 'down' : 'right'}`}></i>
                        </button>
                      </td>
                      {columns.map(column => (
                        <td 
                          key={column}
                          title={getCellValue(item, column).value}
                          className={getCellValue(item, column).className}
                          style={getCellValue(item, column).style}
                          onClick={() => toggleRowExpansion(index)}
                        >
                          <span>{getCellValue(item, column).value}</span>
                        </td>
                      ))}
                      <td className="actions">
                        <button 
                          className="delete-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
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
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr className="expanded-content">
                        <td colSpan={columns.length + 2}>
                          <div className="content-wrapper">
                            <SyntaxHighlighter 
                              language="json"
                              style={monokaiSublime}
                              customStyle={{
                                margin: 0,
                                borderRadius: '4px',
                                fontSize: '13px'
                              }}
                            >
                              {JSON.stringify(item, null, 2)}
                            </SyntaxHighlighter>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="page-info">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>Aucune donnée</h3>
            <p>Aucune donnée ne correspond aux critères de recherche.</p>
          </div>
        )}
      </section>

      {/* Portal pour les détails du tableau avec zone tampon */}
      {activeArray && (
        <>
          <div 
            id="array-details-buffer"
            className="array-details-buffer"
            style={{
              position: 'fixed',
              left: activeArray.position.left,
              top: activeArray.position.top - 10,
              height: '10px',
              width: '400px',
              zIndex: 99999
            }}
            onMouseEnter={() => {/* Ne rien faire */}}
          />
          <div 
            id="array-details-portal"
            className="array-details-portal"
            style={{
              position: 'fixed',
              left: activeArray.position.left,
              top: activeArray.position.top,
              zIndex: 99999
            }}
            onMouseLeave={(e) => {
              // Ne fermer que si on ne va pas vers la cellule ou la zone tampon
              const relatedTarget = e.relatedTarget;
              const bufferElement = document.getElementById('array-details-buffer');
              
              if (!bufferElement?.contains(relatedTarget)) {
                setActiveArray(null);
              }
            }}
          >
            {activeArray.items.map((item, index) => {
              const match = typeof item === 'string' && item.match(/^([^:]+):/);
              const type = match ? match[1] : null;
              const content = match ? item.split(':')[1] : item;
              
              return (
                <div 
                  key={index} 
                  className={`array-item ${type ? `type-${type}` : ''}`}
                  onClick={() => copyToClipboard(item)}
                  title="Cliquer pour copier"
                >
                  {type && <span className="type-badge">{type}</span>}
                  <span className="content">{content}</span>
                  <span className="copy-icon">
                    <i className="fas fa-copy"></i>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default BucketDetail; 