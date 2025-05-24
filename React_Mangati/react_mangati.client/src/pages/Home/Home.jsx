// src/pages/Home/Home.jsx
import { useEffect } from 'react';
import './Home.css';

const Home = () => {
    useEffect(() => {
        document.title = 'Home - Mangati';
    }, []);

    return (
        <div className="home">
            <section className="home__hero">
                <div className="home__hero-content">
                    <h1 className="home__title">Welcome to Mangati</h1>
                    <p className="home__subtitle">Create and publish your own manhwa or manga — no drawing skills needed!</p>
                    <button className="home__cta">Get Started</button>
                </div>
            </section>

            <section className="home__features">
                <h2 className="home__section-title">Features</h2>
                <div className="home__feature-list">
                    <div className="home__feature">
                        <h3>Create Characters</h3>
                        <p>Design unique characters with our AI-powered tools.</p>
                    </div>
                    <div className="home__feature">
                        <h3>Build Scenes</h3>
                        <p>Choose your backgrounds and positions easily using our layout builder.</p>
                    </div>
                    <div className="home__feature">
                        <h3>Export & Share</h3>
                        <p>Export your chapters and share them with the world or embed them into your website.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
