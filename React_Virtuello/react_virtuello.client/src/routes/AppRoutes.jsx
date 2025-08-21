import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MapLayout from '../components/layouts/MapLayout/Layout/MapLayout';
import MainLayout from '../components/layouts/MainLayout/Layout/MainLayout';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import BusinessesList from '../pages/Main/Businesses/List/BusinessesList';
import BusinessesAdd from '../pages/Main/Businesses/Add/BusinessesAdd';
import BusinessesDetails from '../pages/Main/Businesses/Details/BusinessesDetails';
import BusinessesTags from '../pages/Main/Businesses/Tags/BusinessesTags';

import ToursList from '../pages/Main/Tours/List/ToursList';
import ToursAdd from '../pages/Main/Tours/Add/ToursAdd';

import EventsList from '../pages/Main/Events/List/EventsList';
import EventsAdd from '../pages/Main/Events/Add/EventsAdd';
import EventsCategories from '../pages/Main/Events/Categories/EventsCategories';

// Simple HomePage component
const HomePage = () => (
    <div style={{
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        margin: '20px',
        textAlign: 'center'
    }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
            Welcome to Virtuello
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
            Explore virtual tours and businesses in Fes, Morocco
        </p>
    </div>
);

const AppRoutes = () => {
    return (
        <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Map Route - Clean without any data injection */}
            <Route
                path="/map"
                element={
                    <MapLayout
                        defaultCenter={[34.0622, -6.7636]} // Fes, Morocco coordinates
                        defaultZoom={13}
                        showControls={true}
                        enableGeolocation={true}
                    />
                }
            />

            {/* Main Layout Routes */}
            <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />

                {/* Business Routes */}
                <Route path="businesses">
                    <Route index element={<BusinessesList />} />
                    <Route path="add" element={<BusinessesAdd />} />
                    <Route path=":id" element={<BusinessesDetails />} />
                    <Route path="tags" element={<BusinessesTags />} />
                </Route>

                {/* Tour Routes */}
                <Route path="tours">
                    <Route index element={<ToursList />} />
                    <Route path="add" element={<ToursAdd />} />
                </Route>

                {/* Event Routes */}
                <Route path="events">
                    <Route index element={<EventsList />} />
                    <Route path="add" element={<EventsAdd />} />
                    <Route path="categories" element={<EventsCategories />} />
                </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;