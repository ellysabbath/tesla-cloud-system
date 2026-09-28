import React, { useCallback, useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi, enrollmentApi } from '../../api/api';
import type {
  AdminUserRow,
  AdminUserDetail,
  ApiEnrollment,
  PaginationInfo,
} from '../../api/api';

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';

const PAGE_SIZE = 20;

// ============================================================
// Confirm modal state
// ============================================================
interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => Promise<void> | void;
}

// ============================================================
// Edit form state
// ============================================================
interface EditFormState {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  region: string;
  currentCity: string;
  educationalBackground: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  isVerified: boolean;
  isActive: boolean;
}

// ============================================================
// Enrollments modal state
// ============================================================
interface EnrollmentsModalState {
  userId: string;
  userName: string;
}

// ============================================================
// Component
// ============================================================
const Accounts: React.FC = () => {
  // List
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  // Detail modal
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Confirm modal
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Edit modal
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Enrollments modal
  const [enrollModal, setEnrollModal] =
    useState<EnrollmentsModalState | null>(null);
  const [enrollList, setEnrollList] = useState<ApiEnrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const [isActing, setIsActing] = useState(false);

  // ============================================================
  // Load list
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.adminListUsers({
        search: search.trim() || undefined,
        status: statusFilter,
        page,
        page_size: PAGE_SIZE,
      });

      if (res.success && Array.isArray(res.data)) {
        setRows(res.data as AdminUserRow[]);
        setPagination(res.pagination ?? null);
      } else {
        setRows([]);
        setError(res.message || 'Could not load accounts.');
      }
    } catch (err) {
      console.error('Accounts load error:', err);
      setRows([]);
      setError(
        err instanceof Error
          ? `Load failed: ${err.message}`
          : 'Could not reach the server.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ============================================================
  // Flash
  // ============================================================
  const flashMessage = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  // ============================================================
  // Open detail
  // ============================================================
  const openDetail = async (userId: string) => {
    setDetailUser(null);
    setDetailError('');
    setIsLoadingDetail(true);

    try {
      const res = await authApi.adminGetUser(userId);
      if (res.success && res.data) {
        setDetailUser(res.data as AdminUserDetail);
      } else {
        setDetailError(res.message || 'Could not load user.');
      }
    } catch (err) {
      console.error('Detail load error:', err);
      setDetailError(
        err instanceof Error
          ? `Detail failed: ${err.message}`
          : 'Could not reach the server.'
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailUser(null);
    setDetailError('');
  };

  // ============================================================
  // Open enrollments modal
  // ============================================================
  const openEnrollments = async (userId: string, userName: string) => {
    setEnrollModal({ userId, userName });
    setEnrollList([]);
    setEnrollError('');
    setIsLoadingEnrollments(true);

    try {
      const res = await enrollmentApi.adminUserEnrollments(userId);
      if (res.success && Array.isArray(res.data)) {
        setEnrollList(res.data as ApiEnrollment[]);
      } else {
        setEnrollError(res.message || 'Could not load enrollments.');
      }
    } catch (err) {
      console.error('Enrollments load error:', err);
      setEnrollError('Could not reach the server.');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const closeEnrollments = () => {
    setEnrollModal(null);
    setEnrollList([]);
    setEnrollError('');
  };

  // ============================================================
  // Edit modal
  // ============================================================
  const openEditFromRow = async (userId: string) => {
    setIsSavingEdit(true);
    setEditError('');
    try {
      const res = await authApi.adminGetUser(userId);
      if (res.success && res.data) {
        const u = res.data as AdminUserDetail;
        setEditForm({
          userId: u.id,
          fullName: u.fullName ?? '',
          email: u.email ?? '',
          phone: u.phone ?? '',
          countryCode: u.countryCode ?? '+255',
          region: u.region ?? '',
          currentCity: u.currentCity ?? '',
          educationalBackground: u.educationalBackground ?? '',
          role: u.role ?? 'student',
          status: u.status ?? 'active',
          isVerified: u.isVerified,
          isActive: u.isActive,
        });
      } else {
        flashMessage(res.message || 'Could not load user.');
      }
    } catch (err) {
      console.error('Edit load error:', err);
      flashMessage('Could not load user.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openEditFromDetail = () => {
    if (!detailUser) return;
    setEditForm({
      userId: detailUser.id,
      fullName: detailUser.fullName ?? '',
      email: detailUser.email ?? '',
      phone: detailUser.phone ?? '',
      countryCode: detailUser.countryCode ?? '+255',
      region: detailUser.region ?? '',
      currentCity: detailUser.currentCity ?? '',
      educationalBackground: detailUser.educationalBackground ?? '',
      role: detailUser.role ?? 'student',
      status: detailUser.status ?? 'active',
      isVerified: detailUser.isVerified,
      isActive: detailUser.isActive,
    });
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editForm) return;
    setIsSavingEdit(true);
    setEditError('');

    try {
      const res = await authApi.adminUpdateUser(editForm.userId, {
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone,
        countryCode: editForm.countryCode,
        region: editForm.region,
        currentCity: editForm.currentCity,
        educationalBackground: editForm.educationalBackground,
        role: editForm.role,
        status: editForm.status,
        isVerified: editForm.isVerified,
        isActive: editForm.isActive,
      });

      if (res.success) {
        flashMessage(res.message || 'User updated.');
        if (detailUser?.id === editForm.userId && res.data) {
          setDetailUser(res.data as AdminUserDetail);
        }
        await load();
        setEditForm(null);
      } else {
        setEditError(res.message || 'Could not update user.');
      }
    } catch (err) {
      console.error('Save edit error:', err);
      setEditError('Could not reach the server.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ============================================================
  // Suspend / Activate / Delete
  // ============================================================
  const doSuspend = async (userId: string, name: string) => {
    setIsActing(true);
    try {
      const res = await authApi.adminSuspendUser(userId);
      if (res.success) {
        flashMessage(res.message || `${name} suspended.`);
        await load();
        if (detailUser?.id === userId) {
          setDetailUser({ ...detailUser, status: 'suspended', isActive: false });
        }
      } else {
        flashMessage(res.message || 'Could not suspend user.');
      }
    } catch (err) {
      console.error('Suspend error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doActivate = async (userId: string, name: string) => {
    setIsActing(true);
    try {
      const res = await authApi.adminActivateUser(userId);
      if (res.success) {
        flashMessage(res.message || `${name} activated.`);
        await load();
        if (detailUser?.id === userId) {
          setDetailUser({ ...detailUser, status: 'active', isActive: true });
        }
      } else {
        flashMessage(res.message || 'Could not activate user.');
      }
    } catch (err) {
      console.error('Activate error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doDelete = async (userId: string, name: string) => {
    setIsActing(true);
    try {
      const res = await authApi.adminDeleteUser(userId);
      if (res.success) {
        flashMessage(res.message || `${name} deleted.`);
        if (detailUser?.id === userId) closeDetail();
        if (enrollModal?.userId === userId) closeEnrollments();
        await load();
      } else {
        flashMessage(res.message || 'Could not delete user.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const askSuspend = (userId: string, name: string) => {
    setConfirmState({
      title: 'Suspend account',
      message: `${name} will not be able to sign in until you activate the account again. Continue?`,
      confirmLabel: 'Suspend',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => doSuspend(userId, name),
    });
  };

  const askActivate = (userId: string, name: string) => {
    setConfirmState({
      title: 'Activate account',
      message: `${name} will be able to sign in again. Continue?`,
      confirmLabel: 'Activate',
      confirmClass: 'bg-black hover:bg-gray-800',
      onConfirm: () => doActivate(userId, name),
    });
  };

  const askDelete = (userId: string, name: string) => {
    setConfirmState({
      title: 'Delete account',
      message: `Permanently delete ${name}? All their data will be removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => doDelete(userId, name),
    });
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsConfirming(true);
    try {
      await confirmState.onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmState(null);
    }
  };

  // ============================================================
  // Helpers
  // ============================================================
  const statusColors: Record<AdminUserRow['status'], string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  };

  const enrollStatusColors: Record<ApiEnrollment['status'], string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    dropped: 'bg-gray-200 text-gray-700',
  };

  const formatLocation = (a: {
    currentCity: string | null;
    region: string | null;
  }) => {
    const parts = [a.currentCity, a.region].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  const formatDate = (s: string | null | undefined) =>
    s
      ? new Date(s).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  const formatDateTime = (s: string | null | undefined) =>
    s
      ? new Date(s).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const formatBytes = (n: number | null | undefined) => {
    if (!n || n <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
  };

  const formatPrice = (p: string | number) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  const totalPages = pagination?.total_pages ?? 1;
  const total = pagination?.total ?? rows.length;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Accounts</h1>
          <p className="text-gray-600">Manage all registered accounts</p>
        </div>
        <Button disabled>+ Add Account</Button>
      </div>

      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {flash}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Input
              label="Search"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email, or phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-center px-4 py-3">Enrollments</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Loading accounts...
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">
                          {a.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {a.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {a.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                      {a.username}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {formatLocation(a)}
                    </td>

                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(a.joinedAt)}
                    </td>

                    {/* Enrollments — click to view */}
                    <td className="px-4 py-3 text-center">
                      {a.enrollments > 0 ? (
                        <button
                          onClick={() => openEnrollments(a.id, a.fullName)}
                          className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                          title="View enrollments"
                        >
                          {a.enrollments}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDetail(a.id)}
                        className="text-xs font-medium text-blue-600 hover:underline mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditFromRow(a.id)}
                        className="text-xs font-medium text-gray-700 hover:underline mr-3"
                      >
                        Edit
                      </button>

                      {a.status === 'suspended' ? (
                        <button
                          onClick={() => askActivate(a.id, a.fullName)}
                          disabled={isActing}
                          className="text-xs font-medium text-green-600 hover:underline mr-3 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => askSuspend(a.id, a.fullName)}
                          disabled={isActing}
                          className="text-xs font-medium text-orange-600 hover:underline mr-3 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}

                      <button
                        onClick={() => askDelete(a.id, a.fullName)}
                        disabled={isActing}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

              {!isLoading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No accounts match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <span>
              Showing <strong>{rows.length}</strong> of <strong>{total}</strong>{' '}
              account{total !== 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================
          DETAIL MODAL
      ============================================================ */}
      {(isLoadingDetail || detailUser || detailError) && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {detailUser?.fullName ?? 'User detail'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                  {detailUser?.username ?? ''}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingDetail && !detailUser && (
                <div className="p-12 text-center text-gray-400">
                  Loading user...
                </div>
              )}

              {detailError && !detailUser && (
                <div className="p-6 bg-red-50 text-red-700 text-sm">
                  {detailError}
                </div>
              )}

              {detailUser && (
                <>
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                    {detailUser.profilePicture ? (
                      <img
                        src={detailUser.profilePicture}
                        alt={detailUser.fullName}
                        className="w-16 h-16 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                        {detailUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {detailUser.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {detailUser.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[detailUser.status]}`}
                        >
                          {detailUser.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            detailUser.isVerified
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {detailUser.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                          {detailUser.role.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Username', value: detailUser.username },
                      { label: 'Email', value: detailUser.email },
                      {
                        label: 'Mobile Number',
                        value: `${detailUser.countryCode} ${detailUser.phone}`.trim(),
                      },
                      { label: 'Region', value: detailUser.region || '—' },
                      {
                        label: 'Current City',
                        value: detailUser.currentCity || '—',
                      },
                      {
                        label: 'Date of Birth',
                        value: detailUser.dateOfBirth
                          ? `${detailUser.dateOfBirth.day}/${detailUser.dateOfBirth.month}/${detailUser.dateOfBirth.year}`
                          : '—',
                      },
                      { label: 'Gender', value: detailUser.gender || '—' },
                      {
                        label: 'Education',
                        value: detailUser.educationalBackground || '—',
                      },
                      {
                        label: 'Enrollments',
                        value: (
                          <button
                            onClick={() =>
                              openEnrollments(
                                detailUser.id,
                                detailUser.fullName
                              )
                            }
                            className="text-blue-600 hover:underline"
                          >
                            {detailUser.enrollments} course
                            {detailUser.enrollments !== 1 ? 's' : ''} — view
                          </button>
                        ),
                      },
                      { label: 'IP Address', value: detailUser.ipAddress || '—' },
                      { label: 'Device', value: detailUser.deviceName || '—' },
                      {
                        label: 'Joined',
                        value: formatDateTime(detailUser.createdAt),
                      },
                      {
                        label: 'Email Verified',
                        value: formatDateTime(detailUser.emailVerifiedAt),
                      },
                      {
                        label: 'Last Login',
                        value: formatDateTime(detailUser.lastLoginAt),
                      },
                      {
                        label: 'Terms Accepted',
                        value: formatDateTime(detailUser.termsAcceptedAt),
                      },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className="border-b border-gray-100 pb-2 last:border-0"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                          {f.label}
                        </p>
                        <p className="text-sm text-gray-900 break-words">
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {detailUser.registrationVideo?.data && (
                    <div className="px-5 pb-5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                        Registration Recording
                      </p>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-64 shrink-0">
                          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                            <video
                              src={detailUser.registrationVideo.data}
                              autoPlay
                              muted
                              loop
                              playsInline
                              controls
                              controlsList="nodownload"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-red-600/90 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              ID Video
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 text-xs text-gray-600 space-y-1">
                          <p>
                            <strong>Recorded:</strong>{' '}
                            {formatDateTime(
                              detailUser.registrationVideo.createdAt
                            )}
                          </p>
                          <p>
                            <strong>Format:</strong>{' '}
                            {detailUser.registrationVideo.mimeType
                              ?.split('/')[1]
                              ?.toUpperCase() || 'WEBM'}
                          </p>
                          <p>
                            <strong>Size:</strong>{' '}
                            {formatBytes(
                              detailUser.registrationVideo.fileSize
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {detailUser && (
              <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
                <Button
                  variant="secondary"
                  fullWidth
                  size="small"
                  onClick={closeDetail}
                >
                  Close
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  size="small"
                  onClick={openEditFromDetail}
                  disabled={isActing}
                >
                  Edit Profile
                </Button>

                {detailUser.status === 'suspended' ? (
                  <Button
                    fullWidth
                    size="small"
                    onClick={() =>
                      askActivate(detailUser.id, detailUser.fullName)
                    }
                    disabled={isActing}
                  >
                    Activate
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    fullWidth
                    size="small"
                    onClick={() =>
                      askSuspend(detailUser.id, detailUser.fullName)
                    }
                    disabled={isActing}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================
          ENROLLMENTS MODAL
      ============================================================ */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  Enrollments
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {enrollModal.userName}
                </p>
              </div>
              <button
                onClick={closeEnrollments}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingEnrollments && (
                <div className="p-12 text-center text-gray-400">
                  Loading enrollments...
                </div>
              )}

              {enrollError && !isLoadingEnrollments && (
                <div className="p-6 bg-red-50 text-red-700 text-sm">
                  {enrollError}
                </div>
              )}

              {!isLoadingEnrollments &&
                !enrollError &&
                enrollList.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    This user has no enrollments.
                  </div>
                )}

              {!isLoadingEnrollments &&
                !enrollError &&
                enrollList.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {enrollList.map((e) => (
                      <div key={e.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {e.courseTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              {e.courseCategory || 'General'} •{' '}
                              {e.courseDuration || '—'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${enrollStatusColors[e.status]}`}
                          >
                            {e.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">
                              Enrolled
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatDate(e.enrolled_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">
                              Progress
                            </p>
                            <p className="font-medium text-gray-900">
                              {Number(e.progress_pct).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">
                              Price
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatPrice(e.coursePrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="flex px-5 py-3 border-t border-gray-200 bg-white shrink-0">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={closeEnrollments}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================
          EDIT MODAL
      ============================================================ */}
      {editForm && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Edit account
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update the user's details below
                </p>
              </div>
              <button
                onClick={() => setEditForm(null)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
                <Input
                  label="Country Code"
                  name="countryCode"
                  value={editForm.countryCode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, countryCode: e.target.value })
                  }
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
                <Input
                  label="Region"
                  name="region"
                  value={editForm.region}
                  onChange={(e) =>
                    setEditForm({ ...editForm, region: e.target.value })
                  }
                />
                <Input
                  label="Current City"
                  name="currentCity"
                  value={editForm.currentCity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, currentCity: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Educational Background
                </label>
                <textarea
                  value={editForm.educationalBackground}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      educationalBackground: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="student">Student</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as EditFormState['status'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        isVerified: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm text-gray-800">
                    Email verified
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-800">
                    Account is active
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setEditForm(null)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={saveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================
          CONFIRMATION MODAL
      ============================================================ */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmState.message}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setConfirmState(null)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`flex-1 px-4 py-2 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 ${confirmState.confirmClass}`}
              >
                {isConfirming ? 'Working...' : confirmState.confirmLabel}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Accounts;