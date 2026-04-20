import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PostcodeState {
  postcode: string;
  suburb: string;
}

const initialState: PostcodeState = {
  // Guard localStorage so this doesn't crash during Next.js SSR/prerendering
  postcode: (typeof window !== 'undefined' ? localStorage.getItem('globalPostcode') : null) || '3000',
  suburb: (typeof window !== 'undefined' ? localStorage.getItem('globalSuburb') : null) || 'Melbourne',
};

const postcodeSlice = createSlice({
  name: 'postcode',
  initialState,
  reducers: {
    setPostcode: (state, action: PayloadAction<{ postcode: string; suburb: string }>) => {
      state.postcode = action.payload.postcode;
      state.suburb = action.payload.suburb;
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('globalPostcode', action.payload.postcode);
        localStorage.setItem('globalSuburb', action.payload.suburb);
      }
    },
    loadPostcode: (state) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('globalPostcode');
        const storedSuburb = localStorage.getItem('globalSuburb');
        if (stored) {
          state.postcode = stored;
          state.suburb = storedSuburb || 'Melbourne';
        } else {
          // Set default Australian postcode if nothing is stored
          state.postcode = '3000';
          state.suburb = 'Melbourne';
        }
      } else {
        // Server-side: always use default to match initial render
        state.postcode = '3000';
        state.suburb = 'Melbourne';
      }
    },
  },
});

export const { setPostcode, loadPostcode } = postcodeSlice.actions;
export default postcodeSlice.reducer;