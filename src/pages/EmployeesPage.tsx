import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getEmployees, createEmployee, uploadEmployeeDocument } from '../services/employeeService';
import { Employee } from '../types/employee';
import { useAuth } from '../contexts/AuthContext';

export function EmployeesPage() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    emirates_id: '',
    visa_details: '',
    passport_number: '',
    emirates_id_expiry: '',
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [emiratesIdFile, setEmiratesIdFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesData = await getEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'passport' | 'emirates_id') => {
    if (e.target.files && e.target.files[0]) {
      if (fileType === 'passport') {
        setPassportFile(e.target.files[0]);
      } else {
        setEmiratesIdFile(e.target.files[0]);
      }
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const createdEmployee = await createEmployee(newEmployee);
      if (passportFile) {
        await uploadEmployeeDocument(passportFile, createdEmployee.id, 'passport');
      }
      if (emiratesIdFile) {
        await uploadEmployeeDocument(emiratesIdFile, createdEmployee.id, 'emirates_id');
      }
      const employeesData = await getEmployees();
      setEmployees(employeesData);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create employee:', error);
    }
  };

  const canCreateEmployee = profile?.role === 'admin' || profile?.role === 'senior_manager' || profile?.role === 'manager';

  if (isLoading) {
    return <div>Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-1">Manage all employee information.</p>
        </div>
        {canCreateEmployee && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Employee</span>
          </button>
        )}
      </div>

      {/* Employees List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          {employees.map((employee) => (
            <Link to={`/employees/${employee.id}`} key={employee.id} className="block p-4 border rounded-lg hover:bg-slate-50">
              <p className="font-semibold text-slate-800">{employee.name}</p>
              <p className="text-sm text-slate-500">EID: {employee.emirates_id}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Create New Employee</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateEmployee(); }}>
              <div className="space-y-4">
                <input name="name" placeholder="Name" onChange={handleInputChange} className="w-full p-2 border" />
                <input name="emirates_id" placeholder="Emirates ID" onChange={handleInputChange} className="w-full p-2 border" />
                <input name="visa_details" placeholder="Visa Details" onChange={handleInputChange} className="w-full p-2 border" />
                <input name="passport_number" placeholder="Passport Number" onChange={handleInputChange} className="w-full p-2 border" />
                <input name="emirates_id_expiry" type="date" placeholder="Emirates ID Expiry" onChange={handleInputChange} className="w-full p-2 border" />
                <div>
                    <label>Passport Image</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'passport')} className="w-full p-2 border" />
                </div>
                <div>
                    <label>Emirates ID Image</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'emirates_id')} className="w-full p-2 border" />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                <button type="submit">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
