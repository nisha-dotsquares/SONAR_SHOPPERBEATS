import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { setPostcode, loadPostcode } from '@/lib/redux/slices/postcodeSlice';

export const useGlobalPostcode = () => {
  const dispatch = useDispatch();
  const postcode = useSelector((state: RootState) => state.postcode.postcode);
  const suburb = useSelector((state: RootState) => state.postcode.suburb);

  useEffect(() => {
    // Load postcode from localStorage on mount
    dispatch(loadPostcode());
  }, [dispatch]);

  const updatePostcode = (newPostcode: string, newSuburb: string = 'Sydney') => {
    dispatch(setPostcode({ postcode: newPostcode, suburb: newSuburb }));
  };

  return {
    // Return postcode directly — empty string means no postcode set
    postcode: postcode || undefined,
    suburb: suburb || undefined,
    updatePostcode,
  };
};