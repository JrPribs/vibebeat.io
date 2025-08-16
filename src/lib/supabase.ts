// Supabase Configuration
// Client setup for vibebeat application

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfcquifrkvqchallhotc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY3F1aWZya3ZxY2hhbGxob3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzc1MTIsImV4cCI6MjA3MDg1MzUxMn0.hqVLLFjo6SlRQd6ym5qt0oqy9iofa3tGsd4ehYBxXX8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Upload audio recording
export async function uploadAudioRecording(audioData: string, fileName: string, metadata: any = {}) {
  const { data, error } = await supabase.functions.invoke('audio-upload', {
    body: {
      audioData,
      fileName,
      metadata
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) {
    console.error('Audio upload error:', error);
    throw error;
  }

  return data;
}

// Get user recordings
export async function getUserRecordings(userId: string) {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }

  return data;
}