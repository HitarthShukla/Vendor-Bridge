import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const quotationKeys = {
  all: ['quotations'] as const,
  byRfq: (rfqId: string) => [...quotationKeys.all, 'rfq', rfqId] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const,
};

export const useQuotationsByRfq = (rfqId: string) => {
  return useQuery({
    queryKey: quotationKeys.byRfq(rfqId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/quotations/compare/${rfqId}`);
      return data.data;
    },
    enabled: !!rfqId,
  });
};

export const useSubmitQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/quotations', payload);
      return data.data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.byRfq(variables.rfq_id) });
    },
  });
};

export const useCreateAndSubmitQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: createData } = await apiClient.post('/quotations', payload);
      const quotation = createData.data;
      const { data: submitData } = await apiClient.patch(`/quotations/${quotation.id}/submit`);
      return submitData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
};

export const useApproveQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) => {
      const { data } = await apiClient.patch(`/approvals/${id}/approve`, { remarks });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
};
