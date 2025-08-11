import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, ExternalLink, Calendar, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UrlData {
  originalUrl: string;
  shortCode: string;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/urls');
      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }
      const data = await response.json();
      setUrls(data.urls || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  const deleteUrl = async (shortCode: string) => {
    if (!confirm(`Are you sure you want to delete the URL with code "${shortCode}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/urls/${shortCode}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete URL');
      }

      setUrls(urls.filter(url => url.shortCode !== shortCode));
      toast({
        title: "Success",
        description: "URL deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete URL',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalVisits = () => {
    return urls.reduce((total, url) => total + url.visitCount, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your shortened URLs and analytics</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchUrls} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={onBack}>
              Back to Shortener
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urls.length}</div>
              <p className="text-xs text-muted-foreground">
                Shortened links created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalVisits()}</div>
              <p className="text-xs text-muted-foreground">
                Total link clicks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Visits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {urls.length > 0 ? (getTotalVisits() / urls.length).toFixed(1) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per shortened URL
              </p>
            </CardContent>
          </Card>
        </div>

        {/* URLs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shortened URLs</CardTitle>
            <CardDescription>
              Manage all your shortened URLs and view their analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading URLs...</p>
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No URLs found. Create some shortened URLs first!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Short Code</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urls.map((url) => (
                      <TableRow key={url.shortCode}>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <a
                              href={url.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              title={url.originalUrl}
                            >
                              {url.originalUrl.length > 50 
                                ? `${url.originalUrl.substring(0, 50)}...` 
                                : url.originalUrl}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {url.shortCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={url.visitCount > 0 ? "default" : "secondary"}>
                            {url.visitCount} {url.visitCount === 1 ? 'visit' : 'visits'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(url.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUrl(url.shortCode)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
