
import React, { useState } from 'react';
import { users as initialUsers, personnel as initialPersonnel, workDays as initialWorkDays, personnelPayments as initialPersonnelPayments, customers as initialCustomers, customerJobs as initialCustomerJobs } from './data/mockData';
import { Role, User, Personnel, WorkDay, PersonnelPayment, Customer, CustomerJob } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PersonnelView from './components/PersonnelView';
import LoginView from './components/LoginView';
import ReportView from './components/ReportView';
import AdminView from './components/AdminView';
import TimeSheetView from './components/TimeSheetView';
import CustomerView from './components/CustomerView';

type View = 'dashboard' | 'personnel' | 'reports' | 'admin' | 'timesheet' | 'customers';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [workDays, setWorkDays] = useState<WorkDay[]>(initialWorkDays);
  const [personnelPayments, setPersonnelPayments] = useState<PersonnelPayment[]>(initialPersonnelPayments);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>(initialCustomerJobs);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard'); // Reset to dashboard on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const addWorkDay = (newWorkDay: Omit<WorkDay, 'id'>) => {
    setWorkDays(prev => [...prev, { ...newWorkDay, id: `${newWorkDay.personnelId}-${newWorkDay.date}-${Math.random()}` }]);
  };

  const updateWorkDay = (updatedWorkDay: WorkDay) => {
    setWorkDays(prev => prev.map(wd => wd.id === updatedWorkDay.id ? updatedWorkDay : wd));
  };

  const deleteWorkDay = (workDayId: string) => {
    setWorkDays(prev => prev.filter(wd => wd.id !== workDayId));
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
    setWorkDays(prev => prev.filter(wd => wd.personnelId !== personnelId));
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

  if (!isAuthenticated || !currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        currentUser={currentUser}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              personnel={personnel}
              workDays={workDays}
              personnelPayments={personnelPayments}
              customerJobs={customerJobs}
              selectedMonth={selectedMonth}
            />
          )}
          {currentView === 'personnel' && (
            <PersonnelView
              currentUser={currentUser}
              users={users}
              personnel={personnel}
              workDays={workDays}
              personnelPayments={personnelPayments}
              onAddWorkDay={addWorkDay}
              onUpdateWorkDay={updateWorkDay}
              onDeleteWorkDay={deleteWorkDay}
              onAddPersonnel={addPersonnel}
              onUpdatePersonnel={updatePersonnel}
              onDeletePersonnel={deletePersonnel}
              onAddPersonnelPayment={addPersonnelPayment}
              onDeletePersonnelPayment={deletePersonnelPayment}
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
             />
          )}
          {currentView === 'reports' && currentUser.role === Role.ADMIN && (
             <ReportView
                users={users}
                personnel={personnel}
                workDays={workDays}
                personnelPayments={personnelPayments}
                customers={customers}
                customerJobs={customerJobs}
                selectedMonth={selectedMonth}
             />
          )}
          {currentView === 'timesheet' && currentUser.role === Role.ADMIN && (
             <TimeSheetView
                personnel={personnel}
                workDays={workDays}
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
        </main>
      </div>
    </div>
  );
}
