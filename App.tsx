

import React, { useState, useEffect } from 'react';
import { users as initialUsers, personnel as initialPersonnel, personnelPayments as initialPersonnelPayments, customers as initialCustomers, customerJobs as initialCustomerJobs, defterEntries as initialDefterEntries, payments as initialPayments, sharedExpenses as initialSharedExpenses } from './data/mockData';
import { Role, User, Personnel, PersonnelPayment, Customer, CustomerJob, DefterEntry, Payment, SharedExpense } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PersonnelView from './components/PersonnelView';
import LoginView from './components/LoginView';
import ReportView from './components/ReportView';
import AdminView from './components/AdminView';
import CustomerView from './components/CustomerView';
import KasaView from './components/LedgerView';
import GlobalSearchView from './components/GlobalSearchView';

type View = 'dashboard' | 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [personnelPayments, setPersonnelPayments] = useState<PersonnelPayment[]>(initialPersonnelPayments);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>(initialCustomerJobs);
  const [defterEntries, setDefterEntries] = useState<DefterEntry[]>(initialDefterEntries);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>(initialSharedExpenses);
  
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [navigateToItem, setNavigateToItem] = useState<{ view: View, id: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (navigateToItem) {
      setCurrentView(navigateToItem.view);
    }
  }, [navigateToItem]);

  const handleNavigation = (view: View, id: string) => {
    setGlobalSearchQuery('');
    // For kasa, there is no item to select, just switch view
    if (view === 'kasa') {
        setCurrentView('kasa');
        setNavigateToItem(null);
    } else {
        setNavigateToItem({ view, id });
    }
  };
  
  const handleNavigationComplete = () => {
    setNavigateToItem(null);
  }


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard'); // Reset to dashboard on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  const addPersonnelPayment = (newPayment: Omit<PersonnelPayment, 'id'>) => {
    setPersonnelPayments(prev => [...prev, { ...newPayment, id: `ppay-${Date.now()}` }]);
  };

  const deletePersonnelPayment = (paymentId: string) => {
    setPersonnelPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const addPersonnel = (newPersonnelData: Omit<Personnel, 'id'>) => {
    const newPersonnel: Personnel = {
      ...newPersonnelData,
      id: `p-${Date.now()}`
    };
    setPersonnel(prev => [...prev, newPersonnel]);
  };

  const updatePersonnel = (updatedPersonnel: Personnel) => {
    setPersonnel(prev => prev.map(p => p.id === updatedPersonnel.id ? updatedPersonnel : p));
  };

  const deletePersonnel = (personnelId: string) => {
    setPersonnel(prev => prev.filter(p => p.id !== personnelId));
    setPersonnelPayments(prev => prev.filter(p => p.personnelId !== personnelId));
    // Also remove personnel from customer jobs
    setCustomerJobs(prev => prev.map(job => ({
        ...job,
        personnelIds: job.personnelIds.filter(id => id !== personnelId)
    })));
  };

  const addUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Customer CRUD
  const addCustomer = (newCustomerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...newCustomerData, id: `cust-${Date.now()}` };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCustomerJobs(prev => prev.filter(job => job.customerId !== customerId));
  };

  // Customer Job CRUD
  const addCustomerJob = (newJobData: Omit<CustomerJob, 'id'>) => {
    const newJob: CustomerJob = { ...newJobData, id: `job-${Date.now()}` };
    setCustomerJobs(prev => [...prev, newJob]);
  };

  const updateCustomerJob = (updatedJob: CustomerJob) => {
    setCustomerJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  const deleteCustomerJob = (jobId: string) => {
    setCustomerJobs(prev => prev.filter(job => job.id !== jobId));
  };

  // Defter Entry CRUD
  const addDefterEntry = (newEntryData: Omit<DefterEntry, 'id'>) => {
    const newEntry: DefterEntry = { ...newEntryData, id: `de-${Date.now()}` };
    setDefterEntries(prev => [...prev, newEntry]);
  };

  const updateDefterEntry = (updatedEntry: DefterEntry) => {
    setDefterEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const deleteDefterEntry = (entryId: string) => {
    setDefterEntries(prev => prev.filter(e => e.id !== entryId));
  };

  // Shared Expense CRUD
  const addSharedExpense = (newExpenseData: Omit<SharedExpense, 'id'>) => {
      const newExpense: SharedExpense = { ...newExpenseData, id: `se-${Date.now()}` };
      setSharedExpenses(prev => [...prev, newExpense]);
  }

  const updateSharedExpense = (updatedExpense: SharedExpense) => {
      setSharedExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }
  
  const deleteSharedExpense = (expenseId: string) => {
      setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
  }


  if (!isAuthenticated || !currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen md:flex">
       {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
            setGlobalSearchQuery('');
            setCurrentView(view);
            setIsSidebarOpen(false);
        }}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 min-w-0">
          {globalSearchQuery ? (
             <GlobalSearchView
                query={globalSearchQuery}
                personnel={personnel}
                customers={customers}
                customerJobs={customerJobs}
                defterEntries={defterEntries}
                sharedExpenses={sharedExpenses}
                onNavigate={handleNavigation}
             />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  currentUser={currentUser}
                  personnel={personnel}
                  personnelPayments={personnelPayments}
                  customerJobs={customerJobs}
                  selectedMonth={selectedMonth}
                  payments={payments}
                />
              )}
              {currentView === 'personnel' && (
                <PersonnelView
                  currentUser={currentUser}
                  users={users}
                  personnel={personnel}
                  customers={customers}
                  customerJobs={customerJobs}
                  personnelPayments={personnelPayments}
                  onAddPersonnel={addPersonnel}
                  onUpdatePersonnel={updatePersonnel}
                  onDeletePersonnel={deletePersonnel}
                  onAddPersonnelPayment={addPersonnelPayment}
                  onDeletePersonnelPayment={deletePersonnelPayment}
                  navigateToId={navigateToItem?.view === 'personnel' ? navigateToItem.id : null}
                  onNavigationComplete={handleNavigationComplete}
                />
              )}
               {currentView === 'customers' && currentUser.role === Role.ADMIN && (
                 <CustomerView
                    customers={customers}
                    customerJobs={customerJobs}
                    personnel={personnel}
                    onAddCustomer={addCustomer}
                    onUpdateCustomer={updateCustomer}
                    onDeleteCustomer={deleteCustomer}
                    onAddCustomerJob={addCustomerJob}
                    onUpdateCustomerJob={updateCustomerJob}
                    onDeleteCustomerJob={deleteCustomerJob}
                    navigateToId={navigateToItem?.view === 'customers' ? navigateToItem.id : null}
                    onNavigationComplete={handleNavigationComplete}
                 />
              )}
              {currentView === 'kasa' && currentUser.role === Role.ADMIN && (
                 <KasaView
                    customers={customers}
                    customerJobs={customerJobs}
                    personnel={personnel}
                    personnelPayments={personnelPayments}
                    defterEntries={defterEntries}
                    sharedExpenses={sharedExpenses}
                    onAddDefterEntry={addDefterEntry}
                    onUpdateDefterEntry={updateDefterEntry}
                    onDeleteDefterEntry={deleteDefterEntry}
                    onAddSharedExpense={addSharedExpense}
                    onUpdateSharedExpense={updateSharedExpense}
                    onDeleteSharedExpense={deleteSharedExpense}
                    onAddPersonnelPayment={addPersonnelPayment}
                    onDeletePersonnelPayment={deletePersonnelPayment}
                 />
              )}
              {currentView === 'reports' && currentUser.role === Role.ADMIN && (
                 <ReportView
                    users={users}
                    personnel={personnel}
                    personnelPayments={personnelPayments}
                    customers={customers}
                    customerJobs={customerJobs}
                    selectedMonth={selectedMonth}
                 />
              )}
              {currentView === 'admin' && currentUser.role === Role.ADMIN && (
                 <AdminView
                    currentUser={currentUser}
                    users={users}
                    personnel={personnel}
                    onAddUser={addUser}
                    onUpdateUser={updateUser}
                    onDeleteUser={deleteUser}
                 />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}