import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ListChecks, PlusCircle, XCircle, Edit3, Save, RotateCcw, AlertTriangle, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, FilterX } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Import Supabase client

// Define an interface for the sales data structure from Supabase
// Ensure this matches your Supabase table structure and the schema we defined.
// The `id` from Supabase will be a number if it's a SERIAL or INT PRIMARY KEY.
// If you used UUID, it would be string. Assuming number based on SERIAL.
interface SalesEntry {
  id: number; // Changed to number to match typical SERIAL PK
  client_name: string;
  task_due_datetime: string; // Supabase TIMESTAMP will be string
  price: number;
  task_status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded';
  paid_amount: number;
  created_at?: string; // Optional, Supabase handles this
  updated_at?: string; // Optional, Supabase handles this
}

// For local state, we might want a slightly different structure or to map Supabase names
// For simplicity, we'll use Supabase names directly for now.
// If your component used camelCase (e.g., clientName), you'd map them during fetch/save.

interface EditingCell {
  rowId: number; // Changed to number
  columnKey: keyof SalesEntry | null;
}

interface SortConfig {
  key: keyof SalesEntry | null;
  direction: 'ascending' | 'descending';
}

export const AdminSalesTracker: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SalesEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'descending' });
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM format, empty for no filter

  // Form states (using Supabase column names for consistency)
  const [newClientName, setNewClientName] = useState('');
  const [newTaskDueDatetime, setNewTaskDueDatetime] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newTaskStatus, setNewTaskStatus] = useState<SalesEntry['task_status']>('Pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState<SalesEntry['payment_status']>('Unpaid');
  const [newPaidAmount, setNewPaidAmount] = useState<number | ''>('');

  const displayMessage = (setter: React.Dispatch<React.SetStateAction<string | null>>, message: string | null, duration: number = 3000) => {
    setter(message);
    if (message) {
      setTimeout(() => setter(null), duration);
    }
  };

  // Fetch data from Supabase
  const fetchSalesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, fetch all data. Server-side filtering by month can be added later for optimization.
      const { data, error: fetchError } = await supabase
        .from('salestrackers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSalesData(data || []);
    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      displayMessage(setError, `Failed to load data: ${err.message}`);
      setSalesData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const resetForm = () => {
    setNewClientName('');
    setNewTaskDueDatetime('');
    setNewPrice('');
    setNewTaskStatus('Pending');
    setNewPaymentStatus('Unpaid');
    setNewPaidAmount('');
  };
  
  const closeAndResetForm = () => {
    resetForm();
    setShowAddForm(false);
  }

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newTaskDueDatetime || newPrice === '' || newPaidAmount === '' || Number(newPrice) < 0 || Number(newPaidAmount) < 0) {
      displayMessage(setError, 'Please fill in all required fields with valid positive numbers for amounts.');
      return;
    }
    setIsLoading(true);
    const newEntryPayload = {
      client_name: newClientName,
      task_due_datetime: newTaskDueDatetime,
      price: Number(newPrice),
      task_status: newTaskStatus,
      payment_status: newPaymentStatus,
      paid_amount: Number(newPaidAmount),
    };
    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('salestrackers')
        .insert(newEntryPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      if (insertedData) {
        // Instead of just prepending, fetch data again to get correct sort order or add and sort client-side
        // For simplicity, just prepend and rely on next full sort or fetch
        setSalesData(prevData => [insertedData, ...prevData]);
        displayMessage(setSuccessMessage, 'Commission entry added successfully!');
        closeAndResetForm();
      } else {
        throw new Error("No data returned after insert.");
      }
    } catch (err: any) {
      console.error("Error adding commission:", err);
      displayMessage(setError, `Failed to add commission entry: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (rowId: number, columnKey: keyof SalesEntry, currentValue: any) => {
    setEditingCell({ rowId, columnKey });
    setEditFormData({ [columnKey]: currentValue });
  };

  const handleEditChange = (columnKey: keyof SalesEntry, value: any) => {
    setEditFormData(prev => ({ ...prev, [columnKey]: value }));
  };

  const handleSaveEdit = async (rowId: number) => {
    if (!editingCell || !editingCell.columnKey) return;
    const columnKey = editingCell.columnKey;
    let valueToSave = editFormData[columnKey];
    if (columnKey === 'price' || columnKey === 'paid_amount') {
      const numValue = parseFloat(String(valueToSave));
      if (isNaN(numValue) || numValue < 0) {
        displayMessage(setError, 'Price and Paid Amount must be valid positive numbers.');
        const originalEntry = salesData.find(entry => entry.id === rowId);
        if (originalEntry) setEditFormData({ [columnKey]: originalEntry[columnKey!] });
        setEditingCell(null);
        return;
      }
      valueToSave = numValue;
    }
    setIsLoading(true);
    try {
      const { data: updatedData, error: updateError } = await supabase
        .from('salestrackers')
        .update({ [columnKey]: valueToSave, updated_at: new Date().toISOString() })
        .eq('id', rowId)
        .select()
        .single();
      if (updateError) throw updateError;
      if (updatedData) {
        setSalesData(prevData => prevData.map(row => (row.id === rowId ? updatedData : row)));
        displayMessage(setSuccessMessage, 'Commission entry updated successfully!');
      } else {
         throw new Error("No data returned after update.");
      }
    } catch (err: any) {
      console.error("Error updating commission:", err);
      displayMessage(setError, `Failed to update commission entry: ${err.message}`);
      fetchSalesData();
    } finally {
      setIsLoading(false);
      setEditingCell(null);
      setEditFormData({});
    }
  };
  
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditFormData({});
  };

  const handleDeleteCommission = async (saleId: number, clientName: string) => {
    if (!window.confirm(`Are you sure you want to delete the commission entry for "${clientName}"? This action cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('salestrackers')
        .delete()
        .eq('id', saleId);

      if (deleteError) throw deleteError;

      setSalesData(prevData => prevData.filter(item => item.id !== saleId));
      displayMessage(setSuccessMessage, 'Commission entry deleted successfully!');
    } catch (err: any) {
      console.error("Error deleting commission:", err);
      displayMessage(setError, `Failed to delete commission entry: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestSort = (key: keyof SalesEntry) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredSalesData = useMemo(() => {
    if (!selectedMonth) {
      return salesData; // No filter applied
    }
    return salesData.filter(entry => {
      if (!entry.task_due_datetime) return false;
      // task_due_datetime is like "2023-11-07T14:00:00"
      // selectedMonth is like "2023-11"
      return entry.task_due_datetime.startsWith(selectedMonth);
    });
  }, [salesData, selectedMonth]);

  const sortedAndFilteredSalesData = useMemo(() => {
    let itemsToProcess = [...filteredSalesData];
    if (sortConfig.key !== null) {
      const { key, direction } = sortConfig;
      itemsToProcess.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        let comparison = 0;
        if (key === 'task_due_datetime') {
          const dateA = new Date(String(valA)).getTime();
          const dateB = new Date(String(valB)).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) comparison = dateA - dateB;
          else if (!isNaN(dateA)) comparison = -1;
          else if (!isNaN(dateB)) comparison = 1;
          else comparison = String(valA).localeCompare(String(valB));
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return itemsToProcess;
  }, [filteredSalesData, sortConfig]);

  const commonInputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 bg-white disabled:bg-gray-100";
  const commonSelectClass = `${commonInputClass} appearance-none`;
  const commonThClass = "py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-white bg-blue-800 cursor-pointer hover:bg-blue-700 transition-colors duration-150";
  const commonTdClass = "py-3 px-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200";

  const getSortIcon = (columnKey: keyof SalesEntry) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50 inline-block" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp size={14} className="ml-1 inline-block" />;
    }
    return <ArrowDown size={14} className="ml-1 inline-block" />;
  };
  
  const totalPrice = useMemo(() => sortedAndFilteredSalesData.reduce((sum, entry) => sum + Number(entry.price || 0), 0), [sortedAndFilteredSalesData]);
  const totalPaidAmount = useMemo(() => sortedAndFilteredSalesData.reduce((sum, entry) => sum + Number(entry.paid_amount || 0), 0), [sortedAndFilteredSalesData]);

  const tableHeaders: { key: keyof SalesEntry; label: string; sortable?: boolean }[] = [
    { key: 'client_name', label: 'Client Name', sortable: true },
    { key: 'task_due_datetime', label: 'Task Due Date & Time', sortable: true },
    { key: 'price', label: 'Price (₱)', sortable: true },
    { key: 'task_status', label: 'Task Status', sortable: true },
    { key: 'payment_status', label: 'Payment Status', sortable: true },
    { key: 'paid_amount', label: 'Paid Amount (₱)', sortable: true },
  ];

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl min-h-[calc(100vh-150px)] flex flex-col relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Messages Area */}
      {error && (
        <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-lg z-[100]" role="alert">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <strong className="font-bold">Error:</strong>
          </div>
          <span className="block sm:inline ml-8">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <XCircle size={20} />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-lg z-[100]" role="alert">
           <div className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-2" />
            <strong className="font-bold">Success:</strong>
          </div>
          <span className="block sm:inline ml-8">{successMessage}</span>
           <button onClick={() => setSuccessMessage(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <XCircle size={20} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-4">
        <div className="flex items-center">
          <ListChecks className="w-7 h-7 mr-3 text-blue-700" />
          <h2 className="text-3xl font-bold text-blue-900">Commissions Tracker</h2>
        </div>
        <div className="flex items-center gap-x-3">
            <div>
                <label htmlFor="month-filter" className="sr-only">Filter by Month</label>
                <input 
                    type="month" 
                    id="month-filter" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`${commonInputClass} py-1.5 text-sm`}
                    disabled={isLoading}
                />
            </div>
            {selectedMonth && (
                <button 
                    onClick={() => setSelectedMonth('')} 
                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition duration-150 ease-in-out text-sm"
                    disabled={isLoading}
                    title="Clear month filter"
                >
                    <FilterX size={16} className="mr-1.5"/> Clear
                </button>
            )}
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAddForm) closeAndResetForm(); 
              }}
              disabled={isLoading}
              className={`flex items-center font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out text-sm disabled:opacity-50
                ${showAddForm 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}
              `}
            >
              {showAddForm ? <XCircle className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
              {showAddForm ? 'Cancel' : 'Add New Commission'}
            </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCommission} className="mb-8 p-6 border border-blue-200 rounded-lg bg-blue-50 shadow-md">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Create New Commission Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            <div>
              <label htmlFor="newClientName" className="block text-sm font-medium text-blue-700 mb-1">Client Name</label>
              <input type="text" id="newClientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className={commonInputClass} disabled={isLoading} required />
            </div>
            <div>
              <label htmlFor="newTaskDueDatetime" className="block text-sm font-medium text-blue-700 mb-1">Task Due Date & Time</label>
              <input type="datetime-local" id="newTaskDueDatetime" value={newTaskDueDatetime} onChange={(e) => setNewTaskDueDatetime(e.target.value)} className={commonInputClass} disabled={isLoading} required />
            </div>
            <div>
              <label htmlFor="newPrice" className="block text-sm font-medium text-blue-700 mb-1">Price (₱)</label>
              <input type="number" id="newPrice" value={newPrice} onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} className={commonInputClass} disabled={isLoading} step="0.01" min="0" required />
            </div>
            <div>
              <label htmlFor="newTaskStatus" className="block text-sm font-medium text-blue-700 mb-1">Task Status</label>
              <select id="newTaskStatus" value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value as SalesEntry['task_status'])} className={commonSelectClass} disabled={isLoading}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="newPaymentStatus" className="block text-sm font-medium text-blue-700 mb-1">Payment Status</label>
              <select id="newPaymentStatus" value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value as SalesEntry['payment_status'])} className={commonSelectClass} disabled={isLoading}>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label htmlFor="newPaidAmount" className="block text-sm font-medium text-blue-700 mb-1">Paid Amount (₱)</label>
              <input type="number" id="newPaidAmount" value={newPaidAmount} onChange={(e) => setNewPaidAmount(e.target.value === '' ? '' : Number(e.target.value))} className={commonInputClass} disabled={isLoading} step="0.01" min="0" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
             <button 
              type="button" 
              onClick={resetForm} 
              disabled={isLoading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out text-sm disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline-block" />
              Reset Form
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2 inline-block"/>
              Save Commission Entry
            </button>
          </div>
        </form>
      )}
      
      <div className="overflow-x-auto flex-grow rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="sticky top-0 z-10">
            <tr>
              {tableHeaders.map(header => (
                <th 
                    key={header.key}
                    className={`${commonThClass} ${header.key === 'client_name' ? 'rounded-tl-lg' : ''}`}
                    onClick={() => header.sortable && requestSort(header.key)}
                >
                    {header.label}
                    {header.sortable && getSortIcon(header.key)}
                </th>
              ))}
              <th className={`${commonThClass} rounded-tr-lg`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedAndFilteredSalesData.length > 0 ? (
              sortedAndFilteredSalesData.map((entry) => (
                <tr key={entry.id} className="hover:bg-blue-50 transition-colors duration-150 ease-in-out group">
                  {tableHeaders.map(header => {
                      const columnKey = header.key as keyof Omit<SalesEntry, 'id' | 'created_at' | 'updated_at'>;
                      const isEditing = editingCell?.rowId === entry.id && editingCell?.columnKey === columnKey;
                      let cellContent;
                      const currentValueToEdit = editFormData[columnKey] !== undefined ? editFormData[columnKey] : entry[columnKey];

                      if (isEditing) {
                          if (columnKey === 'task_status' || columnKey === 'payment_status') {
                              const options = columnKey === 'task_status' 
                                  ? ['Pending', 'In Progress', 'Completed', 'Cancelled'] 
                                  : ['Unpaid', 'Partially Paid', 'Paid', 'Refunded'];
                              cellContent = (
                                  <select value={currentValueToEdit as string} onChange={(e) => handleEditChange(columnKey, e.target.value)} onBlur={() => handleSaveEdit(entry.id)} autoFocus disabled={isLoading} className={`${commonSelectClass} bg-yellow-50`}>
                                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                              );
                          } else if (columnKey === 'price' || columnKey === 'paid_amount') {
                              cellContent = <input type="number" value={currentValueToEdit as number | ''} onChange={(e) => handleEditChange(columnKey, e.target.value === '' ? '' : Number(e.target.value))} onBlur={() => handleSaveEdit(entry.id)} autoFocus disabled={isLoading} className={`${commonInputClass} bg-yellow-50`} step="0.01" min="0"/>;
                          } else if (columnKey === 'task_due_datetime') {
                               cellContent = <input type="datetime-local" value={currentValueToEdit ? String(currentValueToEdit).substring(0,16) : ''} onChange={(e) => handleEditChange(columnKey, e.target.value)} onBlur={() => handleSaveEdit(entry.id)} autoFocus disabled={isLoading} className={`${commonInputClass} bg-yellow-50`} />;
                          } else { // client_name
                              cellContent = <input type="text" value={currentValueToEdit as string} onChange={(e) => handleEditChange(columnKey, e.target.value)} onBlur={() => handleSaveEdit(entry.id)} autoFocus disabled={isLoading} className={`${commonInputClass} bg-yellow-50`} />;
                          }
                      } else {
                          if (columnKey === 'price' || columnKey === 'paid_amount') {
                              cellContent = `₱${Number(entry[columnKey]).toFixed(2)}`;
                          } else if (columnKey === 'task_status' || columnKey === 'payment_status') {
                              const status = entry[columnKey] as string;
                              let bgColor = 'bg-gray-100'; let textColor = 'text-gray-800';
                              if (columnKey === 'task_status') {
                                  if (status === 'Completed') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; } else if (status === 'In Progress') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; } else if (status === 'Pending') { bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; } else if (status === 'Cancelled') { bgColor = 'bg-red-100'; textColor = 'text-red-800'; }
                              } else if (columnKey === 'payment_status') {
                                  if (status === 'Paid') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; } else if (status === 'Partially Paid') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; } else if (status === 'Unpaid' || status === 'Refunded') { bgColor = 'bg-red-100'; textColor = 'text-red-800'; }
                              }
                              cellContent = <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{status}</span>;
                          } else if (columnKey === 'task_due_datetime') {
                              cellContent = entry[columnKey] ? new Date(entry[columnKey]!).toLocaleString() : 'N/A';
                          } else {
                              cellContent = entry[columnKey];
                          }
                      }
                      return (
                          <td key={columnKey} className={`${commonTdClass} ${isEditing ? 'p-0 align-top' : 'cursor-pointer hover:bg-yellow-100'} relative`} onClick={() => !isEditing && !isLoading && handleEditClick(entry.id, columnKey, entry[columnKey])}>
                             <div className={isEditing ? 'p-1' : ''}>{cellContent}</div>
                             {isEditing && (<button onClick={handleCancelEdit} disabled={isLoading} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-700 z-20 disabled:opacity-50" title="Cancel Edit"><XCircle size={16}/></button>)}
                          </td>
                      );
                  })}
                  <td className={`${commonTdClass} text-center`}>
                     <button 
                        onClick={() => handleDeleteCommission(entry.id, entry.client_name)}
                        disabled={isLoading}
                        className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-50"
                        title="Delete Entry"
                      >
                        <XCircle size={18} />
                      </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length + 1} className="py-10 px-4 text-center text-lg text-gray-400">
                  {isLoading ? 'Loading data...' : (selectedMonth ? 'No commissions found for the selected month.' : 'No commission data yet. Click \'Add New Commission\' to get started.')}
                </td>
              </tr>
            )}
          </tbody>
          {sortedAndFilteredSalesData.length > 0 && (
            <tfoot className="bg-blue-100 border-t-2 border-blue-300 sticky bottom-0 z-10">
                <tr>
                    <th colSpan={2} className="py-3 px-4 text-right text-sm font-semibold text-blue-800">Totals:</th>
                    <td className="py-3 px-4 text-sm font-bold text-blue-800">₱{totalPrice.toFixed(2)}</td>
                    <td colSpan={2}></td> {/* Placeholder for task_status and payment_status columns */}
                    <td className="py-3 px-4 text-sm font-bold text-blue-800">₱{totalPaidAmount.toFixed(2)}</td>
                    <td></td> {/* Placeholder for actions column */}
                </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}; 