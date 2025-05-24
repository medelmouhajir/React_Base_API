import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import chapterService from '../../services/chapterService';
import apiClient from '../../services/apiClient';
import './SerieDetails.css';

const SerieDetails = ({ userId }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [serie, setSerie] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newChapter, setNewChapter] = useState({ title: '', number: 1 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const serieRes = await apiClient.get(`/Serie/${id}`);
                const chapterRes = await chapterService.getBySerieId(id);
                setSerie(serieRes.data);
                setChapters(chapterRes.data);

                const maxNumber = Math.max(...chapterRes.data.map(ch => ch.number), 0);
                setNewChapter((prev) => ({ ...prev, number: maxNumber + 1 }));
            } catch (err) {
                console.error('Error fetching data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleAddChapter = async () => {
        try {
            await chapterService.create({
                ...newChapter,
                serieId: serie.id,
                uploadedAt: new Date().toISOString(),
            });
            setShowModal(false);
            window.location.reload();
        } catch (err) {
            console.error('Failed to create chapter', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewChapter({ ...newChapter, [name]: value });
    };

    const handleRemove = async (chapterId) => {
        if (window.confirm('Are you sure you want to delete this chapter?')) {
            try {
                await chapterService.delete(chapterId);
                setChapters(chapters.filter(ch => ch.id !== chapterId));
            } catch (err) {
                console.error('Failed to delete chapter', err);
            }
        }
    };

    if (loading) return <div className="serie-details">Loading...</div>;
    if (!serie) return <div className="serie-details">Serie not found.</div>;

    const isAuthor = userId === serie.authorId;

    return (
        <div className="serie-details">
            <div className="serie-header">
                <img className="serie-cover" src={'http://localhost:5229/' + serie.coverImageUrl} alt={serie.title} />
                <div className="serie-meta">
                    <h1>{serie.title}</h1>
                    <p>{serie.synopsis}</p>
                    <span className={`status ${serie.status.toLowerCase()}`}>
                        {serie.status}
                    </span>
                    {isAuthor && (
                        <button className="add-btn" onClick={() => setShowModal(true)}>
                            + Add Chapter
                        </button>
                    )}
                </div>
            </div>

            <div className="chapter-section">
                <h2>Chapters</h2>
                <ul className="chapter-list">
                    {chapters.map((chapter) => (
                        <li key={chapter.id} className="chapter-item">
                            <div>
                                <strong>#{chapter.number} - {chapter.title}</strong>
                                <span>{new Date(chapter.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            {isAuthor && (
                                <div className="chapter-actions">
                                    <button onClick={() => navigate(`/series/${id}/chapters/${chapter.id}`)}>Details</button>
                                    <button onClick={() => navigate(`/viewer/${chapter.id}`)}>View</button>
                                    <button onClick={() => navigate(`/series/${id}/chapters/${chapter.id}/edit`)}>Edit</button>
                                    <button onClick={() => navigate(`/ai/chapters/${chapter.id}`)}>Edit with AI</button>
                                    <button className="danger" onClick={() => handleRemove(chapter.id)}>Remove</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Add New Chapter</h3>
                        <input
                            type="text"
                            name="title"
                            placeholder="Chapter Title"
                            value={newChapter.title}
                            onChange={handleInputChange}
                        />
                        <input
                            type="number"
                            name="number"
                            placeholder="Chapter Number"
                            value={newChapter.number}
                            onChange={handleInputChange}
                        />
                        <div className="modal-buttons">
                            <button onClick={handleAddChapter}>Add</button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SerieDetails;
