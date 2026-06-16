import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import About from './pages/About.jsx'
import Signup from './pages/Signup.jsx'
import NotFound from './pages/NotFound.jsx'
import AnalyseResume from './pages/AnalyseResume.jsx'
import Toaster from './components/Toaster.jsx'

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/about',
        element: <About />,
    },
    {
        path: '/signup',
        element: <Signup />,
    },
    {
        path: '/analyseresume',
        element: <AnalyseResume />,
    },
    {
        path: '/signup',
        element: <Signup />,
    },
    {
        path: '*',
        element: <NotFound />,
    },
])

createRoot(document.getElementById('root')).render(
    <>
        <RouterProvider router={router} />
        <Toaster />
    </>
)