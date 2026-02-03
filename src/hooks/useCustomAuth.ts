import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, configuracoesApi } from "@/services/api";

interface UserProfile {
  id: string;
  nome_completo: string;
  cpf: string | null;
  email: string;
  whatsapp: string | null;
  email_verificado: boolean;
  ultimo_login: string | null;
  criado_em: string;
  roles?: string[];
  nivel_preferido?: string | null;
  formato_preferido?: string | null;
  perfil_definido?: boolean;
  perfil_definido_em?: string | null;
  evento_associado?: string | null;
}

type UserType = 'organizador_evento' | 'patrocinador_evento' | 'palestrante_influencer' | 
                'participante_evento' | 'usuario_individual' | 'admin';

interface UserSubscription {
  id: string;
  plano: string;
  status: string;
  renovacao_em: string | null;
}

interface AuthUser {
  profile: UserProfile;
  subscription: UserSubscription;
}

interface SignupData {
  nome_completo: string;
  email: string;
  senha: string;
  cpf?: string;
  whatsapp?: string;
}

export function useCustomAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('scribia_user');
      
      if (token && storedUser) {
        try {
          const cachedData = JSON.parse(storedUser);
          setUser(cachedData);
          
          if (cachedData.profile.roles && cachedData.profile.roles.length > 0) {
            setUserType(cachedData.profile.roles[0] as UserType);
          }
        } catch (e) {
          console.error("Erro ao parsear usuário do cache:", e);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('scribia_user');
        }
      }
    } catch (error) {
      console.error("Erro ao verificar usuário armazenado:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { data } = response.data; // API retorna { data: { access_token, user } }

      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        
        const userData = {
          profile: data.user,
          subscription: data.subscription || { plano: 'free', status: 'ativo' }
        };
        
        localStorage.setItem('scribia_user', JSON.stringify(userData));
        setUser(userData);
        
        if (data.user.roles && data.user.roles.length > 0) {
          const role = data.user.roles[0] as UserType;
          setUserType(role);
        }
        
        const needsProfile = !data.user.perfil_definido;
        
        return { 
          success: true, 
          user: userData.profile, 
          subscription: userData.subscription,
          needsProfile 
        };
      } else {
        return { success: false, error: 'Erro no login' };
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { success: false, error: error.response?.data?.message || 'Credenciais inválidas' };
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      const response = await authApi.register(signupData);
      return { 
        success: true,
        message: 'Cadastro realizado com sucesso!',
        ...response.data
      };
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao realizar cadastro' 
      };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('scribia_user');
      setUser(null);
      setUserType(null);
      navigate('/login');
    }
  };

  const setUserRoleAndEvent = (role: UserType, eventoAssociado?: string) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          roles: [role],
          evento_associado: eventoAssociado || null
        }
      };
      setUser(updatedUser);
      setUserType(role);
      localStorage.setItem('scribia_user', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = async (nivelPreferido: string, formatoPreferido: string) => {
    try {
      const response = await configuracoesApi.updatePreferencias({
        nivel_preferido: nivelPreferido,
        formato_preferido: formatoPreferido,
        perfil_definido: true
      });

      if (user) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            nivel_preferido: nivelPreferido,
            formato_preferido: formatoPreferido,
            perfil_definido: true
          }
        };
        setUser(updatedUser);
        localStorage.setItem('scribia_user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  };

  return {
    user,
    userType,
    loading,
    login,
    signup,
    logout,
    setUserRoleAndEvent,
    updateProfile,
  };
}
