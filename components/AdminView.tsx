

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { User, Role, Personnel } from '../types';
import { XMarkIcon, PlusIcon, UserGroupIcon, IdentificationIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from './icons/Icons';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

interface AdminViewProps {
    currentUser: User;
    users: User[];
    personnel: Personnel[];
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

const UserEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User | Omit<User, 'id'>) => void;
    userToEdit: User | null;
}> = ({ isOpen, onClose, onSave, userToEdit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.VIEWER);

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setName(userToEdit.name);
                setEmail(userToEdit.email);
                setPassword(userToEdit.password);
                setRole(userToEdit.role);
            } else {
                setName('');
                setEmail('');
                setPassword('');
                setRole(Role.VIEWER);
            }
        }
    }, [isOpen, userToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }
        
        const userData = { name, email, password, role };

        if (userToEdit) {
            onSave({ ...userToEdit, ...userData });
        } else {
            onSave(userData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                       {userToEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="user-name" className="block text-sm font-medium text-gray-700">İsim Soyisim</label>
                        <input
                            type="text"
                            id="user-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required autoFocus
                        />
                    </div>
                     <div>
                        <label htmlFor="user-email" className="block text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            type="email"
                            id="user-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-gray-700">Şifre</label>
                        <input
                            type="text"
                            id="user-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-gray-700">Rol</label>
                        <select
                            id="user-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value={Role.SUPER_ADMIN}>Süper Admin</option>
                            <option value={Role.VIEWER}>Görüntüleyici</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminView: React.FC<AdminViewProps> = ({ currentUser, users, personnel, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        let filtered = users;
        if (searchQuery) {
            filtered = users.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        // En yeni kayıtlar üstte olacak şekilde ID'ye göre sırala
        return filtered.sort((a, b) => b.id - a.id);
    }, [users, searchQuery]);

    const getRoleName = (role: Role) => {
        if (role === Role.SUPER_ADMIN) return { name: 'Süper Admin', color: 'bg-red-100 text-red-800' };
        if (role === Role.VIEWER) return { name: 'Görüntüleyici', color: 'bg-indigo-100 text-indigo-800' };
        return { name: 'Bilinmeyen', color: 'bg-gray-100 text-gray-800' };
    };

    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsUserModalOpen(true);
    };

    const handleOpenDeleteModal = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = (data: User | Omit<User, 'id'>) => {
        if ('id' in data) {
            onUpdateUser(data);
        } else {
            onAddUser(data);
        }
    };
    
    const handleConfirmDelete = () => {
        if (!userToDelete) return;
        
        onDeleteUser(userToDelete.id);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-700">Kullanıcı Yönetimi</h2>
                    <button onClick={handleOpenAddModal} className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Yeni Kullanıcı Ekle
                    </button>
                </div>
                 <div className="mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="İsim veya e-posta ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold">İsim</th>
                                    <th className="p-4 font-semibold">E-posta</th>
                                    <th className="p-4 font-semibold hidden md:table-cell">Şifre</th>
                                    <th className="p-4 font-semibold">Rol</th>
                                    <th className="p-4 font-semibold text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map(user => {
                                    const roleInfo = getRoleName(user.role);
                                    const isCurrentUser = user.id === currentUser.id;
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-medium text-gray-800 flex items-center whitespace-nowrap">
                                                <IdentificationIcon className="h-5 w-5 mr-3 text-gray-400"/>
                                                {user.name}
                                            </td>
                                            <td className="p-4 text-gray-600 whitespace-nowrap">{user.email}</td>
                                            <td className="p-4 text-gray-600 font-mono text-sm hidden md:table-cell">{user.password}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                                                    {roleInfo.name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenEditModal(user)} 
                                                        disabled={isCurrentUser}
                                                        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                        aria-label="Kullanıcıyı Düzenle"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenDeleteModal(user)} 
                                                        disabled={isCurrentUser}
                                                        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                        aria-label="Kullanıcıyı Sil"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                             <div className="flex flex-col items-center justify-center">
                                                {users.length > 0 && searchQuery ? (
                                                    <>
                                                        <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                                        <p className="font-medium">Sonuç Bulunamadı</p>
                                                        <p className="text-sm text-gray-400">'{searchQuery}' için kullanıcı bulunamadı.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserGroupIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                                        <p className="font-medium">Kullanıcı bulunmuyor.</p>
                                                        <p className="text-sm text-gray-400">Başlamak için yeni bir kullanıcı ekleyin.</p>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Suspense fallback={null}>
                {isUserModalOpen && (
                    <UserEditorModal
                        isOpen={isUserModalOpen}
                        onClose={() => setIsUserModalOpen(false)}
                        onSave={handleSaveUser}
                        userToEdit={userToEdit}
                    />
                )}
                {isDeleteModalOpen && (
                    <ConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleConfirmDelete}
                        title="Kullanıcıyı Sil"
                        message={`'${userToDelete?.name}' adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                    />
                )}
            </Suspense>
        </>
    );
};

export default AdminView;