import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCheckIn, SubmitCheckInParams } from '../lib/checkins';

export function useSubmitCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SubmitCheckInParams) => submitCheckIn(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userCheckins', params.userId] });
    },
  });
}
