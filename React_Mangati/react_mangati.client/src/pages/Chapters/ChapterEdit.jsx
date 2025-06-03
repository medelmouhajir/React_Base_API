import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pageService from '../../services/pageService';
import './ChapterEdit.css';

const ChapterEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams(); // chapterId
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [draggedItem, setDraggedItem] = useState(null);
    const [touchStartIndex, setTouchStartIndex] = useState(null);
    const [orderChanged, setOrderChanged] = useState(false);
    const fileInputRef = useRef(null);

    // Translations for common messages
    const translations = {
        confirmDelete: t('chapter.confirmDelete', 'Delete this page?'),
        successMessage: t('chapter.orderSaved', 'Order saved successfully!'),
        uploadError: t('chapter.uploadFailed', 'Upload failed. Please try again.'),
        deleteError: t('chapter.deleteFailed', 'Delete failed. Please try again.'),
        reorderError: t('chapter.reorderFailed', 'Failed to save order. Please try again.')
    };

    useEffect(() => {
        const fetchPages = async () => {
            try {
                setLoading(true);
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
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('images', file));

        try {
            setUploading(true);
            setUploadProgress(0);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            const response = await pageService.upload(id, formData);
            clearInterval(progressInterval);
            setUploadProgress(100);

            // Add new pages and sort
            setPages(prev => [...prev, ...response.data].sort((a, b) => a.order - b.order));
            setOrderChanged(true);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Hide progress after a short delay
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 1000);

        } catch (err) {
            console.error('Upload failed', err);
            setUploading(false);
            alert(translations.uploadError);
        }
    };

    const handleRemove = async (pageId) => {
        if (window.confirm(translations.confirmDelete)) {
            try {
                await pageService.delete(pageId);
                setPages(prev => prev.filter(p => p.id !== pageId));
                setOrderChanged(true);
            } catch (err) {
                console.error('Delete failed:', err);
                alert(translations.deleteError);
            }
        }
    };

    const move = (index, direction) => {
        const newPages = [...pages];
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= newPages.length) return;

        [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
        setPages(newPages);
        setOrderChanged(true);
    };

    const handleSaveOrder = async () => {
        try {
            setUploading(true);
            console.log(pages.map((p, index) => ({ id: p.id, order: index + 1 })));
            await pageService.reorder(pages.map((p, index) => ({ id: p.id, order: index + 1 })));
            setOrderChanged(false);
            setUploading(false);
            alert(translations.successMessage);
        } catch (err) {
            console.error('Reorder failed:', err);
            setUploading(false);
            alert(translations.reorderError);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        // Make the drag image transparent
        if (e.dataTransfer) {
            const dragImage = new Image();
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(dragImage, 0, 0);
        }

        // Add a class to the dragged element
        setTimeout(() => {
            if (e.target) {
                const element = e.target.closest('.page-item');
                if (element) {
                    element.classList.add('dragging');
                }
            }
        }, 0);
    };

    const handleDragEnd = (e) => {
        if (e.target) {
            const element = e.target.closest('.page-item');
            if (element) {
                element.classList.remove('dragging');
            }
        }
        setDraggedItem(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        // Reorder the list
        const newPages = [...pages];
        const draggedPage = newPages[draggedItem];
        newPages.splice(draggedItem, 1);
        newPages.splice(index, 0, draggedPage);

        setPages(newPages);
        setDraggedItem(index);
        setOrderChanged(true);
    };

    // Touch Handlers for mobile drag and drop
    const handleTouchStart = (index) => {
        setTouchStartIndex(index);
    };

    const handleTouchEnd = () => {
        setTouchStartIndex(null);
    };

    const handleTouchMove = (e, index) => {
        if (touchStartIndex === null || touchStartIndex === index) return;

        // Prevent page scrolling
        e.preventDefault();

        // Handle the actual reordering
        const newPages = [...pages];
        const draggedPage = newPages[touchStartIndex];
        newPages.splice(touchStartIndex, 1);
        newPages.splice(index, 0, draggedPage);

        setPages(newPages);
        setTouchStartIndex(index);
        setOrderChanged(true);
    };

    // Get document direction for RTL support
    const isRTL = i18n.dir() === 'rtl';

    // API URL with proper fallback
    const getImageUrl = (relativePath) => {
        // Check if the path already has a domain
        if (relativePath.startsWith('http')) {
            return relativePath;
        }

        // If not, prepend the API base URL
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5229';
        return `${baseUrl}/${relativePath}`;
    };

    return (
        <div className={`chapter-edit ${isRTL ? 'rtl' : ''}`}>
            <h2>{t('chapter.editPages', 'Edit Chapter Pages')}</h2>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            ) : (
                <>
                    <div className="upload-section">
                        <label htmlFor="upload" className="upload-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {t('chapter.uploadPages', 'Upload Pages')}
                        </label>
                        <input
                            id="upload"
                            type="file"
                            multiple
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            accept="image/*"
                        />

                        {uploading && (
                            <div className="upload-progress">
                                <div
                                    className="upload-progress-bar"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {pages.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="20" rx="5" />
                                <path d="M12 8v8M8 12h8" />
                            </svg>
                            <p>{t('chapter.noPages', 'No pages found. Upload some images to get started.')}</p>
                        </div>
                    ) : (
                        <div className="pages-container">
                            <ul className="pages-list">
                                {pages.map((page, idx) => (
                                    <li
                                        key={page.id}
                                        className="page-item"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onTouchStart={() => handleTouchStart(idx)}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchMove={(e) => handleTouchMove(e, idx)}
                                        aria-label={t('chapter.pageItem', 'Page {{number}}', { number: idx + 1 })}
                                    >
                                        <div className="page-number">{idx + 1}</div>
                                        <img
                                            src={getImageUrl(page.imageUrl)}
                                            alt={t('chapter.pageImageAlt', 'Page {{number}}', { number: idx + 1 })}
                                            loading="lazy"
                                        />
                                        <div className="actions">
                                            <button
                                                className="action-btn up"
                                                onClick={() => move(idx, -1)}
                                                disabled={idx === 0}
                                                aria-label={i18n.dir() === 'rtl' ? t('chapter.moveDown', 'Move down') : t('chapter.moveUp', 'Move up')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                className="action-btn down"
                                                onClick={() => move(idx, 1)}
                                                disabled={idx === pages.length - 1}
                                                aria-label={i18n.dir() === 'rtl' ? t('chapter.moveUp', 'Move up') : t('chapter.moveDown', 'Move down')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleRemove(page.id)}
                                                aria-label={t('chapter.delete', 'Delete')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {orderChanged && (
                                <button
                                    className="save-btn"
                                    onClick={handleSaveOrder}
                                    disabled={uploading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                    {t('chapter.saveOrder', 'Save Order')}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ChapterEdit;