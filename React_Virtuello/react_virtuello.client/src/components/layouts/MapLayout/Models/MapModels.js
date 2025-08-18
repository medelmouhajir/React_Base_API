// Map models for data entities
export const MapModels = {
    // Business model
    Business: {
        id: String,
        name: String,
        description: String,
        latitude: Number,
        longitude: Number,
        address: String,
        phone: String,
        email: String,
        website: String,
        status: String, // 'Active', 'Pending', 'Suspended'
        tags: Array,    // Array of tag IDs
        coverImage: String,
        logoImage: String,
        rating: Number,
        reviewCount: Number,
        openingHours: Object
    },

    // Event model
    Event: {
        id: String,
        name: String,
        description: String,
        latitude: Number,
        longitude: Number,
        address: String,
        startDate: Date,
        endDate: Date,
        status: String, // 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'
        type: String,   // 'Public', 'Private', 'Online'
        categories: Array, // Array of category IDs
        coverImage: String,
        organizerId: String
    },

    // Location model
    Location: {
        lat: Number,
        lng: Number,
        address: String,
        name: String
    }
};