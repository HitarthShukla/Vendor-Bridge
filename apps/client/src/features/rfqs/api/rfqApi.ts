import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const rfqKeys = {
  all: ['rfqs'] as const,
  lists: () => [...rfqKeys.all, 'list'] as const,
  list: (filters: string) => [...rfqKeys.lists(), { filters }] as const,
  details: () => [...rfqKeys.all, 'detail'] as const,
  detail: (id: string) => [...rfqKeys.details(), id] as const,
};

export const useRfqs = (query = '') => {
  return useQuery({
    queryKey: rfqKeys.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get(`/rfqs${query}`);
      // paginated response: { success, data: rfq[], meta: {...} }
      return { rfqs: data.data || [], meta: data.meta };
    },
  });
};

export const useRfq = (id: string) => {
  return useQuery({
    queryKey: rfqKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/rfqs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateRfq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/rfqs', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
};

export const usePublishRfq = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/rfqs/${id}/publish`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
    },
  });
};

export const useCloseRfq = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/rfqs/${id}/close`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
    },
  });
};
