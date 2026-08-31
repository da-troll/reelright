import { configureStore } from "@reduxjs/toolkit";
import { useState, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "../../input/oss-dashboard/src/features/auth/authSlice";
import postsReducer from "../../input/oss-dashboard/src/features/posts/postsSlice";
import { seedPosts } from "../../input/oss-dashboard/src/features/posts/seedPosts";
import uiReducer from "../../input/oss-dashboard/src/features/ui/uiSlice";

const createDeterministicStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      posts: postsReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: { session: null, status: "idle" as const, error: null },
      posts: {
        items: seedPosts,
        fetchStatus: "idle" as const,
        createStatus: "idle" as const,
        message: null,
        error: null,
      },
      ui: { sidebarOpen: false },
    },
  });

export const OssDashboardProviders: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [store] = useState(createDeterministicStore);

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={["/app/main"]}>{children}</MemoryRouter>
    </Provider>
  );
};
