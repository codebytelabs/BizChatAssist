import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Custom hook for using Supabase in components
export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found in environment variables');
      }
      
      const client = createClient(supabaseUrl, supabaseAnonKey);
      setSupabase(client);
    } catch (err: any) {
      console.error('Error initializing Supabase client:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { supabase, loading, error };
}

// Hook for real-time subscription to Supabase channels
export function useSupabaseRealtime<T>(
  table: string,
  condition?: { column: string; value: string },
  callback?: (payload: { new: T; old: T | null }) => void
) {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T[]>([]);
  const [realtimeError, setRealtimeError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    // Initial data fetch
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');
        
        if (condition) {
          query = query.eq(condition.column, condition.value);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setData(data || []);
      } catch (err: any) {
        console.error(`Error fetching data from ${table}:`, err);
        setRealtimeError(err);
      }
    };

    fetchData();

    // Set up real-time subscription
    let subscription = supabase
      .channel(`${table}_channel`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...(condition ? { filter: `${condition.column}=eq.${condition.value}` } : {})
      }, (payload) => {
        // Update local data based on change type
        if (payload.eventType === 'INSERT') {
          setData(prev => [...prev, payload.new as T]);
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(item => {
            // Safely check for ID match
            const itemId = (item as any).id;
            const newId = (payload.new as any).id;
            return itemId === newId ? payload.new as T : item;
          }));
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => {
            // Safely check for ID match
            const itemId = (item as any).id;
            const oldId = (payload.old as any).id;
            return itemId !== oldId;
          }));
        }
        
        // Call custom callback if provided
        if (callback) {
          // Cast to unknown first to satisfy TypeScript
          callback(payload as unknown as { new: T; old: T | null });
        }
      })
      .subscribe(() => {
        setIsSubscribed(true);
      });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, table, condition]);

  return { data, realtimeError, isSubscribed };
}
