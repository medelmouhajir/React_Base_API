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
        HourlyRate: '',
        Gear_Type: 0, // Manual = 0, Automatic = 1
        Engine_Type: 0, // Gasoline = 0, Diesel = 1, Electric = 2, Hybrid = 3
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

    // Gear Type options
    const gearTypeOptions = [
        { value: 0, label: t('car.gearType.manual') },
        { value: 1, label: t('car.gearType.automatic') },
    ];

    // Engine Type options
    const engineTypeOptions = [
        { value: 0, label: t('car.engineType.gasoline') },
        { value: 1, label: t('car.engineType.diesel') },
        { value: 2, label: t('car.engineType.electric') },
        { value: 3, label: t('car.engineType.hybrid') },
    ];

    // Color options
    const colorOptions = [
        { value: 'white', label: t('car.colors.white'), hex: '#FFFFFF' },
        { value: 'black', label: t('car.colors.black'), hex: '#000000' },
        { value: 'silver', label: t('car.colors.silver'), hex: '#C0C0C0' },
        { value: 'gray', label: t('car.colors.gray'), hex: '#808080' },
        { value: 'red', label: t('car.colors.red'), hex: '#FF0000' },
        { value: 'blue', label: t('car.colors.blue'), hex: '#0000FF' },
        { value: 'green', label: t('car.colors.green'), hex: '#008000' },
        { value: 'yellow', label: t('car.colors.yellow'), hex: '#FFFF00' },
        { value: 'orange', label: t('car.colors.orange'), hex: '#FFA500' },
        { value: 'brown', label: t('car.colors.brown'), hex: '#8B4513' },
    ];

    // Fetch filter data on component mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [manufacturersData, modelsData, yearsData] = await Promise.all([
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);

                setManufacturers(manufacturersData);
                setModels(modelsData);
                setYears(yearsData);
            } catch (err) {
                console.error('❌ Error fetching filters:', err);
                setError(t('car.add.fetchError'));
            }
        };

        fetchFilters();
    }, [t]);

    // Filter models when manufacturer changes
    useEffect(() => {
        if (formData.ManufacturerId) {
            const filtered = models.filter(
                model => model.manufacturerId === formData.ManufacturerId
            );
            setFilteredModels(filtered);

            // Reset model selection if current selection doesn't belong to the selected manufacturer
            const currentModelBelongsToManufacturer = filtered.some(
                model => model.id === formData.Car_ModelId
            );

            if (!currentModelBelongsToManufacturer) {
                setFormData(prev => ({
                    ...prev,
                    Car_ModelId: '',
                }));
            }
        } else {
            setFilteredModels([]);
        }
    }, [formData.ManufacturerId, models]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) : value,
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(file => !validTypes.includes(file.type));

        if (invalidFiles.length > 0) {
            setError(t('car.add.invalidImageFormat'));
            return;
        }

        // Validate file sizes (max 5MB per file)
        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(t('car.add.imageTooLarge'));
            return;
        }

        // Clear any previous errors
        setError(null);

        // Update selected images
        const newImages = [...selectedImages, ...files];
        setSelectedImages(newImages);

        // Create preview URLs
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(imagePreviewUrls[index]);

        setSelectedImages(newImages);
        setImagePreviewUrls(newPreviewUrls);

        // Adjust main image index if necessary
        if (mainImageIndex >= newImages.length && newImages.length > 0) {
            setMainImageIndex(newImages.length - 1);
        } else if (newImages.length === 0) {
            setMainImageIndex(0);
        }
    };

    const setMainImage = (index) => {
        setMainImageIndex(index);
    };

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
            setError(t('car.add.requiredFields'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Create car data as JSON (matching CreateCarDto)
            const carPayload = {
                AgencyId: agencyId,
                Car_ModelId: formData.Car_ModelId,
                Car_YearId: parseInt(formData.Car_YearId, 10),
                LicensePlate: formData.LicensePlate,
                Color: formData.Color,
                DailyRate: parseFloat(formData.DailyRate),
                HourlyRate: formData.HourlyRate ? parseFloat(formData.HourlyRate) : null,
                Gear_Type: parseInt(formData.Gear_Type, 10),
                Engine_Type: parseInt(formData.Engine_Type, 10),
                Images: null // Images will be uploaded separately
            };

            // Create the car first
            const response = await carService.create(carPayload);
            const carId = response.id;

            // Upload images if any are selected
            if (selectedImages.length > 0) {
                try {
                    for (let i = 0; i < selectedImages.length; i++) {
                        const image = selectedImages[i];
                        const formData = new FormData();
                        formData.append('file', image);
                        formData.append('carId', carId);

                        // Upload each image using the car attachments endpoint
                        await carAttachmentService.uploadFile(carId, formData);
                    }
                } catch (imageError) {
                    console.warn('⚠️ Car created but image upload failed:', imageError);
                    // Continue to navigate even if image upload fails
                }
            }

            // Navigate to car details using the ID from response
            navigate(`/cars/${carId}`);
        } catch (err) {
            console.error('❌ Error adding car:', err);
            setError(t('car.add.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Cleanup preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        navigate('/cars');
    };

    // Helper to check if a field is invalid
    const isFieldInvalid = (fieldName) => {
        if (!touched[fieldName]) return false;

        const requiredFields = ['ManufacturerId', 'Car_ModelId', 'Car_YearId', 'LicensePlate', 'DailyRate'];
        if (requiredFields.includes(fieldName) && !formData[fieldName]) {
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

    return (
        <div className={`addcar-container ${isDarkMode ? 'dark' : 'light'}`}>
            <div className="addcar-header">
                <h1 className="addcar-title">{t('car.list.addCar')}</h1>
                <div className="addcar-subtitle">{t('car.add.subtitle')}</div>
            </div>

            {error && <div className="addcar-error" role="alert">{error}</div>}

            <form className="addcar-form" onSubmit={handleSubmit} noValidate>
                {/* Vehicle Information Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('car.add.vehicleInfo')}</h2>

                    {/* Two-column layout for larger screens */}
                    <div className="form-row">
                        {/* Manufacturer Select */}
                        <div className={`form-group ${isFieldInvalid('ManufacturerId') ? 'form-group-error' : ''}`}>
                            <label htmlFor="ManufacturerId">{t('car.fields.manufacturer')} *</label>
                            <select
                                id="ManufacturerId"
                                name="ManufacturerId"
                                value={formData.ManufacturerId}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className={isFieldInvalid('ManufacturerId') ? 'input-error' : ''}
                            >
                                <option value="">{t('car.placeholders.selectManufacturer')}</option>
                                {manufacturers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                            {isFieldInvalid('ManufacturerId') && (
                                <div className="error-message">{t('car.validation.manufacturerRequired')}</div>
                            )}
                        </div>

                        {/* Model Select */}
                        <div className={`form-group ${isFieldInvalid('Car_ModelId') ? 'form-group-error' : ''}`}>
                            <label htmlFor="Car_ModelId">{t('car.fields.model')} *</label>
                            <select
                                id="Car_ModelId"
                                name="Car_ModelId"
                                value={formData.Car_ModelId}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                disabled={!formData.ManufacturerId}
                                className={isFieldInvalid('Car_ModelId') ? 'input-error' : ''}
                            >
                                <option value="">{t('car.placeholders.selectModel')}</option>
                                {filteredModels.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                            {isFieldInvalid('Car_ModelId') && (
                                <div className="error-message">{t('car.validation.modelRequired')}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        {/* Year Select */}
                        <div className={`form-group ${isFieldInvalid('Car_YearId') ? 'form-group-error' : ''}`}>
                            <label htmlFor="Car_YearId">{t('car.fields.year')} *</label>
                            <select
                                id="Car_YearId"
                                name="Car_YearId"
                                value={formData.Car_YearId}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className={isFieldInvalid('Car_YearId') ? 'input-error' : ''}
                            >
                                <option value="">{t('car.placeholders.selectYear')}</option>
                                {years.map((y) => (
                                    <option key={y.id} value={y.id}>
                                        {y.yearValue}
                                    </option>
                                ))}
                            </select>
                            {isFieldInvalid('Car_YearId') && (
                                <div className="error-message">{t('car.validation.yearRequired')}</div>
                            )}
                        </div>

                        {/* Color Select */}
                        <div className="form-group">
                            <label htmlFor="Color">{t('car.fields.color')}</label>
                            <div className="color-selector">
                                <select
                                    id="Color"
                                    name="Color"
                                    value={formData.Color}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="">{t('car.placeholders.selectColor')}</option>
                                    {colorOptions.map((color) => (
                                        <option key={color.value} value={color.value}>
                                            {color.label}
                                        </option>
                                    ))}
                                </select>
                                {formData.Color && (
                                    <div
                                        className="color-indicator"
                                        style={{
                                            backgroundColor: colorOptions.find(c => c.value === formData.Color)?.hex
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        {/* Gear Type */}
                        <div className="form-group">
                            <label htmlFor="Gear_Type">{t('car.fields.gearType')}</label>
                            <select
                                id="Gear_Type"
                                name="Gear_Type"
                                value={formData.Gear_Type}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                {gearTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Engine Type */}
                        <div className="form-group">
                            <label htmlFor="Engine_Type">{t('car.fields.engineType')}</label>
                            <select
                                id="Engine_Type"
                                name="Engine_Type"
                                value={formData.Engine_Type}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                {engineTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Registration & Details Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('car.add.registrationDetails')}</h2>

                    {/* License Plate */}
                    <div className={`form-group ${isFieldInvalid('LicensePlate') ? 'form-group-error' : ''}`}>
                        <label htmlFor="LicensePlate">{t('car.fields.licensePlate')} *</label>
                        <input
                            type="text"
                            id="LicensePlate"
                            name="LicensePlate"
                            placeholder={t('car.placeholders.licensePlate')}
                            value={formData.LicensePlate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            className={`license-plate-input ${isFieldInvalid('LicensePlate') ? 'input-error' : ''}`}
                        />
                        {isFieldInvalid('LicensePlate') && (
                            <div className="error-message">{t('car.validation.licensePlateRequired')}</div>
                        )}
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('car.add.pricing')}</h2>

                    <div className="form-row">
                        {/* Daily Rate */}
                        <div className={`form-group ${isFieldInvalid('DailyRate') ? 'form-group-error' : ''}`}>
                            <label htmlFor="DailyRate">{t('car.fields.dailyRate')} *</label>
                            <div className="input-group">
                                <span className="input-prefix">MAD</span>
                                <input
                                    type="number"
                                    id="DailyRate"
                                    name="DailyRate"
                                    placeholder={t('car.placeholders.dailyRate')}
                                    value={formData.DailyRate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    min="0"
                                    step="0.01"
                                    className={isFieldInvalid('DailyRate') ? 'input-error' : ''}
                                />
                            </div>
                            {isFieldInvalid('DailyRate') && (
                                <div className="error-message">{t('car.validation.dailyRateRequired')}</div>
                            )}
                        </div>

                        {/* Hourly Rate */}
                        <div className="form-group">
                            <label htmlFor="HourlyRate">{t('car.fields.hourlyRate')} ({t('common.optional')})</label>
                            <div className="input-group">
                                <span className="input-prefix">MAD</span>
                                <input
                                    type="number"
                                    id="HourlyRate"
                                    name="HourlyRate"
                                    placeholder={t('car.placeholders.hourlyRate')}
                                    value={formData.HourlyRate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('car.add.images')}</h2>
                    <p className="section-description">{t('car.add.imagesDescription')}</p>

                    {/* Image Upload */}
                    <div className="image-upload-section">
                        <label htmlFor="carImages" className="image-upload-label">
                            <div className="image-upload-area">
                                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>{t('car.add.uploadImages')}</span>
                                <small>{t('car.add.imageFormats')}</small>
                            </div>
                        </label>
                        <input
                            type="file"
                            id="carImages"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Image Previews */}
                    {selectedImages.length > 0 && (
                        <div className="image-previews">
                            <h3>{t('car.add.selectedImages')}</h3>
                            <div className="image-grid">
                                {imagePreviewUrls.map((url, index) => (
                                    <div key={index} className={`image-preview ${index === mainImageIndex ? 'main-image' : ''}`}>
                                        <img src={url} alt={`Preview ${index + 1}`} />
                                        <div className="image-actions">
                                            <button
                                                type="button"
                                                onClick={() => setMainImage(index)}
                                                className={`set-main-btn ${index === mainImageIndex ? 'active' : ''}`}
                                                title={t('car.add.setMainImage')}
                                            >
                                                {index === mainImageIndex ? '★' : '☆'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="remove-image-btn"
                                                title={t('car.add.removeImage')}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        {index === mainImageIndex && (
                                            <div className="main-image-badge">{t('car.add.mainImage')}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner-small"></div>
                                {t('car.add.creating')}
                            </>
                        ) : (
                            t('car.add.createCar')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCar;