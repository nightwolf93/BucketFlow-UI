import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchBucketData, deleteBucket, addBucketData, deleteBucketData } from '../../services/api';
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
            <h2>
              <i className="fas fa-database"></i>
              Bucket: {id}
            </h2>
            <div className="bucket-stats">
              <span>
                <i className="fas fa-layer-group"></i>
                {data.length} éléments au total
              </span>
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
          {Object.entries(filters.in).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {field} in [{value.join(', ')}]
              <button onClick={() => removeFilter('in', field)}>×</button>
            </div>
          ))}
          {Object.entries(filters.like).map(([field, value]) => (
            <div key={field} className="filter-tag">
              {field} contient {value}
              <button onClick={() => removeFilter('like', field)}>×</button>
            </div>
          ))}
          {Object.entries(filters.dateRanges).map(([field, {start, end}]) => (
            <div key={field} className="filter-tag">
              {field} entre {start} et {end}
              <button onClick={() => removeFilter('dateRanges', field)}>×</button>
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
    </div>
  );
};

export default BucketDetail; 