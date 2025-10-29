// src/components/TagInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TAG_PRESETS } from '@/lib/tag-presets';

interface TagInputProps {
  label: string;
  category: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ 
  label, 
  category, 
  value, 
  onChange, 
  placeholder = 'Type and press Enter...'
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get presets for this category
  const categoryKey = category.replace('_tags', '') as keyof typeof TAG_PRESETS;
  const presets = TAG_PRESETS[categoryKey] || [];
  
  // Filter suggestions based on input
  const filteredSuggestions = input.length > 0
    ? presets.filter(s => 
        s.toLowerCase().includes(input.toLowerCase()) &&
        !value.includes(s)
      ).slice(0, 10)
    : presets.filter(s => !value.includes(s)).slice(0, 20);
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setInput('');
      setShowSuggestions(false);
    }
  };
  
  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };
  
  // Quick add popular tags
  const quickTags = presets.slice(0, 5).filter(t => !value.includes(t));
  
  return (
    <div className="space-y-2">
      <Label htmlFor={category}>{label}</Label>
      
      {/* Current tags */}
      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-gray-50">
        {value.length === 0 ? (
          <span className="text-sm text-gray-400">No tags yet</span>
        ) : (
          value.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button 
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-gray-300 rounded-full"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      
      {/* Quick add buttons */}
      {quickTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Quick add:</span>
          {quickTags.map(tag => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              type="button"
            >
              + {tag}
            </button>
          ))}
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            type="button"
          >
            {showSuggestions ? 'Hide' : 'Show'} all ({presets.length})
          </button>
        </div>
      )}
      
      {/* Input field */}
      <div className="relative">
        <Input
          id={category}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        {value.length} tags added. Type custom tags or select from presets.
      </p>
    </div>
  );
}