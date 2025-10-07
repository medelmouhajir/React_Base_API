// src/pages/Accidents/Add/AddAccident.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import accidentService from '../../../services/accidentService';
import { carService } from '../../../services/carService';
import reservationService from '../../../services/reservationService';
import './AddAccident.css';

const AddAccident = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        accidentDate: '',
        carId: '',
        reservationId: null,
        notes: '',
        expertFullname: '',
        expertPhone: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Date & Car Selection, 2: Reservation Handling, 3: Accident Details
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [reservationAction, setReservationAction] = useState(''); // 'complete', 'nothing', 'changeCar'
    const [availableCars, setAvailableCars] = useState([]);
    const [errors, setErrors] = useState({});

    // Load cars on component mount
    useEffect(() => {
        loadCars();
    }, []);

    const loadCars = async () => {
        try {
            setLoading(true);
            const carsData = await carService.getByAgencyId(user.agencyId);
            setCars(carsData);
        } catch (error) {
            console.error('Error loading cars:', error);
            toast.error(t('accidents.add.errors.loadCars'));
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = async (date) => {
        setFormData(prev => ({ ...prev, accidentDate: date }));
        setErrors(prev => ({ ...prev, accidentDate: '' }));

        if (selectedCar && date) {
            await checkCarReservations(selectedCar.id, date);
        }
    };

    const handleCarSelection = async (car) => {
        setSelectedCar(car);
        setFormData(prev => ({ ...prev, carId: car.id }));
        setErrors(prev => ({ ...prev, carId: '' }));

        if (formData.accidentDate) {
            await checkCarReservations(car.id, formData.accidentDate);
        }
    };

    const checkCarReservations = async (carId, date) => {
        try {
            setLoading(true);
            const reservationsData = await carService.checkCarReservationsByDate(carId, date);
            setReservations(reservationsData);

            // Check if there's an ongoing reservation
            const ongoingReservation = reservationsData.find(r => r.status === 'Ongoing');
            if (ongoingReservation) {
                setSelectedReservation(ongoingReservation);
                setStep(2); // Move to reservation handling step
            } else {
                setStep(3); // Move directly to accident details
            }
        } catch (error) {
            console.error('Error checking car reservations:', error);
            toast.error(t('accidents.add.errors.checkReservations'));
        } finally {
            setLoading(false);
        }
    };

    const handleReservationAction = async (action) => {
        setReservationAction(action);

        if (action === 'changeCar') {
            try {
                setLoading(true);
                const availableCarsList = await reservationService.getAvailableCars(
                    selectedReservation.startDate,
                    selectedReservation.endDate,
                    selectedReservation.carId
                );
                setAvailableCars(availableCarsList);
            } catch (error) {
                console.error('Error loading available cars:', error);
                toast.error(t('accidents.add.errors.loadAvailableCars'));
            } finally {
                setLoading(false);
            }
        } else {
            setStep(3); // Move to accident details
        }
    };

    const handleCarChange = async (newCarId) => {
        try {
            setLoading(true);
            await reservationService.updateReservationCar(selectedReservation.id, newCarId);
            toast.success(t('accidents.add.reservationCarChanged'));
            setStep(3); // Move to accident details
        } catch (error) {
            console.error('Error changing reservation car:', error);
            toast.error(t('accidents.add.errors.changeReservationCar'));
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.accidentDate) {
            newErrors.accidentDate = t('accidents.add.validation.accidentDateRequired');
        }

        if (!formData.carId) {
            newErrors.carId = t('accidents.add.validation.carRequired');
        }

        if (!formData.notes.trim()) {
            newErrors.notes = t('accidents.add.validation.notesRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error(t('accidents.add.validation.fixErrors'));
            return;
        }

        try {
            setLoading(true);

            // Handle reservation actions before creating accident
            if (selectedReservation && reservationAction === 'complete') {
                // Change reservation status to completed
                await reservationService.returnCar(selectedReservation.id, {
                    returnDate: new Date(),
                    odometerEnd: selectedReservation.car?.currentKM || 0
                });
            }

            // Create accident
            const accidentData = {
                agencyId: user.agencyId,
                carId: formData.carId,
                reservationId: selectedReservation?.id || null,
                accidentDate: new Date(formData.accidentDate).toISOString(),
                notes: formData.notes,
                expertFullname: formData.expertFullname || null,
                expertPhone: formData.expertPhone || null
            };

            await accidentService.create(accidentData);
            toast.success(t('accidents.add.success'));
            navigate('/accidents');
        } catch (error) {
            console.error('Error creating accident:', error);
            toast.error(t('accidents.add.errors.create'));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 3) {
            // If we're on step 3, check if there was a reservation
            if (selectedReservation) {
                // If there was a reservation, go back to step 2
                setStep(2);
            } else {
                // If no reservation, go directly back to step 1
                setStep(1);
            }
        } else if (step === 2) {
            // From step 2, always go back to step 1
            setStep(1);
            setSelectedReservation(null);
            setReservationAction('');
        } else {
            // From step 1, navigate away
            navigate('/accidents');
        }
    };

    const renderCarCard = (car, isSelected = false) => (
        <div
            key={car.id}
            className={`car-card ${isSelected ? 'selected' : ''}`}
            onClick={() => handleCarSelection(car)}
        >
            <div className="car-image">
                {car.imageUrl ? (
                    <img src={car.imageUrl} alt={`${car.manufacturer} ${car.model}`} />
                ) : (
                    <div className="car-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2M7 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2M7 4h10" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="car-info">
                <h3 className="car-title">{car.fields?.manufacturer || car.car_Model.manufacturer.name} {car.fields?.model || car.car_Model.name}</h3>
                <p className="car-license">{car.licensePlate}</p>
                <div className="car-meta">
                    <span className={`car-status ${car.status?.toLowerCase()}`}>
                        {t(`cars.status.${car.status?.toLowerCase()}`)}
                    </span>
                </div>
            </div>
            {isSelected && (
                <div className="selection-indicator">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                </div>
            )}
        </div>
    );

    const renderReservationCard = (reservation) => (
        <div className="reservation-card">
            <div className="reservation-header">
                <h3>{t('accidents.add.ongoingReservation')}</h3>
                <span className={`status-badge ${reservation.status?.toLowerCase()}`}>
                    {t(`reservations.status.${reservation.status?.toLowerCase()}`)}
                </span>
            </div>
            <div className="reservation-details">
                <div className="detail-row">
                    <span className="label">{t('reservations.customer')}:</span>
                    <span className="value">{reservation.customerName}</span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('reservations.period')}:</span>
                    <span className="value">
                        {new Date(reservation.startDate).toLocaleDateString()} -
                        {new Date(reservation.endDate).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="add-accident-container">
            {/* Progress Header */}
            <div className="progress-header">
                <button type="button" className="back-btn" onClick={handleBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t('common.back')}
                </button>

                <div className="progress-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">{t('accidents.add.steps.dateAndCar')}</span>
                    </div>
                    <div className="step-connector"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">{t('accidents.add.steps.reservation')}</span>
                    </div>
                    <div className="step-connector"></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">{t('accidents.add.steps.details')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="add-accident-content">
                {step === 1 && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>{t('accidents.add.selectDateAndCar')}</h2>
                            <p>{t('accidents.add.selectDateAndCarDescription')}</p>
                        </div>

                        {/* Date Selection */}
                        <div className="form-section">
                            <label className="form-label">
                                {t('accidents.accidentDate')} *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.accidentDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className={`form-input ${errors.accidentDate ? 'error' : ''}`}
                                max={new Date().toISOString().slice(0, 16)}
                            />
                            {errors.accidentDate && (
                                <span className="error-message">{errors.accidentDate}</span>
                            )}
                        </div>

                        {/* Car Selection */}
                        <div className="form-section">
                            <label className="form-label">
                                {t('cars.selectCar')} *
                            </label>
                            {loading ? (
                                <div className="loading-grid">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="car-card skeleton">
                                            <div className="skeleton-image"></div>
                                            <div className="skeleton-content">
                                                <div className="skeleton-line"></div>
                                                <div className="skeleton-line short"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="cars-grid">
                                    {cars.map(car => renderCarCard(car, selectedCar?.id === car.id))}
                                </div>
                            )}
                            {errors.carId && (
                                <span className="error-message">{errors.carId}</span>
                            )}
                        </div>

                        {formData.accidentDate && selectedCar && (
                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn-continue"
                                    onClick={() => checkCarReservations(selectedCar.id, formData.accidentDate)}
                                    disabled={loading}
                                >
                                    {loading ? t('common.loading') : t('common.continue')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && selectedReservation && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>{t('accidents.add.handleOngoingReservation')}</h2>
                            <p>{t('accidents.add.reservationFoundDescription')}</p>
                        </div>

                        {renderReservationCard(selectedReservation)}

                        <div className="reservation-actions">
                            <h3>{t('accidents.add.whatToDo')}</h3>
                            <div className="action-options">
                                <div
                                    className={`action-option ${reservationAction === 'complete' ? 'selected' : ''}`}
                                    onClick={() => handleReservationAction('complete')}
                                >
                                    <div className="option-icon complete">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                                        </svg>
                                    </div>
                                    <div className="option-content">
                                        <h4>{t('accidents.add.actions.completeReservation')}</h4>
                                        <p>{t('accidents.add.actions.completeDescription')}</p>
                                    </div>
                                </div>

                                <div
                                    className={`action-option ${reservationAction === 'nothing' ? 'selected' : ''}`}
                                    onClick={() => handleReservationAction('nothing')}
                                >
                                    <div className="option-icon nothing">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <div className="option-content">
                                        <h4>{t('accidents.add.actions.doNothing')}</h4>
                                        <p>{t('accidents.add.actions.nothingDescription')}</p>
                                    </div>
                                </div>

                                <div
                                    className={`action-option ${reservationAction === 'changeCar' ? 'selected' : ''}`}
                                    onClick={() => handleReservationAction('changeCar')}
                                >
                                    <div className="option-icon change">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2M7 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2M7 4h10" />
                                        </svg>
                                    </div>
                                    <div className="option-content">
                                        <h4>{t('accidents.add.actions.changeCar')}</h4>
                                        <p>{t('accidents.add.actions.changeCarDescription')}</p>
                                    </div>
                                </div>
                            </div>

                            {reservationAction === 'changeCar' && (
                                <div className="available-cars-section">
                                    <h4>{t('accidents.add.selectNewCar')}</h4>
                                    {loading ? (
                                        <div className="loading-text">{t('common.loading')}</div>
                                    ) : (
                                        <div className="cars-grid">
                                            {availableCars.map(car => (
                                                <div
                                                    key={car.id}
                                                    className="car-card clickable"
                                                    onClick={() => handleCarChange(car.id)}
                                                >
                                                    {renderCarCard(car)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {reservationAction && reservationAction !== 'changeCar' && (
                                <div className="step-actions">
                                    <button
                                        type="button"
                                        className="btn-continue"
                                        onClick={() => setStep(3)}
                                    >
                                        {t('common.continue')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>{t('accidents.add.accidentDetails')}</h2>
                            <p>{t('accidents.add.fillDetailsDescription')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="accident-form">
                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label">
                                        {t('accidents.notes')} *
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className={`form-textarea ${errors.notes ? 'error' : ''}`}
                                        rows="4"
                                        placeholder={t('accidents.add.notesPlaceholder')}
                                    />
                                    {errors.notes && (
                                        <span className="error-message">{errors.notes}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label">
                                        {t('accidents.expertFullname')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.expertFullname}
                                        onChange={(e) => setFormData(prev => ({ ...prev, expertFullname: e.target.value }))}
                                        className="form-input"
                                        placeholder={t('accidents.add.expertNamePlaceholder')}
                                    />
                                </div>

                                <div className="form-section">
                                    <label className="form-label">
                                        {t('accidents.expertPhone')}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.expertPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, expertPhone: e.target.value }))}
                                        className="form-input"
                                        placeholder={t('accidents.add.expertPhonePlaceholder')}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleBack}
                                >
                                    {t('common.back')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? t('common.creating') : t('accidents.add.createAccident')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddAccident;