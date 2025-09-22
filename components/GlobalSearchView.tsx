

import React from 'react';
import { Personnel, Customer, CustomerJob, DefterEntry, SharedExpense } from '../types';
import { UsersIcon, BuildingOffice2Icon, ClipboardDocumentListIcon, BanknotesIcon, MagnifyingGlassIcon } from './icons/Icons';

type View = 'dashboard' | 'personnel' | 'reports' | 'admin' | 'timesheet' | 'customers' | 'kasa' | 'team';

interface GlobalSearchViewProps {
  query: string;
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  onNavigate: (view: View, id: string) => void;
}

const SearchResultSection: React.FC<{
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold flex items-center p-4 border-b">
            <Icon className="h-6 w-6 mr-3 text-blue-500" /> {title}
        </h3>
        <div className="p-2">{children}</div>
    </div>
);

const NoResults: React.FC = () => (
    <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">Arama sonucu bulunamadı.</p>
        <p className="text-gray-400">Lütfen farklı bir arama terimi deneyin.</p>
    </div>
);

const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ query, personnel, customers, customerJobs, defterEntries, sharedExpenses, onNavigate }) => {
    const lowerCaseQuery = query.toLowerCase();

    const personnelResults = personnel.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
    const customerResults = customers.filter(c => c.name.toLowerCase().includes(lowerCaseQuery));
    const jobResults = customerJobs.filter(j => j.description.toLowerCase().includes(lowerCaseQuery) || j.location.toLowerCase().includes(lowerCaseQuery));
    const defterResults = defterEntries.filter(l => l.description.toLowerCase().includes(lowerCaseQuery));
    const sharedExpenseResults = sharedExpenses.filter(se => se.description.toLowerCase().includes(lowerCaseQuery));

    const hasResults = personnelResults.length > 0 || customerResults.length > 0 || jobResults.length > 0 || defterResults.length > 0 || sharedExpenseResults.length > 0;
    
    const handleJobClick = (job: CustomerJob) => {
        onNavigate('customers', job.customerId);
    }
    
    const handleFinanceClick = (id: string) => {
        onNavigate('kasa', id);
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-700">Arama Sonuçları: <span className="text-blue-600">"{query}"</span></h2>

            {!hasResults && <NoResults />}

            {personnelResults.length > 0 && (
                <SearchResultSection title="Personeller" icon={UsersIcon}>
                    <ul>
                        {personnelResults.map(p => (
                            <li key={p.id}>
                                <button onClick={() => onNavigate('personnel', p.id)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                                    {p.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </SearchResultSection>
            )}

            {customerResults.length > 0 && (
                <SearchResultSection title="Müşteriler" icon={BuildingOffice2Icon}>
                    <ul>
                        {customerResults.map(c => (
                            <li key={c.id}>
                                <button onClick={() => onNavigate('customers', c.id)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                                    <p className="font-medium">{c.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.jobDescription}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SearchResultSection>
            )}

            {jobResults.length > 0 && (
                 <SearchResultSection title="Müşteri İşleri" icon={ClipboardDocumentListIcon}>
                    <ul>
                        {jobResults.map(j => {
                            const customer = customers.find(c => c.id === j.customerId);
                            return (
                                <li key={j.id}>
                                    <button onClick={() => handleJobClick(j)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                                        <p className="font-medium">{j.description} - <span className="text-sm text-gray-600">{j.location}</span></p>
                                        <p className="text-xs text-gray-500">Müşteri: {customer?.name || 'Bilinmiyor'}</p>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </SearchResultSection>
            )}
            
            {defterResults.length > 0 && (
                 <SearchResultSection title="Defter Kayıtları" icon={BanknotesIcon}>
                    <ul>
                        {defterResults.map(l => (
                             <li key={l.id}>
                                <button onClick={() => handleFinanceClick(l.id)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{l.description}</p>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${l.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {l.type === 'income' ? 'Alacak' : 'Borç'}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SearchResultSection>
            )}
            
            {sharedExpenseResults.length > 0 && (
                 <SearchResultSection title="Ortak Kasa Harcamaları" icon={BanknotesIcon}>
                    <ul>
                        {sharedExpenseResults.map(se => (
                             <li key={se.id}>
                                <button onClick={() => handleFinanceClick(se.id)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{se.description}</p>
                                        <span className="text-xs text-gray-500">Ödeyen: {se.payer}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SearchResultSection>
            )}
        </div>
    );
};

export default GlobalSearchView;