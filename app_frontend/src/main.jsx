import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import About from "./pages/About.jsx";
import SignupEmail from "./pages/SignupEmail.jsx";
import SignupOtp from "./pages/SignupOtp.jsx";
import SignupPassword from "./pages/SignupPassword.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/signupEmail",
    element: <SignupEmail />,
  },
  {
    path: "/signupOtp",
    element: <SignupOtp />,
  },
  {
    path: "/signupPassword",
    element: <SignupPassword />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
