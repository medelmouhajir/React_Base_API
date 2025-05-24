// src/pages/Chapters/ChapterEdit.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import pageService from '../../services/pageService';
import apiClient from '../../services/apiClient';
import './ChapterEdit.css';

const ChapterEdit = () => {
    const { id } = useParams(); // chapterId
    const [pages, setPages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const response = await pageService.getByChapterId(id);
                setPages(response.data.sort((a, b) => a.order - b.order));
            } catch (err) {
                console.error('Error fetching pages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPages();
    }, [id]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));

        try {
            const response = await pageService.upload(id, formData);
            setPages(prev => [...prev, ...response.data].sort((a, b) => a.order - b.order));
        } catch (err) {
            console.error('Upload failed', err);
        }
    };

    const handleRemove = async (pageId) => {
        if (window.confirm('Delete this page?')) {
            await pageService.delete(pageId);
            setPages(prev => prev.filter(p => p.id !== pageId));
        }
    };

    const move = (index, direction) => {
        const newPages = [...pages];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newPages.length) return;
        [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
        setPages(newPages);
    };

    const handleSaveOrder = async () => {
        try {
            await pageService.reorder(pages.map((p, index) => ({ id: p.id, order: index + 1 })));
            alert("Order saved!");
        } catch (err) {
            console.error('Reorder failed:', err);
        }
    };

    return (
        <div className="chapter-edit">
            <h2>Edit Chapter Pages</h2>
            {loading ? <p>Loading...</p> : (
                <>
                    <div className="upload-section">
                        <label htmlFor="upload" className="upload-label">Upload Pages</label>
                        <input id="upload" type="file" multiple onChange={handleImageUpload} />
                    </div>
                    <ul className="pages-list">
                        {pages.map((page, idx) => (
                            <li key={page.id} className="page-item">
                                <img src={'http://localhost:5229/' + page.imageUrl} alt={`Page ${idx + 1}`} />
                                <div className="actions">
                                    <button onClick={() => move(idx, -1)}>↑</button>
                                    <button onClick={() => move(idx, 1)}>↓</button>
                                    <button onClick={() => handleRemove(page.id)}>🗑</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <button className="save-btn" onClick={handleSaveOrder}>Save Order</button>
                </>
            )}
        </div>
    );
};

export default ChapterEdit;
