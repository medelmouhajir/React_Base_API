// src/pages/Cars/Edit/EditCar.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import carAttachmentService from '../../../services/carAttachmentService';
import './EditCar.css';

const EditCar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        id: '',
        ManufacturerId: '',
        Car_ModelId: '',
        Car_YearId: '',
        LicensePlate: '',
        Color: '',
        DailyRate: '',
        Gear_Type: 0, // Manual = 0, Automatic = 1
        Engine_Type: 0, // Gasoline = 0, Diesel = 1, Electric = 2, Hybrid = 3
        CurrentKM: 0,
        IsAvailable: true,
        Status: 'Available',
        DeviceSerialNumber: '',
        IsTrackingActive: false,
        HourlyRate: '',
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
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({});
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
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

    // Fetch car data and initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);

                // Load filter data
                const [manufacturersData, yearsData, modelsData] = await Promise.all([
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarYears(),
                    carFiltersService.getCarModels()
                ]);

                setManufacturers(manufacturersData || []);
                setYears(yearsData || []);
                setModels(modelsData || []);

                // Load car data
                const carData = await carService.getById(id);
                console.log('🔍 Car data received:', carData); // Debug log

                if (carData) {
                    // Find manufacturer ID from the car model
                    const carModel = modelsData.find(model => model.id === carData.car_ModelId);
                    const manufacturerId = carModel?.manufacturerId || '';

                    console.log('🔍 Found car model:', carModel); // Debug log
                    console.log('🔍 Manufacturer ID:', manufacturerId); // Debug log

                    setFormData({
                        id: carData.id,
                        ManufacturerId: manufacturerId,
                        Car_ModelId: carData.car_ModelId || '',
                        Car_YearId: carData.car_YearId?.toString() || '',
                        LicensePlate: carData.licensePlate || '',
                        Color: carData.color || '',
                        DailyRate: carData.dailyRate?.toString() || '',
                        Gear_Type: parseInt(carData.gear) || 0, // "gear" from API
                        Engine_Type: parseInt(carData.engine) || 0, // "engine" from API
                        CurrentKM: carData.currentKM || 0,
                        IsAvailable: carData.isAvailable ?? true,
                        Status: carData.status || 'Available',
                        DeviceSerialNumber: carData.deviceSerialNumber || '',
                        IsTrackingActive: carData.isTrackingActive || false,
                        HourlyRate: carData.hourlyRate?.toString() || '',
                        AssuranceName: carData.assuranceName || '',
                        AssuranceStartDate: carData.assuranceStartDate ?
                            new Date(carData.assuranceStartDate).toISOString().split('T')[0] : '',
                        AssuranceEndDate: carData.assuranceEndDate ?
                            new Date(carData.assuranceEndDate).toISOString().split('T')[0] : '',
                        TechnicalVisitStartDate: carData.technicalVisitStartDate ?
                            new Date(carData.technicalVisitStartDate).toISOString().split('T')[0] : '',
                        TechnicalVisitEndDate: carData.technicalVisitEndDate ?
                            new Date(carData.technicalVisitEndDate).toISOString().split('T')[0] : '',
                    });

                    // Load existing images - Note: API returns 'Images' with capital I
                    console.log('🔍 Car images:', carData.images); // Debug log

                    if (carData.images && carData.images.length > 0) {
                        // Transform the API image data to our expected format
                        const transformedImages = carData.images.map((img, index) => ({
                            id: `existing_${index}`, // Create a temporary ID for existing images
                            path: img.path, // API returns 'path' (lowercase from JSON)
                            isMainImage: img.isMainImage // API returns 'isMainImage' (camelCase from JSON)
                        }));

                        console.log('🔍 Transformed images:', transformedImages); // Debug log

                        setExistingImages(transformedImages);
                        const mainIndex = transformedImages.findIndex(img => img.isMainImage);
                        setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);
                    }

                    // Mark step 1 as completed if we have the required data
                    if (carData.car_ModelId && carData.car_YearId) {
                        setCompletedSteps(new Set([1]));
                    }
                }
            } catch (err) {
                console.error('❌ Error loading car data:', err);
                setError(t('car.edit.loadError') || 'Failed to load car data');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id, t]);

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
        const { name, value, type, checked } = e.target;

        let newValue;
        if (type === 'checkbox') {
            newValue = checked;
        } else if (type === 'number') {
            newValue = value === '' ? '' : parseFloat(value);
        } else {
            newValue = value;
        }

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
            setError(t('car.edit.invalidImageFormat') || 'Invalid image format or size');
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
    };

    const removeNewImage = (indexToRemove) => {
        URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);

        const newImages = selectedImages.filter((_, index) => index !== indexToRemove);
        const newUrls = imagePreviewUrls.filter((_, index) => index !== indexToRemove);

        setSelectedImages(newImages);
        setImagePreviewUrls(newUrls);
    };

    const removeExistingImage = async (imageId) => {
        try {
            // For now, just remove from local state since we don't have a delete API endpoint
            // In a real scenario, you'd call an API to delete the image
            console.log('Removing image with ID:', imageId);

            // Remove from local state
            const imageIndex = existingImages.findIndex(img => img.id === imageId);
            if (imageIndex !== -1) {
                setExistingImages(prev => prev.filter(img => img.id !== imageId));

                // Reset main image index if we removed the main image
                if (imageIndex === mainImageIndex) {
                    setMainImageIndex(0);
                } else if (imageIndex < mainImageIndex) {
                    setMainImageIndex(prev => prev - 1);
                }
            }

            // TODO: Implement actual API call when endpoint is available
            // await carAttachmentService.delete(imageId);
        } catch (err) {
            console.error('❌ Error removing image:', err);
            setError(t('car.edit.imageDeleteError') || 'Failed to delete image');
        }
    };

    const setAsMainImage = (index, isExisting = true) => {
        if (isExisting) {
            setMainImageIndex(index);
        }
        // For new images, we'll handle main image selection during submission
    };

    // Step navigation
    const canProceedToStep = (stepNumber) => {
        const requiredFields = stepValidation[stepNumber] || [];
        return requiredFields.every(field => formData[field]);
    };

    const handleStepClick = (stepNumber) => {
        if (stepNumber <= currentStep || completedSteps.has(stepNumber) || canProceedToStep(stepNumber)) {
            setCurrentStep(stepNumber);
        }
    };

    const handleNext = () => {
        if (canProceedToStep(currentStep)) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Validation
    const isFieldInvalid = (fieldName) => {
        if (!touched[fieldName]) return false;

        const requiredFields = ['ManufacturerId', 'Car_ModelId', 'Car_YearId', 'LicensePlate', 'DailyRate'];
        if (requiredFields.includes(fieldName) && !formData[fieldName]) {
            return true;
        }

        return false;
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched for validation
        const allFields = Object.keys(formData).reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {});
        setTouched(allFields);

        // Validate required fields
        const requiredFields = ['ManufacturerId', 'Car_ModelId', 'Car_YearId', 'LicensePlate', 'DailyRate'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setError(t('car.edit.requiredFields') || 'Please fill in all required fields');
            setCurrentStep(1); // Go back to first step with missing fields
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare car data payload
            const carPayload = {
                id: formData.id,
                AgencyId: agencyId,
                Car_ModelId: formData.Car_ModelId,
                Car_YearId: parseInt(formData.Car_YearId, 10),
                LicensePlate: formData.LicensePlate,
                Color: formData.Color,
                IsAvailable: formData.IsAvailable,
                Status: formData.Status,
                DailyRate: parseFloat(formData.DailyRate),
                HourlyRate: formData.HourlyRate ? parseFloat(formData.HourlyRate) : null,
                DeviceSerialNumber: formData.DeviceSerialNumber,
                IsTrackingActive: formData.IsTrackingActive,
                Gear_Type: parseInt(formData.Gear_Type),
                Engine_Type: parseInt(formData.Engine_Type),
                CurrentKM: parseInt(formData.CurrentKM),
                AssuranceName: formData.AssuranceName,
                AssuranceStartDate: formData.AssuranceStartDate || null,
                AssuranceEndDate: formData.AssuranceEndDate || null,
                TechnicalVisitStartDate: formData.TechnicalVisitStartDate || null,
                TechnicalVisitEndDate: formData.TechnicalVisitEndDate || null,
            };

            // Update car data
            await carService.update(id, carPayload);

            // Upload new images if any
            if (selectedImages.length > 0) {
                const imageFormData = new FormData();
                selectedImages.forEach(image => {
                    imageFormData.append('images', image);
                });
                imageFormData.append('carId', id);

                await carAttachmentService.upload(imageFormData);
            }

            // Update main image if needed
            if (existingImages.length > 0 && mainImageIndex >= 0) {
                const mainImage = existingImages[mainImageIndex];
                if (mainImage && !mainImage.isMainImage) {
                    await carAttachmentService.setMainImage(mainImage.id);
                }
            }

            navigate('/cars');
        } catch (err) {
            console.error('❌ Error updating car:', err);
            setError(t('car.edit.error') || 'Failed to update car');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Clean up preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        navigate('/cars');
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.edit.step.basic') || 'Vehicle Information'}</h2>
                            <p className="step-description">{t('car.edit.step.basicDesc') || 'Select the vehicle make, model, and year'}</p>
                        </div>

                        <div className="form-grid">
                            <div className={`form-group ${isFieldInvalid('ManufacturerId') ? 'error' : ''}`}>
                                <label htmlFor="ManufacturerId">
                                    {t('car.fields.manufacturer') || 'Manufacturer'} <span className="required">*</span>
                                </label>
                                <select
                                    id="ManufacturerId"
                                    name="ManufacturerId"
                                    value={formData.ManufacturerId}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                >
                                    <option value="">{t('car.placeholders.selectManufacturer') || 'Select manufacturer'}</option>
                                    {manufacturers.map(manufacturer => (
                                        <option key={manufacturer.id} value={manufacturer.id}>
                                            {manufacturer.name}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('ManufacturerId') && (
                                    <span className="error-message">{t('validation.required') || 'This field is required'}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Car_ModelId') ? 'error' : ''}`}>
                                <label htmlFor="Car_ModelId">
                                    {t('car.fields.model') || 'Model'} <span className="required">*</span>
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
                                    <option value="">{t('car.placeholders.selectModel') || 'Select model'}</option>
                                    {filteredModels.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('Car_ModelId') && (
                                    <span className="error-message">{t('validation.required') || 'This field is required'}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Car_YearId') ? 'error' : ''}`}>
                                <label htmlFor="Car_YearId">
                                    {t('car.fields.year') || 'Year'} <span className="required">*</span>
                                </label>
                                <select
                                    id="Car_YearId"
                                    name="Car_YearId"
                                    value={formData.Car_YearId}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                >
                                    <option value="">{t('car.placeholders.selectYear') || 'Select year'}</option>
                                    {years.map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.yearValue}
                                        </option>
                                    ))}
                                </select>
                                {isFieldInvalid('Car_YearId') && (
                                    <span className="error-message">{t('validation.required') || 'This field is required'}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="Gear_Type">{t('car.fields.gearType') || 'Transmission'}</label>
                                <select
                                    id="Gear_Type"
                                    name="Gear_Type"
                                    value={formData.Gear_Type}
                                    onChange={handleInputChange}
                                >
                                    <option value={0}>{t('car.gearType.manual') || 'Manual'}</option>
                                    <option value={1}>{t('car.gearType.automatic') || 'Automatic'}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="Engine_Type">{t('car.fields.engineType') || 'Engine Type'}</label>
                                <select
                                    id="Engine_Type"
                                    name="Engine_Type"
                                    value={formData.Engine_Type}
                                    onChange={handleInputChange}
                                >
                                    <option value={0}>{t('car.engineType.gasoline') || 'Gasoline'}</option>
                                    <option value={1}>{t('car.engineType.diesel') || 'Diesel'}</option>
                                    <option value={2}>{t('car.engineType.electric') || 'Electric'}</option>
                                    <option value={3}>{t('car.engineType.hybrid') || 'Hybrid'}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.edit.step.details') || 'Vehicle Details'}</h2>
                            <p className="step-description">{t('car.edit.step.detailsDesc') || 'Enter vehicle identification and pricing'}</p>
                        </div>

                        <div className="form-grid">
                            <div className={`form-group ${isFieldInvalid('LicensePlate') ? 'error' : ''}`}>
                                <label htmlFor="LicensePlate">
                                    {t('car.fields.licensePlate') || 'License Plate'} <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="LicensePlate"
                                    name="LicensePlate"
                                    value={formData.LicensePlate}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder={t('car.placeholders.licensePlate') || 'Enter license plate'}
                                    required
                                />
                                {isFieldInvalid('LicensePlate') && (
                                    <span className="error-message">{t('validation.required') || 'This field is required'}</span>
                                )}
                            </div>

                            <div className={`form-group ${isFieldInvalid('Color') ? 'error' : ''}`}>
                                <label htmlFor="Color">{t('car.fields.color') || 'Color'}</label>
                                <input
                                    type="text"
                                    id="Color"
                                    name="Color"
                                    value={formData.Color}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder={t('car.placeholders.color') || 'Enter vehicle color'}
                                />
                            </div>

                            <div className={`form-group ${isFieldInvalid('DailyRate') ? 'error' : ''}`}>
                                <label htmlFor="DailyRate">
                                    {t('car.fields.dailyRate') || 'Daily Rate'} <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="DailyRate"
                                    name="DailyRate"
                                    value={formData.DailyRate}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder={t('car.placeholders.dailyRate') || 'Enter daily rate'}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                {isFieldInvalid('DailyRate') && (
                                    <span className="error-message">{t('validation.required') || 'This field is required'}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="HourlyRate">{t('car.fields.hourlyRate') || 'Hourly Rate'}</label>
                                <input
                                    type="number"
                                    id="HourlyRate"
                                    name="HourlyRate"
                                    value={formData.HourlyRate}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder={t('car.placeholders.hourlyRate') || 'Enter hourly rate (optional)'}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="CurrentKM">{t('car.fields.currentKM') || 'Current Kilometers'}</label>
                                <input
                                    type="number"
                                    id="CurrentKM"
                                    name="CurrentKM"
                                    value={formData.CurrentKM}
                                    onChange={handleInputChange}
                                    placeholder={t('car.placeholders.currentKM') || 'Enter current kilometers'}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="DeviceSerialNumber">{t('car.fields.deviceSerial') || 'GPS Device Serial'}</label>
                                <input
                                    type="text"
                                    id="DeviceSerialNumber"
                                    name="DeviceSerialNumber"
                                    value={formData.DeviceSerialNumber}
                                    onChange={handleInputChange}
                                    placeholder={t('car.placeholders.deviceSerial') || 'Enter GPS device serial number'}
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="IsAvailable"
                                        checked={formData.IsAvailable}
                                        onChange={handleInputChange}
                                    />
                                    <span className="checkmark"></span>
                                    {t('car.fields.isAvailable') || 'Available for rent'}
                                </label>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="IsTrackingActive"
                                        checked={formData.IsTrackingActive}
                                        onChange={handleInputChange}
                                    />
                                    <span className="checkmark"></span>
                                    {t('car.fields.trackingActive') || 'GPS tracking active'}
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.edit.step.images') || 'Vehicle Images'}</h2>
                            <p className="step-description">{t('car.edit.step.imagesDesc') || 'Manage vehicle photos'}</p>
                        </div>

                        <div className="images-section">
                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div className="existing-images-section">
                                    <h3 className="section-subtitle">{t('car.edit.existingImages') || 'Current Images'}</h3>
                                    <div className="image-preview-grid">
                                        {existingImages.map((image, index) => (
                                            <div
                                                key={image.id}
                                                className={`image-preview ${mainImageIndex === index ? 'main-image' : ''}`}
                                            >
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${image.path}`}
                                                    alt={`Car image ${index + 1}`}
                                                    loading="lazy"
                                                />
                                                <div className="image-actions">
                                                    {mainImageIndex !== index && (
                                                        <button
                                                            type="button"
                                                            className="set-main-btn"
                                                            onClick={() => setAsMainImage(index, true)}
                                                            title={t('car.edit.setMainImage') || 'Set as main image'}
                                                        >
                                                            ⭐
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="remove-image-btn"
                                                        onClick={() => removeExistingImage(image.id)}
                                                        title={t('car.edit.removeImage') || 'Remove image'}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                {mainImageIndex === index && (
                                                    <div className="main-image-badge">
                                                        {t('car.edit.mainImage') || 'Main'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Images Upload */}
                            <div className="upload-section">
                                <h3 className="section-subtitle">{t('car.edit.addNewImages') || 'Add New Images'}</h3>
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        id="images"
                                        multiple
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleImageUpload}
                                        className="file-input"
                                    />
                                    <label htmlFor="images" className="upload-label">
                                        <div className="upload-icon">📷</div>
                                        <div className="upload-text">
                                            <span className="upload-title">{t('car.edit.uploadImages') || 'Upload Images'}</span>
                                            <span className="upload-subtitle">{t('car.edit.uploadDesc') || 'Click to select or drag and drop'}</span>
                                        </div>
                                    </label>
                                </div>

                                {/* New Image Previews */}
                                {selectedImages.length > 0 && (
                                    <div className="new-images-section">
                                        <h4 className="section-subtitle">{t('car.edit.newImages') || 'New Images'}</h4>
                                        <div className="image-preview-grid">
                                            {imagePreviewUrls.map((url, index) => (
                                                <div key={index} className="image-preview">
                                                    <img src={url} alt={`New image ${index + 1}`} loading="lazy" />
                                                    <div className="image-actions">
                                                        <button
                                                            type="button"
                                                            className="remove-image-btn"
                                                            onClick={() => removeNewImage(index)}
                                                            title={t('car.edit.removeImage') || 'Remove image'}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="upload-info">
                                <p className="info-text">
                                    {t('car.edit.imageInfo') || 'Supported formats: JPEG, PNG, WebP. Max size: 10MB per image.'}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <h2 className="step-title">{t('car.edit.step.legal') || 'Legal Documents'}</h2>
                            <p className="step-description">{t('car.edit.step.legalDesc') || 'Insurance and technical visit information'}</p>
                        </div>

                        <div className="legal-sections">
                            {/* Insurance Section */}
                            <div className="legal-section">
                                <h3 className="legal-section-title">{t('car.edit.insurance') || 'Insurance Information'}</h3>

                                <div className="form-group">
                                    <label htmlFor="AssuranceName">{t('car.fields.insuranceName') || 'Insurance Company'}</label>
                                    <input
                                        type="text"
                                        id="AssuranceName"
                                        name="AssuranceName"
                                        value={formData.AssuranceName}
                                        onChange={handleInputChange}
                                        placeholder={t('car.placeholders.insuranceName') || 'Enter insurance company name'}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="AssuranceStartDate">{t('car.fields.insuranceStart') || 'Insurance Start Date'}</label>
                                    <input
                                        type="date"
                                        id="AssuranceStartDate"
                                        name="AssuranceStartDate"
                                        value={formData.AssuranceStartDate}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="AssuranceEndDate">{t('car.fields.insuranceEnd') || 'Insurance End Date'}</label>
                                    <input
                                        type="date"
                                        id="AssuranceEndDate"
                                        name="AssuranceEndDate"
                                        value={formData.AssuranceEndDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Technical Visit Section */}
                            <div className="legal-section">
                                <h3 className="legal-section-title">{t('car.edit.technicalVisit') || 'Technical Inspection'}</h3>

                                <div className="form-group">
                                    <label htmlFor="TechnicalVisitStartDate">{t('car.fields.techVisitStart') || 'Inspection Start Date'}</label>
                                    <input
                                        type="date"
                                        id="TechnicalVisitStartDate"
                                        name="TechnicalVisitStartDate"
                                        value={formData.TechnicalVisitStartDate}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="TechnicalVisitEndDate">{t('car.fields.techVisitEnd') || 'Inspection End Date'}</label>
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
                );

            default:
                return null;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`addcar-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`addcar-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="addcar-header">
                <h1 className="addcar-title">{t('car.edit.title') || 'Edit Vehicle'}</h1>
                <p className="addcar-subtitle">{t('car.edit.subtitle') || 'Update vehicle information and settings'}</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="error-alert" role="alert">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                </div>
            )}

            {/* Form */}
            <form className="addcar-form" onSubmit={handleSubmit} noValidate>
                {/* Step Indicator */}
                <div className="step-indicator">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(stepNumber => (
                        <div
                            key={stepNumber}
                            className={`step ${currentStep === stepNumber ? 'active' : ''} ${completedSteps.has(stepNumber) ? 'completed' : ''
                                } ${canProceedToStep(stepNumber) || stepNumber <= currentStep ? 'clickable' : 'disabled'}`}
                            onClick={() => handleStepClick(stepNumber)}
                        >
                            <div className="step-circle">
                                {completedSteps.has(stepNumber) ? '✓' : stepNumber}
                            </div>
                            <span className="step-label">
                                {stepNumber === 1 && (t('car.edit.step.basicLabel') || 'Vehicle Info')}
                                {stepNumber === 2 && (t('car.edit.step.detailsLabel') || 'Details')}
                                {stepNumber === 3 && (t('car.edit.step.imagesLabel') || 'Images')}
                                {stepNumber === 4 && (t('car.edit.step.legalLabel') || 'Legal')}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="form-content">
                    {renderStepContent()}
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <div className="actions-left">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handlePrevious}
                                disabled={isSubmitting}
                            >
                                {t('common.previous') || 'Previous'}
                            </button>
                        )}
                    </div>

                    <div className="actions-center">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel') || 'Cancel'}
                        </button>
                    </div>

                    <div className="actions-right">
                        {currentStep < totalSteps ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={!canProceedToStep(currentStep) || isSubmitting}
                            >
                                {t('common.next') || 'Next'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="spinner"></div>
                                        {t('car.edit.updating') || 'Updating...'}
                                    </>
                                ) : (
                                    t('car.edit.updateCar') || 'Update Vehicle'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditCar;