import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ComingSoon } from './components/shared/ComingSoon';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ClientesListPage } from './features/clientes/pages/ClientesListPage';
import { ClienteDetailPage } from './features/clientes/pages/ClienteDetailPage';
import { RecebiveisListPage } from './features/recebiveis/pages/RecebiveisListPage';
import { RecebivelForm } from './features/recebiveis/components/RecebivelForm';
import { EmprestimoDetailPage } from './features/emprestimos/pages/EmprestimoDetailPage';
import { NegociacaoWizardPage } from './features/negociacoes/pages/NegociacaoWizardPage';
import { NegociacaoDetalhePage } from './features/negociacoes/pages/NegociacaoDetalhePage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <ClientesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/novo"
          element={
            <ProtectedRoute>
              <ComingSoon title="Novo cliente" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/:id/editar"
          element={
            <ProtectedRoute>
              <ComingSoon title="Editar cliente" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/:id"
          element={
            <ProtectedRoute>
              <ClienteDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recebiveis"
          element={
            <ProtectedRoute>
              <RecebiveisListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recebiveis/novo"
          element={
            <ProtectedRoute>
              <RecebivelForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emprestimos"
          element={
            <ProtectedRoute>
              <ComingSoon title="Empréstimos" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emprestimos/:id/editar"
          element={
            <ProtectedRoute>
              <ComingSoon title="Editar contrato de empréstimo" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emprestimos/:id"
          element={
            <ProtectedRoute>
              <EmprestimoDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/negociacoes"
          element={
            <ProtectedRoute>
              <ComingSoon title="Negociações" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/negociacoes/novo"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <NegociacaoWizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/negociacoes/:id"
          element={
            <ProtectedRoute>
              <NegociacaoDetalhePage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
