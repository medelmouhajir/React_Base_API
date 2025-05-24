// src/pages/Viewer/Viewer.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import chapterService from '../../services/chapterService';
import './Viewer.css';

const Viewer = () => {
  const { id } = useParams(); // chapterId
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState('vertical'); // horizontal | vertical | infinite
  const [viewerWidth, setViewerWidth] = useState(800);
  const [loading, setLoading] = useState(true);
  const [zoomIndicatorVisible, setZoomIndicatorVisible] = useState(false);
  const contentRef = useRef(null);
  const hammerRef = useRef(null);
  const zoomTimeout = useRef(null);
  
  const MIN_WIDTH = 400;
  const MAX_WIDTH = 1600;
  const ZOOM_STEP = 100;
  
  // Fetch chapter and pages data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch chapter details
        const chapterResponse = await chapterService.getById(id);
        setChapter(chapterResponse.data);
        
        // Fetch pages for this chapter
        const pagesResponse = await pageService.getByChapterId(id);
        const sortedPages = pagesResponse.data.sort((a, b) => a.order - b.order);
        setPages(sortedPages);
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Set up touch gestures
  useEffect(() => {
    if (!contentRef.current || pages.length === 0 || mode === 'infinite') return;
    
    // Only import Hammer.js when we need it (dynamic import)
    const setupHammer = async () => {
      try {
        const Hammer = (await import('hammerjs')).default;
        
        if (hammerRef.current) {
          hammerRef.current.destroy();
        }
        
        hammerRef.current = new Hammer(contentRef.current);
        hammerRef.current.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
        
        hammerRef.current.on('swipeleft', () => {
          if (currentIndex < pages.length - 1) {
            setCurrentIndex(prev => prev + 1);
          }
        });
        
        hammerRef.current.on('swiperight', () => {
          if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
          }
        });
      } catch (err) {
        console.error('Error setting up Hammer.js:', err);
      }
    };
    
    setupHammer();
    
    // Cleanup function
    return () => {
      if (hammerRef.current) {
        hammerRef.current.destroy();
        hammerRef.current = null;
      }
    };
  }, [contentRef, pages, currentIndex, mode]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'infinite') return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentIndex < pages.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, pages, mode]);
  
  // Zoom functions
  const zoomIn = () => {
    setViewerWidth(prev => Math.min(prev + ZOOM_STEP, MAX_WIDTH));
    showZoomIndicator();
  };
  
  const zoomOut = () => {
    setViewerWidth(prev => Math.max(prev - ZOOM_STEP, MIN_WIDTH));
    showZoomIndicator();
  };
  
  const resetZoom = () => {
    setViewerWidth(800);
    showZoomIndicator();
  };
  
  const showZoomIndicator = () => {
    setZoomIndicatorVisible(true);
    
    if (zoomTimeout.current) {
      clearTimeout(zoomTimeout.current);
    }
    
    zoomTimeout.current = setTimeout(() => {
      setZoomIndicatorVisible(false);
    }, 1500);
  };
  
  // Navigation
  const goToNextPage = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const goToFirstPage = () => {
    setCurrentIndex(0);
  };
  
  const goToLastPage = () => {
    setCurrentIndex(pages.length - 1);
  };
  
  // Handle mode change
  const handleModeChange = (e) => {
    setMode(e.target.value);
    if (e.target.value === 'infinite') {
      // When switching to infinite, reset current index
      setCurrentIndex(0);
    }
  };
  
  // Get current progress
  const getProgress = () => {
    if (pages.length === 0) return '0/0';
    return `${currentIndex + 1}/${pages.length}`;
  };
  
  // Render functions for different modes
  const renderHorizontalMode = () => (
    <div className="horizontal-mode">
      <button 
        className="nav-button prev" 
        onClick={goToPrevPage} 
        disabled={currentIndex === 0}
      >
        ‹
      </button>
      
      {pages.length > 0 && (
        <img 
          src={`${import.meta.env.VITE_API_URL}${pages[currentIndex].imageUrl}`} 
          alt={`Page ${currentIndex + 1}`} 
          className="manga-page"
          style={{ maxWidth: `${viewerWidth}px` }}
        />
      )}
      
      <button 
        className="nav-button next" 
        onClick={goToNextPage} 
        disabled={currentIndex === pages.length - 1}
      >
        ›
      </button>
    </div>
  );
  
  const renderVerticalMode = () => (
    <div className="vertical-mode">
      <button 
        className="nav-button prev" 
        onClick={goToPrevPage} 
        disabled={currentIndex === 0}
      >
        ‹
      </button>
      
      {pages.length > 0 && (
        <img 
          src={`${import.meta.env.VITE_API_URL}${pages[currentIndex].imageUrl}`} 
          alt={`Page ${currentIndex + 1}`} 
          className="manga-page" 
        />
      )}
      
      <button 
        className="nav-button next" 
        onClick={goToNextPage} 
        disabled={currentIndex === pages.length - 1}
      >
        ›
      </button>
    </div>
  );
  
  const renderInfiniteMode = () => (
    <div className="infinite-mode">
      {pages.map((page, index) => (
        <img 
          key={page.id} 
          src={`${import.meta.env.VITE_API_URL}${page.imageUrl}`} 
          alt={`Page ${index + 1}`} 
          className="manga-page" 
        />
      ))}
    </div>
  );
  
  if (loading) {
    return (
      <div className="manga-viewer">
        <div className="viewer-toolbar">
          <button className="toolbar-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className="chapter-title">Loading chapter...</h2>
        </div>
        <div className="loader">
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="manga-viewer">
      {/* Toolbar */}
      <div className="viewer-toolbar">
        <button className="toolbar-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        <h2 className="chapter-title">
          {chapter ? `Chapter ${chapter.number}: ${chapter.title}` : 'Chapter'}
        </h2>
        
        <div className="toolbar-divider"></div>
        
        <div className="select-wrapper">
          <select 
            className="mode-select" 
            value={mode} 
            onChange={handleModeChange}
          >
            <option value="vertical">Vertical Mode</option>
            <option value="horizontal">Horizontal Mode</option>
            <option value="infinite">Infinite Scroll</option>
          </select>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <button className="toolbar-button" onClick={zoomOut}>
          -
        </button>
        <button className="toolbar-button" onClick={resetZoom}>
          100%
        </button>
        <button className="toolbar-button" onClick={zoomIn}>
          +
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button className="toolbar-button" onClick={goToFirstPage} disabled={mode === 'infinite' || currentIndex === 0}>
          ⟪ First
        </button>
        <button className="toolbar-button" onClick={goToPrevPage} disabled={mode === 'infinite' || currentIndex === 0}>
          ⟨ Prev
        </button>
        
        {mode !== 'infinite' && (
          <span className="toolbar-button" style={{ cursor: 'default' }}>
            {getProgress()}
          </span>
        )}
        
        <button className="toolbar-button" onClick={goToNextPage} disabled={mode === 'infinite' || currentIndex === pages.length - 1}>
          Next ⟩
        </button>
        <button className="toolbar-button" onClick={goToLastPage} disabled={mode === 'infinite' || currentIndex === pages.length - 1}>
          Last ⟫
        </button>
      </div>
      
      {/* Content Area with Touch Support */}
      <div 
        className="viewer-content" 
        ref={contentRef}
        style={{ '--viewer-width': `${viewerWidth}px` }}
      >
        {pages.length === 0 ? (
          <p>No pages found for this chapter.</p>
        ) : (
          <>
            {mode === 'horizontal' && renderHorizontalMode()}
            {mode === 'vertical' && renderVerticalMode()}
            {mode === 'infinite' && renderInfiniteMode()}
          </>
        )}
      </div>
      
      {/* Zoom Indicator */}
      <div className={`zoom-indicator ${zoomIndicatorVisible ? 'visible' : ''}`}>
        Zoom: {Math.round((viewerWidth / 800) * 100)}%
      </div>
    </div>
  );
};

export default Viewer;