
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { users as initialUsers, personnel as initialPersonnel, personnelPayments as initialPersonnelPayments, customers as initialCustomers, customerJobs as initialCustomerJobs, defterEntries as initialDefterEntries, defterNotes as initialDefterNotes, workDays as initialWorkDays, sharedExpenses as initialSharedExpenses } from './data/mockData';
import { Role, User, Personnel, PersonnelPayment, Customer, CustomerJob, DefterEntry, DefterNote, WorkDay, SharedExpense } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import LoadingSpinner from './components/ui/LoadingSpinner';

const PersonnelView = lazy(() => import('./components/PersonnelView'));
const ReportView = lazy(() => import('./components/ReportView'));
const AdminView = lazy(() => import('./components/AdminView'));
const CustomerView = lazy(() => import('./components/CustomerView'));
const KasaView = lazy(() => import('./components/LedgerView'));
const GlobalSearchView = lazy(() => import('./components/GlobalSearchView'));
const TimeSheetView = lazy(() => import('./components/TimeSheetView'));

type View = 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa' | 'timesheet';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('customers');
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [personnelPayments, setPersonnelPayments] = useState<PersonnelPayment[]>(initialPersonnelPayments);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>(initialCustomerJobs);
  const [defterEntries, setDefterEntries] = useState<DefterEntry[]>(initialDefterEntries);
  const [defterNotes, setDefterNotes] = useState<DefterNote[]>(initialDefterNotes);
  const [workDays, setWorkDays] = useState<WorkDay[]>(initialWorkDays);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>(initialSharedExpenses);
  
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [navigateToItem, setNavigateToItem] = useState<{ view: View, id: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user: User = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
    }
  }, []);

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
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.email === 'baris') {
      setCurrentView('timesheet');
    } else {
      setCurrentView('customers'); // Reset to customers on login
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };
  
  const addPersonnelPayment = (newPayment: Omit<PersonnelPayment, 'id'>) => {
    setPersonnelPayments(prev => [...prev, { ...newPayment, id: `ppay-${Date.now()}` }]);
  };

  const updatePersonnelPayment = (updatedPayment: PersonnelPayment) => {
    setPersonnelPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
  };

  const deletePersonnelPayment = (paymentId: string) => {
    setPersonnelPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  // Shared Expense CRUD
  const addSharedExpense = (newExpenseData: Omit<SharedExpense, 'id'>) => {
    const newExpense: SharedExpense = { ...newExpenseData, id: `se-${Date.now()}` };
    setSharedExpenses(prev => [...prev, newExpense]);
  };

  const updateSharedExpense = (updatedExpense: SharedExpense) => {
    setSharedExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteSharedExpense = (expenseId: string) => {
    setSharedExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, deletedAt: new Date().toISOString() } : e));
  };
  
  const restoreSharedExpense = (expenseId: string) => {
    setSharedExpenses(prev => prev.map(e => {
        if (e.id === expenseId) {
            const { deletedAt, ...rest } = e;
            return rest;
        }
        return e;
    }));
  };

  const permanentlyDeleteSharedExpense = (expenseId: string) => {
    setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
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
    const jobsToDelete = customerJobs.filter(job => job.customerId === customerId);
    const jobIdsToDelete = new Set(jobsToDelete.map(j => j.id));
    setWorkDays(prev => prev.filter(wd => !jobIdsToDelete.has(wd.customerJobId)));

    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCustomerJobs(prev => prev.filter(job => job.customerId !== customerId));
  };

  const generateWorkDaysForJob = (job: CustomerJob): WorkDay[] => {
      const newWorkDays: WorkDay[] = [];
      let workDayIdCounter = Date.now();
      
      const [startYear, startMonth, startDay] = job.date.split('-').map(Number);
      
      job.personnelPayments.forEach(pPayment => {
          const days = pPayment.daysWorked || 0;
          if (days <= 0) return;
          const dailyWage = pPayment.payment > 0 && days > 0 ? Math.round(pPayment.payment / days) : 0;
          for (let i = 0; i < days; i++) {
              const workDate = new Date(startYear, startMonth - 1, startDay);
              workDate.setDate(workDate.getDate() + i);

              const year = workDate.getFullYear();
              const month = (workDate.getMonth() + 1).toString().padStart(2, '0');
              const day = workDate.getDate().toString().padStart(2, '0');
              const dateString = `${year}-${month}-${day}`;

              newWorkDays.push({
                  id: `wd-${workDayIdCounter++}-${i}`,
                  personnelId: pPayment.personnelId,
                  customerJobId: job.id,
                  date: dateString,
                  wage: dailyWage,
              });
          }
      });
      return newWorkDays;
  }

  // Customer Job CRUD
  const addCustomerJob = (newJobData: Omit<CustomerJob, 'id'>) => {
    const newJob: CustomerJob = { ...newJobData, id: `job-${Date.now()}` };
    setCustomerJobs(prev => [...prev, newJob]);
    
    const newWorkDays = generateWorkDaysForJob(newJob);
    setWorkDays(prev => [...prev, ...newWorkDays]);
  };

  const updateCustomerJob = (updatedJob: CustomerJob) => {
    setCustomerJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
    
    setWorkDays(prevWorkDays => {
        const otherWorkDays = prevWorkDays.filter(wd => wd.customerJobId !== updatedJob.id);
        const newWorkDays = generateWorkDaysForJob(updatedJob);
        return [...otherWorkDays, ...newWorkDays];
    });
  };

  const deleteCustomerJob = (jobId: string) => {
    setCustomerJobs(prev => prev.filter(job => job.id !== jobId));
    setWorkDays(prev => prev.filter(wd => wd.customerJobId !== jobId));
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
  
  // Defter Note CRUD
  const addDefterNote = (newNoteData: Omit<DefterNote, 'id' | 'createdAt' | 'completed'>) => {
    const newNote: DefterNote = {
      ...newNoteData,
      id: `dn-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setDefterNotes(prev => [newNote, ...prev]);
  };

  const updateDefterNote = (noteToUpdate: DefterNote) => {
    setDefterNotes(prev => prev.map(n => n.id === noteToUpdate.id ? noteToUpdate : n));
  };

  const deleteDefterNote = (noteId: string) => {
    setDefterNotes(prev => prev.filter(n => n.id !== noteId));
  };

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
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 min-w-0">
          <Suspense fallback={<LoadingSpinner />}>
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
                {currentView === 'customers' && (
                  <CustomerView
                      currentUser={currentUser}
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
                {currentView === 'timesheet' && (
                  <TimeSheetView
                      personnel={personnel}
                      customers={customers}
                      customerJobs={customerJobs}
                      workDays={workDays}
                  />
                )}
                {currentView === 'kasa' && (
                  <KasaView
                      currentUser={currentUser}
                      customers={customers}
                      customerJobs={customerJobs}
                      personnel={personnel}
                      personnelPayments={personnelPayments}
                      defterEntries={defterEntries}
                      defterNotes={defterNotes}
                      sharedExpenses={sharedExpenses}
                      onAddDefterEntry={addDefterEntry}
                      onUpdateDefterEntry={updateDefterEntry}
                      onDeleteDefterEntry={deleteDefterEntry}
                      onAddDefterNote={addDefterNote}
                      onUpdateDefterNote={updateDefterNote}
                      onDeleteDefterNote={deleteDefterNote}
                      onAddSharedExpense={addSharedExpense}
                      onUpdateSharedExpense={updateSharedExpense}
                      onDeleteSharedExpense={deleteSharedExpense}
                      // FIX: Pass missing props to KasaView component.
                      onRestoreSharedExpense={restoreSharedExpense}
                      onPermanentlyDeleteSharedExpense={permanentlyDeleteSharedExpense}
                  />
                )}
                {currentView === 'reports' && (
                  <ReportView 
                    users={users}
                    personnel={personnel}
                    personnelPayments={personnelPayments}
                    customers={customers}
                    customerJobs={customerJobs}
                  />
                )}
                {currentView === 'admin' && (
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
          </Suspense>
        </main>
      </div>
    </div>
  );
}
