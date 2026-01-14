import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T & {
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      email,
      password,
    }),

  register: (userData: RegisterData) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', userData),

  getCurrentUser: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),

  updateProfile: (userData: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', userData),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<{}>>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// Applications API
export const applicationsAPI = {
  getApplications: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get<PaginatedResponse<{ applications: JobApplication[] }>>(
      `/applications?${searchParams.toString()}`
    );
  },

  getApplication: (id: string) =>
    api.get<ApiResponse<{ application: JobApplication }>>(`/applications/${id}`),

  createApplication: (applicationData: CreateApplicationData) =>
    api.post<ApiResponse<{ application: JobApplication }>>('/applications', applicationData),

  updateApplication: (id: string, applicationData: Partial<JobApplication>) =>
    api.put<ApiResponse<{ application: JobApplication }>>(`/applications/${id}`, applicationData),

  deleteApplication: (id: string) =>
    api.delete<ApiResponse<{}>>(`/applications/${id}`),

  getStats: () =>
    api.get<ApiResponse<ApplicationStats>>('/applications/stats/overview'),
};

// Companies API
export const companiesAPI = {
  getCompanies: (params?: {
    search?: string;
    industry?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get<PaginatedResponse<{ companies: Company[] }>>(
      `/companies?${searchParams.toString()}`
    );
  },

  getCompany: (id: string) =>
    api.get<ApiResponse<{ company: Company }>>(`/companies/${id}`),

  createCompany: (companyData: CreateCompanyData) =>
    api.post<ApiResponse<{ company: Company }>>('/companies', companyData),

  searchCompanies: (query: string) =>
    api.get<ApiResponse<{ companies: Company[] }>>(`/companies/search/${query}`),
};

// Type definitions
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  currentJobTitle?: string;
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  preferredSalaryMin?: number;
  preferredSalaryMax?: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  settings: {
    notifications: {
      email: boolean;
      applicationReminders: boolean;
      interviewReminders: boolean;
      weeklyDigest: boolean;
    };
    privacy: {
      profileVisible: boolean;
      shareAnalytics: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  headquarters?: string;
  website?: string;
  linkedinUrl?: string;
  description?: string;
  foundedYear?: number;
  isPublic: boolean;
  stockSymbol?: string;
  revenue?: string;
  glassdoorRating?: number;
  glassdoorUrl?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
  description?: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  companyId: string;
  jobTitle: string;
  jobDescription?: string;
  jobRequirements?: string;
  jobUrl?: string;
  jobBoardSource?: string;
  location?: string;
  workType?: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship' | 'Freelance';
  workMode?: 'Remote' | 'On-site' | 'Hybrid';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevel?: string;
  status: ApplicationStatus;
  priority: 'Low' | 'Medium' | 'High';
  appliedDate?: string;
  lastContactDate?: string;
  followUpDate?: string;
  interviewDate?: string;
  expectedResponseDate?: string;
  responseReceived: boolean;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  notes?: string;
  interviewNotes?: string;
  rejectionReason?: string;
  applicationScore?: number;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  company: Company;
}

export type ApplicationStatus =
  | 'Interested'
  | 'Applied'
  | 'Application Viewed'
  | 'Phone Screening'
  | 'Technical Interview'
  | 'On-site Interview'
  | 'Final Interview'
  | 'Reference Check'
  | 'Offer Extended'
  | 'Offer Accepted'
  | 'Offer Declined'
  | 'Rejected'
  | 'Withdrawn'
  | 'On Hold';

export interface CreateApplicationData {
  companyId: string;
  jobTitle: string;
  jobDescription?: string;
  jobRequirements?: string;
  jobUrl?: string;
  jobBoardSource?: string;
  location?: string;
  workType?: string;
  workMode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  priority?: 'Low' | 'Medium' | 'High';
  appliedDate?: string;
  followUpDate?: string;
  notes?: string;
}

export interface ApplicationStats {
  totalApplications: number;
  recentApplications: number;
  upcomingFollowUps: number;
  responseRate: number;
  statusDistribution: Array<{
    status: string;
    count: string;
  }>;
}

export default api;