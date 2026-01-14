import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import type { ApplicationStats, JobApplication } from '../services/api';
import {
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats and recent applications
        const [statsResponse, applicationsResponse] = await Promise.all([
          applicationsAPI.getStats(),
          applicationsAPI.getApplications({ limit: 5, sortBy: 'updatedAt', order: 'DESC' })
        ]);

        setStats(statsResponse.data.data);
        setRecentApplications(applicationsResponse.data.data.applications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Offer Accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rejected':
      case 'Withdrawn':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Offer Accepted':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'Rejected':
      case 'Withdrawn':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'Applied':
        return 'text-blue-700 bg-blue-50 ring-blue-600/20';
      case 'Interview':
      case 'Phone Screening':
      case 'Technical Interview':
        return 'text-purple-700 bg-purple-50 ring-purple-600/20';
      default:
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BriefcaseIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalApplications || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.recentApplications || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Response Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.responseRate ? `${stats.responseRate}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Follow-ups Due</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.upcomingFollowUps || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/applications/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Add New Application</span>
          </Link>

          <Link
            to="/companies/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Add Company</span>
          </Link>

          <Link
            to="/documents"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Upload Resume</span>
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
            <Link
              to="/applications"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentApplications.length > 0 ? (
            recentApplications.map((application) => (
              <div key={application.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {application.company.logo ? (
                        <img
                          className="h-10 w-10 rounded-lg"
                          src={application.company.logo}
                          alt={application.company.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {application.company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.jobTitle}
                        </p>
                        {application.isStarred && (
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{application.company.name}</p>
                      <p className="text-xs text-gray-400">
                        {application.appliedDate
                          ? `Applied ${new Date(application.appliedDate).toLocaleDateString()}`
                          : `Added ${new Date(application.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1">{application.status}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first job application.
              </p>
              <div className="mt-6">
                <Link
                  to="/applications/new"
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Add Application
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution Chart (if we have data) */}
      {stats?.statusDistribution && stats.statusDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Application Status Distribution</h2>
          <div className="space-y-3">
            {stats.statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.status}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};