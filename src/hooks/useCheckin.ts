import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCheckIn, SubmitCheckInParams, updateCheckIn, UpdateCheckInParams } from '../lib/checkins';

export function useSubmitCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SubmitCheckInParams) => submitCheckIn(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userCheckins', params.userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUpdateCheckIn(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateCheckInParams) => updateCheckIn(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCheckins', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
