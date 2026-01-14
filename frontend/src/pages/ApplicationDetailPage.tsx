import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  FileText,
  Flag
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface JobApplication {
  id: string;
  jobTitle: string;
  company: {
    id: string;
    name: string;
    location?: string;
  };
  status: string;
  priority: string;
  appliedDate: string;
  salary?: string;
  jobUrl?: string;
  jobDescription?: string;
  requirements?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    changedBy: string;
    notes?: string;
    createdAt: string;
  }>;
}

const ApplicationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      interviewing: 'bg-yellow-100 text-yellow-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/${id}`);
      setApplication(response.data.data.application);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
      navigate('/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!application || !confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await api.delete(`/applications/${application.id}`);
      toast.success('Application deleted successfully');
      navigate('/applications');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete application';
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Application not found</h3>
        <button
          onClick={() => navigate('/applications')}
          className="text-primary-600 hover:text-primary-800"
        >
          Return to Applications
        </button>
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
              {application.jobTitle}
            </h1>
            <div className="flex items-center text-gray-600 mt-1">
              <Building className="h-4 w-4 mr-2" />
              {application.company.name}
              {application.company.location && (
                <>
                  <MapPin className="h-4 w-4 ml-4 mr-1" />
                  {application.company.location}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/applications/${application.id}/edit`)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Status</label>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Priority</label>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
              <Flag className="h-3 w-3 mr-1" />
              {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Applied Date</label>
            <div className="flex items-center text-gray-900">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(application.appliedDate)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Salary</label>
            <div className="flex items-center text-gray-900">
              <DollarSign className="h-4 w-4 mr-2" />
              {application.salary || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
        
        {application.jobUrl && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">Job URL</label>
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Original Job Posting
            </a>
          </div>
        )}

        {application.jobDescription && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">Job Description</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {application.jobDescription}
              </pre>
            </div>
          </div>
        )}

        {application.requirements && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">Requirements</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {application.requirements}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {application.notes && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {application.notes}
            </pre>
          </div>
        </div>
      )}

      {/* Status History */}
      {application.statusHistory && application.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </h2>
          <div className="space-y-4">
            {application.statusHistory.map((history) => (
              <div key={history.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(history.toStatus).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      {history.fromStatus && (
                        <span className="text-sm text-gray-500">
                          {history.fromStatus} → 
                        </span>
                      )}
                      <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.toStatus)}`}>
                        {history.toStatus.charAt(0).toUpperCase() + history.toStatus.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(history.createdAt)}
                    </span>
                  </div>
                  {history.notes && (
                    <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Changed by {history.changedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 space-y-1">
          <div>Created: {formatDateTime(application.createdAt)}</div>
          <div>Last updated: {formatDateTime(application.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;