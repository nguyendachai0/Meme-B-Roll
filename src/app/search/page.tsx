'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Filter, Download } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [popularTags, setPopularTags] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    // Load popular tags for each category
    const categories = ['emotion', 'reaction', 'source', 'meme_identity'];
    Promise.all(
      categories.map(cat =>
        fetch(`/api/tags/popular?category=${cat}&limit=10`)
          .then(r => r.json())
      )
    ).then(responses => {
      const tags: any = {};
      responses.forEach((response, i) => {
        tags[categories[i]] = response.tags || [];
      });
      setPopularTags(tags);
    });
  }, []);
  
  async function handleSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function toggleFilter(category: string, value: string) {
    setFilters((prev: any) => ({
      ...prev,
      [category]: prev[category] === value ? undefined : value
    }));
  }
  
  useEffect(() => {
    if (query || Object.keys(filters).length > 0) {
      handleSearch();
    }
  }, [filters]);
  
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Search Meme B-Roll</h1>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search: happy celebration office, trying your best but failing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 text-lg h-12"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} size="lg">
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {/* Active Filters */}
        {Object.entries(filters).filter(([_, v]) => v).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(filters)
              .filter(([_, value]) => value)
              .map(([key, value]) => (
                <Badge
                  key={key}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter(key, value as string)}
                >
                  {key}: {String(value)}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
          </div>
        )}
        
        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(popularTags).map(([category, tags]: [string, any]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tagObj: any) => (
                      <Badge
                        key={tagObj.tag}
                        variant={filters[category] === tagObj.tag ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter(category, tagObj.tag)}
                      >
                        {tagObj.tag} ({tagObj.usage_count})
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Duration</h3>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  placeholder="Min (sec)"
                  className="w-32"
                  onChange={(e) => setFilters({ ...filters, min_duration: e.target.value })}
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="Max (sec)"
                  className="w-32"
                  onChange={(e) => setFilters({ ...filters, max_duration: e.target.value })}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
      
      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((meme) => (
          <Card key={meme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-gray-100">
              {meme.thumbnail_url && (
                <img
                  src={meme.thumbnail_url}
                  alt={meme.title}
                  className="w-full h-full object-cover"
                />
              )}
              {meme.duration_seconds && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {meme.duration_seconds}s
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold mb-2 truncate">{meme.title}</h3>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {meme.emotion_tags?.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => window.location.href = `/meme/${meme.id}`}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = `/api/download/${meme.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {results.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No results found. Try different keywords or filters.</p>
        </div>
      )}
    </div>
  );
}