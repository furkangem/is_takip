import React, { useMemo } from 'react';
import { Personnel, Customer, CustomerJob, DefterEntry, SharedExpense } from '../types';
import { UsersIcon, BuildingOffice2Icon, ClipboardDocumentListIcon, BanknotesIcon, MagnifyingGlassIcon } from './icons/Icons';

type View = 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa';

interface GlobalSearchViewProps {
  query: string;
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  onNavigate: (view: View, id: string) => void;
}

interface SearchResult {
    type: 'personnel' | 'customer' | 'job' | 'defter' | 'sharedExpense';
    id: string; // unique key for react list
    navigateToView: View;
    navigateToId: string;
    primaryText: string;
    secondaryText: string;
    icon: React.ElementType;
}

const NoResults: React.FC = () => (
    <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">Arama sonucu bulunamadı.</p>
        <p className="text-gray-400">Lütfen farklı bir arama terimi deneyin.</p>
    </div>
);

const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ query, personnel, customers, customerJobs, defterEntries, sharedExpenses, onNavigate }) => {
    
    const allResults: SearchResult[] = useMemo(() => {
        const results: SearchResult[] = [];
        if (!query) return results;

        const lowerCaseQuery = query.toLowerCase();

        // Personnel
        personnel
            .filter(p => p.name.toLowerCase().includes(lowerCaseQuery))
            .forEach(p => results.push({
                type: 'personnel',
                id: `personnel-${p.id}`,
                navigateToView: 'personnel',
                navigateToId: p.id,
                primaryText: p.name,
                secondaryText: 'Personel',
                icon: UsersIcon,
            }));

        // Customers
        customers
            .filter(c => c.name.toLowerCase().includes(lowerCaseQuery))
            .forEach(c => results.push({
                type: 'customer',
                id: `customer-${c.id}`,
                navigateToView: 'customers',
                navigateToId: c.id,
                primaryText: c.name,
                secondaryText: 'Müşteri',
                icon: BuildingOffice2Icon,
            }));
        
        // Customer Jobs
        customerJobs
            .filter(j => j.description.toLowerCase().includes(lowerCaseQuery) || j.location.toLowerCase().includes(lowerCaseQuery))
            .forEach(j => {
                const customerName = customers.find(c => c.id === j.customerId)?.name || 'Bilinmeyen Müşteri';
                results.push({
                    type: 'job',
                    id: `job-${j.id}`,
                    navigateToView: 'customers',
                    navigateToId: j.customerId,
                    primaryText: `${j.location}: ${j.description}`,
                    secondaryText: `İş Kaydı (${customerName})`,
                    icon: ClipboardDocumentListIcon,
                });
            });

        // Defter Entries
        defterEntries
            .filter(l => l.description.toLowerCase().includes(lowerCaseQuery))
            .forEach(l => results.push({
                type: 'defter',
                id: `defter-${l.id}`,
                navigateToView: 'kasa',
                navigateToId: l.id,
                primaryText: l.description,
                secondaryText: 'Defter Kaydı',
                icon: BanknotesIcon,
            }));

        // Shared Expenses
        sharedExpenses
            .filter(e => !e.deletedAt && e.description.toLowerCase().includes(lowerCaseQuery))
            .forEach(e => results.push({
                type: 'sharedExpense',
                id: `sharedExpense-${e.id}`,
                navigateToView: 'kasa',
                navigateToId: e.id,
                primaryText: e.description,
                secondaryText: 'Ortak Kasa Gideri',
                icon: BanknotesIcon,
            }));
        
        // En yeni kayıtlar üstte olacak şekilde ID'ye göre sırala
        return results.sort((a, b) => {
            // ID'den sayısal değeri çıkar
            const aId = parseInt(a.id.split('-').pop() || '0');
            const bId = parseInt(b.id.split('-').pop() || '0');
            return bId - aId;
        });
    }, [query, personnel, customers, customerJobs, defterEntries, sharedExpenses]);


    if (allResults.length === 0) {
        return <NoResults />;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-700">Arama Sonuçları: <span className="text-blue-600">"{query}"</span></h2>
            
            <div className="bg-white rounded-lg shadow-md">
                <ul className="divide-y divide-gray-200">
                    {allResults.map((result) => {
                        const Icon = result.icon;
                        return (
                            <li key={result.id}>
                                <button 
                                    onClick={() => onNavigate(result.navigateToView, result.navigateToId)} 
                                    className="w-full text-left p-4 hover:bg-gray-50 focus:outline-none focus:bg-blue-50 transition-colors"
                                    aria-label={`Git: ${result.primaryText}, ${result.secondaryText}`}
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                                            <Icon className="h-6 w-6 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{result.primaryText}</p>
                                            <p className="text-xs text-gray-500">{result.secondaryText}</p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default GlobalSearchView;