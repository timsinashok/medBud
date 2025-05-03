import { useContext } from 'react';
import { UserContext } from '../../App';

export const useUserId = () => {
  const { getUserId } = useContext(UserContext);
  return getUserId();
};