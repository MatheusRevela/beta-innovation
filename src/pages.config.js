/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AuditLogs from './pages/AuditLogs';
import CRMBoard from './pages/CRMBoard';
import CorporateManagement from './pages/CorporateManagement';
import Dashboard from './pages/Dashboard';
import Diagnostic from './pages/Diagnostic';
import Home from './pages/Home';
import MyCRM from './pages/MyCRM';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import StartupManagement from './pages/StartupManagement';
import StartupRadar from './pages/StartupRadar';
import MyDiagnostics from './pages/MyDiagnostics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminLogin": AdminLogin,
    "AuditLogs": AuditLogs,
    "CRMBoard": CRMBoard,
    "CorporateManagement": CorporateManagement,
    "Dashboard": Dashboard,
    "Diagnostic": Diagnostic,
    "Home": Home,
    "MyCRM": MyCRM,
    "Onboarding": Onboarding,
    "Reports": Reports,
    "StartupManagement": StartupManagement,
    "StartupRadar": StartupRadar,
    "MyDiagnostics": MyDiagnostics,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};