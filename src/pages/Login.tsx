import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useCustomAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        
        // Redirecionar baseado no role do usuário
        if (result.user?.roles && result.user.roles.length > 0) {
          const userRole = result.user.roles[0];
          
          if (userRole === 'organizador_evento') {
            navigate("/organizador/eventos");
          } else if (result.needsProfile) {
            navigate("/definir-perfil");
          } else {
            navigate("/dashboard");
          }
        } else if (result.needsProfile) {
          navigate("/definir-perfil");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.error || "Erro ao fazer login");
      }
    } catch (error) {
      setError("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Entrar na ScribIA
          </CardTitle>
          <CardDescription className="text-center">
            Digite suas credenciais para acessar sua conta
          </CardDescription>
          <div className="text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              Voltar para Home
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
            <div className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="text-primary hover:underline">
                Cadastre-se
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
