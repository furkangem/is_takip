
import React, { useState, useMemo } from 'react';
import { users as initialUsers, personnel as initialPersonnel, workDays as initialWorkDays, payments as initialPayments, extraIncomes as initialIncomes, extraExpenses as initialExpenses, personnelPayments as initialPersonnelPayments } from './data/mockData';
import { Role, User, Personnel, WorkDay, Payment, Income, Expense, PersonnelPayment } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PersonnelView from './components/PersonnelView';
import FinanceView from './components/FinanceView';
import LoginView from './components/LoginView';
import ReportView from './components/ReportView';
import AdminView from './components/AdminView';
import DirectPersonnelView from './components/DirectPersonnelView';
import TimeSheetView from './components/TimeSheetView';
import CashFlowView from './components/CashFlowView';

type View = 'dashboard' | 'personnel' | 'finance' | 'reports' | 'admin' | 'direct_personnel' | 'timesheet' | 'cashflow';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [workDays, setWorkDays] = useState<WorkDay[]>(initialWorkDays);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [personnelPayments, setPersonnelPayments] = useState<PersonnelPayment[]>(initialPersonnelPayments);
  const [extraIncomes, setExtraIncomes] = useState<Income[]>(initialIncomes);
  const [extraExpenses, setExtraExpenses] = useState<Expense[]>(initialExpenses);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard'); // Reset to dashboard on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && currentUser) {
      setCurrentUser(user);
      const nonAdminViews: View[] = ['finance', 'reports', 'admin', 'direct_personnel', 'timesheet', 'cashflow'];
      if (user.role !== Role.ADMIN && nonAdminViews.includes(currentView)) {
        setCurrentView('dashboard');
      }
    }
  };

  const visiblePersonnel = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === Role.ADMIN) {
      // In personnel view, admin sees everyone except their own direct reports
      return personnel.filter(p => p.foremanId !== currentUser.id && users.some(u => u.id === p.foremanId && u.role === Role.FOREMAN));
    }
    // Foreman sees their own team
    return personnel.filter(p => p.foremanId === currentUser.id);
  }, [currentUser, personnel, users]);

  const addWorkDay = (newWorkDay: Omit<WorkDay, 'id'>) => {
    setWorkDays(prev => [...prev, { ...newWorkDay, id: `${newWorkDay.personnelId}-${newWorkDay.date}-${Math.random()}` }]);
  };

  const updateWorkDay = (updatedWorkDay: WorkDay) => {
    setWorkDays(prev => prev.map(wd => wd.id === updatedWorkDay.id ? updatedWorkDay : wd));
  };

  const deleteWorkDay = (workDayId: string) => {
    setWorkDays(prev => prev.filter(wd => wd.id !== workDayId));
  };

  const addPayment = (newPayment: Omit<Payment, 'id'>) => {
    setPayments(prev => [...prev, { ...newPayment, id: `pay-${Date.now()}` }]);
  };
  
  const addPersonnelPayment = (newPayment: Omit<PersonnelPayment, 'id'>) => {
    setPersonnelPayments(prev => [...prev, { ...newPayment, id: `ppay-${Date.now()}` }]);
  };

  const deletePersonnelPayment = (paymentId: string) => {
    setPersonnelPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const addIncome = (newIncome: Omit<Income, 'id'>) => {
    setExtraIncomes(prev => [...prev, { ...newIncome, id: `inc-${Date.now()}` }]);
  };
  
  const addExpense = (newExpense: Omit<Expense, 'id'>) => {
    setExtraExpenses(prev => [...prev, { ...newExpense, id: `exp-${Date.now()}` }]);
  };
  
  const deleteIncome = (incomeId: string) => {
    setExtraIncomes(prev => prev.filter(inc => inc.id !== incomeId));
  };

  const deleteExpense = (expenseId: string) => {
    setExtraExpenses(prev => prev.filter(exp => exp.id !== expenseId));
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
          users={users}
          onUserChange={handleUserChange}
          onLogout={handleLogout}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              users={users}
              personnel={personnel}
              workDays={workDays}
              payments={payments}
              personnelPayments={personnelPayments}
              extraIncomes={extraIncomes}
              extraExpenses={extraExpenses}
              onAddPayment={addPayment}
              selectedMonth={selectedMonth}
            />
          )}
          {currentView === 'personnel' && (
            <PersonnelView
              currentUser={currentUser}
              users={users}
              personnel={visiblePersonnel}
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
          {currentView === 'direct_personnel' && currentUser.role === Role.ADMIN && (
             <DirectPersonnelView
                currentUser={currentUser}
                personnel={personnel.filter(p => p.foremanId === currentUser.id)}
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
          {currentView === 'finance' && currentUser.role === Role.ADMIN && (
             <FinanceView
                users={users}
                personnel={personnel}
                incomes={extraIncomes}
                expenses={extraExpenses}
                onAddIncome={addIncome}
                onAddExpense={addExpense}
                onDeleteIncome={deleteIncome}
                onDeleteExpense={deleteExpense}
                selectedMonth={selectedMonth}
                onAddPayment={addPayment}
                onAddPersonnelPayment={addPersonnelPayment}
             />
          )}
           {currentView === 'cashflow' && currentUser.role === Role.ADMIN && (
             <CashFlowView
                users={users}
                personnel={personnel}
                payments={payments}
                personnelPayments={personnelPayments}
                extraIncomes={extraIncomes}
                extraExpenses={extraExpenses}
                selectedMonth={selectedMonth}
             />
          )}
          {currentView === 'reports' && currentUser.role === Role.ADMIN && (
             <ReportView
                users={users}
                personnel={personnel}
                workDays={workDays}
                payments={payments}
                personnelPayments={personnelPayments}
                extraIncomes={extraIncomes}
                extraExpenses={extraExpenses}
                selectedMonth={selectedMonth}
             />
          )}
          {currentView === 'timesheet' && currentUser.role === Role.ADMIN && (
             <TimeSheetView
                users={users}
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
