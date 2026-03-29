import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    return stored ? JSON.parse(stored) : "dark";
  } catch {
    return "dark";
  }
};

const initialState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem("theme", JSON.stringify(action.payload));
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;