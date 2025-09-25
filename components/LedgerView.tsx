

import React, { useState } from 'react';
import { DefterEntry, SharedExpense, DefterNote, User, Customer, CustomerJob, Personnel, PersonnelPayment } from '../types';
import DefterView from './DefterView';
import OrtakKasaView from './OrtakKasaView';
import AnaKasaView from './AnaKasaView';

type View = 'dashboard' | 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa' | 'timesheet';

interface KasaViewProps {
  currentUser: User;
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  defterNotes: DefterNote[];
  onAddDefterEntry: (entry: Omit<DefterEntry, 'id'>) => void;
  onUpdateDefterEntry: (entry: DefterEntry) => void;
  onDeleteDefterEntry: (entryId: string) => void;
  onAddDefterNote: (note: Omit<DefterNote, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdateDefterNote: (note: DefterNote) => void;
  onDeleteDefterNote: (noteId: string) => void;
  onAddSharedExpense: (expense: Omit<SharedExpense, 'id'>) => void;
  onUpdateSharedExpense: (expense: SharedExpense) => void;
  onDeleteSharedExpense: (expenseId: string) => void;
  // Props for AnaKasaView
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  onNavigate: (view: View, id: string) => void;
}

const KasaView: React.FC<KasaViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'defter' | 'ortak_kasa' | 'ana_kasa'>('ana_kasa');

    const tabStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
    const activeTabStyle = "bg-blue-600 text-white";
    const inactiveTabStyle = "text-gray-600 hover:bg-blue-100 hover:text-blue-700";

    const isReadOnly = props.currentUser.role === 'VIEWER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-700">Kasa Yönetimi</h2>
                <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
                    <button onClick={() => setActiveTab('ana_kasa')} className={`${tabStyle} ${activeTab === 'ana_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ana Kasa</button>
                    <button onClick={() => setActiveTab('defter')} className={`${tabStyle} ${activeTab === 'defter' ? activeTabStyle : inactiveTabStyle}`}>Defter</button>
                    <button onClick={() => setActiveTab('ortak_kasa')} className={`${tabStyle} ${activeTab === 'ortak_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ortak Kasa</button>
                </div>
            </div>

            {activeTab === 'ana_kasa' && (
                <AnaKasaView
                    customers={props.customers}
                    customerJobs={props.customerJobs}
                    personnel={props.personnel}
                    personnelPayments={props.personnelPayments}
                    defterEntries={props.defterEntries}
                    sharedExpenses={props.sharedExpenses}
                    onNavigate={props.onNavigate}
                />
            )}
            {activeTab === 'defter' && (
                <DefterView 
                    entries={props.defterEntries}
                    notes={props.defterNotes}
                    onAddEntry={props.onAddDefterEntry} 
                    onUpdateEntry={props.onUpdateDefterEntry} 
                    onDeleteEntry={props.onDeleteDefterEntry}
                    onAddNote={props.onAddDefterNote}
                    onUpdateNote={props.onUpdateDefterNote}
                    onDeleteNote={props.onDeleteDefterNote}
                    isReadOnly={isReadOnly}
                />
            )}
            {activeTab === 'ortak_kasa' && (
                <OrtakKasaView
                    expenses={props.sharedExpenses}
                    onAdd={props.onAddSharedExpense} 
                    onUpdate={props.onUpdateSharedExpense} 
                    onDelete={props.onDeleteSharedExpense}
                    isReadOnly={isReadOnly}
                />
            )}
        </div>
    );
}

export default KasaView;