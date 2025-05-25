// src/hooks/useUserData.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import userDataService from '../services/userDataService';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing user data (favorites, reading progress, settings)
 */
export const useUserData = () => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    // Load favorites when user is authenticated
    useEffect(() => {
        if (user) {
            loadFavorites();
        } else {
            setFavorites([]);
        }
    }, [user]);

    // Fetch user's favorites
    const loadFavorites = useCallback(async () => {
        if (!user) return;

        try {
            setLoadingFavorites(true);
            const response = await userDataService.getFavorites();
            setFavorites(response.data);
        } catch (error) {
            console.error('Error loading favorites:', error);
            toast.error('Failed to load favorites');
        } finally {
            setLoadingFavorites(false);
        }
    }, [user]);

    // Check if a serie is in favorites
    const checkFavorite = useCallback(async (serieId) => {
        if (!user) return false;

        try {
            const response = await userDataService.checkFavorite(serieId);
            return response.data.isFavorite;
        } catch (error) {
            console.error('Error checking favorite status:', error);
            return false;
        }
    }, [user]);

    // Add a serie to favorites
    const addFavorite = useCallback(async (serieId) => {
        if (!user) return false;

        try {
            await userDataService.addFavorite(serieId);
            await loadFavorites(); // Refresh favorites list
            toast.success('Added to favorites');
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            if (error.response?.status === 409) {
                toast.info('Already in your favorites');
            } else {
                toast.error('Failed to add to favorites');
            }
            return false;
        }
    }, [user, loadFavorites]);

    // Remove a serie from favorites
    const removeFavorite = useCallback(async (serieId) => {
        if (!user) return false;

        try {
            await userDataService.removeFavorite(serieId);
            setFavorites(prev => prev.filter(fav => fav.serieId !== serieId));
            toast.success('Removed from favorites');
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            toast.error('Failed to remove from favorites');
            return false;
        }
    }, [user]);

    // Toggle favorite status
    const toggleFavorite = useCallback(async (serieId) => {
        const isFavorite = await checkFavorite(serieId);
        if (isFavorite) {
            return removeFavorite(serieId);
        } else {
            return addFavorite(serieId);
        }
    }, [checkFavorite, removeFavorite, addFavorite]);

    // Save reading progress
    const saveReadingProgress = useCallback(async (chapterId, lastReadPage) => {
        if (!user) return null;

        try {
            const response = await userDataService.saveReadingProgress({
                chapterId,
                lastReadPage
            });
            return response.data;
        } catch (error) {
            console.error('Error saving reading progress:', error);
            return null;
        }
    }, [user]);

    // Get reading progress for a chapter
    const getReadingProgress = useCallback(async (chapterId) => {
        if (!user) return null;

        try {
            const response = await userDataService.getReadingProgress(chapterId);
            return response.data;
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error getting reading progress:', error);
            }
            return null;
        }
    }, [user]);

    // Get reading settings for a serie
    const getReadingSettings = useCallback(async (serieId) => {
        if (!user) return null;

        try {
            const response = await userDataService.getReadingSettings(serieId);
            return response.data;
        } catch (error) {
            console.error('Error getting reading settings:', error);
            return null;
        }
    }, [user]);

    // Save reading settings
    const saveReadingSettings = useCallback(async (settings) => {
        if (!user) return null;

        try {
            const response = await userDataService.saveReadingSettings(settings);
            return response.data;
        } catch (error) {
            console.error('Error saving reading settings:', error);
            toast.error('Failed to save reading settings');
            return null;
        }
    }, [user]);

    return {
        favorites,
        loadingFavorites,
        loadFavorites,
        checkFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        saveReadingProgress,
        getReadingProgress,
        getReadingSettings,
        saveReadingSettings,
        themeMode: userDataService.themeMode,
        readingMode: userDataService.readingMode
    };
};

export default useUserData;