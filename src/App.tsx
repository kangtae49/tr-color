import "./App.css";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import AppLayout from "./routes/AppLayout.tsx";
import ErrorView from "./routes/ErrorView.tsx";
import MainView from "./routes/MainView.tsx";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorView />,
    children: [
      {
        index: true,
        element: <MainView />,
      },
      {
        path: '/youtube',
        element: <MainView />,
      },
    ]
  },
]);

function App() {
  return (
    <main className="container">
      <RouterProvider router={router} />
    </main>
  );
}

export default App;
