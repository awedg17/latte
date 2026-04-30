import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { DesktopRightPanel } from './components/DesktopRightPanel';
import { AddTransaction } from './components/AddTransaction';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budget } from './pages/Budget';
import { Accounts } from './pages/Accounts';
import { Plus } from 'lucide-react';
import { cn } from './utils/cn';

const AppContent: React.FC = () => {
  const { activePage, setActivePage, darkMode } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage as any} />;
      case 'transactions': return <Transactions />;
      case 'budget': return <Budget />;
      case 'accounts': return <Accounts />;
      default: return <Dashboard onNavigate={setActivePage as any} />;
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-950 font-sans', darkMode && 'dark')}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar onAddTransaction={() => setShowAdd(true)} />

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Mobile TopBar */}
          <TopBar />

          {/* Page content */}
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
                {renderPage()}
              </div>
            </div>

            {/* Desktop Right Panel */}
            <DesktopRightPanel />
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className={cn(
          'lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-amber-400 to-yellow-500',
          'shadow-xl shadow-amber-300/50 dark:shadow-amber-900/40',
          'flex items-center justify-center',
          'hover:from-amber-500 hover:to-yellow-600',
          'transition-all duration-200 active:scale-90'
        )}
      >
        <Plus size={24} className="text-gray-900" strokeWidth={2.5} />
      </button>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Add Transaction Modal */}
      {showAdd && <AddTransaction onClose={() => setShowAdd(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
