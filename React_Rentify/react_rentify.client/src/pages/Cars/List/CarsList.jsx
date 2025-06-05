// src/pages/Cars/List/CarsList.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './CarsList.css';

const CarsList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const agencyId = user?.agencyId;
    const navigate = useNavigate();

    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterModel, setFilterModel] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterAvailability, setFilterAvailability] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelsData, yearsData] = await Promise.all([
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);
                setModels(modelsData);
                setYears(yearsData);

                const carsData = await carService.getByAgencyId(agencyId);
                setCars(carsData);
                setFilteredCars(carsData);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(t('car.list.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [agencyId, t]);

    useEffect(() => {
        let result = [...cars];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (car) =>
                    car.licensePlate.toLowerCase().includes(term) ||
                    (car.color && car.color.toLowerCase().includes(term))
            );
        }

        if (filterModel) {
            result = result.filter((car) => car.car_ModelId === filterModel);
        }

        if (filterYear) {
            result = result.filter(
                (car) => String(car.car_YearId) === filterYear
            );
        }

        if (filterAvailability) {
            const avail = filterAvailability === 'available';
            result = result.filter((car) => car.isAvailable === avail);
        }

        setFilteredCars(result);
    }, [cars, searchTerm, filterModel, filterYear, filterAvailability]);

    const handleAdd = () => {
        navigate('/cars/add');
    };

    const handleDetails = (id) => {
        navigate(`/cars/${id}`);
    };

    const handleEdit = (id) => {
        navigate(`/cars/${id}/edit`);
    };

    const handleRemove = async (id) => {
        if (!window.confirm(t('car.list.confirmRemove'))) return;
        try {
            await carService.delete(id);
            const updated = cars.filter((c) => c.id !== id);
            setCars(updated);
        } catch (err) {
            console.error('❌ Error deleting car:', err);
            alert(t('car.list.removeError'));
        }
    };

    if (isLoading) {
        return (
            <div className="cl-loading-wrapper">
                <div className="cl-spinner" />
            </div>
        );
    }

    if (error) {
        return <div className="cl-error-message">{error}</div>;
    }

    return (
        <div className="cars-list-container">
            {/* Header with Add Button */}
            <div className="cl-header">
                <h1 className="cl-title">{t('car.list.title')}</h1>
                <button className="btn-add" onClick={handleAdd}>
                    + {t('common.add')}
                </button>
            </div>

            {/* Filters */}
            <div className="cl-filters">
                <input
                    type="text"
                    className="cl-search-input"
                    placeholder={t('car.list.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="cl-select"
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                >
                    <option value="">{t('car.list.filterModel')}</option>
                    {models.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>

                <select
                    className="cl-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                >
                    <option value="">{t('car.list.filterYear')}</option>
                    {years.map((y) => (
                        <option key={y.id} value={y.id}>
                            {y.yearValue}
                        </option>
                    ))}
                </select>

                <select
                    className="cl-select"
                    value={filterAvailability}
                    onChange={(e) => setFilterAvailability(e.target.value)}
                >
                    <option value="">{t('car.list.filterAvailability')}</option>
                    <option value="available">{t('car.list.available')}</option>
                    <option value="unavailable">{t('car.list.unavailable')}</option>
                </select>
            </div>

            {/* Table View (Desktop) */}
            <div className="cl-table-wrapper">
                <table className="cl-data-table">
                    <thead>
                        <tr>
                            <th>{t('car.fields.licensePlate')}</th>
                            <th>{t('car.fields.model')}</th>
                            <th>{t('car.fields.year')}</th>
                            <th>{t('car.fields.color')}</th>
                            <th>{t('car.fields.isAvailable')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCars.map((car) => {
                            return (
                                <tr key={car.id}>
                                    <td>{car.licensePlate}</td>
                                    <td>{car.fields.model + ' ' + car.fields.manufacturer}</td>
                                    <td>{car.fields.year}</td>
                                    <td>{car.color}</td>
                                    <td>
                                        <span
                                            className={`availability-badge ${car.isAvailable ? 'avail-true' : 'avail-false'
                                                }`}
                                        >
                                            {car.isAvailable
                                                ? t('car.list.availableShort')
                                                : t('car.list.unavailableShort')}
                                        </span>
                                    </td>
                                    <td className="cl-actions-cell">
                                        <button
                                            className="cl-action-btn btn-details"
                                            onClick={() => handleDetails(car.id)}
                                        >
                                            {t('common.details')}
                                        </button>
                                        <button
                                            className="cl-action-btn btn-edit"
                                            onClick={() => handleEdit(car.id)}
                                        >
                                            {t('common.edit')}
                                        </button>
                                        <button
                                            className="cl-action-btn btn-remove"
                                            onClick={() => handleRemove(car.id)}
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Card View (Mobile) */}
            <div className="cl-cards-wrapper">
                {filteredCars.map((car) => {
                    const modelName =
                        models.find((m) => m.id === car.car_ModelId)?.name || car.car_ModelId;
                    const yearValue =
                        years.find((y) => y.id === car.car_YearId)?.yearValue || car.car_YearId;
                    return (
                        <div className="cl-card" key={car.id}>
                            <div className="cl-card-content">
                                <p>
                                    <span className="card-label">
                                        {t('car.fields.licensePlate')}:
                                    </span>{' '}
                                    {car.licensePlate}
                                </p>
                                <p>
                                    <span className="card-label">{t('car.fields.model')}:</span>{' '}
                                    {modelName}
                                </p>
                                <p>
                                    <span className="card-label">{t('car.fields.year')}:</span>{' '}
                                    {yearValue}
                                </p>
                                <p>
                                    <span className="card-label">{t('car.fields.color')}:</span>{' '}
                                    {car.color}
                                </p>
                                <p>
                                    <span className="card-label">
                                        {t('car.fields.isAvailable')}:
                                    </span>{' '}
                                    {car.isAvailable
                                        ? t('car.list.availableShort')
                                        : t('car.list.unavailableShort')}
                                </p>
                            </div>
                            <div className="cl-card-actions">
                                <button
                                    className="cl-card-btn btn-details"
                                    onClick={() => handleDetails(car.id)}
                                >
                                    {t('common.details')}
                                </button>
                                <button
                                    className="cl-card-btn btn-edit"
                                    onClick={() => handleEdit(car.id)}
                                >
                                    {t('common.edit')}
                                </button>
                                <button
                                    className="cl-card-btn btn-remove"
                                    onClick={() => handleRemove(car.id)}
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CarsList;
