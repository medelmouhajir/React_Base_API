import apiClient from './apiClient';

export const expenseService = {
    // Expense endpoints

    async getAll() {
        try {
            const response = await apiClient.get('/expenses');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all expenses:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/expenses/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching expense with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/expenses/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching expenses for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async create(expenseData) {
        try {
            const response = await apiClient.post('/expenses', expenseData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating expense:', error);
            throw error;
        }
    },

    async update(id, expenseData) {
        try {
            if (id !== expenseData.id) {
                throw new Error("The ID in the URL does not match expenseData.id");
            }
            const response = await apiClient.put(`/expenses/${id}`, expenseData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating expense with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/expenses/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting expense with ID ${id}:`, error);
            throw error;
        }
    },


    // Category endpoints

    async getAllCategories() {
        try {
            const response = await apiClient.get('/expenses/categories');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all categories:', error);
            throw error;
        }
    },

    async getCategoryById(id) {
        try {
            const response = await apiClient.get(`/expenses/categories/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching category with ID ${id}:`, error);
            throw error;
        }
    },

    async getCategoriesByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/expenses/categories/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching categories for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async createCategory(categoryData) {
        try {
            const response = await apiClient.post('/expenses/categories', categoryData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating category:', error);
            throw error;
        }
    },

    async updateCategory(id, categoryData) {
        try {
            if (id !== categoryData.id) {
                throw new Error("The ID in the URL does not match categoryData.id");
            }
            const response = await apiClient.put(`/expenses/categories/${id}`, categoryData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating category with ID ${id}:`, error);
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            const response = await apiClient.delete(`/expenses/categories/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting category with ID ${id}:`, error);
            throw error;
        }
    },
};

export default expenseService;
