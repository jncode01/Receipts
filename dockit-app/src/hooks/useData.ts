import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, BUCKET } from '../lib/supabase';
import type { Category, Project, Receipt } from '../lib/types';

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  return {
    add: useMutation({
      mutationFn: async (input: { name: string; color: string }) => {
        const { data: u } = await supabase.auth.getUser();
        const user_id = u.user!.id;
        const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { data, error } = await supabase.from('categories')
          .insert({ user_id, name: input.name, color: input.color, sort_order: count ?? 0 })
          .select().single();
        if (error) throw error;
        return data;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (input: { id: string; patch: Partial<Category> }) => {
        const { error } = await supabase.from('categories').update(input.patch).eq('id', input.id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] });
  return {
    add: useMutation({
      mutationFn: async (input: { name: string; color: string; budget: number | null }) => {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('projects')
          .insert({ user_id: u.user!.id, ...input }).select().single();
        if (error) throw error;
        return data;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (input: { id: string; patch: Partial<Project> }) => {
        const { error } = await supabase.from('projects').update(input.patch).eq('id', input.id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ─── RECEIPTS ────────────────────────────────────────────────────────────────
export type ReceiptFilter = {
  search?: string;
  from?: string;       // YYYY-MM-DD inclusive
  to?: string;         // YYYY-MM-DD inclusive
  categoryIds?: string[];
  projectIds?: string[];
};

export function useReceipts(filter: ReceiptFilter = {}) {
  return useQuery({
    queryKey: ['receipts', filter],
    queryFn: async (): Promise<Receipt[]> => {
      let q = supabase.from('receipts').select('*').order('date', { ascending: false });
      if (filter.from) q = q.gte('date', filter.from);
      if (filter.to)   q = q.lte('date', filter.to);
      if (filter.categoryIds?.length) q = q.in('category_id', filter.categoryIds);
      if (filter.projectIds?.length)  q = q.in('project_id', filter.projectIds);
      if (filter.search) q = q.ilike('merchant', `%${filter.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: ['receipt', id],
    enabled: !!id,
    queryFn: async (): Promise<Receipt | null> => {
      const { data, error } = await supabase.from('receipts').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useReceiptMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['receipts'] });
    qc.invalidateQueries({ queryKey: ['receipt'] });
  };
  return {
    create: useMutation({
      mutationFn: async (input: Partial<Receipt> & { date: string; merchant: string; total: number }) => {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('receipts')
          .insert({ user_id: u.user!.id, ocr_status: 'pending', ...input })
          .select().single();
        if (error) throw error;
        return data as Receipt;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (input: { id: string; patch: Partial<Receipt> }) => {
        const { error } = await supabase.from('receipts').update(input.patch).eq('id', input.id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('receipts').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ─── IMAGES ──────────────────────────────────────────────────────────────────
import imageCompression from 'browser-image-compression';

export async function uploadReceiptImage(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const user_id = u.user!.id;

  // Compress before upload — receipts don't need to be 10MB photos.
  // Targets ~1MB max, ~2000px on longest side, preserves orientation.
  // PDFs and non-images skip compression.
  let toUpload: File | Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      toUpload = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });
    } catch (e) {
      console.warn('[dockit] compression failed, uploading original', e);
    }
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
  const path = `${user_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, toUpload, {
    cacheControl: '3600',
    upsert: false,
    contentType: toUpload instanceof File ? toUpload.type : (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
  });
  if (error) throw error;
  return path;
}

export async function getImageUrl(path: string): Promise<string> {
  // Private bucket → signed URL valid for 1 hr
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
