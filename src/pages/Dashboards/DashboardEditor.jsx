import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDashboard, saveDashboard } from '../../services/dashboardsService';
import { fetchBuckets } from '../../services/api';
import Widget from '../../components/Widgets/Widget';
import './Dashboards.scss';

const DashboardEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState({
        name: '',
        description: '',
        buckets: [],
        widgets: []
    });
    const [availableBuckets, setAvailableBuckets] = useState([]);
    const [selectedBuckets, setSelectedBuckets] = useState(new Set());
    const [editMode, setEditMode] = useState(true);
    const [widgets, setWidgets] = useState([]);

    useEffect(() => {
        if (id) {
            loadDashboard();
        }
        loadBuckets();
    }, [id]);

    const loadDashboard = async () => {
        try {
            const data = await fetchDashboard(id);
            console.log('Dashboard chargé:', data); // Debug
            
            if (data) {
                setDashboard(data);
                
                // Charger les buckets sélectionnés
                const bucketNames = data.buckets || [];
                console.log('Buckets à sélectionner:', bucketNames);
                setSelectedBuckets(new Set(bucketNames));
                
                // Charger les widgets
                if (Array.isArray(data.widgets)) {
                    console.log('Widgets à charger:', data.widgets);
                    setWidgets(data.widgets);
                } else {
                    console.log('Aucun widget trouvé dans le dashboard');
                    setWidgets([]);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
        }
    };

    const loadBuckets = async () => {
        try {
            const { data } = await fetchBuckets();
            console.log('Buckets loaded:', data); // Pour voir la structure des données
            setAvailableBuckets(data);
        } catch (error) {
            console.error('Erreur lors du chargement des buckets:', error);
        }
    };

    const addWidget = (type) => {
        const newWidget = {
            id: Date.now().toString(),
            type,
            title: 'Nouveau widget',
            config: {
                bucket: '',
                timeField: 'timestamp',
                timeRange: '24h',
                aggregation: 'count',
                fields: [],
                groupBy: []
            }
        };
        setWidgets([...widgets, newWidget]);
    };

    const updateWidget = (widgetId, updatedWidget) => {
        setWidgets(widgets.map(w => 
            w.id === widgetId ? updatedWidget : w
        ));
    };

    const deleteWidget = (widgetId) => {
        setWidgets(widgets.filter(w => w.id !== widgetId));
    };

    const handleSave = async () => {
        try {
            const dashboardToSave = {
                ...dashboard,
                buckets: Array.from(selectedBuckets),
                widgets: widgets.map(widget => ({
                    id: widget.id,
                    type: widget.type,
                    title: widget.title,
                    config: widget.config,
                    isConfigured: widget.isConfigured
                }))
            };

            console.log('Dashboard à sauvegarder:', dashboardToSave); // Debug

            const savedDashboard = await saveDashboard(dashboardToSave);
            setDashboard(savedDashboard);
            
            // Mettre à jour les widgets avec les données sauvegardées
            if (savedDashboard.widgets) {
                setWidgets(savedDashboard.widgets);
            }
            
            setEditMode(false);
            
            if (!id) {
                navigate(`/dashboards/${savedDashboard.id}`);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const handleBucketSelection = (bucketId) => {
        setSelectedBuckets(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(bucketId)) {
                newSelected.delete(bucketId);
            } else {
                newSelected.add(bucketId);
            }
            console.log('Buckets sélectionnés après mise à jour:', Array.from(newSelected)); // Debug
            return newSelected;
        });
    };

    // Juste avant le rendu de la liste
    console.log('Available buckets:', availableBuckets);
    console.log('Selected buckets:', Array.from(selectedBuckets));

    return (
        <div className="dashboard-editor">
            <div className="editor-header">
                <div className="header-content">
                    <div className="header-left">
                        <input
                            type="text"
                            value={dashboard.name}
                            onChange={e => setDashboard(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nom du tableau de bord"
                            className="dashboard-title"
                            disabled={!editMode}
                        />
                        <input
                            type="text"
                            value={dashboard.description}
                            onChange={e => setDashboard(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description (optionnelle)"
                            className="dashboard-description"
                            disabled={!editMode}
                        />
                    </div>
                    <div className="header-actions">
                        {editMode ? (
                            <>
                                <button className="cancel-btn" onClick={() => setEditMode(false)}>
                                    <i className="fas fa-times"></i>
                                    Annuler
                                </button>
                                <button className="save-btn" onClick={handleSave}>
                                    <i className="fas fa-save"></i>
                                    Enregistrer
                                </button>
                            </>
                        ) : (
                            <button className="edit-btn" onClick={() => setEditMode(true)}>
                                <i className="fas fa-edit"></i>
                                Modifier
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="editor-layout">
                <div className="editor-sidebar">
                    <section>
                        <div className="bucket-list">
                            {availableBuckets.map(bucket => {
                                const isSelected = selectedBuckets.has(bucket.name);
                                console.log(`Bucket ${bucket.name} selected:`, isSelected); // Debug

                                return (
                                    <div
                                        key={bucket.name}
                                        className={`bucket-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleBucketSelection(bucket.name)}
                                    >
                                        <div className="bucket-row">
                                            <div className="bucket-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleBucketSelection(bucket.name)}
                                                />
                                                <span className="checkmark"></span>
                                            </div>
                                            <div className="bucket-info">
                                                <span className="bucket-name">{bucket.name}</span>
                                                <span className="bucket-count">
                                                    {bucket.count || 0} entrées
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="editor-content">
                    <div className="widgets-toolbar">
                        <h3>Widgets disponibles</h3>
                        <div className="widget-types">
                            <button onClick={() => addWidget('line')} className="widget-type-btn">
                                <i className="fas fa-chart-line"></i>
                                <span>Graphique linéaire</span>
                            </button>
                            <button onClick={() => addWidget('bar')} className="widget-type-btn">
                                <i className="fas fa-chart-bar"></i>
                                <span>Graphique en barres</span>
                            </button>
                            <button onClick={() => addWidget('pie')} className="widget-type-btn">
                                <i className="fas fa-chart-pie"></i>
                                <span>Graphique circulaire</span>
                            </button>
                            <button onClick={() => addWidget('counter')} className="widget-type-btn">
                                <i className="fas fa-calculator"></i>
                                <span>Compteur</span>
                            </button>
                        </div>
                    </div>

                    <div className="widgets-grid">
                        {widgets.map(widget => (
                            <Widget
                                key={widget.id}
                                widget={widget}
                                buckets={availableBuckets}
                                selectedBuckets={selectedBuckets}
                                onUpdate={(updatedWidget) => updateWidget(widget.id, updatedWidget)}
                                onDelete={() => deleteWidget(widget.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DashboardEditor; 