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
    // Mock data for businesses in Fes, Morocco
    const mockBusinesses = [
        {
            id: '1',
            name: 'Restaurant Al Fassia',
            description: 'Traditional Moroccan cuisine in the heart of Fes medina',
            latitude: 34.0622,
            longitude: -6.7636,
            phone: '+212 535 123 456',
            email: 'contact@alfassia.ma'
        },
        {
            id: '2',
            name: 'Riad Fes Heritage',
            description: 'Luxury accommodation with authentic Moroccan architecture',
            latitude: 34.0722,
            longitude: -6.7736,
            phone: '+212 535 789 012',
            email: 'info@riadfeheritage.com'
        },
        {
            id: '3',
            name: 'Artisan Carpet Workshop',
            description: 'Traditional carpet weaving and handcrafted textiles',
            latitude: 34.0422,
            longitude: -6.7836,
            phone: '+212 535 345 678',
            email: 'workshop@carpets-fes.ma'
        }
    ];

    // Mock route for medina tour
    const mockRoutes = [
        {
            id: 'medina-tour',
            coordinates: [
                [34.0622, -6.7636],
                [34.0722, -6.7736],
                [34.0422, -6.7836],
                [34.0522, -6.7636]
            ],
            color: '#0ea5e9',
            weight: 4,
            opacity: 0.8
        }
    ];

    // FIXED: Mock markers with unique IDs and proper coordinate structure
    const mockMarkers = [
        {
            id: 'tour-start-1', // Fixed: Unique ID matching your mention of "tour-start-1"
            latitude: 34.0622,  // Fixed: Use 'latitude' instead of 'lat' to match DTO structure
            longitude: -6.7636, // Fixed: Use 'longitude' instead of 'lng' to match DTO structure
            name: 'Medina Tour Starting Point',
            type: 'tour',
            color: '#f97316',
            popup: 'Start your virtual tour of Fes medina here',
            // Additional properties to match EventDto structure if needed
            description: 'Starting point for the virtual medina tour experience',
            address: 'Medina, Fes, Morocco'
        }
    ];

    const handleLocationSelect = (location) => {
        console.log('Location selected:', location);
        // You can add more logic here later
    };

    const handleSearchResult = (results) => {
        console.log('Search results:', results);
        // You can add more logic here later
    };

    return (
        <Routes>
            {/* Default route redirects to home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Home page with map layout */}
            <Route
                path="/home"
                element={
                    <MapLayout
                        businesses={mockBusinesses}
                        routes={mockRoutes}
                        markers={mockMarkers}
                        onLocationSelect={handleLocationSelect}
                        onSearchResult={handleSearchResult}
                        defaultCenter={[34.0522, -6.7736]} // Fes, Morocco coordinates
                        defaultZoom={13}
                    >
                        <HomePage />
                    </MapLayout>
                }
            />

            {/* Main layout */}
            <Route
                path="/myspace"
                element={
                    <MainLayout>
                        <HomePage />
                    </MainLayout>
                }
            />

            {/* Businesses management */}
            <Route
                path="/myspace/businesses"
                element={
                    <MainLayout>
                        <BusinessesList />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/businesses/add"
                element={
                    <MainLayout>
                        <BusinessesAdd />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/businesses/:id"
                element={
                    <MainLayout>
                        <BusinessesDetails />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/businesses/tags"
                element={
                    <MainLayout>
                        <BusinessesTags />
                    </MainLayout>
                }
            />

            {/* Tours management */}
            <Route
                path="/myspace/tours"
                element={
                    <MainLayout>
                        <ToursList />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/tours/add"
                element={
                    <MainLayout>
                        <ToursAdd />
                    </MainLayout>
                }
            />

            {/* Events management */}
            <Route
                path="/myspace/events"
                element={
                    <MainLayout>
                        <EventsList />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/events/add"
                element={
                    <MainLayout>
                        <EventsAdd />
                    </MainLayout>
                }
            />
            <Route
                path="/myspace/events/categories"
                element={
                    <MainLayout>
                        <EventsCategories />
                    </MainLayout>
                }
            />
        </Routes>
    );
};

export default AppRoutes;