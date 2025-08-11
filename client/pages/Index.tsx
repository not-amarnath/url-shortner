import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link as LinkIcon, Copy, CheckIcon, Globe, Zap, Shield, Settings } from 'lucide-react';
import { ShortenUrlRequest, ShortenUrlResponse, ErrorResponse } from '@shared/api';
import AdminDashboard from '@/components/AdminDashboard';

export default function Index() {
  const [activeView, setActiveView] = useState<'shortener' | 'admin'>('shortener');
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShorten = async () => {
    if (!longUrl.trim()) {
      setError('Please enter a URL to shorten');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl: longUrl } as ShortenUrlRequest),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to shorten URL');
      }

      const data: ShortenUrlResponse = await response.json();
      const fullShortUrl = `${window.location.origin}/${data.shortCode}`;
      setShortUrl(fullShortUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleShorten();
    }
  };

  if (activeView === 'admin') {
    return <AdminDashboard onBack={() => setActiveView('shortener')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <LinkIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            URL Shortener
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform long, complex URLs into short, manageable links. Fast, reliable, and secure.
          </p>
          
          {/* Admin Toggle */}
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setActiveView('admin')}
              className="text-gray-600 hover:text-blue-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Shorten Your URL
            </CardTitle>
            <CardDescription className="text-gray-600">
              Paste your long URL below and get a shortened version instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://example.com/very-long-url-that-needs-shortening"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleShorten}
                disabled={loading || !longUrl.trim()}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Shortening...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Shorten URL</span>
                  </div>
                )}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {shortUrl && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Your shortened URL:
                </h3>
                <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                  <LinkIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <code className="flex-1 text-blue-600 font-mono break-all">
                    {shortUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="flex-shrink-0 border-green-200 hover:bg-green-50"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Copied to clipboard!
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Generate shortened URLs instantly with our optimized infrastructure.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">Your URLs are safely stored and always accessible when you need them.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Universal Access</h3>
            <p className="text-gray-600">Share your shortened URLs anywhere, anytime, with anyone.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
