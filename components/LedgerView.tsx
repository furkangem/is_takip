

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { DefterEntry, DefterNote, User, Customer, CustomerJob, Personnel, PersonnelPayment, SharedExpense } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

const DefterView = lazy(() => import('./DefterView'));
const AnaKasaView = lazy(() => import('./AnaKasaView'));
const OrtakKasaView = lazy(() => import('./OrtakKasaView'));

type View = 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa' | 'timesheet';

interface KasaViewProps {
  currentUser: User;
  defterEntries: DefterEntry[];
  defterNotes: DefterNote[];
  sharedExpenses: SharedExpense[];
  onAddDefterEntry: (entry: Omit<DefterEntry, 'id'>) => void;
  onUpdateDefterEntry: (entry: DefterEntry) => void;
  onDeleteDefterEntry: (entryId: string) => void;
  onAddDefterNote: (note: Omit<DefterNote, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdateDefterNote: (note: DefterNote) => void;
  onDeleteDefterNote: (noteId: string) => void;
  onAddSharedExpense: (expense: Omit<SharedExpense, 'id'>) => void;
  onUpdateSharedExpense: (expense: SharedExpense) => void;
  onDeleteSharedExpense: (expenseId: number) => void; // This is now soft-delete
  onRestoreSharedExpense: (expenseId: number) => void;
  onPermanentlyDeleteSharedExpense: (expenseId: number) => void;
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  onNavigate: (view: View, id: string) => void;
  navigateToItem: { view: View, id: string } | null;
  onNavigationComplete: () => void;
}

const KasaView: React.FC<KasaViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'ana_kasa' | 'ortak_kasa' | 'defter'>('ana_kasa');

    useEffect(() => {
        if (props.navigateToItem && props.navigateToItem.view === 'kasa') {
            const { id } = props.navigateToItem;
            if (id.startsWith('se-')) { // Shared Expense
                setActiveTab('ortak_kasa');
            } else if (id.startsWith('le-') || id.startsWith('dn-')) { // Defter Entry or Note
                setActiveTab('defter');
            }
            // No need to switch for ana_kasa as it's the source of navigation, not destination.
        }
    }, [props.navigateToItem]);


    const tabStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
    const activeTabStyle = "bg-blue-600 text-white";
    const inactiveTabStyle = "text-gray-600 hover:bg-blue-100 hover:text-blue-700";

    const isReadOnly = props.currentUser.role === 'VIEWER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-700">Finans Yönetimi</h2>
                <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
                    <button onClick={() => setActiveTab('ana_kasa')} className={`${tabStyle} ${activeTab === 'ana_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ana Kasa</button>
                    <button onClick={() => setActiveTab('ortak_kasa')} className={`${tabStyle} ${activeTab === 'ortak_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ortak Kasa</button>
                    <button onClick={() => setActiveTab('defter')} className={`${tabStyle} ${activeTab === 'defter' ? activeTabStyle : inactiveTabStyle}`}>Defter</button>
                </div>
            </div>
            
            <Suspense fallback={<LoadingSpinner />}>
                {activeTab === 'ana_kasa' && (
                    <AnaKasaView
                        customers={props.customers}
                        customerJobs={props.customerJobs}
                        personnel={props.personnel}
                        sharedExpenses={props.sharedExpenses}
                        personnelPayments={props.personnelPayments}
                        onNavigate={props.onNavigate}
                    />
                )}
                {activeTab === 'ortak_kasa' && (
                    <OrtakKasaView
                        expenses={props.sharedExpenses}
                        onAdd={props.onAddSharedExpense}
                        onUpdate={props.onUpdateSharedExpense}
                        onDelete={props.onDeleteSharedExpense}
                        onRestore={props.onRestoreSharedExpense}
                        onPermanentlyDelete={props.onPermanentlyDeleteSharedExpense}
                        isReadOnly={isReadOnly}
                        navigateToId={props.navigateToItem?.id.startsWith('se-') ? props.navigateToItem.id : null}
                        onNavigationComplete={props.onNavigationComplete}
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
                        navigateToId={(props.navigateToItem?.id.startsWith('le-') || props.navigateToItem?.id.startsWith('dn-')) ? props.navigateToItem.id : null}
                        onNavigationComplete={props.onNavigationComplete}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default KasaView;