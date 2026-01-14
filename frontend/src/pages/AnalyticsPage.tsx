import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Briefcase, Clock, Target } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    appliedCount: 0,
    interviewingCount: 0,
    offerCount: 0,
    rejectedCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch applications to calculate stats
        const response = await api.get('/applications');
        const applications = response.data.data.applications || [];
        
        const statusCounts = applications.reduce((acc: any, app: any) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalApplications: applications.length,
          appliedCount: statusCounts['Applied'] || 0,
          interviewingCount: (statusCounts['Phone Screening'] || 0) + (statusCounts['Technical Interview'] || 0) + (statusCounts['Final Interview'] || 0),
          offerCount: (statusCounts['Offer Extended'] || 0) + (statusCounts['Offer Accepted'] || 0),
          rejectedCount: statusCounts['Rejected'] || 0,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your job application progress and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Applied</p>
              <p className="text-2xl font-bold text-blue-600">{stats.appliedCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Interviewing</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.interviewingCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Offers</p>
              <p className="text-2xl font-bold text-green-600">{stats.offerCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Application Status Distribution
        </h2>
        
        <div className="space-y-4">
          {[
            { status: 'Applied', count: stats.appliedCount, color: 'bg-blue-500' },
            { status: 'Interviewing', count: stats.interviewingCount, color: 'bg-yellow-500' },
            { status: 'Offers', count: stats.offerCount, color: 'bg-green-500' },
            { status: 'Rejected', count: stats.rejectedCount, color: 'bg-red-500' },
          ].map(({ status, count, color }) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${color}`}></div>
                <span className="text-sm font-medium text-gray-700">{status}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{
                      width: stats.totalApplications > 0 ? `${(count / stats.totalApplications) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Success Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalApplications > 0 ? Math.round((stats.offerCount / stats.totalApplications) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Offer Rate</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.totalApplications > 0 ? Math.round((stats.interviewingCount / stats.totalApplications) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Interview Rate</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalApplications > 0 ? Math.round(((stats.interviewingCount + stats.offerCount) / stats.totalApplications) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Response Rate</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Insights</h2>
        <div className="space-y-2 text-sm text-gray-700">
          {stats.totalApplications === 0 && (
            <p>• Start by adding your first job application to see analytics</p>
          )}
          {stats.totalApplications > 0 && stats.offerCount === 0 && (
            <p>• Keep applying! The more applications you submit, the higher your chances</p>
          )}
          {stats.interviewingCount > 0 && (
            <p>• Great job getting interviews! Focus on interview preparation</p>
          )}
          {stats.offerCount > 0 && (
            <p>• Congratulations on your offers! Your application strategy is working</p>
          )}
          <p>• Track your applications regularly to identify patterns and improve your success rate</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;