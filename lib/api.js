/**
 * Helper for authenticated fetch (client-side)
 */
const authFetch = async (url, options = {}) => {
    // In a real setup, attach the Firebase ID token from the client SDK here.
    // For now, we simulate an auth token using the stored user ID.
    let token = 'unauthenticated';
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('campus_user');
        if (user) {
            token = JSON.parse(user).id;
        }
    }
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
};

/**
 * Central API layer.
 * All data now directly fetches from the backend endpoints.
 */
export const api = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    register: async (data) => authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    // ── User / Profile ────────────────────────────────────────────────────────
    getUser: async () => authFetch('/api/student/profile').then(r => r.profile),
    updateProfile: async (data) => authFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify(data) }),

    // ── Dashboard stats ───────────────────────────────────────────────────────
    getDashboardStats: async () => authFetch('/api/student/stats'),

    // ── Admin ─────────────────────────────────────────────────────────────────
    getAdminStats: async () => authFetch('/api/admin/stats'),
    getUsers: async () => authFetch('/api/admin/users').then(r => r.users),
    addUser: async (userData) => authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
    updateUser: async (id, userData) => authFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
    deleteUser: async (id) => authFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),

    // ── Admin — Schedules ─────────────────────────────────────────────────────
    getAdminSchedules: async () => authFetch('/api/admin/schedules').then(r => r.schedules),
    addSchedule: async (data) => authFetch('/api/admin/schedules', { method: 'POST', body: JSON.stringify(data) }),
    updateSchedule: async (id, data) => authFetch(`/api/admin/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSchedule: async (id) => authFetch(`/api/admin/schedules/${id}`, { method: 'DELETE' }),

    // ── Admin — Documents ─────────────────────────────────────────────────────
    getDocumentRequests: async () => authFetch('/api/admin/documents').then(r => r.documents),
    updateRequestStatus: async (id, status) => authFetch(`/api/admin/documents/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getAcademicWarnings: async () => authFetch('/api/admin/academic-warnings').then(r => r.warnings || []),

    // ── News ──────────────────────────────────────────────────────────────────
    getNews: async () => authFetch('/api/admin/news').then(r => r.news),
    addNews: async (news) => authFetch('/api/admin/news', { method: 'POST', body: JSON.stringify(news) }),
    updateNews: async (id, news) => authFetch(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(news) }),
    deleteNews: async (id) => authFetch(`/api/admin/news/${id}`, { method: 'DELETE' }),

    // ── Chef ──────────────────────────────────────────────────────────────────
    getChefMenu: async () => authFetch('/api/chef/menu').then(r => r.menu),
    addMenuItem: async (item) => authFetch('/api/chef/menu', { method: 'POST', body: JSON.stringify(item) }),
    updateMenuItem: async (id, item) => authFetch(`/api/chef/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    deleteMenuItem: async (id) => authFetch(`/api/chef/menu/${id}`, { method: 'DELETE' }),
    getChefOrders: async () => authFetch('/api/chef/orders').then(r => r.orders),

    // ── Teacher ───────────────────────────────────────────────────────────────
    getTeachers: async () => authFetch('/api/admin/users').then(r => r.users?.filter(u => u.role === 'teacher')),
    addTeacher: async (teacher) => authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ ...teacher, role: 'teacher' }) }),
    updateTeacher: async (id, teacher) => authFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(teacher) }),
    deleteTeacher: async (id) => authFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
    getTeacherAssignments: async () => authFetch('/api/teacher/assignments').then(r => r.assignments),
    getTeacherSchedule: async () => authFetch('/api/teacher/schedules').then(r => r.schedules),
    getTeacherAttendance: async () => authFetch('/api/teacher/attendance').then(r => r.attendance),
    getTeacherGrades: async () => authFetch('/api/teacher/grades').then(r => r.grades),
    addAssignment: async (assignment) => authFetch('/api/teacher/assignments', { method: 'POST', body: JSON.stringify(assignment) }),

    // ── Student ───────────────────────────────────────────────────────────────
    getgrade: async () => authFetch('/api/student/grades').then(r => r.grades),
    getAttendance: async () => authFetch('/api/student/attendance').then(r => r.attendance),
    getStudentOrders: async () => authFetch('/api/student/orders').then(r => r.orders),
    placeOrder: async (data) => authFetch('/api/student/orders', { method: 'POST', body: JSON.stringify(data) }),
    getStudentDocuments: async () => authFetch('/api/student/documents').then(r => r.documents),
    requestDocument: async (data) => authFetch('/api/student/documents', { method: 'POST', body: JSON.stringify(data) }),

    // ── Events ────────────────────────────────────────────────────────────────
    getEvents: async () => authFetch('/api/admin/events').then(r => r.events || []),
    addEvent: async (event) => authFetch('/api/admin/events', { method: 'POST', body: JSON.stringify(event) }),
    updateEvent: async (id, event) => authFetch(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
    deleteEvent: async (id) => authFetch(`/api/admin/events/${id}`, { method: 'DELETE' }),

// ── Common / Shared ───────────────────────────────────────────────────────
    getTopPerformers: async () => authFetch('/api/student/top-performers').then(r => r.topPerformers || []),
    getUpcomingClasses: async () => authFetch('/api/student/upcoming-classes').then(r => r.upcomingClasses || []),
    
    // 👇 ADDED THIS: The Dashboard component needs this exact function name!
    // It maps to your "classmates" endpoint if that is where the course progress data lives.
    getOngoingCourses: async () => authFetch('/api/student/classmates').then(r => r.classmates || r.courses || []),
    
    // Kept your original getClassmates just in case you use it on a different page
    getClassmates: async () => authFetch('/api/student/classmates').then(r => r.classmates || []),
    
    getLearningFormat: async () => authFetch('/api/student/learning-format').then(r => r.format || []),
    getCourses: async () => authFetch('/api/student/courses').then(r => r.courses || []),
    getAssignments: async () => authFetch('/api/student/assignments').then(r => r.assignments || []),
    getSchedule: async () => authFetch('/api/student/schedules').then(r => r.schedules || []),
    getRanking: async () => authFetch('/api/student/ranking').then(r => r.ranking || []),
};
