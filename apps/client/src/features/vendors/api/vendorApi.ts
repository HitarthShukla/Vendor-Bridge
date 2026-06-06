import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: string) => [...vendorKeys.lists(), { filters }] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};

export const useVendors = (query = '') => {
  return useQuery({
    queryKey: vendorKeys.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get(`/vendors${query}`);
      // paginated response: { success, data: vendor[], meta: {...} }
      return { vendors: data.data || [], meta: data.meta };
    },
  });
};

export const useVendor = (id: string) => {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/vendors/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/vendors', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
};

export const useUpdateVendor = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.patch(`/vendors/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });
    },
  });
};
