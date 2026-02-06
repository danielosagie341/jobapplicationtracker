import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const applicationSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyLocation: z.string().optional(),
  status: z.enum(['interested', 'applied', 'phone_screening', 'technical_interview', 'final_interview', 'offer_extended', 'offer_accepted', 'rejected', 'withdrawn']),
  priority: z.enum(['high', 'medium', 'low']),
  appliedDate: z.string().min(1, 'Applied date is required'),
  salary: z.string().optional(),
  jobUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  jobDescription: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface Company {
  id: string;
  name: string;
  location?: string;
}

const ApplicationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      status: 'applied',
      priority: 'medium',
      appliedDate: new Date().toISOString().split('T')[0],
    }
  });

  const watchCompanyName = watch('companyName');

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchApplication = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.get(`/applications/${id}`);
      const app = response.data.data.application;
      
      // Map backend status to frontend status
      const backendToFrontendStatus: Record<string, string> = {
        'Interested': 'interested',
        'Applied': 'applied',
        'Phone Screening': 'phone_screening',
        'Technical Interview': 'technical_interview',
        'Final Interview': 'final_interview',
        'Offer Extended': 'offer_extended',
        'Offer Accepted': 'offer_accepted',
        'Rejected': 'rejected',
        'Withdrawn': 'withdrawn'
      };
      
      reset({
        title: app.jobTitle,
        companyName: app.company.name,
        companyLocation: app.company.location || '',
        status: (backendToFrontendStatus[app.status] || 'applied') as ApplicationFormData['status'],
        priority: app.priority.toLowerCase() as ApplicationFormData['priority'],
        appliedDate: app.appliedDate.split('T')[0],
        salary: app.salary || '',
        jobUrl: app.jobUrl || '',
        jobDescription: app.jobDescription || '',
        requirements: app.requirements || '',
        notes: app.notes || '',
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
      navigate('/applications');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      // Find company ID from the selected company name
      let selectedCompany = companies.find(c => c.name === data.companyName);
      
      // If company doesn't exist, create it
      if (!selectedCompany && data.companyName.trim()) {
        try {
          const companyResponse = await api.post('/companies', {
            name: data.companyName.trim(),
            location: data.companyLocation?.trim(),
            industry: '', // Will be empty for now
          });
          selectedCompany = companyResponse.data.data.company;
          // Add to local companies list
          setCompanies(prev => [...prev, selectedCompany!]);
        } catch (companyError) {
          console.error('Error creating company:', companyError);
          toast.error('Failed to create company. Please try again.');
          return;
        }
      }

      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'interested': 'Interested',
        'applied': 'Applied',
        'phone_screening': 'Phone Screening',
        'technical_interview': 'Technical Interview',
        'final_interview': 'Final Interview',
        'offer_extended': 'Offer Extended',
        'offer_accepted': 'Offer Accepted',
        'rejected': 'Rejected',
        'withdrawn': 'Withdrawn'
      };

      // Transform frontend data to backend format
      const backendData = {
        jobTitle: data.title,
        companyId: selectedCompany?.id,
        location: data.companyLocation,
        status: statusMap[data.status] || 'Applied',
        priority: data.priority.charAt(0).toUpperCase() + data.priority.slice(1), // capitalize first letter
        appliedDate: data.appliedDate,
        jobUrl: data.jobUrl,
        jobDescription: data.jobDescription,
        jobRequirements: data.requirements,
        notes: data.notes,
        // Parse salary if provided
        ...(data.salary && data.salary.includes('-') ? {
          salaryMin: parseInt(data.salary.split('-')[0].replace(/[^\d]/g, '')),
          salaryMax: parseInt(data.salary.split('-')[1].replace(/[^\d]/g, ''))
        } : data.salary ? {
          salaryMin: parseInt(data.salary.replace(/[^\d]/g, ''))
        } : {})
      };

      if (isEditing) {
        await api.put(`/applications/${id}`, backendData);
        toast.success('Application updated successfully');
      } else {
        await api.post('/applications', backendData);
        toast.success('Application added successfully');
      }
      navigate('/applications');
    } catch (error: any) {
      console.error('Error saving application:', error);
      toast.error(error.response?.data?.message || 'Failed to save application');
    }
  };

  const handleCompanySelect = (company: Company) => {
    setValue('companyName', company.name);
    setValue('companyLocation', company.location || '');
    setShowNewCompany(false);
    console.log(showNewCompany)
  };

  useEffect(() => {
    fetchCompanies();
    if (isEditing) {
      fetchApplication();
    }
  }, [id, isEditing]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(watchCompanyName?.toLowerCase() || '')
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/applications')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Application' : 'Add New Application'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update your job application details' : 'Track a new job opportunity'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. Senior Frontend Developer"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job URL
              </label>
              <div className="relative">
                <input
                  {...register('jobUrl')}
                  type="url"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://company.com/careers/job-id"
                />
                <ExternalLink className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.jobUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.jobUrl.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                {...register('jobDescription')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <textarea
                {...register('requirements')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Key requirements and qualifications..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <div className="relative">
                <input
                  {...register('companyName')}
                  type="text"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Google, Microsoft, Startup Inc."
                  autoComplete="off"
                />
                <Building className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Company Suggestions Dropdown */}
                {watchCompanyName && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.slice(0, 5).map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleCompanySelect(company)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{company.name}</div>
                          {company.location && (
                            <div className="text-sm text-gray-500">{company.location}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                {...register('companyLocation')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="interested">Interested</option>
                <option value="applied">Applied</option>
                <option value="phone_screening">Phone Screening</option>
                <option value="technical_interview">Technical Interview</option>
                <option value="final_interview">Final Interview</option>
                <option value="offer_extended">Offer Extended</option>
                <option value="offer_accepted">Offer Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applied Date *
              </label>
              <input
                {...register('appliedDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.appliedDate && (
                <p className="mt-1 text-sm text-red-600">{errors.appliedDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary
              </label>
              <input
                {...register('salary')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. $80,000 - $100,000"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add any additional notes, interview details, follow-up actions, etc."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Application' : 'Save Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationFormPage;