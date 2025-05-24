// src/pages/Series/Create.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Serie_Status } from '../../utils/enums';
import { toast } from 'react-toastify';
import serieService from '../../services/serieService';
import './Create.css';

const CreateSerie = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        status: Serie_Status.Ongoing,
    });
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setCoverImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const serieData = { ...formData, coverImage };
            await serieService.create(serieData);
            toast.success(t('series.create.success'));
            navigate('/series');
        } catch (err) {
            console.error(err);
            toast.error(t('series.create.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="serie-create">
            <h1>{t('series.create.title')}</h1>
            <form onSubmit={handleSubmit} className="serie-form">
                <label>{t('series.fields.title')}</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />

                <label>{t('series.fields.synopsis')}</label>
                <textarea
                    name="synopsis"
                    value={formData.synopsis}
                    onChange={handleChange}
                ></textarea>

                <label>{t('series.fields.status')}</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value={Serie_Status.Ongoing}>{t('series.status.ongoing')}</option>
                    <option value={Serie_Status.Completed}>{t('series.status.completed')}</option>
                    <option value={Serie_Status.Canceled}>{t('series.status.canceled')}</option>
                </select>

                <label>{t('series.fields.coverImage')}</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />

                <button type="submit" disabled={loading}>
                    {loading ? t('common.loading') : t('series.create.submit')}
                </button>
            </form>
        </div>
    );
};

export default CreateSerie;
