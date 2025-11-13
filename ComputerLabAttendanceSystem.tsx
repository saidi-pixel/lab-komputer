import React, { useState, useEffect } from 'react';
// @ts-ignore - We'll use dynamic import for xlsx
let XLSX: any;

interface Student {
  id: string;
  name: string;
  nis: string;
  kelas: string;
  points: number;
  lastAttendance?: string;
}

interface User {
  email: string;
  password: string;
  name: string;
}

const ComputerLabAttendanceSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState<User | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', name: '', confirmPassword: '' });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('labStudents');
    const savedUser = localStorage.getItem('labUser');
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

  // Save students to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('labStudents', JSON.stringify(students));
  }, [students]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedUsers = JSON.parse(localStorage.getItem('labUsers') || '[]');
    const foundUser = savedUsers.find((u: User) => 
      u.email === loginData.email && u.password === loginData.password
    );
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('labUser', JSON.stringify(foundUser));
      setCurrentView('dashboard');
    } else {
      alert('Email atau password salah');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      alert('Password tidak cocok');
      return;
    }
    
    const savedUsers = JSON.parse(localStorage.getItem('labUsers') || '[]');
    if (savedUsers.some((u: User) => u.email === signupData.email)) {
      alert('Email sudah terdaftar');
      return;
    }
    
    const newUser = {
      email: signupData.email,
      password: signupData.password,
      name: signupData.name
    };
    
    savedUsers.push(newUser);
    localStorage.setItem('labUsers', JSON.stringify(savedUsers));
    setUser(newUser);
    localStorage.setItem('labUser', JSON.stringify(newUser));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('labUser');
    setCurrentView('login');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Dynamically import xlsx library
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const importedStudents: Student[] = jsonData.map((row, index) => ({
          id: `student-${Date.now()}-${index}`,
          name: row.Nama || row.name || '',
          nis: row.NIS || row.nis || '',
          kelas: row.Kelas || row.kelas || '',
          points: 10, // Default points
          lastAttendance: ''
        }));
        
        setStudents(importedStudents);
        alert(`Berhasil mengimpor ${importedStudents.length} siswa`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      alert('Error: Pastikan library xlsx terinstall. Jalankan: npm install xlsx');
    }
  };

  const handleExportExcel = async () => {
    try {
      // Dynamically import xlsx library
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule;
      
      const worksheet = XLSX.utils.json_to_sheet(students.map(student => ({
        Nama: student.name,
        NIS: student.nis,
        Kelas: student.kelas,
        Poin: student.points,
        'Terakhir Absen': student.lastAttendance || 'Belum absen'
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Poin Siswa');
      XLSX.writeFile(workbook, `rekap-poin-siswa-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      alert('Error: Pastikan library xlsx terinstall. Jalankan: npm install xlsx');
    }
  };

  const markAttendance = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, lastAttendance: attendanceDate }
        : student
    ));
  };

  const markAbsence = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { 
            ...student, 
            points: Math.max(0, student.points - 1),
            lastAttendance: attendanceDate
          }
        : student
    ));
  };

  const resetPoints = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua poin siswa?')) {
      setStudents(prev => prev.map(student => ({
        ...student,
        points: 10
      })));
    }
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">MAS Al-Khoir Mananti</h1>
            <p className="text-green-600">Sistem Absensi Lab Komputer</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              Login
            </button>
            
            <p className="text-center text-sm text-green-600">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => setCurrentView('signup')}
                className="text-green-800 font-semibold hover:underline"
              >
                Daftar di sini
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">MAS Al-Khoir Mananti</h1>
            <p className="text-green-600">Daftar Akun Baru</p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={signupData.name}
                onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Email</label>
              <input
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Password</label>
              <input
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              Daftar
            </button>
            
            <p className="text-center text-sm text-green-600">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-green-800 font-semibold hover:underline"
              >
                Login di sini
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">MAS Al-Khoir Mananti</h1>
            <p className="text-green-200">Sistem Absensi Lab Komputer</p>
          </div>
          <div className="flex items-center space-x-4">
            <span>Selamat datang, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Tanggal Absensi</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex gap-2">
              <label className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-green-700 transition duration-200">
                Import Data Siswa
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleExportExcel}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
              >
                Ekspor Rekap
              </button>
              
              <button
                onClick={resetPoints}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-200"
              >
                Reset Poin
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-700 text-white px-6 py-3">
            <h2 className="text-xl font-semibold">Daftar Siswa</h2>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center text-green-600">
              <p>Belum ada data siswa. Silakan import data siswa terlebih dahulu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Poin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Terakhir Absen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">{student.nis}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">{student.kelas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.points >= 8 ? 'bg-green-100 text-green-800' :
                          student.points >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                        {student.lastAttendance || 'Belum absen'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(student.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition duration-200"
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => markAbsence(student.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition duration-200"
                          >
                            Tidak Hadir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2024 MAS Al-Khoir Mananti Sosa Jae - Sistem Absensi Lab Komputer</p>
        </div>
      </footer>
    </div>
  );
};

export default ComputerLabAttendanceSystem;