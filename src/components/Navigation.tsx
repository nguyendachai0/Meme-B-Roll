// src/components/Navigation.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, Upload, LogIn, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
  const { error } = await supabase.auth.signOut({ scope: 'local' }); 

  if (error) console.error('Logout error:', error.message);
  else router.push('/');
}


  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MB</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meme B-Roll
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </Link>

            {/* Show upload only if logged in */}
            {user ? (
              <>
                <Link href="/upload">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                  <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              !loading && (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin Login</span>
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}