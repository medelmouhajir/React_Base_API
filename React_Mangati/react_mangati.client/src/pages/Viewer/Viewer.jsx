// src/pages/Viewer/Viewer.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import pageService from '../../services/pageService';
import './Viewer.css';

const Viewer = () => {
    const { id } = useParams(); // chapterId
    const [pages, setPages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState('horizontal'); // horizontal | vertical | infinite
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const response = await pageService.getByChapterId(id);
                const sorted = response.data.sort((a, b) => a.order - b.order);
                setPages(sorted);
            } catch (err) {
                console.error('Failed to fetch pages', err);
            }
        };

        fetchPages();
    }, [id]);

    const next = () => {
        if (currentIndex < pages.length - 1) setCurrentIndex((i) => i + 1);
    };

    const prev = () => {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setCurrentIndex(0);
    };

    const renderHorizontal = () => (
        <div className="viewer-horizontal">
            <button onClick={prev} disabled={currentIndex === 0} className="nav-btn left">←</button>
            <img src={'http://localhost:5229/' + pages[currentIndex].imageUrl} alt={`Page ${currentIndex + 1}`} />
            <button onClick={next} disabled={currentIndex === pages.length - 1} className="nav-btn right">→</button>
        </div>
    );

    const renderVertical = () => (
        <div className="viewer-vertical">
            <button onClick={prev} disabled={currentIndex === 0} className="nav-btn top">↑</button>
            <img src={'http://localhost:5229/' + pages[currentIndex].imageUrl} alt={`Page ${currentIndex + 1}`} />
            <button onClick={next} disabled={currentIndex === pages.length - 1} className="nav-btn bottom">↓</button>
        </div>
    );

    const renderInfinite = () => {
        const width = pages[0]?.imageUrl ? undefined : '100%';
        return (
            <div className="viewer-infinite">
                {pages.map((page, i) => (
                    <img
                        key={i}
                        src={'http://localhost:5229/' + page.imageUrl}
                        alt={`Page ${i + 1}`}
                        style={{ width: width }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={`viewer-container ${theme}`}>
            <div className="viewer-toolbar">
                <button onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
                <button onClick={() => changeMode('horizontal')}>Horizontal</button>
                <button onClick={() => changeMode('vertical')}>Vertical</button>
                <button onClick={() => changeMode('infinite')}>Infinite</button>
            </div>

            {pages.length === 0 ? (
                <p className="viewer-empty">No pages found.</p>
            ) : (
                <>
                    {mode === 'horizontal' && renderHorizontal()}
                    {mode === 'vertical' && renderVertical()}
                    {mode === 'infinite' && renderInfinite()}
                </>
            )}
        </div>
    );
};

export default Viewer;
