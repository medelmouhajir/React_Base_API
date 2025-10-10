// src/pages/Cars/Add/AddCar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import carAttachmentService from '../../../services/carAttachmentService';
import './AddCar.css';

const AddCar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        ManufacturerId: '',
        Car_ModelId: '',
        Car_YearId: '',
        LicensePlate: '',
        Color: '',
        DailyRate: '',
        Gear_Type: 0, // Manual = 0, Automatic = 1
        Engine_Type: 0, // Gasoline = 0, Diesel = 1, Electric = 2, Hybrid = 3
        CurrentKM: 0,
        // Legal Documents
        AssuranceName: '',
        AssuranceStartDate: '',
        AssuranceEndDate: '',
        TechnicalVisitStartDate: '',
        TechnicalVisitEndDate: '',
    });

    // States for UI
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [years, setYears] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({});
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    const totalSteps = 4;

    // Step validation
    const stepValidation = {
        1: ['ManufacturerId', 'Car_ModelId', 'Car_YearId'],
        2: ['LicensePlate', 'Color', 'DailyRate'],
        3: [], // Images are optional
        4: [] // Legal documents are optional
    };

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [manufacturersData, yearsData] = await Promise.all([
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarYears()
                ]);
                setManufacturers(manufacturersData || []);
                setYears(yearsData || []);

                const modelsData = await carFiltersService.getCarModels();
                setModels(modelsData || []);
            } catch (err) {
                console.error('❌ Error loading filter data:', err);
                setError(t('common.error'));
            }
        };

        loadData();
    }, [t]);

    // Filter models when manufacturer changes
    useEffect(() => {
        if (formData.ManufacturerId) {
            const filtered = models.filter(model => model.manufacturerId === formData.ManufacturerId);
            setFilteredModels(filtered);
            // Reset model selection if current model doesn't belong to new manufacturer
            if (formData.Car_ModelId && !filtered.some(model => model.id === formData.Car_ModelId)) {
                setFormData(prev => ({ ...prev, Car_ModelId: '' }));
            }
        } else {
            setFilteredModels([]);
            setFormData(prev => ({ ...prev, Car_ModelId: '' }));
        }
    }, [formData.ManufacturerId, models]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleBlur = (e) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    // Image handling
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            return isValidType && isValidSize;
        });

        if (validFiles.length !== files.length) {
            setError(t('car.add.invalidImageFormat'));
            return;
        }

        const newImages = [...selectedImages, ...validFiles];
        const newPreviewUrls = [...imagePreviewUrls];

        validFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            newPreviewUrls.push(url);
        });

        setSelectedImages(newImages);
        setImagePreviewUrls(newPreviewUrls);

        // Set first image as main if no main image is set
        if (mainImageIndex === 0 && newImages.length > 0) {
            setMainImageIndex(0);
        }
    };

    const removeImage = (indexToRemove) => {
        URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);

        const newImages = selectedImages.filter((_, index) => index !== indexToRemove);
        const newPreviewUrls = imagePreviewUrls.filter((_, index) => index !== indexToRemove);

        setSelectedImages(newImages);
        setImagePreviewUrls(newPreviewUrls);

        // Adjust main image index if necessary
        if (indexToRemove === mainImageIndex) {
            setMainImageIndex(0);
        } else if (indexToRemove < mainImageIndex) {
            setMainImageIndex(prev => prev - 1);
        }
    };

    const setMainImage = (index) => {
        setMainImageIndex(index);
    };

    // Step navigation
    const isStepValid = (step) => {
        const requiredFields = stepValidation[step] || [];
        return requiredFields.every(field => formData[field] && formData[field] !== '');
    };

    const goToStep = (step) => {
        if (step <= currentStep + 1 || completedSteps.has(step)) {
            setCurrentStep(step);
        }
    };

    const nextStep = () => {
        if (isStepValid(currentStep)) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            if (currentStep < totalSteps) {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async (e) => {

        // Validate all required fields across steps 1–3
        const allRequiredFields = Object.values(stepValidation).flat();
        const missingFields = allRequiredFields.filter(
            (field) => !formData[field] || formData[field] === ''
        );
        if (missingFields.length > 0) {
            setError(t('car.add.missingRequiredFields'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const carPayload = {
                AgencyId: agencyId,
                Car_ModelId: formData.Car_ModelId,
                Car_YearId: parseInt(formData.Car_YearId, 10),
                LicensePlate: formData.LicensePlate.trim(),
                Color: formData.Color.trim(),
                DailyRate: parseFloat(formData.DailyRate),
                Gear_Type: parseInt(formData.Gear_Type, 10),
                Engine_Type: parseInt(formData.Engine_Type, 10),
                CurrentKM: parseInt(formData.CurrentKM, 10) || 0,
                AssuranceName: formData.AssuranceName?.trim() || null,
                AssuranceStartDate: formData.AssuranceStartDate || null,
                AssuranceEndDate: formData.AssuranceEndDate || null,
                TechnicalVisitStartDate: formData.TechnicalVisitStartDate || null,
                TechnicalVisitEndDate: formData.TechnicalVisitEndDate || null,
            };

            let response;
            if (selectedImages.length > 0) {
                response = await carService.createWithImages(carPayload, selectedImages, mainImageIndex);
            } else {
                response = await carService.create({ ...carPayload, Images: null });
            }

            const carId = response.id;
            navigate(`/cars/${carId}`);
        } catch (err) {
            console.error('❌ Error adding car:', err);
            setError(t('car.add.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        navigate('/cars');
    };

    // Helper to check if a field is invalid
    const isFieldInvalid = (fieldName) => {
        if (!touched[fieldName]) return false;

        const requiredFields = Object.values(stepValidation).flat();
        if (requiredFields.includes(fieldName) && (!formData[fieldName] || formData[fieldName] === '')) {
            return true;
        }

        return false;
    };

    // Cleanup effect for preview URLs
    useEffect(() => {
        return () => {
            imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const renderStepIndicator = () => (
        <div className="step-indicator">
            {Array.from({ length: totalSteps }, (_, index) => {
                const step = index + 1;
                const isActive = step === currentStep;
                const isCompleted = completedSteps.has(step);
                const isAccessible = step <= currentStep + 1 || completedSteps.has(step);

                return (
                    <div
                        key={step}
                        className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isAccessible ? 'accessible' : ''}`}
                        onClick={() => isAccessible && goToStep(step)}
                    >
                        <div className="step-number">
                            {isCompleted ? '✓' : step}
                        </div>
                        <div className="step-label">
                            {step === 1 && t('car.add.step.vehicle')}
                            {step === 2 && t('car.add.step.details')}
                            {step === 3 && t('car.add.step.images')}
                            {step === 4 && t('car.add.step.legal')}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.add.step.vehicle')}</h2>
                            <p className="step-description">{t('car.add.step.vehicleDesc')}</p>
                        </div>

                        <div className="form-grid">
                            <div className={`form-group ${isFieldInvalid('ManufacturerId') ? 'error' : ''}`}>
                                <label htmlFor="ManufacturerId">
                                    {t('car.fields.manufacturer')} <span className="required">*</span>
                                </label>
                                <select
                                    id="ManufacturerId"
                                    name="ManufacturerId"
                                    value={formData.ManufacturerId}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                >
                                    <option value="">{t('car.placeholders.selectManufacturer')}</option>
                                    {manufacturers.map(manufacturer => (
                                        <option key={manufacturer.id} value={manufacturer.id}>
                                            {manufacturer.name}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('ManufacturerId') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Car_ModelId') ? 'error' : ''}`}>
                                <label htmlFor="Car_ModelId">
                                    {t('car.fields.model')} <span className="required">*</span>
                                </label>
                                <select
                                    id="Car_ModelId"
                                    name="Car_ModelId"
                                    value={formData.Car_ModelId}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    disabled={!formData.ManufacturerId}
                                    required
                                >
                                    <option value="">{t('car.placeholders.selectModel')}</option>
                                    {filteredModels.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('Car_ModelId') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Car_YearId') ? 'error' : ''}`}>
                                <label htmlFor="Car_YearId">
                                    {t('car.fields.year')} <span className="required">*</span>
                                </label>
                                <select
                                    id="Car_YearId"
                                    name="Car_YearId"
                                    value={formData.Car_YearId}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                >
                                    <option value="">{t('car.placeholders.selectYear')}</option>
                                    {years.map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.yearValue}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('Car_YearId') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="Gear_Type">{t('car.fields.gearType')}</label>
                                <select
                                    id="Gear_Type"
                                    name="Gear_Type"
                                    value={formData.Gear_Type}
                                    onChange={handleInputChange}
                                >
                                    <option value={0}>{t('car.gearType.manual')}</option>
                                    <option value={1}>{t('car.gearType.automatic')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="Engine_Type">{t('car.fields.engineType')}</label>
                                <select
                                    id="Engine_Type"
                                    name="Engine_Type"
                                    value={formData.Engine_Type}
                                    onChange={handleInputChange}
                                >
                                    <option value={0}>{t('car.engineType.gasoline')}</option>
                                    <option value={1}>{t('car.engineType.diesel')}</option>
                                    <option value={2}>{t('car.engineType.electric')}</option>
                                    <option value={3}>{t('car.engineType.hybrid')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.add.step.details')}</h2>
                            <p className="step-description">{t('car.add.step.detailsDesc')}</p>
                        </div>

                        <div className="form-grid">
                            <div className={`form-group ${isFieldInvalid('LicensePlate') ? 'error' : ''}`}>
                                <label htmlFor="LicensePlate">
                                    {t('car.fields.licensePlate')} <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="LicensePlate"
                                    name="LicensePlate"
                                    value={formData.LicensePlate}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder={t('car.placeholders.licensePlate')}
                                    required
                                />
                                {isFieldInvalid('LicensePlate') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Color') ? 'error' : ''}`}>
                                <label htmlFor="Color">
                                    {t('car.fields.color')} <span className="required">*</span>
                                </label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="text"
                                        id="Color"
                                        name="Color"
                                        value={formData.Color}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder={t('car.placeholders.selectColor')}
                                        required
                                    />
                                    <div
                                        className="color-preview"
                                        style={{ backgroundColor: formData.Color }}
                                    ></div>
                                </div>
                                {isFieldInvalid('Color') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('DailyRate') ? 'error' : ''}`}>
                                <label htmlFor="DailyRate">
                                    {t('car.fields.dailyRate')} <span className="required">*</span>
                                </label>
                                <div className="currency-input-wrapper">
                                    <input
                                        type="number"
                                        id="DailyRate"
                                        name="DailyRate"
                                        value={formData.DailyRate}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <span className="currency-symbol">{t('common.currency')}</span>
                                </div>
                                {isFieldInvalid('DailyRate') && (
                                    <span className="error-message">{t('validation.required')}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="CurrentKM">{t('car.currentKM')}</label>
                                <div className="km-input-wrapper">
                                    <input
                                        type="number"
                                        id="CurrentKM"
                                        name="CurrentKM"
                                        value={formData.CurrentKM}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                    />
                                    <span className="unit-symbol">KM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.add.step.images')}</h2>
                            <p className="step-description">{t('car.add.step.imagesDesc')}</p>
                        </div>

                        <div className="image-upload-section">
                            <div className="upload-area">
                                <input
                                    type="file"
                                    id="imageUpload"
                                    multiple
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    className="file-input"
                                />
                                <label htmlFor="imageUpload" className="upload-label">
                                    <div className="upload-icon">📷</div>
                                    <div className="upload-text">
                                        <span className="upload-primary">{t('car.add.uploadImages')}</span>
                                        <span className="upload-secondary">{t('car.add.imageFormats')}</span>
                                    </div>
                                </label>
                            </div>

                            {selectedImages.length > 0 && (
                                <div className="image-preview-grid">
                                    {imagePreviewUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            className={`image-preview ${index === mainImageIndex ? 'main-image' : ''}`}
                                        >
                                            <img src={url} alt={`Preview ${index + 1}`} />
                                            <div className="image-actions">
                                                {index !== mainImageIndex && (
                                                    <button
                                                        type="button"
                                                        className="set-main-btn"
                                                        onClick={() => setMainImage(index)}
                                                        title={t('car.add.setMainImage')}
                                                    >
                                                        ⭐
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="remove-image-btn"
                                                    onClick={() => removeImage(index)}
                                                    title={t('car.add.removeImage')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            {index === mainImageIndex && (
                                                <div className="main-image-badge">{t('car.add.mainImage')}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.add.step.legal')}</h2>
                            <p className="step-description">{t('car.add.step.legalDesc')}</p>
                        </div>

                        <div className="legal-sections">
                            <div className="legal-section">
                                <h3 className="legal-section-title">{t('car.add.insurance')}</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="AssuranceName">{t('car.add.insuranceName')}</label>
                                        <input
                                            type="text"
                                            id="AssuranceName"
                                            name="AssuranceName"
                                            value={formData.AssuranceName}
                                            onChange={handleInputChange}
                                            placeholder={t('car.add.insuranceNamePlaceholder')}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="AssuranceStartDate">{t('car.add.insuranceStartDate')}</label>
                                        <input
                                            type="date"
                                            id="AssuranceStartDate"
                                            name="AssuranceStartDate"
                                            value={formData.AssuranceStartDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="AssuranceEndDate">{t('car.add.insuranceEndDate')}</label>
                                        <input
                                            type="date"
                                            id="AssuranceEndDate"
                                            name="AssuranceEndDate"
                                            value={formData.AssuranceEndDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="legal-section">
                                <h3 className="legal-section-title">{t('car.add.technicalVisit')}</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="TechnicalVisitStartDate">{t('car.add.technicalVisitStartDate')}</label>
                                        <input
                                            type="date"
                                            id="TechnicalVisitStartDate"
                                            name="TechnicalVisitStartDate"
                                            value={formData.TechnicalVisitStartDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="TechnicalVisitEndDate">{t('car.add.technicalVisitEndDate')}</label>
                                        <input
                                            type="date"
                                            id="TechnicalVisitEndDate"
                                            name="TechnicalVisitEndDate"
                                            value={formData.TechnicalVisitEndDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`addcar-container ${isDarkMode ? 'dark' : 'light'}`}>
            <div className="addcar-header">
                <h1 className="addcar-title">{t('car.list.addCar')}</h1>
                <p className="addcar-subtitle">{t('car.add.subtitle')}</p>
            </div>

            {error && (
                <div className="error-alert" role="alert">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                </div>
            )}

            <form className="addcar-form" noValidate onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                {renderStepIndicator()}

                <div className="form-content">
                    {renderStepContent()}
                </div>

                <div className="form-actions">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={prevStep}
                            disabled={isSubmitting}
                        >
                            {t('common.previous')}
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            className={`btn btn-primary ${!isStepValid(currentStep) ? 'disabled' : ''}`}
                            onClick={nextStep}
                            disabled={!isStepValid(currentStep) || isSubmitting}
                        >
                            {t('common.next')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="spinner"></div>
                                    {t('car.add.creating')}
                                </>
                            ) : (
                                t('car.add.createCar')
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AddCar;