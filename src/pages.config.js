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
import AIReadinessScan from './pages/AIReadinessScan';
import BoardView from './pages/BoardView';
import EarlyWarnings from './pages/EarlyWarnings';
import PublicStartupRegister from './pages/PublicStartupRegister';
import StartupPortal from './pages/StartupPortal';
import StartupDiagnostic from './pages/StartupDiagnostic';
import AdminLogin from './pages/AdminLogin';
import AuditLogs from './pages/AuditLogs';
import CRMBoard from './pages/CRMBoard';
import Colaboradores from './pages/Colaboradores';
import CorporateDetail from './pages/CorporateDetail';
import CorporateManagement from './pages/CorporateManagement';
import Dashboard from './pages/Dashboard';
import Diagnostic from './pages/Diagnostic';
import DiagnosticCRM from './pages/DiagnosticCRM';
import Home from './pages/Home';
import InnovationTheses from './pages/InnovationTheses';
import JoinCorporate from './pages/JoinCorporate';
import Laboratorio from './pages/Laboratorio';
import MyCRM from './pages/MyCRM';
import MyDiagnostics from './pages/MyDiagnostics';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import StartupManagement from './pages/StartupManagement';
import StartupRadar from './pages/StartupRadar';
import TeamManagement from './pages/TeamManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AIReadinessScan": AIReadinessScan,
    "BoardView": BoardView,
    "EarlyWarnings": EarlyWarnings,
    "PublicStartupRegister": PublicStartupRegister,
    "StartupPortal": StartupPortal,
    "StartupDiagnostic": StartupDiagnostic,
    "AdminLogin": AdminLogin,
    "AuditLogs": AuditLogs,
    "CRMBoard": CRMBoard,
    "Colaboradores": Colaboradores,
    "CorporateDetail": CorporateDetail,
    "CorporateManagement": CorporateManagement,
    "Dashboard": Dashboard,
    "Diagnostic": Diagnostic,
    "DiagnosticCRM": DiagnosticCRM,
    "Home": Home,
    "InnovationTheses": InnovationTheses,
    "JoinCorporate": JoinCorporate,
    "Laboratorio": Laboratorio,
    "MyCRM": MyCRM,
    "MyDiagnostics": MyDiagnostics,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Reports": Reports,
    "StartupManagement": StartupManagement,
    "StartupRadar": StartupRadar,
    "TeamManagement": TeamManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};