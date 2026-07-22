import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ClientesListPage } from './features/clientes/pages/ClientesListPage';
import { ClienteDetailPage } from './features/clientes/pages/ClienteDetailPage';
import { ClienteFormPage } from './features/clientes/pages/ClienteFormPage';
import { RecebiveisListPage } from './features/recebiveis/pages/RecebiveisListPage';
import { RecebivelForm } from './features/recebiveis/components/RecebivelForm';
import { RecebiveisDetalhePage } from './features/recebiveis/pages/RecebiveisDetalhePage';
import { EmprestimoDetailPage } from './features/emprestimos/pages/EmprestimoDetailPage';
import { EmprestimosListPage } from './features/emprestimos/pages/EmprestimosListPage';
import { EmprestimosFormPage } from './features/emprestimos/pages/EmprestimosFormPage';
import { NegociacaoWizardPage } from './features/negociacoes/pages/NegociacaoWizardPage';
import { NegociacaoDetalhePage } from './features/negociacoes/pages/NegociacaoDetalhePage';
import { NegociacoesListPage } from './features/negociacoes/pages/NegociacoesListPage';
import { UsuariosListPage } from './features/usuarios/pages/UsuariosListPage';
import { UsuarioFormPage } from './features/usuarios/pages/UsuarioFormPage';
import { UsuarioEditarPage } from './features/usuarios/pages/UsuarioEditarPage';
import { MeuPerfilPage } from './features/perfil/pages/MeuPerfilPage';

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
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <ClienteFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/:id/editar"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <ClienteFormPage />
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
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <RecebivelForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recebiveis/:id"
          element={
            <ProtectedRoute>
              <RecebiveisDetalhePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emprestimos"
          element={
            <ProtectedRoute>
              <EmprestimosListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emprestimos/novo"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <EmprestimosFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emprestimos/:id/editar"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN', 'OPERADOR']}>
              <EmprestimosFormPage />
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
              <NegociacoesListPage />
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

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN']}>
              <UsuariosListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/novo"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN']}>
              <UsuarioFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/:id/editar"
          element={
            <ProtectedRoute allowedPerfis={['ADMIN']}>
              <UsuarioEditarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meu-perfil"
          element={
            <ProtectedRoute>
              <MeuPerfilPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
